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
        members: sql<number>`(SELECT COUNT(*)::int FROM ${usersTable} WHERE ${usersTable.status} = 'active')`,
        freelancers: sql<number>`(SELECT COUNT(*)::int FROM ${usersTable} WHERE ${usersTable.status} = 'active' AND ${usersTable.role} = 'freelancer')`,
        graduates: sql<number>`(SELECT COUNT(*)::int FROM ${usersTable} WHERE ${usersTable.status} = 'active' AND ${usersTable.role} = 'graduate')`,
        students: sql<number>`(SELECT COUNT(*)::int FROM ${usersTable} WHERE ${usersTable.status} = 'active' AND ${usersTable.role} = 'student')`,
        works: sql<number>`(SELECT COUNT(*)::int FROM ${worksTable} JOIN ${usersTable} ON ${usersTable.id} = ${worksTable.userId} WHERE ${worksTable.status} = 'visible' AND ${usersTable.status} = 'active')`,
        courses: sql<number>`(SELECT COUNT(*)::int FROM ${coursesTable} WHERE ${coursesTable.status} <> 'draft')`,
        enrollments: sql<number>`(SELECT COUNT(*)::int FROM ${enrollmentsTable} WHERE ${enrollmentsTable.status} <> 'cancelled')`,
        bookings: sql<number>`(SELECT COUNT(*)::int FROM ${bookingsTable} WHERE ${bookingsTable.status} <> 'cancelled')`,
        seatsHosted: sql<number>`(SELECT COALESCE(SUM(${bookingsTable.attendees}),0)::int FROM ${bookingsTable} WHERE ${bookingsTable.status} <> 'cancelled')`,
        applications: sql<number>`(SELECT COUNT(*)::int FROM ${applicationsTable})`,
        events: sql<number>`(SELECT COUNT(*)::int FROM ${dailyPostsTable})`,
      })
      .from(sql`(SELECT 1) AS _`);

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
