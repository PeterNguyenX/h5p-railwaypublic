const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const h5pService = require("../services/h5pService");
const { Video } = require("../models");

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
router.get("/video/:videoId", auth, async (req, res) => {
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
        userId: req.user.id
      }
    });

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    const h5pContent = video.h5pContent || [];
    h5pContent.push({
      contentId: content.id,
      timestamp,
      type: contentData.library
    });

    await video.update({ h5pContent });

    res.json({ 
      message: "H5P content added successfully",
      content
    });
  } catch (error) {
    console.error("Error creating H5P content:", error);
    res.status(500).json({ error: "Error creating H5P content" });
  }
});

// Update time-based H5P content
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
      content
    });
  } catch (error) {
    console.error("Error updating H5P content:", error);
    res.status(500).json({ error: "Error updating H5P content" });
  }
});

// Delete H5P content
router.delete("/:contentId", auth, async (req, res) => {
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
      timestamp: new Date().toISOString()
    };
    res.json(status);
  } catch (error) {
    console.error("Error checking H5P status:", error);
    res.status(500).json({ 
      error: "H5P service error",
      details: error.message 
    });
  }
});

module.exports = router;
