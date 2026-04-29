# Session 2 Changes — AI Pipeline Rewrite + Editor/Dashboard Overhaul

**Date:** 2026-04-28  
**Scope:** Full AI pipeline rearchitecture (one Claude call), Dashboard UX fixes, Editor YouTube API + student preview popup, plus bugs found and fixed in verification pass.

---

## Files changed (complete list)

| File | Change type |
|------|------------|
| `backend/services/aiService.js` | Complete rewrite — single Claude call |
| `backend/services/h5pService.js` | Bug fix — DB-backed storage |
| `backend/services/aiInjectionService.js` | Bug fix — remove duplicate DB writes |
| `backend/routes/h5pRoutes.js` | Bug fix — dead routes, ownership checks |
| `backend/routes/aiRoutes.js` | Bug fix — `POST /analyze` used `result.suggestions`, now uses `result.topics` |
| `Simple UX UI Design/src/lib/api.ts` | Types added — `TopicNode`, `TopicQuestion`, updated `SSEPayload` |
| `Simple UX UI Design/src/lib/editorStore.ts` | Major rewrite — algorithm extracts suggestions from topics tree |
| `Simple UX UI Design/src/app/pages/Dashboard.tsx` | UX fixes — context menu, trash persistence, card click |
| `Simple UX UI Design/src/app/pages/Editor.tsx` | Features + stale closure fix |

---

## 1. `backend/services/aiService.js` — Single Claude call

**Architecture change:** Previously returned `{ suggestions: [...] }` with flat list. Now returns `{ topics: [...] }` containing topic tree with questions embedded.

### AI output format
```json
{
  "topics": [{
    "title": "...", "start": 0, "end": 120,
    "subtopics": [{ "title": "...", "start": 0, "end": 60, "question": { ... } }],
    "question": { "type": "TrueFalse", "question": "...", "correct": true, "feedback": {...} }
  }]
}
```

### Key implementation details
- **Model:** `claude-sonnet-4-20250514`, `max_tokens: 6000`
- **Zod validation:** `TopicSchema` is recursive via `z.lazy()` for subtopics
- **3 question types only:** `MultiChoice`, `TrueFalse`, `FillBlanks`
- **SSE streaming:** `{ type: 'result', topics: [...] }` — NOT `suggestions`
- **Explicit percent values:** 10% → 22% → 35% → 42% → 42–82% (streaming) → 87%
- **`extractJsonObject()`** handles both clean JSON and markdown-fenced output

### SSE events format
```
{ type: 'progress', message: '...', percent: 10 }
{ type: 'chunk',    text: '...',    percent: 42-82 }
{ type: 'result',   topics: [...] }
{ type: 'error',    message: '...' }
```

---

## 2. `backend/services/h5pService.js` — DB persistence

**Bug fixed:** `this.contentStorage = new Map()` was the primary store — wiped on every server restart. All 4 methods now fully DB-backed.

| Method | Before | After |
|--------|--------|-------|
| `createTimeBasedContent` | In-memory Map only | Writes full `{ id, library, params, metadata, timestamp, status }` to DB |
| `updateContent` | Map lookup → crash on restart | Scans all videos by `c.id`, updates in DB |
| `deleteContent` | `Map.delete()` only | Scans all videos by `c.id`, splices from DB array |
| `getVideoContent` | From Map | From DB, filters `c.id && c.library` (drops old `{ contentId }` shape) |

---

## 3. `backend/services/aiInjectionService.js`

**Bug fixed:** `injectAll` was calling `video.update({ h5pContent: [...] })` after `injectSuggestion` already wrote to DB via `h5pService.createTimeBasedContent`. Removed the duplicate write.

---

## 4. `backend/routes/h5pRoutes.js`

- `POST /video/:videoId` — removed manual DB push (service handles it); added ownership check
- `PUT /content/:contentId` — removed broken LIKE query; calls `h5pService.updateContent`
- `POST /content` — was using undefined `h5p` variable → replaced with `410 Gone`

---

## 5. `backend/routes/aiRoutes.js` — CRITICAL BUG FIXED

**Bug:** `POST /analyze` (non-streaming route) read `result.suggestions` after calling `analyzeTranscript`. But `analyzeTranscript` now returns `{ topics }`, so `suggestions` was `undefined` → crash.

**Fix:** Updated route to read `result.topics` and return `{ topics, count, videoId, model }`. Removed the broken DB write logic that mapped suggestions → h5pContent (the frontend algorithm handles this now, not the non-streaming route).

