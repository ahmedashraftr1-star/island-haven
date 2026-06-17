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
import { logger } from "../lib/logger";
import { getFlag } from "./adminExtra";
import { invalidateNumbersCache } from "./numbers";
import { awardBadgeByKey } from "./gamification";
import { notify } from "./notifications";

const router: IRouter = Router();

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
      .where(and(eq(worksTable.userId, userId), eq(worksTable.status, "visible")));
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
  if (!isOwner && (row.status !== "visible" || row.authorStatus !== "active")) {
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
      eq(worksTable.status, "visible") as never,
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
      (row.work.status !== "visible" || row.author.authorStatus !== "active")
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

router.post("/works", requireUser, async (req, res) => {
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
              eq(worksTable.status, "visible"),
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

router.post("/users/:id/follow", requireUser, async (req, res) => {
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

router.post("/works/:id/like", requireUser, async (req, res) => {
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
    const [existing] = await db
      .select({ id: worksLikesTable.id })
      .from(worksLikesTable)
      .where(and(eq(worksLikesTable.workId, id), eq(worksLikesTable.userId, session.userId)))
      .limit(1);
    let liked: boolean;
    if (existing) {
      await db.delete(worksLikesTable).where(eq(worksLikesTable.id, existing.id));
      liked = false;
    } else {
      await db
        .insert(worksLikesTable)
        .values({ workId: id, userId: session.userId })
        .onConflictDoNothing();
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

router.post("/works/:id/save", requireUser, async (req, res) => {
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
      eq(worksTable.status, "visible") as never,
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
      .where(eq(worksCommentsTable.workId, id))
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

router.post("/works/:id/comments", requireUser, async (req, res) => {
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
