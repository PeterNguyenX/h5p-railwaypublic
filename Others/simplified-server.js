// simplified-server.js - A streamlined version of your server without database dependency
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Basic CORS setup
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Server is running without database dependencies'
  });
});

// Public information endpoint
app.get('/api/public/info', (req, res) => {
  res.json({
    name: 'H5P Interactive Video Platform',
    description: 'Create, edit, and share interactive H5P content',
    version: '1.0.0',
    isPublic: true
  });
});

// Mock projects endpoint that doesn't require database
app.get('/api/projects', (req, res) => {
  res.json([{
    id: 1,
    title: 'Example Project',
    thumbnail_url: '/default-thumbnail.svg',
    created_at: new Date().toISOString()
  }]);
});

// Public projects endpoint - no authentication required
app.get('/api/projects/public', (req, res) => {
  console.log('GET /api/projects/public - Returning public projects');
  res.json([
    {
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
    }
  ]);
});

app.get('/api/projects/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Projects API is running without database'
  });
});

// Simple frontend for testing
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>H5P Interactive Video Platform - Public</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .container { max-inline-size: 800px; margin: 0 auto; }
          .project-card { border: 1px solid #ccc; padding: 20px; margin: 20px 0; border-radius: 5px; }
          h1 { color: #333; }
          .button {
            display: inline-block;
            padding: 8px 16px;
            background-color: #0078d7;
            color: white;
            border-radius: 4px;
            text-decoration: none;
            margin-right: 10px;
            margin-bottom: 10px;
          }
          .public-badge {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            font-size: 0.8rem;
            padding: 2px 8px;
            border-radius: 10px;
            margin-left: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>H5P Interactive Video Platform</h1>
          <p>Welcome to the H5P Interactive Video Platform public interface.</p>
          
          <h2>Public Projects <span class="public-badge">Public</span></h2>
          <div class="project-card">
            <h3>Public Demo Project</h3>
            <p>This is a publicly accessible project</p>
            <p>Created: ${new Date().toISOString()}</p>
            <a href="/api/projects/public" class="button">View All Public Projects</a>
            <a href="/api/public/info" class="button">API Info</a>
          </div>
          
          <div class="project-card">
            <h3>H5P Tutorial</h3>
            <p>Learn how to create H5P content</p>
            <p>Created: ${new Date().toISOString()}</p>
          </div>
          
          <div>
            <p>Server time: ${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    res.redirect('/');
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simplified server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
