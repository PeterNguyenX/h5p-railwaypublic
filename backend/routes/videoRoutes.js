const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const { z } = require('zod');
const { auth } = require("../middleware/auth");
const { validate, validateParams } = require('../middleware/validate');
const {
  idParamSchema,
  updateVideoSchema,
  youtubeImportSchema,
} = require('../validation/schemas');
const { Video } = require("../models");
const VideoProcessingService = require("../services/videoProcessing");
const { fetchYoutubeTranscriptSegments } = require('../services/transcriptExtraction');
const ytdl = require('ytdl-core');
const { v4: uuidv4 } = require('uuid');
const { H5PContent } = require("../models");

// Initialize video processing service
const videoProcessor = new VideoProcessingService();

function createFinishingScoreReviewInteraction(duration = 0) {
  const safeDuration = Math.max(0, Math.floor(Number(duration) || 0));
  return {
    id: 'system_finishing_score_review',
    library: 'H5P.FinishingScoreReview 1.0',
    params: {
      title: 'Score review',
      passThreshold: 75,
      redoMessage: 'Your score is below 75%. Please redo the whole video.',
      passMessage: 'Great work. You can continue.'
    },
    metadata: {
      title: 'Score Review',
      license: 'U',
      systemInteraction: true,
      systemType: 'finishing-score-review',
      hiddenFromAuthoring: true
    },
    timestamp: Math.max(0, safeDuration > 0 ? safeDuration - 1 : 0),
    status: 'active'
  };
}

function upsertFinishingScoreReview(h5pContent, duration = 0) {
  const content = Array.isArray(h5pContent) ? h5pContent.filter(Boolean) : [];
  const review = createFinishingScoreReviewInteraction(duration);
  const idx = content.findIndex(item => item?.metadata?.systemType === 'finishing-score-review');
  if (idx === -1) return [...content, review];

  content[idx] = {
    ...content[idx],
    library: content[idx].library || review.library,
    params: { ...review.params, ...(content[idx].params || {}) },
    metadata: { ...review.metadata, ...(content[idx].metadata || {}) },
    timestamp: review.timestamp,
    status: content[idx].status || 'active'
  };
  return content;
}

// Configure multer for video upload
const sanitize = (name) => name.replace(/[^a-zA-Z0-9-_\.]/g, '_');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, '../uploads/videos');
    fs.mkdir(uploadsDir, { recursive: true })
      .then(() => cb(null, uploadsDir))
      .catch(err => cb(err));
  },
  filename: function (req, file, cb) {
    try {
      const baseName = req.body.title ? sanitize(req.body.title) : path.parse(file.originalname).name;
      const ext = path.extname(file.originalname);
      // Always append timestamp so filenames are globally unique across accounts and re-uploads
      const finalName = `${baseName}_${Date.now()}${ext}`;
      return cb(null, finalName);
    } catch (err) {
      return cb(err);
    }
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024 // 5GB limit
  }
});

const videoTemplateParamsSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid(),
});

const trimVideoSchema = z.object({
  startTime: z.number().nonnegative(),
  endTime: z.number().nonnegative(),
}).refine((data) => data.endTime > data.startTime, {
  message: 'endTime must be greater than startTime',
  path: ['endTime'],
});

const h5pBodySchema = z.object({
  h5pContent: z.unknown(),
});

const extractYouTubeVideoId = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  const trimmed = rawUrl.trim();
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id && id.length === 11 ? id : null;
    }

    if (!host.endsWith('youtube.com') && !host.endsWith('youtube-nocookie.com')) {
      return null;
    }

    const fromQuery = parsed.searchParams.get('v');
    if (fromQuery && fromQuery.length === 11) {
      return fromQuery;
    }

    const parts = parsed.pathname.split('/').filter(Boolean);
    const markerIndex = parts.findIndex((part) => ['embed', 'v', 'shorts', 'live'].includes(part));
    if (markerIndex >= 0 && parts[markerIndex + 1] && parts[markerIndex + 1].length === 11) {
      return parts[markerIndex + 1];
    }

    return null;
  } catch {
    return null;
  }
};

