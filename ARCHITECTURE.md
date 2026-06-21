# Island Haven — Architecture (آيلاند هيفن)

> Bilingual (AR/EN) startup incubator platform for Gaza. Unified "strongest of both"
> build on `main`. Web + Mobile + API, one pnpm monorepo.

## 1. Monorepo layout (9 workspaces)

```
Insta-Haven 3/
├─ artifacts/
│  ├─ api-server/      @workspace/api-server   Express 5 REST API (Node, TS)        ~13.5k LOC
│  ├─ ih-haven/        @workspace/ih-haven      Web app — React + Vite (SPA)         ~46.5k LOC
│  ├─ ih-mobile/       @workspace/ih-mobile     Mobile — Expo / React Native         ~14.9k LOC
│  └─ mockup-sandbox/  @workspace/mockup-sandbox  design sandbox
├─ lib/
│  ├─ db/              @workspace/db            Drizzle ORM schema + client (Postgres) ~3k LOC
│  ├─ api-spec/        @workspace/api-spec      OpenAPI / contract source
│  ├─ api-zod/         @workspace/api-zod       generated Zod validators
│  └─ api-client-react/@workspace/api-client-react  generated typed fetch client + custom-fetch
└─ scripts/           @workspace/scripts        seed + maintenance (tsx)
```
Total: ~546 TS/TSX source files. Package manager: **pnpm workspaces** (catalog versions).

## 2. Tech stack
- **API**: Express 5, Drizzle ORM, Postgres (`pg`/`postgres`), bcryptjs, helmet, express-rate-limit, multer (uploads), pino (logging), zod, web-push, Resend (email).
- **Web**: React 19, Vite 7, wouter (routing), TanStack Query, framer-motion, Tailwind, lucide-react. Dark glassmorphism, RTL-first, bilingual via LanguageContext.
- **Mobile**: Expo 54 / React Native 0.81, expo-router, TanStack Query, expo-notifications, expo-image-picker. Arabic-first, IBM Plex Sans Arabic.
- **DB**: PostgreSQL 16, schema pushed via `drizzle-kit push`.

## 3. Data model — 45 tables (by domain)

**Identity & Auth**
- `users` (id, email, passwordHash, fullName, role, avatarUrl, bio, jobTitle, phone, skills, links…, status, **sessionEpoch**, passwordSetAt, lastLoginAt)
- `password_reset_tokens` (tokenHash, email, expiresAt) · `pending_reminders` (mentor setup reminders)
- `notification_prefs` (emailSessions/Programs/Daily, pushEnabled) · `push_tokens` (expo push)

**Experts & Mentorship**
- `expert_profiles` (userId, headline, expertise, bio, yearsExperience, languages, sessionMinutes, acceptingSessions, featured, ref, approvedAt…)
- `expert_availability_slots` (expertId, startAt, endAt, mode, status, bookedSessionId)
- `mentorship_sessions` (expertId, menteeId, topic, mode, preferredAt, status) · `session_ratings` (rating, feedback)

**Community / Works (social graph)**
- `works` (userId, title, summary, gallery, tags, status) · `works_comments` (+ parentId threading, editedAt) · `works_likes` · `works_saves`
- `user_follows` (followerId→followingId) · `badges` + `user_badges` (gamification) · `notifications`

**Programs & Incubation**
- `programs` + `program_applications` · `cohorts` + `cohort_ventures` + `cohort_weeks` + `cohort_updates` + `demo_day_rsvps`
- `ventures` + `venture_milestones`

**Learning**: `courses` + `enrollments` + `course_progress`

**Careers & Partnerships**: `job_listings` · `investors` · `opportunities` · `perks` · `newsletter_subscribers` · `partners`

**Content / CMS**: `success_stories` · `team_members` · `resources` · `daily_posts` · `site_settings` · `page_views`

**Messaging**: `conversations` + `messages`

**Intake**: `applications` (incubator apply + CV) · `bookings` (workspace seat + optional expert)

## 4. API — 243 endpoints across 41 route files (`artifacts/api-server/src/routes/`)