```javascript
// BEFORE (broken)
const result = await analyzeTranscript(segments, ANTHROPIC_API_KEY);
suggestions = result.suggestions;  // undefined! analyzeTranscript returns { topics }

// AFTER (fixed)
const result = await analyzeTranscript(segments, ANTHROPIC_API_KEY);
topics = result.topics;
res.json({ topics, count: topics.length, videoId, model });
```

---

## 6. `src/lib/api.ts` — New types

```typescript
export interface TopicQuestion {
  type: 'MultiChoice' | 'TrueFalse' | 'FillBlanks';
  question?: string;
  answers?: Array<{ text: string; correct: boolean }>;
  correct?: boolean;
  fillText?: string;
  feedback: { correct: string; incorrect: string };
}

export interface TopicNode {
  title: string;
  start: number;
  end: number;
  subtopics?: TopicNode[];
  question?: TopicQuestion;
}

// SSEPayload result variant:
// BEFORE: | { type: 'result'; suggestions: AISuggestion[] }
// AFTER:  | { type: 'result'; topics: TopicNode[] }
```

---

## 7. `src/lib/editorStore.ts` — Algorithm replaces AI filtering

### Removed
- `ALLOWED_AI_TYPES` filter (AI only returns 3 valid types now)
- `event.suggestions` result handler

### Added

**`H5P_TYPE_MAP`** (inline — no import needed):
```typescript
const H5P_TYPE_MAP = {
  MultiChoice: 'H5P.MultiChoice 1.16',
  TrueFalse: 'H5P.TrueFalse 1.6',
  FillBlanks: 'H5P.Blanks 1.14',
};
```

**`buildSuggestion(question, timestamp, nodeTitle) → AISuggestion`**  
Converts a `TopicQuestion` from the AI into the `AISuggestion` shape the injection service expects:
- MultiChoice: `config = { question, answers }`
- TrueFalse: `config = { question, correct: 'true'|'false' }` ← string, not boolean (H5P format)
- FillBlanks: `config = { text: fillText, showSolutions: 'end', autoCheck: false }` ← key is `text`, not `fillText`

**`extractSuggestions(topics, existingTimestamps) → AISuggestion[]`**  
Depth-first walk of topic tree:
- `timestamp = Math.round(node.end) + 1` — question appears right after topic ends
- 30-second window deduplication (`Math.floor(timestamp / 30)`)
- 5-second collision avoidance against existing H5P content
- Subtopics walked before parent (inner topics first, then outer)

**New store fields:**
```typescript
topics: TopicNode[];
setTopics: (t: TopicNode[]) => void;
```

**Updated `result` handler:**
```typescript
case 'result': {
  const suggestions = extractSuggestions(event.topics, existingTimestamps);
  set({ topics: event.topics, suggestions, ... });
  get().injectAccepted(videoId);
}
```

---

## 8. `Dashboard.tsx` — Three UX fixes

### Fix 1: Context menu at mouse cursor
```tsx
// BEFORE: className="... top-24 right-5"
// AFTER:
style={{
  top: Math.min(contextMenu.y, window.innerHeight - 380),
  left: Math.min(contextMenu.x, window.innerWidth - 270),
}}
```

### Fix 2: Trash persistence bug
**Root cause:** Save `useEffect` fires on mount with empty state, BEFORE async `fetchVideos()` + `loadState()` completes. This overwrites localStorage with empty data, causing trashed videos to reappear on refresh.

**Fix:** `initialLoadDone = useRef(false)` set to `true` at the end of the async load. The save effect returns early if `!initialLoadDone.current`.

```typescript
const initialLoadDone = useRef(false);

// In load effect, at the end:
initialLoadDone.current = true;

// In save effect:
if (!user?.id || !initialLoadDone.current) return;
```

### Fix 3: Card fully clickable, no Preview button
- Card `div` has `onClick={() => selectedFolder !== "trash" && openVideo(video.id)}`
- Hover overlay: play button icon, `pointer-events-none` (visual only)
- Removed "Preview" text button from card body
- Trash action buttons use `e.stopPropagation()` to avoid opening video when clicking Restore/Delete

---

## 9. `Editor.tsx` — Four features + stale closure fix

### Feature 1: Status badge removed
Removed `Ready`/`Draft` badge from editor header. Videos have no status concept in the UI.

### Feature 2: YouTube IFrame Player API

**Why:** Regular `<iframe>` embed has no JS API — can't get `currentTime`, can't seek, can't pause. Replaced with `window.YT.Player` mounted on a `<div>`.

**Setup pattern:**
```typescript
// Loads YouTube script once globally
if (window.YT?.Player) { initPlayer(); }
else { window.onYouTubeIframeAPIReady = initPlayer; /* + append script */ }

// Player mounted on div ref:
ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, { videoId, ... });
```

