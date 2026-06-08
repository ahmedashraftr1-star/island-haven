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

const router: IRouter = Router();

// In-memory micro-cache (5s) keeps the homepage fast under burst traffic
// without going stale for human-visible numbers.
let cache: { at: number; data: unknown } | null = null;
const TTL = 5_000;

/**
 * Invalidate the /api/stats cache so the next request recomputes from DB.
 * Call this from any route that mutates data feeding into the aggregate, e.g.:
 *   - routes/admin.ts        (user status/role changes, deletions)
 *   - routes/adminExtra.ts   (bulk admin actions)
 *   - routes/works.ts        (work create/update/delete)
 *   - routes/auth.ts         (registration → new user counted)
 *   - routes/members.ts      (profile/status updates)
 *   - routes/programs.ts, routes/ventures.ts, routes/experts.ts,
 *     routes/partners.ts, routes/successStories.ts (when they affect totals)
 * Anything touching: users, applications, bookings, courses, enrollments,
 * works, or daily_posts tables.
 */
export function invalidateStatsCache(): void {
  cache = null;
}

router.get("/stats", async (_req, res) => {
  try {
    if (cache && Date.now() - cache.at < TTL) {
      res.json(cache.data);
      return;
    }
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
    const data = { stats: row };
    cache = { at: Date.now(), data };
    res.json(data);
  } catch (err) {
    logger.error({ err }, "GET /stats failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
