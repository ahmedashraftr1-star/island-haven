# Frontend security headers — Island Haven web (`ih-haven`)

These headers belong on the **HTML app responses**, set at whatever serves the
built SPA (`dist/public`) in production. They are **not** set by the API server
(that only serves JSON and already sends HSTS / X-Frame-Options / X-Content-Type-
Options / Referrer-Policy / Permissions-Policy via helmet).

> **Host-agnostic.** We do not yet know the production host, so snippets for the
> common options are below — apply the one that matches your chosen host. Replace
> every `REPLACE_*` placeholder before deploying.

---

## Recommended values

| Header | Value | Notes |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | 2 years. Only send over HTTPS. Submit to hstspreload.org once stable. |
| `X-Content-Type-Options` | `nosniff` | |
| `X-Frame-Options` | `DENY` | App is never framed. (CSP `frame-ancestors` is the modern equivalent.) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=()` | Matches the API. |
| `Content-Security-Policy` | see below | **Roll out in Report-Only first** (see warning). |

### Content-Security-Policy (starter — MUST be validated in Report-Only first)

```
default-src 'self';
base-uri 'self';
object-src 'none';
frame-ancestors 'none';
form-action 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: REPLACE_API_ORIGIN;
font-src 'self' data:;
connect-src 'self' REPLACE_API_ORIGIN;
upgrade-insecure-requests
```

**Why these directives (specific to this app):**
- `script-src 'self'` — the Vite build emits only hashed external `.js` files; there
  are **no inline scripts**, so no `'unsafe-inline'`/nonce is needed for scripts.
- `style-src 'self' 'unsafe-inline'` — React inline `style=` attributes and Framer
  Motion set styles inline; without `'unsafe-inline'` the UI breaks. (Scripts do
  **not** need it — keep them strict.)
- `img-src … data: blob:` — the hero grain uses an inline `data:image/svg+xml` URI;
  avatars/covers may be `blob:` previews.
- `connect-src 'self' REPLACE_API_ORIGIN` — set `REPLACE_API_ORIGIN` to the API's
  origin (e.g. `https://api.example.org`). **If the API is same-origin under `/api`
  (reverse-proxied together with the SPA), drop the placeholder and just use `'self'`.**
- `REPLACE_API_ORIGIN` in `img-src` only if covers/avatars are served from the API/
  object-storage origin; otherwise remove it.

> ⚠️ **Roll out CSP with `Content-Security-Policy-Report-Only` FIRST.** Watch the
> browser console / a report endpoint for a full session (AR + EN, all pages,
> ⌘K palette, forms, uploads) before switching to the enforcing header. A wrong
> CSP silently breaks the app. Do **not** ship enforcing CSP untested.

---

## Snippets by host

### A) Netlify / Cloudflare Pages — `public/_headers`
```
/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()
  Content-Security-Policy-Report-Only: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: REPLACE_API_ORIGIN; font-src 'self' data:; connect-src 'self' REPLACE_API_ORIGIN; upgrade-insecure-requests
```
(Once validated, rename the last line to `Content-Security-Policy:`.)

### B) nginx
```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), browsing-topics=()" always;
# Start with -Report-Only, then rename once validated:
add_header Content-Security-Policy-Report-Only "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: REPLACE_API_ORIGIN; font-src 'self' data:; connect-src 'self' REPLACE_API_ORIGIN; upgrade-insecure-requests" always;

# Long-cache the hashed assets, never cache index.html:
location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
location = /index.html { add_header Cache-Control "no-cache"; }
```

### C) Caddy
```
header {
  Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
  X-Content-Type-Options "nosniff"
  X-Frame-Options "DENY"
  Referrer-Policy "strict-origin-when-cross-origin"
  Permissions-Policy "camera=(), microphone=(), geolocation=(), browsing-topics=()"
  Content-Security-Policy-Report-Only "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: REPLACE_API_ORIGIN; font-src 'self' data:; connect-src 'self' REPLACE_API_ORIGIN; upgrade-insecure-requests"
}
```

---

## Validation checklist before enforcing
- [ ] Serve with `-Report-Only` CSP; browse every page in **AR and EN**, open ⌘K,
      submit apply/login/newsletter forms, trigger an upload — zero CSP violations
      in console.
- [ ] Confirm `REPLACE_API_ORIGIN` matches the real API origin (or `'self'` if proxied).
- [ ] HTTPS only; verify HSTS present and the cert chain is valid before `preload`.
- [ ] Flip `-Report-Only` → enforcing; re-test one full pass.
