import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  db,
  contactMessagesTable,
  CONTACT_STATUSES,
  type ContactStatus,
} from "@workspace/db";
import { requirePermission } from "../lib/auth";
import { logger } from "../lib/logger";

// Admin inbox for public contact-form submissions. GET requires contact:view,
// mutations contact:manage (also enforced centrally by adminGate).
const router: IRouter = Router();

router.get("/admin/contact", requirePermission("contact:view"), async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const status = String(req.query.status ?? "").trim();
    const q = String(req.query.q ?? "").trim().slice(0, 80);

    const conds = [];
    if (status && (CONTACT_STATUSES as readonly string[]).includes(status)) {
      conds.push(eq(contactMessagesTable.status, status as ContactStatus));
    }
    if (q) {
      const like = `%${q}%`;
      conds.push(
        or(
          ilike(contactMessagesTable.name, like),
          ilike(contactMessagesTable.email, like),
          ilike(contactMessagesTable.subject, like),
          ilike(contactMessagesTable.message, like),
        ),
      );
    }
    const where = conds.length ? and(...conds) : undefined;

    const [rows, [countRow], byStatus] = await Promise.all([
      db
        .select()
        .from(contactMessagesTable)
        .where(where)
        .orderBy(desc(contactMessagesTable.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: sql<number>`count(*)::int` }).from(contactMessagesTable).where(where),
      db
        .select({ status: contactMessagesTable.status, count: sql<number>`count(*)::int` })
        .from(contactMessagesTable)
        .groupBy(contactMessagesTable.status),
    ]);
    const counts: Record<string, number> = { new: 0, read: 0, handled: 0, archived: 0 };
    for (const r of byStatus) counts[r.status] = r.count;
    res.json({ messages: rows, total: countRow?.total ?? 0, counts, limit, offset });
  } catch (err) {
    logger.error({ err }, "GET /admin/contact failed");
    res.status(500).json({ error: "تعذّر التحميل" });
  }
});

router.patch("/admin/contact/:id", requirePermission("contact:manage"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "معرّف غير صالح" });
      return;
    }
    const status = String(req.body?.status ?? "");
    if (!(CONTACT_STATUSES as readonly string[]).includes(status)) {
      res.status(400).json({ error: "حالة غير صالحة" });
      return;
    }
    const [row] = await db
      .update(contactMessagesTable)
      .set({
        status: status as ContactStatus,
        handledAt: status === "handled" ? new Date() : null,
      })
      .where(eq(contactMessagesTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ message: row });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/contact/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/contact/:id", requirePermission("contact:manage"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "معرّف غير صالح" });
      return;
    }
    await db.delete(contactMessagesTable).where(eq(contactMessagesTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/contact/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
