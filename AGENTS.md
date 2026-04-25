# Active App Routing Rules

- Primary frontend: `frontend/` only.
- Primary frontend URL: `http://localhost:3002`.
- Primary backend URL: `http://localhost:5001`.
- Default start command from repo root: `npm run dev`.

## Do Not Default To Legacy UI

- Do not run or edit `Simple UX UI Design/` unless the user explicitly asks for that folder.
- If asked to "run the frontend", always run the main app on port `3002`.
- If a session detects the legacy UI on `5173`, switch back to the main app flow and report the correction.

## Verification Checklist

- Confirm frontend listener on `3002`.
- Confirm backend listener on `5001`.
- Confirm user-facing changes were applied in `frontend/src/**`.

## Planned Features (Not Yet Implemented)

### Basic Video Editing (client-side, FFmpeg WASM)
- Trim/cut: set in/out points on the timeline, re-encode the clip
- Split: divide a video at a timestamp into two segments
- Mute/audio adjust: silence or lower audio in a time range
- Crop/resize: change output resolution or frame area
- All editing happens in-browser before upload completes

### AI Transcript → Questions Pipeline
**Step 1 — Audio extraction:** FFmpeg (server-side) extracts audio from uploaded MP4/WebM/MOV as a temporary MP3/WAV file.

**Step 2 — Transcription with timestamps:** Audio is sent to **OpenAI Whisper API** (`whisper-1` model). Whisper returns a transcript with segment-level and optionally word-level timestamps. This is the recommended service because:
- Claude API does not accept audio input
- Whisper is purpose-built for ASR and gives accurate timestamps
- Cost: ~$0.006/minute (very cheap)
- Alternative: run `whisper.cpp` locally for zero API cost

**Step 3 — Question generation:** The transcript (with timestamps) is sent to **Claude API** (`claude-sonnet-4-6`). Prompt instructs Claude to identify key conceptual moments and return structured questions (Multiple Choice, True/False, Fill-in-the-Blank) each paired with a timestamp.

**Step 4 — Review UI:** Questions appear in an accept/reject panel in the Editor. Accepted questions are injected into the H5P timeline at their timestamps.

**Backend route to add:** `POST /api/ai/transcribe-and-generate` — accepts `videoId`, extracts audio, calls Whisper, calls Claude, returns `{ transcript, suggestions[] }`.

**Environment variables needed:**
- `OPENAI_API_KEY` — for Whisper transcription
- `ANTHROPIC_API_KEY` — already present, for Claude question generation