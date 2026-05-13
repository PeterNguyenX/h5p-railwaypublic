/**
 * AI Routes
 * POST /api/ai/analyze       — Analyze transcript with Claude (non-streaming)
 * POST /api/ai/analyze-stream — Analyze transcript with Claude (SSE streaming)
 * POST /api/ai/inject         — Inject accepted suggestions into H5P
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { createSafeErrorResponse, logErrorSafely } = require('../utils/securityUtils');
const { analyzeTranscript, analyzeTranscriptStream } = require('../services/aiService');
const {
  isOllamaAvailable,
  analyzeTranscriptOllama,
  analyzeTranscriptOllamaStream,
  OLLAMA_MODEL,
} = require('../services/aiServiceOllama');
const { injectAll } = require('../services/aiInjectionService');
const {
  analyzeRequestSchema,
  injectRequestSchema,
  formatValidationError
} = require('../validation/aiSchemas');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

/**
 * GET /api/ai/status
 * Returns which AI backends are available.
 */
router.get('/status', async (req, res) => {
  const path = require('path');
  const fs = require('fs');
  const { execFileSync } = require('child_process');

  const ollamaOk = await isOllamaAvailable();

  const venvPythonUnix = path.join(__dirname, '..', '..', '.venv', 'bin', 'python3');
  const venvPythonWin = path.join(__dirname, '..', '..', '.venv', 'Scripts', 'python.exe');
  const systemPythonWin = 'C:\\Users\\ASUS\\AppData\\Local\\Programs\\Python\\Python311\\python.exe';
  const pythonBin = fs.existsSync(venvPythonWin) ? venvPythonWin
    : fs.existsSync(venvPythonUnix) ? venvPythonUnix
    : fs.existsSync(systemPythonWin) ? systemPythonWin
    : process.platform === 'win32' ? 'python' : 'python3';
  let whisperOk = false;
  try {
    execFileSync(pythonBin, ['-c', 'import faster_whisper'], { timeout: 5000 });
    whisperOk = true;
  } catch {
    whisperOk = false;
  }

  res.json({
    ollama: { available: ollamaOk, model: OLLAMA_MODEL },
    claude: { available: !!ANTHROPIC_API_KEY },
    whisper: { available: whisperOk, python: pythonBin },
    preferred: ollamaOk ? 'ollama' : (ANTHROPIC_API_KEY ? 'claude' : 'none'),
  });
});

/**
 * POST /api/ai/analyze
 * Body: { segments: TranscriptSegment[], videoId: string }
 * Response: { topics: TopicNode[] }
 */
router.get('/usage', auth, async (req, res) => {
  try {
    const { Video } = require('../models');
    const { Op } = require('sequelize');
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const usedToday = await Video.count({
      where: { userId: req.user.id, aiProcessedAt: { [Op.between]: [todayStart, todayEnd] } },
    });
    res.json({ usedToday, limit: req.user.role === 'admin' ? null : 3, isAdmin: req.user.role === 'admin' });
  } catch (error) {
    logErrorSafely(error, 'Error getting AI usage');
    const safeResponse = createSafeErrorResponse(error, 'Unable to fetch usage information.');
    res.status(500).json(safeResponse);
  }
});

router.post('/analyze', auth, async (req, res) => {
  try {
    const parsed = analyzeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(formatValidationError(parsed.error));
    }

    const { segments, videoId, language = 'en' } = parsed.data;
    const { Video } = require('../models');

    const video = await Video.findByPk(videoId);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    if (video.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access to this video' });
    }

    let topics;
    let model;

    const ollamaOk = await isOllamaAvailable();
    if (ollamaOk) {
      try {
        const result = await analyzeTranscriptOllama(segments, language);
        // Ollama may return old suggestions format — wrap as topics if needed
        topics = result.topics || result.suggestions || [];
        model = result.model;
      } catch (ollamaErr) {
        console.warn('Ollama analysis failed, falling back to Claude:', ollamaErr.message);
        if (!ANTHROPIC_API_KEY) {
          return res.status(500).json({ error: 'No AI backend available.' });
        }
        const result = await analyzeTranscript(segments, ANTHROPIC_API_KEY, language);
        topics = result.topics;
        model = 'claude';
      }
    } else {
      if (!ANTHROPIC_API_KEY) {
        return res.status(500).json({ error: 'No AI backend available.' });
      }
      const result = await analyzeTranscript(segments, ANTHROPIC_API_KEY, language);
      topics = result.topics;
      model = 'claude';
    }

    res.json({ topics, count: topics.length, videoId, model });
  } catch (error) {
    logErrorSafely(error, 'Error in AI analysis');
    const safeResponse = createSafeErrorResponse(error, 'AI analysis failed. Please try again.');
    res.status(500).json(safeResponse);
  }
});

/**
 * POST /api/ai/analyze-stream
 * Body: { segments: TranscriptSegment[], videoId: string }
 * Response: Server-Sent Events stream
 * Saves suggestions to Video.h5pContent in database
 */
