/**
 * AI Service — Claude API integration.
 * One Claude call: receives transcript → returns topic structure + questions.
 * Algorithm (not AI) handles: timestamp assignment, window deduplication, H5P creation.
 * See backend/ai-instructions.md for pedagogy rules.
 */

const { z } = require('zod');

const AI_SYSTEM_PROMPT = `You are an expert instructional designer. Analyze the timestamped lecture transcript and return a structured JSON object containing topics, subtopics, and one quiz question per node. Return ONLY a valid JSON object — no markdown, no code fences, no preamble, no trailing text.

══════════════════════════
STEP 1 — TOPIC SEGMENTATION
══════════════════════════
Identify 2–5 main topics and 1–3 subtopics per topic.

Detect topic boundaries using:
• Transition markers: "Next", "Moving on", "Now let's", "Another", "Finally", "Turning to", "Let me now"
• Summary cues: "To summarize", "In conclusion", "To wrap up", "The key takeaway", "So in short"

Use the actual segment timestamps from the transcript for start/end values.
Topics must be non-overlapping and cover the full transcript.

══════════════════════════
STEP 2 — QUESTION GENERATION
══════════════════════════
Generate ONE question per topic/subtopic using this pattern matrix:
• Definition / technical term ("X is...", "Y stands for..."): → "FillBlanks"
• Binary fact / absolute rule ("always", "never", true/false claim): → "TrueFalse"
• List / comparison / process / category: → "MultiChoice"

ONLY these 3 types: "MultiChoice", "TrueFalse", "FillBlanks"

══════════════════════════
OUTPUT SCHEMA (follow exactly)
══════════════════════════
{
  "topics": [
    {
      "title": "<topic name>",
      "start": <number, seconds>,
      "end": <number, seconds>,
      "subtopics": [
        {
          "title": "<subtopic name>",
          "start": <number, seconds>,
          "end": <number, seconds>,
          "question": {
            "type": "MultiChoice",
            "question": "<non-empty question string>",
            "answers": [
              {"text": "<correct answer>", "correct": true},
              {"text": "<plausible distractor>", "correct": false},
              {"text": "<plausible distractor>", "correct": false},
              {"text": "<plausible distractor>", "correct": false}
            ],
            "feedback": {"correct": "<why correct>", "incorrect": "<what is right>"}
          }
        }
      ],
      "question": {
        "type": "TrueFalse",
        "question": "<declarative statement>",
        "correct": true,
        "feedback": {"correct": "<confirmation>", "incorrect": "<correction>"}
      }
    }
  ]
}

FillBlanks question format:
{ "type": "FillBlanks", "fillText": "<sentence with *key term* in asterisks>", "feedback": {"correct": "...", "incorrect": "..."} }

══════════════════════════
RULES
══════════════════════════
- start/end must be real numbers from the transcript segment timestamps
- Every string field must be non-empty
- MultiChoice: exactly 4 answers, exactly 1 correct
- TrueFalse: "correct" must be a boolean (true or false), not a string
- FillBlanks: wrap only the key term in *single asterisks*
- Distractors must come from elsewhere in the transcript (plausible but wrong)`;

// ─── Zod schemas ───────────────────────────────────────────────────────────────

const QuestionSchema = z.object({
  type: z.enum(['MultiChoice', 'TrueFalse', 'FillBlanks']),
  question: z.string().optional(),
  answers: z.array(z.object({ text: z.string(), correct: z.boolean() })).optional(),
  correct: z.boolean().optional(),
  fillText: z.string().optional(),
  feedback: z.object({ correct: z.string(), incorrect: z.string() }),
});

// Recursive topic schema using z.lazy
const TopicSchema = z.lazy(() =>
  z.object({
    title: z.string(),
    start: z.number(),
    end: z.number(),
    subtopics: z.array(TopicSchema).optional(),
    question: QuestionSchema.optional(),
  })
);

const ResponseSchema = z.object({
  topics: z.array(TopicSchema),
});

const H5P_TYPE_MAP = {
  MultiChoice: 'H5P.MultiChoice 1.16',
  TrueFalse: 'H5P.TrueFalse 1.6',
  FillBlanks: 'H5P.Blanks 1.14',
};

