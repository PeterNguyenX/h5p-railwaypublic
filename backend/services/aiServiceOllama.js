/**
 * Ollama AI Service — free local LLM for H5P suggestion generation.
 * Uses llama3.2:3b (or configurable) running via Ollama.
 * Falls back gracefully if Ollama is not available.
 */

const http = require('http');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'localhost';
const OLLAMA_PORT = parseInt(process.env.OLLAMA_PORT || '11434', 10);
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

const H5P_TYPE_MAP = {
  MultiChoice: 'H5P.MultiChoice 1.16',
  TrueFalse: 'H5P.TrueFalse 1.6',
  FillBlanks: 'H5P.Blanks 1.14',
  Hotspot: 'H5P.ImageHotspotQuestion 1.8',
  DragDrop: 'H5P.DragQuestion 1.14',
  MarkWords: 'H5P.MarkTheWords 1.9',
};

// System prompt kept minimal for small models
const AI_SYSTEM_PROMPT = `You are an educational content assistant. Respond with ONLY valid JSON arrays, no other text.`;

/**
 * Make an HTTP POST request to Ollama API.
 */
function ollamaRequest(path, body, timeout = 120000) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: OLLAMA_HOST,
      port: OLLAMA_PORT,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve({ response: body });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Ollama request timed out after ${timeout}ms`));
    });

    req.write(data);
    req.end();
  });
}

/**
 * Stream Ollama response, accumulating the full text.
 */
function ollamaStream(path, body, onChunk, timeout = 180000) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: OLLAMA_HOST,
      port: OLLAMA_PORT,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    let fullText = '';

    const req = http.request(options, (res) => {
      res.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const obj = JSON.parse(line);
            if (obj.response) {
              fullText += obj.response;
              onChunk(obj.response);
            }
            if (obj.done) {
              resolve(fullText);
            }
          } catch { /* partial line */ }
        }
      });
      res.on('end', () => resolve(fullText));
    });

    req.on('error', reject);
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Ollama stream timed out'));
    });

    req.write(data);
    req.end();
  });
}

/**
 * Check if Ollama is running and the model is available.
 */
async function isOllamaAvailable() {
  return new Promise((resolve) => {
    const req = http.request(
      { hostname: OLLAMA_HOST, port: OLLAMA_PORT, path: '/api/tags', method: 'GET' },
      (res) => {
        let body = '';
        res.on('data', (d) => { body += d; });
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            const models = data.models || [];
            const base = OLLAMA_MODEL.split(':')[0];
            resolve(models.some((m) => m.name.startsWith(base)));
          } catch {
            resolve(false);
          }
        });
      }
    );
    req.setTimeout(5000, () => { req.destroy(); resolve(false); });
    req.on('error', () => resolve(false));
    req.end();
  });
}

/**
 * Format transcript segments into a readable prompt string.
 */
function formatSegmentsForPrompt(segments) {
  // Group into chunks of ~60 seconds for readability
  return segments
    .map((seg) => {
      const m = Math.floor(seg.start / 60);
      const s = Math.floor(seg.start % 60);
      return `[${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}] ${seg.text}`;
    })
    .join('\n');
}

/**
 * Extract valid JSON array from LLM output (handles extra text around it).
 */
function extractJsonArray(text) {
  // Try direct parse first
  const trimmed = text.trim();
  if (trimmed.startsWith('[')) {
    try { return JSON.parse(trimmed); } catch { /* fall through */ }
  }

  // Find JSON array in the text
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch { /* fall through */ }
  }

  throw new Error('Could not extract JSON array from LLM response');
}

/**
 * Validate and sanitize a suggestion object.
 */
function validateSuggestion(item, index) {
  if (typeof item.timestamp !== 'number' || item.timestamp < 0) return null;
  const validTypes = ['MultiChoice', 'TrueFalse', 'FillBlanks', 'Hotspot', 'DragDrop', 'MarkWords'];
  if (!validTypes.includes(item.type)) return null;
  if (!item.config || typeof item.config !== 'object') return null;

  return {
    id: `ollama_${Date.now()}_${index}`,
    timestamp: Math.round(item.timestamp),
    type: item.type,
    h5pLibrary: H5P_TYPE_MAP[item.type],
    config: item.config,
    reason: item.reason || 'AI-generated interaction',
    status: 'pending',
  };
}

/**
 * Build a directive prompt that small LLMs reliably follow.
 */
function buildOllamaPrompt(segments) {
  const transcript = formatSegmentsForPrompt(segments);
  return `Generate 4-6 H5P interactive questions for this video transcript.

