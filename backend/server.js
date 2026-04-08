require('dotenv').config();
console.log('🚀 Starting AI-ActivEdu...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', process.env.PORT || 3001);

const express = require("express");
const cors = require("cors");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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
// CHANGE NOTE: Added AI enrichment and transcript routes for AI-powered H5P feature
const transcriptRoutes = require("./routes/transcriptRoutes");
const aiRoutes = require("./routes/aiRoutes");
const h5pService = require("./services/h5pService");
const thumbnailFallbackMiddleware = require("./middleware/thumbnailFallback");
const requestLogger = require('./middleware/requestLogger');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const sequelize = require('./config/database');
const { getSupabaseConfig } = require('./config/supabase');

dotenv.config();
const app = express();

// REQ-3: Strict CORS allowlist
// NOTE: LOCALHOST_ONLY_MODE is enabled by default for local testing.
// Set LOCALHOST_ONLY_MODE=false only when you intentionally need non-local origins.
const localhostOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
];
const configuredProductionDomain = process.env.OFFICIAL_PRODUCTION_DOMAIN || process.env.FRONTEND_URL || 'https://hoclieutuongtac2.com';
const normalizedProductionOrigin = (() => {
  try {
    return new URL(configuredProductionDomain).origin;
  } catch {
    return configuredProductionDomain;
  }
})();
const localhostOnlyMode = process.env.LOCALHOST_ONLY_MODE !== 'false';
const allowedOrigins = localhostOnlyMode
  ? new Set(localhostOrigins)
  : new Set([...localhostOrigins, normalizedProductionOrigin]);

const localhostOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

console.log(
  localhostOnlyMode
    ? 'LOCALHOST_ONLY_MODE enabled: allowing localhost origins only'
    : `LOCALHOST_ONLY_MODE disabled: allowing localhost + ${normalizedProductionOrigin}`
);

let Sentry = null;
try {
  Sentry = require('@sentry/node');
  if (process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN });
  }
} catch {
  // Sentry is optional
}

// Enable CORS for development and production
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without Origin (server-to-server, health checks)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.has(origin) || localhostOriginRegex.test(origin)) {
      callback(null, true);
      return;
    }

    // Do not throw an app-level error for CORS rejections.
    // Returning false lets CORS middleware deny silently without generating 500 responses.
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

if (Sentry?.Handlers?.requestHandler && process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
}

app.use(requestLogger);

// REQ-4: Global API rate limit
// In development, use more lenient limits for better testing experience
const isDevelopment = process.env.NODE_ENV === 'development';

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 1000 : 100, // More lenient in development
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip health checks and routes with their own rate limiters
    if (req.path === '/health' || req.path === '/api/health') return true;
    if (req.path.startsWith('/api/transcript')) return true;
    if (req.path.startsWith('/api/ai')) return true;
    return false;
  },
  message: {
    error: 'Too many requests. Please slow down and try again shortly.',
    code: 'RATE_LIMITED',
  },
});

// Additional lenient limiter for transcript and AI routes (more requests needed during processing)
const transcriptRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 500 : 200, // Even more lenient for transcripts
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/api/health',
});

app.use('/api', apiRateLimiter);
app.use('/api/transcript', transcriptRateLimiter);
app.use('/api/ai', transcriptRateLimiter);

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
  const supabase = getSupabaseConfig();
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001,
    hasDatabase: !!databaseUrl,
    hasJWT: !!process.env.JWT_SECRET,
    hasSession: !!process.env.SESSION_SECRET,
    hasSupabaseBrowserConfig: supabase.hasBrowserConfig,
    hasSupabaseAdminConfig: supabase.hasAdminConfig,
    version: '1.0.1' // Added version to force refresh
  });
});

// Simple root health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'H5P Platform is running' });
});

// Remove the root route handler - let the React app handle it
// The catch-all handler below will serve the React app for the root route

