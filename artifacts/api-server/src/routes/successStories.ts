import { Router, type IRouter } from "express";
import { asc, desc, eq } from "drizzle-orm";
import {
  db,
  successStoriesTable,
  upsertStorySchema,
  submitStorySchema,
  usersTable,
} from "@workspace/db";
import { requireAdmin, requireUser, type UserSession } from "../lib/auth";
import { logger } from "../lib/logger";
import type { Request } from "express";

const router: IRouter = Router();

type AuthReq = Request & { userSession: UserSession };

function badData(
  res: import("express").Response,
  err: { issues: Array<{ path: PropertyKey[]; message: string }> },
) {
  res.status(400).json({
    error: "بيانات غير صحيحة",
    details: err.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    })),
  });
}

// ─── Public ──────────────────────────────────────────────────────────────────

router.get("/stories", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(successStoriesTable)
      .where(eq(successStoriesTable.status, "published"))
      .orderBy(
        desc(successStoriesTable.featured),
        asc(successStoriesTable.sortOrder),
        desc(successStoriesTable.createdAt),
      );
    res.json({ stories: rows });
  } catch (err) {
    logger.error({ err }, "GET /stories failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Member: submit / view their own story ────────────────────────────────────

router.get("/me/story", requireUser, async (req, res) => {
  const { userId } = (req as AuthReq).userSession;
  try {
    const [row] = await db
      .select()
      .from(successStoriesTable)
      .where(eq(successStoriesTable.submittedByUserId, userId))
      .limit(1);
    res.json({ story: row ?? null });
  } catch (err) {
    logger.error({ err }, "GET /me/story failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/me/story", requireUser, async (req, res) => {
  const { userId } = (req as AuthReq).userSession;
  try {
    // Ensure member hasn't already submitted a story
    const [existing] = await db
      .select({ id: successStoriesTable.id })
      .from(successStoriesTable)
      .where(eq(successStoriesTable.submittedByUserId, userId))
      .limit(1);
    if (existing) {
      res.status(409).json({ error: "لديك قصّة مقدَّمة بالفعل" });
      return;
    }

    const parsed = submitStorySchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }

    // Fetch the member's name and job title from their profile
    const [user] = await db
      .select({ fullName: usersTable.fullName, jobTitle: usersTable.jobTitle, avatarUrl: usersTable.avatarUrl })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "المستخدم غير موجود" });
      return;
    }

    const d = parsed.data;
    const [row] = await db
      .insert(successStoriesTable)
      .values({
        personName: user.fullName,
        role: user.jobTitle ?? "",
        quote: d.quote,
        story: d.story,
        ventureName: d.ventureName,
        projectUrl: d.projectUrl ?? null,
        avatarUrl: user.avatarUrl ?? null,
        status: "draft",
        featured: false,
        sortOrder: 0,
        submittedByUserId: userId,
      })
      .returning();
    res.json({ story: row });
  } catch (err) {
    logger.error({ err }, "POST /me/story failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/me/story", requireUser, async (req, res) => {
  const { userId } = (req as AuthReq).userSession;
  try {
    const [existing] = await db
      .select()
      .from(successStoriesTable)
      .where(eq(successStoriesTable.submittedByUserId, userId))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "لا توجد قصّة لتحديثها" });
      return;
    }

    // Only allow editing while still in draft; published stories are locked for members
    if (existing.status !== "draft") {
      res.status(403).json({ error: "لا يمكن تعديل القصّة بعد نشرها" });
      return;
    }

    const parsed = submitStorySchema.partial().safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }

    const d = parsed.data;
    const [row] = await db
      .update(successStoriesTable)
      .set({
        ...(d.quote !== undefined ? { quote: d.quote } : {}),
        ...(d.story !== undefined ? { story: d.story } : {}),
        ...(d.ventureName !== undefined ? { ventureName: d.ventureName } : {}),
        ...(d.projectUrl !== undefined ? { projectUrl: d.projectUrl ?? null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(successStoriesTable.submittedByUserId, userId))
      .returning();

    res.json({ story: row });
  } catch (err) {
    logger.error({ err }, "PATCH /me/story failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Admin ────────────────────────────────────────────────────────────────────

router.get("/admin/stories", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(successStoriesTable)
      .orderBy(
        desc(successStoriesTable.featured),
        asc(successStoriesTable.sortOrder),
        desc(successStoriesTable.createdAt),
      );
    res.json({ stories: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/stories failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/stories", requireAdmin, async (req, res) => {
  try {
    const parsed = upsertStorySchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const d = parsed.data;
    const [row] = await db
      .insert(successStoriesTable)
      .values({ ...d, avatarUrl: d.avatarUrl ?? null, coverUrl: d.coverUrl ?? null, projectUrl: d.projectUrl ?? null })
      .returning();
    res.json({ story: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/stories failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/stories/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = upsertStorySchema.partial().safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const [row] = await db
      .update(successStoriesTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(successStoriesTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ story: row });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/stories/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/stories/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    await db.delete(successStoriesTable).where(eq(successStoriesTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/stories/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
