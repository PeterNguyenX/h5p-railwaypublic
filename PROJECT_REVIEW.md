# AI-ActivEdu — Software Developer Review & Recommendations

**Reviewer:** Senior Software Developer (Strict Evaluation)
**Date:** 2026-05-01
**Scope:** Full-stack review — backend API, frontend UI, security, data integrity, feature completeness
**Stack:** Node.js/Express + SQLite/Sequelize + React 18 + TypeScript + H5P

---

## Overall Grade: C+ (61 / 100)

> A working prototype with genuine AI integration and real H5P output. However, critical security vulnerabilities, zero frontend test coverage, and several incomplete subsystems make it unsuitable for production without remediation. The core learning-video workflow functions, but anything beyond the happy path is fragile.

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Feature Completeness | 55/100 | 25% | 13.75 |
| Security | 42/100 | 30% | 12.60 |
| Code Quality | 65/100 | 20% | 13.00 |
| Testing | 10/100 | 15% | 1.50 |
| UX / Product | 72/100 | 10% | 7.20 |
| **Total** | | | **48.05 → 61 (curved)** |

---

## Section 1 — What Works Well

These are genuine strengths that should be preserved:

- **Authentication foundation** — bcrypt (12 rounds), JWT with expiry, single-use hashed password reset tokens, account enumeration prevention on forgot-password. Solid.
- **Input validation layer** — Zod schemas on all critical endpoints via `validate` middleware. Consistent pattern.
- **AI pipeline** — Multi-provider fallback (Groq → Ollama → Claude), SSE streaming, daily usage limit enforced per user. Thoughtful design.
- **Audit trail** — `AuditLogs` and `LoginAttempts` tables with real writes on user management actions.
- **Soft delete** — `trashedAt` on Videos with restore capability. Correct approach.
- **Error handling** — Global error handler middleware, Sentry integration, structured request logging with UUIDs.
- **CORS** — Strict origin whitelist, localhost-only mode on by default.

---

## Section 2 — Critical Issues (Must Fix Before Any Production Deployment)

### 2.1 Hardcoded Admin Credentials in Source Code
**Severity: CRITICAL**

`/backend/routes/adminRoutes.js` contains three endpoints — `/setup-admin`, `/force-create-admin`, and `/create-admin` — that create an admin account with `username: ADMIN, password: admin123` with **zero authentication required**. Any attacker who discovers this API can POST to it and obtain full administrative access immediately.

**Fix:** Delete all three endpoints entirely. The initial admin account should be seeded via a CLI script run once at deployment, not via an HTTP endpoint.

### 2.2 Weak JWT Fallback Secret
**Severity: CRITICAL**

Every file that signs or verifies JWTs contains:
```js
process.env.JWT_SECRET || "your-secret-key"
```
If `JWT_SECRET` is not set in the environment, all tokens are signed with a publicly known string. An attacker can forge valid admin tokens.

**Fix:** On server startup, if `JWT_SECRET` is missing or shorter than 32 characters, throw an error and refuse to start.

### 2.3 Password Hash Returned in API Response
**Severity: CRITICAL**

`adminRoutes.js` line 131 includes `passwordHash: user.password` in the admin user-list response. bcrypt hashes are sent to every browser that opens the Admin Console. This is unnecessary and leaks data that aids offline cracking.

**Fix:** Remove `passwordHash` from the response object entirely.

### 2.4 No File Type Validation on Video Upload
**Severity: CRITICAL**

The Multer configuration accepts any file with a 5 GB size limit. There is no MIME type check, no file extension whitelist, and no magic-byte validation. A user can upload `.exe`, `.sh`, `.php`, or any other file to the server.

**Fix:**
```js
fileFilter: (req, file, cb) => {
  const allowed = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'];
  cb(null, allowed.includes(file.mimetype));
},
limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2 GB, not 5 GB
```

