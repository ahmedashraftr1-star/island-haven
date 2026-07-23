import { Router, type IRouter } from "express";
import { and, asc, count, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  rosterMembersTable,
  ROSTER_PUBLIC_COLUMNS,
  ROSTER_TYPES,
  ROSTER_GENDERS,
  ROSTER_STATUSES,
  type RosterType,
} from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { writeAudit, auditActor } from "../lib/audit";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ── Admin write validation ────────────────────────────────────────────────────
// Zod-validated + length-capped. Editable columns ONLY; id/createdAt/deletedAt are
// never client-settable. `trimS` keeps stored data clean; birthYear/seat are
// nullable ints. The PUBLIC read is still column-restricted at the DB level, so
// even a sensitive field edited here can never leak to /api/roster.
const trimS = (max: number) => z.string().trim().max(max);
const rosterWritable = {
  fullName: trimS(200).min(1),
  fullNameEn: trimS(200),
  type: z.enum(ROSTER_TYPES),
  gender: z.enum(ROSTER_GENDERS),
  skill: trimS(200),
  field: trimS(120),
  linkedinUrl: trimS(500),
  linkedinPublic: z.boolean(),
  phone: trimS(40),
  birthYear: z.coerce.number().int().min(1940).max(2020).nullable(),
  notes: trimS(4000),
  cvUrl: trimS(1000),
  internetUser: trimS(120),
  days: trimS(120),
  period: trimS(40),
  seat: z.coerce.number().int().min(1).max(50).nullable(),
  sortOrder: z.coerce.number().int().min(0).max(100000),
  status: z.enum(ROSTER_STATUSES),
};
// Create: name/type/gender required; everything else optional (DB defaults fill in).
const createSchema = z.object(rosterWritable).partial().required({
  fullName: true,
  type: true,
  gender: true,
});
// Update: every field optional (partial edit).
const updateSchema = z.object(rosterWritable).partial();
// Which edited fields are SENSITIVE — their NAMES may appear in the audit trail
// (attributability of what changed) but their VALUES are never logged.
const SENSITIVE_FIELDS = new Set(["phone", "birthYear", "notes", "cvUrl", "internetUser"]);
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

// GET /api/admin/roster/stats — richer breakdown for the admin dashboard.
// (Also mounted at the legacy /admin/stats path so the existing caller keeps
// working; /admin/roster/stats is the canonical, unambiguous name.)
const adminStatsHandler = async (_req: unknown, res: import("express").Response) => {
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
    logger.error({ err }, "GET /admin/roster/stats failed");
    res.status(500).json({ error: "failed" });
  }
};
router.get("/admin/roster/stats", requireAdmin, adminStatsHandler);
router.get("/admin/stats", requireAdmin, adminStatsHandler); // legacy alias

// POST /api/admin/roster — CREATE a member. Admin only. All columns settable; the
// PUBLIC read stays column-restricted, so sensitive fields entered here can never
// leak to /api/roster. Audited (name + type only — never sensitive values).
router.post("/admin/roster", requireAdmin, async (req, res) => {
  const parsed = createSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return void res.status(400).json({ error: "قيمة غير صالحة", issues: parsed.error.flatten().fieldErrors });
  }
  try {
    const [row] = await db
      .insert(rosterMembersTable)
      .values(parsed.data as typeof rosterMembersTable.$inferInsert)
      .returning();
    void writeAudit({
      actor: auditActor(req),
      action: "roster_created",
      targetType: "roster",
      targetId: row.id,
      newValue: `${row.fullName} · ${row.type}`,
    });
    res.status(201).json({ member: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/roster failed");
    res.status(500).json({ error: "failed" });
  }
});

// PATCH /api/admin/roster/:id — edit ANY editable field of a member (incl. the
// sensitive block and the linkedin_public toggle). Admin only. Audited by field
// NAME only — sensitive values (phone/birth/notes/cv/internetUser) are never logged.
router.patch("/admin/roster/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) return void res.status(400).json({ error: "bad id" });
  const parsed = updateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return void res.status(400).json({ error: "قيمة غير صالحة", issues: parsed.error.flatten().fieldErrors });
  }
  const fields = Object.keys(parsed.data);
  if (fields.length === 0) return void res.status(400).json({ error: "nothing to update" });
  try {
    const [row] = await db
      .update(rosterMembersTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(rosterMembersTable.id, id), isNull(rosterMembersTable.deletedAt)))
      .returning();
    if (!row) return void res.status(404).json({ error: "not found" });
    // Log which fields changed (names only). Sensitive field NAMES may appear
    // (attributability) but their VALUES never do.
    void writeAudit({
      actor: auditActor(req),
      action: "roster_updated",
      targetType: "roster",
      targetId: id,
      newValue: fields.join(","),
      oldValue: fields.some((f) => SENSITIVE_FIELDS.has(f)) ? "(incl. sensitive fields — values not logged)" : undefined,
    });
    res.json({ member: row });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/roster failed");
    res.status(500).json({ error: "failed" });
  }
});

// DELETE /api/admin/roster/:id — SOFT-delete (sets deleted_at). The row disappears
// from every read; it is restorable from the Trash (سلّة المحذوفات). Audited.
router.delete("/admin/roster/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) return void res.status(400).json({ error: "bad id" });
  try {
    const [row] = await db
      .update(rosterMembersTable)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(rosterMembersTable.id, id), isNull(rosterMembersTable.deletedAt)))
      .returning({ id: rosterMembersTable.id, fullName: rosterMembersTable.fullName });
    if (!row) return void res.status(404).json({ error: "not found" });
    void writeAudit({
      actor: auditActor(req),
      action: "roster_deleted",
      targetType: "roster",
      targetId: id,
      oldValue: row.fullName, // name only — attributability, no sensitive data
    });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/roster failed");
    res.status(500).json({ error: "failed" });
  }
});

export default router;
