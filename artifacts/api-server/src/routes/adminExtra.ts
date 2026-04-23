import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or, sql, lt } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  db,
  usersTable,
  worksTable,
  enrollmentsTable,
  coursesTable,
  pageViewsTable,
  siteSettingsTable,
  USER_ROLES,
  USER_STATUSES,
  WORK_STATUSES,
  ENROLLMENT_STATUSES,
  type UserRole,
  type UserStatus,
  type WorkStatus,
  type EnrollmentStatus,
} from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Strip password hashes before sending users anywhere.
function publicUser<T extends { passwordHash?: string }>(u: T) {
  const { passwordHash: _h, ...rest } = u;
  void _h;
  return rest;
}

const safeText = (max: number) =>
  z.string().trim().max(max).regex(/^[^<>]*$/u, "رموز غير مسموح بها");

// ─── USERS ──────────────────────────────────────────────────────────────────

router.get("/admin/users", requireAdmin, async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim().slice(0, 80);
    const role = String(req.query.role ?? "");
    const status = String(req.query.status ?? "");
    const where = [] as Array<ReturnType<typeof eq>>;
    if (q) {
      where.push(
        or(
          ilike(usersTable.fullName, `%${q}%`),
          ilike(usersTable.email, `%${q}%`),
        ) as never,
      );
    }
    if (USER_ROLES.includes(role as UserRole)) {
      where.push(eq(usersTable.role, role as UserRole));
    }
    if (USER_STATUSES.includes(status as UserStatus)) {
      where.push(eq(usersTable.status, status as UserStatus));
    }
    const rows = await db
      .select()
      .from(usersTable)
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(usersTable.createdAt))
      .limit(500);
    res.json({ users: rows.map(publicUser) });
  } catch (err) {
    logger.error({ err }, "GET /admin/users failed");
    res.status(500).json({ error: "تعذّر تحميل المستخدمين" });
  }
});

const updateUserSchema = z.object({
  fullName: safeText(120).min(2).optional(),
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(USER_STATUSES).optional(),
  bio: safeText(2000).optional(),
  phone: z.string().trim().max(40).regex(/^[\d\s+()\-]*$/u).optional(),
  skills: safeText(500).optional(),
  password: z.string().min(8).max(200).optional(),
});

router.patch("/admin/users/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "بيانات غير صحيحة",
      issues: parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }
  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    for (const [k, v] of Object.entries(parsed.data)) {
      if (k === "password" && typeof v === "string" && v.length >= 8) {
        updates["passwordHash"] = await bcrypt.hash(v, 12);
      } else if (v !== undefined) {
        updates[k] = v;
      }
    }
    const [row] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ user: publicUser(row) });
  } catch (err) {
    logger.error({ err, id }, "PATCH /admin/users failed");
    res.status(500).json({ error: "تعذّر التحديث" });
  }
});

router.delete("/admin/users/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }
  try {
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err, id }, "DELETE /admin/users failed");
    res.status(500).json({ error: "تعذّر الحذف" });
  }
});

// ─── WORKS MODERATION ───────────────────────────────────────────────────────

router.get("/admin/works", requireAdmin, async (req, res) => {
  try {
    const status = String(req.query.status ?? "");
    const q = String(req.query.q ?? "").trim().slice(0, 80);
    const where = [] as Array<ReturnType<typeof eq>>;
    if (WORK_STATUSES.includes(status as WorkStatus)) {
      where.push(eq(worksTable.status, status as WorkStatus));
    }
    if (q) {
      where.push(
        or(
          ilike(worksTable.title, `%${q}%`),
          ilike(usersTable.fullName, `%${q}%`),
        ) as never,
      );
    }
    const rows = await db
      .select({
        work: worksTable,
        author: {
          id: usersTable.id,
          fullName: usersTable.fullName,
          email: usersTable.email,
          role: usersTable.role,
          status: usersTable.status,
          avatarUrl: usersTable.avatarUrl,
        },
      })
      .from(worksTable)
      .innerJoin(usersTable, eq(usersTable.id, worksTable.userId))
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(worksTable.createdAt))
      .limit(500);
    res.json({ works: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/works failed");
    res.status(500).json({ error: "تعذّر تحميل الأعمال" });
  }
});

const updateWorkSchema = z.object({
  status: z.enum(WORK_STATUSES).optional(),
  title: safeText(200).min(2).optional(),
  summary: safeText(400).optional(),
});

router.patch("/admin/works/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }
  const parsed = updateWorkSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات غير صحيحة" });
    return;
  }
  try {
    const [row] = await db
      .update(worksTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(worksTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ work: row });
  } catch (err) {
    logger.error({ err, id }, "PATCH /admin/works failed");
    res.status(500).json({ error: "تعذّر التحديث" });
  }
});

