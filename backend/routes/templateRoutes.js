const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { Template } = require("../models");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Configure multer for template thumbnail upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, '../uploads/templates');
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

// Get all public templates
router.get("/", async (req, res) => {
  try {
    const templates = await Template.findAll({
      where: { isPublic: true },
      order: [['createdAt', 'DESC']]
    });
    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Error fetching templates" });
  }
});

// Get templates by category
router.get("/category/:category", async (req, res) => {
  try {
    const templates = await Template.findAll({
      where: { 
        category: req.params.category,
        isPublic: true
      },
      order: [['createdAt', 'DESC']]
    });
    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates by category:", error);
    res.status(500).json({ error: "Error fetching templates by category" });
  }
});

// Get a single template
router.get("/:id", async (req, res) => {
  try {
    const template = await Template.findOne({
      where: { id: req.params.id }
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).json({ error: "Error fetching template" });
  }
});

// Create a new template (admin only)
router.post("/", auth, upload.single("thumbnail"), async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Only admins can create templates" });
    }

    const { name, description, h5pContent, category, language, isPublic } = req.body;
    const thumbnailPath = req.file ? path.relative(__dirname, '..', req.file.path) : null;

    const template = await Template.create({
      name,
      description,
      thumbnailPath,
      h5pContent: JSON.parse(h5pContent),
      category,
      language,
      isPublic: isPublic === 'true'
    });

    res.status(201).json({ 
      message: "Template created successfully",
      template
    });
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({ error: "Error creating template" });
  }
});

// Update a template (admin only)
router.put("/:id", auth, upload.single("thumbnail"), async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Only admins can update templates" });
    }

    const template = await Template.findOne({
      where: { id: req.params.id }
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    const { name, description, h5pContent, category, language, isPublic } = req.body;
    const thumbnailPath = req.file ? path.relative(__dirname, '..', req.file.path) : template.thumbnailPath;

    await template.update({
      name,
      description,
      thumbnailPath,
      h5pContent: h5pContent ? JSON.parse(h5pContent) : template.h5pContent,
      category,
      language,
      isPublic: isPublic ? isPublic === 'true' : template.isPublic
    });

    res.json({ 
      message: "Template updated successfully",
      template
    });
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({ error: "Error updating template" });
  }
});

// Delete a template (admin only)
router.delete("/:id", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Only admins can delete templates" });
    }

    const template = await Template.findOne({
      where: { id: req.params.id }
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    await template.destroy();
    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({ error: "Error deleting template" });
  }
});

module.exports = router; 