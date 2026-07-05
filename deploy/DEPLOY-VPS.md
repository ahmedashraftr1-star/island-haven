# Deploy Island Haven to a VPS (Hostinger) — runbook

The simplest robust topology: **one Node process serves the API *and* the built
site** (same origin), fronted by **nginx for TLS only**, with **Postgres** for
data and **optional Redis + a worker** for cache/queues.

```
Internet ──HTTPS──▶ nginx (TLS :443) ──▶ Node api :3001 (API + SPA)
                                          ├── Postgres
                                          └── Redis + worker   (optional)
```

Steps marked **🔑 YOU** require secrets/credentials — run those yourself; never
share them and never commit them.

---

## 0. Prerequisites (on the VPS, Ubuntu 22/24)
```bash
# Node 22 + pnpm + build basics
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql nginx git
sudo npm i -g pnpm
# optional (enables cache + queues + multi-instance):
sudo apt-get install -y redis-server
# dedicated user + app dir
sudo useradd -r -m -d /opt/island-haven -s /bin/bash islandhaven
sudo mkdir -p /opt/island-haven && sudo chown islandhaven:islandhaven /opt/island-haven
```

## 1. Get the code onto the VPS
Pick ONE. **🔑 YOU** decide when to push — I never push for you.
```bash
# A) via GitHub (after you `git push gh-origin main` from your machine):
sudo -u islandhaven git clone https://github.com/ahmedashraftr1-star/island-haven.git /opt/island-haven

# B) without GitHub — transfer the bundle, then clone from it:
#   (on your Mac)  scp ~/island-haven-backup.bundle  user@vps:/tmp/
#   (on the VPS)   sudo -u islandhaven git clone -b main /tmp/island-haven-backup.bundle /opt/island-haven
```
> Note: the bundle you have is from an earlier point — regenerate a fresh one to
> include the latest commits: `git bundle create ~/island-haven.bundle --all`.

## 2. 🔑 YOU — configure secrets
```bash
cd /opt/island-haven/artifacts/api-server
sudo -u islandhaven cp .env.example .env
sudo -u islandhaven nano .env      # fill REAL values (see the template)
#   NODE_ENV=production
#   SESSION_SECRET  →  openssl rand -base64 48   (>=32 chars, ≠ ADMIN_PASSWORD)
#   DATABASE_URL, ADMIN_PASSWORD, FRONTEND_URL=https://yourdomain
#   RESEND_API_KEY/EMAIL_FROM (email), REDIS_URL (if using Redis)
```

## 3. Build
```bash
cd /opt/island-haven
sudo -u islandhaven pnpm install --frozen-lockfile
sudo -u islandhaven deploy/build.sh        # libs → api → frontend
```

## 4. 🔑 YOU — database
```bash
# create the role + db (set a strong password to match DATABASE_URL):
sudo -u postgres psql -c "CREATE USER ih WITH PASSWORD 'CHANGE_ME';"
sudo -u postgres psql -c "CREATE DATABASE ih_haven OWNER ih;"
# apply the schema (tables + indexes + audit_log) from the drizzle schema:
cd /opt/island-haven
sudo -u islandhaven env DATABASE_URL="postgres://ih:CHANGE_ME@127.0.0.1:5432/ih_haven" \
  pnpm -C lib/db push
```

## 5. Run (systemd)
```bash
sudo cp deploy/island-haven-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now island-haven-api
# only if you set REDIS_URL — run the worker too:
sudo cp deploy/island-haven-worker.service /etc/systemd/system/
sudo systemctl enable --now island-haven-worker
# verify:
curl -s localhost:3001/api/healthz        # → 200
curl -s localhost:3001/ | grep -o '<title>[^<]*'   # → Island Haven
journalctl -u island-haven-api -n 30 --no-pager
```

## 6. 🔑 YOU — domain + TLS (nginx as TLS terminator → Node :3001)
`/etc/nginx/sites-available/islandhaven` (Node serves the site; nginx only does TLS + proxy):
```nginx
server {
  listen 80;
  server_name islandhaven.ps www.islandhaven.ps;
  location / { proxy_pass http://127.0.0.1:3001; proxy_set_header Host $host;
               proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
               proxy_set_header X-Forwarded-Proto $scheme; }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/islandhaven /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
# TLS via Let's Encrypt (adds :443 + redirects http→https):
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d islandhaven.ps -d www.islandhaven.ps
```
Then add the security headers / HSTS / CSP from **deploy/TLS-CSP.md**.

## 7. Go-live checklist (see deploy/PRE_RELEASE.md for the full list)
- [ ] `curl -s https://islandhaven.ps/api/healthz` → 200; the site loads.
- [ ] Homepage stats show real numbers; admin login works.
- [ ] `SESSION_SECRET` strong + ≠ ADMIN_PASSWORD (boot refuses otherwise).
- [ ] Backups scheduled — `deploy/BACKUPS.md` (`scripts/backup-db.sh`).
- [ ] If Redis: `/metrics` shows `redis_up 1`, `queue_depth ~0`; worker running.
- [ ] Security headers present (`curl -sI https://islandhaven.ps`).

## Update / rollback
```bash
# update:
cd /opt/island-haven && sudo -u islandhaven git pull && sudo -u islandhaven deploy/build.sh
sudo systemctl restart island-haven-api island-haven-worker   # graceful (SIGTERM drain)
# rollback: check out the previous commit + rebuild + restart, or keep the prior
# release dir and repoint. The DB schema is additive (safe to leave).
```

## Alternative: Docker
If you prefer containers, `deploy/docker-compose.yml` runs api + worker + redis +
pgbouncer + postgres + nginx. Requires the Docker daemon + a compose `.env`. The
single-process systemd path above is lighter for one box.
