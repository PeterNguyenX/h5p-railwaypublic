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
    const content = await h5pService.createTimeBasedContent(
      contentData,
      req.params.videoId,
      timestamp
    );

    // Update video with H5P content reference
    const video = await Video.findOne({
      where: {
        id: req.params.videoId,
        userId: req.user.id,
      },
    });

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    const h5pContent = video.h5pContent || [];
    h5pContent.push({
      contentId: content.id,
      timestamp,
      type: contentData.library,
    });

    await video.update({ h5pContent });

    res.json({
      message: "H5P content added successfully",
      content,
    });
  } catch (error) {
    console.error("Error creating H5P content:", error);
    res.status(500).json({ error: "Error creating H5P content" });
  }
});

// Update H5P content
router.put("/content/:contentId", auth, async (req, res) => {
  try {
    const { contentData, timestamp } = req.body;
    const contentId = req.params.contentId;
    
    // Update the H5P content
    const content = await h5pService.updateContent(contentId, contentData);
    
    // Update the timestamp in the video's H5P content array
    const video = await Video.findOne({
      where: {
        h5pContent: {
          [Op.or]: [
            { [Op.like]: `%"contentId":"${contentId}"%` },
            { [Op.like]: `%"contentId":${contentId}%` }
          ]
        }
      }
    });

    if (video) {
      let h5pContent = Array.isArray(video.h5pContent) ? video.h5pContent : [];
      
      // Find and update the timestamp for this content
      const contentIndex = h5pContent.findIndex(item => 
        item.contentId === contentId || item.contentId === parseInt(contentId)
      );
      
      if (contentIndex !== -1) {
        h5pContent[contentIndex].timestamp = timestamp;
        await video.update({ h5pContent });
      }
    }

    res.json({
      message: "H5P content updated successfully",
      content,
    });
  } catch (error) {
    console.error("Error updating H5P content:", error);
    res.status(500).json({ error: "Error updating H5P content" });
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

// POST /api/h5p/content - Save new H5P content
router.post("/content", auth, async (req, res) => {
  try {
    const { projectId, h5pData } = req.body;
    // Save H5P content using h5p-nodejs-library
    const contentId = await h5p.saveOrUpdateContent(h5pData, projectId);
    res.json({ contentId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

module.exports = router;
