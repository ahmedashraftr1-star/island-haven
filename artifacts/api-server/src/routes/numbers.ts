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

const router: IRouter = Router();

let cache: { at: number; data: unknown } | null = null;
const TTL = 30_000;

/**
 * Invalidate the /api/numbers cache so the next request recomputes from DB.
 * Call this from any route that mutates data feeding into the aggregate, e.g.:
 *   - routes/admin.ts        (user status changes, role changes, deletions)
 *   - routes/adminExtra.ts   (bulk admin actions)
 *   - routes/works.ts        (work create/update/delete, visibility toggles)
 *   - routes/auth.ts         (registration → new user counted)
 *   - routes/members.ts      (profile/status updates affecting active counts)
 *   - routes/programs.ts, routes/ventures.ts, routes/experts.ts,
 *     routes/partners.ts, routes/successStories.ts (when they affect totals)
 * Anything touching: users, works, courses, enrollments, bookings,
 * applications, or daily_posts tables.
 */
export function invalidateNumbersCache(): void {
  cache = null;
}

/**
 * GET /api/numbers — rich aggregated stats for the public "بالأرقام" page.
 * Real database counts only — never inflated, never hard-coded.
 */
router.get("/numbers", async (_req, res) => {
  try {
    if (cache && Date.now() - cache.at < TTL) {
      res.json(cache.data);
      return;
    }
    const [totals] = await db
      .select({
        members: sql<number>`(SELECT COUNT(*)::int FROM users WHERE status = 'active')`,
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

    const data = { numbers: totals };
    cache = { at: Date.now(), data };
    res.json(data);
    void and; void eq; void gte;
  } catch (err) {
    void USER_ROLES; void ({} as UserRole);
    logger.error({ err }, "GET /numbers failed");
    res.status(500).json({ error: "تعذّر تحميل الأرقام" });
  }
});

export default router;
