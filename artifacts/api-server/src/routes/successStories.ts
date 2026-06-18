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
import { sendEmail, adminNewStoryEmail, storyPublishedEmail, storyRejectedEmail, storyDeletedEmail } from "../lib/email";
import { getAdminEmail } from "./adminExtra";
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
    // Check if the member already has a story
    const [existing] = await db
      .select({ id: successStoriesTable.id, status: successStoriesTable.status })
      .from(successStoriesTable)
      .where(eq(successStoriesTable.submittedByUserId, userId))
      .limit(1);

    // Block if an active (non-deleted) story already exists
    if (existing && existing.status !== "deleted") {
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

    let row: typeof successStoriesTable.$inferSelect;

    if (existing && existing.status === "deleted") {
      // Resubmit after admin deletion — update the existing row back to draft
      const [updated] = await db
        .update(successStoriesTable)
        .set({
          personName: user.fullName,
          role: user.jobTitle ?? "",
          quote: d.quote,
          story: d.story,
          ventureName: d.ventureName,
          projectUrl: d.projectUrl ?? null,
          avatarUrl: user.avatarUrl ?? null,
          status: "draft",
          rejectionNote: null,
          updatedAt: new Date(),
        })
        .where(eq(successStoriesTable.submittedByUserId, userId))
        .returning();
      row = updated;
    } else {
      // Fresh first submission
      const [inserted] = await db
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
      row = inserted;
    }

    // Notify admin about the new/resubmitted story (fire-and-forget)
    const adminEmail = await getAdminEmail();
    if (adminEmail) {
      const adminUrl =
        (process.env.APP_URL ?? "https://islandhaven.io") +
        "/admin/stories";
      const mail = adminNewStoryEmail(user.fullName, d.quote, adminUrl);
      void sendEmail({ to: adminEmail, ...mail });
    } else {
      logger.warn(
        "ADMIN_EMAIL not configured — new-story admin notification skipped",
      );
    }

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

router.post("/me/story/resubmit", requireUser, async (req, res) => {
  const { userId } = (req as AuthReq).userSession;
  try {
    const [existing] = await db
      .select()
      .from(successStoriesTable)
      .where(eq(successStoriesTable.submittedByUserId, userId))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "لا توجد قصّة لإعادة تقديمها" });
      return;
    }

    if (existing.status !== "rejected") {
      res.status(409).json({ error: "يمكن إعادة التقديم فقط للقصص المرفوضة" });
      return;
    }

    // Accept optional updated content in the request body (body may be absent)
    const parsed = submitStorySchema.partial().safeParse(req.body ?? {});
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const d = parsed.data;

    const [row] = await db
      .update(successStoriesTable)
      .set({
        status: "draft",
        rejectionNote: null,
        ...(d.quote !== undefined ? { quote: d.quote } : {}),
        ...(d.story !== undefined ? { story: d.story } : {}),
        ...(d.ventureName !== undefined ? { ventureName: d.ventureName } : {}),
        ...(d.projectUrl !== undefined ? { projectUrl: d.projectUrl ?? null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(successStoriesTable.submittedByUserId, userId))
      .returning();

    res.json({ story: row });

    // Notify admin about the resubmission (fire-and-forget)
    const adminEmail = await getAdminEmail();
    if (adminEmail) {
      const adminUrl =
        (process.env.APP_URL ?? "https://islandhaven.io") + "/admin/stories";
      const notifyQuote = d.quote ?? existing.quote;
      const mail = adminNewStoryEmail(existing.personName, notifyQuote, adminUrl);
      void sendEmail({ to: adminEmail, ...mail });
    }
  } catch (err) {
    logger.error({ err }, "POST /me/story/resubmit failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/me/story", requireUser, async (req, res) => {
  const { userId } = (req as AuthReq).userSession;
  try {
    const [existing] = await db
      .select({ id: successStoriesTable.id, status: successStoriesTable.status })
      .from(successStoriesTable)
      .where(eq(successStoriesTable.submittedByUserId, userId))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "لا توجد قصّة لحذفها" });
      return;
    }

    if (existing.status !== "draft") {
      res.status(403).json({ error: "لا يمكن حذف القصّة بعد نشرها" });
      return;
    }

    await db
      .delete(successStoriesTable)
      .where(eq(successStoriesTable.submittedByUserId, userId));

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /me/story failed");
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

    // Fetch the current story so we can detect a status transition
    const [existing] = await db
      .select({
        status: successStoriesTable.status,
        submittedByUserId: successStoriesTable.submittedByUserId,
      })
      .from(successStoriesTable)
      .where(eq(successStoriesTable.id, id))
      .limit(1);

    const noteFromBody =
      typeof req.body?.rejectionNote === "string" && req.body.rejectionNote.trim()
        ? req.body.rejectionNote.trim()
        : undefined;

    const [row] = await db
      .update(successStoriesTable)
      .set({
        ...parsed.data,
        ...(parsed.data.status === "rejected"
          ? { rejectionNote: noteFromBody ?? null }
          : parsed.data.status
            ? { rejectionNote: null }
            : {}),
        updatedAt: new Date(),
      })
      .where(eq(successStoriesTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ story: row });

    // Notify the member if their story status changed to published or rejected
    const newStatus = parsed.data.status;
    if (
      existing &&
      newStatus &&
      newStatus !== existing.status &&
      (newStatus === "published" || newStatus === "rejected") &&
      existing.submittedByUserId
    ) {
      const [member] = await db
        .select({ email: usersTable.email, fullName: usersTable.fullName })
        .from(usersTable)
        .where(eq(usersTable.id, existing.submittedByUserId))
        .limit(1);

      if (member) {
        const mail =
          newStatus === "published"
            ? storyPublishedEmail(member.fullName)
            : storyRejectedEmail(member.fullName, noteFromBody);
        void sendEmail({ to: member.email, ...mail });
      } else {
        logger.warn(
          { storyId: id, submittedByUserId: existing.submittedByUserId },
          "story status changed but member not found — notification skipped",
        );
      }
    }
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
    // Fetch before update so we know who to notify and whether it's member-submitted
    const [existing] = await db
      .select({
        submittedByUserId: successStoriesTable.submittedByUserId,
        status: successStoriesTable.status,
      })
      .from(successStoriesTable)
      .where(eq(successStoriesTable.id, id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }

    if (existing.submittedByUserId) {
      // Member-submitted story: soft-delete so the member can resubmit
      await db
        .update(successStoriesTable)
        .set({ status: "deleted", updatedAt: new Date() })
        .where(eq(successStoriesTable.id, id));
    } else {
      // Admin-created story: hard delete (no member to notify or allow resubmit)
      await db.delete(successStoriesTable).where(eq(successStoriesTable.id, id));
    }

    res.json({ ok: true });

    // Notify the member if the story was submitted by one
    if (existing.submittedByUserId) {
      const deleteReason =
        typeof req.body?.reason === "string" && req.body.reason.trim()
          ? req.body.reason.trim()
          : undefined;
      const [member] = await db
        .select({ email: usersTable.email, fullName: usersTable.fullName })
        .from(usersTable)
        .where(eq(usersTable.id, existing.submittedByUserId))
        .limit(1);
      if (member) {
        void sendEmail({ to: member.email, ...storyDeletedEmail(member.fullName, deleteReason) });
      }
    }
  } catch (err) {
    logger.error({ err }, "DELETE /admin/stories/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
