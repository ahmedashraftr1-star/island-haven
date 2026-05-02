# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Island Haven (آيلاند هيفن)

Arabic RTL landing page + admin dashboard for a free workspace in Gaza supported by "من الناس إلى الناس". Tagline: "مساحة تتّسع لأحلامك" (@ih_haven).

### Routes (frontend, `artifacts/ih-haven`)

- `/` — slim landing page (Hero → NewsSlider → NumbersBand → Audience → HoursLocation; `Home.tsx`)
- `/members` — full members directory with rich profile cards (`pages/Members.tsx`)
- `/u/:id` — public profile + works grid (`pages/PublicProfile.tsx`)
- `/numbers` — live community statistics from real DB (`pages/Numbers.tsx`)
- `/gallery` — collected images from works covers + galleries (`pages/Gallery.tsx`)
- `/events`, `/events/:id` — Daily content rebranded as Events (`pages/Events.tsx`)
- `/about` — vision/mission + Story + Support (`pages/About.tsx`)
- `/courses`, `/works`, `/work/:id`, `/work/new`, `/work/:id/edit` — programs + member works
- `/profile` — authenticated member profile editor with jobTitle + linkedin/behance/github/portfolio + 8 free links
- `/apply` — public application form (`pages/Apply.tsx`)
- `/admin` — admin login + dashboard (`pages/admin/`)

### Header (`components/landing/Header.tsx`)

7-tab nav with framer-motion `layoutId="nav-pill"` highlight, scroll-aware
styling on home, and always condensed on non-home routes so the nav stays
readable on white sections.

### New backend endpoints (`artifacts/api-server/src/routes`)

- `GET /api/members` — rich member list including new profile cols + worksCount
- `GET /api/numbers` — aggregate community statistics
- `GET /api/gallery` — collected images from `works.coverUrl` + `works.galleryUrls`

### Access control

- `GET /api/works/:id` and `GET /api/users/:id` both filter by
  `works.status='visible'` and `users.status='active'` for non-owners
  (admins moderate via `/api/admin/*`).
- `phone` is omitted for anonymous callers across these endpoints.

### Admin dashboard

Three tabs:
1. **الطلبات (Applications)** — list, filter by status, expand to read bio + add internal notes, change status, delete.
2. **تحرير المحتوى (Content)** — edit hero / about / cta / contact sections; saved overrides applied on top of the in-code defaults; per-section "استعادة الأصلي" reset.
3. **الإحصائيات (Analytics)** — total + 24h page views, applications counts, daily traffic chart (recharts), top paths, status breakdown.

Auth = HMAC-signed cookie (`ih_admin`), 7-day TTL, `httpOnly`, `sameSite=lax`, `secure` in production. Password from `ADMIN_PASSWORD` secret. HMAC key: `SESSION_SECRET` (falls back to `ADMIN_PASSWORD`).

### API endpoints (`artifacts/api-server`, mounted at `/api`)

Public:
- `GET /api/healthz`
- `GET /api/content` — returns merged defaults + overrides
- `POST /api/applications` — submit application (zod-validated)
- `POST /api/track` — record a page view

Admin (require `ih_admin` cookie):
- `POST /api/admin/login` `{password}` → sets cookie
- `POST /api/admin/logout`
- `GET  /api/admin/me` → `{authenticated}`
- `GET  /api/admin/applications`
- `PATCH /api/admin/applications/:id` `{status?, notes?}`
- `DELETE /api/admin/applications/:id`
- `GET /api/admin/applications/stats`
- `GET /api/admin/content` → `{defaults, overrides, merged}`
- `PUT /api/admin/content/:key` `{value}`
- `DELETE /api/admin/content/:key`
- `GET /api/admin/analytics` → totals + by-day + by-path

### DB schema (`lib/db/src/schema/`)

- `site_settings (key PK, value jsonb, updatedAt)` — content overrides
- `applications (id, fullName, email, phone, category, bio, status, notes, createdAt)`
- `page_views (id, path, referrer, userAgent, createdAt)`

### Secrets used

- `ADMIN_PASSWORD` — admin dashboard password
- `SESSION_SECRET` — optional, HMAC key for session cookie
- `DATABASE_URL` — provided by Replit
