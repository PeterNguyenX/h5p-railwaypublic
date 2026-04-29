// simplified-production-server.js - A version that doesn't require database connection
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Create Express app
const app = express();

// CORS middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Simplified auth middleware that always succeeds
const mockAuth = (req, res, next) => {
  req.user = { id: 1, email: 'demo@example.com' };
  next();
};

// Health check endpoints
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

// Mock projects API
app.get('/api/projects/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Projects API is running'
  });
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

// Regular projects endpoint - normally would require auth but we're using mockAuth
app.get('/api/projects', mockAuth, (req, res) => {
  console.log('GET /api/projects - Returning mock data');
  res.json([
    {
      id: 1,
      title: 'Introduction to H5P',
      thumbnail_url: '/default-thumbnail.svg',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Interactive Video Example',
      thumbnail_url: '/default-thumbnail.svg',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      title: 'Course Presentation Demo',
      thumbnail_url: '/default-thumbnail.svg',
      created_at: new Date().toISOString()
    }
  ]);
});

app.get('/api/projects/:id', mockAuth, (req, res) => {
  res.json({
    id: parseInt(req.params.id),
    title: `Project ${req.params.id}`,
    thumbnail_url: '/default-thumbnail.svg',
    content: { /* mock content */ },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
});

// Serve static files for frontend
app.use(express.static(path.join(__dirname, 'public/frontend')));

// Serve default thumbnail
app.use('/default-thumbnail.svg', (req, res) => {
  res.sendFile(path.join(__dirname, 'backend/public/default-thumbnail.svg'));
});

// Handle React routing - catch-all route for SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found', path: req.path });
  } else {
    // Try to serve the frontend index.html
    const indexPath = path.join(__dirname, 'public/frontend/index.html');
    
    // Check if the file exists
    fs.access(indexPath, fs.constants.F_OK, (err) => {
      if (err) {
        // If index.html doesn't exist, serve a basic HTML page
        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>H5P Interactive Video Platform</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .container { max-width: 800px; margin: 0 auto; }
                .card { border: 1px solid #ccc; padding: 20px; margin: 20px 0; border-radius: 5px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>H5P Interactive Video Platform</h1>
                <p>Welcome to the H5P Interactive Video Platform!</p>
                
                <h2>Sample Projects</h2>
                <div class="card">
                  <h3>Introduction to H5P</h3>
                  <p>Created: ${new Date().toISOString()}</p>
                  <button>Edit</button>
                  <button>Delete</button>
                  <button>Export</button>
                </div>
                
                <div class="card">
                  <h3>Interactive Video Example</h3>
                  <p>Created: ${new Date().toISOString()}</p>
                  <button>Edit</button>
                  <button>Delete</button>
                  <button>Export</button>
                </div>
              </div>
            </body>
          </html>
        `);
      } else {
        // If index.html exists, serve it
        res.sendFile(indexPath);
      }
    });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simplified production server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
