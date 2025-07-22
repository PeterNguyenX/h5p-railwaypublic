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
  'https://h5p-hoclieutuongtac-production.up.railway.app',
  'https://hoclieutuongtac2.com',
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

// Serve static files from public directory (for default assets like default-thumbnail.svg)
app.use('/api', express.static(path.join(__dirname, 'public')));

// Serve static files from the uploads directory with proper headers
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.m3u8')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    }
    if (filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'video/mp2t');
    }
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    }
    if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    }
  }
}));

// Serve uploads directory directly (for legacy paths)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Enhanced thumbnail fallback middleware for missing thumbnails
app.use('/api/uploads/**/*thumbnail.jpg', (req, res, next) => {
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
      // File exists, continue to static middleware
      next();
    }
  });
});

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
    hasSession: !!process.env.SESSION_SECRET,
    version: '1.0.1' // Added version to force refresh
  });
});

// Simple root health check for Railway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'H5P Platform is running' });
});

// Remove the root route handler - let the React app handle it
// The catch-all handler below will serve the React app for the root route

// Public information endpoint (no authentication required)
app.get('/api/public/info', (req, res) => {
  res.json({
    name: 'H5P Interactive Video Platform',
    description: 'Create, edit, and share interactive H5P content',
    version: '1.0.0',
    public_access: true
  });
});

// Simple test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Test route working", timestamp: new Date().toISOString() });
});

// Temporary video patch endpoint (direct in server.js)
app.post("/api/temp-fix-videos", async (req, res) => {
  try {
    const { secret } = req.body;
    
    if (secret !== 'fix-videos-now-2025') {
      return res.status(403).json({ error: 'Invalid secret' });
    }
    
    console.log('Starting video patch...');
    
    const { Video, User } = require('./models');
    
    // Get all videos with null userId
    const videosWithoutUser = await Video.findAll({
      where: {
        userId: null
      }
    });
    
    console.log(`Found ${videosWithoutUser.length} videos without userId`);
    
    if (videosWithoutUser.length === 0) {
      return res.json({ 
        message: 'No videos to patch', 
        fixed: 0,
        total: 0
      });
    }
    
    // Get the admin user
    const adminUser = await User.findOne({
      where: {
        role: 'admin'
      },
      order: [['createdAt', 'ASC']]
    });
    
    if (!adminUser) {
      return res.status(404).json({ error: 'No admin user found' });
    }
    
    console.log(`Assigning videos to admin user: ${adminUser.username} (${adminUser.id})`);
    
    // Update all videos without userId to belong to admin
    const [updatedCount] = await Video.update(
      { userId: adminUser.id },
      {
        where: {
          userId: null
        }
      }
    );
    
    console.log(`Updated ${updatedCount} videos to belong to admin user`);
    
    res.json({
      message: `Successfully patched ${updatedCount} videos`,
      fixed: updatedCount,
      total: videosWithoutUser.length,
      assignedTo: {
        id: adminUser.id,
        username: adminUser.username
      }
    });
    
  } catch (error) {
    console.error('Error patching videos:', error);
    res.status(500).json({ 
      error: 'Error patching videos',
      details: error.message 
    });
  }
});

// Temporary video patch endpoint via GET (no body parsing needed)
app.get("/api/temp-fix-videos/:secret", async (req, res) => {
  try {
    const { secret } = req.params;
    
    if (secret !== 'fix-videos-now-2025') {
      return res.status(403).json({ error: 'Invalid secret' });
    }
    
    console.log('Starting video patch...');
    
    const { Video, User } = require('./models');
    
    // Get all videos with null userId
    const videosWithoutUser = await Video.findAll({
      where: {
        userId: null
      }
    });
    
    console.log(`Found ${videosWithoutUser.length} videos without userId`);
    
    if (videosWithoutUser.length === 0) {
      return res.json({ 
        message: 'No videos to patch', 
        fixed: 0,
        total: 0
      });
    }
    
    // Get the admin user
    const adminUser = await User.findOne({
      where: {
        role: 'admin'
      },
      order: [['createdAt', 'ASC']]
    });
    
    if (!adminUser) {
      return res.status(404).json({ error: 'No admin user found' });
    }
    
    console.log(`Assigning videos to admin user: ${adminUser.username} (${adminUser.id})`);
    
    // Update all videos without userId to belong to admin
    const [updatedCount] = await Video.update(
      { userId: adminUser.id },
      {
        where: {
          userId: null
        }
      }
    );
    
    console.log(`Updated ${updatedCount} videos to belong to admin user`);
    
    res.json({
      message: `Successfully patched ${updatedCount} videos`,
      fixed: updatedCount,
      total: videosWithoutUser.length,
      assignedTo: {
        id: adminUser.id,
        username: adminUser.username
      }
    });
    
  } catch (error) {
    console.error('Error patching videos:', error);
    res.status(500).json({ 
      error: 'Error patching videos',
      details: error.message 
    });
  }
});

