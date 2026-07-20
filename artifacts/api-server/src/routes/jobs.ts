import { Router, type IRouter } from "express";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import {
  db,
  jobListingsTable,
  upsertJobSchema,
} from "@workspace/db";
import { requireAdmin } from "../lib/auth";
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

router.get("/jobs", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(jobListingsTable)
      .where(and(eq(jobListingsTable.status, "active"), isNull(jobListingsTable.deletedAt)))
      .orderBy(
        desc(jobListingsTable.featured),
        asc(jobListingsTable.sortOrder),
        desc(jobListingsTable.createdAt),
      );
    res.json({ jobs: rows });
  } catch (err) {
    logger.error({ err }, "GET /jobs failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/admin/jobs", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(jobListingsTable)
      .where(isNull(jobListingsTable.deletedAt))
      .orderBy(
        desc(jobListingsTable.featured),
        asc(jobListingsTable.sortOrder),
        desc(jobListingsTable.createdAt),
      );
    res.json({ jobs: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/jobs failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/jobs", requireAdmin, async (req, res) => {
  try {
    const parsed = upsertJobSchema.safeParse(req.body);
    if (!parsed.success) { badData(res, parsed.error); return; }
    const d = parsed.data;
    const [row] = await db
      .insert(jobListingsTable)
      .values({ ...d, companyLogoUrl: d.companyLogoUrl ?? null })
      .returning();
    res.json({ job: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/jobs failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/jobs/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) { res.status(404).json({ error: "غير موجود" }); return; }
    const parsed = upsertJobSchema.partial().safeParse(req.body);
    if (!parsed.success) { badData(res, parsed.error); return; }
    const [row] = await db
      .update(jobListingsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(jobListingsTable.id, id), isNull(jobListingsTable.deletedAt)))
      .returning();
    if (!row) { res.status(404).json({ error: "غير موجود" }); return; }
    res.json({ job: row });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/jobs/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/jobs/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) { res.status(404).json({ error: "غير موجود" }); return; }
    // Soft-delete: move to Trash (restorable). NEVER hard-delete.
    const [row] = await db
      .update(jobListingsTable)
      .set({ deletedAt: new Date() })
      .where(and(eq(jobListingsTable.id, id), isNull(jobListingsTable.deletedAt)))
      .returning({ id: jobListingsTable.id, title: jobListingsTable.title });
    if (!row) { res.status(404).json({ error: "غير موجود" }); return; }
    void writeAudit({
      actor: auditActor(req),
      action: "job_deleted",
      targetType: "job",
      targetId: id,
      oldValue: row.title ?? "",
    });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/jobs/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
