// Project routes: CRUD for projects
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Project = require('../models/Project');

// Public route for health check (no auth required, no database dependency)
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Projects API is up and running',
    service: 'h5p-interactive-video-platform'
  });
});

// Public route for viewing published projects (no auth required)
router.get('/public', async (req, res) => {
  try {
    console.log('GET /api/projects/public - Returning public projects');
    // For now, return mock data for public projects
    res.json([{
      id: 1,
      title: 'Public Demo Project',
      thumbnail_url: '/default-thumbnail.svg',
      description: 'This is a publicly accessible project',
      created_at: new Date().toISOString(),
      isPublic: true
    },
    {
      id: 2,
      title: 'H5P Tutorial',
      thumbnail_url: '/default-thumbnail.svg',
      description: 'Learn how to create H5P content',
      created_at: new Date().toISOString(),
      isPublic: true
    }]);
    
    /* To be implemented later with database:
    const publicProjects = await Project.findAll({ where: { isPublic: true } });
    res.json(publicProjects || []);
    */
  } catch (error) {
    console.error('Error fetching public projects:', error);
    res.status(500).json({ error: 'Failed to fetch public projects', details: error.message });
  }
});

// GET all projects for user
router.get('/', auth, async (req, res) => {
  try {
    // For initial testing, return a simple empty array with example project
    console.log('GET /api/projects - Returning mock data');
    res.json([{
      id: 1,
      title: 'Example Project',
      thumbnail_url: '/default-thumbnail.svg',
      created_at: new Date().toISOString()
    }]);
    
    /* Commented out for initial testing
    const projects = await Project.findAll({ where: { user_id: req.user.id } });
    res.json(projects || []);
    */
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects', details: error.message });
  }
});

// POST create new project
router.post('/', auth, async (req, res) => {
  try {
    const { title, thumbnail_url } = req.body;
    const project = await Project.create({ user_id: req.user.id, title, thumbnail_url });
    res.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project', details: error.message });
  }
});

// GET project by id
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!project) return res.status(404).json({ error: 'Not found' });
    res.json(project);
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    res.status(500).json({ error: 'Failed to fetch project', details: error.message });
  }
});

// PUT update project
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, thumbnail_url } = req.body;
    const [updated] = await Project.update({ title, thumbnail_url }, { where: { id: req.params.id, user_id: req.user.id } });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project', details: error.message });
  }
});

// DELETE project
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Project.destroy({ where: { id: req.params.id, user_id: req.user.id } });
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project', details: error.message });
  }
});

module.exports = router;
