/**
 * AI Service — Claude API integration for transcript analysis.
 * Uses Anthropic Claude to generate H5P insertion suggestions from transcript segments.
 */

const { z } = require('zod');

const AI_SYSTEM_PROMPT = `You are an instructional design assistant. Given a video transcript segmented by timestamp, identify 4–8 moments where inserting an H5P interactive element would reinforce learning. Return ONLY a valid JSON array — no explanation, no markdown fences.

Each object must match this schema exactly:
{
  "timestamp": number,
  "type": "MultiChoice" | "TrueFalse" | "FillBlanks" | "Hotspot" | "DragDrop",
  "config": { ...H5P content params },
  "reason": string
}

Rules:
- Space suggestions at least 30 seconds apart
- Prefer moments after a concept is fully explained, not mid-sentence
- For MultiChoice, always include exactly 4 options with one correct
- For FillBlanks, mark the blank with *asterisks*
- Config keys must match H5P content type specification exactly`;

const suggestionSchema = z.object({
  timestamp: z.number().nonnegative(),
  type: z.enum(['MultiChoice', 'TrueFalse', 'FillBlanks', 'Hotspot', 'DragDrop']),
  config: z.record(z.unknown()),
  reason: z.string()
});

const suggestionListSchema = z.array(suggestionSchema);

/**
 * Map AI type strings to H5P library identifiers.
 */
const H5P_TYPE_MAP = {
  MultiChoice: 'H5P.MultiChoice 1.16',
  TrueFalse: 'H5P.TrueFalse 1.6',
  FillBlanks: 'H5P.Blanks 1.14',
  Hotspot: 'H5P.ImageHotspotQuestion 1.8',
  DragDrop: 'H5P.DragQuestion 1.14'
};

/**
 * Format transcript segments into a readable string for the AI prompt.
 * @param {{ start: number, end: number, text: string }[]} segments
 * @returns {string}
 */
function formatSegmentsForPrompt(segments) {
  return segments
    .map(seg => {
      const startMin = Math.floor(seg.start / 60);
      const startSec = Math.floor(seg.start % 60);
      const endMin = Math.floor(seg.end / 60);
      const endSec = Math.floor(seg.end % 60);
      const startStr = `${String(startMin).padStart(2, '0')}:${String(startSec).padStart(2, '0')}`;
      const endStr = `${String(endMin).padStart(2, '0')}:${String(endSec).padStart(2, '0')}`;
      return `[${startStr} → ${endStr}] ${seg.text}`;
    })
    .join('\n');
}

/**
 * Analyze transcript segments using Claude API (non-streaming).
 * @param {{ start: number, end: number, text: string }[]} segments
 * @param {string} apiKey - Anthropic API key
 * @returns {Promise<object[]>} Array of H5P suggestions
 */
async function analyzeTranscript(segments, apiKey) {
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  if (!segments || segments.length === 0) {
    throw new Error('No transcript segments provided');
  }

  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  const userMessage = `Here is the video transcript:\n\n${formatSegmentsForPrompt(segments)}\n\nAnalyze the transcript and return H5P interactive element suggestions as a JSON array.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: AI_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }]
    });

    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent) {
      throw new Error('No text content in Claude response');
    }

    const rawResponse = textContent.text;
    const suggestions = suggestionListSchema.parse(JSON.parse(rawResponse));

    return {
      rawResponse,
      suggestions: suggestions.map((suggestion, index) => ({
        id: `ai_suggestion_${Date.now()}_${index}`,
        timestamp: suggestion.timestamp,
        type: suggestion.type,
        h5pLibrary: H5P_TYPE_MAP[suggestion.type],
        config: suggestion.config,
        reason: suggestion.reason,
        status: 'pending'
      }))
    };
  } catch (error) {
    if (error.status === 401) {
      throw new Error('Invalid Anthropic API key');
    }
    if (error.status === 429) {
      throw new Error('Anthropic API rate limit exceeded. Please try again later.');
    }
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse Claude response as JSON. The AI returned malformed output.');
    }
    throw error;
  }
}

/**
 * Analyze transcript using Claude API with SSE streaming.
 * Writes Server-Sent Events to the Express response object.
 * @param {{ start: number, end: number, text: string }[]} segments
 * @param {string} apiKey
 * @param {import('express').Response} res - Express response for SSE
 * @returns {Promise<void>}
 */
async function analyzeTranscriptStream(segments, apiKey, res) {
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  if (!segments || segments.length === 0) {
    throw new Error('No transcript segments provided');
  }

  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  const userMessage = `Here is the video transcript:\n\n${formatSegmentsForPrompt(segments)}\n\nAnalyze the transcript and return H5P interactive element suggestions as a JSON array.`;

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  let fullText = '';

  try {
    // Send initial progress event
    res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Starting AI analysis...' })}\n\n`);

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: AI_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }]
    });

    stream.on('text', (text) => {
      fullText += text;
      res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`);
    });

    const finalMessage = await stream.finalMessage();

    // Parse the complete response
    let suggestions;
    try {
      suggestions = suggestionListSchema.parse(JSON.parse(fullText));
    } catch (parseError) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to parse AI response as JSON' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Validate and enrich suggestions
    const enriched = suggestions.map((suggestion, index) => {
      if (!H5P_TYPE_MAP[suggestion.type]) {
        return null;
      }
      return {
        id: `ai_suggestion_${Date.now()}_${index}`,
        timestamp: suggestion.timestamp,
        type: suggestion.type,
        h5pLibrary: H5P_TYPE_MAP[suggestion.type],
        config: suggestion.config,
        reason: suggestion.reason || '',
        status: 'pending'
      };
    }).filter(Boolean);

    // Send final result
    res.write(`data: ${JSON.stringify({ type: 'result', suggestions: enriched })}\n\n`);
    res.write(`data: ${JSON.stringify({
      type: 'usage',
      inputTokens: finalMessage.usage?.input_tokens,
      outputTokens: finalMessage.usage?.output_tokens
    })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    const errorMessage = error.status === 401
      ? 'Invalid Anthropic API key'
      : error.status === 429
        ? 'Rate limit exceeded'
        : error.message || 'AI analysis failed';

    res.write(`data: ${JSON.stringify({ type: 'error', message: errorMessage })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}

module.exports = {
  analyzeTranscript,
  analyzeTranscriptStream,
  AI_SYSTEM_PROMPT,
  H5P_TYPE_MAP,
  formatSegmentsForPrompt
};
