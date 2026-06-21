import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  newsletterSubscribersTable,
  subscribeSchema,
} from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/newsletter/subscribe", async (req, res) => {
  try {
    const parsed = subscribeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة",
      });
      return;
    }
    const { email, name } = parsed.data;
    const existing = await db
      .select()
      .from(newsletterSubscribersTable)
      .where(eq(newsletterSubscribersTable.email, email))
      .limit(1);
    if (existing.length > 0) {
      if (existing[0].status === "unsubscribed") {
        await db
          .update(newsletterSubscribersTable)
          .set({ status: "active", unsubscribedAt: null, subscribedAt: new Date() })
          .where(eq(newsletterSubscribersTable.id, existing[0].id));
      }
      res.json({ ok: true, alreadySubscribed: true });
      return;
    }
    await db.insert(newsletterSubscribersTable).values({ email, name });
    res.json({ ok: true, alreadySubscribed: false });
  } catch (err) {
    logger.error({ err }, "POST /newsletter/subscribe failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/admin/newsletter", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(newsletterSubscribersTable)
      .orderBy(desc(newsletterSubscribersTable.subscribedAt));
    res.json({ subscribers: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/newsletter failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/newsletter/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) { res.status(404).json({ error: "غير موجود" }); return; }
    await db
      .delete(newsletterSubscribersTable)
      .where(eq(newsletterSubscribersTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/newsletter/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
