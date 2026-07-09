# Island Haven — co-tenant deploy on the NasToNas VPS (isolation-first runbook)

> **Isolation is the top priority — above speed or convenience.** Everything for
> Island Haven is net-new: new user, new dir, new DB + DB user, new port, new PM2
> daemon, new nginx server block, new cert. **Nothing belonging to NasToNas is
> modified, restarted, or touched.**

**Chosen isolated resources (all confirmed-free in §2 before use):**

| Resource        | Island Haven value                    | NasToNas (record in §2, never modify) |
|-----------------|---------------------------------------|---------------------------------------|
| App directory   | `/var/www/island-haven`               | (record)                              |
| System user     | `islandhaven` (dedicated, own PM2)    | (record)                              |
| Internal port   | `3020`                                | (record — must differ)                |
| PM2 app / daemon| `island-haven`, run **as** `islandhaven` (separate daemon) | (record) |
| Postgres DB     | `ih_haven`                            | (record — must differ)                |
| Postgres user   | `ih_haven_app` (scoped to `ih_haven` only) | (record)                         |
| Domains         | `islandhavengsza.com`, `www.islandhavengsza.com` | (its own domains)          |
| Nginx block     | `/etc/nginx/sites-available/islandhavengsza.com` (NEW) | (its own block)      |
| TLS cert        | `islandhavengsza.com` (+www) — separate Let's Encrypt cert | (its own cert)  |

The strongest isolation lever here is **running Island Haven's PM2 under its own
dedicated user (`islandhaven`)** → it gets its *own* PM2 daemon, dump, and startup
unit, completely separate from whatever daemon runs NasToNas. Killing one app
cannot affect the other by construction.

---

## 🔴 STEP 0 — BACKUP GATE (do NOT pass until both are verified)

Nothing below runs until **both** backups exist and are verified.

1. **Full VPS snapshot** — Hostinger hPanel → *VPS → Snapshots → Create snapshot*.
   Wait until it shows **Completed**. (This is a panel action; it is yours to do.)
2. **NasToNas database dump** — on the VPS, dump the *existing* site's DB to a file
   and confirm it is non-empty. Read-only on their DB (a dump does not modify it):
   ```bash
   # Postgres (replace <nastonas_db>):
   sudo -u postgres pg_dump -Fc <nastonas_db> > ~/nastonas-$(date +%F-%H%M).dump
   # …or MySQL/MariaDB (replace <nastonas_db>):
   # mysqldump --single-transaction --quick <nastonas_db> > ~/nastonas-$(date +%F-%H%M).sql
   ls -lh ~/nastonas-*.dump   # size MUST be > 0
   ```
3. **Confirm both.** If either is missing or unverifiable → **STOP. Do not proceed.**

---

## STEP 1 — PRE-FLIGHT (READ-ONLY collision recon; changes nothing)

Run `bash deploy/co-tenant-vps/00-preflight-readonly.sh` on the VPS (copy it over
first). It records — never modifies — the existing site's port, PM2 process, DB
name, nginx blocks, response, and cert, and writes a **baseline** file used for
the before/after diff. It also **asserts** that port `3020`, DB `ih_haven`, and the
nginx filename are all free; it aborts (non-zero) if any collide, so you can pick
different values before touching anything.

Read the baseline it prints. Only continue if every "FREE ✓" line is green.

---

## STEP 2 — Dedicated user + code (isolated, no rights over NasToNas)

```bash
# dedicated system user with its own home; NO membership in NasToNas's group,
# NO sudo, NO access to the other site's files.
sudo useradd -r -m -d /var/www/island-haven -s /bin/bash islandhaven
sudo chown -R islandhaven:islandhaven /var/www/island-haven
sudo -u islandhaven mkdir -p /var/www/island-haven/logs

# code (after you `git push gh-origin main` from your Mac):
sudo -u islandhaven git clone https://github.com/ahmedashraftr1-star/island-haven.git /var/www/island-haven/app
cd /var/www/island-haven/app
sudo -u islandhaven pnpm install --frozen-lockfile
sudo -u islandhaven deploy/build.sh          # libs → api → SPA (dist/public)
```

Lock the tree so only `islandhaven` can read it (defence in depth):
```bash
sudo chmod 750 /var/www/island-haven          # NasToNas's user cannot traverse in
```

## STEP 3 — Brand-new database + scoped user (no shared tables/users)

Island Haven uses **Postgres**. Create an isolated DB owned by a dedicated role
that can reach *only* that DB. **Do not alter any NasToNas DB/role/grant.**

```bash
# strong password — generate and keep it (goes into .env DATABASE_URL):
IH_DB_PW="$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)"; echo "$IH_DB_PW"

sudo -u postgres psql <<SQL
CREATE ROLE ih_haven_app LOGIN PASSWORD '${IH_DB_PW}';
CREATE DATABASE ih_haven OWNER ih_haven_app;
-- keep the new role off every other DB's public schema (defensive, its own DB only):
REVOKE ALL ON DATABASE ih_haven FROM PUBLIC;
GRANT CONNECT ON DATABASE ih_haven TO ih_haven_app;
SQL
```
> The new role has **no** privileges on the NasToNas DB (a fresh Postgres role
> gets none by default). We deliberately do **not** run `REVOKE CONNECT` on the
> NasToNas database, because that would modify *their* DB object — off-limits.
> Isolation here comes from: separate DB, separate owner, and the app only ever
> holding `ih_haven`'s DATABASE_URL.

