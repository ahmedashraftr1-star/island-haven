# Island Haven — Session Code Reference

Complete source of every file built/changed by Claude this session
(branch `feat/competitor-gaps`). Files from the parallel agent (global
search, mobile expert screens) are NOT included.

**Features:** works search · follow graph + feed · comment threading ·
milestone badges · saved/bookmarked works · comment editing · per-user
rate limiting + expert-panel hardening.

---


# DATABASE SCHEMA (lib/db/src/schema)

## `lib/db/src/schema/userFollows.ts`
*(26 lines)*

```ts
import { pgTable, serial, integer, timestamp, unique, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

// Directed follow edges between members. follower_id follows following_id.
// Powers follower/following counts, a personalized "following" feed, and
// new-work notifications to a member's followers.
export const userFollowsTable = pgTable(
  "user_follows",
  {
    id: serial("id").primaryKey(),
    followerId: integer("follower_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    followingId: integer("following_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniquePair: unique("user_follows_pair_unique").on(t.followerId, t.followingId),
    followerIdx: index("user_follows_follower_idx").on(t.followerId),
    followingIdx: index("user_follows_following_idx").on(t.followingId),
  }),
);

export type UserFollow = typeof userFollowsTable.$inferSelect;
```

## `lib/db/src/schema/worksSaves.ts`
*(26 lines)*

```ts
import { pgTable, serial, integer, timestamp, unique, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { worksTable } from "./works";

// A member's saved/bookmarked works — a private curation list. One row per
// (user, work); both sides cascade so deletes never orphan a bookmark.
export const worksSavesTable = pgTable(
  "works_saves",
  {
    id: serial("id").primaryKey(),
    workId: integer("work_id")
      .notNull()
      .references(() => worksTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqueUserWork: unique("works_saves_user_work_unique").on(t.userId, t.workId),
    workIdx: index("works_saves_work_idx").on(t.workId),
    userIdx: index("works_saves_user_idx").on(t.userId),
  }),
);

export type WorkSave = typeof worksSavesTable.$inferSelect;
```

## `lib/db/src/schema/worksComments.ts`
*(39 lines)*

```ts
import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { worksTable } from "./works";

export const worksCommentsTable = pgTable(
  "works_comments",
  {
    id: serial("id").primaryKey(),
    workId: integer("work_id")
      .notNull()
      .references(() => worksTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    // One-level threading: a reply points at its top-level parent comment.
    // Deleting a parent cascades to its replies.
    parentId: integer("parent_id").references(
      (): AnyPgColumn => worksCommentsTable.id,
      { onDelete: "cascade" },
    ),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    // Stamped when the author edits the comment; null = never edited.
    editedAt: timestamp("edited_at", { withTimezone: true }),
  },
  (t) => ({
    workIdx: index("works_comments_work_idx").on(t.workId),
    userIdx: index("works_comments_user_idx").on(t.userId),
    parentIdx: index("works_comments_parent_idx").on(t.parentId),
  }),
);
```

## `lib/db/src/schema/notifications.ts`
*(47 lines)*

```ts
import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

// In-app notifications for members. Written server-side at event time
// (program acceptance, session confirmation, …). Plain int userId (acyclic).

export const NOTIFICATION_TYPES = [
  "program_accepted",
  "session_confirmed",
  "session_requested",
  "badge_awarded",
  "work_comment",
  "new_follower",
  "new_work",
  "generic",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const notificationsTable = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    type: varchar("type", { length: 32 })
      .notNull()
      .$type<NotificationType>()
      .default("generic"),
    title: varchar("title", { length: 200 }).notNull(),
    body: varchar("body", { length: 500 }).default("").notNull(),
    link: varchar("link", { length: 400 }).default("").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userIdx: index("notifications_user_idx").on(t.userId),
  }),
);

export type Notification = typeof notificationsTable.$inferSelect;
```

## `lib/db/src/schema/index.ts`
*(35 lines)*

```ts
export * from "./siteSettings";
export * from "./applications";
export * from "./pageViews";
export * from "./bookings";
export * from "./users";
export * from "./courses";
export * from "./enrollments";
export * from "./works";
export * from "./dailyPosts";
export * from "./pushTokens";
export * from "./worksLikes";
export * from "./worksComments";
export * from "./worksSaves";
export * from "./userFollows";
export * from "./experts";
export * from "./mentorshipSessions";
export * from "./programs";
export * from "./ventures";
export * from "./opportunities";
export * from "./successStories";
export * from "./partners";
export * from "./teamMembers";
export * from "./cohorts";
export * from "./ventureMilestones";
export * from "./expertAvailability";
export * from "./resources";
export * from "./demoDayRsvps";
export * from "./cohortJourney";
export * from "./notifications";
export * from "./courseProgress";
export * from "./messaging";
export * from "./sessionRatings";
export * from "./gamification";
export * from "./perks";
export * from "./notificationPrefs";
```


# BACKEND (artifacts/api-server/src)

## `artifacts/api-server/src/lib/rateLimit.ts`
*(45 lines)*

```ts
import type { Request, Response, NextFunction } from "express";
import type { UserSession } from "./auth";

type Bucket = number[];

/**
 * Per-USER in-memory rate limiter for authenticated write endpoints.
 *
 * Keys on the session user, NOT the IP: Island Haven is a shared-network
 * coworking space, so many members sit behind one NAT IP — an IP-based limit
 * (like the public push limiter) would punish the innocent. Mount AFTER
 * requireUser so the session is present (falls back to IP if somehow absent).
 */
export function makeUserRateLimit(opts: { max: number; windowMs: number }) {
  const buckets = new Map<string, Bucket>();
  let lastSweep = 0;
  return function rateLimit(req: Request, res: Response, next: NextFunction) {
    const session = (req as Request & { userSession?: UserSession }).userSession;
    const key = session ? `u:${session.userId}` : `ip:${req.ip || "unknown"}`;
    const now = Date.now();
    const cutoff = now - opts.windowMs;

    // Opportunistic sweep so idle keys don't accumulate unbounded.
    if (now - lastSweep > opts.windowMs) {
      for (const [k, b] of buckets) {
        while (b.length && b[0]! < cutoff) b.shift();
        if (b.length === 0) buckets.delete(k);
      }
      lastSweep = now;
    }

    let b = buckets.get(key);
    if (!b) {
      b = [];
      buckets.set(key, b);
    }
    while (b.length && b[0]! < cutoff) b.shift();
    if (b.length >= opts.max) {
      res.status(429).json({ error: "طلبات كثيرة، أمهِلنا قليلًا" });
      return;
    }
    b.push(now);
    next();
  };
}
```

## `artifacts/api-server/src/routes/works.ts`
*(1104 lines)*