router.post('/analyze-stream', auth, async (req, res) => {
  try {
    const parsed = analyzeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(formatValidationError(parsed.error));
    }

    const { segments, videoId, language = 'en' } = parsed.data;
    const { Video } = require('../models');

    // Verify video exists and user has access
    const video = await Video.findByPk(videoId);
    if (!video) {
      return res.status(400).json({ error: 'Video not found' });
    }
    if (video.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access to this video' });
    }

    // Daily AI limit: 3 videos/day for non-admin users
    if (req.user.role !== 'admin') {
      const { Op } = require('sequelize');
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
      const usedToday = await Video.count({
        where: {
          userId: req.user.id,
          aiProcessedAt: { [Op.between]: [todayStart, todayEnd] },
          id: { [Op.ne]: videoId },
        },
      });
      if (usedToday >= 3) {
        return res.status(429).json({ error: 'Daily AI limit reached. You can process up to 3 videos per day.' });
      }
    }

    // Stamp the video immediately so concurrent requests don't bypass the limit
    await video.update({ aiProcessedAt: new Date() });

    // Use the unified provider router: Groq → Ollama → Claude
    await analyzeTranscriptStream(segments, ANTHROPIC_API_KEY, res, videoId, video, language);
  } catch (error) {
    logErrorSafely(error, 'Error in AI streaming analysis');
    if (!res.headersSent) {
      const safeResponse = createSafeErrorResponse(error, 'AI analysis failed. Please try again.');
      res.status(500).json(safeResponse);
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
    logErrorSafely(error, 'Error injecting AI suggestions');
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return res.status(404).json({ error: error.message });
    }
    const safeResponse = createSafeErrorResponse(error, 'Failed to inject suggestions. Please try again.');
    res.status(500).json(safeResponse);
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

    const ollamaReadyForGenerate = await isOllamaAvailable();
    if (!ollamaReadyForGenerate && !ANTHROPIC_API_KEY) {
      return res.status(503).json({
        error: 'No AI backend available',
        code: 'MISSING_CONFIG',
        message: 'Either start Ollama (ollama serve) or set ANTHROPIC_API_KEY',
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

    // Step 2: Generate questions — Ollama first, then Claude
    let suggestions;
    if (ollamaReadyForGenerate) {
      try {
        const segs = Array.isArray(transcript) ? transcript : [];
        const ollamaResult = await analyzeTranscriptOllama(segs, req.body.language || 'en');
        // Map Ollama result to transcribe-and-generate format
        suggestions = ollamaResult.suggestions.map((s) => ({
          id: s.id,
          type: s.type === 'MultiChoice' ? 'multipleChoice' : s.type === 'TrueFalse' ? 'truefalse' : 'fillblank',
          timestamp: s.timestamp,
          question: s.config?.question || s.config?.text || '',
          answers: s.config?.answers ? s.config.answers.map((a) => a.text) : [],
          correctIndex: s.config?.answers ? s.config.answers.findIndex((a) => a.correct) : 0,
          explanation: s.reason || '',
          bloomsLevel: 'understand',
          concept: 'Key concept',
          difficulty: 0.5,
          accepted: false,
        }));
      } catch (ollamaErr) {
        console.warn('Ollama generation failed, falling back to Claude:', ollamaErr.message);
        suggestions = await generateQuestionsWithClaude(transcript, video.title, educationLevel, learningObjectives, questionDensity, questionTypes, req.body.language || 'en');
      }
    } else {
      suggestions = await generateQuestionsWithClaude(transcript, video.title, educationLevel, learningObjectives, questionDensity, questionTypes, req.body.language || 'en');
    }

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
    logErrorSafely(error, 'Error in transcribe-and-generate');
    const safeResponse = createSafeErrorResponse(error, 'Failed to generate interactive content');
    res.status(500).json({ 
      ...safeResponse,
      code: 'GENERATION_ERROR'
    });
  }
});

/**
 * Generate questions using Claude API
 * @private
 */
async function generateQuestionsWithClaude(transcript, videoTitle, educationLevel, objectives, density, types, language = 'en') {
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

    let prompt = `You are an expert educator and instructional designer. Analyze this educational video transcript and generate interactive learning questions.

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
    if (language === 'vi') {
      prompt += "\n\nIMPORTANT: Produce ALL textual fields (questions, answers, explanations, and short labels) in Vietnamese (Tiếng Việt). Preserve numeric timestamps and the JSON schema exactly. Return ONLY the JSON array.";
    }

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

/**
 * GET /api/ai/results/:videoId
 * Retrieve previously saved AI analysis results for a video
 */
router.get('/results/:videoId', auth, async (req, res) => {
  try {
    const { videoId } = req.params;
    const { Video } = require('../models');
    
    const video = await Video.findOne({
      where: { id: videoId, userId: req.user.id }
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (!video.captions) {
      return res.status(404).json({ error: 'No AI analysis found for this video', data: null });
    }

    // Parse captions if it's a string
    let captionData = video.captions;
    if (typeof captionData === 'string') {
      try {
        captionData = JSON.parse(captionData);
      } catch (e) {
        console.error('Failed to parse captions:', e);
        return res.status(500).json({ error: 'Failed to parse saved AI data' });
      }
    }

    res.json({
      topics: captionData.topics || [],
      suggestions: captionData.suggestions || [],
      generatedAt: captionData.generatedAt,
      // Return the AI-processed transcript segments if they were saved alongside topics
      transcriptSegments: captionData.segments || []
    });
  } catch (err) {
    console.error('Error retrieving AI results:', err);
    res.status(500).json({ error: 'Failed to retrieve AI data' });
  }
});

module.exports = router;
