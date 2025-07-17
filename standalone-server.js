// standalone-server.js - A completely independent server without external dependencies
const express = require("express");
const cors = require("cors");

const app = express();

// Basic CORS setup
app.use(cors());
app.use(express.json());

// Health check endpoint that Fly.io will use to verify the app is running
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Standalone server is running'
  });
});

// Root endpoint with minimal HTML
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>H5P Platform - Public</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .container { max-width: 800px; margin: 0 auto; }
          h1 { color: #333; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>H5P Interactive Video Platform</h1>
          <p>Welcome to the public interface.</p>
          <p>Server time: ${new Date().toISOString()}</p>
          <p><a href="/api/health">Check API Health</a></p>
        </div>
      </body>
    </html>
  `);
});

// Simple public projects API endpoint
app.get('/api/projects/public', (req, res) => {
  res.json([
    {
      id: 1,
      title: 'Public Demo Project',
      description: 'This is a publicly accessible project',
      created_at: new Date().toISOString()
    }
  ]);
});

// Catch-all route for API endpoints that don't exist
app.get('/api/*', (req, res) => {
  res.json({ 
    message: 'API endpoint exists but may not be implemented in this simplified version',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Port configuration - Fly.io will set the PORT environment variable
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Standalone server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
