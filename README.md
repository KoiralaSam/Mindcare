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

## Frontend and backend flow

- **Frontend (`frontend/`)** is a React + TypeScript + Vite app that handles UI, routes, form input, and authenticated screens.
- **Backend (`backend/`)** is a Go HTTP API connected to PostgreSQL for user data, leaderboard, and wellness results.
- In local development, the frontend calls `/api/*`, and Vite proxies those requests to `http://127.0.0.1:8080`.

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

## Ethics and safety guidelines

- Use supportive, non-judgmental language in all user-facing copy.
- Avoid diagnostic claims; the app provides guidance, not medical diagnosis.
- Keep crisis/escalation resources visible when risk is elevated.
- Validate local support links/helplines for the deployment region before release.
