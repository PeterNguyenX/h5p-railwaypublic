const fs = require('fs').promises;
const path = require('path');

/**
 * Middleware to handle thumbnail requests with fallback to default
 * If a thumbnail file doesn't exist, serves the default thumbnail instead
 */
const thumbnailFallbackMiddleware = (req, res, next) => {
  // Only apply to thumbnail requests
  if (!req.path.includes('thumbnail') || req.path.includes('default-thumbnail')) {
    return next();
  }

  const originalSend = res.sendFile;
  res.sendFile = function(filePath, options, callback) {
    // Check if file exists before trying to send it
    fs.access(filePath)
      .then(() => {
        // File exists, send it normally
        originalSend.call(this, filePath, options, callback);
      })
      .catch(() => {
        // File doesn't exist, send default thumbnail instead
        console.log(`Thumbnail not found: ${filePath}, serving default`);
        const defaultThumbnailPath = path.join(__dirname, '../public/default-thumbnail.svg');
        res.setHeader('Content-Type', 'image/svg+xml');
        originalSend.call(this, defaultThumbnailPath, options, callback);
      });
  };

  next();
};

module.exports = thumbnailFallbackMiddleware;
