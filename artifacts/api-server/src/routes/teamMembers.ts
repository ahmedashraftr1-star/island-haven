import { Router, type IRouter } from "express";
import { asc, desc, eq } from "drizzle-orm";
import {
  db,
  teamMembersTable,
  upsertTeamMemberSchema,
} from "@workspace/db";
import { requireAdmin } from "../lib/auth";
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

router.get("/team", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(teamMembersTable)
      .where(eq(teamMembersTable.status, "visible"))
      .orderBy(
        desc(teamMembersTable.featured),
        asc(teamMembersTable.sortOrder),
        asc(teamMembersTable.createdAt),
      );
    res.json({ team: rows });
  } catch (err) {
    logger.error({ err }, "GET /team failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/admin/team", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(teamMembersTable)
      .orderBy(
        desc(teamMembersTable.featured),
        asc(teamMembersTable.sortOrder),
        asc(teamMembersTable.createdAt),
      );
    res.json({ team: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/team failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/team", requireAdmin, async (req, res) => {
  try {
    const parsed = upsertTeamMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const d = parsed.data;
    const [row] = await db
      .insert(teamMembersTable)
      .values({ ...d, avatarUrl: d.avatarUrl ?? null })
      .returning();
    res.json({ member: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/team failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/team/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = upsertTeamMemberSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const [row] = await db
      .update(teamMembersTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(teamMembersTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ member: row });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/team/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/team/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    await db.delete(teamMembersTable).where(eq(teamMembersTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/team/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
