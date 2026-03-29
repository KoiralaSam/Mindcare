# Mindcare

**Mindcare** is a mental wellbeing check-in and learning app tailored for Nepal. Users complete a short self-check, get a non-diagnostic support zone, and receive relevant next-step resources.

> **This is a self-check for emotional wellbeing, not a diagnosis.** Screening should always be paired with appropriate follow-up and referral paths where risk is elevated.

---

## Product overview

- **Quick check-in:** ~2-minute questionnaire with supportive, plain-language prompts.
- **Support zones:** Green / Yellow / Orange / Red guidance bands (not clinical diagnosis).
- **Safety-first flow:** elevated-risk answers route to immediate support resources.
- **Learning paths:** short lessons and activities based on the current support zone.

Public-health references used in the content direction include [WHO — Doing What Matters in Times of Stress](https://www.who.int/publications/i/item/9789240003927), [CDC — How Right Now (stress)](https://www.cdc.gov/howrightnow/emotion/stress/index.html), and [CDC — Sleep and health](https://www.cdc.gov/sleep/about/index.html).

---

## Repository layout

```
Mindcare/
├── frontend/          # React 19 + TypeScript + Vite SPA
├── backend/           # Go module: DB helpers, user model (API server stub)
│   ├── internal/
│   └── migrations/   # PostgreSQL (golang-migrate)
└── Makefile          # Database migration targets
```

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, React Router
- **Backend:** Go (net/http), PostgreSQL, `lib/pq`
- **ML service:** Python, FastAPI, Uvicorn
- **AI integration:** Groq API (task generation)
- **Tooling:** npm, Makefile, golang-migrate

## Team member roles

- **Saugat:** Worked on frontend and backend development.
- **Samarpan:** Worked on frontend and backend development.
- **Jiwan:** Worked on frontend development.
- **Pratham:** Worked on ML model and prediction service.
- **Pratish:** Worked on product flow and UX design.

## Frontend and backend flow

- **Frontend (`frontend/`)** is a React + TypeScript + Vite app that handles UI, routes, form input, and authenticated screens.
- **Backend (`backend/`)** is a Go HTTP API connected to PostgreSQL for user data, leaderboard, and wellness results.
- In local development, the frontend calls `/api/`*, and Vite proxies those requests to `http://127.0.0.1:8080`.

### Main API endpoints

- `POST /api/login` — finds or creates a user by email (with optional age and gender).
- `POST /api/wellness-quiz` — accepts quiz answers, computes/fetches prediction, returns frontend-ready result, and updates user embers/streak.
- `GET /api/leaderboard` — returns ranked streak entries for the dashboard leaderboard.

### Request flow

1. User opens frontend and completes login/check-in.
2. Frontend sends data to backend API endpoints.
3. Backend validates input, reads/writes PostgreSQL, and computes response (with ML fallback logic when needed).
4. Frontend renders returned zone summary, tasks/resources, and leaderboard data.

---

## Prerequisites

Install these before running the app:

- **Go** (required for backend)
- **Node.js + npm** (required for frontend)
- **PostgreSQL** (local DB, if not using Neon/hosted Postgres)
- **golang-migrate CLI** (required for DB migrations)

---

## Setup instructions (frontend + backend)

```bash
# 1) Install migration CLI
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# 2) Create root .env
cat > .env <<'EOF'
DATABASE_URL=postgres://postgres:postgres@localhost:5432/g7?sslmode=disable
HTTP_ADDR=:8080
GROQ_API_KEY=your_groq_api_key_here
EOF

# 3) If using local PostgreSQL and DB does not exist yet, create it
# (Skip this step for Neon/hosted PostgreSQL)
createdb g7

# 4) Run migrations (from repo root)
make migrate-up

# 5) Run backend (terminal 1)
cd backend
go run ./internal/cmd

# 6) Run frontend (terminal 2)
cd frontend
npm install
npm run dev
```

---

## Deploying to production (Vercel + external backend/ML)

This repo is structured so the **frontend** is deployed to Vercel, while the **Go API** and **Python ML service** run on external hosts better suited for long-running services.

### 1. Provision PostgreSQL and run migrations

- Create a managed PostgreSQL instance (for example Neon, Supabase, Railway, or Render Postgres).
- Note the connection string and set it as `DATABASE_URL` when running migrations and in the backend environment.
- From your local machine (or CI), run the migrations against this remote database:

```bash
export DATABASE_URL='postgres://user:pass@host:5432/dbname?sslmode=require'
make migrate-up
```

### 2. Deploy the ML service (Python FastAPI)

- Use a Python-friendly host that supports long-running HTTP services (for example Render, Railway, Fly.io, or a small VM).
- Deploy the app under `ml/mental_health_ml` so that `serve.py` runs a FastAPI + Uvicorn server exposing `/predict`.
- Ensure model artifacts/config referenced in `ml/config.yaml` and `ml/mental_health_ml/serve.py` are available on disk.
- Configure env vars, at minimum:
  - `ML_HOST=0.0.0.0`
  - `ML_PORT=<port expected by the platform>`
- After deployment, you should have a public base URL such as `https://ml.yourdomain.com`, where `POST /predict` returns predictions.

### 3. Deploy the Go backend (API server)

- Use a Go-capable host for a long-running web service (for example Render Web Service, Railway, Fly.io).
- Build/run the binary from `backend/internal/cmd/main.go` (the platform can usually run `go build ./internal/cmd` and start the resulting binary).
- Configure environment variables on the backend host:
  - `DATABASE_URL` → the managed Postgres URL from step 1.
  - `ML_SERVICE_URL` → the public ML base URL from step 2 (for example `https://ml.yourdomain.com`).
  - `GROQ_API_KEY` → your Groq API key (required for LLM-based task generation).
  - `GROQ_MODEL` → optional model name (defaults to a sensible Groq model if omitted).
  - `HTTP_ADDR` → listening address, usually `:8080` (follow your platform docs).
- After deploy, you should have an HTTPS base URL such as `https://api.yourdomain.com` exposing:
  - `POST /api/login`
  - `POST /api/wellness-quiz`
  - `POST /api/task-complete`
  - `GET /api/leaderboard`

> Note: The backend currently sends `Access-Control-Allow-Origin: *`, so cross-origin requests from Vercel will work without additional CORS configuration.

### 4. Deploy the frontend to Vercel

1. In Vercel, create a new project pointing at this repository.
2. In project settings, set the **root directory** to `frontend`.
3. Build settings:
  - Install command: `npm install`
  - Build command: `npm run build`
  - Output directory: `dist`
4. In **Environment Variables** for the project, set:
  - `VITE_API_BASE` → the Go backend base URL from step 3 (for example `https://api.yourdomain.com`).
5. Trigger a Vercel deployment. Once complete, you will get a URL such as `https://mindcare.vercel.app` for the SPA.

### 5. Smoke-test the production deployment

- Visit the Vercel URL and go through:
  - Login flow (email-based login).
  - Wellness check-in, confirming a zone/result appears.
  - Task completion actions and leaderboard page.
- Watch your backend and ML logs for any errors (DB connection, ML timeouts, Groq issues) and adjust environment configuration as needed.

---

## Ethics and safety guidelines

- Use supportive, non-judgmental language in all user-facing copy.
- Avoid diagnostic claims; the app provides guidance, not medical diagnosis.
- Keep crisis/escalation resources visible when risk is elevated.
- Validate local support links/helplines for the deployment region before release.

