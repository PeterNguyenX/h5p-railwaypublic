const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { auth } = require("../middleware/auth");
const h5pService = require("../services/h5pService");
const { Video } = require("../models");
const { Op } = require("sequelize");
const axios = require('axios');
const AdmZip = require('adm-zip');
const { H5PEditor, H5PPlayer, LibraryAdministration } = require('h5p-nodejs-library');
const VideoProcessingService = require('../services/videoProcessing');
const videoProcessor = new VideoProcessingService();

// Get H5P editor interface
router.get("/editor", auth, async (req, res) => {
  try {
    const contentId = req.query.contentId || null;
    const editorData = await h5pService.getEditorData(contentId);
    res.json(editorData);
  } catch (error) {
    console.error("Error getting H5P editor:", error);
    res.status(500).json({ error: "Error getting H5P editor" });
  }
});

// Get available H5P libraries
router.get("/libraries", auth, async (req, res) => {
  try {
    const libraries = await h5pService.getLibraries();
    res.json(libraries);
  } catch (error) {
    console.error("Error getting H5P libraries:", error);
    res.status(500).json({ error: "Error getting H5P libraries" });
  }
});

// Render H5P content
router.get("/content/:contentId", async (req, res) => {
  try {
    const content = await h5pService.renderContent(req.params.contentId);
    res.json(content);
  } catch (error) {
    console.error("Error rendering H5P content:", error);
    res.status(500).json({ error: "Error rendering H5P content" });
  }
});

// Get H5P content for a video
router.get("/video/:videoId/content", auth, async (req, res) => {
  try {
    const contents = await h5pService.getVideoContent(req.params.videoId);
    res.json(contents);
  } catch (error) {
    console.error("Error getting H5P content:", error);
    res.status(500).json({ error: "Error getting H5P content" });
  }
});

// Create time-based H5P content
router.post("/video/:videoId", auth, async (req, res) => {
  try {
    const { contentData, timestamp } = req.body;

    // Verify ownership before creating
    const video = await Video.findOne({ where: { id: req.params.videoId, userId: req.user.id } });
    if (!video) return res.status(404).json({ error: "Video not found" });

    // h5pService.createTimeBasedContent now persists the full content object to the DB
    const content = await h5pService.createTimeBasedContent(contentData, req.params.videoId, timestamp);

    res.json({ message: "H5P content added successfully", content });
  } catch (error) {
    console.error("Error creating H5P content:", error);
    res.status(500).json({ error: error.message || "Error creating H5P content" });
  }
});

// Update H5P content
router.put("/content/:contentId", auth, async (req, res) => {
  try {
    const { contentData, timestamp } = req.body;
    // h5pService.updateContent finds the item in DB and updates library/params/metadata/timestamp
    const content = await h5pService.updateContent(req.params.contentId, contentData, timestamp);
    res.json({ message: "H5P content updated successfully", content });
  } catch (error) {
    console.error("Error updating H5P content:", error);
    res.status(500).json({ error: error.message || "Error updating H5P content" });
  }
});

// Update time-based H5P content (legacy route)
router.put("/:contentId", auth, async (req, res) => {
  try {
    const { contentData, timestamp } = req.body;
    const content = await h5pService.updateTimeBasedContent(
      req.params.contentId,
      contentData,
      req.body.videoId,
      timestamp
    );
    res.json({
      message: "H5P content updated successfully",
      content,
    });
  } catch (error) {
    console.error("Error updating H5P content:", error);
    res.status(500).json({ error: "Error updating H5P content" });
  }
});

// Delete H5P content
router.delete("/content/:contentId", auth, async (req, res) => {
  try {
    await h5pService.deleteContent(req.params.contentId);
    res.json({ message: "H5P content deleted successfully" });
  } catch (error) {
    console.error("Error deleting H5P content:", error);
    res.status(500).json({ error: "Error deleting H5P content" });
  }
});

// Test route to check H5P service status (no auth required)
router.get("/status", async (req, res) => {
  try {
    const status = {
      h5pServiceLoaded: !!h5pService,
      availableLibraries: await h5pService.getLibraries(),
      timestamp: new Date().toISOString(),
    };
    res.json(status);
  } catch (error) {
    console.error("Error checking H5P status:", error);
    res.status(500).json({
      error: "H5P service error",
      details: error.message,
    });
  }
});

// POST /api/h5p/content - unused legacy route (kept for compatibility)
router.post("/content", auth, (req, res) => {
  res.status(410).json({ error: "Use POST /api/h5p/video/:videoId instead" });
});

