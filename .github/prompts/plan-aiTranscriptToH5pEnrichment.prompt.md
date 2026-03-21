## Plan: AI Transcript-to-H5P Enrichment (Current Stack)

Implement the requested AI enrichment feature in the existing Express + CRA architecture, not Next.js, by reusing current transcript parsing, Claude analysis, streaming SSE, and H5P injection services. Prioritize compatibility and non-breaking integration by adding isolated routes, MobX-backed UI editor screens, and typed interfaces first, then adding rerun + diff behavior.

**Steps**
1. Phase 1: Baseline and safety guardrails
2. Confirm and document current integration points to preserve behavior: transcript parsing, AI analysis routes, H5P content creation, video interaction rendering. Depends on no prior step.
3. Define explicit mapping from prompt structure to this repo structure so implementation is deterministic:
4. app/api/ai/analyze/route.ts maps to backend/routes/aiRoutes.js and a new dedicated backend/routes/aiEnrichmentRoutes.ts if separation is needed.
5. app/api/h5p/inject/route.ts maps to backend/routes/h5pRoutes.js or new backend/routes/aiEnrichmentRoutes.ts.
6. app/editor/page.tsx maps to frontend/src/pages/AIEnrichmentEditor.tsx plus route registration in frontend/src/App.tsx.
7. lib/* and hooks/* map to frontend/src/lib/* and frontend/src/hooks/* (or backend/services/* for server-only concerns).
8. Add a no-regression contract: existing routes and payload shapes remain backward-compatible. Depends on step 2.
9. Phase 2: Types and parser foundation
10. Introduce shared TypeScript types for transcript, suggestions, H5P type union, and API request/response contracts in frontend/src/types and backend/types. Depends on step 8.
11. Build reusable transcript parser utility for SRT/VTT as TypeScript module, using current parser behavior as reference and keeping segment schema {start, end, text}. Depends on step 10.
12. Add parser tests for malformed timestamps, overlapping ranges, empty captions, UTF-8 text, and mixed line endings. Parallel with step 13 after step 11 starts.
13. Phase 3: AI analysis pipeline with structured output and streaming
14. Add/extend backend analysis endpoint to accept transcript segments and validate input with zod before calling Claude. Depends on step 10.
15. Embed the exact required system prompt text verbatim and enforce strict JSON extraction/validation for suggestion objects. Depends on step 14.
16. Implement streaming progress events over SSE from backend to frontend with event types like started, chunk, parsed, validated, completed, failed. Depends on step 14.
17. Persist raw AI response and parsed suggestions in frontend MobX store state (or keep current store architecture consistently, no Zustand migration in this scope). Depends on step 16.
18. Phase 4: Enrichment editor UI
19. Build editor page with three-panel layout: left video player, center transcript with markers, right suggestion cards. Depends on step 17.
20. Create reusable UI components equivalent to requested structure in frontend/src/components/editor: VideoPlayer, TranscriptPanel, SuggestionCard, SuggestionEditor, StagingBar. Depends on step 19.
21. Implement suggestion actions: accept, reject, inline edit with prefilled config forms and local staged state transitions. Depends on step 20.
22. Add timestamp sync behavior so transcript marker focus follows current video time and card clicks seek video. Parallel with step 21 after step 20.
23. Phase 5: H5P injection and rerun/diff
24. Implement apply-changes flow: iterate accepted suggestions, call existing H5P creation services, attach to video timestamps, return updated enriched video object. Depends on step 21.
25. Implement rerun analysis on transcript/video edits while preserving previous accepted set snapshot. Depends on step 21.
26. Build diff view that compares current suggestions vs prior accepted suggestions and highlights new/changed/removed items. Depends on step 25.
27. Phase 6: Documentation and integration readiness
28. Add README section titled AI H5P Feature covering setup, ANTHROPIC_API_KEY, usage flow, and known limitations. Depends on step 24.
29. Produce integration checklist: packages to install, env vars, minor existing-file imports/routes to register, and manual H5P type registration steps. Depends on step 28.

**Relevant files**
- [backend/server.js](backend/server.js) — route registration pattern to preserve
- [backend/routes/aiRoutes.js](backend/routes/aiRoutes.js) — existing Claude analysis and stream endpoints
- [backend/routes/h5pRoutes.js](backend/routes/h5pRoutes.js) — H5P creation/injection API patterns
- [backend/routes/transcriptRoutes.js](backend/routes/transcriptRoutes.js) — transcript upload and parsing entry points
- [backend/services/aiService.js](backend/services/aiService.js) — model usage and suggestion generation core
- [backend/services/aiInjectionService.js](backend/services/aiInjectionService.js) — batch suggestion injection logic
- [backend/services/h5pService.js](backend/services/h5pService.js) — timestamp-based H5P creation and packaging
- [backend/services/transcriptParser.js](backend/services/transcriptParser.js) — current parser behavior baseline
- [backend/models/Video.js](backend/models/Video.js) — timestamped interaction persistence fields
- [frontend/src/App.tsx](frontend/src/App.tsx) — editor route wiring
- [frontend/src/components/VideoPlayer.tsx](frontend/src/components/VideoPlayer.tsx) — player/timestamp sync patterns
- [frontend/src/stores/aiEnrichmentStore.ts](frontend/src/stores/aiEnrichmentStore.ts) — state shape to extend for raw response, staged suggestions, diff snapshots
- [frontend/src/services/aiService.ts](frontend/src/services/aiService.ts) — frontend API service integration baseline
- [frontend/README.md](frontend/README.md) — add feature documentation if root README is not primary
- [README.md](README.md) — preferred location for AI H5P Feature section if present
- New files to add (planned, equivalent mapping): backend/routes/aiEnrichmentRoutes.ts, backend/services/aiAnalysisPipeline.ts, frontend/src/pages/AIEnrichmentEditor.tsx, frontend/src/components/editor/*, frontend/src/lib/transcript/parser.ts, frontend/src/lib/ai/*, frontend/src/lib/h5p/inject.ts, frontend/src/hooks/useTranscriptAnalysis.ts, frontend/src/hooks/useSuggestions.ts, frontend/src/types/h5p.ts, frontend/src/types/transcript.ts

**Verification**
1. Unit test parser with both SRT and VTT fixtures and edge cases; verify exact segment schema and seconds conversion.
2. API validation tests: invalid transcript payload returns typed 400 errors; valid payload returns typed suggestions.
3. Streaming test: UI receives incremental SSE progress and final parsed suggestions without freezing.
4. UI flow test: accept, reject, edit suggestions; confirm staged count and state transitions are accurate.
5. Injection integration test: apply accepted suggestions and verify resulting video object contains timestamp-linked H5P entries.
6. Rerun + diff test: run analysis twice after transcript edits and verify new/changed/removed suggestions are highlighted correctly.
7. Regression smoke test: existing non-AI H5P creation and playback flows still work unchanged.

**Decisions**
- Keep current architecture (Express + CRA + MobX) and map requested Next.js structure to equivalent folders.
- Include zod validation in new/updated API routes to meet request constraints.
- Exclude auth, DB migrations, deployment, and payment changes per scope.
- Minimize existing file edits; if unavoidable, annotate with CHANGE NOTE as requested.

**Further Considerations**
1. Persistence risk: current H5P service uses in-memory storage in part of the flow; recommendation is to treat this as a separate hardening task after feature completion.
2. UI framework mismatch: prompt asks Tailwind, repo uses MUI; recommendation is to keep MUI for consistency unless a dedicated Tailwind migration is approved.
3. TypeScript boundary: backend is mostly JavaScript today; recommendation is incremental TS for new modules only to reduce migration risk.
