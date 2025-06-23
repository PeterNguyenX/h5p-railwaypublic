// Project routes: CRUD for projects
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Project = require('../models/Project');

// GET all projects for user
router.get('/', auth, async (req, res) => {
  const projects = await Project.findAll({ where: { user_id: req.user.id } });
  res.json(projects);
});

// POST create new project
router.post('/', auth, async (req, res) => {
  const { title, thumbnail_url } = req.body;
  const project = await Project.create({ user_id: req.user.id, title, thumbnail_url });
  res.json(project);
});

// GET project by id
router.get('/:id', auth, async (req, res) => {
  const project = await Project.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!project) return res.status(404).json({ error: 'Not found' });
  res.json(project);
});

// PUT update project
router.put('/:id', auth, async (req, res) => {
  const { title, thumbnail_url } = req.body;
  const [updated] = await Project.update({ title, thumbnail_url }, { where: { id: req.params.id, user_id: req.user.id } });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// DELETE project
router.delete('/:id', auth, async (req, res) => {
  const deleted = await Project.destroy({ where: { id: req.params.id, user_id: req.user.id } });
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