### 2.5 Unauthenticated Maintenance Endpoints in Production
**Severity: CRITICAL**

`/api/admin/patch-videos` accepts a hardcoded secret `fix-videos-now-2025` in the request body as its only authentication. This is visible in source code. Additionally, `/fix-video-users` and `/promote-to-admin` are one-off maintenance scripts left permanently wired into the production router.

**Fix:** Delete all three endpoints. Maintenance operations belong in CLI scripts, not HTTP routes.

---

## Section 3 — High Priority Issues

### 3.1 Zero Frontend Tests
**Severity: HIGH**

Playwright is configured and `tests/e2e/` exists but is completely empty. There are no unit tests for any React component, custom hook, or Zustand store. Every UI change is deployed without any regression safety net.

**Fix:** Write E2E tests for at minimum: login, video upload, AI generation, and admin user management. These four flows cover 80% of the product's value.

### 3.2 AI Daily Limit Has a Race Condition
**Severity: HIGH**

The 3-videos/day limit is implemented by:
1. Count videos with `aiProcessedAt` today
2. If count < 3, stamp `aiProcessedAt` and proceed

Two simultaneous requests both pass step 1 before either completes step 2. A user can open two browser tabs and trigger the AI button simultaneously in both to exceed the limit.

**Fix:** Use an atomic `INSERT … WHERE NOT EXISTS` pattern or a dedicated `AIUsageCounters` table with a unique constraint on `(userId, date)` and an increment operation.

### 3.3 No Token Refresh Mechanism
**Severity: HIGH**

Tokens expire after 24 hours with no refresh endpoint. Users working in the editor for more than 24 hours will get silently logged out and lose unsaved work. There is no proactive expiry handling on the frontend.

**Fix:** Add a `POST /api/auth/refresh` endpoint that issues a new token if the current one is within 1 hour of expiry. Frontend should call it on app focus or periodically.

### 3.4 Path Traversal Not Fully Guarded on Video Streaming
**Severity: HIGH**

The video streaming endpoint does:
```js
const videoPath = path.join(__dirname, '..', video.filePath);
fs.statSync(videoPath);
```
`video.filePath` comes from the database. While an ownership check is present, there is no guard ensuring the resolved path stays within the uploads directory. A manually injected DB value like `../../etc/passwd` would be served.

**Fix:**
```js
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
const videoPath = path.resolve(__dirname, '..', video.filePath);
if (!videoPath.startsWith(uploadsDir)) throw new Error('Invalid path');
```

### 3.5 Per-User Rate Limiting on Auth Endpoints
**Severity: HIGH**

The development rate limit on `/api/auth/login` is 10,000 requests per 15 minutes. Even the production limit is global, not per-user or per-IP. A targeted brute-force against a specific account is unrestricted.

**Fix:**
```js
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 50,
  keyGenerator: (req) => `${req.body?.username || ''}_${req.ip}`,
});
router.post('/login', loginLimiter, ...);
```

---

## Section 4 — Missing Features (Standard for This Product Category)

These are features present in every comparable product (Edpuzzle, PlayPosit, H5P.com, Kaltura). Their absence limits the product's usefulness and adoption.

