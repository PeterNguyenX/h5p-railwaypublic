// minimal.js - The absolute simplest possible Node.js server
const http = require('http');

const server = http.createServer((req, res) => {
  // Log all requests
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Return success for health check
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
    return;
  }
  
  // Default response
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World! Server is working.');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Health check available at /health`);
});
