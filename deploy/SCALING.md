# Scaling & deployment topology

How Island Haven runs as a horizontally-scalable system, and the env vars that
drive it. Companion to CACHING.md (cache tiers), PRE_RELEASE.md (launch gate),
BACKUPS.md, and SECURITY-HEADERS.md.

## Recommended production topology

```
            ┌───────────── Redis ─────────────┐
            │  rate-limit • cache • BullMQ     │
            └───┬───────────┬──────────────┬───┘
                │           │              │
        ┌───────┴──┐ ┌──────┴───┐   ┌──────┴──────┐
        │ api #1   │ │ api #2   │ … │  worker ×1  │
        │ producer │ │ producer │   │  consumer   │
        └────┬─────┘ └────┬─────┘   └─────────────┘
             └──── Postgres (indexed) ────┘
```

- **N api instances** — stateless HTTP + job *producers*. Scale them freely.
- **1 worker** — the job *consumer* (`pnpm worker` → `dist/worker.mjs`). Runs the
  email/notification/badge processors, the daily-digest, and mentor reminders.
- **Redis** — one shared connection per process backs the rate limiter, the
  response cache, and BullMQ (a dedicated `maxRetriesPerRequest:null` duplicate).
- **Postgres** — indexed hot paths (Phase 1).

### The one hard rule
Do **NOT** run more than one instance with the in-process digest (`setInterval`)
path. Either:
- **With Redis** — the digest is a BullMQ repeatable singleton → safe at any
  instance count; run the worker (or `RUN_WORKER_IN_PROCESS=1` on exactly one
  box), OR
- **Without Redis** — you are single-instance only. Everything falls back to
  in-process/inline and there is nothing to coordinate.

## Graceful shutdown
Both the api (`index.ts`) and worker (`worker.ts`) trap `SIGTERM`/`SIGINT`: stop
accepting work, drain in-flight jobs, close Redis + the DB pool, then exit
(force-exit after 10s). This makes rolling deploys zero-downtime — send SIGTERM,
wait for exit, start the new version.

## Environment variables

| Var | Default | Purpose |
|-----|---------|---------|
| `PORT` | — (required) | HTTP port |
| `DATABASE_URL` | — (required) | Postgres |
| `SESSION_SECRET` | — | HMAC signing key (≥32 chars, ≠ `ADMIN_PASSWORD`); boot refuses without it (or `ADMIN_PASSWORD` fallback) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | — | Admin login |
| `REDIS_URL` | unset | Turns on shared cache + queues + cross-instance rate limits. Unset ⇒ single-instance in-memory/inline. |
| `RUN_WORKER_IN_PROCESS` | unset | `1` runs the worker inside the api process (dev / single box). Prod: leave unset, run `dist/worker.mjs`. |
| `ENABLE_DAILY_DIGEST_CRON` | unset | `1` registers the daily digest (repeatable singleton with Redis; setInterval without). |
| `QUEUE_ATTEMPTS` / `QUEUE_BACKOFF_MS` | `5` / `1000` | Job retry count + exponential backoff base |
| `RESEND_API_KEY` / `EMAIL_FROM` | unset | Email provider. Unset ⇒ emails are logged, not sent (dev). |
| `EMAIL_API_URL` | Resend | Provider endpoint override (testing) |
| `PUBLIC_CACHE_MAX_AGE` | `60` | `Cache-Control` max-age for anon public GETs |
| `RATE_LIMIT_GENERAL_MAX` / `RATE_LIMIT_CONTACT_*` | see code | Limiter tuning |

## Process manager sketch (systemd / PM2)

```
# api (× N, behind the load balancer)
PORT=3001 DATABASE_URL=… REDIS_URL=… SESSION_SECRET=… node dist/index.mjs

# worker (× 1)
DATABASE_URL=… REDIS_URL=… ENABLE_DAILY_DIGEST_CRON=1 node dist/worker.mjs
```

(Register `ENABLE_DAILY_DIGEST_CRON=1` on the producer side you want the digest
scheduled from — the repeatable job dedups, so it's safe if more than one sets it.)

## Capacity notes
- **Connections:** keep `N_api × DB_POOL_MAX + worker_pool` under Postgres
  `max_connections` (or front with PgBouncer).
- **Indexes:** create with `CREATE INDEX CONCURRENTLY` in prod (no table lock).
- **CDN:** safe in front of anon public GETs (they already emit `Cache-Control`);
  never cache responses carrying a session cookie / `Authorization`.
- **Real 10k+ concurrency:** validate with distributed load gen (k6 Cloud)
  against prod-like infra — a single dev box can't generate it.