router.delete("/admin/works/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }
  try {
    await db.delete(worksTable).where(eq(worksTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err, id }, "DELETE /admin/works failed");
    res.status(500).json({ error: "تعذّر الحذف" });
  }
});

// ─── ENROLLMENTS ────────────────────────────────────────────────────────────

router.get(
  "/admin/courses/:id/enrollments",
  requireAdmin,
  async (req, res) => {
    const courseId = Number(req.params.id);
    if (!Number.isInteger(courseId) || courseId <= 0) {
      res.status(400).json({ error: "معرّف غير صحيح" });
      return;
    }
    try {
      const rows = await db
        .select({
          enrollment: enrollmentsTable,
          user: {
            id: usersTable.id,
            fullName: usersTable.fullName,
            email: usersTable.email,
            phone: usersTable.phone,
            role: usersTable.role,
            avatarUrl: usersTable.avatarUrl,
          },
        })
        .from(enrollmentsTable)
        .innerJoin(usersTable, eq(usersTable.id, enrollmentsTable.userId))
        .where(eq(enrollmentsTable.courseId, courseId))
        .orderBy(desc(enrollmentsTable.createdAt));
      res.json({ enrollments: rows });
    } catch (err) {
      logger.error({ err, courseId }, "GET enrollments failed");
      res.status(500).json({ error: "تعذّر تحميل التسجيلات" });
    }
  },
);

const addEnrollmentSchema = z.object({
  email: z.string().trim().toLowerCase().email("بريد غير صحيح"),
  status: z.enum(ENROLLMENT_STATUSES).default("confirmed"),
});

router.post(
  "/admin/courses/:id/enrollments",
  requireAdmin,
  async (req, res) => {
    const courseId = Number(req.params.id);
    if (!Number.isInteger(courseId) || courseId <= 0) {
      res.status(400).json({ error: "معرّف غير صحيح" });
      return;
    }
    const parsed = addEnrollmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "بيانات غير صحيحة" });
      return;
    }
    try {
      const [course] = await db
        .select({ id: coursesTable.id })
        .from(coursesTable)
        .where(eq(coursesTable.id, courseId))
        .limit(1);
      if (!course) {
        res.status(404).json({ error: "الكورس غير موجود" });
        return;
      }
      const [user] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.email, parsed.data.email))
        .limit(1);
      if (!user) {
        res.status(404).json({ error: "لا يوجد مستخدم بهذا البريد" });
        return;
      }
      // Atomic upsert via the (user_id, course_id) unique index — eliminates
      // the race between two admins enrolling the same email at once.
      const [row] = await db
        .insert(enrollmentsTable)
        .values({
          userId: user.id,
          courseId,
          status: parsed.data.status as EnrollmentStatus,
        })
        .onConflictDoUpdate({
          target: [enrollmentsTable.userId, enrollmentsTable.courseId],
          set: { status: parsed.data.status as EnrollmentStatus },
        })
        .returning();
      res.json({ enrollment: row });
    } catch (err) {
      logger.error({ err, courseId }, "POST add enrollment failed");
      res.status(500).json({ error: "تعذّر الإضافة" });
    }
  },
);

const updateEnrollmentSchema = z.object({
  status: z.enum(ENROLLMENT_STATUSES),
});

router.patch("/admin/enrollments/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }
  const parsed = updateEnrollmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات غير صحيحة" });
    return;
  }
  try {
    const [row] = await db
      .update(enrollmentsTable)
      .set({ status: parsed.data.status })
      .where(eq(enrollmentsTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ enrollment: row });
  } catch (err) {
    logger.error({ err, id }, "PATCH enrollment failed");
    res.status(500).json({ error: "تعذّر التحديث" });
  }
});

router.delete("/admin/enrollments/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }
  try {
    await db.delete(enrollmentsTable).where(eq(enrollmentsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err, id }, "DELETE enrollment failed");
    res.status(500).json({ error: "تعذّر الحذف" });
  }
});

