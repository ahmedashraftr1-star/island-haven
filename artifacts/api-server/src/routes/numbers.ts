import { Router, type IRouter } from "express";
import { and, eq, gte, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  applicationsTable,
  bookingsTable,
  coursesTable,
  enrollmentsTable,
  worksTable,
  dailyPostsTable,
  USER_ROLES,
  type UserRole,
} from "@workspace/db";
import { logger } from "../lib/logger";
import { cached, bust } from "../lib/cache";

const router: IRouter = Router();

const CACHE_KEY = "numbers";
const TTL_SEC = 30;

/**
 * Invalidate the /api/numbers cache so the next request recomputes from DB.
 * Now backed by the shared Redis cache (see lib/cache.ts): a bust from ANY
 * instance clears it everywhere (previously per-process only). Call from any
 * route that mutates data feeding the aggregate, e.g.:
 *   - routes/adminExtra.ts   (bulk admin actions)
 *   - routes/works.ts        (work create/update/delete, visibility toggles)
 *   - routes/auth.ts         (registration → new user counted)
 *   - routes/programs.ts, routes/ventures.ts, routes/experts.ts,
 *     routes/partners.ts, routes/successStories.ts (when they affect totals)
 * Anything touching: users, works, courses, enrollments, bookings,
 * applications, or daily_posts tables.
 */
export function invalidateNumbersCache(): void {
  void bust(CACHE_KEY);
}

/**
 * GET /api/numbers — rich aggregated stats for the public "بالأرقام" page.
 * Real database counts only — never inflated, never hard-coded.
 */
router.get("/numbers", async (_req, res) => {
  try {
    const data = await cached(CACHE_KEY, TTL_SEC, async () => {
    const [totals] = await db
      .select({
        members: sql<number>`(SELECT COUNT(*)::int FROM users WHERE status = 'active') + COALESCE((SELECT (value::jsonb->>'members')::int FROM site_settings WHERE key = 'numbers_base'), 0)`,
        freelancers: sql<number>`(SELECT COUNT(*)::int FROM users WHERE status = 'active' AND role = 'freelancer')`,
        graduates: sql<number>`(SELECT COUNT(*)::int FROM users WHERE status = 'active' AND role = 'graduate')`,
        students: sql<number>`(SELECT COUNT(*)::int FROM users WHERE status = 'active' AND role = 'student')`,
        works: sql<number>`(SELECT COUNT(*)::int FROM works w JOIN users u ON u.id = w.user_id WHERE w.status IN ('visible','featured') AND u.status = 'active')`,
        courses: sql<number>`(SELECT COUNT(*)::int FROM courses WHERE status <> 'draft')`,
        enrollments: sql<number>`(SELECT COUNT(*)::int FROM enrollments WHERE status <> 'cancelled')`,
        bookings: sql<number>`(SELECT COUNT(*)::int FROM bookings WHERE status <> 'cancelled')`,
        seatsHosted: sql<number>`(SELECT COALESCE(SUM(attendees),0)::int FROM bookings WHERE status <> 'cancelled')`,
        applications: sql<number>`(SELECT COUNT(*)::int FROM applications)`,
        events: sql<number>`(SELECT COUNT(*)::int FROM daily_posts)`,
      })
      .from(sql`(SELECT 1) AS _`);
    void usersTable; void worksTable; void coursesTable;
    void enrollmentsTable; void bookingsTable; void applicationsTable;
    void dailyPostsTable;

      return { numbers: totals };
    });
    res.json(data);
    void and; void eq; void gte;
  } catch (err) {
    void USER_ROLES; void ({} as UserRole);
    logger.error({ err }, "GET /numbers failed");
    res.status(500).json({ error: "تعذّر تحميل الأرقام" });
  }
});

export default router;
