import { Router, type IRouter } from "express";
import { sql, desc } from "drizzle-orm";
import { db, pageViewsTable } from "@workspace/db";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.post("/track", async (req, res) => {
  const path = String(req.body?.path ?? "/").slice(0, 256);
  const referrer = String(req.body?.referrer ?? "").slice(0, 512);
  const userAgent = String(req.headers["user-agent"] ?? "").slice(0, 512);
  await db.insert(pageViewsTable).values({ path, referrer, userAgent });
  res.json({ ok: true });
});

router.get("/admin/analytics", requireAdmin, async (_req, res) => {
  const totalRow = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pageViewsTable);
  const total = totalRow[0]?.count ?? 0;

  const byPath = await db
    .select({
      path: pageViewsTable.path,
      count: sql<number>`count(*)::int`,
    })
    .from(pageViewsTable)
    .groupBy(pageViewsTable.path)
    .orderBy(desc(sql`count(*)`))
    .limit(20);

  const byDay = await db
    .select({
      day: sql<string>`to_char(${pageViewsTable.createdAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(pageViewsTable)
    .where(sql`${pageViewsTable.createdAt} > now() - interval '30 days'`)
    .groupBy(sql`to_char(${pageViewsTable.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${pageViewsTable.createdAt}, 'YYYY-MM-DD')`);

  const last24Row = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pageViewsTable)
    .where(sql`${pageViewsTable.createdAt} > now() - interval '24 hours'`);

  res.json({
    total,
    last24h: last24Row[0]?.count ?? 0,
    byPath,
    byDay,
  });
});

export default router;
