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

/**
 * POST /api/ai/transcribe-and-generate
 * Transform a teaching video into interactive H5P content with AI-generated questions
 * 
 * Request: {
 *   videoId: string (UUID),
 *   educationLevel?: 'high-school' | 'undergraduate' | 'professional',
 *   learningObjectives?: string[],
 *   questionDensity?: 'sparse' | 'moderate' | 'dense',
 *   questionTypes?: ('multipleChoice' | 'truefalse' | 'fillblank')[]
 * }
 * 
 * Response: {
 *   videoId,
 *   transcript: { fullText, segments, wordCount },
 *   suggestions: [ { type, timestamp, question, answers, explanation, bloomsLevel, ... } ],
 *   metadata: { videoDuration, generationTime, ... }
 * }
 */
router.post('/transcribe-and-generate', auth, async (req, res) => {
  try {
    const { videoId, educationLevel = 'high-school', learningObjectives = [], questionDensity = 'moderate', questionTypes = ['multipleChoice', 'truefalse', 'fillblank'] } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    if (!ANTHROPIC_API_KEY) {
      return res.status(503).json({ 
        error: 'AI question generation is not available',
        code: 'MISSING_CONFIG',
        message: 'ANTHROPIC_API_KEY environment variable is not configured on the server',
        suggestion: 'Set ANTHROPIC_API_KEY in your .env file or server environment variables',
        documentationUrl: '/docs/api/transform#configuration'
      });
    }

    const { Video } = require('../models');
    const { fetchYoutubeTranscriptSegments } = require('../services/transcriptExtraction');

    // Fetch video
    const video = await Video.findByPk(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found', code: 'VIDEO_NOT_FOUND' });
    }

    // Check authorization
    if (video.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access to this video' });
    }

    const startTime = Date.now();

    // Step 1: Get transcript
    let transcript;
    let transcriptSource = 'unknown';

    // Try existing captions first
    if (video.captions) {
      transcript = video.captions;
      transcriptSource = 'existing';
    } else if (video.youtubeUrl) {
      // Extract from YouTube
      const result = await fetchYoutubeTranscriptSegments(video.youtubeUrl);
      if (result.segments && result.segments.length > 0) {
        transcript = result.segments;
        transcriptSource = 'youtube';
      }
    }

    if (!transcript) {
      return res.status(400).json({
        error: 'No transcript available for this video',
        code: 'NO_TRANSCRIPT',
        message: 'Upload a transcript file or use a YouTube video with captions enabled'
      });
    }

    // Step 2: Generate questions with Claude
    const suggestions = await generateQuestionsWithClaude(
      transcript,
      video.title,
      educationLevel,
      learningObjectives,
      questionDensity,
      questionTypes
    );

    const generationTime = Date.now() - startTime;

    // Return response
    res.json({
      success: true,
      videoId,
      transcript: {
        fullText: typeof transcript === 'string' ? transcript : transcript.map(s => s.text || '').join(' ') || '',
        segments: Array.isArray(transcript) ? transcript : [],
        wordCount: (typeof transcript === 'string' ? transcript : transcript.map(s => s.text || '').join(' ')).split(/\s+/).length
      },
      suggestions: suggestions.slice(0, 20),
      metadata: {
        videoDuration: video.duration,
        videoTitle: video.title,
        educationLevel,
        questionDensity,
        questionCount: suggestions.length,
        generationTime,
        transcriptSource,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in transcribe-and-generate:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate interactive content',
      code: 'GENERATION_ERROR'
    });
  }
});

/**
 * Generate questions using Claude API
 * @private
 */
async function generateQuestionsWithClaude(transcript, videoTitle, educationLevel, objectives, density, types) {
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const densityMap = { sparse: 1, moderate: 2, dense: 3 };
    const targetCount = Math.ceil((Array.isArray(transcript) ? transcript.length : 1) * densityMap[density]);

    // Build transcript text
    let transcriptText = '';
    if (Array.isArray(transcript)) {
      transcriptText = transcript.map(s => `[${s.start || 0}s] ${s.text || ''}`).join('\n');
    } else {
      transcriptText = transcript;
    }

    const prompt = `You are an expert educator and instructional designer. Analyze this educational video transcript and generate interactive learning questions.

Video: ${videoTitle}
Education Level: ${educationLevel}
Question Density: ${density} (target ~${Math.min(targetCount, 15)} questions)
Question Types: ${types.join(', ')}
${objectives.length > 0 ? `Learning Objectives: ${objectives.join(', ')}` : ''}

Transcript:
${transcriptText}

Generate ${Math.min(targetCount, 15)} educational questions that:
- Test understanding of key concepts
- Include exact timestamp (in seconds) for when to ask
- Vary difficulty across Bloom's taxonomy levels
- Have clear, defensible correct answers
- Include comprehensive explanations
- Are appropriate for ${educationLevel} level

Return ONLY a valid JSON array with this exact structure (no markdown, no code blocks):
[
  {
    "type": "multipleChoice",
    "timestamp": 45,
    "question": "What is the primary mechanism of...?",
    "answers": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Correct because... Wrong answers because...",
    "bloomsLevel": "understand",
    "concept": "key concept name",
    "difficulty": 0.5
  }
]`;

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    // Extract and parse JSON
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Try to find JSON array
    const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid Claude response format');
    }

    const questions = JSON.parse(jsonMatch[0]);
    
    // Validate and add IDs
    return questions.map((q, idx) => ({
      id: `q-${Date.now()}-${idx}`,
      type: q.type || 'multipleChoice',
      timestamp: q.timestamp || 0,
      question: q.question || '',
      answers: q.answers || [],
      correctIndex: q.correctIndex !== undefined ? q.correctIndex : 0,
      explanation: q.explanation || '',
      bloomsLevel: q.bloomsLevel || 'understand',
      concept: q.concept || 'General knowledge',
      difficulty: q.difficulty || 0.5,
      accepted: false
    }));

  } catch (error) {
    console.error('Claude generation error:', error);
    throw new Error(`Question generation failed: ${error.message}`);
  }
}

module.exports = router;
