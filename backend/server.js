require('dotenv').config();
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
const h5pService = require("./services/h5pService");
const thumbnailFallbackMiddleware = require("./middleware/thumbnailFallback");

dotenv.config();
const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8888',
  'http://103.88.123.117'
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

// Health check endpoint for deployment
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
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
  // Serve React build files
  app.use(express.static(path.join(__dirname, 'public/frontend')));
  
  // Handle React routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(__dirname, 'public/frontend/index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
}

app.use('/h5p/libraries', express.static(path.join(__dirname, 'h5p-libraries')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
