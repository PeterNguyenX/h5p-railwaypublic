require('dotenv').config();
console.log('🚀 Starting H5P Interactive Video Platform...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', process.env.PORT || 3001);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const H5PExpress = require('@lumieducation/h5p-express');
const authRoutes = require("./routes/authRoutes");
const videoRoutes = require("./routes/videoRoutes");
const h5pRoutes = require("./routes/h5pRoutes");
const templateRoutes = require("./routes/templateRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const ltiRoutes = require("./routes/ltiRoutes");
const wordpressRoutes = require("./routes/wordpressRoutes");
const projectsRoutes = require("./routes/projects");
const h5pService = require("./services/h5pService");
const thumbnailFallbackMiddleware = require("./middleware/thumbnailFallback");
const sequelize = require('./config/database');

dotenv.config();
const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8888',
  'http://103.88.123.117',
  /\.railway\.app$/,  // Allow all Railway.app subdomains
  /\.up\.railway\.app$/  // Allow Railway preview deployments
];

// Enable CORS for development and production
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Initialize H5P service
async function initializeH5P() {
  try {
    await h5pService.initialize();
    
    // Add H5P express middleware
    const h5pEditor = h5pService.getH5PEditor();
    const h5pPlayer = h5pService.getH5PPlayer();
    
    if (h5pEditor && h5pPlayer) {
      // Serve H5P core files
      app.use('/api/h5p/core', express.static(path.join(__dirname, 'node_modules/@lumieducation/h5p-server/build/assets')));
      app.use('/api/h5p/editor', express.static(path.join(__dirname, 'node_modules/@lumieducation/h5p-server/build/assets')));
      
      // H5P editor and player routes will be handled by our custom routes
      console.log('H5P middleware initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize H5P:', error);
    console.log('Continuing with mock H5P service');
  }
}

// Initialize H5P on startup
initializeH5P();

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from public directory (for default assets)
app.use('/api', express.static(path.join(__dirname, 'public')));

// Custom thumbnail handler with fallback
app.get('/api/uploads/**/thumbnail.jpg', (req, res) => {
  const requestedPath = req.path.replace('/api/uploads/', '');
  const thumbnailPath = path.join(__dirname, 'uploads', requestedPath);
  
  // Check if thumbnail exists
  fs.access(thumbnailPath, fs.constants.F_OK, (err) => {
    if (err) {
      // File doesn't exist, serve default thumbnail
      console.log(`Thumbnail not found: ${thumbnailPath}, serving default`);
      const defaultThumbnailPath = path.join(__dirname, 'public/default-thumbnail.svg');
      res.setHeader('Content-Type', 'image/svg+xml');
      res.sendFile(defaultThumbnailPath);
    } else {
      // File exists, serve it
      res.setHeader('Content-Type', 'image/jpeg');
      res.sendFile(thumbnailPath);
    }
  });
});

// Apply thumbnail fallback middleware before serving uploads
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.m3u8')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    }
    if (filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'video/mp2t');
    }
  }
}));

// Basic health check endpoint (no database dependency)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001,
    hasDatabase: !!process.env.DATABASE_URL,
    hasJWT: !!process.env.JWT_SECRET,
    hasSession: !!process.env.SESSION_SECRET
  });
});

// Simple root health check for Railway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'H5P Platform is running' });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'H5P Interactive Video Platform API',
    status: 'running',
    health: '/api/health'
  });
});

// Public information endpoint (no authentication required)
app.get('/api/public/info', (req, res) => {
  res.json({
    name: 'H5P Interactive Video Platform',
    description: 'Create, edit, and share interactive H5P content',
    version: '1.0.0',
    public_access: true
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/h5p", h5pRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/lti", ltiRoutes);
app.use("/api/wordpress", wordpressRoutes);
app.use("/api/projects", projectsRoutes);

// Video streaming endpoint
app.get("/video/:videoPath", (req, res) => {
  const range = req.headers.range;
  if (!range) {
    res.status(400).send("Requires Range header");
    return;
  }

  const videoPath = path.join(__dirname, "uploads/videos", req.params.videoPath);
  let videoSize;
  try {
    videoSize = fs.statSync(videoPath).size;
  } catch {
    res.status(404).send("Video not found");
    return;
  }

  const chunkSize = 1 * 1e6; // 1MB chunks
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + chunkSize, videoSize - 1);
  const contentLength = end - start + 1;
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };

  res.writeHead(206, headers);
  const stream = fs.createReadStream(videoPath, { start, end });
  stream.pipe(res);
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  console.log('Serving frontend in production mode');
  // Serve React build files
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Handle React routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      console.log(`Serving frontend for path: ${req.path}`);
      res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
} else {
  console.log('Development mode: not serving frontend');
}

app.use('/h5p/libraries', express.static(path.join(__dirname, 'h5p-libraries')));

// Remove 'browsing-topics' from Permissions-Policy header
app.use((req, res, next) => {
  res.removeHeader('Permissions-Policy');
  next();
});

// Add global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Server error', 
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message 
  });
});

// Add a catch-all route for API routes not found
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found', path: req.path });
});

// Test database connection before starting server
async function testDatabaseConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
}

// Start the server after testing database connection
const PORT = process.env.PORT || 3001;

console.log('🔧 Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'NOT SET');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'set' : 'NOT SET');
console.log('- SESSION_SECRET:', process.env.SESSION_SECRET ? 'set' : 'NOT SET');

testDatabaseConnection().then(dbConnected => {
  // Always start the server even if DB connection fails (for resilience in production)
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🗄️ Database connection: ${dbConnected ? 'SUCCESS' : 'FAILED'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔗 Projects health: http://localhost:${PORT}/api/projects/health`);
    
    if (!dbConnected && process.env.NODE_ENV === 'production') {
      console.warn('⚠️ WARNING: Server started with database connection issues!');
      console.warn('API endpoints requiring database access may fail.');
    }
  }).on('error', (err) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
}).catch(err => {
  console.error('❌ Fatal error during startup:', err);
  process.exit(1);
});
