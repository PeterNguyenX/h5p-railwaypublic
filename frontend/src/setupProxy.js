const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const target = process.env.BACKEND_PROXY_TARGET || 'http://localhost:5001';
  console.log('Setting up proxy middleware for /api routes...');
  
  app.use(
    '/api',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] ${req.method} ${req.url} -> ${target}${req.url}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`[PROXY] Response ${proxyRes.statusCode} for ${req.url}`);
      },
      onError: (err, req, res) => {
        console.error('[PROXY ERROR]:', err.message);
        res.status(500).json({ error: 'Proxy error', details: err.message });
      }
    })
  );
  
  console.log('Proxy middleware setup complete.');
};