TRANSCRIPT:
${transcript}

Return ONLY a JSON array. Each item must have: timestamp (seconds from transcript), type ("MultiChoice" or "TrueFalse"), config (object), reason (string).
MultiChoice config: {"question":"...","answers":[{"text":"...","correct":true},{"text":"...","correct":false},{"text":"...","correct":false},{"text":"...","correct":false}]}
TrueFalse config: {"question":"...","correct":true}

JSON:`;
}

/**
 * Analyze transcript using Ollama (non-streaming).
 */
async function analyzeTranscriptOllama(segments) {
  if (!segments || segments.length === 0) {
    throw new Error('No transcript segments provided');
  }

  const userMessage = buildOllamaPrompt(segments);

  const response = await ollamaRequest('/api/generate', {
    model: OLLAMA_MODEL,
    system: AI_SYSTEM_PROMPT,
    prompt: userMessage,
    stream: false,
    options: {
      temperature: 0.2,
      top_p: 0.9,
      num_predict: 2048,
    },
  }, 180000);

  const rawText = response.response || '';
  if (!rawText) throw new Error('Empty response from Ollama');

  const rawArray = extractJsonArray(rawText);
  const suggestions = rawArray
    .map((item, i) => validateSuggestion(item, i))
    .filter(Boolean);

  if (suggestions.length === 0) {
    throw new Error('Ollama returned no valid H5P suggestions');
  }

  return { suggestions, rawResponse: rawText, model: OLLAMA_MODEL };
}

/**
 * Analyze transcript using Ollama with SSE streaming to Express response.
 * Optionally saves suggestions to Video.h5pContent if videoId and video are provided.
 */
async function analyzeTranscriptOllamaStream(segments, res, videoId, video) {
  if (!segments || segments.length === 0) {
    throw new Error('No transcript segments provided');
  }

  const userMessage = buildOllamaPrompt(segments);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write(`data: ${JSON.stringify({ type: 'progress', message: `Starting Ollama analysis (${OLLAMA_MODEL})...` })}\n\n`);

  let fullText = '';

  try {
    fullText = await ollamaStream(
      '/api/generate',
      {
        model: OLLAMA_MODEL,
        system: AI_SYSTEM_PROMPT,
        prompt: userMessage,
        stream: true,
        options: { temperature: 0.3, top_p: 0.9, num_predict: 2048 },
      },
      (chunk) => {
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
      },
    );

    res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Parsing suggestions...' })}\n\n`);

    const rawArray = extractJsonArray(fullText);
    const suggestions = rawArray
      .map((item, i) => validateSuggestion(item, i))
      .filter(Boolean);

    // Save to database if video is provided
    if (videoId && video) {
      try {
        const h5pContent = video.h5pContent || [];
        const newContent = suggestions.map(suggestion => ({
          id: suggestion.id,
          timestamp: suggestion.timestamp,
          type: suggestion.type,
          h5pLibrary: suggestion.h5pLibrary || suggestion.type,
          config: suggestion.config,
          reason: suggestion.reason || 'AI-generated interaction',
          status: 'pending',
          createdAt: new Date().toISOString()
        }));
        h5pContent.push(...newContent);
        await video.update({ h5pContent });
        console.log(`Persisted ${newContent.length} H5P suggestions to video ${videoId}`);
      } catch (dbErr) {
        console.error('Failed to persist suggestions to database:', dbErr.message);
        // Don't fail the stream, just log the error
      }
    }

    // Convert flat suggestions to topics format so frontend editorStore can handle uniformly
    const topics = suggestions.map(s => ({
      title: s.reason || 'Generated Topic',
      start: Math.max(0, (s.timestamp || 0) - 30),
      end: s.timestamp || 0,
      question: {
        type: s.type,
        ...(s.config || {}),
        feedback: (s.config && s.config.feedback) || { correct: 'Correct!', incorrect: 'Not quite — review the material.' },
      },
    }));
    res.write(`data: ${JSON.stringify({ type: 'result', topics, model: OLLAMA_MODEL })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
  }
}

module.exports = {
  isOllamaAvailable,
  analyzeTranscriptOllama,
  analyzeTranscriptOllamaStream,
  OLLAMA_MODEL,
};
