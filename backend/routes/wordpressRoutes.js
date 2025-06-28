const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const router = express.Router();

// WordPress proxy configuration
const WORDPRESS_URL = process.env.WORDPRESS_URL || 'http://localhost:8888/h5p-wp';

// Health check endpoint (before proxy)
router.get('/health', (req, res) => {
  res.json({ 
    status: 'WordPress integration active',
    wordpressUrl: WORDPRESS_URL,
    message: 'Access WordPress at /api/wordpress/',
    timestamp: new Date().toISOString()
  });
});

// Proxy middleware for WordPress assets and content
const wordpressProxy = createProxyMiddleware({
  target: 'http://localhost:8888',
  changeOrigin: true,
  pathRewrite: {
    '^/api/wordpress': '/h5p-wp', // Rewrite to include WordPress subdirectory
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add any custom headers if needed
    console.log(`Proxying ${req.method} ${req.url} to http://localhost:8888${req.url.replace('/api/wordpress', '/h5p-wp')}`);
    
    // Set proper host header
    proxyReq.setHeader('host', 'localhost:8888');
    
    // Handle referer for WordPress admin
    if (req.headers.referer && req.headers.referer.includes('/api/wordpress')) {
      const newReferer = req.headers.referer.replace('/api/wordpress', '/h5p-wp');
      proxyReq.setHeader('referer', newReferer);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Remove CSP headers that might block fonts and assets
    delete proxyRes.headers['content-security-policy'];
    delete proxyRes.headers['content-security-policy-report-only'];
    delete proxyRes.headers['x-frame-options'];
    
    // Don't set any X-Frame-Options to allow iframe embedding from any origin
    // Alternative: use 'DENY' to block all iframes, 'SAMEORIGIN' to allow same origin only
    
    // Add CORS headers for assets
    proxyRes.headers['access-control-allow-origin'] = '*';
    proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization';
    
    // Add headers to prevent caching issues in iframe
    proxyRes.headers['cache-control'] = 'no-cache, no-store, must-revalidate';
    
    console.log(`Proxied ${req.method} ${req.url} - Status: ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error('WordPress proxy error:', err);
    res.status(500).json({ 
      error: 'WordPress connection error',
      message: 'Could not connect to WordPress. Make sure MAMP is running.',
      details: err.message
    });
  }
});

// Proxy all other WordPress requests (but not /health)
router.use('/', (req, res, next) => {
  // Skip proxy for health endpoint
  if (req.path === '/health') {
    return next();
  }
  return wordpressProxy(req, res, next);
});

module.exports = router;