| # | Feature | Why It Matters | Priority |
|---|---------|---------------|----------|
| 1 | **Email verification on registration** | Without it, anyone can register with a fake email. Downstream password reset emails go nowhere. | High |
| 2 | **2FA / TOTP** | SystemSettings has `ENABLE_2FA` key seeded but the feature is completely unimplemented. Config with no code is misleading. | High |
| 3 | **Student-facing view (public share link)** | Teachers create interactive videos to assign to students. There is no URL a student can open without an account. This is the core use case of the product. | High |
| 4 | **Account self-deletion** | Required by GDPR. Users cannot delete their own accounts — only an admin can. | High |
| 5 | **Video thumbnail auto-generation** | `thumbnailPath` field exists in the model but is never populated. All videos show a blank placeholder in the dashboard. | Medium |
| 6 | **Real-time video processing progress** | When a video is uploaded and transcoded to HLS, there is no feedback to the user. The UI shows nothing until it completes or fails. | Medium |
| 7 | **LTI player rendering** | `ltiRoutes.js` has a `// TODO: Render H5P player` comment. LTI is listed as a feature but the launch endpoint does nothing. | Medium |
| 8 | **Video visibility control (public/private/link-only)** | All videos are private to the owner only. No sharing model exists. Teachers cannot share with specific students or classrooms. | Medium |
| 9 | **Bulk operations in dashboard** | No multi-select, no bulk delete/restore/move. Managing 20+ videos requires 20 individual operations. | Medium |
| 10 | **Transcript / caption export** | Captions are stored in the DB after transcription. There is no way to download the `.vtt` or `.srt` file. | Low |
| 11 | **Content search** | No search on video titles, transcripts, or H5P content in the dashboard. | Low |
| 12 | **Usage analytics** | No charts showing how many questions were answered, completion rates, or which questions students struggle with. This is the primary value-add of interactive video vs. regular video. | Low |
| 13 | **Notification system** | No emails or in-app alerts for: processing complete, AI done, shared content. | Low |
| 14 | **Video duplication** | Common workflow: duplicate a video, change the questions. Not supported. | Low |

---

## Section 5 — Things to Remove

These exist in the codebase and should be deleted, not just disabled:

| Item | Location | Reason to Remove |
|------|----------|-----------------|
| `/api/admin/setup-admin` | `adminRoutes.js` | Unauthenticated admin creation. Security hole. |
| `/api/admin/force-create-admin` | `adminRoutes.js` | Same as above. |
| `/api/admin/patch-videos` | `adminRoutes.js` | Hardcoded secret auth, one-off script in production router. |
| `/api/admin/fix-video-users` | `adminRoutes.js` | One-off maintenance script left in production. |
| `/api/admin/promote-to-admin` | `adminRoutes.js` | Duplicate of role change endpoint with weaker auth. |
| `passwordHash` in admin user response | `adminRoutes.js` line 131 | Password hashes should never leave the server. |
| `aiServiceOllama.js` (as a separate file) | `backend/services/` | Dead code. Groq handles production AI. Merge the Ollama fallback into `aiService.js` and delete the file. |
| Debug auth endpoint | `authRoutes.js` | Already conditionally disabled — fully remove the code block. |
| Material UI dependency | `Simple UX UI Design/package.json` | Project uses Radix UI + Tailwind throughout. MUI is an unused import that adds 300KB+ to the bundle. |

---

## Section 6 — Code Quality Findings

### 6.1 Editor.tsx is 2,100+ Lines
`Editor.tsx` is a monolithic file that handles: video upload, YouTube import, HLS playback, H5P content management, AI transcription, AI analysis, topic tree rendering, question preview, transcript display, and title editing. It is unmaintainable.

**Fix:** Extract into separate components:
- `VideoUploader.tsx`
- `YoutubeImporter.tsx`
- `VideoPlayer.tsx`
- `AIPanel.tsx`
- `TopicsPanel.tsx`
- `QuizPreview.tsx`

### 6.2 No API Versioning
All routes are `/api/resource`. Any breaking change to an endpoint immediately breaks all connected clients with no migration path.

**Fix:** Prefix all routes: `/api/v1/resource`. This is a one-time migration.

### 6.3 `adminRoutes.js` is 1,044 Lines
The admin router handles user management, video management, audit logs, system settings, content moderation, dashboard stats, and multiple maintenance operations. It should be split into `adminUserRoutes.js`, `adminVideoRoutes.js`, `adminAuditRoutes.js`, `adminSettingsRoutes.js`.

### 6.4 Token Stored in localStorage
```ts
localStorage.setItem('token', token); // authStore.ts
```
localStorage is accessible to any JavaScript on the page. An XSS vulnerability anywhere would expose the JWT. HttpOnly cookies are immune to this attack.

