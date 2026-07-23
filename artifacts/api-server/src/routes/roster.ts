import { Router, type IRouter } from "express";
import { and, asc, count, eq, ilike, isNull, or, sql } from "drizzle-orm";
import {
  db,
  rosterMembersTable,
  ROSTER_PUBLIC_COLUMNS,
  ROSTER_TYPES,
  type RosterType,
} from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();
// The roster is small (~61), so the DEFAULT returns everything in one call
// (returned count == total). `?limit` (clamped) + `?page` remain available for
// future scale, but a plain GET /api/roster never truncates the community.
const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 1000;

// Base predicate: visible + not soft-deleted. Reused by every read.
const liveWhere = () =>
  and(eq(rosterMembersTable.status, "visible"), isNull(rosterMembersTable.deletedAt));

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/roster — PUBLIC talent directory.
//
// PRIVACY (P0): selects ONLY ROSTER_PUBLIC_COLUMNS (name/type/gender/skill/field).
// The sensitive block (phone/birthYear/notes/cv/internetUser) and the operational
// block (days/period/seat) are NEVER read here — they cannot appear in the payload
// because they are never selected. LinkedIn is intentionally omitted from the
// public list entirely (a per-member public LinkedIn surface can be added later
// gated on linkedin_public). Nothing sensitive is logged.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/roster", async (req, res) => {
  try {
    const typeParam = String(req.query.type ?? "");
    const type = (ROSTER_TYPES as readonly string[]).includes(typeParam)
      ? (typeParam as RosterType)
      : null;
    const q = String(req.query.q ?? "").trim().slice(0, 80);
    const requestedPage = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(req.query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));

    const where = [liveWhere() as never];
    if (type) where.push(eq(rosterMembersTable.type, type) as never);
    if (q) {
      const esc = q.replace(/[\\%_]/g, (c) => "\\" + c);
      where.push(
        or(
          ilike(rosterMembersTable.fullName, `%${esc}%`),
          ilike(rosterMembersTable.skill, `%${esc}%`),
        ) as never,
      );
    }

    const [{ total }] = await db
      .select({ total: count() })
      .from(rosterMembersTable)
      .where(and(...where));

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(requestedPage, totalPages);

    const rows = await db
      .select(ROSTER_PUBLIC_COLUMNS) // ← the ONLY columns that ever leave publicly
      .from(rosterMembersTable)
      .where(and(...where))
      .orderBy(asc(rosterMembersTable.sortOrder))
      .limit(limit)
      .offset((page - 1) * limit);

    // `total` is a real COUNT(*); with the default limit the returned array IS the
    // whole (filtered) community, so returned length == total.
    res.json({ members: rows, total, page, totalPages, limit });
  } catch (err) {
    logger.error({ err }, "GET /roster failed");
    res.status(500).json({ error: "تعذّر تحميل المنتسبين" });
  }
});

// GET /api/roster/stats — PUBLIC aggregates (non-identifying counts). Powers the
// /membership hero + /impact figures. Only COUNT()s — no personal fields.
router.get("/roster/stats", async (_req, res) => {
  try {
    const byType = await db
      .select({ type: rosterMembersTable.type, c: count() })
      .from(rosterMembersTable)
      .where(liveWhere())
      .groupBy(rosterMembersTable.type);
    const byGender = await db
      .select({ gender: rosterMembersTable.gender, c: count() })
      .from(rosterMembersTable)
      .where(liveWhere())
      .groupBy(rosterMembersTable.gender);

    const types = { student: 0, graduate: 0, freelancer: 0 } as Record<string, number>;
    let total = 0;
    for (const r of byType) {
      types[r.type] = r.c;
      total += r.c;
    }
    const genders = { male: 0, female: 0 } as Record<string, number>;
    for (const r of byGender) genders[r.gender] = r.c;

    // Top skills — an aggregate COUNT by skill (non-identifying). Powers /impact.
    const bySkill = await db
      .select({ skill: rosterMembersTable.skill, c: count() })
      .from(rosterMembersTable)
      .where(and(liveWhere(), sql`${rosterMembersTable.skill} <> ''`))
      .groupBy(rosterMembersTable.skill)
      .orderBy(sql`count(*) DESC`)
      .limit(8);

    res.json({ total, types, genders, topSkills: bySkill });
  } catch (err) {
    logger.error({ err }, "GET /roster/stats failed");
    res.status(500).json({ error: "تعذّر تحميل الإحصاءات" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — full records incl. the sensitive/operational blocks. 401 without a
// valid admin session (requireAdmin). These are the ONLY endpoints that ever
// return phone/birthYear/cv/internetUser/days/period/seat.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/admin/roster", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(rosterMembersTable)
      .where(isNull(rosterMembersTable.deletedAt))
      .orderBy(asc(rosterMembersTable.sortOrder));
    res.json({ members: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/roster failed");
    res.status(500).json({ error: "failed" });
  }
});

// GET /api/admin/stats — richer breakdown for the admin dashboard.
router.get("/admin/stats", requireAdmin, async (_req, res) => {
  try {
    const bySkill = await db
      .select({ skill: rosterMembersTable.skill, c: count() })
      .from(rosterMembersTable)
      .where(liveWhere())
      .groupBy(rosterMembersTable.skill)
      .orderBy(sql`count(*) DESC`)
      .limit(15);
    const byType = await db
      .select({ type: rosterMembersTable.type, c: count() })
      .from(rosterMembersTable)
      .where(liveWhere())
      .groupBy(rosterMembersTable.type);
    const byGender = await db
      .select({ gender: rosterMembersTable.gender, c: count() })
      .from(rosterMembersTable)
      .where(liveWhere())
      .groupBy(rosterMembersTable.gender);
    const [{ total }] = await db
      .select({ total: count() })
      .from(rosterMembersTable)
      .where(liveWhere());
    const [{ withLinkedin }] = await db
      .select({ withLinkedin: count() })
      .from(rosterMembersTable)
      .where(and(liveWhere(), sql`${rosterMembersTable.linkedinUrl} <> ''`));
    res.json({ total, byType, byGender, bySkill, withLinkedin });
  } catch (err) {
    logger.error({ err }, "GET /admin/stats failed");
    res.status(500).json({ error: "failed" });
  }
});

// PATCH /api/admin/roster/:id — edit a member (incl. flipping linkedin_public to
// surface a verified LinkedIn on the public page). Admin only.
router.patch("/admin/roster/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id)) return void res.status(400).json({ error: "bad id" });
    const b = (req.body ?? {}) as Record<string, unknown>;
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof b.linkedinPublic === "boolean") patch.linkedinPublic = b.linkedinPublic;
    if (typeof b.skill === "string") patch.skill = b.skill.slice(0, 200);
    if (typeof b.field === "string") patch.field = b.field.slice(0, 120);
    if (b.status === "visible" || b.status === "hidden") patch.status = b.status;
    if (Object.keys(patch).length === 1) return void res.status(400).json({ error: "nothing to update" });
    await db.update(rosterMembersTable).set(patch).where(eq(rosterMembersTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/roster failed");
    res.status(500).json({ error: "failed" });
  }
});

export default router;
