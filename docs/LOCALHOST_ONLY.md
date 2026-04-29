# Localhost Mode (Temporary Reminder)

This project is currently configured to run in localhost-only mode for development/testing.

## UI Source Reminder

Use the UI from [Simple UX UI Design](Simple%20UX%20UI%20Design) as the active frontend for localhost testing.
If you return later, start this app first instead of the legacy [frontend](frontend) app.

## Current behavior

- Backend CORS allows only localhost origins by default.
- Frontend (Simple UX UI Design) uses local proxy (`/api` -> `http://localhost:3001`).
- Cloud deployment paths are intentionally not used during this phase.

## Where this is configured

- Backend toggle: [backend/server.js](backend/server.js)
- Frontend proxy: [Simple UX UI Design/vite.config.ts](Simple%20UX%20UI%20Design/vite.config.ts)

## Toggle when needed

Backend environment variable:

- `LOCALHOST_ONLY_MODE=true` (default behavior, localhost only)
- `LOCALHOST_ONLY_MODE=false` (allows configured production origin too)

## Local run commands

Backend:

```bash
cd backend
npm start
```

Frontend (Simple UX UI Design):

```bash
cd "Simple UX UI Design"
npm install
npm run dev
```

Expected URLs:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health: http://localhost:3001/health