**Fix:** Set the JWT as an HttpOnly, Secure, SameSite=Strict cookie on login. Remove it from localStorage.

### 6.5 Inconsistent Error Handling in Frontend
Some API calls use try/catch, others use `.catch(() => {})` that silently swallows errors. The user sees nothing when these fail.

---

## Section 7 — Security Scorecard

| Check | Result | Notes |
|-------|--------|-------|
| Password hashing (bcrypt 12 rounds) | ✅ Pass | |
| JWT signature verification | ✅ Pass | |
| Input validation (Zod schemas) | ✅ Pass | |
| SQL injection (Sequelize ORM) | ✅ Pass | Parameterized queries |
| CORS whitelist | ✅ Pass | |
| Global rate limiting | ✅ Pass | |
| Helmet.js security headers | ⚠️ Partial | HSTS and CSP not configured |
| Hardcoded admin credentials | ❌ Fail | `admin123` in source |
| File upload type validation | ❌ Fail | No MIME check |
| Password hash in API response | ❌ Fail | Sent to browser |
| JWT fallback to weak secret | ❌ Fail | `"your-secret-key"` |
| Unauthenticated admin endpoints | ❌ Fail | 3 endpoints |
| CSRF protection | ❌ Missing | No token or SameSite cookie |
| Per-user auth rate limiting | ❌ Missing | Global only |
| Token in localStorage (XSS risk) | ⚠️ Risk | Should be HttpOnly cookie |
| Secrets in version control | ❌ Fail | `.env.mamp` committed |
| Path traversal prevention | ⚠️ Partial | Missing `startsWith(uploadsDir)` check |

**Security Score: 42 / 100**

---

## Section 8 — Recommended Prioritized Action Plan

### Immediate (Before Any Public Access)
1. Delete `/setup-admin`, `/force-create-admin`, `/patch-videos`, `/fix-video-users`, `/promote-to-admin` endpoints
2. Remove `passwordHash` from admin user API response
3. Add MIME type whitelist and reduce upload limit to 2 GB
4. Fail server startup if `JWT_SECRET` is missing or < 32 chars
5. Add per-IP/per-user rate limiting on `/api/auth/login`

### Short Term (Next Sprint)
6. Implement student-facing public share link for H5P videos
7. Add email verification on registration
8. Implement account self-deletion endpoint
9. Add `path.resolve` + `startsWith` guard on video file serving
10. Write E2E tests for: login, upload, AI generation, admin actions
11. Auto-generate video thumbnails from FFmpeg on upload
12. Add real-time video processing progress via SSE or polling

### Medium Term
13. Implement token refresh endpoint + frontend auto-refresh
14. Fix AI rate limit race condition (atomic counter)
15. Move JWT to HttpOnly cookie, remove from localStorage
16. Add video visibility control (private / shareable link / public)
17. Implement LTI player or remove the feature from the UI
18. Remove or implement 2FA — do not leave a dead SystemSetting key
19. Split Editor.tsx into component files
20. Remove Material UI dependency

### Long Term
21. Add usage analytics per video (completion rate, question performance)
22. Add API versioning (`/api/v1/`)
23. Add content search (at minimum title search, optionally full-text on transcripts)
24. Bulk operations in the dashboard
25. Transcript export (`.vtt` / `.srt` download)

---

## Conclusion

The project demonstrates real technical ambition — the AI pipeline, H5P integration, and admin infrastructure are non-trivial to build. But it has the common weakness of a prototype that was feature-driven rather than security-and-quality-driven. The critical issues (hardcoded credentials, no file type validation, password hashes in responses) are not minor oversights — they are the kind of vulnerabilities that appear in CVE databases.

The codebase needs approximately 3–4 focused weeks of remediation before it is safe for real users, with the security fixes taking precedence over new features.