```ts
import { Router, type IRouter, type Request } from "express";
import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import {
  db,
  worksTable,
  worksLikesTable,
  worksCommentsTable,
  worksSavesTable,
  userFollowsTable,
  usersTable,
  badgesTable,
  userBadgesTable,
  notificationsTable,
  upsertWorkSchema,
  USER_ROLES,
  type UserRole,
} from "@workspace/db";
import { optionalUser, requireUser, type UserSession } from "../lib/auth";
import { makeUserRateLimit } from "../lib/rateLimit";
import { logger } from "../lib/logger";
import { getFlag } from "./adminExtra";
import { invalidateNumbersCache } from "./numbers";
import { awardBadgeByKey } from "./gamification";
import { notify } from "./notifications";

const router: IRouter = Router();

// Per-user write limiters (mounted after requireUser). Generous enough for real
// use, low enough to stop comment/notification flooding from one account.
const rlComment = makeUserRateLimit({ max: 15, windowMs: 60_000 });
const rlFollow = makeUserRateLimit({ max: 40, windowMs: 60_000 });
const rlWork = makeUserRateLimit({ max: 12, windowMs: 60_000 });
const rlToggle = makeUserRateLimit({ max: 80, windowMs: 60_000 });

// Statuses a non-owner may see/interact with. "featured" is strictly more
// public than "visible" (numbers/digest/leaderboard already count it) — treat
// the two the same everywhere so an admin-featured work doesn't vanish.
const PUBLIC_WORK_STATUSES = ["visible", "featured"] as const;
const isPublicWorkStatus = (s: string) =>
  (PUBLIC_WORK_STATUSES as readonly string[]).includes(s);

// Notify every follower of `authorId` that a new work was published.
// Fire-and-forget — failures are logged inside notify() and never surface.
async function notifyFollowersOfNewWork(
  authorId: number,
  work: { id: number; title: string },
): Promise<void> {
  try {
    const [author] = await db
      .select({ fullName: usersTable.fullName })
      .from(usersTable)
      .where(eq(usersTable.id, authorId))
      .limit(1);
    const followers = await db
      .select({ followerId: userFollowsTable.followerId })
      .from(userFollowsTable)
      .where(eq(userFollowsTable.followingId, authorId));
    if (followers.length === 0) return;
    const name = author?.fullName ?? "أحد الأعضاء";
    // One bulk INSERT instead of N concurrent inserts — bounded fan-out cost
    // even for an author with many followers.
    await db.insert(notificationsTable).values(
      followers.map((f) => ({
        userId: f.followerId,
        type: "new_work" as const,
        title: "عمل جديد",
        body: `نشر ${name} عملاً جديداً: ${work.title}`.slice(0, 500),
        link: `/works/${work.id}`.slice(0, 400),
      })),
    );
  } catch (err) {
    logger.error({ err, authorId }, "notifyFollowersOfNewWork failed");
  }
}

// Count-milestone badges. Each is idempotent (awardBadgeByKey no-ops if the
// badge is already held or its key isn't minted yet) and fire-and-forget.
async function awardWorksMilestone(userId: number): Promise<void> {
  try {
    const [r] = await db
      .select({ c: count() })
      .from(worksTable)
      .where(and(eq(worksTable.userId, userId), inArray(worksTable.status, PUBLIC_WORK_STATUSES)));
    if ((r?.c ?? 0) >= 5) await awardBadgeByKey(userId, "prolific");
  } catch (err) {
    logger.error({ err, userId }, "awardWorksMilestone failed");
  }
}
async function awardCommentsMilestone(userId: number): Promise<void> {
  try {
    const [r] = await db
      .select({ c: count() })
      .from(worksCommentsTable)
      .where(eq(worksCommentsTable.userId, userId));
    if ((r?.c ?? 0) >= 10) await awardBadgeByKey(userId, "conversationalist");
  } catch (err) {
    logger.error({ err, userId }, "awardCommentsMilestone failed");
  }
}
async function awardFollowersMilestone(userId: number): Promise<void> {
  try {
    const [r] = await db
      .select({ c: count() })
      .from(userFollowsTable)
      .where(eq(userFollowsTable.followingId, userId));
    if ((r?.c ?? 0) >= 10) await awardBadgeByKey(userId, "well_connected");
  } catch (err) {
    logger.error({ err, userId }, "awardFollowersMilestone failed");
  }
}

// Throttle repeated "new follower" notifications for the same (follower→target)
// pair so a follow/unfollow loop can't spam a member. In-memory is fine: the
// worst case of a process restart is one extra notification.
const FOLLOW_NOTIFY_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const recentFollowNotify = new Map<string, number>();
function shouldNotifyNewFollower(followerId: number, targetId: number): boolean {
  const key = `${followerId}:${targetId}`;
  const now = Date.now();
  const last = recentFollowNotify.get(key);
  if (last && now - last < FOLLOW_NOTIFY_COOLDOWN_MS) return false;
  recentFollowNotify.set(key, now);
  if (recentFollowNotify.size > 5000) {
    for (const [k, t] of recentFollowNotify) {
      if (now - t > FOLLOW_NOTIFY_COOLDOWN_MS) recentFollowNotify.delete(k);
    }
  }
  return true;
}

// ─── Public gallery ─────────────────────────────────────────────────────────

const WORKS_PAGE_SIZE = 18;

// A work the caller may interact with (like/comment) — same visibility rule as
// GET /works/:id: public only for visible works by active authors; the owner
// always may. Returns the row (id, userId, …) or null (caller should 404).
async function loadInteractableWork(id: number, userId: number | undefined) {
  const [row] = await db
    .select({
      id: worksTable.id,
      userId: worksTable.userId,
      title: worksTable.title,
      status: worksTable.status,
      authorStatus: usersTable.status,
    })
    .from(worksTable)
    .innerJoin(usersTable, eq(usersTable.id, worksTable.userId))
    .where(eq(worksTable.id, id))
    .limit(1);
  if (!row) return null;
  const isOwner = userId !== undefined && row.userId === userId;
  if (!isOwner && (!isPublicWorkStatus(row.status) || row.authorStatus !== "active")) {
    return null;
  }
  return row;
}

router.get("/works", optionalUser, async (req, res) => {
  try {
    const role = String(req.query.role ?? "");
    const requestedPage = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const sort = String(req.query.sort ?? "newest");
    const q = String(req.query.q ?? "").trim().slice(0, 80);
    // Escape LIKE wildcards so user input is matched literally.
    const esc = q.replace(/[\\%_]/g, (c) => "\\" + c);
    const filterByRole = (USER_ROLES as readonly string[]).includes(role)
      ? (role as UserRole)
      : null;

    // Personalized feed: ?following=1 restricts to works by members the
    // signed-in viewer follows. Anonymous viewers (or a viewer who follows
    // nobody) get an empty feed rather than the global gallery.
    const session = (req as Request & { userSession?: UserSession }).userSession;
    let followedIds: number[] | null = null;
    if (req.query.following === "1") {
      if (!session) {
        res.json({ works: [], total: 0, page: 1, totalPages: 1 });
        return;
      }
      const rows = await db
        .select({ id: userFollowsTable.followingId })
        .from(userFollowsTable)
        .where(eq(userFollowsTable.followerId, session.userId));
      followedIds = rows.map((r) => r.id);
      if (followedIds.length === 0) {
        res.json({ works: [], total: 0, page: 1, totalPages: 1 });
        return;
      }
    }

    // Sort by engagement via correlated COUNT subqueries. The outer table is the
    // unaliased FROM (`works`), so literal `works.id` correlates correctly —
    // never interpolate the outer column into the sql template (renders bare).
    const orderBy =
      sort === "popular"
        ? [
            desc(sql`(SELECT COUNT(*) FROM works_likes wl WHERE wl.work_id = works.id)`),
            desc(worksTable.createdAt),
          ]
        : sort === "discussed"
          ? [
              desc(sql`(SELECT COUNT(*) FROM works_comments wc WHERE wc.work_id = works.id)`),
              desc(worksTable.createdAt),
            ]
          : [desc(worksTable.createdAt)];

    const where = and(
      filterByRole ? eq(usersTable.role, filterByRole) : undefined,
      eq(usersTable.status, "active"),
      inArray(worksTable.status, PUBLIC_WORK_STATUSES) as never,
      q
        ? or(
            ilike(worksTable.title, `%${esc}%`),
            ilike(worksTable.summary, `%${esc}%`),
            ilike(worksTable.tags, `%${esc}%`),
          )
        : undefined,
      followedIds ? inArray(worksTable.userId, followedIds) : undefined,
    );

    const [{ total }] = await db
      .select({ total: count() })
      .from(worksTable)
      .innerJoin(usersTable, eq(usersTable.id, worksTable.userId))
      .where(where);

    // Clamp page to the valid range so a huge ?page never produces an
    // out-of-range deep offset.
    const totalPages = Math.max(1, Math.ceil(total / WORKS_PAGE_SIZE));
    const page = Math.min(requestedPage, totalPages);

    const rows = await db
      .select({
        work: worksTable,
        author: {
          id: usersTable.id,
          fullName: usersTable.fullName,
          role: usersTable.role,
          avatarUrl: usersTable.avatarUrl,
        },
      })
      .from(worksTable)
      .innerJoin(usersTable, eq(usersTable.id, worksTable.userId))
      .where(where)
      .orderBy(...orderBy)
      .limit(WORKS_PAGE_SIZE)
      .offset((page - 1) * WORKS_PAGE_SIZE);

    // Batch the like/comment counts for just this page's works (one query each,
    // grouped by work_id) instead of a per-row correlated subquery.
    const ids = rows.map((r) => r.work.id);
    const likeMap = new Map<number, number>();
    const commentMap = new Map<number, number>();
    if (ids.length > 0) {
      const likeRows = await db
        .select({ workId: worksLikesTable.workId, c: count() })
        .from(worksLikesTable)
        .where(inArray(worksLikesTable.workId, ids))
        .groupBy(worksLikesTable.workId);
      for (const r of likeRows) likeMap.set(r.workId, Number(r.c));
      const commentRows = await db
        .select({ workId: worksCommentsTable.workId, c: count() })
        .from(worksCommentsTable)
        .where(inArray(worksCommentsTable.workId, ids))
        .groupBy(worksCommentsTable.workId);
      for (const r of commentRows) commentMap.set(r.workId, Number(r.c));
    }
    const works = rows.map((r) => ({
      ...r,
      likesCount: likeMap.get(r.work.id) ?? 0,
      commentsCount: commentMap.get(r.work.id) ?? 0,
    }));

    res.json({ works, total, page, totalPages });
  } catch (err) {
    logger.error({ err }, "GET /works failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Mine ───────────────────────────────────────────────────────────────────

router.get("/works/mine", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const rows = await db
      .select()
      .from(worksTable)
      .where(eq(worksTable.userId, session.userId))
      .orderBy(desc(worksTable.createdAt));
    res.json({ works: rows });
  } catch (err) {
    logger.error({ err }, "GET /works/mine failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Public detail ──────────────────────────────────────────────────────────

router.get("/works/:id", optionalUser, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [row] = await db
      .select({
        work: worksTable,
        author: {
          id: usersTable.id,
          fullName: usersTable.fullName,
          role: usersTable.role,
          avatarUrl: usersTable.avatarUrl,
          bio: usersTable.bio,
          jobTitle: usersTable.jobTitle,
          portfolioUrl: usersTable.portfolioUrl,
          linkedinUrl: usersTable.linkedinUrl,
          behanceUrl: usersTable.behanceUrl,
          githubUrl: usersTable.githubUrl,
          otherLinks: usersTable.otherLinks,
          phone: usersTable.phone,
          authorStatus: usersTable.status,
        },
      })
      .from(worksTable)
      .innerJoin(usersTable, eq(usersTable.id, worksTable.userId))
      .where(eq(worksTable.id, id))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const session = (req as Request & { userSession?: UserSession }).userSession;
    const isOwner = session?.userId === row.author.id;
    // Hidden works and inactive authors are only viewable by their owner.
    // Admins moderate via dedicated /api/admin/* endpoints.
    if (
      !isOwner &&
      (!isPublicWorkStatus(row.work.status) || row.author.authorStatus !== "active")
    ) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    // Strip the internal authorStatus before responding.
    const { authorStatus: _omit, ...authorSafe } = row.author;
    void _omit;
    // Phone is contact info — only expose to authenticated members
    // to prevent scraping by anonymous visitors.
    const author = session
      ? authorSafe
      : { ...authorSafe, phone: null as unknown as string };

    const [{ likesCount }] = await db
      .select({ likesCount: count() })
      .from(worksLikesTable)
      .where(eq(worksLikesTable.workId, id));
    let likedByMe = false;
    if (session) {
      const [liked] = await db
        .select({ id: worksLikesTable.id })
        .from(worksLikesTable)
        .where(and(eq(worksLikesTable.workId, id), eq(worksLikesTable.userId, session.userId)))
        .limit(1);
      likedByMe = !!liked;
    }
    const [{ commentsCount }] = await db
      .select({ commentsCount: count() })
      .from(worksCommentsTable)
      .where(eq(worksCommentsTable.workId, id));
    let savedByMe = false;
    if (session) {
      const [saved] = await db
        .select({ id: worksSavesTable.id })
        .from(worksSavesTable)
        .where(and(eq(worksSavesTable.workId, id), eq(worksSavesTable.userId, session.userId)))
        .limit(1);
      savedByMe = !!saved;
    }

    res.json({ work: row.work, author, isOwner, likesCount, likedByMe, commentsCount, savedByMe });
  } catch (err) {
    logger.error({ err }, "GET /works/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Create / update / delete (owner) ───────────────────────────────────────

router.post("/works", requireUser, rlWork, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const parsed = upsertWorkSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "بيانات غير صحيحة",
        details: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
      return;
    }
    const d = parsed.data;
    const [row] = await db
      .insert(worksTable)
      .values({
        userId: session.userId,
        title: d.title,
        summary: d.summary,
        description: d.description,
        coverUrl: d.coverUrl ?? null,
        galleryUrls: d.galleryUrls ?? [],
        videoUrl: d.videoUrl ?? "",
        link: d.link,
        tags: d.tags,
      })
      .returning();
    invalidateNumbersCache();
    // Auto-award the "first work" badge (idempotent; no-op if not minted).
    void awardBadgeByKey(session.userId, "first_work");
    // …and the "prolific" milestone once they've published 5+ works.
    void awardWorksMilestone(session.userId);
    // Notify followers of the new work (fire-and-forget; never blocks the response).
    void notifyFollowersOfNewWork(session.userId, row);
    res.json({ work: row });
  } catch (err) {
    logger.error({ err }, "POST /works failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/works/:id", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = upsertWorkSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "بيانات غير صحيحة",
        details: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
      return;
    }
    const d = parsed.data;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (d.title !== undefined) update.title = d.title;
    if (d.summary !== undefined) update.summary = d.summary;
    if (d.description !== undefined) update.description = d.description;
    if (d.coverUrl !== undefined) update.coverUrl = d.coverUrl;
    if (d.galleryUrls !== undefined) update.galleryUrls = d.galleryUrls;
    if (d.videoUrl !== undefined) update.videoUrl = d.videoUrl;
    if (d.link !== undefined) update.link = d.link;
    if (d.tags !== undefined) update.tags = d.tags;
    const [row] = await db
      .update(worksTable)
      .set(update)
      .where(and(eq(worksTable.id, id), eq(worksTable.userId, session.userId)))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    invalidateNumbersCache();
    res.json({ work: row });
  } catch (err) {
    logger.error({ err }, "PATCH /works/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/works/:id", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    await db
      .delete(worksTable)
      .where(and(eq(worksTable.id, id), eq(worksTable.userId, session.userId)));
    invalidateNumbersCache();
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /works/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Public profile (used by /u/:id and to render author cards) ─────────────

router.get("/users/:id", optionalUser, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [u] = await db
      .select({
        id: usersTable.id,
        status: usersTable.status,
        fullName: usersTable.fullName,
        role: usersTable.role,
        avatarUrl: usersTable.avatarUrl,
        bio: usersTable.bio,
        jobTitle: usersTable.jobTitle,
        skills: usersTable.skills,
        portfolioUrl: usersTable.portfolioUrl,
        linkedinUrl: usersTable.linkedinUrl,
        behanceUrl: usersTable.behanceUrl,
        githubUrl: usersTable.githubUrl,
        otherLinks: usersTable.otherLinks,
        phone: usersTable.phone,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);
    if (!u || u.status !== "active") {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const session = (req as Request & { userSession?: UserSession }).userSession;
    const isOwner = session?.userId === id;
    const works = await db
      .select()
      .from(worksTable)
      .where(
        isOwner
          ? eq(worksTable.userId, id)
          : and(
              eq(worksTable.userId, id),
              inArray(worksTable.status, PUBLIC_WORK_STATUSES),
            ),
      )
      .orderBy(desc(worksTable.createdAt));
    // Earned badges (public — same data the leaderboard already exposes).
    const badges = await db
      .select({
        id: badgesTable.id,
        key: badgesTable.key,
        name: badgesTable.name,
        description: badgesTable.description,
        icon: badgesTable.icon,
        color: badgesTable.color,
      })
      .from(userBadgesTable)
      .innerJoin(badgesTable, eq(badgesTable.id, userBadgesTable.badgeId))
      .where(eq(userBadgesTable.userId, id))
      .orderBy(desc(userBadgesTable.awardedAt));
    // Follow graph: follower/following counts (public) + whether the viewer
    // already follows this member (only meaningful when signed in).
    const [[followers], [following]] = await Promise.all([
      db
        .select({ c: count() })
        .from(userFollowsTable)
        .where(eq(userFollowsTable.followingId, id)),
      db
        .select({ c: count() })
        .from(userFollowsTable)
        .where(eq(userFollowsTable.followerId, id)),
    ]);
    let followedByMe = false;
    if (session && !isOwner) {
      const [edge] = await db
        .select({ id: userFollowsTable.id })
        .from(userFollowsTable)
        .where(
          and(
            eq(userFollowsTable.followerId, session.userId),
            eq(userFollowsTable.followingId, id),
          ),
        )
        .limit(1);
      followedByMe = Boolean(edge);
    }
    // Strip internal fields before sending: status is for server-side checks only.
    // Phone is contact info — only expose to authenticated members
    // to prevent anonymous scraping by ID enumeration.
    const { status: _status, ...uPublic } = u;
    const user = session ? uPublic : { ...uPublic, phone: null as unknown as string };
    res.json({
      user,
      works,
      badges,
      followersCount: followers?.c ?? 0,
      followingCount: following?.c ?? 0,
      followedByMe,
    });
  } catch (err) {
    logger.error({ err }, "GET /users/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Follow / unfollow a member (toggle) ─────────────────────────────────────

router.post("/users/:id/follow", requireUser, rlFollow, async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const session = (req as Request & { userSession: UserSession }).userSession;
    if (targetId === session.userId) {
      res.status(400).json({ error: "لا يمكنك متابعة نفسك" });
      return;
    }
    // Target must be an active member (don't let users follow ghosts/admins by id).
    const [target] = await db
      .select({ id: usersTable.id, fullName: usersTable.fullName })
      .from(usersTable)
      .where(and(eq(usersTable.id, targetId), eq(usersTable.status, "active")))
      .limit(1);
    if (!target) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    // Atomic toggle: try to create the edge first. If nothing was inserted the
    // edge already existed → this is an unfollow. Branching on a separate
    // SELECT would race two concurrent toggles into an inconsistent state.
    const inserted = await db
      .insert(userFollowsTable)
      .values({ followerId: session.userId, followingId: targetId })
      .onConflictDoNothing()
      .returning({ id: userFollowsTable.id });
    let following: boolean;
    if (inserted.length === 0) {
      await db
        .delete(userFollowsTable)
        .where(
          and(
            eq(userFollowsTable.followerId, session.userId),
            eq(userFollowsTable.followingId, targetId),
          ),
        );
      following = false;
    } else {
      following = true;
      // Tell the followed member who their new follower is — only on a genuine
      // new edge, and throttled per pair to defeat follow/unfollow spam.
      if (shouldNotifyNewFollower(session.userId, targetId)) {
        const [me] = await db
          .select({ fullName: usersTable.fullName })
          .from(usersTable)
          .where(eq(usersTable.id, session.userId))
          .limit(1);
        void notify(targetId, {
          type: "new_follower",
          title: "متابِع جديد",
          body: `بدأ ${me?.fullName ?? "أحد الأعضاء"} بمتابعتك`,
          link: `/u/${session.userId}`,
        });
      }
      // "well connected" milestone once the target reaches 10+ followers.
      void awardFollowersMilestone(targetId);
    }
    // Return the authoritative count so the client never drifts.
    const [fc] = await db
      .select({ c: count() })
      .from(userFollowsTable)
      .where(eq(userFollowsTable.followingId, targetId));
    res.json({ following, followersCount: fc?.c ?? 0 });
  } catch (err) {
    logger.error({ err }, "POST /users/:id/follow failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Likes (toggle) ──────────────────────────────────────────────────────────

router.post("/works/:id/like", requireUser, rlToggle, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const work = await loadInteractableWork(id, session.userId);
    if (!work) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    // Atomic toggle: insert-first; nothing inserted → it existed → unlike.
    // (Same hardened pattern as follow/save; avoids the SELECT-then-write race.)
    const inserted = await db
      .insert(worksLikesTable)
      .values({ workId: id, userId: session.userId })
      .onConflictDoNothing()
      .returning({ id: worksLikesTable.id });
    let liked: boolean;
    if (inserted.length === 0) {
      await db
        .delete(worksLikesTable)
        .where(and(eq(worksLikesTable.workId, id), eq(worksLikesTable.userId, session.userId)));
      liked = false;
    } else {
      liked = true;
    }
    const [{ likesCount }] = await db
      .select({ likesCount: count() })
      .from(worksLikesTable)
      .where(eq(worksLikesTable.workId, id));
    res.json({ liked, likesCount });
  } catch (err) {
    logger.error({ err }, "POST /works/:id/like failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Save / bookmark (toggle) ────────────────────────────────────────────────

router.post("/works/:id/save", requireUser, rlToggle, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const work = await loadInteractableWork(id, session.userId);
    if (!work) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    // Atomic toggle: insert-first; nothing inserted → it existed → un-save.
    const inserted = await db
      .insert(worksSavesTable)
      .values({ workId: id, userId: session.userId })
      .onConflictDoNothing()
      .returning({ id: worksSavesTable.id });
    let saved: boolean;
    if (inserted.length === 0) {
      await db
        .delete(worksSavesTable)
        .where(and(eq(worksSavesTable.workId, id), eq(worksSavesTable.userId, session.userId)));
      saved = false;
    } else {
      saved = true;
    }
    res.json({ saved });
  } catch (err) {
    logger.error({ err }, "POST /works/:id/save failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// The signed-in member's saved works (most-recently-saved first), with author
// and engagement counts — same card shape the gallery uses.
router.get("/me/saved", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const requestedPage = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);

    const where = and(
      eq(worksSavesTable.userId, session.userId),
      eq(usersTable.status, "active"),
      inArray(worksTable.status, PUBLIC_WORK_STATUSES) as never,
    );

    const [{ total }] = await db
      .select({ total: count() })
      .from(worksSavesTable)
      .innerJoin(worksTable, eq(worksTable.id, worksSavesTable.workId))
      .innerJoin(usersTable, eq(usersTable.id, worksTable.userId))
      .where(where);

    const totalPages = Math.max(1, Math.ceil(total / WORKS_PAGE_SIZE));
    const page = Math.min(requestedPage, totalPages);

    const rows = await db
      .select({
        work: worksTable,
        author: {
          id: usersTable.id,
          fullName: usersTable.fullName,
          role: usersTable.role,
          avatarUrl: usersTable.avatarUrl,
        },
        savedAt: worksSavesTable.createdAt,
      })
      .from(worksSavesTable)
      .innerJoin(worksTable, eq(worksTable.id, worksSavesTable.workId))
      .innerJoin(usersTable, eq(usersTable.id, worksTable.userId))
      .where(where)
      .orderBy(desc(worksSavesTable.createdAt))
      .limit(WORKS_PAGE_SIZE)
      .offset((page - 1) * WORKS_PAGE_SIZE);

    const ids = rows.map((r) => r.work.id);
    const likeMap = new Map<number, number>();
    const commentMap = new Map<number, number>();
    if (ids.length > 0) {
      const likeRows = await db
        .select({ workId: worksLikesTable.workId, c: count() })
        .from(worksLikesTable)
        .where(inArray(worksLikesTable.workId, ids))
        .groupBy(worksLikesTable.workId);
      for (const r of likeRows) likeMap.set(r.workId, Number(r.c));
      const commentRows = await db
        .select({ workId: worksCommentsTable.workId, c: count() })
        .from(worksCommentsTable)
        .where(inArray(worksCommentsTable.workId, ids))
        .groupBy(worksCommentsTable.workId);
      for (const r of commentRows) commentMap.set(r.workId, Number(r.c));
    }

    const works = rows.map((r) => ({
      work: r.work,
      author: r.author,
      likesCount: likeMap.get(r.work.id) ?? 0,
      commentsCount: commentMap.get(r.work.id) ?? 0,
    }));
    res.json({ works, total, page, totalPages });
  } catch (err) {
    logger.error({ err }, "GET /me/saved failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Comments ────────────────────────────────────────────────────────────────

const COMMENT_MAX = 1000;

router.get("/works/:id/comments", optionalUser, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const session = (req as Request & { userSession?: UserSession }).userSession;
    const work = await loadInteractableWork(id, session?.userId);
    if (!work) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const rows = await db
      .select({
        id: worksCommentsTable.id,
        body: worksCommentsTable.body,
        createdAt: worksCommentsTable.createdAt,
        editedAt: worksCommentsTable.editedAt,
        parentId: worksCommentsTable.parentId,
        author: {
          id: usersTable.id,
          fullName: usersTable.fullName,
          avatarUrl: usersTable.avatarUrl,
          role: usersTable.role,
        },
      })
      .from(worksCommentsTable)
      .innerJoin(usersTable, eq(usersTable.id, worksCommentsTable.userId))
      // Exclude banned authors so a ban redacts their comments too — every
      // other read in this layer already AND-s users.status='active'.
      .where(and(eq(worksCommentsTable.workId, id), eq(usersTable.status, "active")))
      .orderBy(asc(worksCommentsTable.createdAt))
      .limit(500);

    const meId = session?.userId ?? null;
    const isWorkOwner = meId !== null && work.userId === meId;
    const decorate = (c: (typeof rows)[number]) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      editedAt: c.editedAt,
      parentId: c.parentId,
      author: c.author,
      // Only the author may edit; the work owner may delete (moderate) but not
      // edit someone else's words.
      canEdit: meId !== null && c.author.id === meId,
      canDelete: meId !== null && (c.author.id === meId || isWorkOwner),
    });
    // Nest one level: top-level comments newest-first, replies chronological.
    type Decorated = ReturnType<typeof decorate>;
    const repliesByParent = new Map<number, Decorated[]>();
    const top: Array<Decorated & { replies: Decorated[] }> = [];
    for (const c of rows) {
      const d = decorate(c);
      if (c.parentId == null) {
        top.push({ ...d, replies: [] });
      } else {
        const arr = repliesByParent.get(c.parentId) ?? [];
        arr.push(d);
        repliesByParent.set(c.parentId, arr);
      }
    }
    for (const t of top) t.replies = repliesByParent.get(t.id) ?? [];
    top.reverse(); // rows were asc; reversing top-level → newest first
    res.json({ comments: top });
  } catch (err) {
    logger.error({ err }, "GET /works/:id/comments failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/works/:id/comments", requireUser, rlComment, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
    if (!body) {
      res.status(400).json({ error: "التعليق فارغ" });
      return;
    }
    if (body.length > COMMENT_MAX) {
      res.status(400).json({ error: `الحد الأقصى ${COMMENT_MAX} حرف` });
      return;
    }
    const work = await loadInteractableWork(id, session.userId);
    if (!work) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    // Optional reply target. Enforce one-level threading: a reply to a reply
    // attaches to the top-level ancestor. The notification still goes to the
    // author of the comment the user actually clicked "reply" on.
    let parentId: number | null = null;
    let parent: { id: number; userId: number; parentId: number | null } | null = null;
    const rawParent = req.body?.parentId;
    if (rawParent !== undefined && rawParent !== null && rawParent !== "") {
      const pid = Number(rawParent);
      if (!Number.isInteger(pid) || pid <= 0) {
        res.status(400).json({ error: "تعليق غير صالح" });
        return;
      }
      const [p] = await db
        .select({
          id: worksCommentsTable.id,
          userId: worksCommentsTable.userId,
          parentId: worksCommentsTable.parentId,
          workId: worksCommentsTable.workId,
        })
        .from(worksCommentsTable)
        .where(eq(worksCommentsTable.id, pid))
        .limit(1);
      if (!p || p.workId !== id) {
        res.status(404).json({ error: "غير موجود" });
        return;
      }
      parent = { id: p.id, userId: p.userId, parentId: p.parentId };
      parentId = p.parentId ?? p.id;
    }
    const [row] = await db
      .insert(worksCommentsTable)
      .values({ workId: id, userId: session.userId, body, parentId })
      .returning();
    const [author] = await db
      .select({
        id: usersTable.id,
        fullName: usersTable.fullName,
        avatarUrl: usersTable.avatarUrl,
        role: usersTable.role,
      })
      .from(usersTable)
      .where(eq(usersTable.id, session.userId))
      .limit(1);
    const name = author?.fullName ?? "أحد الأعضاء";
    // "conversationalist" milestone once they've posted 10+ comments/replies.
    void awardCommentsMilestone(session.userId);
    // Notify the person being replied to (skip self).
    if (parent && parent.userId !== session.userId) {
      void notify(parent.userId, {
        type: "work_comment",
        title: "ردّ على تعليقك 💬",
        body: `ردّ ${name} على تعليقك في «${work.title}».`,
        link: `/works/${id}`,
      });
    }
    // Tell the work's author someone engaged (skip self, and skip if they were
    // already notified above as the replied-to commenter).
    if (work.userId !== session.userId && work.userId !== parent?.userId) {
      void notify(work.userId, {
        type: "work_comment",
        title: parent ? "ردّ جديد على عملك 💬" : "تعليق جديد على عملك 💬",
        body: parent
          ? `ردّ ${name} على تعليق في «${work.title}».`
          : `علّق ${name} على «${work.title}».`,
        link: `/works/${id}`,
      });
    }
    res.json({
      comment: {
        id: row.id,
        body: row.body,
        createdAt: row.createdAt,
        editedAt: row.editedAt,
        parentId: row.parentId,
        author,
        canEdit: true,
        canDelete: true,
      },
    });
  } catch (err) {
    logger.error({ err }, "POST /works/:id/comments failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// Edit a comment — author only (the work owner may delete but not reword).
router.patch("/works/:id/comments/:commentId", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const id = Number(req.params.id);
    const commentId = Number(req.params.commentId);
    if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(commentId) || commentId <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
    if (!body) {
      res.status(400).json({ error: "التعليق فارغ" });
      return;
    }
    if (body.length > COMMENT_MAX) {
      res.status(400).json({ error: `الحد الأقصى ${COMMENT_MAX} حرف` });
      return;
    }
    const [c] = await db
      .select({ id: worksCommentsTable.id, userId: worksCommentsTable.userId, workId: worksCommentsTable.workId })
      .from(worksCommentsTable)
      .where(eq(worksCommentsTable.id, commentId))
      .limit(1);
    if (!c || c.workId !== id) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    if (c.userId !== session.userId) {
      res.status(403).json({ error: "غير مصرّح" });
      return;
    }
    const [row] = await db
      .update(worksCommentsTable)
      .set({ body, editedAt: new Date() })
      .where(eq(worksCommentsTable.id, commentId))
      .returning({ id: worksCommentsTable.id, body: worksCommentsTable.body, editedAt: worksCommentsTable.editedAt });
    res.json({ comment: row });
  } catch (err) {
    logger.error({ err }, "PATCH /works/:id/comments/:commentId failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/works/:id/comments/:commentId", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const id = Number(req.params.id);
    const commentId = Number(req.params.commentId);
    if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(commentId) || commentId <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [c] = await db
      .select({
        id: worksCommentsTable.id,
        userId: worksCommentsTable.userId,
        workId: worksCommentsTable.workId,
      })
      .from(worksCommentsTable)
      .where(eq(worksCommentsTable.id, commentId))
      .limit(1);
    if (!c || c.workId !== id) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    // The commenter — or the work's author (moderating their own work) — may delete.
    let allowed = c.userId === session.userId;
    if (!allowed) {
      const [work] = await db
        .select({ userId: worksTable.userId })
        .from(worksTable)
        .where(eq(worksTable.id, id))
        .limit(1);
      allowed = !!work && work.userId === session.userId;
    }
    if (!allowed) {
      res.status(403).json({ error: "غير مصرّح" });
      return;
    }
    await db.delete(worksCommentsTable).where(eq(worksCommentsTable.id, commentId));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /works/:id/comments/:commentId failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
```