// Public information endpoint (no authentication required)
app.get('/api/public/info', (req, res) => {
  res.json({
    name: 'AI-ActivEdu',
    description: 'Create, edit, and share interactive H5P content',
    version: '1.0.0',
    public_access: true
  });
});

// Simple test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Test route working", timestamp: new Date().toISOString() });
});

const enableUnsafeMaintenanceEndpoints =
  process.env.ENABLE_UNSAFE_MAINTENANCE_ENDPOINTS === 'true' &&
  process.env.NODE_ENV !== 'production';

if (enableUnsafeMaintenanceEndpoints) {

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
    if (secret !== process.env.VIDEO_FIX_SECRET || !secret) {
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

}

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/h5p", h5pRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/lti", ltiRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/admin", require('./routes/adminRoutes'));
// CHANGE NOTE: AI enrichment routes for transcript parsing and AI analysis
app.use("/api/transcript", transcriptRoutes);
app.use("/api/ai", aiRoutes);

// API-only 404 routing handled by centralized error middleware
app.use('/api/*', notFound);

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
        message: 'AI-ActivEdu',
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

if (Sentry?.Handlers?.errorHandler && process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// Centralized tiered error responses and structured logging
app.use(errorHandler);

// Test database connection before starting server
async function testDatabaseConnection() {
  try {
    // Check if we have an invalid database configuration
    if (sequelize._isInvalid) {
      console.log('⚠️ No valid database configuration found');
      console.log('💡 App will start but database features will be disabled');
      console.log('💡 Add PostgreSQL DATABASE_URL env var to enable full functionality');
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
    console.log('💡 Add PostgreSQL DATABASE_URL env var');
    return false;
  }
}

// ─── Real-time Collaboration via Socket.io ────────────────────────────────────
const { Server: SocketIOServer } = require('socket.io');

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

  // ─── Socket.io real-time collaboration ─────────────────────────────────────
  const io = new SocketIOServer(server, {
    cors: {
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.has(origin) || localhostOriginRegex.test(origin)) {
          cb(null, true);
        } else {
          cb(null, false);
        }
      },
      credentials: true,
    },
  });

  // Map: videoId → Set of { socketId, username }
  const videoRooms = new Map();

  io.on('connection', (socket) => {
    let currentRoom = null;
    let currentUser = null;

    socket.on('join-video', ({ videoId, username }) => {
      if (!videoId) return;
      currentRoom = `video:${videoId}`;
      currentUser = username || 'Anonymous';

      socket.join(currentRoom);

      if (!videoRooms.has(currentRoom)) videoRooms.set(currentRoom, new Map());
      videoRooms.get(currentRoom).set(socket.id, currentUser);

      const collaborators = Array.from(videoRooms.get(currentRoom).values());
      io.to(currentRoom).emit('collaborators-updated', { collaborators });
      console.log(`👥 ${currentUser} joined room ${currentRoom} (${collaborators.length} total)`);
    });

    // Broadcast suggestion status changes to all collaborators
    socket.on('suggestion-status', ({ videoId, suggestionId, status }) => {
      socket.to(`video:${videoId}`).emit('suggestion-status', { suggestionId, status, by: currentUser });
    });

    // Broadcast new manual H5P additions
    socket.on('h5p-added', ({ videoId, content }) => {
      socket.to(`video:${videoId}`).emit('h5p-added', { content, by: currentUser });
    });

    // Broadcast H5P removals
    socket.on('h5p-removed', ({ videoId, contentId }) => {
      socket.to(`video:${videoId}`).emit('h5p-removed', { contentId, by: currentUser });
    });

    socket.on('disconnect', () => {
      if (currentRoom && videoRooms.has(currentRoom)) {
        videoRooms.get(currentRoom).delete(socket.id);
        if (videoRooms.get(currentRoom).size === 0) {
          videoRooms.delete(currentRoom);
        } else {
          const collaborators = Array.from(videoRooms.get(currentRoom).values());
          io.to(currentRoom).emit('collaborators-updated', { collaborators });
        }
      }
    });
  });

  console.log('🔌 Socket.io real-time collaboration enabled');

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
