import { Router, type IRouter } from "express";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  db,
  usersTable,
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
    const requestedPage = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const filterByRole = (USER_ROLES as readonly string[]).includes(role)
      ? (role as UserRole)
      : null;

    const where = [eq(usersTable.status, "active") as never];
    // Experts have their own directory (/experts) — keep them out of the
    // general members list so the two surfaces don't overlap.
    where.push(sql`${usersTable.role} <> 'expert'` as never);
    if (filterByRole) where.push(eq(usersTable.role, filterByRole) as never);
    if (q) {
      // Escape LIKE metacharacters so a user can't inject % / _ wildcards
      // (Drizzle parameterizes the value — this is wildcard-DoS hardening).
      const esc = q.replace(/[\\%_]/g, (c) => "\\" + c);
      where.push(
        or(
          ilike(usersTable.fullName, `%${esc}%`),
          ilike(usersTable.jobTitle, `%${esc}%`),
          ilike(usersTable.skills, `%${esc}%`),
          ilike(usersTable.bio, `%${esc}%`),
        ) as never,
      );
    }

    const [{ total }] = await db
      .select({ total: count() })
      .from(usersTable)
      .where(and(...where));

    // Stable community breakdown over the WHOLE active non-expert population —
    // independent of the current role/q filter. The directory page drives both
    // its hero total and its role breakdown from this, so the two always
    // reconcile with each other (roleCounts sum to communityTotal) and with the
    // unfiltered list. (The filtered `total` above stays the per-chip count.)
    const communityWhere = and(
      eq(usersTable.status, "active"),
      sql`${usersTable.role} <> 'expert'`,
    );
    const roleRows = await db
      .select({ role: usersTable.role, c: count() })
      .from(usersTable)
      .where(communityWhere)
      .groupBy(usersTable.role);
    const roleCounts = { freelancer: 0, graduate: 0, student: 0, other: 0 };
    let communityTotal = 0;
    for (const r of roleRows) {
      communityTotal += r.c;
      if (r.role === "freelancer" || r.role === "graduate" || r.role === "student") {
        roleCounts[r.role] += r.c;
      } else {
        roleCounts.other += r.c;
      }
    }

    // Clamp page to the valid range so a huge ?page never produces an
    // out-of-range deep offset.
    const totalPages = Math.max(1, Math.ceil(total / MEMBERS_PAGE_SIZE));
    const page = Math.min(requestedPage, totalPages);

    const rows = await db
      .select({
        id: usersTable.id,
        fullName: usersTable.fullName,
        fullNameEn: usersTable.fullNameEn,
        role: usersTable.role,
        avatarUrl: usersTable.avatarUrl,
        bio: usersTable.bio,
        jobTitle: usersTable.jobTitle,
        jobTitleEn: usersTable.jobTitleEn,
        skills: usersTable.skills,
        portfolioUrl: usersTable.portfolioUrl,
        linkedinUrl: usersTable.linkedinUrl,
        behanceUrl: usersTable.behanceUrl,
        githubUrl: usersTable.githubUrl,
        otherLinks: usersTable.otherLinks,
        createdAt: usersTable.createdAt,
        worksCount: sql<number>`(
          SELECT COUNT(*)::int FROM works w
          WHERE w.user_id = users.id
            AND w.status = 'visible'
        )`,
      })
      .from(usersTable)
      .where(and(...where))
      .orderBy(desc(usersTable.createdAt))
      .limit(MEMBERS_PAGE_SIZE)
      .offset((page - 1) * MEMBERS_PAGE_SIZE);

    res.json({ members: rows, total, page, totalPages, communityTotal, roleCounts });
  } catch (err) {
    logger.error({ err }, "GET /members failed");
    res.status(500).json({ error: "تعذّر تحميل المنتسبين" });
  }
});

export default router;
