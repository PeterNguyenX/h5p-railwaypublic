/**
 * Ollama AI Service — thin wrapper around aiService.js.
 * All generation logic lives in aiService.js so both providers
 * use the same prompts, Zod schemas, and post-processing pipeline.
 */

const http = require('http');

const OLLAMA_HOST  = process.env.OLLAMA_HOST  || 'localhost';
const OLLAMA_PORT  = parseInt(process.env.OLLAMA_PORT || '11434', 10);
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral';

/** Returns true if Ollama is reachable. */
async function isOllamaAvailable() {
  return new Promise((resolve) => {
    const req = http.request(
      { hostname: OLLAMA_HOST, port: OLLAMA_PORT, path: '/api/version', method: 'GET' },
      (res) => { res.resume(); res.on('end', () => resolve(true)); },
    );
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => { req.destroy(); resolve(false); });
    req.end();
  });
}

/**
 * Non-streaming analysis (legacy, used by POST /api/ai/analyze).
 * Returns { topics, model }.
 */
async function analyzeTranscriptOllama(segments, language = 'en') {
  const { formatSegmentsForPrompt, AI_SYSTEM_PROMPT, buildSystemPrompt } = require('./aiService');

  const langNote = language === 'vi' ? 'NHẮC LẠI: Trả lời bằng tiếng Việt.\n\n' : '';
  const userMsg  = `${langNote}Transcript:\n\n${formatSegmentsForPrompt(segments, 100)}\n\nReturn the JSON object now.`;

  let fullText = '';

  const { OLLAMA_SYSTEM_PROMPT, OLLAMA_FEW_SHOT_EXAMPLE } = require('./aiService');
  const lastSeg  = segments[segments.length - 1];
  const duration = lastSeg ? Math.round(lastSeg.end) : 0;
  const completionPrompt =
    `${OLLAMA_SYSTEM_PROMPT}\n\n${OLLAMA_FEW_SHOT_EXAMPLE}\n\n` +
    `Now generate JSON for this transcript (0 to ${duration}s):\n` +
    `<transcript>\n${formatSegmentsForPrompt(segments, 120)}\n</transcript>\n\nOUTPUT JSON:`;

  const body = JSON.stringify({
    model: OLLAMA_MODEL,
    prompt: completionPrompt,
    stream: true,
    format: 'json',
    options: { num_predict: 8192, temperature: 0.1 },
  });

  await new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: OLLAMA_HOST, port: OLLAMA_PORT, path: '/api/generate', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let buf = '';
        res.on('data', c => {
          buf += c.toString();
          const lines = buf.split('\n'); buf = lines.pop();
          for (const line of lines) {
            try {
              const d = JSON.parse(line);
              if (d.response) fullText += d.response;
              if (d.done) resolve();
            } catch { /* incomplete line */ }
          }
        });
        res.on('end', resolve);
        res.on('error', reject);
      });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  const { extractJsonObject, makeSchemas, sanitizeTopics } = require('./aiService');
  const { ResponseSchema } = makeSchemas('en');
  const parsed = ResponseSchema.parse(extractJsonObject(fullText));
  return { topics: sanitizeTopics(parsed.topics, segments), model: OLLAMA_MODEL };
}

/**
 * Streaming analysis — delegates to aiService.analyzeTranscriptStream.
 * Kept for backward compatibility; caller must NOT have written SSE headers yet.
 */
async function analyzeTranscriptOllamaStream(segments, res, videoId, video, language = 'en') {
  const { runOllamaAnalysis, parseAndPersist } = require('./aiService');
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  const send = (payload) => { if (!res.writableEnded) res.write(`data: ${JSON.stringify(payload)}\n\n`); };
  try {
    const rawText = await runOllamaAnalysis(segments, send, language);
    const { topics } = await parseAndPersist(rawText, segments, send, videoId, video, 'ollama');
    send({ type: 'result', topics, provider: 'ollama' });
  } catch (err) {
    send({ type: 'error', message: err.message });
  } finally {
    if (!res.writableEnded) { res.write('data: [DONE]\n\n'); res.end(); }
  }
}

module.exports = {
  isOllamaAvailable,
  analyzeTranscriptOllama,
  analyzeTranscriptOllamaStream,
  OLLAMA_MODEL,
};
