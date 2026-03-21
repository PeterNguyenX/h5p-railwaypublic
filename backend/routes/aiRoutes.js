/**
 * AI Routes
 * POST /api/ai/analyze       — Analyze transcript with Claude (non-streaming)
 * POST /api/ai/analyze-stream — Analyze transcript with Claude (SSE streaming)
 * POST /api/ai/inject         — Inject accepted suggestions into H5P
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { analyzeTranscript, analyzeTranscriptStream } = require('../services/aiService');
const { injectAll } = require('../services/aiInjectionService');
const {
  analyzeRequestSchema,
  injectRequestSchema,
  formatValidationError
} = require('../validation/aiSchemas');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

/**
 * POST /api/ai/analyze
 * Body: { segments: TranscriptSegment[], videoId: string }
 * Response: { suggestions: AISuggestion[] }
 */
router.post('/analyze', auth, async (req, res) => {
  try {
    const parsed = analyzeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(formatValidationError(parsed.error));
    }

    const { segments, videoId } = parsed.data;

    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server' });
    }

    const { suggestions, rawResponse } = await analyzeTranscript(segments, ANTHROPIC_API_KEY);

    res.json({
      suggestions,
      count: suggestions.length,
      videoId,
      rawResponse
    });
  } catch (error) {
    console.error('Error in AI analysis:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/analyze-stream
 * Body: { segments: TranscriptSegment[], videoId: string }
 * Response: Server-Sent Events stream
 */
router.post('/analyze-stream', auth, async (req, res) => {
  try {
    const parsed = analyzeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(formatValidationError(parsed.error));
    }

    const { segments } = parsed.data;

    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server' });
    }

    // analyzeTranscriptStream handles SSE headers and writing
    await analyzeTranscriptStream(segments, ANTHROPIC_API_KEY, res);
  } catch (error) {
    console.error('Error in AI streaming analysis:', error.message);
    // If headers haven't been sent yet, send error normally
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * POST /api/ai/inject
 * Body: { suggestions: AcceptedSuggestion[], videoId: string }
 * Response: { injected: object[], errors: object[], video: object }
 */
router.post('/inject', auth, async (req, res) => {
  try {
    const parsed = injectRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(formatValidationError(parsed.error));
    }

    const { suggestions, videoId } = parsed.data;

    const result = await injectAll(suggestions, videoId, req.user.id);

    res.json({
      message: `Successfully injected ${result.injected.length} H5P elements`,
      ...result
    });
  } catch (error) {
    console.error('Error injecting AI suggestions:', error.message);
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
