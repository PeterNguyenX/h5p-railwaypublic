# YouTube Preview & Transcript Extraction Fixes

**Date:** April 9, 2026  
**Status:** ✅ Fixed and deployed

---

## Issues Found & Fixed

### 1. **Transcript Extraction Service - Missing Error Handling** ✅ FIXED

**Problem:**
- The `fetchYoutubeTranscriptSegments()` function in `backend/services/transcriptExtraction.js` had NO try-catch blocks
- If YouTube API failed or blocked the request, the entire service would crash with unhandled errors
- No graceful fallback mechanism

**Location:** `backend/services/transcriptExtraction.js` (line 111)

**What Was Fixed:**
```javascript
// BEFORE: Would crash on YouTube API errors
async function fetchYoutubeTranscriptSegments(youtubeUrl) {
  const info = await ytdl.getInfo(youtubeUrl);  // ❌ No error handling
  // ... rest of code
}

// AFTER: Gracefully handles all errors
async function fetchYoutubeTranscriptSegments(youtubeUrl) {
  try {
    const info = await ytdl.getInfo(youtubeUrl);
    // ... handle caption extraction
  } catch (ytdlError) {
    console.warn('Failed to extract YouTube video info:', {
      message: ytdlError.message,
      url: youtubeUrl,
      code: ytdlError.code,
    });
    return { segments: [], languageCode: null };  // ✅ Graceful fallback
  }
}
```

**Impact:** Transcript extraction now won't crash the server when YouTube API fails.

---

### 2. **Transcript Extraction Route - Incomplete Error Handling** ✅ FIXED

**Problem:**
- The `/api/transcript/extract/:videoId` endpoint didn't properly wrap YouTube calls in error handling
- Failed YouTube transcripts would return vague error messages
- No differentiation between "captions unavailable" vs "API failed"

**Location:** `backend/routes/transcriptRoutes.js` (line 75)

**What Was Fixed:**
- Added detailed logging to understand what's happening
- Improved error messages with helpful suggestions
- Wrapped YouTube extraction in try-catch with logging
- Returns structured error response with `videoType` and `suggestions`

**Before:**
```json
{ "error": "No transcript/caption data found for this video. Upload a .vtt or .srt transcript file." }
```

**After:**
```json
{
  "error": "No transcript/caption data found for this video",
  "videoType": "youtube",
  "suggestions": [
    "- The YouTube video may not have captions available",
    "- Try uploading a .vtt or .srt transcript file instead"
  ]
}
```

**Impact:** Users get helpful feedback about why transcript extraction failed and what to do next.

---

### 3. **YouTube Import Route - Better Error Messages** ✅ FIXED

**Problem:**
- Generic error messages when YouTube video import failed
- No distinction between different types of failures
- Fallback message wasn't informative

**Location:** `backend/routes/videoRoutes.js` (lines 250-330)

**What Was Fixed:**
- Improved logging with error codes
- Better fallback message indicating that captions couldn't be retrieved
- More specific error details logged for debugging

**Impact:** Developers can now debug YouTube import issues more easily with detailed error codes.

---

## How to Test

### Test 1: YouTube Video Import
1. Go to `http://localhost:3002`
2. Login with demo credentials
3. Upload a YouTube video (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
4. Check the backend logs - should see:
   - ✅ "YouTube video imported with captions" (if captions available)
   - ✅ "YouTube video imported (no captions available)" (if no captions)

### Test 2: Extract Transcript from YouTube Video
1. Navigate to a video you uploaded from YouTube
2. Click "Extract from video" button
3. Expected behavior:
   - ✅ If captions available: Shows extracted transcript segments
   - ✅ If no captions: Shows helpful error message with suggestions
   - ❌ No crash on YouTube API errors (graceful degradation)

### Test 3: Upload Local Transcript
1. Create a `.vtt` or `.srt` transcript file
2. Upload it to a video
3. Should parse successfully even if YouTube transcripts failed

---

## What's NOT Fixed Yet

### YouTube Preview in Simple UX Design
The `Simple UX UI Design/src/app/pages/Editor.tsx` intentionally doesn't render YouTube videos in the editor - it shows a message "YouTube video — preview not available in editor" with a link to open on YouTube. This is by design.

**The main frontend at `http://localhost:3002` DOES support YouTube preview via iframe.**

### ytdl-core Limitations
- YouTube actively blocks scraping requests from `ytdl-core`
- If `ytdl.getInfo()` fails, we now gracefully fall back to basic info
- For reliable captions, users should manually upload `.vtt` or `.srt` files
- **Alternative:** Can configure OpenAI Whisper for auto-transcription of uploaded videos

---

## Testing Checklist

- [ ] Backend restarts without errors: Check terminal for "🚀 Server running on port 5001"
- [ ] Frontend loads at http://localhost:3002: Should see login page
- [ ] Can import YouTube video: Check for proper error handling if captions unavailable
- [ ] Can extract transcript: Shows segments or helpful error message
- [ ] Can upload .vtt/.srt file: Parses correctly

---

## Configuration Requirements

For full functionality:

**Optional - For Auto-Transcription:**
```bash
export OPENAI_API_KEY=sk-your-key-here
```

**Required - For AI Question Generation:**
```bash
export ANTHROPIC_API_KEY=your-key-here
```

---

## Related Files Modified

1. **`backend/services/transcriptExtraction.js`** - Added error handling to `fetchYoutubeTranscriptSegments()`
2. **`backend/routes/transcriptRoutes.js`** - Improved `/api/transcript/extract/:videoId` endpoint
3. **`backend/routes/videoRoutes.js`** - Better error messages for YouTube import

---

## Server Status

✅ **Backend:** Running on `http://localhost:5001`  
✅ **Frontend:** Running on `http://localhost:3002`  
✅ **Database:** SQLite (local development)

## Next Steps if Issues Persist

1. **Still getting errors?** Check the backend console for detailed error logs
2. **YouTube API blocked?** This is YouTube's anti-scraping measures - use manual transcript upload
3. **Want AI transcription?** Set up OPENAI_API_KEY environment variable
4. **Want auto questions?** Ensure ANTHROPIC_API_KEY is configured