function formatSegmentsForPrompt(segments) {
  return segments
    .map(seg => {
      const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
      return `[${fmt(seg.start)} → ${fmt(seg.end)}] ${seg.text}`;
    })
    .join('\n');
}

function extractJsonObject(text) {
  try { return JSON.parse(text.trim()); } catch { /* fall through */ }
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object found in AI response');
  return JSON.parse(match[0]);
}

async function analyzeTranscript(segments, apiKey) {
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');
  if (!segments?.length) throw new Error('No transcript segments provided');

  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 6000,
    system: AI_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Transcript:\n\n${formatSegmentsForPrompt(segments)}\n\nReturn the JSON object now.` }]
  });

  const text = response.content.find(b => b.type === 'text')?.text || '';
  const parsed = ResponseSchema.parse(extractJsonObject(text));
  return { topics: parsed.topics };
}

async function analyzeTranscriptStream(segments, apiKey, res, videoId, video) {
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');
  if (!segments?.length) throw new Error('No transcript segments provided');

  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const send = (payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`);

  let fullText = '';

  try {
    send({ type: 'progress', message: 'Analyzing transcript structure...', percent: 10 });
    send({ type: 'progress', message: 'Identifying topics and subtopics...', percent: 22 });
    send({ type: 'progress', message: 'Mapping questions to content patterns...', percent: 35 });

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      system: AI_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Transcript:\n\n${formatSegmentsForPrompt(segments)}\n\nReturn the JSON object now.` }],
    });

    send({ type: 'progress', message: 'Generating questions with AI...', percent: 42 });

    stream.on('text', (text) => {
      fullText += text;
      const percent = Math.min(82, 42 + Math.round((fullText.length / 5000) * 40));
      send({ type: 'chunk', text, percent });
    });

    await stream.finalMessage();
    send({ type: 'progress', message: 'Organizing topic structure...', percent: 87 });

    let parsed;
    try {
      parsed = ResponseSchema.parse(extractJsonObject(fullText));
    } catch (e) {
      send({ type: 'error', message: `AI returned invalid structure: ${e.message}` });
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Convert topics to suggestions format (include both topics and their questions with correct timestamps)
    const suggestions = [];
    parsed.topics.forEach(topic => {
      // Add topic as a suggestion if it has a question
      if (topic.question) {
        suggestions.push({
          id: `topic-${topic.title.replace(/\s+/g, '-')}-${topic.start}`,
          type: topic.question.type,
          timestamp: topic.start,
          text: topic.title,
          status: 'pending',
          config: topic.question,
          isTopicLevel: true
        });
      }
      // Add subtopics as suggestions
      if (topic.subtopics && Array.isArray(topic.subtopics)) {
        topic.subtopics.forEach(subtopic => {
          if (subtopic.question) {
            suggestions.push({
              id: `subtopic-${subtopic.title.replace(/\s+/g, '-')}-${subtopic.start}`,
              type: subtopic.question.type,
              timestamp: subtopic.start,
              text: subtopic.title,
              status: 'pending',
              config: subtopic.question,
              parentTopic: topic.title
            });
          }
        });
      }
    });

    // Persist both raw topics and suggestions to DB as stringified JSON
    if (videoId && video) {
      try {
        await video.update({
          captions: JSON.stringify({
            topics: parsed.topics,
            suggestions: suggestions,
            generatedAt: new Date().toISOString()
          })
        });
        console.log(`[AI] Persisted AI results for video ${videoId} with ${suggestions.length} suggestions`);
      } catch (e) {
        console.error('Failed to persist topics snapshot:', e.message);
      }
    }

    send({ type: 'result', suggestions: suggestions });
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    const msg = error.status === 401 ? 'Invalid Anthropic API key'
      : error.status === 429 ? 'Rate limit exceeded — please wait and try again'
      : error.message || 'AI analysis failed';
    send({ type: 'error', message: msg });
    res.write('data: [DONE]\n\n');
    res.end();
  }
}

module.exports = {
  analyzeTranscript,
  analyzeTranscriptStream,
  AI_SYSTEM_PROMPT,
  H5P_TYPE_MAP,
  formatSegmentsForPrompt,
};