Public + member + admin, mounted under `/api`. Highlights:
- **auth.ts** (8): register/login/logout/me, change-password (bumps sessionEpoch), forgot/reset-password (DB tokens).
- **experts.ts** (19) + **expertAvailability.ts** (11): public list w/ ratings, `/experts/apply` (become-mentor), slots, booking, admin approve/resend-link.
- **works.ts** (15): CRUD, like/save, comment + edit + threading, follow graph, `/me/saved`, personalized feed.
- **gamification.ts** (9): badges, leaderboard, award. **messaging.ts** (4). **sessionRatings.ts** (3). **courseProgress.ts** (3, + certificate).
- **opportunities/jobs/investors/perks/newsletter** (CRUD + admin). **successStories.ts** (10, submit/withdraw/resubmit).
- **cohorts.ts** (18), **programs.ts** (9), **ventures.ts** (7), **courses.ts** (10), **resources/partners/teamMembers/ventureMilestones** (CRUD).
- **admin.ts** + **adminExtra.ts** (24): users/works/enrollments/settings/totals/activity. **upload.ts**/**userUpload.ts**: image (magic-byte validated) + CV. **storage.ts**: object serving. **push.ts**, **analytics.ts**, **search.ts**, **numbers/stats/gallery/members/health**.

Cross-cutting: helmet headers, CORS allowlist (Replit domains), rate-limit (auth 20/15m, general 300/min), 100kb body cap, cookie session (stateless token + sessionEpoch revocation).

## 5. Web app — 58 routes (`artifacts/ih-haven/`)
54 public pages + 32 admin pages. Components: `auth/ landing/ nav/ shell/ ui/`.

Public: Home, Apply, Book, Login/Register/Forgot/Reset, Onboarding, Profile, Members, **Search**, Experts + ExpertDetail, ExpertDashboard, Programs(+detail), Ventures(+detail), **Opportunities(+detail)**, Learning, **Certificate**, **Messages**, RateSession, **Leaderboard**, **Perks(+detail)**, NotificationSettings, Numbers, Gallery, About, Team, Press, Cohorts(+detail, DemoDay), Resources, Courses(+detail), Works(+detail, editor), **Saved**, Events(+detail), Daily(+detail), **Stories**, **Faq**, **Process**, **Alumni**, **Jobs**, **Investors**, **BecomeMentor**, PublicProfile.
Admin (`/admin`): 32 management screens (users, works, experts, sessions, programs, cohorts, ventures, courses, jobs, investors, newsletter, opportunities, perks, badges, stories, resources, team, partners, milestones, settings…).
i18n: `LanguageContext` (ar/ay toggle, localStorage) + `lib/i18n.ts`; RTL/LTR by `dir`. Mounted at `main.tsx`.

## 6. Mobile app — 44 screens (`artifacts/ih-mobile/app/`, expo-router)
- **6 tabs**: index (home), members, events, works, gallery, profile.
- **Stack/modals**: login/register/forgot/reset/change-password, onboarding, apply, book, become-mentor, story-form, edit-profile, expert-dashboard, experts, leaderboard, perks, messages, search, programs, ventures, courses, cohorts, resources, team, about, numbers, press, admin.
- **Dynamic**: expert/[id], member/[id], work/[id], venture/[id], program/[id], course/[id], cohort/[slug], sessions/[id]/rate.
- Native tabs (liquid glass) + classic fallback; deep-linking (reset-password, book) via DeepLinkHandler.

## 7. Shared libs
- `lib/db` — Drizzle schema (45 tables, barrel `schema/index.ts`) + pooled client.
- `lib/api-spec` — API contract source.
- `lib/api-zod` — generated Zod schemas (`generated/`).
- `lib/api-client-react` — generated typed client + `custom-fetch.ts`.

## 8. Auth & security
- Stateless cookie session token embedding **sessionEpoch**; password change/reset bumps epoch → all old sessions 401 (revocation).
- bcrypt(12) hashing; reset tokens persisted in DB (survive restart) + mentor reminder job.
- helmet, CORS allowlist, dual rate-limiters, 100kb JSON cap, upload magic-byte validation, URL-scheme validation, open-redirect guard (`?next=`).

## 9. Background jobs (`artifacts/api-server/src/index.ts`)
- `startDailyDigestSchedule(8)` — opt-in via `ENABLE_DAILY_DIGEST_CRON=1`.
- `startMentorReminderJob()` — reminds approved mentors before setup link expires.

## 10. Build / run / deploy
- Dev: API `pnpm --filter @workspace/api-server dev:local` (:3001) · Web `PORT=5180 pnpm --filter @workspace/ih-haven dev` · Mobile `pnpm --filter @workspace/ih-mobile dev:ios` (Expo :8082, offline).
- DB: `pnpm --filter @workspace/db push`. Seeds: `seed`, `seed:extras`, `seed:new`, `seed:content`.
- Typecheck: `pnpm typecheck` (all packages). Web build: Vite → `dist/public`.
- Env: PORT, DATABASE_URL, SESSION_SECRET, ADMIN_*, RESEND_API_KEY, EMAIL_FROM, REPLIT_DOMAINS, object-storage dirs.

## 11. Metrics
- ~546 source files · API ~13.5k LOC · Web ~46.5k LOC · Mobile ~14.9k LOC · DB ~3k LOC.
- 45 tables · 243 API endpoints · 58 web routes (86 page components) · 44 mobile screens.

---

## 12. Entity-Relationship map (21 enforced FKs + logical links)

`users` is the hub. `(→ cascade)` = ON DELETE CASCADE enforced; `(logical)` = referenced by id, not a DB constraint.

```
users (id) ◄───────────────────────────────────────────────┐
  ├─ expert_profiles.userId (→cascade)                       │
  ├─ works.userId (→cascade)                                 │
  ├─ enrollments.userId (→cascade)                           │
  ├─ program_applications.userId (→cascade)                  │
  ├─ mentorship_sessions.menteeId (→cascade)                 │
  ├─ works_comments.userId / works_likes.userId / works_saves.userId (→cascade)
  ├─ user_follows.followerId + followingId (→cascade)  ← self-referential social graph
  └─ (logical) ventures.userId · notifications.userId · course_progress.userId ·
       session_ratings.menteeId/expertId · conversations.user1Id/user2Id ·
       messages.senderId · user_badges.userId · notification_prefs.userId ·
       push_tokens.userId · success_stories.submittedByUserId
  (bookings = guest, no user FK)

expert_profiles (id)
  ├─ expert_availability_slots.expertId (→cascade)
  ├─ mentorship_sessions.expertId (→cascade)
  └─ (logical) session_ratings.expertId

programs (id) ── cohorts.programId (→cascade) · program_applications.programId (→cascade)
cohorts (id) ── cohort_ventures.cohortId (→cascade) · (logical) cohort_weeks · cohort_updates · demo_day_rsvps
ventures (id) ── cohort_ventures.ventureId (→cascade) · venture_milestones.ventureId (→cascade) · (logical) cohort_updates.ventureId
works (id) ── works_comments/likes/saves.workId (→cascade) · works_comments.parentId (self-ref thread)
courses (id) ── enrollments.courseId (→cascade) · (logical) course_progress.courseId
conversations (id) ── messages.conversationId (logical) ;  badges (id) ── user_badges.badgeId (logical)
```

## 13. Roles & access model (243 endpoints)
Actors: **public** (no auth) · **member** (`freelancer|graduate|student|other`) · **expert** (staff role, member+dashboard) · **admin** (separate `/admin/login`, env/site-settings credential).

| layer | endpoints |
|---|---|
| public (read content, apply, subscribe, search, track) | ~75 |
| member/expert (auth cookie) | ~51 |
| admin (`requireAdmin`) | ~117 |

Guards: `requireUser` (member), `requireAdmin` (admin), expert-scoped checks inside `experts`/`expertAvailability`. Sessions are stateless cookies carrying `sessionEpoch`; bumping it (password change/reset) invalidates all prior tokens.

## 14. Key end-to-end flows
1. **Become a mentor**: web/mobile `POST /experts/apply` → pending `expert_profiles` + admin email → admin `PATCH /admin/experts/:id` approve → `createResetToken` (24h) + `pending_reminders` scheduled → applicant sets password → role `expert`, opens expert-dashboard.
2. **Book an expert**: `GET /experts` (with ratings) → `GET /experts/:id/slots` → `POST /slots/:id/book` → `mentorship_sessions` (pref-gated email + badge) → after session `POST /me/sessions/:id/rating` → feeds `session_ratings` → expert `ratingAvg/ratingCount` on cards.
3. **Works engagement**: `POST /works` → followers notified (`new_work`) → like/comment(+thread, edit)/save → milestone badges auto-awarded (prolific/conversationalist/well_connected) → `GET /works?following=1` personalized feed + `/leaderboard`.
4. **Story lifecycle**: `POST /me/story` (draft) → admin review → published / rejected(+note, email) / soft-deleted → `POST /me/story/resubmit`.
5. **Auth/security**: login sets cookie (epoch) + `lastLoginAt`; `change-password`/`reset-password` bump `sessionEpoch` → old cookies 401; reset tokens in DB survive restarts.
6. **Workspace booking**: `POST /bookings` (seat) with optional `expertId` (meet-an-expert add-on).

## 15. Notification types
`mentor_application · booking_confirmed · session_requested · badge_awarded · work_comment · new_follower · new_work · generic` — varchar(32) on `notifications.type` (app-level, no pg enum), per-user opt-in via `notification_prefs`, delivered in-app + email (Resend) + push (web-push/expo).
