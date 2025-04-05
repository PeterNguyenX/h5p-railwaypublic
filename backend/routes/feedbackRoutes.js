const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { Feedback } = require("../models");

// Get all feedback (admin only)
router.get("/", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Only admins can view all feedback" });
    }

    const feedbacks = await Feedback.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ error: "Error fetching feedback" });
  }
});

// Get feedback by status (admin only)
router.get("/status/:status", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Only admins can view feedback by status" });
    }

    const feedbacks = await Feedback.findAll({
      where: { status: req.params.status },
      order: [['createdAt', 'DESC']]
    });
    res.json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedback by status:", error);
    res.status(500).json({ error: "Error fetching feedback by status" });
  }
});

// Get user's own feedback
router.get("/my", auth, async (req, res) => {
  try {
    const feedbacks = await Feedback.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(feedbacks);
  } catch (error) {
    console.error("Error fetching user feedback:", error);
    res.status(500).json({ error: "Error fetching user feedback" });
  }
});

// Get a single feedback
router.get("/:id", auth, async (req, res) => {
  try {
    const feedback = await Feedback.findOne({
      where: { id: req.params.id }
    });

    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    // Check if user is admin or the owner of the feedback
    if (req.user.role !== 'admin' && feedback.userId !== req.user.id) {
      return res.status(403).json({ error: "You don't have permission to view this feedback" });
    }

    res.json(feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ error: "Error fetching feedback" });
  }
});

// Create a new feedback
router.post("/", auth, async (req, res) => {
  try {
    const { title, content, category, priority, language } = req.body;

    const feedback = await Feedback.create({
      title,
      content,
      category,
      priority,
      language,
      userId: req.user.id
    });

    res.status(201).json({ 
      message: "Feedback submitted successfully",
      feedback
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ error: "Error submitting feedback" });
  }
});

// Update feedback status (admin only)
router.put("/:id/status", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Only admins can update feedback status" });
    }

    const feedback = await Feedback.findOne({
      where: { id: req.params.id }
    });

    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    const { status } = req.body;
    await feedback.update({ status });

    res.json({ 
      message: "Feedback status updated successfully",
      feedback
    });
  } catch (error) {
    console.error("Error updating feedback status:", error);
    res.status(500).json({ error: "Error updating feedback status" });
  }
});

// Delete feedback (admin or owner only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const feedback = await Feedback.findOne({
      where: { id: req.params.id }
    });

    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    // Check if user is admin or the owner of the feedback
    if (req.user.role !== 'admin' && feedback.userId !== req.user.id) {
      return res.status(403).json({ error: "You don't have permission to delete this feedback" });
    }

    await feedback.destroy();
    res.json({ message: "Feedback deleted successfully" });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({ error: "Error deleting feedback" });
  }
});

module.exports = router; 