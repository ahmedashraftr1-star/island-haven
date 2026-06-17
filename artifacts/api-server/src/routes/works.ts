import { Router, type IRouter, type Request } from "express";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  worksTable,
  worksLikesTable,
  worksCommentsTable,
  usersTable,
  badgesTable,
  userBadgesTable,
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

router.get("/works", async (req, res) => {
  try {
    const role = String(req.query.role ?? "");
    const requestedPage = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const sort = String(req.query.sort ?? "newest");
    const filterByRole = (USER_ROLES as readonly string[]).includes(role)
      ? (role as UserRole)
      : null;

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

    res.json({ work: row.work, author, isOwner, likesCount, likedByMe, commentsCount });
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
    // Strip internal fields before sending: status is for server-side checks only.
    // Phone is contact info — only expose to authenticated members
    // to prevent anonymous scraping by ID enumeration.
    const { status: _status, ...uPublic } = u;
    const user = session ? uPublic : { ...uPublic, phone: null as unknown as string };
    res.json({ user, works, badges });
  } catch (err) {
    logger.error({ err }, "GET /users/:id failed");
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
      .orderBy(desc(worksCommentsTable.createdAt))
      .limit(200);

    const meId = session?.userId ?? null;
    const isWorkOwner = meId !== null && work.userId === meId;
    const comments = rows.map((c) => ({
      ...c,
      canDelete: meId !== null && (c.author.id === meId || isWorkOwner),
    }));
    res.json({ comments });
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
    const [row] = await db
      .insert(worksCommentsTable)
      .values({ workId: id, userId: session.userId, body })
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
    // Tell the work's author someone engaged with their work (skip self-comments).
    if (work.userId !== session.userId) {
      void notify(work.userId, {
        type: "work_comment",
        title: "تعليق جديد على عملك 💬",
        body: `علّق ${author?.fullName ?? "أحد الأعضاء"} على «${work.title}».`,
        link: `/works/${id}`,
      });
    }
    res.json({
      comment: { id: row.id, body: row.body, createdAt: row.createdAt, author, canDelete: true },
    });
  } catch (err) {
    logger.error({ err }, "POST /works/:id/comments failed");
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
