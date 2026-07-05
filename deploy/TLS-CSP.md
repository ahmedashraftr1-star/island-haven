# TLS + CSP + edge security headers

Complements SECURITY-HEADERS.md (app-level helmet/CORS) and PRE_RELEASE.md §4.
This is the **edge** (Nginx / CDN) layer: terminate TLS, force HTTPS, and set the
headers that must live at the edge.

## TLS termination (Let's Encrypt via certbot)

```bash
# one-time
sudo certbot --nginx -d islandhaven.ps -d www.islandhaven.ps
# auto-renew is installed as a systemd timer; verify:
sudo certbot renew --dry-run
```

Nginx TLS block (add to the `server` in nginx.conf, listening on 443):

```nginx
listen 443 ssl http2;
ssl_certificate     /etc/letsencrypt/live/islandhaven.ps/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/islandhaven.ps/privkey.pem;
ssl_protocols TLSv1.2 TLSv1.3;              # no TLS 1.0/1.1
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_stapling on;
ssl_stapling_verify on;

# HSTS — only after you're confident HTTPS is permanent (hard to undo).
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```

Redirect all HTTP → HTTPS:

```nginx
server { listen 80; server_name islandhaven.ps www.islandhaven.ps;
         return 301 https://$host$request_uri; }
```

## Security headers (edge)

```nginx
add_header X-Frame-Options            "DENY"            always;
add_header X-Content-Type-Options     "nosniff"         always;
add_header Referrer-Policy            "strict-origin-when-cross-origin" always;
add_header Permissions-Policy         "geolocation=(), microphone=(), camera=()" always;
add_header Cross-Origin-Opener-Policy "same-origin"     always;
```

## Content-Security-Policy

Start in **report-only** (won't break anything), watch the reports, then enforce.
Tune the allow-lists to the real asset/CDN/analytics origins the frontend uses.

```nginx
# Phase 1 — observe:
add_header Content-Security-Policy-Report-Only
  "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://api.islandhaven.ps; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;

# Phase 2 — enforce (same value, header name without -Report-Only) once clean.
```

Notes:
- The api sends `helmet` headers already (SECURITY-HEADERS.md). The edge CSP
  governs the **frontend** document; keep the two consistent.
- `frame-ancestors 'none'` + `X-Frame-Options DENY` = belt-and-suspenders
  clickjacking defense.

## Secrets
- `SESSION_SECRET` (≥32 chars, ≠ ADMIN_PASSWORD), `ADMIN_PASSWORD`,
  `POSTGRES_PASSWORD`, `RESEND_API_KEY` — inject via the platform's secret
  manager / env, NEVER in the repo or the image.
- Rotate `SESSION_SECRET` invalidates all sessions (by design) — schedule it.

## Monitoring (recommended)
- Error tracking: Sentry (or self-hosted GlitchTip) — wire the DSN via env.
- Metrics: scrape `/metrics` (Prometheus text format) → Grafana; alert on
  `redis_up==0`, `queue_jobs_total{status="failed"}` rising, `queue_depth` growth,
  5xx rate, p99 latency.
- Logs: pino JSON → your aggregator (Loki/ELK) with alerting on error spikes.
