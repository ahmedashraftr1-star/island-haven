import { Router, type IRouter } from "express";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  expertProfilesTable,
  venturesTable,
  programsTable,
  coursesTable,
} from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const LIMIT = 5;

// ─── Public global search across the main browsable entities ──────────────────
//
// GET /search?q=...  → { q, experts, ventures, programs, courses, members }
// Each result is normalised to { id, title, subtitle, ... } so clients render
// a uniform list. Only public/active rows are searched.

router.get("/search", async (req, res) => {
  try {
    // Cap the term length (parity with /members) so a pathologically long
    // query can't build an oversized ILIKE pattern across five tables.
    const q = String(req.query.q ?? "").trim().slice(0, 80);
    if (q.length < 2) {
      res.json({ q, experts: [], ventures: [], programs: [], courses: [], members: [] });
      return;
    }
    // Escape LIKE wildcards so user input is treated literally.
    const term = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;

    const [experts, ventures, programs, courses, members] = await Promise.all([
      db
        .select({
          id: expertProfilesTable.id,
          title: usersTable.fullName,
          subtitle: expertProfilesTable.headline,
          avatarUrl: usersTable.avatarUrl,
        })
        .from(expertProfilesTable)
        .innerJoin(usersTable, eq(usersTable.id, expertProfilesTable.userId))
        .where(
          and(
            eq(expertProfilesTable.status, "active"),
            eq(usersTable.status, "active"),
            or(
              ilike(usersTable.fullName, term),
              ilike(expertProfilesTable.headline, term),
              ilike(expertProfilesTable.expertise, term),
            ),
          ),
        )
        .limit(LIMIT),
      db
        .select({
          id: venturesTable.id,
          title: venturesTable.name,
          subtitle: venturesTable.tagline,
          sector: venturesTable.sector,
        })
        .from(venturesTable)
        .where(
          and(
            eq(venturesTable.status, "published"),
            or(
              ilike(venturesTable.name, term),
              ilike(venturesTable.tagline, term),
              ilike(venturesTable.sector, term),
            ),
          ),
        )
        .limit(LIMIT),
      db
        .select({
          id: programsTable.id,
          title: programsTable.title,
          subtitle: programsTable.summary,
        })
        .from(programsTable)
        .where(
          and(
            sql`${programsTable.status} <> 'draft'`,
            or(
              ilike(programsTable.title, term),
              ilike(programsTable.summary, term),
              ilike(programsTable.tags, term),
            ),
          ),
        )
        .limit(LIMIT),
      db
        .select({
          id: coursesTable.id,
          title: coursesTable.title,
          subtitle: coursesTable.summary,
          type: coursesTable.type,
        })
        .from(coursesTable)
        .where(
          and(
            sql`${coursesTable.status} <> 'draft'`,
            or(ilike(coursesTable.title, term), ilike(coursesTable.summary, term)),
          ),
        )
        .limit(LIMIT),
      db
        .select({
          id: usersTable.id,
          title: usersTable.fullName,
          subtitle: usersTable.jobTitle,
          avatarUrl: usersTable.avatarUrl,
        })
        .from(usersTable)
        .where(
          and(
            eq(usersTable.status, "active"),
            sql`${usersTable.role} <> 'expert'`,
            or(
              ilike(usersTable.fullName, term),
              ilike(usersTable.jobTitle, term),
              ilike(usersTable.skills, term),
            ),
          ),
        )
        .limit(LIMIT),
    ]);

    res.json({ q, experts, ventures, programs, courses, members });
  } catch (err) {
    logger.error({ err }, "GET /search failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
