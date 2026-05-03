# Threat Model

## Project Overview

Island Haven is a TypeScript pnpm monorepo for a Gaza coworking-space community site. The production application consists of an Express 5 API server (`artifacts/api-server`) and a React/Vite frontend (`artifacts/ih-haven`). The backend uses PostgreSQL through Drizzle ORM and stores users, applications, bookings, courses, enrollments, works, daily posts, analytics page views, and editable site content. Authentication is implemented with HMAC-signed `httpOnly` cookies: `ih_admin` for the admin dashboard and `ih_user` for member accounts.

The mockup sandbox (`artifacts/mockup-sandbox`) is development-only and is not deployed to production. Production is assumed to run with `NODE_ENV=production`; Replit deployment provides TLS termination and certificate management.

## Assets

- **Admin session and password** -- the `ADMIN_PASSWORD` secret protects access to the dashboard, which can view and modify applications, bookings, users, courses, works, content, analytics, and settings.
- **Member accounts and sessions** -- user emails, bcrypt password hashes, signed session cookies, profile data, course enrollments, and owned works.
- **Personal/contact data** -- application submissions, booking records, member phone numbers, email addresses, bios, internal admin notes, user agents, and referrers.
- **Published community content** -- public site copy, daily/event posts, member profiles, works, uploaded images, and gallery data.
- **Application secrets and infrastructure credentials** -- `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, and Replit Object Storage credentials or sidecar tokens.
- **Database integrity and availability** -- booking/course capacity, moderation states, admin settings, and analytics must not be corrupted or exhausted by public traffic.

## Trust Boundaries

- **Browser to API** -- all frontend requests cross from untrusted browsers into Express routes under `/api`. Server-side validation and authorization are required for every state-changing operation.
- **Anonymous to authenticated member** -- public routes expose landing pages, content, courses, works, daily posts, stats, bookings, applications, and registration/login. Member-only routes include profile updates, work CRUD, uploads, course enrollment, and personal enrollment data.
- **Member to other member** -- member IDs and work IDs are user-controllable; APIs must prevent IDOR and must not expose hidden/banned member data or private contact details beyond intended policy.
- **Authenticated member to admin** -- `/api/admin/*` routes must require a valid `ih_admin` cookie and must not trust regular user cookies or client-side admin UI checks.
- **API to PostgreSQL** -- Drizzle queries and raw SQL templates cross into the database. User input must remain parameterized and constrained.
- **API to Object Storage** -- upload and download routes proxy user/admin-controlled objects. File type, size, path, and response headers must prevent unsafe content execution or access to unrelated private objects.
- **API to Replit sidecar/external services** -- object storage token requests and Google Cloud Storage calls use privileged credentials and must not accept attacker-controlled service URLs.

## Scan Anchors

- **Production entry points:** `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`, route modules in `artifacts/api-server/src/routes/`, `artifacts/ih-haven/src/main.tsx`, and `artifacts/ih-haven/src/App.tsx`.
- **Highest-risk backend areas:** auth/session code in `artifacts/api-server/src/lib/auth.ts`; admin login and admin CRUD routes; public submissions/bookings; member profile/work/course routes; upload and storage proxy routes; Drizzle schemas in `lib/db/src/schema/`.
- **Frontend security surfaces:** public profile/work rendering, admin dashboard forms, login/register flows, content-driven links/images, and upload flows under `artifacts/ih-haven/src/pages/` and `src/lib/`.
- **Public surfaces:** `/api/healthz`, `/api/content`, `/api/applications`, `/api/bookings`, `/api/bookings/availability`, `/api/track`, `/api/auth/login`, `/api/auth/register`, `/api/courses`, `/api/works`, `/api/users/:id`, `/api/members`, `/api/numbers`, `/api/gallery`, `/api/daily`, `/api/storage/*`.
- **Authenticated surfaces:** `/api/auth/me`, `/api/uploads/image`, `/api/works/mine`, member work CRUD, course enrollment routes, and profile updates.
- **Admin surfaces:** `/api/admin/*` routes, including admin login, content, users, bookings, applications, courses, daily posts, works moderation, settings, and analytics.
- **Dev-only areas:** `artifacts/mockup-sandbox`, generated `dist/` outputs, local caches, attached assets, and experimental scripts should be ignored unless production reachability is demonstrated.

## Threat Categories

### Spoofing

Admin and member identity is represented by signed cookies. The server must validate cookie signatures and expiration on every protected request, must keep session signing secrets out of client code, and must make online password guessing impractical for both member and admin login flows.

### Tampering

Clients are untrusted and can modify request bodies, IDs, role filters, dates, status fields, URLs, and uploaded file metadata. The API must validate all inputs with schema constraints, compute ownership and moderation state server-side, enforce booking/course capacity in transactions, and prevent ordinary members from changing resources owned by other users or admin-only fields.

### Information Disclosure

The application stores PII in applications, bookings, member profiles, phone numbers, emails, admin notes, analytics referrers, and user agents. Public APIs must return only intended public fields; hidden works, banned users, draft courses, admin notes, password hashes, and private object paths must not be exposed. Error responses and logs must avoid leaking secrets or sensitive request headers.

### Denial of Service

Public endpoints for booking, applications, tracking, registration/login, listing, and uploads can be called by anonymous users or low-privilege members. They must bound request body sizes, file sizes, result counts, expensive aggregate queries, and repeated automated attempts. In-memory rate limits are acceptable only for single-instance deployment assumptions and should be applied to high-risk public authentication and submission flows.

### Elevation of Privilege

Admin dashboard capabilities are high-impact and must be enforced server-side on every `/api/admin/*` route. Member-facing routes must include owner checks for work edit/delete and personal enrollment data. Database queries must remain parameterized; storage routes must constrain object paths and content types so uploads cannot become code execution, private object disclosure, or stored XSS vectors.