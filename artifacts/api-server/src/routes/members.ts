import { Router, type IRouter } from "express";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  worksTable,
  USER_ROLES,
  type UserRole,
} from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const MEMBERS_PAGE_SIZE = 24;

/**
 * GET /api/members
 *   ?role=freelancer|graduate|student|other
 *   ?q=search
 *   ?page=1
 *
 * Public directory of every active member with their work counts.
 * Sensitive contact info (phone, email) is NEVER exposed here.
 */
router.get("/members", async (req, res) => {
  try {
    const role = String(req.query.role ?? "");
    const q = String(req.query.q ?? "").trim().slice(0, 80);
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const filterByRole = USER_ROLES.includes(role as UserRole) ? (role as UserRole) : null;

    const where = [eq(usersTable.status, "active") as never];
    if (filterByRole) where.push(eq(usersTable.role, filterByRole) as never);
    if (q) {
      where.push(
        or(
          ilike(usersTable.fullName, `%${q}%`),
          ilike(usersTable.jobTitle, `%${q}%`),
          ilike(usersTable.skills, `%${q}%`),
          ilike(usersTable.bio, `%${q}%`),
        ) as never,
      );
    }

    const [{ total }] = await db
      .select({ total: count() })
      .from(usersTable)
      .where(and(...where));

    const rows = await db
      .select({
        id: usersTable.id,
        fullName: usersTable.fullName,
        role: usersTable.role,
        avatarUrl: usersTable.avatarUrl,
        bio: usersTable.bio,
        jobTitle: usersTable.jobTitle,
        skills: usersTable.skills,
        portfolioUrl: usersTable.portfolioUrl,
        linkedinUrl: usersTable.linkedinUrl,
        behanceUrl: usersTable.behanceUrl,
        githubUrl: usersTable.githubUrl,
        otherLinks: usersTable.otherLinks,
        createdAt: usersTable.createdAt,
        worksCount: sql<number>`(
          SELECT COUNT(*)::int FROM ${worksTable}
          WHERE ${worksTable.userId} = ${usersTable.id}
            AND ${worksTable.status} = 'visible'
        )`,
      })
      .from(usersTable)
      .where(and(...where))
      .orderBy(desc(usersTable.createdAt))
      .limit(MEMBERS_PAGE_SIZE)
      .offset((page - 1) * MEMBERS_PAGE_SIZE);

    res.json({ members: rows, total, page, totalPages: Math.ceil(total / MEMBERS_PAGE_SIZE) });
  } catch (err) {
    logger.error({ err }, "GET /members failed");
    res.status(500).json({ error: "تعذّر تحميل المنتسبين" });
  }
});

export default router;
