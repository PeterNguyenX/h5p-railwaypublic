const express = require("express");
const router = express.Router();
const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
const { auth } = require("../middleware/auth");
const Video = require("../models/Video");
const User = require("../models/User");
const path = require("path");
const videoProcessingService = require("../services/videoProcessing");

const s3 = new AWS.S3({ region: "us-east-1" });

// Configure multer for video upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Helper function to format duration
const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Helper function to map video data
const mapVideoData = (video) => {
  return {
    ...video.toJSON(),
    thumbnailPath: video.thumbnailPath || '/default-thumbnail.jpg',
    duration: formatDuration(video.duration)
  };
};

// Video upload route
router.post("/upload", auth, upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file uploaded" });
    }

    const { title, description } = req.body;
    const videoPath = req.file.path;
    const thumbnailPath = path.join('uploads', `thumbnail-${Date.now()}.jpg`);

    // Create video record in database
    const video = await Video.create({
      title: title || req.file.originalname,
      description: description || '',
      filePath: videoPath,
      thumbnailPath: thumbnailPath,
      userId: req.user.id,
      status: 'processing'
    });

    // Start video processing in the background
    videoProcessingService.generateThumbnail(videoPath, thumbnailPath)
      .then(async () => {
        const duration = await videoProcessingService.getVideoDuration(videoPath);
        await video.update({ 
          status: 'ready',
          duration: duration
        });
      })
      .catch(async (error) => {
        console.error('Error processing video:', error);
        await video.update({ status: 'error' });
      });

    res.status(201).json({ 
      message: "Video uploaded successfully",
      video: mapVideoData(video)
    });
  } catch (error) {
    console.error("Video upload error:", error);
    res.status(500).json({ error: "Error uploading video" });
  }
});

// Get all videos for the current user
router.get("/", auth, async (req, res) => {
  try {
    const videos = await Video.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(videos.map(mapVideoData));
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ error: "Error fetching videos" });
  }
});

// Get a single video
router.get("/:id", auth, async (req, res) => {
  try {
    const video = await Video.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.json(mapVideoData(video));
  } catch (error) {
    console.error("Error fetching video:", error);
    res.status(500).json({ error: "Error fetching video" });
  }
});

// Delete a video
router.delete("/:id", auth, async (req, res) => {
  try {
    const video = await Video.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    await video.destroy();
    res.json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ error: "Error deleting video" });
  }
});

// Update a video
router.put("/:id", auth, async (req, res) => {
  try {
    const video = await Video.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    const { title, description, status } = req.body;
    await video.update({ title, description, status });
    
    res.json({ 
      message: "Video updated successfully",
      video: mapVideoData(video)
    });
  } catch (error) {
    console.error("Error updating video:", error);
    res.status(500).json({ error: "Error updating video" });
  }
});

module.exports = router;