# WEB — pages (artifacts/ih-haven/src)

## `artifacts/ih-haven/src/pages/Saved.tsx`
*(162 lines)*

```tsx
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Heart, MessageCircle, Bookmark } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import { useAuth, type UserRole } from "@/lib/auth";

interface SavedRow {
  work: {
    id: number;
    title: string;
    summary: string;
    coverUrl: string | null;
  };
  author: {
    id: number;
    fullName: string;
    role: UserRole;
    avatarUrl: string | null;
  };
  likesCount?: number;
  commentsCount?: number;
}

export default function Saved() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [rows, setRows] = useState<SavedRow[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "المحفوظات — آيلاند هيفن";
  }, []);

  // Saved works require a signed-in member; send guests to login (and back).
  useEffect(() => {
    if (!authLoading && !user) navigate("/login?next=/saved");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setRows(null);
    setError(null);
    api<{ works: SavedRow[]; totalPages: number }>(`/me/saved?page=${page}`)
      .then((r) => {
        if (cancelled) return;
        setRows(r.works);
        setTotalPages(r.totalPages ?? 1);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
      });
    return () => { cancelled = true; };
  }, [user, page]);

  return (
    <PageShell
      active="works"
      eyebrow="مكتبتك"
      title="الأعمال"
      highlight="المحفوظة"
      subtitle="الأعمال التي حفظتها للرجوع إليها لاحقًا — قائمة خاصّة بك."
    >
      {error && (
        <GlassCard className="p-5 text-red-200 text-center">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-72 rounded-[24px] bg-white/[0.035] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : rows && rows.length === 0 ? (
        <EmptyState
          title="لا توجد أعمال محفوظة بعد"
          hint="اضغط «حفظ» على أيّ عمل يعجبك ليظهر هنا."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rows?.map((row) => (
            <Link
              key={row.work.id}
              href={`/works/${row.work.id}`}
              className="group block h-full"
              data-testid={`saved-work-${row.work.id}`}
            >
              <GlassCard className="h-full flex flex-col hover:border-primary/40 transition-colors">
                {row.work.coverUrl ? (
                  <div className="aspect-[16/10] overflow-hidden bg-black/30">
                    <img
                      src={row.work.coverUrl}
                      alt={row.work.title}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-center justify-center">
                    <Bookmark className="w-6 h-6 text-white/25" />
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-white font-bold text-[14.5px] leading-snug line-clamp-2">
                    {row.work.title}
                  </h3>
                  {row.work.summary && (
                    <p className="text-white/55 text-[12.5px] mt-1 line-clamp-2">
                      {row.work.summary}
                    </p>
                  )}
                  <div className="mt-auto pt-3 flex items-center gap-4 text-white/45 text-[12px]">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />
                      <span className="tabular-nums">{row.likesCount ?? 0}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="tabular-nums">{row.commentsCount ?? 0}</span>
                    </span>
                    <span className="ms-auto text-white/55 truncate">
                      {row.author.fullName}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10" dir="ltr">
          <button
            onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={page <= 1}
            className="px-4 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-white/70 text-[13px] font-semibold hover:bg-white/[0.11] disabled:opacity-35 disabled:cursor-not-allowed transition-all"
          >
            ←
          </button>
          <span className="text-white/55 text-[13px] tabular-nums px-2">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-white/70 text-[13px] font-semibold hover:bg-white/[0.11] disabled:opacity-35 disabled:cursor-not-allowed transition-all"
          >
            →
          </button>
        </div>
      )}
    </PageShell>
  );
}
```

## `artifacts/ih-haven/src/pages/WorkDetail.tsx`
*(1065 lines)*

