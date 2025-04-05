const express = require("express");
const router = express.Router();
const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
const { auth } = require("../middleware/auth");
const { Video } = require("../models");
const User = require("../models/User");
const path = require("path");
const fs = require("fs");
const VideoProcessingService = require("../services/videoProcessing");
const ytdl = require('ytdl-core');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3({ region: "us-east-1" });

// Initialize video processing service
const videoProcessor = new VideoProcessingService();

// Configure multer for video upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
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

    const { title, description, language } = req.body;
    const videoPath = req.file.path;
    const thumbnailPath = path.join(path.dirname(videoPath), `thumbnail-${Date.now()}.jpg`);

    // Create video record in database
    const video = await Video.create({
      title: title || req.file.originalname,
      description: description || '',
      filePath: path.relative(__dirname, '..', videoPath),
      thumbnailPath: path.relative(__dirname, '..', thumbnailPath),
      userId: req.user.id,
      status: 'processing',
      language: language || 'en'
    });

    // Start video processing in the background
    videoProcessor.generateThumbnail(videoPath, thumbnailPath)
      .then(async () => {
        const duration = await videoProcessor.getVideoDuration(videoPath);
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

    // Delete video file if it exists
    if (video.filePath) {
      const filePath = path.join(__dirname, '..', video.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete thumbnail if it exists
    if (video.thumbnailPath) {
      const thumbnailPath = path.join(__dirname, '..', video.thumbnailPath);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
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

    const { 
      title, 
      description, 
      status, 
      trimStart, 
      trimEnd, 
      captions,
      language
    } = req.body;
    
    await video.update({ 
      title, 
      description, 
      status,
      trimStart,
      trimEnd,
      captions,
      language
    });
    
    res.json({ 
      message: "Video updated successfully",
      video: mapVideoData(video)
    });
  } catch (error) {
    console.error("Error updating video:", error);
    res.status(500).json({ error: "Error updating video" });
  }
});

// Import video from YouTube
router.post("/youtube", auth, async (req, res) => {
  try {
    const { url, title, description, language } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'YouTube URL is required' });
    }

    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ message: 'Invalid YouTube URL' });
    }

    // Get video info
    const info = await ytdl.getInfo(url);
    const videoTitle = title || info.videoDetails.title;
    const videoDescription = description || info.videoDetails.description;
    const thumbnailUrl = info.videoDetails.thumbnails[0].url;
    const duration = parseInt(info.videoDetails.lengthSeconds);
    const youtubeId = info.videoDetails.videoId;
    
    // Create video record
    const video = await Video.create({
      title: videoTitle,
      description: videoDescription,
      youtubeUrl: url,
      youtubeId: youtubeId,
      thumbnailPath: thumbnailUrl,
      duration: duration,
      userId: req.user.id,
      status: 'ready',
      language: language || 'en'
    });

    res.status(201).json({ 
      message: "YouTube video imported successfully",
      video: mapVideoData(video)
    });
  } catch (error) {
    console.error("YouTube import error:", error);
    res.status(500).json({ error: "Error importing YouTube video" });
  }
});

// Generate LTI link for a video
router.post("/:id/lti", auth, async (req, res) => {
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

    // Generate a unique LTI link
    const ltiId = uuidv4();
    const ltiLink = `${process.env.APP_URL}/lti/${ltiId}`;
    
    await video.update({ ltiLink });
    
    res.json({ 
      message: "LTI link generated successfully",
      ltiLink
    });
  } catch (error) {
    console.error("Error generating LTI link:", error);
    res.status(500).json({ error: "Error generating LTI link" });
  }
});

// Apply H5P template to a video
router.post("/:id/template/:templateId", auth, async (req, res) => {
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

    const { Template } = require("../models");
    const template = await Template.findOne({
      where: { id: req.params.templateId }
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Apply template to video
    await video.update({ 
      templateId: template.id,
      h5pContent: template.h5pContent
    });
    
    res.json({ 
      message: "Template applied successfully",
      video: mapVideoData(video)
    });
  } catch (error) {
    console.error("Error applying template:", error);
    res.status(500).json({ error: "Error applying template" });
  }
});

// Trim video
router.post("/:id/trim", auth, async (req, res) => {
  try {
    const { startTime, endTime } = req.body;
    const video = await Video.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    const outputPath = path.join('uploads', `trimmed-${Date.now()}.mp4`);
    await videoProcessor.trimVideo(video.filePath, outputPath, startTime, endTime);

    // Update video record
    await video.update({ 
      filePath: outputPath,
      duration: endTime - startTime
    });

    res.json({ 
      message: "Video trimmed successfully",
      video: mapVideoData(video)
    });
  } catch (error) {
    console.error("Error trimming video:", error);
    res.status(500).json({ error: "Error trimming video" });
  }
});

// Add H5P content to video
router.post("/:id/h5p", auth, async (req, res) => {
  try {
    const { h5pContent } = req.body;
    const video = await Video.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    await video.update({ h5pContent });

    res.json({ 
      message: "H5P content added successfully",
      video: mapVideoData(video)
    });
  } catch (error) {
    console.error("Error adding H5P content:", error);
    res.status(500).json({ error: "Error adding H5P content" });
  }
});

// Stream video endpoint
router.get('/:id/stream', auth, async (req, res) => {
  try {
    const video = await Video.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const videoPath = path.join(__dirname, '..', video.filePath);
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming video:', error);
    res.status(500).json({ message: 'Error streaming video' });
  }
});

module.exports = router;