// Temporary simple user endpoint for debugging
app.get("/api/auth/me-simple", async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const jwt = require('jsonwebtoken');
    const { User } = require('./models');
    
    console.log('Token received:', token.substring(0, 50) + '...');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    console.log('JWT decoded:', decoded);
    
    const userId = decoded.userId || decoded.id;
    console.log('Looking for user ID:', userId);
    
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    console.log('User found:', user ? user.username : 'null');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    res.json(user);
    
  } catch (error) {
    console.error('Simple /me error:', error);
    res.status(500).json({ 
      error: 'Authentication error',
      details: error.message 
    });
  }
});

// PUBLIC VIDEO OWNERSHIP FIX - No auth required
app.get('/api/public-fix-videos/:secret', async (req, res) => {
  try {
    const { secret } = req.params;
    
    // Simple security check
    if (secret !== 'fix-videos-2025-railway') {
      return res.status(403).json({ error: 'Invalid access code' });
    }
    
    console.log('🔧 Starting video ownership fix...');
    
    const { Video, User } = require('./models');
    
    // Get all videos with null userId  
    const orphanedVideos = await Video.findAll({
      where: { userId: null }
    });
    
    console.log(`📊 Found ${orphanedVideos.length} orphaned videos`);
    
    if (orphanedVideos.length === 0) {
      return res.json({
        success: true,
        message: 'No orphaned videos found - user context should be working!',
        fixed: 0
      });
    }
    
    // Get admin user to assign videos to
    const adminUser = await User.findOne({
      where: { role: 'admin' },
      order: [['createdAt', 'ASC']]
    });
    
    if (!adminUser) {
      return res.status(404).json({ error: 'No admin user found' });
    }
    
    console.log(`👤 Assigning videos to admin: ${adminUser.username}`);
    
    // Update all orphaned videos to belong to admin
    const [updatedCount] = await Video.update(
      { userId: adminUser.id },
      { where: { userId: null } }
    );
    
    console.log(`✅ Updated ${updatedCount} videos`);
    
    // Verify the fix worked
    const remainingOrphans = await Video.count({
      where: { userId: null }
    });
    
    res.json({
      success: true,
      message: `Successfully fixed ${updatedCount} videos! User context isolation should now work.`,
      details: {
        videosFixed: updatedCount,
        assignedToUser: adminUser.username,
        remainingOrphans: remainingOrphans
      }
    });
    
  } catch (error) {
    console.error('❌ Error fixing video ownership:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix video ownership',
      details: error.message
    });
  }
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/h5p", h5pRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/lti", ltiRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/admin", require('./routes/adminRoutes'));

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

// Serve static files from the React app build
const frontendBuildPath = path.join(__dirname, 'public');
console.log('🎯 Frontend build path:', frontendBuildPath);

// Check if frontend build exists
if (fs.existsSync(frontendBuildPath)) {
  console.log('✅ Frontend build directory found, serving React app');
  
  // Serve static files (CSS, JS, images)
  app.use(express.static(frontendBuildPath));
  
  // Catch all handler: send back React's index.html file for any non-API routes
  app.get('*', (req, res) => {
    // Don't interfere with API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    console.log(`📄 Serving React app for route: ${req.path}`);
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
} else {
  console.log('⚠️ Frontend build directory not found at:', frontendBuildPath);
  console.log('💡 Trying fallback location...');
  
  // Fallback to check ../frontend/build
  const fallbackBuildPath = path.join(__dirname, '../frontend/build');
  if (fs.existsSync(fallbackBuildPath)) {
    console.log('✅ Found frontend build at fallback location:', fallbackBuildPath);
    
    // Serve static files from fallback location
    app.use(express.static(fallbackBuildPath));
    
    // Handle React routing for fallback location
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/')) {
        console.log(`📄 Serving React app from fallback for route: ${req.path}`);
        res.sendFile(path.join(fallbackBuildPath, 'index.html'));
      } else {
        res.status(404).json({ error: 'API endpoint not found' });
      }
    });
  } else {
    console.log('⚠️ No frontend build found at either location');
    console.log('💡 Only API endpoints will be available');
    
    // Fallback for completely missing frontend
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      
      res.json({
        message: 'H5P Interactive Video Platform',
        status: 'API Only - Frontend not found',
        info: 'Frontend build files are missing. Only API endpoints are available.',
        api_docs: '/api/health',
        frontend_expected_at: frontendBuildPath,
        fallback_checked: fallbackBuildPath
      });
    });
  }
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

// Test database connection before starting server
async function testDatabaseConnection() {
  try {
    // Check if we have an invalid database configuration
    if (sequelize._isInvalid) {
      console.log('⚠️ No valid database configuration found');
      console.log('💡 App will start but database features will be disabled');
      console.log('💡 Add PostgreSQL database in Railway Dashboard to enable full functionality');
      return false;
    }
    
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    
    // Auto-initialize database tables if they don't exist
    try {
      await sequelize.sync({ alter: false });
      console.log('✅ Database tables verified/created successfully.');
    } catch (syncError) {
      console.warn('⚠️ Database sync warning:', syncError.message);
      console.log('💡 Database will work but some features may be limited');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    console.log('💡 This is likely because DATABASE_URL is not set');
    console.log('💡 Add PostgreSQL database in Railway Dashboard');
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
