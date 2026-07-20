import { Router, type IRouter, type Request } from "express";
import { and, asc, desc, eq, isNull, isNotNull } from "drizzle-orm";
import {
  db,
  venturesTable,
  resourcesTable,
  upsertVentureSchema,
} from "@workspace/db";
import { requireAdmin, requireUser, type UserSession } from "../lib/auth";
import { writeAudit, auditActor } from "../lib/audit";
import { logger } from "../lib/logger";

const router: IRouter = Router();

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

router.get("/ventures", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(venturesTable)
      .where(and(eq(venturesTable.status, "published"), isNull(venturesTable.deletedAt)))
      .orderBy(
        desc(venturesTable.featured),
        asc(venturesTable.sortOrder),
        desc(venturesTable.createdAt),
      );
    res.json({ ventures: rows });
  } catch (err) {
    logger.error({ err }, "GET /ventures failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/ventures/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [row] = await db
      .select()
      .from(venturesTable)
      .where(eq(venturesTable.id, id))
      .limit(1);
    if (!row || row.status !== "published" || row.deletedAt) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    // Attach the linked pitch deck (title + downloadable URL) if one is set.
    let pitchDeck: { title: string; url: string } | null = null;
    if (row.pitchDeckResourceId) {
      const [r] = await db
        .select({
          title: resourcesTable.title,
          fileUrl: resourcesTable.fileUrl,
          externalUrl: resourcesTable.externalUrl,
        })
        .from(resourcesTable)
        .where(eq(resourcesTable.id, row.pitchDeckResourceId))
        .limit(1);
      if (r && (r.fileUrl || r.externalUrl)) {
        pitchDeck = { title: r.title, url: r.fileUrl || r.externalUrl };
      }
    }
    res.json({ venture: row, pitchDeck });
  } catch (err) {
    logger.error({ err }, "GET /ventures/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// Ventures the logged-in member founded (admin links them via venture.userId).
router.get("/me/ventures", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const rows = await db
      .select()
      .from(venturesTable)
      .where(and(eq(venturesTable.userId, session.userId), isNull(venturesTable.deletedAt)))
      .orderBy(desc(venturesTable.createdAt));
    res.json({ ventures: rows });
  } catch (err) {
    logger.error({ err }, "GET /me/ventures failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Admin ───────────────────────────────────────────────────────────────────

router.get("/admin/ventures", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(venturesTable)
      .where(isNull(venturesTable.deletedAt))
      .orderBy(
        desc(venturesTable.featured),
        asc(venturesTable.sortOrder),
        desc(venturesTable.createdAt),
      );
    res.json({ ventures: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/ventures failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/ventures", requireAdmin, async (req, res) => {
  try {
    const parsed = upsertVentureSchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const d = parsed.data;
    const [row] = await db
      .insert(venturesTable)
      .values({ ...d, coverUrl: d.coverUrl ?? null, logoUrl: d.logoUrl ?? null })
      .returning();
    void writeAudit({ actor: auditActor(req), action: "venture_created", targetType: "venture", targetId: row.id, newValue: row.name });
    res.json({ venture: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/ventures failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/ventures/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = upsertVentureSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const [before] = await db
      .select({ status: venturesTable.status })
      .from(venturesTable)
      .where(eq(venturesTable.id, id))
      .limit(1);
    const [row] = await db
      .update(venturesTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(venturesTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    void writeAudit({
      actor: auditActor(req),
      action: before && before.status !== row.status ? "venture_status_changed" : "venture_updated",
      targetType: "venture",
      targetId: id,
      oldValue: before?.status ?? null,
      newValue: before && before.status !== row.status ? row.status : Object.keys(parsed.data).join(","),
    });
    res.json({ venture: row });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/ventures/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/ventures/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [before] = await db.select({ name: venturesTable.name }).from(venturesTable).where(eq(venturesTable.id, id)).limit(1);
    // SOFT delete — the row is retained + excluded from all reads, recoverable
    // from the Trash. Never a hard DELETE.
    await db.update(venturesTable).set({ deletedAt: new Date() }).where(and(eq(venturesTable.id, id), isNull(venturesTable.deletedAt)));
    void writeAudit({ actor: auditActor(req), action: "venture_deleted", targetType: "venture", targetId: id, oldValue: before?.name ?? "" });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/ventures/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
