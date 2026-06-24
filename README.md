# H5P Video Platform

## Quick Start

```bash
npm run dev
```

This starts both the backend (port 5001) and frontend (port 3002) together. Open **[http://localhost:3002](http://localhost:3002)** when both are running.

> **Prerequisites:** Run `npm install && cd backend && npm install` first (one-time setup). See [Getting Started](#getting-started) below for full setup including `.env` and database init.

---

An AI-powered H5P content creation platform that lets educators enrich video content with interactive H5P activities using free AI providers (Groq, Ollama, or Claude).

## Architecture

| Layer | Tech | Port |
|-------|------|------|
| Frontend | React + Vite + Tailwind | `3002` |
| Backend | Node.js + Express | `5001` |
| Database | SQLite (`h5p.db`) | — |

The frontend proxies all `/api` requests to the backend, so you only need to open `http://localhost:3002` in your browser.

---

## Prerequisites

Install the following before continuing:

- **Node.js** v18 or later — [nodejs.org](https://nodejs.org)
- **npm** v9 or later (bundled with Node.js)
- **Git**

Verify:

```bash
node -v   # should print v18.x.x or higher
npm -v    # should print 9.x.x or higher
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd itp-h5p
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Copy the example environment file and fill in your values:

**Mac / Linux**
```bash
cp .env.example .env
```

**Windows (Command Prompt)**
```cmd
copy .env.example .env
```

Open `backend/.env` in any text editor. The minimum required values are:

```env
PORT=5001
JWT_SECRET=any-long-random-string-here
SESSION_SECRET=any-other-long-random-string-here
```

Pick **one** AI provider and add its key (all free options available):

| Provider | Speed | Cost | Key to set |
|----------|-------|------|------------|
| **Groq** (recommended) | Fastest | Free tier | `GROQ_API_KEY` |
| **Ollama** | Local, offline | Free | `OLLAMA_ENABLED=true` |

> For Groq: sign up at [console.groq.com](https://console.groq.com) and paste your key into `GROQ_API_KEY`.
>
> For Ollama: install from [ollama.ai](https://ollama.ai), then run `ollama pull mistral` before starting the backend.

Initialize the database and create the default admin account:

```bash
npm run init-db
npm run seed-admin
```

`seed-admin` is safe to run multiple times — it skips creation if the account already exists.

### 3. Set up the frontend

Open a **new terminal window/tab**, then:

```bash
cd frontend
npm install
```

---

## Running the App

You need **two terminals running at the same time** — one for the backend and one for the frontend.

### Terminal 1 — Backend

```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server running on port 5001
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

You should see:
```
  VITE  Local: http://localhost:3002/
```

Open **[http://localhost:3002](http://localhost:3002)** in your browser.

---

## Windows-Specific Notes

- Use **PowerShell** or **Windows Terminal** instead of the old Command Prompt for a better experience.
- If `npm install` fails with a permissions error, right-click your terminal and choose **Run as Administrator**.
- Use `cd frontend` to enter the frontend folder.
- If port 5001 or 3002 is already in use, find and kill the process:
  ```powershell
  netstat -ano | findstr :5001
  taskkill /PID <PID_NUMBER> /F
  ```

## Mac-Specific Notes

- If `npm install` fails with permission errors, **do not use `sudo npm install`**. Instead, fix npm permissions:
  ```bash
  sudo chown -R $(whoami) ~/.npm
  ```
- If a port is already in use:
  ```bash
  lsof -ti:5001 | xargs kill -9
  lsof -ti:3002 | xargs kill -9
  ```

---

## Default Admin Account

A default admin account is included. Use these credentials to log in:

| Field    | Value      |
|----------|------------|
| Username | `ADMIN1`   |
| Password | `admin123` |

If you ran `npm run init-db` (which drops all tables), restore the account with:

```bash
cd backend
npm run seed-admin
```

This is idempotent — safe to run anytime, skips if the account already exists.

---

## Project Structure

```
itp-h5p/
├── backend/                  # Express API server
│   ├── server.js             # Entry point
│   ├── routes/               # API route handlers
│   ├── services/             # AI provider services
│   ├── models/               # Database models
│   ├── h5p-content/          # Saved H5P content files
│   ├── h5p-libraries/        # H5P library files
│   └── .env                  # Your local environment config (not committed)
├── frontend/      # React + Vite frontend
│   ├── src/
│   │   ├── app/              # Pages and routing
│   │   └── lib/              # API client and stores
│   └── vite.config.ts        # Dev server config (port 3002, proxies /api → 5001)
└── README.md
```

---

## Common Issues

**`Error: listen EADDRINUSE :::5001`** — Something is already running on port 5001. Kill it (see OS-specific notes above) or change `PORT` in `backend/.env`.

**`CORS error` in the browser** — Make sure both servers are running. The frontend must run on port 3002 as the backend's CORS config expects it.

**`Cannot find module` errors** — Run `npm install` inside the correct folder (`backend/` or `frontend/`).

**AI features not working** — Check that at least one AI provider key is set in `backend/.env` and the backend restarted after editing the file.