```tsx
import { useEffect, useMemo, useState } from "react";
import { usePageMeta } from "@/hooks/use-meta";
import { Link, useLocation, useRoute } from "wouter";
import {
  ExternalLink,
  Pencil,
  Trash2,
  Phone,
  Briefcase,
  Linkedin,
  Github,
  Globe,
  Youtube,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Bookmark,
  Reply,
  Send,
  Loader2,
} from "lucide-react";
import { PageShell, GlassCard, BackLink } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import { ROLE_LABELS, useAuth, type ExtraLink, type UserRole } from "@/lib/auth";
import { splitTags, formatArabicDate } from "@/lib/labels";

interface DetailResp {
  work: {
    id: number;
    userId: number;
    title: string;
    summary: string;
    description: string;
    coverUrl: string | null;
    galleryUrls: string[] | null;
    videoUrl: string | null;
    link: string;
    tags: string;
    createdAt: string;
  };
  author: {
    id: number;
    fullName: string;
    role: UserRole;
    avatarUrl: string | null;
    bio: string;
    jobTitle: string;
    portfolioUrl: string;
    linkedinUrl: string;
    behanceUrl: string;
    githubUrl: string;
    otherLinks: ExtraLink[];
    phone: string;
  };
  isOwner: boolean;
  likesCount: number;
  likedByMe: boolean;
  commentsCount: number;
  savedByMe: boolean;
}

interface WorkComment {
  id: number;
  body: string;
  createdAt: string;
  editedAt?: string | null;
  parentId?: number | null;
  author: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
    role: UserRole;
  };
  canEdit?: boolean;
  canDelete: boolean;
  replies?: WorkComment[];
}

/**
 * Parse a YouTube URL into the canonical "embed" URL.
 * Returns null when the URL doesn't look like YouTube — we then render
 * the raw link as a fallback rather than a broken iframe.
 */
function youtubeEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");
    let id = "";
    if (host === "youtu.be") {
      id = u.pathname.slice(1);
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") id = u.searchParams.get("v") || "";
      else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2] || "";
      else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/")[2] || "";
    }
    if (!/^[a-zA-Z0-9_-]{6,20}$/.test(id)) return null;
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
  } catch {
    return null;
  }
}

export default function WorkDetail() {
  const [, params] = useRoute("/works/:id");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const id = params?.id;
  const [data, setData] = useState<DetailResp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);

  // Likes
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [liking, setLiking] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Comments
  const [comments, setComments] = useState<WorkComment[]>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyPosting, setReplyPosting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  // Error for the inline reply/edit composers (shown next to them, not at the
  // top-of-thread comment box where `commentError` renders).
  const [composerError, setComposerError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    // Guard against a stale response from a previous work overwriting the
    // current one when navigating /works/1 → /works/2 (the component stays
    // mounted, so both fetches are in flight).
    let cancelled = false;
    setData(null);
    setError(null);
    setComments([]);
    api<DetailResp>(`/works/${id}`)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setLiked(d.likedByMe);
        setLikesCount(d.likesCount);
        setCommentsCount(d.commentsCount);
        setSaved(d.savedByMe);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
      });
    api<{ comments: WorkComment[] }>(`/works/${id}/comments`)
      .then((r) => {
        if (!cancelled) setComments(r.comments);
      })
      .catch(() => {
        /* comments are non-critical; ignore load errors */
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function toggleLike() {
    if (!id || liking) return;
    if (!user) {
      navigate(`/login?next=/works/${id}`);
      return;
    }
    setLiking(true);
    // optimistic
    const prevLiked = liked;
    const prevCount = likesCount;
    setLiked(!prevLiked);
    setLikesCount(prevCount + (prevLiked ? -1 : 1));
    try {
      const r = await api<{ liked: boolean; likesCount: number }>(
        `/works/${id}/like`,
        { method: "POST" },
      );
      setLiked(r.liked);
      setLikesCount(r.likesCount);
    } catch {
      setLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setLiking(false);
    }
  }

  async function toggleSave() {
    if (!id || saving) return;
    if (!user) {
      navigate(`/login?next=/works/${id}`);
      return;
    }
    setSaving(true);
    const prev = saved;
    setSaved(!prev); // optimistic
    try {
      const r = await api<{ saved: boolean }>(`/works/${id}/save`, { method: "POST" });
      setSaved(r.saved);
    } catch {
      setSaved(prev);
    } finally {
      setSaving(false);
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!id || posting) return;
    const body = commentText.trim();
    if (!body) return;
    setPosting(true);
    setCommentError(null);
    try {
      const r = await api<{ comment: WorkComment }>(`/works/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setComments((cs) => [{ ...r.comment, replies: [] }, ...cs]);
      setCommentsCount((c) => c + 1);
      setCommentText("");
    } catch (err) {
      setCommentError(err instanceof ApiError ? err.message : "تعذّر النشر");
    } finally {
      setPosting(false);
    }
  }

  async function submitReply(e: React.FormEvent, parentId: number, topLevelId: number) {
    e.preventDefault();
    if (!id || replyPosting) return;
    const body = replyText.trim();
    if (!body) return;
    setReplyPosting(true);
    setComposerError(null);
    try {
      const r = await api<{ comment: WorkComment }>(`/works/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body, parentId }),
      });
      // Server re-points the reply at the top-level ancestor; place it there.
      const rootId = r.comment.parentId ?? topLevelId;
      setComments((cs) =>
        cs.map((c) =>
          c.id === rootId
            ? { ...c, replies: [...(c.replies ?? []), r.comment] }
            : c,
        ),
      );
      setCommentsCount((n) => n + 1);
      setReplyText("");
      setReplyingTo(null);
    } catch (err) {
      setComposerError(err instanceof ApiError ? err.message : "تعذّر النشر");
    } finally {
      setReplyPosting(false);
    }
  }

  function startEdit(c: WorkComment) {
    setEditingId(c.id);
    setEditText(c.body);
    setReplyingTo(null);
    setComposerError(null);
  }

  async function submitEdit(e: React.FormEvent, commentId: number) {
    e.preventDefault();
    if (!id || editBusy) return;
    const body = editText.trim();
    if (!body) return;
    setEditBusy(true);
    setComposerError(null);
    try {
      const r = await api<{ comment: { id: number; body: string; editedAt: string | null } }>(
        `/works/${id}/comments/${commentId}`,
        { method: "PATCH", body: JSON.stringify({ body }) },
      );
      const applyEdit = (c: WorkComment): WorkComment =>
        c.id === commentId ? { ...c, body: r.comment.body, editedAt: r.comment.editedAt } : c;
      // Apply to both levels; only the matching id changes.
      setComments((cs) =>
        cs.map((c) => ({ ...applyEdit(c), replies: (c.replies ?? []).map(applyEdit) })),
      );
      setEditingId(null);
      setEditText("");
    } catch (err) {
      setComposerError(err instanceof ApiError ? err.message : "تعذّر الحفظ");
    } finally {
      setEditBusy(false);
    }
  }

  async function deleteComment(commentId: number, rootId?: number) {
    if (!id) return;
    const prev = comments;
    const prevCount = commentsCount;
    if (rootId != null) {
      // Deleting a reply: drop it from its thread.
      setComments((cs) =>
        cs.map((c) =>
          c.id === rootId
            ? { ...c, replies: (c.replies ?? []).filter((rep) => rep.id !== commentId) }
            : c,
        ),
      );
      setCommentsCount((n) => Math.max(0, n - 1));
    } else {
      // Deleting a top-level comment also removes its replies (DB cascade).
      const removed = comments.find((c) => c.id === commentId);
      const drop = 1 + (removed?.replies?.length ?? 0);
      setComments((cs) => cs.filter((c) => c.id !== commentId));
      setCommentsCount((n) => Math.max(0, n - drop));
    }
    try {
      await api(`/works/${id}/comments/${commentId}`, { method: "DELETE" });
    } catch {
      setComments(prev);
      setCommentsCount(prevCount);
    }
  }

  usePageMeta({
    title: data?.work.title,
    description: data?.work.summary || undefined,
    image: data?.work.coverUrl || undefined,
    type: "article",
  });

  const allImages = useMemo(() => {
    if (!data) return [];
    const xs: string[] = [];
    if (data.work.coverUrl) xs.push(data.work.coverUrl);
    if (Array.isArray(data.work.galleryUrls)) xs.push(...data.work.galleryUrls);
    return xs;
  }, [data]);

  // Esc + arrows for lightbox
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      else if (e.key === "ArrowLeft")
        setLightbox((i) =>
          i === null ? null : Math.min(allImages.length - 1, i + 1),
        );
      else if (e.key === "ArrowRight")
        setLightbox((i) => (i === null ? null : Math.max(0, i - 1)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, allImages.length]);

  async function onDelete() {
    if (!id) return;
    if (!window.confirm("هل تريد حذف هذا العمل نهائيًا؟")) return;
    try {
      await api(`/works/${id}`, { method: "DELETE" });
      navigate("/works");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحذف");
    }
  }

  if (error && !data) {
    return (
      <PageShell active="works">
        <BackLink href="/works" label="عودة للمعرض" />
        <GlassCard className="p-8 text-center text-red-200">{error}</GlassCard>
      </PageShell>
    );
  }
  if (!data) {
    return (
      <PageShell active="works">
        <div className="h-96 rounded-[28px] bg-white/[0.035] border border-white/10 animate-pulse" />
      </PageShell>
    );
  }

  const tags = splitTags(data.work.tags);
  const gallery = Array.isArray(data.work.galleryUrls) ? data.work.galleryUrls : [];
  const embed = youtubeEmbedUrl(data.work.videoUrl);

  const authorLinks: Array<{ label: string; url: string; Icon: React.ComponentType<{ className?: string }> }> = [];
  if (data.author.linkedinUrl)
    authorLinks.push({ label: "LinkedIn", url: data.author.linkedinUrl, Icon: Linkedin });
  if (data.author.githubUrl)
    authorLinks.push({ label: "GitHub", url: data.author.githubUrl, Icon: Github });
  if (data.author.portfolioUrl)
    authorLinks.push({ label: "الموقع", url: data.author.portfolioUrl, Icon: Globe });

  return (
    <PageShell active="works">
      <BackLink href="/works" label="كلّ الأعمال" />
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        <div className="space-y-6">
        <GlassCard>
          {data.work.coverUrl ? (
            <button
              type="button"
              onClick={() => setLightbox(0)}
              className="block w-full aspect-[16/10] overflow-hidden bg-black/30 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <img
                src={data.work.coverUrl}
                alt={data.work.title}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
              />
            </button>
          ) : (
            <div className="aspect-[16/10] bg-gradient-to-br from-primary/30 to-transparent" />
          )}
          <div className="p-6 sm:p-8">
            <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-3">
              {formatArabicDate(data.work.createdAt)}
            </div>
            <h1
              className="font-bold text-white leading-tight mb-3"
              style={{ fontSize: "clamp(1.7rem, 4vw, 2.4rem)" }}
              data-testid="text-work-title"
            >
              {data.work.title}
            </h1>
            {data.work.summary && (
              <p className="text-white/65 text-[15.5px] leading-[1.85] mb-5">
                {data.work.summary}
              </p>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11.5px] font-semibold border border-primary/30"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* Engagement: like toggle + jump-to-comments */}
            <div className="flex items-center gap-3 mb-6">
              <button
                type="button"
                onClick={toggleLike}
                disabled={liking}
                aria-pressed={liked}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[13px] font-bold transition-all ${
                  liked
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-white/[0.06] border-white/15 text-white/75 hover:bg-white/[0.1]"
                }`}
                data-testid="button-like-work"
              >
                <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                <span className="tabular-nums">{likesCount}</span>
                <span className="sr-only">إعجاب</span>
              </button>
              <a
                href="#comments"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/15 text-white/75 text-[13px] font-semibold hover:bg-white/[0.1] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="tabular-nums">{commentsCount}</span>
                <span className="sr-only">تعليق</span>
              </a>
              <button
                type="button"
                onClick={toggleSave}
                disabled={saving}
                aria-pressed={saved}
                className={`ms-auto inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[13px] font-bold transition-all ${
                  saved
                    ? "bg-amber-400/15 border-amber-400/40 text-amber-200"
                    : "bg-white/[0.06] border-white/15 text-white/75 hover:bg-white/[0.1]"
                }`}
                data-testid="button-save-work"
              >
                <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
                <span>{saved ? "محفوظ" : "حفظ"}</span>
              </button>
            </div>

            {data.work.description && (
              <div className="text-white/75 text-[14.5px] leading-[1.95] whitespace-pre-wrap">
                {data.work.description}
              </div>
            )}

            {/* Embedded video */}
            {embed && (
              <div className="mt-7">
                <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-3 flex items-center gap-2">
                  <Youtube className="w-4 h-4" /> فيديو
                </div>
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video">
                  <iframe
                    src={embed}
                    title={data.work.title}
                    loading="lazy"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="w-full h-full"
                    data-testid="video-embed"
                  />
                </div>
              </div>
            )}
            {!embed && data.work.videoUrl && (
              <a
                href={data.work.videoUrl}
                target="_blank"
                rel="noreferrer"
                dir="ltr"
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/15 text-white text-[12.5px] font-semibold hover:bg-white/[0.1] transition-colors"
              >
                <Youtube className="w-3.5 h-3.5" /> {data.work.videoUrl}
              </a>
            )}

            {/* Gallery thumbs */}
            {gallery.length > 0 && (
              <div className="mt-7">
                <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-3">
                  معرض الصّور — {gallery.length}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {gallery.map((url, i) => (
                    <button
                      key={`${url}-${i}`}
                      type="button"
                      onClick={() => setLightbox(data.work.coverUrl ? i + 1 : i)}
                      className="aspect-square rounded-xl overflow-hidden border border-white/10 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                      data-testid={`work-gallery-${i}`}
                    >
                      <img
                        src={url}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {data.work.link && (
              <a
                href={data.work.link}
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-bold text-[13px] hover:shadow-[0_14px_30px_-10px_rgba(220,38,55,0.55)] hover:-translate-y-px transition-all"
                data-testid="link-external-work"
                dir="ltr"
              >
                <ExternalLink className="w-4 h-4" />
                {data.work.link}
              </a>
            )}
          </div>
        </GlassCard>

        {/* Comments */}
        <div id="comments">
          <GlassCard className="p-6 sm:p-8">
            <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-5 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> التعليقات — {commentsCount}
            </div>

            {user ? (
              <form onSubmit={submitComment} className="mb-6">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  aria-label="تعليقك"
                  placeholder="شاركنا رأيك في هذا العمل…"
                  className="w-full rounded-2xl bg-white/[0.05] border border-white/15 text-white text-[14px] leading-[1.8] p-4 resize-y focus:outline-none focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/50 placeholder:text-white/35"
                  data-testid="input-comment"
                />
                {commentError && (
                  <p className="text-red-300 text-[12.5px] mt-2">{commentError}</p>
                )}
                <div className="flex justify-end mt-3">
                  <button
                    type="submit"
                    disabled={posting || !commentText.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-bold text-[13px] disabled:opacity-50 hover:-translate-y-px transition-all"
                    data-testid="button-submit-comment"
                  >
                    {posting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    نشر
                  </button>
                </div>
              </form>
            ) : (
              <Link
                href="/login"
                className="block mb-6 text-center py-3 rounded-2xl bg-white/[0.05] border border-white/12 text-white/70 text-[13px] font-semibold hover:bg-white/[0.08] transition-colors"
              >
                سجّل الدخول للمشاركة بتعليق
              </Link>
            )}

            {comments.length === 0 ? (
              <p className="text-white/45 text-[13.5px] text-center py-6">
                لا توجد تعليقات بعد — كن أول من يعلّق.
              </p>
            ) : (
              <div className="space-y-5">
                {comments.map((c) => {
                  const replies = c.replies ?? [];
                  const threadIds = [c.id, ...replies.map((r) => r.id)];
                  const composerOpen =
                    replyingTo !== null && threadIds.includes(replyingTo);
                  return (
                    <div key={c.id} data-testid={`comment-${c.id}`}>
                      <div className="flex gap-3">
                        <Link href={`/u/${c.author.id}`} className="shrink-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/30 overflow-hidden flex items-center justify-center text-[13px] font-bold text-white">
                            {c.author.avatarUrl ? (
                              <img
                                src={c.author.avatarUrl}
                                alt={c.author.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (c.author.fullName || "·").slice(0, 1)
                            )}
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/u/${c.author.id}`}
                              className="text-white font-semibold text-[13px] hover:text-primary transition-colors truncate"
                            >
                              {c.author.fullName}
                            </Link>
                            <span className="text-white/35 text-[11px]">
                              {formatArabicDate(c.createdAt)}
                            </span>
                            {c.editedAt && (
                              <span className="text-white/30 text-[10.5px]">(عُدّل)</span>
                            )}
                            <div className="ms-auto flex items-center gap-2">
                              {c.canEdit && (
                                <button
                                  type="button"
                                  onClick={() => startEdit(c)}
                                  className="text-white/35 hover:text-primary transition-colors"
                                  aria-label="تعديل التعليق"
                                  data-testid={`edit-comment-${c.id}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {c.canDelete && (
                                <button
                                  type="button"
                                  onClick={() => deleteComment(c.id)}
                                  className="text-white/35 hover:text-red-300 transition-colors"
                                  aria-label="حذف التعليق"
                                  data-testid={`delete-comment-${c.id}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          {editingId === c.id ? (
                            <CommentEditForm
                              value={editText}
                              onChange={setEditText}
                              onSubmit={(e) => submitEdit(e, c.id)}
                              onCancel={() => { setEditingId(null); setComposerError(null); }}
                              busy={editBusy}
                              error={composerError}
                            />
                          ) : (
                            <>
                              <p className="text-white/75 text-[13.5px] leading-[1.85] mt-1 whitespace-pre-wrap break-words">
                                {c.body}
                              </p>
                              {user && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(null);
                                    setComposerError(null);
                                    setReplyingTo(c.id);
                                    setReplyText("");
                                  }}
                                  className="mt-1.5 inline-flex items-center gap-1 text-white/40 hover:text-primary text-[11.5px] font-semibold transition-colors"
                                  data-testid={`reply-comment-${c.id}`}
                                >
                                  <Reply className="w-3 h-3" /> رد
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {replies.length > 0 && (
                        <div className="mt-3 space-y-3 pe-12 ps-3 border-e border-white/10">
                          {replies.map((rep) => (
                            <div
                              key={rep.id}
                              className="flex gap-2.5"
                              data-testid={`comment-${rep.id}`}
                            >
                              <Link href={`/u/${rep.author.id}`} className="shrink-0">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/30 overflow-hidden flex items-center justify-center text-[11px] font-bold text-white">
                                  {rep.author.avatarUrl ? (
                                    <img
                                      src={rep.author.avatarUrl}
                                      alt={rep.author.fullName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    (rep.author.fullName || "·").slice(0, 1)
                                  )}
                                </div>
                              </Link>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/u/${rep.author.id}`}
                                    className="text-white font-semibold text-[12.5px] hover:text-primary transition-colors truncate"
                                  >
                                    {rep.author.fullName}
                                  </Link>
                                  <span className="text-white/35 text-[10.5px]">
                                    {formatArabicDate(rep.createdAt)}
                                  </span>
                                  {rep.editedAt && (
                                    <span className="text-white/30 text-[10px]">(عُدّل)</span>
                                  )}
                                  <div className="ms-auto flex items-center gap-2">
                                    {rep.canEdit && (
                                      <button
                                        type="button"
                                        onClick={() => startEdit(rep)}
                                        className="text-white/35 hover:text-primary transition-colors"
                                        aria-label="تعديل الرد"
                                        data-testid={`edit-comment-${rep.id}`}
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                    )}
                                    {rep.canDelete && (
                                      <button
                                        type="button"
                                        onClick={() => deleteComment(rep.id, c.id)}
                                        className="text-white/35 hover:text-red-300 transition-colors"
                                        aria-label="حذف الرد"
                                        data-testid={`delete-comment-${rep.id}`}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {editingId === rep.id ? (
                                  <CommentEditForm
                                    value={editText}
                                    onChange={setEditText}
                                    onSubmit={(e) => submitEdit(e, rep.id)}
                                    onCancel={() => { setEditingId(null); setComposerError(null); }}
                                    busy={editBusy}
                                    error={composerError}
                                  />
                                ) : (
                                  <>
                                    <p className="text-white/70 text-[13px] leading-[1.8] mt-0.5 whitespace-pre-wrap break-words">
                                      {rep.body}
                                    </p>
                                    {user && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingId(null);
                                          setComposerError(null);
                                          setReplyingTo(rep.id);
                                          setReplyText("");
                                        }}
                                        className="mt-1 inline-flex items-center gap-1 text-white/40 hover:text-primary text-[11px] font-semibold transition-colors"
                                        data-testid={`reply-comment-${rep.id}`}
                                      >
                                        <Reply className="w-3 h-3" /> رد
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {composerOpen && user && (
                        <div className="mt-3 pe-12 ps-3">
                          <form
                            onSubmit={(e) => submitReply(e, replyingTo!, c.id)}
                            className="flex items-center gap-2"
                          >
                            <input
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="اكتب ردًّا…"
                              autoFocus
                              maxLength={1000}
                              className="flex-1 h-10 px-3 rounded-xl bg-white/[0.05] border border-white/10 text-white text-[13px] placeholder-white/40 outline-none focus:border-primary/45 focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors"
                              data-testid={`reply-input-${c.id}`}
                            />
                            <button
                              type="submit"
                              disabled={replyPosting || !replyText.trim()}
                              className="h-10 px-3 rounded-xl bg-primary text-white font-bold text-[12px] disabled:opacity-50 inline-flex items-center gap-1"
                              data-testid={`reply-submit-${c.id}`}
                            >
                              {replyPosting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setReplyingTo(null); setComposerError(null); }}
                              className="h-10 px-2 text-white/45 hover:text-white text-[12px] font-semibold transition-colors"
                            >
                              إلغاء
                            </button>
                          </form>
                          {composerError && (
                            <p className="text-red-300 text-[12px] mt-1.5">{composerError}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>
        </div>

        <div className="space-y-5">
          <GlassCard className="p-6">
            <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-4">
              صاحب العمل
            </div>
            <Link
              href={`/u/${data.author.id}`}
              className="flex items-center gap-3 hover:opacity-90 transition-opacity"
              data-testid="link-author"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/40 overflow-hidden flex items-center justify-center text-[15px] font-bold text-white shrink-0">
                {data.author.avatarUrl ? (
                  <img
                    src={data.author.avatarUrl}
                    alt={data.author.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (data.author.fullName || "·").slice(0, 1)
                )}
              </div>
              <div className="leading-tight min-w-0">
                <div className="text-white font-semibold text-[14px] truncate">
                  {data.author.fullName}
                </div>
                <div className="text-primary text-[10.5px] tracking-[0.18em] uppercase font-bold mt-0.5">
                  {ROLE_LABELS[data.author.role]}
                </div>
              </div>
            </Link>
            {data.author.jobTitle && (
              <div className="mt-3 flex items-center gap-1.5 text-white/65 text-[12.5px]">
                <Briefcase className="w-3 h-3 shrink-0" />
                <span className="truncate">{data.author.jobTitle}</span>
              </div>
            )}
            {data.author.bio && (
              <p className="text-white/65 text-[13px] leading-[1.85] mt-4 line-clamp-4">
                {data.author.bio}
              </p>
            )}
            {authorLinks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {authorLinks.map(({ label, url, Icon }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/75 text-[11.5px] font-semibold hover:bg-white/[0.1] transition-colors"
                  >
                    <Icon className="w-3 h-3" /> {label}
                  </a>
                ))}
              </div>
            )}
            {data.author.phone && (
              <a
                href={`https://wa.me/${data.author.phone.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-[13px] font-semibold hover:bg-emerald-500/15 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> تواصل واتساب
              </a>
            )}
          </GlassCard>

          {data.isOwner && (
            <GlassCard className="p-6 space-y-2.5">
              <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-2">
                إدارة
              </div>
              <Link
                href={`/works/${data.work.id}/edit`}
                className="flex items-center gap-2 w-full py-2.5 px-4 rounded-2xl bg-white/[0.06] border border-white/15 text-white font-semibold text-[13px] hover:bg-white/[0.1] transition-colors"
                data-testid="button-edit-work"
              >
                <Pencil className="w-3.5 h-3.5" /> تعديل
              </Link>
              <button
                onClick={onDelete}
                className="flex items-center gap-2 w-full py-2.5 px-4 rounded-2xl bg-white/[0.04] border border-white/10 text-white/65 font-semibold text-[13px] hover:bg-red-500/15 hover:text-red-200 hover:border-red-500/30 transition-colors"
                data-testid="button-delete-work"
              >
                <Trash2 className="w-3.5 h-3.5" /> حذف
              </button>
            </GlassCard>
          )}
        </div>
      </div>

      {lightbox !== null && allImages[lightbox] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <img
            src={allImages[lightbox]}
            alt=""
            className="max-w-[92vw] max-h-[88vh] object-contain rounded-2xl shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)]"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/15 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
          {allImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((i) =>
                    i === null ? 0 : Math.min(allImages.length - 1, i + 1),
                  );
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/15 transition-colors"
                aria-label="السابق"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((i) => (i === null ? 0 : Math.max(0, i - 1)));
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/15 transition-colors"
                aria-label="التالي"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white text-[12px] tabular-nums">
                {lightbox + 1} / {allImages.length}
              </div>
            </>
          )}
        </div>
      )}
    </PageShell>
  );
}

function CommentEditForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  busy,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  busy: boolean;
  error?: string | null;
}) {
  return (
    <div className="mt-1.5">
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
          maxLength={1000}
          className="flex-1 h-10 px-3 rounded-xl bg-white/[0.05] border border-white/10 text-white text-[13px] placeholder-white/40 outline-none focus:border-primary/45 focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors"
          data-testid="edit-comment-input"
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="h-10 px-3 rounded-xl bg-primary text-white font-bold text-[12px] disabled:opacity-50 inline-flex items-center gap-1"
          data-testid="edit-comment-submit"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-2 text-white/45 hover:text-white text-[12px] font-semibold transition-colors"
        >
          إلغاء
        </button>
      </form>
      {error && <p className="text-red-300 text-[12px] mt-1.5">{error}</p>}
    </div>
  );
}
```

## `artifacts/ih-haven/src/pages/Works.tsx`
*(333 lines)*

```tsx
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ExternalLink, Plus, Heart, MessageCircle, Search } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import { useAuth, ROLE_LABELS, type UserRole } from "@/lib/auth";
import { splitTags } from "@/lib/labels";

interface WorkRow {
  work: {
    id: number;
    title: string;
    summary: string;
    coverUrl: string | null;
    link: string;
    tags: string;
    createdAt: string;
  };
  author: {
    id: number;
    fullName: string;
    role: UserRole;
    avatarUrl: string | null;
  };
  likesCount?: number;
  commentsCount?: number;
}

const ROLE_FILTERS: Array<{ key: "" | UserRole; label: string }> = [
  { key: "", label: "الكلّ" },
  { key: "freelancer", label: "المستقلّون" },
  { key: "graduate", label: "الخرّيجون" },
  { key: "student", label: "الطلّاب" },
];

type SortKey = "newest" | "popular" | "discussed";
const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "newest", label: "الأحدث" },
  { key: "popular", label: "الأكثر إعجابًا" },
  { key: "discussed", label: "الأكثر نقاشًا" },
];

export default function Works() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"" | UserRole>("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [q, setQ] = useState("");
  const [followingFeed, setFollowingFeed] = useState(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<WorkRow[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "أعمال المستقلّين — آيلاند هيفن";
  }, []);

  // Reset page when filter, sort, query, or feed scope changes
  useEffect(() => { setPage(1); }, [filter, sort, q, followingFeed]);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    const params = new URLSearchParams();
    if (filter) params.set("role", filter);
    if (sort !== "newest") params.set("sort", sort);
    if (q.trim()) params.set("q", q.trim());
    if (followingFeed) params.set("following", "1");
    params.set("page", String(page));
    api<{ works: WorkRow[]; totalPages: number }>(`/works?${params}`)
      .then((r) => {
        if (!cancelled) {
          setRows(r.works);
          setTotalPages(r.totalPages ?? 1);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
      });
    return () => { cancelled = true; };
  }, [filter, sort, q, followingFeed, page]);

  return (
    <PageShell
      active="works"
      eyebrow="معرض المجتمع"
      title="أعمال"
      highlight="مستقلّينا"
      subtitle="مشاريع وأعمال أنجزها أعضاء آيلاند هيفن — تَصفَّح، تواصل، أو شارك أنت أيضًا."
    >
      <div className="relative mb-5">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45 pointer-events-none" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث في الأعمال بالعنوان أو الوصف أو الوسوم…"
          className="w-full h-12 pe-11 ps-4 rounded-2xl bg-white/[0.05] border border-white/10 text-white text-[14px] placeholder-white/40 outline-none focus:border-primary/45 focus:bg-white/[0.07] transition-colors"
          data-testid="input-search-works"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-2 flex-wrap">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors border ${
                filter === f.key
                  ? "bg-primary/20 text-white border-primary/40"
                  : "bg-white/[0.04] text-white/65 border-white/10 hover:text-white hover:bg-white/[0.08]"
              }`}
              data-testid={`filter-${f.key || "all"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {user ? (
          <Link
            href="/works/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white font-bold text-[12.5px] hover:shadow-[0_14px_30px_-10px_rgba(220,38,55,0.55)] hover:-translate-y-px transition-all"
            data-testid="button-add-work"
          >
            <Plus className="w-4 h-4" />
            أضف عملًا
          </Link>
        ) : (
          <Link
            href="/login?next=/works/new"
            className="text-[12.5px] text-white/55 hover:text-primary font-semibold transition-colors"
          >
            سجّل دخولك لإضافة أعمالك
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-8 -mt-4">
        <span className="text-white/40 text-[12px] font-semibold me-1">ترتيب:</span>
        {SORT_OPTIONS.map((o) => (
          <button
            key={o.key}
            onClick={() => setSort(o.key)}
            className={`px-3.5 py-1 rounded-full text-[12px] font-semibold transition-colors border ${
              sort === o.key
                ? "bg-primary/15 text-primary border-primary/35"
                : "bg-white/[0.03] text-white/55 border-white/10 hover:text-white hover:bg-white/[0.07]"
            }`}
            data-testid={`sort-${o.key}`}
          >
            {o.label}
          </button>
        ))}
        {user && (
          <button
            onClick={() => setFollowingFeed((v) => !v)}
            aria-pressed={followingFeed}
            className={`ms-1 px-3.5 py-1 rounded-full text-[12px] font-semibold transition-colors border ${
              followingFeed
                ? "bg-primary text-white border-primary"
                : "bg-white/[0.03] text-white/55 border-white/10 hover:text-white hover:bg-white/[0.07]"
            }`}
            data-testid="toggle-following-feed"
          >
            أتابِعهم
          </button>
        )}
      </div>
      {followingFeed && rows !== null && rows.length === 0 && !error && (
        <GlassCard className="p-6 text-center text-white/65 text-[13.5px] mb-6">
          لا توجد أعمال من الأعضاء الذين تتابِعهم بعد — تابِع أعضاء من صفحاتهم لترى
          أعمالهم هنا.
        </GlassCard>
      )}

      {error && (
        <GlassCard className="p-5 text-red-200 text-center">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-[24px] h-72 bg-white/[0.035] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : rows && rows.length === 0 ? (
        // In following-feed mode the tailored card above already explains the
        // empty state — don't also show the generic "be the first" prompt.
        followingFeed ? null : (
          <EmptyState title="لا توجد أعمال بعد" hint="كن أوّل من يشارك عمله." />
        )
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rows?.map((row, i) => (
            <motion.div
              key={row.work.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
            >
              <WorkCard row={row} />
            </motion.div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10" dir="ltr">
          <button
            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={page <= 1}
            className="px-4 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-white/70 text-[13px] font-semibold hover:bg-white/[0.11] disabled:opacity-35 disabled:cursor-not-allowed transition-all"
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | "…")[]>((acc, p, i, arr) => {
              if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} className="text-white/30 text-[13px] px-1">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => { setPage(p as number); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className={`w-9 h-9 rounded-xl text-[13px] font-semibold transition-all ${
                    p === page
                      ? "bg-primary text-white shadow-[0_4px_14px_-3px_rgba(220,38,55,0.5)]"
                      : "bg-white/[0.07] border border-white/15 text-white/70 hover:bg-white/[0.11]"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          <button
            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-white/70 text-[13px] font-semibold hover:bg-white/[0.11] disabled:opacity-35 disabled:cursor-not-allowed transition-all"
          >
            →
          </button>
        </div>
      )}
    </PageShell>
  );
}

function WorkCard({ row }: { row: WorkRow }) {
  const tags = splitTags(row.work.tags);
  return (
    <Link
      href={`/works/${row.work.id}`}
      className="group block h-full"
      data-testid={`work-card-${row.work.id}`}
    >
      <GlassCard className="h-full flex flex-col hover:border-primary/40 transition-colors">
        {row.work.coverUrl ? (
          <div className="aspect-[16/10] overflow-hidden bg-black/30">
            <img
              src={row.work.coverUrl}
              alt={row.work.title}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="aspect-[16/10] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-center justify-center">
            <div className="text-white/30 text-[12px] tracking-[0.22em] uppercase">
              لا توجد صورة
            </div>
          </div>
        )}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-white font-bold text-[16.5px] leading-snug mb-1.5 line-clamp-2">
            {row.work.title}
          </h3>
          {row.work.summary && (
            <p className="text-white/55 text-[13px] leading-[1.7] line-clamp-2 mb-3">
              {row.work.summary}
            </p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {tags.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-full bg-white/[0.05] text-white/55 text-[11px] border border-white/10"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="mt-auto flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/30 flex items-center justify-center text-[11px] font-bold text-white">
              {(row.author.fullName || "·").slice(0, 1)}
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-white text-[12.5px] font-semibold truncate">
                {row.author.fullName}
              </div>
              <div className="text-white/45 text-[10.5px] tracking-[0.16em] uppercase">
                {ROLE_LABELS[row.author.role]}
              </div>
            </div>
            <div className="ms-auto flex items-center gap-3 text-white/45 text-[11.5px] tabular-nums shrink-0">
              <span className="inline-flex items-center gap-1" title="إعجابات">
                <Heart className="w-3.5 h-3.5" />
                {row.likesCount ?? 0}
              </span>
              <span className="inline-flex items-center gap-1" title="تعليقات">
                <MessageCircle className="w-3.5 h-3.5" />
                {row.commentsCount ?? 0}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}

export { type WorkRow };
```

## `artifacts/ih-haven/src/pages/PublicProfile.tsx`
*(342 lines)*

```tsx
import { useEffect, useState } from "react";
import { usePageMeta } from "@/hooks/use-meta";
import { Link, useRoute, useLocation } from "wouter";
import {
  Phone,
  Globe,
  Linkedin,
  Github,
  Briefcase,
  ExternalLink,
  Award,
  UserPlus,
  UserCheck,
} from "lucide-react";
import { PageShell, GlassCard, BackLink, EmptyState } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import { ROLE_LABELS, useAuth, type ExtraLink, type UserRole } from "@/lib/auth";
import { splitTags } from "@/lib/labels";

interface Resp {
  user: {
    id: number;
    fullName: string;
    role: UserRole;
    avatarUrl: string | null;
    bio: string;
    jobTitle: string;
    skills: string;
    portfolioUrl: string;
    linkedinUrl: string;
    behanceUrl: string;
    githubUrl: string;
    otherLinks: ExtraLink[];
    phone: string;
    createdAt: string;
  };
  works: Array<{
    id: number;
    title: string;
    summary: string;
    coverUrl: string | null;
    tags: string;
  }>;
  badges?: Array<{
    id: number;
    key: string;
    name: string;
    description: string;
    icon: string;
    color: string;
  }>;
  followersCount?: number;
  followingCount?: number;
  followedByMe?: boolean;
}

const BehanceMark = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
    className={className}
  >
    <path d="M22 7h-7V5.5h7V7Zm1.7 10.7H14V6.4h9.5c4.6 0 4.6 5.7 1.5 6.4 3.7.7 3.4 5-1.3 4.9Zm-5.5-9.3v2.8h4.6c1.5 0 1.7-2.8 0-2.8h-4.6Zm0 4.6v3h4.7c1.8 0 2.1-3 0-3h-4.7ZM10.4 9.2c0-2.5-1.7-3.7-4.6-3.7H0v13h6.1c3 0 4.7-1.5 4.7-4 0-1.7-.7-2.9-2.4-3.4 1.4-.6 2-1.5 2-2Zm-7.6-.7H6c2.3 0 2.4 2.5 0 2.5H2.8V8.5Zm3.4 7.5H2.8v-3h3.5c2.6 0 2.6 3 0 3Z" />
  </svg>
);

export default function PublicProfile() {
  const [, params] = useRoute("/u/:id");
  const id = params?.id;
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [data, setData] = useState<Resp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api<Resp>(`/users/${id}`)
      .then((d) => {
        setData(d);
        setFollowing(Boolean(d.followedByMe));
        setFollowers(d.followersCount ?? 0);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "تعذّر التحميل"));
  }, [id]);

  async function toggleFollow() {
    if (!id || followBusy) return;
    if (!user) {
      navigate(`/login?next=/u/${id}`);
      return;
    }
    setFollowBusy(true);
    const prev = following;
    // optimistic
    setFollowing(!prev);
    setFollowers((c) => c + (prev ? -1 : 1));
    try {
      const r = await api<{ following: boolean; followersCount?: number }>(
        `/users/${id}/follow`,
        { method: "POST" },
      );
      setFollowing(r.following);
      // Reconcile with the server's authoritative count (avoids drift on
      // idempotent re-follows / concurrent toggles from another device).
      if (typeof r.followersCount === "number") setFollowers(r.followersCount);
    } catch {
      setFollowing(prev);
      setFollowers((c) => c + (prev ? 1 : -1));
    } finally {
      setFollowBusy(false);
    }
  }

  usePageMeta({
    title: data?.user.fullName,
    description: data?.user.bio || undefined,
    image: data?.user.avatarUrl || undefined,
    type: "profile",
  });

  if (error && !data) {
    return (
      <PageShell active="members">
        <BackLink href="/members" label="عودة للمنتسبين" />
        <GlassCard className="p-8 text-center text-red-200">{error}</GlassCard>
      </PageShell>
    );
  }
  if (!data) {
    return (
      <PageShell active="members">
        <div className="h-96 rounded-[28px] bg-white/[0.035] border border-white/10 animate-pulse" />
      </PageShell>
    );
  }

  const u = data.user;
  const initials = u.fullName.split(/\s+/).slice(0, 2).map((p) => p[0]).join("");
  const skills = splitTags(u.skills);
  const otherLinks = Array.isArray(u.otherLinks) ? u.otherLinks : [];

  const externalLinks: Array<{ label: string; url: string; Icon: React.ComponentType<{ className?: string }> }> = [];
  if (u.linkedinUrl) externalLinks.push({ label: "LinkedIn", url: u.linkedinUrl, Icon: Linkedin });
  if (u.behanceUrl) externalLinks.push({ label: "Behance", url: u.behanceUrl, Icon: BehanceMark });
  if (u.githubUrl) externalLinks.push({ label: "GitHub", url: u.githubUrl, Icon: Github });
  if (u.portfolioUrl) externalLinks.push({ label: "الموقع", url: u.portfolioUrl, Icon: Globe });

  return (
    <PageShell active="members" maxWidth="max-w-5xl">
      <BackLink href="/members" label="كلّ المنتسبين" />
      <GlassCard className="p-6 sm:p-10 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-right">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/40 flex items-center justify-center text-[28px] font-bold text-white shadow-[0_10px_40px_-12px_rgba(220,38,55,0.55)] shrink-0">
            {u.avatarUrl ? (
              <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
            ) : (
              initials || "·"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-2">
              {ROLE_LABELS[u.role]}
            </div>
            <h1
              className="font-bold text-white leading-tight mb-2"
              style={{ fontSize: "clamp(1.7rem, 4.5vw, 2.4rem)" }}
              data-testid="text-public-profile-name"
            >
              {u.fullName}
            </h1>
            {u.jobTitle && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-white/80 text-[13px] mb-4">
                <Briefcase className="w-3.5 h-3.5 text-primary" />
                {u.jobTitle}
              </div>
            )}
            <div className="flex items-center gap-4 justify-center sm:justify-start mb-4 text-[13px]">
              <span className="text-white/70" data-testid="text-followers-count">
                <b className="text-white font-bold">{followers}</b> متابِع
              </span>
              <span className="text-white/70" data-testid="text-following-count">
                <b className="text-white font-bold">{data.followingCount ?? 0}</b> يتابِع
              </span>
            </div>
            {u.bio && (
              <p className="text-white/65 text-[14.5px] leading-[1.95] mb-4 whitespace-pre-wrap">
                {u.bio}
              </p>
            )}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11.5px] font-semibold border border-primary/30"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex sm:flex-col gap-2 shrink-0">
            {!authLoading && user?.id !== u.id && (
              <button
                type="button"
                onClick={toggleFollow}
                disabled={followBusy}
                aria-pressed={following}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-[12.5px] font-semibold border transition-colors disabled:opacity-60 ${
                  following
                    ? "bg-white/[0.06] border-white/15 text-white/85 hover:bg-white/[0.1]"
                    : "bg-primary/15 border-primary/40 text-primary hover:bg-primary/25"
                }`}
                data-testid="button-follow"
              >
                {following ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" /> متابَع
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" /> متابعة
                  </>
                )}
              </button>
            )}
            {u.phone && (
              <a
                href={`https://wa.me/${u.phone.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-[12.5px] font-semibold hover:bg-emerald-500/15 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> واتساب
              </a>
            )}
          </div>
        </div>

        {(externalLinks.length > 0 || otherLinks.length > 0) && (
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap gap-2">
            {externalLinks.map(({ label, url, Icon }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-white text-[12px] font-semibold hover:bg-white/[0.1] transition-colors"
                data-testid={`link-${label.toLowerCase()}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </a>
            ))}
            {otherLinks.map((l, i) => (
              <a
                key={`${l.url}-${i}`}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white/85 text-[12px] font-semibold hover:bg-white/[0.08] transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                {l.label}
              </a>
            ))}
          </div>
        )}
      </GlassCard>

      {data.badges && data.badges.length > 0 && (
        <div className="mb-6">
          <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-3">
            الإنجازات — {data.badges.length}
          </div>
          <div className="flex flex-wrap gap-2">
            {data.badges.map((b) => (
              <span
                key={b.id}
                title={b.description || b.name}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/10 text-amber-200 border border-amber-400/30 text-[12.5px] font-semibold"
                data-testid={`badge-${b.key}`}
              >
                <Award className="w-3.5 h-3.5" />
                {b.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-4">
        الأعمال — {data.works.length}
      </div>

      {data.works.length === 0 ? (
        <EmptyState title="لا توجد أعمال منشورة بعد" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.works.map((w) => (
            <Link
              key={w.id}
              href={`/works/${w.id}`}
              className="group block"
              data-testid={`profile-work-${w.id}`}
            >
              <GlassCard className="h-full hover:border-primary/40 transition-colors">
                {w.coverUrl ? (
                  <div className="aspect-[16/10] overflow-hidden bg-black/30">
                    <img
                      src={w.coverUrl}
                      alt={w.title}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-gradient-to-br from-primary/20 to-transparent" />
                )}
                <div className="p-4">
                  <h3 className="text-white font-bold text-[14.5px] leading-snug line-clamp-2">
                    {w.title}
                  </h3>
                  {w.summary && (
                    <p className="text-white/55 text-[12.5px] mt-1 line-clamp-2">
                      {w.summary}
                    </p>
                  )}
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
```

## `artifacts/ih-haven/src/pages/Login.tsx`
*(155 lines)*

```tsx
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Mail, Lock } from "lucide-react";
import { AuthShell, AuthField } from "@/components/auth/AuthShell";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

// Where to land after login: honor an in-app ?next= path, but only a same-site
// absolute path ("/…", not "//host") so it can't be used as an open redirect.
function postLoginDest(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/profile";
}

export default function Login() {
  const { login, user } = useAuth();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const errRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.title = "تسجيل الدخول — آيلاند هيفن";
  }, []);

  useEffect(() => {
    if (user) navigate(postLoginDest());
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setIssues({});
    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(postLoginDest());
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message || "تعذّر تسجيل الدخول");
      } else {
        setError("تعذّر الاتّصال بالخادم");
      }
      setTimeout(() => errRef.current?.focus(), 50);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    form.email.trim().length > 3 && form.password.length >= 1 && !submitting;

  return (
    <AuthShell
      eyebrow="تسجيل الدخول"
      title="مرحبًا بعودتك إلى"
      highlight="آيلاند هيفن"
      subtitle="ادخل إلى حسابك لمتابعة عملك ومشاريعك في الجزيرة."
      footer={
        <>
          ليس لديك حساب؟{" "}
          <Link href="/register" className="text-primary font-bold hover:underline">
            أنشئ حسابًا الآن
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <AuthField
          id="email"
          label="البريد الإلكتروني"
          hint="Email"
          icon={Mail}
          type="email"
          ltr
          value={form.email}
          onChange={(v) => setForm((s) => ({ ...s, email: v }))}
          placeholder="name@example.com"
          error={issues.email}
          autoComplete="email"
        />
        <div className="space-y-1">
          <AuthField
            id="password"
            label="كلمة السرّ"
            hint="Password"
            icon={Lock}
            type="password"
            ltr
            value={form.password}
            onChange={(v) => setForm((s) => ({ ...s, password: v }))}
            placeholder="••••••••"
            error={issues.password}
            autoComplete="current-password"
          />
          <div className="flex justify-start pt-1">
            <Link href="/forgot-password" className="text-[12px] text-primary/70 hover:text-primary transition-colors">
              نسيت كلمة السرّ؟
            </Link>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              ref={errRef}
              tabIndex={-1}
              role="alert"
              aria-live="assertive"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-200 text-[13px]"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={!canSubmit}
          className="group relative w-full overflow-hidden rounded-2xl h-13 py-3.5 bg-primary text-white font-bold text-[15px] tracking-wide transition-all duration-300 enabled:hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] enabled:hover:-translate-y-px disabled:opacity-45 disabled:cursor-not-allowed"
          data-testid="button-login"
        >
          <span className="relative z-10 inline-flex items-center justify-center gap-2.5">
            {submitting ? (
              <>
                <span className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                جارٍ الدخول…
              </>
            ) : (
              <>
                دخول إلى حسابي
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </>
            )}
          </span>
          <span
            aria-hidden
            className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
            style={{
              background:
                "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)",
            }}
          />
        </button>
      </form>
    </AuthShell>
  );
}
```

## `artifacts/ih-haven/src/App.tsx`
*(206 lines)*

```tsx
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, lazy, Suspense } from "react";
import { usePageView } from "@/hooks/use-tracking";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";
// Home is the landing/LCP page — keep it eager. Everything else is route-level
// code-split (own chunk, loaded on navigation) to keep the initial bundle lean.
import Home from "@/pages/Home";
const Apply = lazy(() => import("@/pages/Apply"));
const Book = lazy(() => import("@/pages/Book"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Profile = lazy(() => import("@/pages/Profile"));
const Courses = lazy(() => import("@/pages/Courses"));
const CourseDetail = lazy(() => import("@/pages/CourseDetail"));
const Works = lazy(() => import("@/pages/Works"));
const WorkDetail = lazy(() => import("@/pages/WorkDetail"));
const WorkEditor = lazy(() => import("@/pages/WorkEditor"));
const Daily = lazy(() => import("@/pages/Daily"));
const DailyDetail = lazy(() =>
  import("@/pages/Daily").then((m) => ({ default: m.DailyDetail })),
);
const Events = lazy(() => import("@/pages/Events"));
const EventDetail = lazy(() =>
  import("@/pages/Events").then((m) => ({ default: m.EventDetail })),
);
const Members = lazy(() => import("@/pages/Members"));
const Search = lazy(() => import("@/pages/Search"));
const Experts = lazy(() => import("@/pages/Experts"));
const ExpertDetail = lazy(() => import("@/pages/ExpertDetail"));
const ExpertDashboard = lazy(() => import("@/pages/ExpertDashboard"));
const Programs = lazy(() => import("@/pages/Programs"));
const ProgramDetail = lazy(() => import("@/pages/ProgramDetail"));
const Ventures = lazy(() => import("@/pages/Ventures"));
const VentureDetail = lazy(() => import("@/pages/VentureDetail"));
const Opportunities = lazy(() => import("@/pages/Opportunities"));
const OpportunityDetail = lazy(() => import("@/pages/OpportunityDetail"));
const Learning = lazy(() => import("@/pages/Learning"));
const Certificate = lazy(() => import("@/pages/Certificate"));
const Messages = lazy(() => import("@/pages/Messages"));
const RateSession = lazy(() => import("@/pages/RateSession"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const Perks = lazy(() => import("@/pages/Perks"));
const PerkDetail = lazy(() => import("@/pages/PerkDetail"));
const NotificationSettings = lazy(() => import("@/pages/NotificationSettings"));
const Numbers = lazy(() => import("@/pages/Numbers"));
const Gallery = lazy(() => import("@/pages/Gallery"));
const About = lazy(() => import("@/pages/About"));
const Team = lazy(() => import("@/pages/Team"));
const Cohorts = lazy(() => import("@/pages/Cohorts"));
const CohortDetail = lazy(() => import("@/pages/CohortDetail"));
const DemoDay = lazy(() => import("@/pages/DemoDay"));
const Press = lazy(() => import("@/pages/Press"));
const Resources = lazy(() => import("@/pages/Resources"));
const PublicProfile = lazy(() => import("@/pages/PublicProfile"));
const Saved = lazy(() => import("@/pages/Saved"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));

const queryClient = new QueryClient();

const ROUTE_TITLES: Record<string, string> = {
  "/": "Island Haven · حاضنة أعمال في غزّة",
  "/apply": "انتسب — Island Haven",
  "/book": "احجز مقعد — Island Haven",
  "/login": "تسجيل الدخول — Island Haven",
  "/register": "حساب جديد — Island Haven",
  "/profile": "ملفّي — Island Haven",
  "/members": "منتسبو المساحة — Island Haven",
  "/experts": "خبراء آيلاند — Island Haven",
  "/expert": "لوحة الخبير — Island Haven",
  "/programs": "برامج الاحتضان — Island Haven",
  "/ventures": "المشاريع الناشئة — Island Haven",
  "/opportunities": "الفرص والوظائف — Island Haven",
  "/learning": "التعلّم — Island Haven",
  "/certificate": "شهادة الإكمال — Island Haven",
  "/messages": "الرسائل — Island Haven",
  "/sessions": "تقييم جلسة — Island Haven",
  "/leaderboard": "الصدارة — Island Haven",
  "/perks": "العروض والامتيازات — Island Haven",
  "/settings": "إعدادات الإشعارات — Island Haven",
  "/numbers": "مُجتمعنا بالأرقام — Island Haven",
  "/gallery": "معرض الصّور — Island Haven",
  "/about": "من نحن — Island Haven",
  "/team": "فريق آيلاند — Island Haven",
  "/cohorts": "دفعات الاحتضان — Island Haven",
  "/press": "المركز الإعلاميّ — Island Haven",
  "/resources": "دليل الرّائد — Island Haven",
  "/courses": "البرنامج التَّدريبيّ — Island Haven",
  "/works": "أعمال المنتسبين — Island Haven",
  "/saved": "المحفوظات — Island Haven",
  "/events": "فعاليّات آيلاند — Island Haven",
  "/admin": "لوحة التّحكم — Island Haven",
};

function RouteEffects() {
  const [loc] = useLocation();
  // Global page-view tracking — covers every route (incl. the new pillars)
  // from one place instead of a per-page usePageView call.
  usePageView(loc);
  useEffect(() => {
    const exact = ROUTE_TITLES[loc];
    if (exact) {
      document.title = exact;
    } else {
      const seg = loc.split("/").filter(Boolean)[0] ?? "";
      const base = ROUTE_TITLES[`/${seg}`];
      document.title = base ?? "Island Haven · آيلاند هيفن";
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [loc]);
  return null;
}

function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-7 h-7 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
      <Route path="/" component={Home} />
      <Route path="/apply" component={Apply} />
      <Route path="/book" component={Book} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/profile" component={Profile} />
      <Route path="/members" component={Members} />
      <Route path="/search" component={Search} />
      <Route path="/experts" component={Experts} />
      <Route path="/experts/:id" component={ExpertDetail} />
      <Route path="/expert/dashboard" component={ExpertDashboard} />
      <Route path="/programs" component={Programs} />
      <Route path="/programs/:id" component={ProgramDetail} />
      <Route path="/ventures" component={Ventures} />
      <Route path="/ventures/:id" component={VentureDetail} />
      <Route path="/opportunities" component={Opportunities} />
      <Route path="/opportunities/:id" component={OpportunityDetail} />
      <Route path="/learning" component={Learning} />
      <Route path="/certificate/:courseId" component={Certificate} />
      <Route path="/messages" component={Messages} />
      <Route path="/sessions/:id/rate" component={RateSession} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/perks" component={Perks} />
      <Route path="/perks/:id" component={PerkDetail} />
      <Route path="/settings/notifications" component={NotificationSettings} />
      <Route path="/numbers" component={Numbers} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/about" component={About} />
      <Route path="/team" component={Team} />
      <Route path="/press" component={Press} />
      <Route path="/cohorts" component={Cohorts} />
      <Route path="/cohorts/:slug/demo-day" component={DemoDay} />
      <Route path="/cohorts/:slug" component={CohortDetail} />
      <Route path="/resources" component={Resources} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:id" component={CourseDetail} />
      <Route path="/works" component={Works} />
      <Route path="/saved" component={Saved} />
      <Route path="/works/new" component={WorkEditor} />
      <Route path="/works/:id/edit" component={WorkEditor} />
      <Route path="/works/:id" component={WorkDetail} />
      <Route path="/events" component={Events} />
      <Route path="/events/:id" component={EventDetail} />
      <Route path="/daily" component={Daily} />
      <Route path="/daily/:id" component={DailyDetail} />
      <Route path="/u/:id" component={PublicProfile} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <RouteEffects />
            <main id="main-content" tabIndex={-1}>
              <Router />
            </main>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
```


# MOBILE (artifacts/ih-mobile)

## `artifacts/ih-mobile/app/member/[id].tsx`
*(154 lines)*

```tsx
import React, { useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { T, Card, Btn } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth-context";
import { api, resolveMedia } from "@/lib/api";
import type { CurrentUser, Work } from "@/lib/types";

interface MemberResp {
  user: CurrentUser;
  works: Work[];
  followersCount?: number;
  followingCount?: number;
  followedByMe?: boolean;
}

export default function MemberDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const [followBusy, setFollowBusy] = useState(false);
  const userQ = useQuery<MemberResp>({
    queryKey: ["member", id],
    queryFn: () => api(`/users/${id}`),
    enabled: !!id,
  });

  async function toggleFollow() {
    if (followBusy) return;
    if (!me) {
      router.push("/login");
      return;
    }
    setFollowBusy(true);
    try {
      await api(`/users/${id}/follow`, { method: "POST" });
      await qc.invalidateQueries({ queryKey: ["member", id] });
    } catch {
      // surfaced by the next refetch; keep the screen quiet on transient errors
    } finally {
      setFollowBusy(false);
    }
  }

  if (userQ.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (userQ.isError || !userQ.data) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: 20 }}>
        <T size={16}>تعذّر تحميل الملف.</T>
      </View>
    );
  }
  const { user, works = [], followersCount = 0, followingCount = 0, followedByMe = false } = userQ.data;
  const canFollow = !!me && me.id !== user.id;

  const links: { label: string; url: string; icon: keyof typeof Feather.glyphMap }[] = [];
  if (user.portfolioUrl) links.push({ label: "الموقع", url: user.portfolioUrl, icon: "globe" });
  if (user.linkedinUrl) links.push({ label: "LinkedIn", url: user.linkedinUrl, icon: "linkedin" });
  if (user.behanceUrl) links.push({ label: "Behance", url: user.behanceUrl, icon: "feather" });
  if (user.githubUrl) links.push({ label: "GitHub", url: user.githubUrl, icon: "github" });
  for (const l of user.otherLinks ?? []) links.push({ label: l.label, url: l.url, icon: "link" });

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 80 }}>
      <View style={{ alignItems: "center", gap: 10 }}>
        {user.avatarUrl ? (
          <Image source={{ uri: resolveMedia(user.avatarUrl) }} style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: colors.muted }} />
        ) : (
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
            <T size={36} weight="bold" color={colors.primary}>{user.fullName.trim().slice(0, 1)}</T>
          </View>
        )}
        <T size={22} weight="bold" align="center">{user.fullName}</T>
        {user.jobTitle ? <T size={14} color={colors.mutedForeground} align="center">{user.jobTitle}</T> : null}
        <View style={{ flexDirection: "row-reverse", gap: 16, marginTop: 4 }}>
          <T size={13} color={colors.mutedForeground}>
            <T size={13} weight="bold">{followersCount}</T> متابِع
          </T>
          <T size={13} color={colors.mutedForeground}>
            <T size={13} weight="bold">{followingCount}</T> يتابِع
          </T>
        </View>
        {canFollow ? (
          <Btn
            title={followedByMe ? "متابَع" : "متابعة"}
            variant={followedByMe ? "secondary" : "primary"}
            loading={followBusy}
            onPress={toggleFollow}
            accessibilityState={{ selected: followedByMe }}
            style={{ marginTop: 6, minWidth: 160 }}
          />
        ) : null}
      </View>

      {user.bio ? (
        <Card>
          <T size={14} style={{ lineHeight: 22 }}>{user.bio}</T>
        </Card>
      ) : null}

      {user.skills ? (
        <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 6 }}>
          {user.skills.split(",").map((s, i) => s.trim() ? (
            <View key={i} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.primarySoft }}>
              <T size={12} weight="medium" color={colors.primary}>{s.trim()}</T>
            </View>
          ) : null)}
        </View>
      ) : null}

      {links.length > 0 ? (
        <Card style={{ gap: 10 }}>
          <T size={13} weight="medium" color={colors.mutedForeground}>روابط</T>
          {links.map((l) => (
            <Pressable key={l.url} onPress={() => Linking.openURL(l.url)} style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
              <Feather name={l.icon} size={16} color={colors.primary} />
              <T size={14} color={colors.primary}>{l.label}</T>
            </Pressable>
          ))}
        </Card>
      ) : null}

      {works.length > 0 ? (
        <View style={{ gap: 10 }}>
          <T size={17} weight="bold">الأعمال</T>
          {works.map((w) => (
            <Card key={w.id} style={{ padding: 0, overflow: "hidden" }}>
              {w.coverUrl ? (
                <Image source={{ uri: resolveMedia(w.coverUrl) }} style={{ width: "100%", height: 160, backgroundColor: colors.muted }} contentFit="cover" />
              ) : null}
              <View style={{ padding: 14 }}>
                <T size={15} weight="bold">{w.title}</T>
                {w.description ? <T size={13} color={colors.mutedForeground} numberOfLines={2} style={{ marginTop: 4 }}>{w.description}</T> : null}
              </View>
            </Card>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
```

## `artifacts/ih-mobile/app/work/[id].tsx`
*(512 lines)*

```tsx
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { T, Card, Btn } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth-context";
import { api, resolveMedia } from "@/lib/api";
import type { Work } from "@/lib/types";

interface WorkResp {
  work: Work;
  author?: { id: number; fullName: string; avatarUrl: string | null };
  isOwner: boolean;
  likesCount: number;
  likedByMe: boolean;
  commentsCount: number;
  savedByMe: boolean;
}

interface WorkComment {
  id: number;
  body: string;
  createdAt: string;
  editedAt?: string | null;
  parentId?: number | null;
  author: { id: number; fullName: string; avatarUrl: string | null; role: string };
  canEdit?: boolean;
  canDelete: boolean;
  replies?: WorkComment[];
}

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} س`;
  return `قبل ${Math.floor(h / 24)} ي`;
}

export default function WorkDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery<WorkResp>({
    queryKey: ["work", id],
    queryFn: () => api(`/works/${id}`),
    enabled: !!id,
  });
  const commentsQ = useQuery<{ comments: WorkComment[] }>({
    queryKey: ["work-comments", id],
    queryFn: () => api(`/works/${id}/comments`),
    enabled: !!id,
  });

  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [liking, setLiking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editBusy, setEditBusy] = useState(false);

  async function toggleLike() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (liking) return;
    setLiking(true);
    try {
      await api(`/works/${id}/like`, { method: "POST" });
      await qc.invalidateQueries({ queryKey: ["work", id] });
    } catch {
      /* ignore */
    } finally {
      setLiking(false);
    }
  }

  async function toggleSave() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      await api(`/works/${id}/save`, { method: "POST" });
      await qc.invalidateQueries({ queryKey: ["work", id] });
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  async function postComment() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      await api(`/works/${id}/comments`, { method: "POST", body: { body } });
      setText("");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["work-comments", id] }),
        qc.invalidateQueries({ queryKey: ["work", id] }),
      ]);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  async function postReply(parentId: number) {
    const body = replyText.trim();
    if (!body || replyBusy) return;
    setReplyBusy(true);
    try {
      await api(`/works/${id}/comments`, { method: "POST", body: { body, parentId } });
      setReplyText("");
      setReplyTo(null);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["work-comments", id] }),
        qc.invalidateQueries({ queryKey: ["work", id] }),
      ]);
    } catch {
      /* ignore */
    } finally {
      setReplyBusy(false);
    }
  }

  async function saveEdit(cid: number) {
    const body = editText.trim();
    if (!body || editBusy) return;
    setEditBusy(true);
    try {
      await api(`/works/${id}/comments/${cid}`, { method: "PATCH", body: { body } });
      setEditId(null);
      setEditText("");
      await qc.invalidateQueries({ queryKey: ["work-comments", id] });
    } catch {
      /* ignore */
    } finally {
      setEditBusy(false);
    }
  }

  async function deleteComment(cid: number) {
    try {
      await api(`/works/${id}/comments/${cid}`, { method: "DELETE" });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["work-comments", id] }),
        qc.invalidateQueries({ queryKey: ["work", id] }),
      ]);
    } catch {
      /* ignore */
    }
  }

  if (q.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!q.data) return null;
  const w = q.data.work;
  const likesCount = q.data.likesCount ?? 0;
  const likedByMe = q.data.likedByMe ?? false;
  const commentsCount = q.data.commentsCount ?? 0;
  const savedByMe = q.data.savedByMe ?? false;
  const comments = commentsQ.data?.comments ?? [];
  const gallery = Array.isArray(w.galleryUrls) ? w.galleryUrls : [];

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 80 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
      {w.coverUrl ? (
        <Image source={{ uri: resolveMedia(w.coverUrl) }} style={{ width: "100%", height: 220, borderRadius: colors.radius + 2, backgroundColor: colors.muted }} contentFit="cover" />
      ) : null}
      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
        <T size={22} weight="bold" style={{ flex: 1 }}>{w.title}</T>
        {q.data.isOwner ? (
          <Pressable
            onPress={() => router.push(`/work/edit?id=${id}`)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="تعديل العمل"
            style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: colors.radius, borderWidth: 1, borderColor: colors.border }}
          >
            <Feather name="edit-2" size={13} color={colors.foreground} />
            <T size={13} weight="medium">تعديل</T>
          </Pressable>
        ) : null}
      </View>
      {q.data.author?.fullName ? <T size={13} color={colors.mutedForeground}>{q.data.author.fullName}</T> : null}

      {/* Engagement: like toggle + comment count */}
      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 14 }}>
        <Pressable
          onPress={toggleLike}
          disabled={liking}
          accessibilityRole="button"
          accessibilityState={{ selected: likedByMe, disabled: liking }}
          accessibilityLabel={likedByMe ? "إلغاء الإعجاب" : "إعجاب"}
          style={{
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: 6,
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: colors.radius,
            borderWidth: 1,
            borderColor: likedByMe ? colors.primary : colors.border,
            backgroundColor: likedByMe ? colors.primary + "1A" : colors.card,
          }}
        >
          <Feather name="heart" size={16} color={likedByMe ? colors.primary : colors.mutedForeground} />
          <T size={14} weight="medium" color={likedByMe ? colors.primary : colors.mutedForeground}>{likesCount}</T>
        </Pressable>
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
          <Feather name="message-circle" size={16} color={colors.mutedForeground} />
          <T size={14} color={colors.mutedForeground}>{commentsCount}</T>
        </View>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={toggleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityState={{ selected: savedByMe, disabled: saving }}
          accessibilityLabel={savedByMe ? "إلغاء الحفظ" : "حفظ العمل"}
          style={{
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: 6,
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: colors.radius,
            borderWidth: 1,
            borderColor: savedByMe ? colors.primary : colors.border,
            backgroundColor: savedByMe ? colors.primary + "1A" : colors.card,
          }}
        >
          <Feather name="bookmark" size={16} color={savedByMe ? colors.primary : colors.mutedForeground} />
          <T size={13} weight="medium" color={savedByMe ? colors.primary : colors.mutedForeground}>
            {savedByMe ? "محفوظ" : "حفظ"}
          </T>
        </Pressable>
      </View>

      {w.description ? (
        <Card>
          <T size={14} style={{ lineHeight: 23 }}>{w.description}</T>
        </Card>
      ) : null}
      {w.videoUrl ? (
        <Pressable onPress={() => Linking.openURL(w.videoUrl)}>
          <Card style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
            <Feather name="play-circle" size={22} color={colors.primary} />
            <T size={14} color={colors.primary} weight="medium">شاهد الفيديو على YouTube</T>
          </Card>
        </Pressable>
      ) : null}
      {gallery.length > 0 ? (
        <View style={{ gap: 8 }}>
          <T size={15} weight="bold">معرض الصور</T>
          {gallery.map((url, i) => (
            <Image key={i} source={{ uri: resolveMedia(url) }} style={{ width: "100%", height: 220, borderRadius: colors.radius, backgroundColor: colors.muted }} contentFit="cover" />
          ))}
        </View>
      ) : null}

      {/* Comments */}
      <View style={{ gap: 12, marginTop: 8 }}>
        <T size={16} weight="bold">التعليقات — {commentsCount}</T>

        {user ? (
          <View style={{ gap: 8 }}>
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              maxLength={1000}
              placeholder="شاركنا رأيك في هذا العمل…"
              placeholderTextColor={colors.mutedForeground}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
                borderRadius: colors.radius,
                padding: 12,
                minHeight: 72,
                fontSize: 15,
                color: colors.foreground,
                textAlign: "right",
                writingDirection: "rtl",
              }}
            />
            <Btn title="نشر" loading={busy} disabled={!text.trim()} onPress={postComment} />
          </View>
        ) : (
          <Btn title="سجّل الدخول للتعليق" variant="secondary" onPress={() => router.push("/login")} />
        )}

        {comments.length === 0 ? (
          <T size={13} color={colors.mutedForeground} align="center" style={{ paddingVertical: 12 }}>
            لا توجد تعليقات بعد — كن أول من يعلّق.
          </T>
        ) : (
          comments.map((c) => {
            const replies = c.replies ?? [];
            const threadIds = [c.id, ...replies.map((r) => r.id)];
            const composerOpen = replyTo !== null && threadIds.includes(replyTo);
            return (
              <Card key={c.id} style={{ gap: 8 }}>
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, overflow: "hidden", backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }}>
                    {c.author.avatarUrl ? (
                      <Image source={{ uri: resolveMedia(c.author.avatarUrl) }} style={{ width: 30, height: 30 }} contentFit="cover" />
                    ) : (
                      <T size={13} weight="bold">{(c.author.fullName || "·").slice(0, 1)}</T>
                    )}
                  </View>
                  <T size={13} weight="bold">{c.author.fullName}</T>
                  <T size={11} color={colors.mutedForeground}>{timeAgo(c.createdAt)}</T>
                  {c.editedAt ? <T size={10} color={colors.mutedForeground}>(عُدّل)</T> : null}
                  <View style={{ flex: 1 }} />
                  {c.canEdit ? (
                    <Pressable onPress={() => { setEditId(c.id); setEditText(c.body); setReplyTo(null); }} hitSlop={8} accessibilityRole="button" accessibilityLabel="تعديل التعليق">
                      <Feather name="edit-2" size={14} color={colors.mutedForeground} />
                    </Pressable>
                  ) : null}
                  {c.canDelete ? (
                    <Pressable onPress={() => deleteComment(c.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel="حذف التعليق">
                      <Feather name="trash-2" size={15} color={colors.mutedForeground} />
                    </Pressable>
                  ) : null}
                </View>
                {editId === c.id ? (
                  <EditRow value={editText} onChange={setEditText} onSave={() => saveEdit(c.id)} onCancel={() => { setEditId(null); setEditText(""); }} busy={editBusy} colors={colors} />
                ) : (
                  <>
                    <T size={14} style={{ lineHeight: 22 }}>{c.body}</T>
                    {user ? (
                      <Pressable
                        onPress={() => { setReplyTo(c.id); setReplyText(""); }}
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityLabel="رد على التعليق"
                        style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}
                      >
                        <Feather name="corner-up-left" size={13} color={colors.primary} />
                        <T size={12} weight="medium" color={colors.primary}>رد</T>
                      </Pressable>
                    ) : null}
                  </>
                )}

                {replies.length > 0 ? (
                  <View style={{ gap: 10, paddingRight: 12, borderRightWidth: 2, borderRightColor: colors.border, marginTop: 2 }}>
                    {replies.map((rep) => (
                      <View key={rep.id} style={{ gap: 4 }}>
                        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
                          <View style={{ width: 24, height: 24, borderRadius: 12, overflow: "hidden", backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }}>
                            {rep.author.avatarUrl ? (
                              <Image source={{ uri: resolveMedia(rep.author.avatarUrl) }} style={{ width: 24, height: 24 }} contentFit="cover" />
                            ) : (
                              <T size={11} weight="bold">{(rep.author.fullName || "·").slice(0, 1)}</T>
                            )}
                          </View>
                          <T size={12} weight="bold">{rep.author.fullName}</T>
                          <T size={10} color={colors.mutedForeground}>{timeAgo(rep.createdAt)}</T>
                          {rep.editedAt ? <T size={9} color={colors.mutedForeground}>(عُدّل)</T> : null}
                          <View style={{ flex: 1 }} />
                          {rep.canEdit ? (
                            <Pressable onPress={() => { setEditId(rep.id); setEditText(rep.body); setReplyTo(null); }} hitSlop={8} accessibilityRole="button" accessibilityLabel="تعديل الرد">
                              <Feather name="edit-2" size={12} color={colors.mutedForeground} />
                            </Pressable>
                          ) : null}
                          {rep.canDelete ? (
                            <Pressable onPress={() => deleteComment(rep.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel="حذف الرد">
                              <Feather name="trash-2" size={13} color={colors.mutedForeground} />
                            </Pressable>
                          ) : null}
                        </View>
                        {editId === rep.id ? (
                          <EditRow value={editText} onChange={setEditText} onSave={() => saveEdit(rep.id)} onCancel={() => { setEditId(null); setEditText(""); }} busy={editBusy} colors={colors} />
                        ) : (
                          <>
                            <T size={13} style={{ lineHeight: 20 }}>{rep.body}</T>
                            {user ? (
                              <Pressable
                                onPress={() => { setReplyTo(rep.id); setReplyText(""); }}
                                hitSlop={6}
                                accessibilityRole="button"
                                accessibilityLabel="رد"
                                style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}
                              >
                                <Feather name="corner-up-left" size={12} color={colors.primary} />
                                <T size={11} weight="medium" color={colors.primary}>رد</T>
                              </Pressable>
                            ) : null}
                          </>
                        )}
                      </View>
                    ))}
                  </View>
                ) : null}

                {composerOpen && user ? (
                  <View style={{ gap: 6, marginTop: 2 }}>
                    <TextInput
                      value={replyText}
                      onChangeText={setReplyText}
                      multiline
                      maxLength={1000}
                      autoFocus
                      placeholder="اكتب ردًّا…"
                      placeholderTextColor={colors.mutedForeground}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.card,
                        borderRadius: colors.radius,
                        padding: 10,
                        minHeight: 52,
                        fontSize: 14,
                        color: colors.foreground,
                        textAlign: "right",
                        writingDirection: "rtl",
                      }}
                    />
                    <View style={{ flexDirection: "row-reverse", gap: 8 }}>
                      <Btn title="رد" loading={replyBusy} disabled={!replyText.trim()} onPress={() => postReply(replyTo!)} style={{ flex: 1 }} />
                      <Btn title="إلغاء" variant="secondary" onPress={() => { setReplyTo(null); setReplyText(""); }} />
                    </View>
                  </View>
                ) : null}
              </Card>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

function EditRow({
  value,
  onChange,
  onSave,
  onCancel,
  busy,
  colors,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ gap: 6 }}>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline
        maxLength={1000}
        autoFocus
        placeholder="عدّل تعليقك…"
        placeholderTextColor={colors.mutedForeground}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          padding: 10,
          minHeight: 52,
          fontSize: 14,
          color: colors.foreground,
          textAlign: "right",
          writingDirection: "rtl",
        }}
      />
      <View style={{ flexDirection: "row-reverse", gap: 8 }}>
        <Btn title="حفظ" loading={busy} disabled={!value.trim()} onPress={onSave} style={{ flex: 1 }} />
        <Btn title="إلغاء" variant="secondary" onPress={onCancel} />
      </View>
    </View>
  );
}
```


# SMALL ADDITIONS TO PRE-EXISTING FILES

These files are mostly pre-existing; only my additions are shown.

## `lib/db/src/schema/notifications.ts` — added types
Added `new_follower` and `new_work` to `NOTIFICATION_TYPES`.

## `artifacts/ih-haven/src/pages/Profile.tsx` — saved-works link
```tsx
function WorksList({ rows }: { rows: MyWork[] | null }) {
  if (rows === null) {
    return (
      <div className="h-32 rounded-2xl bg-white/[0.035] border border-white/10 animate-pulse" />
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Link
          href="/works/new"
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] hover:bg-primary/5 hover:border-primary/40 hover:text-white text-white/55 py-4 text-[13px] font-semibold transition-colors"
          data-testid="link-add-work"
```

## `artifacts/ih-haven/src/App.tsx` — /saved route
Added: `const Saved = lazy(() => import("@/pages/Saved"));`,
a `"/saved"` title, and `<Route path="/saved" component={Saved} />`.

## `artifacts/ih-mobile/components/Branded.tsx` — Btn a11y role
```tsx
    <Pressable
      accessibilityRole="button"
      {...rest}
      disabled={disabled || loading}
      onPress={(e) => {
```