const normalizeYouTubeUrl = (rawUrl) => {
  const trimmed = (rawUrl || '').trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

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
    // Convert relative path to API accessible path (skip absolute URLs like YouTube thumbnails)
    if (!thumbnailPath.startsWith('http://') && !thumbnailPath.startsWith('https://') &&
        !thumbnailPath.startsWith('/api/') && !thumbnailPath.startsWith('/')) {
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

    // Generate a system title if none provided (user can edit it later)
    let systemTitle = title && title.trim() ? title.trim() : `Video_${Date.now()}`;

    // Auto-increment title if it already exists — single query instead of N+1 loop
    {
      const { Op: OpTitle } = require('sequelize');
      const baseTitle = systemTitle;
      const existing = await Video.findAll({
        attributes: ['title'],
        where: { userId: req.user.id, title: { [OpTitle.like]: `${baseTitle}%` } },
      });
      const usedTitles = new Set(existing.map(v => v.title));
      let counter = 1;
      while (usedTitles.has(systemTitle)) { systemTitle = `${baseTitle} ${counter}`; counter++; }
    }

    // Create video record in database with auto-generated ID
    const video = await Video.create({
      title: systemTitle,
      description: description || '',
      filePath: path.relative(process.cwd(), videoPath),
      userId: req.user.id,
      status: 'processing',
      language: language || 'en',
      h5pContent: upsertFinishingScoreReview([], 0)
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
          hlsPath,
          h5pContent: upsertFinishingScoreReview(video.h5pContent, duration)
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
router.post("/youtube", auth, validate(youtubeImportSchema), async (req, res) => {
  let youtubeUrl = '';
  let title = '';
  let description = '';

  try {
    ({ title, description, youtubeUrl } = req.body);
    const { language } = req.body;
    youtubeUrl = normalizeYouTubeUrl(youtubeUrl);

    // Extract video ID from URL
    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    try {
      // Get basic video info first
      const basicInfo = await ytdl.getBasicInfo(youtubeUrl);
      let extractedCaptions = null;

      // Try to extract captions
      const transcriptData = await fetchYoutubeTranscriptSegments(youtubeUrl);
      if (transcriptData.segments.length > 0) {
        extractedCaptions = {
          source: 'youtube',
          languageCode: transcriptData.languageCode,
          segments: transcriptData.segments,
        };
        console.log(`✅ Imported ${transcriptData.segments.length} caption segments from YouTube`);
      } else {
        console.warn('⚠️  YouTube video has no captions available');
      }
      
      let finalTitle = title || basicInfo.videoDetails.title;
      {
        const { Op: OpTitle } = require('sequelize');
        const baseTitle = finalTitle;
        const existing = await Video.findAll({
          attributes: ['title'],
          where: { userId: req.user.id, title: { [OpTitle.like]: `${baseTitle}%` } },
        });
        const usedTitles = new Set(existing.map(v => v.title));
        let counter = 1;
        while (usedTitles.has(finalTitle)) { finalTitle = `${baseTitle} ${counter}`; counter++; }
      }

      // Create video record with basic info
      const video = await Video.create({
        title: finalTitle,
        description: description || basicInfo.videoDetails.description || '',
        youtubeUrl,
        youtubeId: videoId,
        thumbnailPath: basicInfo.videoDetails.thumbnails[0]?.url || '/default-thumbnail.svg',
        duration: parseInt(basicInfo.videoDetails.lengthSeconds) || 0,
        captions: extractedCaptions,
        userId: req.user.id,
        status: 'ready',
        language: language || 'en',
        h5pContent: upsertFinishingScoreReview([], parseInt(basicInfo.videoDetails.lengthSeconds) || 0)
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
        message: extractedCaptions ? "YouTube video imported with captions" : "YouTube video imported (no captions available)",
        video: mapVideoData(video)
      });
    } catch (ytdlError) {
      console.error("YouTube info extraction error:", {
        message: ytdlError.message,
        code: ytdlError.code,
        youtubeUrl
      });
      
      let finalTitle = title || 'YouTube Video';
      {
        const { Op: OpTitle } = require('sequelize');
        const baseTitle = finalTitle;
        const existing = await Video.findAll({
          attributes: ['title'],
          where: { userId: req.user.id, title: { [OpTitle.like]: `${baseTitle}%` } },
        });
        const usedTitles = new Set(existing.map(v => v.title));
        let counter = 1;
        while (usedTitles.has(finalTitle)) { finalTitle = `${baseTitle} ${counter}`; counter++; }
      }

      // Fallback: Create video with minimal info if ytdl fails
      const video = await Video.create({
        title: finalTitle,
        description: description || '',
        youtubeUrl,
        youtubeId: videoId,
        thumbnailPath: `https://img.youtube.com/vi/${videoId}/0.jpg`,
        userId: req.user.id,
        status: 'ready',
        language: language || 'en',
        h5pContent: upsertFinishingScoreReview([], 0)
      });

      console.log("⚠️ Created video with fallback info (ytdl failed)");
      res.status(201).json({
        message: "YouTube video imported with basic info (captions could not be retrieved)",
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

// Move video to trash
router.put("/:id/trash", auth, validateParams(idParamSchema), async (req, res) => {
  try {
    const video = await Video.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!video) return res.status(404).json({ error: "Video not found" });
    await video.update({ trashedAt: new Date() });
    res.json({ message: "Video moved to trash", trashedAt: video.trashedAt });
  } catch (error) {
    res.status(500).json({ error: "Failed to trash video" });
  }
});

// Restore video from trash
router.put("/:id/restore", auth, validateParams(idParamSchema), async (req, res) => {
  try {
    const video = await Video.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!video) return res.status(404).json({ error: "Video not found" });
    await video.update({ trashedAt: null });
    res.json({ message: "Video restored" });
  } catch (error) {
    res.status(500).json({ error: "Failed to restore video" });
  }
});

// Get a single video
router.get("/:id", auth, validateParams(idParamSchema), async (req, res) => {
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

    // Touch updatedAt so "last opened" time is reflected in the dashboard.
    // Sequelize ignores updatedAt in update(), so use a raw query.
    await video.sequelize.query(
      'UPDATE `Videos` SET `updatedAt` = ? WHERE `id` = ?',
      { replacements: [new Date().toISOString(), video.id], type: video.sequelize.QueryTypes.UPDATE }
    );

    res.json(mapVideoData(video));
  } catch (error) {
    console.error("Error fetching video:", error);
    res.status(500).json({ error: "Error fetching video" });
  }
});

// Delete a video
router.delete("/:id", auth, validateParams(idParamSchema), async (req, res) => {
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

    // Delete all H5P content associated with this video
    try {
      await H5PContent.destroy({
        where: { videoId: req.params.id },
        force: true
      });
      console.log('H5P content deleted for video:', req.params.id);
    } catch (error) {
      console.error('Error deleting H5P content:', error);
      // Continue with video deletion even if H5P deletion fails
    }

    // Hard delete from database - force: true ensures hard delete even if paranoid is enabled
    await video.destroy({ force: true });
    
    // Verify deletion - check both hard and soft deleted records
    const verifyDelete = await Video.findOne({
      where: { id: req.params.id },
      paranoid: false,  // Include soft-deleted records in check
      logging: false
    });
    
    if (verifyDelete) {
      console.error("WARNING: Video still exists after deletion:", req.params.id);
      return res.status(500).json({ error: "Failed to delete video from database" });
    }
    
    res.json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ error: "Error deleting video" });
  }
});

// Update a video
router.put("/:id", auth, validateParams(idParamSchema), validate(updateVideoSchema), async (req, res) => {
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
    
    // Check uniqueness for rename
    if (title && title.trim() !== video.title) {
      const existingVideo = await Video.findOne({
        where: { userId: req.user.id, title: title.trim() }
      });
      if (existingVideo && existingVideo.id !== video.id) {
        return res.status(409).json({ error: "A video with this name already exists for your account. Please choose a different title." });
      }
    }
    
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
router.post("/:id/lti", auth, validateParams(idParamSchema), async (req, res) => {
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
router.post("/:id/template/:templateId", auth, validateParams(videoTemplateParamsSchema), async (req, res) => {
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
router.post("/:id/trim", auth, validateParams(idParamSchema), validate(trimVideoSchema), async (req, res) => {
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
router.post("/:id/h5p", auth, validateParams(idParamSchema), validate(h5pBodySchema), async (req, res) => {
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
router.get('/:id/stream', auth, validateParams(idParamSchema), async (req, res) => {
  try {
    const video = await Video.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const uploadsRoot = path.resolve(path.join(__dirname, '..', 'uploads'));
    const videoPath = path.resolve(path.join(__dirname, '..', video.filePath));
    if (!videoPath.startsWith(uploadsRoot + path.sep)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const stat = await fs.stat(videoPath);
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

// GET /api/videos/:id/progress — fetch saved interaction scores for this user+video
router.get('/:id/progress', auth, validateParams(idParamSchema), async (req, res) => {
  try {
    const { VideoProgress } = require('../models');
    const rows = await VideoProgress.findAll({
      where: { userId: req.user.id, videoId: req.params.id },
      attributes: ['interactionId', 'score', 'answeredAt'],
    });
    res.json(rows.map(r => ({ interactionId: r.interactionId, score: r.score, answeredAt: r.answeredAt })));
  } catch (err) {
    console.error('Error fetching progress:', err);
    res.status(500).json({ error: 'Error fetching progress' });
  }
});

// PUT /api/videos/:id/progress — upsert score for one interaction
router.put('/:id/progress', auth, validateParams(idParamSchema), async (req, res) => {
  try {
    const { interactionId, score } = req.body;
    if (!interactionId || score === undefined || score === null) {
      return res.status(400).json({ error: 'interactionId and score are required' });
    }
    const { VideoProgress } = require('../models');
    const clampedScore = Math.max(0, Math.min(1, Number(score)));
    const existing = await VideoProgress.findOne({
      where: { userId: req.user.id, videoId: req.params.id, interactionId },
    });
    if (existing) {
      await existing.update({ score: clampedScore, answeredAt: new Date() });
    } else {
      await VideoProgress.create({
        userId: req.user.id,
        videoId: req.params.id,
        interactionId,
        score: clampedScore,
        answeredAt: new Date(),
      });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving progress:', err);
    res.status(500).json({ error: 'Error saving progress' });
  }
});

// PUT /api/videos/:id/score-review — update passThreshold for the ScoreReview interaction
router.put('/:id/score-review', auth, validateParams(idParamSchema), async (req, res) => {
  try {
    const { passThreshold } = req.body;
    if (passThreshold === undefined) return res.status(400).json({ error: 'passThreshold required' });
    const video = await Video.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!video) return res.status(404).json({ error: 'Video not found' });
    const content = Array.isArray(video.h5pContent) ? [...video.h5pContent] : [];
    const idx = content.findIndex(c => c?.metadata?.systemType === 'finishing-score-review');
    if (idx === -1) return res.status(404).json({ error: 'ScoreReview not found' });
    content[idx] = {
      ...content[idx],
      params: { ...content[idx].params, passThreshold: Math.max(0, Math.min(100, Number(passThreshold))) },
    };
    await video.update({ h5pContent: content });
    res.json({ success: true, passThreshold: content[idx].params.passThreshold });
  } catch (err) {
    console.error('Error updating score review:', err);
    res.status(500).json({ error: 'Error updating score review' });
  }
});

module.exports = router;
