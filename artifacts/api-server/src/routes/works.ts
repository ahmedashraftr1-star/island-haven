import { Router, type IRouter, type Request } from "express";
import { and, count, desc, eq, sql } from "drizzle-orm";
import {
  db,
  worksTable,
  usersTable,
  upsertWorkSchema,
  USER_ROLES,
  type UserRole,
} from "@workspace/db";
import { optionalUser, requireUser, type UserSession } from "../lib/auth";
import { logger } from "../lib/logger";
import { getFlag } from "./adminExtra";
import { invalidateNumbersCache } from "./numbers";

const router: IRouter = Router();

// ─── Public gallery ─────────────────────────────────────────────────────────

const WORKS_PAGE_SIZE = 18;

router.get("/works", async (req, res) => {
  try {
    const role = String(req.query.role ?? "");
    const requestedPage = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const filterByRole = (USER_ROLES as readonly string[]).includes(role)
      ? (role as UserRole)
      : null;

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
      .orderBy(desc(worksTable.createdAt))
      .limit(WORKS_PAGE_SIZE)
      .offset((page - 1) * WORKS_PAGE_SIZE);

    res.json({ works: rows, total, page, totalPages });
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
    res.json({ work: row.work, author, isOwner });
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
    // Strip internal fields before sending: status is for server-side checks only.
    // Phone is contact info — only expose to authenticated members
    // to prevent anonymous scraping by ID enumeration.
    const { status: _status, ...uPublic } = u;
    const user = session ? uPublic : { ...uPublic, phone: null as unknown as string };
    res.json({ user, works });
  } catch (err) {
    logger.error({ err }, "GET /users/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
