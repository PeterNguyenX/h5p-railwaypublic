# Figma And Supabase Handoff

This repository is now prepared to connect to the external design and Supabase project below.

## Figma design

- Design URL: https://www.figma.com/make/2p6TjAZfhuelcAGHTeUGGR/Simple-UX-UI-Design?t=OYLkPDDV7LYgImpn-1
- Purpose: source of truth for the upcoming UX/UI redesign.
- Primary audience: middle-aged teachers who need a calm, obvious, low-friction interface.

## Supabase project

- Project ref: `wgawvunfjjjywpywuvqf`
- Project URL: `https://wgawvunfjjjywpywuvqf.supabase.co`
- Database host pattern: `db.wgawvunfjjjywpywuvqf.supabase.co`

## What is wired in the repo

- Backend accepts `DATABASE_URL` for Supabase Postgres in `backend/config/database.js`.
- Backend can create a service-role client from `backend/config/supabase.js`.
- Frontend can create a browser client from `frontend/src/lib/supabase/client.ts`.
- Frontend runtime links now live in `frontend/src/config/runtime.ts`.
- Example environment files exist at `backend/.env.example` and `frontend/.env.example`.

## Still required from Supabase

- Anon key
- Service role key
- Postgres connection string or database password

## Recommended rollout

1. Fill in the example env files with real Supabase credentials.
2. Point backend `DATABASE_URL` at Supabase Postgres.
3. Keep the current Express auth flow until the database migration is stable.
4. Use the committed Figma URL as the handoff source while implementing the redesigned frontend.