// LTI export and serve routes
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const LtiLink = require('../models/LtiLink');
const Project = require('../models/Project');
const { v4: uuidv4 } = require('uuid');

// POST /api/lti/export/:project_id - generate LTI link
router.post('/export/:project_id', auth, async (req, res) => {
  const { project_id } = req.params;
  // Only allow if user owns the project
  const project = await Project.findOne({ where: { id: project_id, user_id: req.user.id } });
  if (!project) return res.status(404).json({ error: 'Not found' });
  const token = uuidv4();
  const ltiLink = await LtiLink.create({ project_id, token });
  res.json({ ltiUrl: `${process.env.BASE_URL || 'http://localhost:3001'}/lti/${token}` });
});

// GET /lti/:token - serve project to LMS
router.get('/:token', async (req, res) => {
  const { token } = req.params;
  const ltiLink = await LtiLink.findOne({ where: { token } });
  if (!ltiLink) return res.status(404).json({ error: 'Invalid LTI link' });
  // TODO: Render H5P player with video for the project
  res.send(`<h1>LTI Launch for Project ${ltiLink.project_id}</h1>`);
});

module.exports = router;
