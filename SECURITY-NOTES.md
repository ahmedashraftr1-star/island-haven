# Security Notes — Island Haven

Security audit + fixes applied on branch `security/island-haven-fixes` (2026-06-10).
Audit method: parallel multi-agent review + adversarial verification + live runtime checks.

## ⚠️ URGENT — operator action required (leaked admin credential)

The admin password was previously **hardcoded in `scripts/src/seed.ts`** and committed
to git history (and pushed to the remote). Anyone with read access to the repository
can recover it. Removing the line does **not** un-leak the value already in history.

You must:
1. Set a **new, random** `ADMIN_PASSWORD` in the production environment.
2. Set a strong, **independent** `SESSION_SECRET` (must differ from `ADMIN_PASSWORD`):
   `openssl rand -hex 64`
3. Purge the old value from git history on **all** remotes (BFG Repo-Cleaner or
   `git filter-repo`) and force-push.
4. Treat any existing admin sessions as compromised.

The seed scripts now read credentials from env vars instead of hardcoding them.

## Fixed on this branch

- **Session signing key decoupled from the login password** — in production the
  server now requires a dedicated `SESSION_SECRET` (≠ `ADMIN_PASSWORD`).
- **Password-reset tokens are no longer logged** (prod refuses; dev only behind
  an explicit `EMAIL_DEBUG_BODY=1` opt-in).
- **`helmet` security headers** + explicit 100 kB JSON/body limits.
- **Pagination clamped** and **search `LIKE` wildcards escaped** on
  `members` / `works` / `daily`.
- **Resource URL fields scheme-validated** (blocks `javascript:` / `data:` and
  protocol-relative `//` URLs).
- **Admin upload** validates image magic bytes (not the client-declared type).
- **Session-token revocation** — a password change or reset now invalidates every
  previously-issued session token (new `session_epoch` column on `users`).

## Deploy step

Apply the schema (adds the `session_epoch` column):

```bash
pnpm --filter @workspace/db run push
```

Existing user session tokens are invalidated once after this (a one-time re-login).

## Verification status

`pnpm typecheck` (all 5 packages), the api-server esbuild bundle, and the API
integration suite (`pnpm test`) — **31/31 passing**. Auth/session behavior was
also confirmed against a live server (cookie auth, and password-change session
revocation).

## Still open (decisions, not code)

- Global rate limiter backed by a shared store (Redis) for the autoscale deployment.
- Registration responses still differ for an existing vs. new email (account
  enumeration, low severity) — closing it cleanly implies an email-verification flow.
