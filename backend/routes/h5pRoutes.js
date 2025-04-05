const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const h5pService = require("../services/h5pService");
const { Video } = require("../models");

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

module.exports = router;
