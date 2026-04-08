# AI Video Transformation API Documentation

## Overview
Transform teaching videos into interactive H5P content with AI-generated questions using OpenAI Whisper for transcription and Claude for question generation.

## Endpoint: `POST /api/ai/transcribe-and-generate`

### Purpose
Analyzes a teaching video's transcript and generates appropriate educational questions with careful timestamp placement and Bloom's taxonomy alignment.

### Authentication
Required: Bearer token with valid user session

### Request

```javascript
POST /api/ai/transcribe-and-generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "videoId": "550e8400-e29b-41d4-a716-446655440000",
  "educationLevel": "high-school",                    // optional: default "high-school"
  "learningObjectives": ["Understanding photosynthesis", "Analyzing cellular processes"],  // optional
  "questionDensity": "moderate",                      // optional: sparse|moderate|dense
  "questionTypes": ["multipleChoice", "truefalse", "fillblank"]  // optional
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `videoId` | UUID | Yes | The unique identifier of the video to transform |
| `educationLevel` | string | No | Target education level: `high-school`, `undergraduate`, `professional`. Default: `high-school` |
| `learningObjectives` | array | No | Array of learning objective strings to guide question generation |
| `questionDensity` | string | No | How many questions to generate: `sparse` (~1-5), `moderate` (~5-10), `dense` (~10-15). Default: `moderate` |
| `questionTypes` | array | No | Types of questions to generate. Default: `["multipleChoice", "truefalse", "fillblank"]` |

### Response (Success - 200)

```json
{
  "success": true,
  "videoId": "550e8400-e29b-41d4-a716-446655440000",
  "transcript": {
    "fullText": "Today we're going to learn about photosynthesis...",
    "segments": [
      {
        "start": 0,
        "end": 30,
        "text": "Today we're going to learn about photosynthesis..."
      }
    ],
    "wordCount": 2847
  },
  "suggestions": [
    {
      "id": "q-1712596800000-0",
      "type": "multipleChoice",
      "timestamp": 45,
      "question": "What is the primary product of the light-dependent reactions in photosynthesis?",
      "answers": [
        "Glucose",
        "ATP and NADPH",
        "Oxygen and water",
        "Carbon dioxide"
      ],
      "correctIndex": 1,
      "explanation": "The light-dependent reactions produce ATP and NADPH, which are energy carriers. These are used in the light-independent reactions (Calvin cycle) to produce glucose. Oxygen is a byproduct, not the primary product.",
      "bloomsLevel": "remember",
      "concept": "Photosynthetic reaction stages",
      "difficulty": 0.4
    },
    {
      "id": "q-1712596800000-1",
      "type": "truefalse",
      "timestamp": 120,
      "question": "Photosynthesis occurs exclusively in the chloroplast.",
      "answers": ["True", "False"],
      "correctIndex": 1,
      "explanation": "While photosynthesis primarily occurs in chloroplasts, the light-dependent reactions occur in the thylakoid membranes and the light-independent reactions in the stroma. However, it's accurate to say photosynthesis occurs in the chloroplast overall.",
      "bloomsLevel": "understand",
      "concept": "Cellular location of photosynthesis",
      "difficulty": 0.5
    }
  ],
  "metadata": {
    "videoDuration": "12:34",
    "videoTitle": "Introduction to Photosynthesis",
    "educationLevel": "high-school",
    "questionDensity": "moderate",
    "questionCount": 8,
    "generationTime": 3240,
    "transcriptSource": "youtube",
    "timestamp": "2026-04-09T18:41:40.834Z"
  }
}
```

### Response Format Details

#### Question Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique question identifier for tracking acceptance/rejection |
| `type` | string | Question type: `multipleChoice`, `truefalse`, `fillblank`, `shortanswer` |
| `timestamp` | number | Seconds in video where question should appear |
| `question` | string | Question text |
| `answers` | array | Answer options (for MC: 3-4 options, True/False: 2 options) |
| `correctIndex` | number | 0-based index of correct answer in answers array |
| `explanation` | string | Explanation for why answer is correct and others wrong |
| `bloomsLevel` | string | Cognitive level: `remember`, `understand`, `apply`, `analyze`, `evaluate`, `create` |
| `concept` | string | Key concept this question tests |
| `difficulty` | number | Estimated difficulty (0-1, where 0.5 is moderate) |
| `accepted` | boolean | Whether user has accepted this question |

### Transcript Sources
- **existing**: Captions already attached to video
- **youtube**: Extracted from YouTube video using YouTube API
- **whisper**: (Future) Auto-transcribed using OpenAI Whisper API
- **uploaded**: (Future) Uploaded .vtt or .srt file

### Error Responses

#### 400 Bad Request
```json
{
  "error": "No transcript available for this video",
  "code": "NO_TRANSCRIPT",
  "message": "Upload a transcript file or use a YouTube video with captions enabled"
}
```

#### 403 Forbidden
```json
{
  "error": "Unauthorized access to this video"
}
```

#### 404 Not Found
```json
{
  "error": "Video not found",
  "code": "VIDEO_NOT_FOUND"
}
```

#### 500 Server Error
```json
{
  "error": "Question generation failed: Claude API error",
  "code": "GENERATION_ERROR"
}
```

### Use Cases

#### 1. High School Biology Video
```bash
curl -X POST http://localhost:5001/api/ai/transcribe-and-generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "550e8400-e29b-41d4-a716-446655440000",
    "educationLevel": "high-school",
    "learningObjectives": ["Understanding photosynthesis", "Comparing light and dark reactions"],
    "questionDensity": "moderate"
  }'
```

#### 2. Professional Training Video
```bash
curl -X POST http://localhost:5001/api/ai/transcribe-and-generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "6f8e3f0e-5a2c-4d3e-8c1f-7a8b9c0d1e2f",
    "educationLevel": "professional",
    "learningObjectives": ["Applying new compliance procedures"],
    "questionDensity": "dense",
    "questionTypes": ["multipleChoice", "fillblank"]
  }'
```

### Next Steps: Accept/Reject Questions

After reviewing suggestions, teachers use a follow-up interface to:
1. **Accept** desirable questions
2. **Reject** inappropriate ones
3. **Edit** question text or options
4. **Reorder** by timestamp

Then convert accepted questions to H5P Interactive Video content.

### Configuration

Required environment variables:
```bash
ANTHROPIC_API_KEY=sk-ant-xyz...   # Claude API key for question generation
OPENAI_API_KEY=sk-xyz...          # (Future) Whisper API for transcription
```

### Performance Notes

- **Generation time**: ~30-60 seconds for typical video (depending on API response time)
- **Question limit**: Maximum 20 questions returned per request
- **Rate limiting**: Subject to `/api/ai` rate limits (500 req/15min in development)
- **Cost**: ~$0.003-0.01 per request depending on transcript length

### Integration Example (Frontend)

```typescript
async function transformVideoToInteractive(videoId: string) {
  const response = await fetch('/api/ai/transcribe-and-generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      videoId,
      educationLevel: 'high-school',
      questionDensity: 'moderate'
    })
  });

  const data = await response.json();
  
  // Show question review panel
  displayQuestionReviewPanel(data.suggestions);
  
  // Store transcript for reference
  saveTranscript(data.transcript);
}
```

---

## Related Endpoints

- `POST /api/ai/analyze` - Analyze existing transcript segments with Claude
- `POST /api/transcript/extract/{videoId}` - Get transcript with timestamps
- `POST /api/ai/inject` - Inject accepted questions into H5P content
