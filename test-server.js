// test-server.js - Minimal Express server for testing Fly.io deployment
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World! Server is running.');
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
});