Migrations (schema is additive / idempotent — Drizzle push):
```bash
cd /var/www/island-haven/app
sudo -u islandhaven env DATABASE_URL="postgres://ih_haven_app:${IH_DB_PW}@127.0.0.1:5432/ih_haven" \
  pnpm -C lib/db push
```

## STEP 4 — Env (production, isolated creds, same-origin /api, port 3020)

```bash
cd /var/www/island-haven/app/artifacts/api-server
sudo -u islandhaven cp /var/www/island-haven/app/deploy/co-tenant-vps/env.production.template .env
sudo -u islandhaven nano .env      # fill DATABASE_URL (the new one), SESSION_SECRET, ADMIN_*, email
sudo chmod 600 .env                # secrets not world-readable
```
Never reuse any NasToNas secret. `SESSION_SECRET` = `openssl rand -base64 48`
(must be ≥32 chars and ≠ `ADMIN_PASSWORD`, or the app refuses to boot).

## STEP 5 — Process under its OWN PM2 daemon (as `islandhaven`)

```bash
sudo npm i -g pm2   # once, if PM2 isn't already global
# everything below runs AS islandhaven → a PM2 daemon separate from NasToNas's:
sudo -u islandhaven bash -lc '
  cd /var/www/island-haven/app
  pm2 start deploy/co-tenant-vps/ecosystem.config.cjs
  pm2 save
'
# enable boot startup for THIS user only (prints one sudo line — run exactly that):
sudo -u islandhaven bash -lc 'pm2 startup systemd -u islandhaven --hp /var/www/island-haven' 
# ^ copy/paste the `sudo env PATH=… pm2 startup …` command it prints, then:
sudo -u islandhaven bash -lc 'pm2 save'

# verify (cold-start warm-up already in the app → first hit is 200, never 503):
curl -s localhost:3020/api/healthz         # → {"status":"ok"}
curl -s localhost:3020/ | grep -o '<title>[^<]*'   # → Island Haven
for i in 1 2 3; do curl -s -o /dev/null -w "jobs:%{http_code}\n" localhost:3020/api/jobs; done  # all 200
```
`max_memory_restart: 400M` (in the ecosystem file) guarantees Island Haven can
never balloon and starve NasToNas.

## STEP 6 — New nginx server block (reverse-proxy → 3020) + reload (never restart)

```bash
sudo cp /var/www/island-haven/app/deploy/co-tenant-vps/nginx-islandhavengsza.conf \
        /etc/nginx/sites-available/islandhavengsza.com
sudo ln -s /etc/nginx/sites-available/islandhavengsza.com /etc/nginx/sites-enabled/
sudo nginx -t                       # MUST be green — validates ALL blocks incl. NasToNas
sudo systemctl reload nginx         # RELOAD, not restart (graceful, non-disruptive)
```
The block sets only `server_name islandhavengsza.com www.islandhavengsza.com`
and is **not** `default_server`, so it can only ever answer its own domains —
NasToNas routing is untouched.

## STEP 7 — Separate TLS cert (Let's Encrypt, this domain only)

> Do this **after** you point DNS (Step 8) so the HTTP-01 challenge resolves to
> this VPS. Certbot only edits the block matching `-d`, so NasToNas's cert/block
> stays as-is.
```bash
sudo certbot --nginx -d islandhavengsza.com -d www.islandhavengsza.com
sudo certbot certificates            # confirm a NEW cert; NasToNas's cert unchanged
sudo systemctl reload nginx
```
Auto-renew is installed by certbot (systemd timer). Then apply the HSTS/CSP
headers from `deploy/TLS-CSP.md` inside this block only.

## STEP 8 — DNS (🔑 YOU, in Hostinger — I never touch DNS)

- `A  @  islandhavengsza.com` → change **2.57.91.91 → <this VPS IP>**
- `CNAME www` → `islandhavengsza.com` (keep)
- Other `islandhavengsza.*` domains: 301-redirect to the canonical `.com` later.

---

## VERIFICATION — must ALL pass (see the checklist in this folder)

**NasToNas — before AND after (diff must be empty):**
- `curl -sI https://<nastonas-domain>/` → identical status + headers.
- Its cert (`certbot certificates` / `openssl s_client`) → same fingerprint + dates.
- Its PM2 status → unchanged (same pid/uptime trend, still `online`).
- Its DB → still reachable, row counts unchanged (read-only spot check).
- `nginx -t` green; **only `reload` was used**, never restart.

**Island Haven:**
- `https://islandhavengsza.com` loads with valid SSL; SPA + `/api` same-origin.
- `curl -s https://islandhavengsza.com/api/healthz` → 200; **0 5xx incl. cold start**.
- `pm2 list` (as `islandhaven`) shows `island-haven`; NasToNas app in its own daemon.
- **Independence test (staging window):** `sudo -u islandhaven pm2 stop island-haven`
  → NasToNas still 200. Restart island-haven. Then (optional, if safe) confirm the
  reverse during a maintenance window.

Rollback: see `ROLLBACK.md` — one clean sequence returns the VPS to its exact
prior state (block + symlink + PM2 app + DB + user + cert all removed).