// GET /api/h5p/content/:id - Load H5P content
router.get("/content/:id", auth, async (req, res) => {
  try {
    const contentId = req.params.id;
    const content = await h5pService.loadContent(contentId);
    res.json(content);
  } catch (err) {
    res.status(404).json({ error: "Content not found" });
  }
});

// GET /api/h5p/libraries/:lib - Serve H5P library files
router.get("/libraries/:lib", (req, res) => {
  const libPath = path.join(__dirname, "../h5p-libraries", req.params.lib);
  if (fs.existsSync(libPath)) {
    res.sendFile(libPath);
  } else {
    res.status(404).send("Library not found");
  }
});

// GET /api/h5p/hub - List available H5P content types from H5P.org
router.get('/hub', async (req, res) => {
  try {
    const response = await axios.get('https://api.h5p.org/v1/content-types');
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch content types from H5P.org' });
  }
});

// POST /api/h5p/library - Download and install a new H5P library
router.post('/library', async (req, res) => {
  try {
    const { machineName, version } = req.body;
    if (!machineName || !version) {
      return res.status(400).json({ error: 'machineName and version are required' });
    }
    // Construct the download URL for the library zip
    const url = `https://api.h5p.org/v1/content-types/${machineName}-${version}.h5p`;
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    if (response.status !== 200) {
      return res.status(404).json({ error: 'Library not found on H5P.org' });
    }
    // Save and extract the zip
    const zip = new AdmZip(response.data);
    zip.extractAllTo(path.join(__dirname, '../h5p-libraries'), true);
    res.json({ success: true, message: 'Library installed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export video with H5P content as .h5p file
router.post("/video/:videoId/export", auth, async (req, res) => {
  try {
    const { Video } = require("../models");
    const video = await Video.findOne({
      where: {
        id: req.params.videoId,
        userId: req.user.id,
      },
    });

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    // Get H5P content for this video
    const h5pContents = await h5pService.getVideoContent(req.params.videoId);

    // Create H5P package
    const h5pPackage = await h5pService.createH5PPackage(video, h5pContents);

    // Generate filename based on original video filename
    let filename = 'video.h5p';
    if (video.filePath) {
      // Extract filename from filePath and replace extension with .h5p
      const path = require('path');
      const originalName = path.basename(video.filePath, path.extname(video.filePath));
      const sanitizedName = originalName.replace(/[^a-zA-Z0-9\-_]/g, '-');
      filename = `${sanitizedName}.h5p`;
    } else if (video.title) {
      // Fallback to title if no filePath
      const sanitizedTitle = video.title.replace(/[^a-zA-Z0-9\-_]/g, '-').substring(0, 50);
      filename = `${sanitizedTitle}.h5p`;
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Send the package
    res.send(h5pPackage);
  } catch (error) {
    console.error("Error exporting H5P package:", error);
    res.status(500).json({ error: "Error exporting H5P package" });
  }
});

// Multer setup for .h5p file uploads
const multer = require('multer');
const h5pStorage = multer.memoryStorage();
const h5pUpload = multer({
  storage: h5pStorage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit for .h5p files
});

// Upload and import .h5p file
router.post("/upload", auth, h5pUpload.single('h5pFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!req.file.originalname.endsWith('.h5p')) {
      return res.status(400).json({ error: 'File must be a .h5p file' });
    }

    try {
      // Extract .h5p file (it's a ZIP)
      const zip = new AdmZip(req.file.buffer);
      
      // Read h5p.json to get content data
      const h5pJsonEntry = zip.getEntry('h5p.json');
      if (!h5pJsonEntry) {
        return res.status(400).json({ error: 'Invalid .h5p file: missing h5p.json' });
      }

      const h5pJson = JSON.parse(zip.readAsText(h5pJsonEntry));
      const contentId = h5pJson.contentId || null;
      
      // Read content.json
      const contentJsonEntry = zip.getEntry('content/content.json');
      if (!contentJsonEntry) {
        return res.status(400).json({ error: 'Invalid .h5p file: missing content/content.json' });
      }

      const contentJson = JSON.parse(zip.readAsText(contentJsonEntry));
      
      // Get the library information
      const library = h5pJson.library || {};
      const libraryString = `${library.name} ${library.majorVersion}.${library.minorVersion}`;
      
      // Create H5P content object
      const { v4: uuidv4 } = require('uuid');
      const h5pContent = {
        id: contentId || uuidv4(),
        title: h5pJson.title || 'Imported H5P Content',
        library: libraryString,
        params: contentJson,
        metadata: h5pJson.metadata || {},
        timestamp: req.body.timestamp ? parseInt(req.body.timestamp) : 0
      };

      let targetVideo = null;

      if (req.body.videoId) {
        targetVideo = await Video.findOne({
          where: { id: req.body.videoId, userId: req.user.id }
        });
        if (!targetVideo) {
          return res.status(404).json({ error: 'Video not found' });
        }
      } else {
        // No videoId — create a video record, extracting video source from H5P content if possible
        const baseTitle = h5pJson.title || req.file.originalname.replace(/\.h5p$/i, '') || 'Imported H5P';
        let finalTitle = baseTitle;
        let counter = 1;
        while (await Video.findOne({ where: { userId: req.user.id, title: finalTitle } })) {
          finalTitle = `${baseTitle} ${counter++}`;
        }

        // Try to extract YouTube URL from Interactive Video content.json
        let youtubeId = null;
        let youtubeUrl = null;
        let extractedFilePath = null;
        try {
          const videoFiles = contentJson?.interactiveVideo?.video?.files || [];
          for (const vf of videoFiles) {
            const src = vf.path || '';
            if (src.includes('youtube.com') || src.includes('youtu.be')) {
              const ytMatch = src.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
              if (ytMatch) { youtubeId = ytMatch[1]; youtubeUrl = src; break; }
            }
          }
        } catch (_) {}

        // If no YouTube source, try to extract a bundled video file from the zip
        if (!youtubeId) {
          try {
            const videoEntry = zip.getEntries().find(e =>
              e.entryName.startsWith('content/videos/') &&
              /\.(mp4|webm|mov|avi|mkv)$/i.test(e.entryName)
            );
            if (videoEntry) {
              const importsDir = path.join(__dirname, '..', 'uploads', 'h5p_imports');
              fs.mkdirSync(importsDir, { recursive: true });
              const savedName = `${Date.now()}_${path.basename(videoEntry.entryName)}`;
              fs.writeFileSync(path.join(importsDir, savedName), videoEntry.getData());
              extractedFilePath = `uploads/h5p_imports/${savedName}`;
            }
          } catch (_) {}
        }

        targetVideo = await Video.create({
          title: finalTitle,
          status: extractedFilePath ? 'processing' : 'ready',
          thumbnailPath: '/default-thumbnail.svg',
          youtubeId: youtubeId || null,
          youtubeUrl: youtubeUrl || null,
          filePath: extractedFilePath || null,
          userId: req.user.id
        });

        // Generate thumbnail in the background for extracted video files
        if (extractedFilePath) {
          const fullVideoPath = path.join(__dirname, '..', extractedFilePath);
          const thumbDir = path.join(__dirname, '..', 'uploads', 'h5p_imports');
          const thumbName = `${path.basename(extractedFilePath, path.extname(extractedFilePath))}_thumb.jpg`;
          const thumbPath = path.join(thumbDir, thumbName);
          videoProcessor.generateThumbnail(fullVideoPath, thumbPath)
            .then(() => targetVideo.update({
              status: 'ready',
              thumbnailPath: `uploads/h5p_imports/${thumbName}`
            }))
            .catch(() => targetVideo.update({ status: 'ready' }));
        }
      }

      // Store interactions: parse individual interactions from IV content.json,
      // falling back to a single item for non-IV content types.
      const h5pContentArray = targetVideo.h5pContent || [];
      const ivInteractions = contentJson?.interactiveVideo?.assets?.interactions || [];
      if (ivInteractions.length > 0) {
        for (const interaction of ivInteractions) {
          h5pContentArray.push({
            id: interaction.action?.subContentId || uuidv4(),
            title: interaction.label || interaction.action?.metadata?.title || 'Interaction',
            library: interaction.action?.library || libraryString,
            params: interaction.action?.params || {},
            metadata: interaction.action?.metadata || {},
            timestamp: interaction.duration?.from || 0,
          });
        }
      } else {
        h5pContentArray.push({
          id: h5pContent.id,
          title: h5pContent.title,
          library: h5pContent.library,
          params: h5pContent.params,
          metadata: h5pContent.metadata,
          timestamp: h5pContent.timestamp,
          type: libraryString,
        });
      }
      await targetVideo.update({ h5pContent: h5pContentArray });

      const videoJson = targetVideo.toJSON();

      res.json({
        message: 'H5P file imported successfully',
        content: h5pContent,
        video: {
          ...videoJson,
          thumbnailPath: videoJson.thumbnailPath || '/default-thumbnail.svg',
          duration: videoJson.duration ? String(videoJson.duration) : '0:00'
        }
      });
    } catch (parseError) {
      console.error('Error parsing .h5p file:', parseError);
      res.status(400).json({ error: 'Error parsing .h5p file: ' + parseError.message });
    }
  } catch (error) {
    console.error('Error uploading H5P file:', error);
    res.status(500).json({ error: 'Error uploading H5P file: ' + error.message });
  }
});

module.exports = router;
