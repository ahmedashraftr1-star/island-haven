import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import {
  applicationsTable,
  db,
  insertApplicationSchema,
} from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { z } from "zod";

const router: IRouter = Router();

router.post("/applications", async (req, res) => {
  const parsed = insertApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      error: "تحقّق من البيانات",
      issues: parsed.error.issues.map((i: { path: PropertyKey[]; message: string }) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }
  const [row] = await db
    .insert(applicationsTable)
    .values(parsed.data)
    .returning({ id: applicationsTable.id });
  res.json({ ok: true, id: row.id });
});

router.get("/admin/applications", requireAdmin, async (_req, res) => {
  const rows = await db
    .select()
    .from(applicationsTable)
    .orderBy(desc(applicationsTable.createdAt));
  res.json({ applications: rows });
});

const updateSchema = z.object({
  status: z.enum(["new", "reviewing", "accepted", "rejected"]).optional(),
  notes: z.string().max(4000).optional(),
});

router.patch("/admin/applications/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات غير صحيحة" });
    return;
  }
  const [row] = await db
    .update(applicationsTable)
    .set(parsed.data)
    .where(eq(applicationsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "غير موجود" });
    return;
  }
  res.json({ application: row });
});

router.delete("/admin/applications/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }
  await db.delete(applicationsTable).where(eq(applicationsTable.id, id));
  res.json({ ok: true });
});

router.get("/admin/applications/stats", requireAdmin, async (_req, res) => {
  const rows = await db
    .select({
      status: applicationsTable.status,
      count: sql<number>`count(*)::int`,
    })
    .from(applicationsTable)
    .groupBy(applicationsTable.status);
  res.json({ byStatus: rows });
});

export default router;
