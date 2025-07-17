// Minimal server.js for testing Fly.io deployment
const express = require('express');
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Minimal server is running'
  });
});

// Projects API mock endpoint
app.get('/api/projects', (req, res) => {
  console.log('GET /api/projects - Returning mock data');
  res.json([]);
});

app.get('/api/projects/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Projects API is up and running (mock)'
  });
});

// Serve static files for frontend if they exist
app.use(express.static('public/frontend'));

// Catch-all route for SPA frontend
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>H5P Interactive Video - Maintenance</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>H5P Interactive Video Platform</h1>
            <p>The system is currently in maintenance mode.</p>
            <p>Basic API services are available, but the full interface is temporarily disabled.</p>
            <p>Please check back soon.</p>
            <p><small>Server time: ${new Date().toISOString()}</small></p>
          </div>
        </body>
      </html>
    `);
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Minimal server running on port ${PORT}`);
});