// ─── SETTINGS (toggles) ─────────────────────────────────────────────────────

export const SETTING_FLAGS = [
  "registration_enabled",
  "bookings_enabled",
  "works_submission_enabled",
] as const;
export type SettingFlag = (typeof SETTING_FLAGS)[number];

const SETTING_DEFAULTS: Record<SettingFlag, boolean> = {
  registration_enabled: true,
  bookings_enabled: true,
  works_submission_enabled: true,
};

const SETTING_LABELS: Record<SettingFlag, string> = {
  registration_enabled: "السماح بالتسجيل في الموقع",
  bookings_enabled: "السماح بحجز المقاعد",
  works_submission_enabled: "السماح برفع الأعمال",
};

export async function getFlag(key: SettingFlag): Promise<boolean> {
  try {
    const [row] = await db
      .select()
      .from(siteSettingsTable)
      .where(eq(siteSettingsTable.key, `flag.${key}`))
      .limit(1);
    if (!row) return SETTING_DEFAULTS[key];
    const v = row.value as unknown;
    if (typeof v === "boolean") return v;
    if (typeof v === "object" && v !== null && "value" in v) {
      return Boolean((v as { value: unknown }).value);
    }
    return SETTING_DEFAULTS[key];
  } catch {
    return SETTING_DEFAULTS[key];
  }
}

router.get("/admin/settings", requireAdmin, async (_req, res) => {
  try {
    const out: Array<{ key: SettingFlag; label: string; value: boolean }> = [];
    for (const k of SETTING_FLAGS) {
      out.push({ key: k, label: SETTING_LABELS[k], value: await getFlag(k) });
    }
    res.json({ settings: out });
  } catch (err) {
    logger.error({ err }, "GET /admin/settings failed");
    res.status(500).json({ error: "تعذّر التحميل" });
  }
});

const setSettingSchema = z.object({ value: z.boolean() });

router.put("/admin/settings/:key", requireAdmin, async (req, res) => {
  const key = String(req.params.key) as SettingFlag;
  if (!SETTING_FLAGS.includes(key)) {
    res.status(404).json({ error: "إعداد غير معروف" });
    return;
  }
  const parsed = setSettingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات غير صحيحة" });
    return;
  }
  try {
    await db
      .insert(siteSettingsTable)
      .values({ key: `flag.${key}`, value: { value: parsed.data.value } })
      .onConflictDoUpdate({
        target: siteSettingsTable.key,
        set: { value: { value: parsed.data.value }, updatedAt: new Date() },
      });
    res.json({ ok: true, value: parsed.data.value });
  } catch (err) {
    logger.error({ err, key }, "PUT setting failed");
    res.status(500).json({ error: "تعذّر الحفظ" });
  }
});

// ─── PAGE VIEWS PRUNE ───────────────────────────────────────────────────────

const pruneSchema = z.object({
  beforeDays: z.coerce.number().int().min(1).max(3650),
});

router.delete("/admin/analytics/page-views", requireAdmin, async (req, res) => {
  const parsed = pruneSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات غير صحيحة" });
    return;
  }
  try {
    const cutoff = new Date(
      Date.now() - parsed.data.beforeDays * 24 * 60 * 60 * 1000,
    );
    const result = await db
      .delete(pageViewsTable)
      .where(lt(pageViewsTable.createdAt, cutoff));
    res.json({ ok: true, deleted: (result as { rowCount?: number }).rowCount ?? 0 });
  } catch (err) {
    logger.error({ err }, "prune page-views failed");
    res.status(500).json({ error: "تعذّر الحذف" });
  }
});

// Total counts — useful for admin dashboard sub-cards.
router.get("/admin/totals", requireAdmin, async (_req, res) => {
  try {
    const [u] = await db.select({ n: sql<number>`count(*)::int` }).from(usersTable);
    const [w] = await db.select({ n: sql<number>`count(*)::int` }).from(worksTable);
    const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(coursesTable);
    const [e] = await db.select({ n: sql<number>`count(*)::int` }).from(enrollmentsTable);
    res.json({
      users: u?.n ?? 0,
      works: w?.n ?? 0,
      courses: c?.n ?? 0,
      enrollments: e?.n ?? 0,
    });
  } catch (err) {
    logger.error({ err }, "GET /admin/totals failed");
    res.status(500).json({ error: "تعذّر التحميل" });
  }
});

export default router;
