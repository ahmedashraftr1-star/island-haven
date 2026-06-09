# Island Haven · آيلاند هيفن

A free **business incubator + coworking platform** for Gaza, affiliated with NasToNas (من النّاس إلى النّاس). RTL Arabic. Members get a workspace, 1:1 mentorship (Office Hours), incubation cohorts ending in a Demo Day, a resource playbook, and a venture showcase.

> الرؤية: تمكين الشباب واختصار المسافة بينهم وبين سوق العمل العالميّ عبر الاقتصاد الرقميّ — عقولٌ تقهر الركام.

## Monorepo layout (pnpm workspaces)

| Path | What |
|---|---|
| `lib/db` | Drizzle schema + client (`@workspace/db`) — the single source of truth for the DB |
| `lib/api-zod` | Shared Zod contracts |
| `artifacts/api-server` | Express 5 + Drizzle API (Node 22, ESM, esbuild bundle) |
| `artifacts/ih-haven` | Web app — React + Vite + Tailwind + wouter + framer-motion |
| `artifacts/ih-mobile` | Mobile app — Expo / React Native |

## Features

Members & profiles · Experts/mentors + **Office Hours** (self-served availability slots, atomic booking) · Mentorship sessions · **Incubation programs** + applications · **Cohorts** + **Demo Day** (countdown + RSVP) + **journey** (weekly curriculum & updates) · **Ventures** showcase + **milestone timeline** + linked pitch decks · Success stories · Partners · Team · **Resources** playbook · Courses/workshops · Daily posts/events · Numbers (live stats) · **Press / Media Kit** · full admin panel · in-app + email notifications (Resend).

## Local development

```bash
# Prereqs: Node 22, pnpm 10, PostgreSQL 16
pnpm install

# 1) Configure backend env
cp artifacts/api-server/.env.example artifacts/api-server/.env
#   set DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET
#   (optional) RESEND_API_KEY + EMAIL_FROM for real emails

# 2) Push the schema to your DB
pnpm --filter @workspace/db run push

# 3) Run the backend (:3001) — loads .env
cd artifacts/api-server && pnpm run dev:local

# 4) Run the web app (:5180; 5000 is taken by macOS AirPlay)
cd artifacts/ih-haven && PORT=5180 pnpm run dev   # proxies /api → :3001

# 5) (optional) seed demo content — server must be running
node artifacts/api-server/scripts/seed-incubator.mjs
node artifacts/api-server/scripts/seed-community.mjs
node artifacts/api-server/scripts/seed-extras.mjs
```

Admin panel: `http://localhost:5180/admin` (username/password from `.env`).

## Quality gates

```bash
pnpm run typecheck                       # all packages
pnpm -r --filter "./artifacts/**" run build   # production builds
cd artifacts/api-server && pnpm test     # API integration tests (server must be running + seeded)
```

CI (`.github/workflows/ci.yml`) runs typecheck + build on every push/PR, plus a job that spins up Postgres, seeds, and runs the API tests.

## Health checks

- `GET /api/healthz` — liveness (process up).
- `GET /api/readyz` — readiness (returns 503 if the database is unreachable). Use this for load-balancer / deploy health checks.

## Environment variables (backend)

| Var | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (required) |
| `ADMIN_USERNAME` | Admin login username (optional; if set, required at login) |
| `ADMIN_PASSWORD` | Admin login password + session-signing fallback (required, ≥8 chars) |
| `SESSION_SECRET` | HMAC secret for session cookies (preferred over reusing ADMIN_PASSWORD) |
| `FRONTEND_URL` | Used to build password-reset links |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional email (falls back to logging if unset) |
| `PORT` | API port (default 3001) |

## Before shipping to production

- Set a strong `ADMIN_PASSWORD` and a random `SESSION_SECRET`.
- Configure `RESEND_API_KEY` + a verified `EMAIL_FROM` domain for real emails.
- Update `og:url` / `canonical` in `artifacts/ih-haven/index.html` to your domain.
- Keep `.env` and the seed scripts out of version control if they hold real secrets.
