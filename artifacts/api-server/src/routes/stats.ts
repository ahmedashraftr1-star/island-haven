import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import {
  db,
  usersTable,
  applicationsTable,
  bookingsTable,
  coursesTable,
  enrollmentsTable,
  worksTable,
  dailyPostsTable,
} from "@workspace/db";
import { logger } from "../lib/logger";
import { cached, bust } from "../lib/cache";

const router: IRouter = Router();

// Shared Redis cache (5s) keeps the homepage fast under burst traffic without
// going stale for human-visible numbers. Falls back to a per-process map when
// Redis is absent (see lib/cache.ts).
const CACHE_KEY = "stats";
const TTL_SEC = 5;

/**
 * Invalidate the /api/stats cache so the next request recomputes from DB.
 * Backed by the shared Redis cache — busts everywhere, not just this process.
 * Call from any route that mutates data feeding the aggregate (users,
 * applications, bookings, courses, enrollments, works, daily_posts).
 */
export function invalidateStatsCache(): void {
  void bust(CACHE_KEY);
}

router.get("/stats", async (_req, res) => {
  try {
    const data = await cached(CACHE_KEY, TTL_SEC, async () => {
    const [row] = await db
      .select({
        users: sql<number>`(SELECT COUNT(*)::int FROM ${usersTable})`,
        applications: sql<number>`(SELECT COUNT(*)::int FROM ${applicationsTable})`,
        bookings: sql<number>`(SELECT COUNT(*)::int FROM ${bookingsTable})`,
        courses: sql<number>`(SELECT COUNT(*)::int FROM ${coursesTable} WHERE status <> 'draft')`,
        enrollments: sql<number>`(SELECT COUNT(*)::int FROM ${enrollmentsTable} WHERE status <> 'cancelled')`,
        works: sql<number>`(SELECT COUNT(*)::int FROM ${worksTable})`,
        daily: sql<number>`(SELECT COUNT(*)::int FROM ${dailyPostsTable})`,
      })
      .from(sql`(SELECT 1) AS _`);
      return { stats: row };
    });
    res.json(data);
  } catch (err) {
    logger.error({ err }, "GET /stats failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
