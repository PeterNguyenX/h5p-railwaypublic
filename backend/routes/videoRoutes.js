const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const { auth } = require("../middleware/auth");
const { Video } = require("../models");
const VideoProcessingService = require("../services/videoProcessing");
const ytdl = require('ytdl-core');
const { v4: uuidv4 } = require('uuid');

// Initialize video processing service
const videoProcessor = new VideoProcessingService();

// Configure multer for video upload
const sanitize = (name) => name.replace(/[^a-zA-Z0-9-_\.]/g, '_');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, '../uploads/videos');
    fs.mkdir(uploadsDir, { recursive: true })
      .then(() => cb(null, uploadsDir))
      .catch(err => cb(err));
  },
  filename: async function (req, file, cb) {
    try {
      let baseName = req.body.title ? sanitize(req.body.title) : path.parse(file.originalname).name;
      let ext = path.extname(file.originalname);
      let finalName = `${baseName}${ext}`;
      const uploadsDir = path.join(__dirname, '../uploads/videos');
      const filePath = path.join(uploadsDir, finalName);
      try {
        await fs.access(filePath);
        // File exists
        return cb(new Error('A video with this name already exists. Please choose a different title.'));
      } catch {
        // File does not exist, safe to use
        return cb(null, finalName);
      }
    } catch (err) {
      return cb(err);
    }
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// Helper function to format duration
const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Helper function to map video data
const mapVideoData = (video) => {
  let thumbnailPath = video.thumbnailPath;
  
  // Ensure we always have a valid thumbnail path
  if (!thumbnailPath || thumbnailPath === '') {
    thumbnailPath = '/default-thumbnail.svg';
  } else if (thumbnailPath === '/default-thumbnail.svg') {
    // Already set to default, keep as is
    thumbnailPath = '/default-thumbnail.svg';
  } else {
    // Convert relative path to API accessible path
    if (!thumbnailPath.startsWith('/api/') && !thumbnailPath.startsWith('/')) {
      thumbnailPath = `/uploads/${thumbnailPath.replace(/^uploads\//, '')}`;
    }
  }
  
  return {
    ...video.toJSON(),
    thumbnailPath,
    duration: formatDuration(video.duration)
  };
};

// Video upload route
router.post("/upload", auth, upload.single("video"), async (req, res) => {
  try {
    console.log("[UPLOAD] Incoming upload request");
    if (!req.file) {
      console.error("[UPLOAD] No video file uploaded");
      return res.status(400).json({ error: "No video file uploaded" });
    }
    console.log(`[UPLOAD] File received: ${req.file.originalname} -> ${req.file.path}`);

    const { title, description, language } = req.body;
    const videoPath = req.file.path;

    // Check if file exists after upload
    try {
      await fs.access(videoPath);
      console.log(`[UPLOAD] File saved at: ${videoPath}`);
    } catch (err) {
      console.error(`[UPLOAD] File not found after upload: ${videoPath}`);
    }

    // Create video record in database
    const video = await Video.create({
      title: title || req.file.originalname,
      description: description || '',
      filePath: path.relative(process.cwd(), videoPath),
      userId: req.user.id,
      status: 'processing',
      language: language || 'en'
    });

    // Process video in the background
    videoProcessor.processVideo(videoPath, path.join(__dirname, '../uploads/hls'))
      .then(async ({ thumbnailPath, hlsPath, compressedPath }) => {
        const duration = await videoProcessor.getVideoDuration(videoPath);
        
        // Get file sizes for logging
        const originalSize = await videoProcessor.getFileSize(videoPath);
        const compressedSize = await videoProcessor.getFileSize(path.join(__dirname, '..', compressedPath));
        
        console.log(`[UPLOAD] Video processing complete:`);
        console.log(`  - Original size: ${originalSize} MB`);
        console.log(`  - Compressed size: ${compressedSize} MB`);
        console.log(`  - Compression ratio: ${((compressedSize/originalSize) * 100).toFixed(1)}%`);
        console.log(`  - Thumbnail path: ${thumbnailPath}`);
        
        // Verify thumbnail exists before updating database
        let finalThumbnailPath = thumbnailPath;
        try {
          const fullThumbnailPath = path.join(__dirname, '..', thumbnailPath);
          await fs.access(fullThumbnailPath);
          console.log(`[UPLOAD] Thumbnail verified: ${fullThumbnailPath}`);
        } catch (error) {
          console.error(`[UPLOAD] Thumbnail not found, using default: ${thumbnailPath}`);
          finalThumbnailPath = '/default-thumbnail.svg';
        }
        
        await video.update({ 
          status: 'ready',
          duration,
          thumbnailPath: finalThumbnailPath,
          hlsPath
        });
        
        // Optionally clean up original file to save space (uncomment if desired)
        // await videoProcessor.cleanupOriginalFile(videoPath);
        
        console.log(`[UPLOAD] Video processing complete for: ${videoPath}`);
      })
      .catch(async (error) => {
        console.error('[UPLOAD] Error processing video:', error);
        await video.update({ 
          status: 'error',
          thumbnailPath: '/default-thumbnail.svg' // Ensure we always have a thumbnail
        });
      });

    res.status(201).json({ 
      message: "Video uploaded successfully",
      video: mapVideoData(video)
    });
  } catch (error) {
    // If Multer duplicate error, send user-friendly message
    if (error.message && error.message.includes('already exists')) {
      console.error("[UPLOAD] Duplicate filename error");
      return res.status(409).json({ error: error.message });
    }
    console.error("[UPLOAD] Video upload error:", error);
    res.status(500).json({ error: "Error uploading video" });
  }
});

// YouTube video import route
router.post("/youtube", auth, async (req, res) => {
  try {
    const { title, description, youtubeUrl, language } = req.body;

    // Extract video ID from URL
    const videoIdMatch = youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (!videoIdMatch) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }
    const videoId = videoIdMatch[1];

    try {
      // Get basic video info first
      const basicInfo = await ytdl.getBasicInfo(youtubeUrl);
      
      // Create video record with basic info
      const video = await Video.create({
        title: title || basicInfo.videoDetails.title,
        description: description || basicInfo.videoDetails.description || '',
        youtubeUrl,
        youtubeId: videoId,
        thumbnailPath: basicInfo.videoDetails.thumbnails[0]?.url || '/default-thumbnail.svg',
        duration: parseInt(basicInfo.videoDetails.lengthSeconds) || 0,
        userId: req.user.id,
        status: 'ready',
        language: language || 'en'
      });

      console.log("Creating video with thumbnailPath:", basicInfo.videoDetails.thumbnails[0]?.url || '/default-thumbnail.svg');
      console.log("YouTube video details:", {
        title: title || basicInfo.videoDetails.title,
        description: description || basicInfo.videoDetails.description,
        youtubeUrl,
        youtubeId: videoId,
        thumbnailPath: basicInfo.videoDetails.thumbnails[0]?.url || '/default-thumbnail.svg',
      });

      res.status(201).json({
        message: "YouTube video imported successfully",
        video: mapVideoData(video)
      });
    } catch (ytdlError) {
      console.error("YouTube info extraction error:", ytdlError);
      
      // Fallback: Create video with minimal info if ytdl fails
      const video = await Video.create({
        title: title || 'YouTube Video',
        description: description || '',
        youtubeUrl,
        youtubeId: videoId,
        thumbnailPath: `https://img.youtube.com/vi/${videoId}/0.jpg`,
        userId: req.user.id,
        status: 'ready',
        language: language || 'en'
      });

      res.status(201).json({
        message: "YouTube video imported with basic info",
        video: mapVideoData(video)
      });
    }
  } catch (error) {
    console.error("YouTube import error:", {
      message: error.message,
      stack: error.stack,
      youtubeUrl,
      title,
      description,
    });
    res.status(500).json({
      error: "Error importing YouTube video",
      details: error.message,
    });
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

    // Delete video files if they exist
    if (video.filePath) {
      try {
        const filePath = path.resolve(process.cwd(), video.filePath);
        try {
          await fs.access(filePath);
          await fs.unlink(filePath);
        } catch (err) {
          // File doesn't exist, which is fine
          console.log('Video file not found, skipping deletion');
        }
      } catch (error) {
        console.error('Error deleting video file:', error);
        // Continue with deletion even if file deletion fails
      }
    }

    // Delete HLS directory if it exists
    if (video.hlsPath) {
      try {
        const hlsDir = path.dirname(path.resolve(process.cwd(), video.hlsPath));
        try {
          await fs.access(hlsDir);
          await fs.rm(hlsDir, { recursive: true, force: true });
        } catch (err) {
          // Directory doesn't exist, which is fine
          console.log('HLS directory not found, skipping deletion');
        }
      } catch (error) {
        console.error('Error deleting HLS directory:', error);
        // Continue with deletion even if directory deletion fails
      }
    }

    // Delete thumbnail if it exists
    if (video.thumbnailPath && !video.thumbnailPath.startsWith('http')) {
      try {
        const thumbnailPath = path.resolve(process.cwd(), video.thumbnailPath);
        try {
          await fs.access(thumbnailPath);
          await fs.unlink(thumbnailPath);
        } catch (err) {
          // File doesn't exist, which is fine
          console.log('Thumbnail not found, skipping deletion');
        }
      } catch (error) {
        console.error('Error deleting thumbnail:', error);
        // Continue with deletion even if thumbnail deletion fails
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

    res.json(mapVideoData(video));
  } catch (error) {
    console.error("Error updating video:", error);
    res.status(500).json({ error: "Error updating video" });
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