**Polling:** `setInterval` at 300ms — only runs when `PlayerState.PLAYING`. Clears on pause/end/unmount.  
**Enabled by:** `getCurrentTime()`, `getDuration()`, `seekTo(t, true)`, `pauseVideo()`, `playVideo()`.

### Bug fixed: Stale closure in YouTube polling

**Problem:** `startPolling` captured `checkInteractionTrigger` at the time the YouTube `useEffect` ran. When `store.h5pContents` changed later (AI added interactions), `checkInteractionTrigger` got a new reference but the interval still called the old one with stale h5pContents — new interactions would never trigger the popup.

**Fix:** Store h5pContents in a ref, kept in sync on every render. `checkInteractionTriggerWithRef` reads from the ref at call time, so it always has the latest content. The YouTube polling calls `checkInteractionTriggerWithRef` (stable reference, no deps).

```typescript
// Ref always has latest h5pContents
const h5pContentsRef = useRef(store.h5pContents);
useEffect(() => { h5pContentsRef.current = store.h5pContents; }, [store.h5pContents]);

// Also ref for videoDuration (avoids stale 0 in YouTube polling)
const videoDurationRef = useRef(0);

// Stable callback — reads ref at call time
const checkInteractionTriggerWithRef = useCallback((t: number) => {
  for (const c of h5pContentsRef.current) { /* ... */ }
}, []); // empty deps — stable forever

// Alias for local video onTimeUpdate
const checkInteractionTrigger = checkInteractionTriggerWithRef;
```

### Feature 3: TopicsPanel

After AI runs, the left panel switches from flat segment list to a collapsible topic tree.

**Priority:** `topics.length > 0` → TopicsPanel | `segments.length > 0` → TranscriptPanel | else → empty state

**Interaction:**
- Click topic → expand subtopics + seek to topic start
- Click subtopic → expand raw segments in time range + seek
- Click segment → seek to segment start
- Active topic/subtopic highlighted based on `currentTime`

### Feature 4: InteractionPreview (student-facing popup)

When playback reaches an interaction's timestamp, video pauses and a modal appears.

**Trigger logic** (runs on every tick):
- `triggeredTimestampsRef: Set<number>` — prevents re-triggering same timestamp
- Backward seek: clears triggered timestamps > new time
- Fires when `Math.floor(currentTime) >= Math.floor(content.timestamp)` within 2-second window

**Modal features:**
- MultiChoice: selectable options, correct highlighted green / wrong red on submit
- TrueFalse: True/False buttons, same visual feedback
- FillBlanks: text input, checks against `*asterisk*` blanks (case-insensitive)
- "Skip" → immediate continue without submitting
- "Submit" → check + show feedback → "Continue" button resumes video

---

## Architecture decisions

| Decision | Reason |
|----------|--------|
| AI returns topic tree, algorithm converts to H5P | Reduces AI cost — algorithm does the mechanical work |
| `timestamp = node.end + 1` | Question fires right after the topic it covers ends |
| Window rule in algorithm, not AI prompt | Algorithm has full context of existing content; AI doesn't need to |
| YouTube IFrame API instead of `<iframe>` embed | Only way to get `getCurrentTime`, seekTo, pause/resume |
| `h5pContentsRef` for interaction trigger | Avoids stale closure in YouTube polling interval |
| `initialLoadDone` ref in Dashboard | Prevents race condition where mount-time save overwrites localStorage |
| `POST /analyze` non-streaming returns `{ topics }` | Consistent with streaming route; frontend algorithm converts to suggestions |

---

## Known remaining items (not implemented)

- `backend/routes/projects.js` — returns mock data, no real DB query
- `backend/routes/lti.js` — LTI 1.3 spec compliance incomplete  
- Password reset UI (API endpoints exist at `/api/auth/forgot-password`, `/api/auth/reset-password`)
- Real-time collaboration (Socket.io in backend, no frontend client)
- i18n for `Simple UX UI Design/` frontend (only `frontend/` CRA app has it)
- `AdminUserSettings.tsx` page — route exists, page is mostly empty

---

## Verification checklist (all passing as of 2026-04-28)

- [x] `npm run build` in `Simple UX UI Design/` — clean, 0 errors
- [x] `node server.js` — starts, DB connects, H5P initializes
- [x] `GET /api/health` → `{ status: 'ok' }`
- [x] `GET /api/h5p/status` → `{ h5pServiceLoaded: true, availableLibraries: [6] }`
- [x] Backend port: 5001 | Frontend port: 3002
