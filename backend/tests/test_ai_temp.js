require('dotenv').config();

// Patch extractJsonObject to log the raw text before parsing
const aiService = require('./services/aiService');

const segments = [
  { start: 0, end: 20, text: "Welcome to Caching: The Secret to Speed." },
  { start: 20, end: 60, text: "Databases must be complete and consistent, prioritizing correctness over speed." },
  { start: 60, end: 100, text: "Caching stores frequently accessed data in fast memory to reduce database load." },
  { start: 100, end: 160, text: "Cache invalidation and TTL control how long data stays in cache." },
  { start: 160, end: 220, text: "Redis is the most popular caching solution using key-value pairs in RAM." },
  { start: 220, end: 280, text: "LRU eviction removes least recently used entries when cache is full." },
  { start: 280, end: 340, text: "Cache stampede can be prevented with mutex locks or probabilistic expiration." },
  { start: 340, end: 400, text: "Distributed Redis Cluster spreads cache across nodes using consistent hashing." },
  { start: 400, end: 439, text: "Summary: caching reduces latency and scales systems effectively." },
];

let fullRawText = '';
const fakeRes = {
  writeHead: () => {},
  write: (data) => {
    const line = data.replace(/^data: /, '').trim();
    if (!line || line === '[DONE]') return;
    try {
      const e = JSON.parse(line);
      if (e.type === 'chunk') fullRawText += e.text || '';
    } catch {}
  },
  end: () => {
    console.log('\n=== RAW AI OUTPUT (full) ===');
    console.log(fullRawText);
    process.exit(0);
  }
};

const { analyzeTranscriptStreamOllama } = require('./services/aiService');
analyzeTranscriptStreamOllama(segments, fakeRes, null, null).catch(e => {
  console.error('Error:', e.message);
  console.log('Raw so far:', fullRawText);
  process.exit(1);
});
