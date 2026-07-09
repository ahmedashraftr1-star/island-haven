import { Router, type IRouter, type Request } from "express";
import bcrypt from "bcryptjs";
import { desc, eq } from "drizzle-orm";
import {
  db,
  adminUsersTable,
  createAdminUserSchema,
  updateAdminUserSchema,
  permissionsForRole,
  isValidPermission,
  ADMIN_SECTIONS,
  ADMIN_ROLES,
  ROLE_PRESETS,
  type AdminUserRow,
} from "@workspace/db";
import { requirePermission, getAdmin } from "../lib/auth";
import { writeAudit } from "../lib/audit";

// Managing team/staff accounts + their permissions. Every route requires the
// "staff:manage" permission; super-admins bypass. Escalation is prevented: a
// non-super admin can only grant permissions they themselves hold and can never
// create/produce a super_admin.
const router: IRouter = Router();
const PERM = "staff:manage";

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}

/** Strip the password hash before returning an account to the client. */
function publicRow(r: AdminUserRow) {
  const { passwordHash, ...rest } = r;
  void passwordHash;
  return rest;
}

/** Returns an error string if the caller may not grant this role/permission set. */
function guardGrant(req: Request, role: string, permissions: string[]): string | null {
  const me = getAdmin(req);
  if (!me) return "غير مصرّح";
  if (me.isSuper) return null;
  if (role === "super_admin") return "لا يمكنك إنشاء أو تعيين مدير أعلى (super-admin)";
  for (const p of permissions) {
    if (!me.permissions.has(p)) return "لا يمكنك منح صلاحيّة لا تملكها أنت";
  }
  return null;
}

// Catalog for the permission-matrix UI (sections + roles + presets).
router.get("/admin/staff/permissions-catalog", requirePermission(PERM), (_req, res) => {
  res.json({ sections: ADMIN_SECTIONS, roles: ADMIN_ROLES, presets: ROLE_PRESETS });
});

router.get("/admin/staff", requirePermission(PERM), async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(adminUsersTable)
      .orderBy(desc(adminUsersTable.createdAt));
    res.json({ team: rows.map(publicRow) });
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/staff", requirePermission(PERM), async (req, res) => {
  try {
    const parsed = createAdminUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "بيانات غير صحيحة", issues: parsed.error.issues });
      return;
    }
    const { email, fullName, password, role } = parsed.data;
    const permissions = (parsed.data.permissions ?? permissionsForRole(role)).filter(isValidPermission);
    const gErr = guardGrant(req, role, permissions);
    if (gErr) {
      res.status(403).json({ error: gErr });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    try {
      const [row] = await db
        .insert(adminUsersTable)
        .values({ email, fullName, passwordHash, role, permissions })
        .returning();
      void writeAudit({
        actor: getAdmin(req)?.email ?? "admin",
        action: "admin_account_created",
        targetType: "admin_user",
        targetId: row.id,
        newValue: `${email} · ${role}`,
      });
      res.status(201).json({ member: publicRow(row) });
    } catch (err) {
      if (isUniqueViolation(err)) {
        res.status(409).json({ error: "هذا البريد مسجّل مسبقًا" });
        return;
      }
      throw err;
    }
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/staff/:id", requirePermission(PERM), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "معرّف غير صالح" });
      return;
    }
    const parsed = updateAdminUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "بيانات غير صحيحة", issues: parsed.error.issues });
      return;
    }
    const [existing] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.id, id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }

    const nextRole = parsed.data.role ?? existing.role;
    const nextPerms = (parsed.data.permissions ?? existing.permissions).filter(isValidPermission);
    const gErr = guardGrant(req, nextRole, nextPerms);
    if (gErr) {
      res.status(403).json({ error: gErr });
      return;
    }
    const me = getAdmin(req);
    if (me && me.id === id && parsed.data.status === "disabled") {
      res.status(400).json({ error: "لا يمكنك تعطيل حسابك الخاصّ" });
      return;
    }
    // A non-super admin cannot modify a super_admin account.
    if (!me?.isSuper && existing.role === "super_admin") {
      res.status(403).json({ error: "لا يمكنك تعديل حساب مدير أعلى" });
      return;
    }

    const patch: Partial<AdminUserRow> = { updatedAt: new Date() };
    if (parsed.data.fullName !== undefined) patch.fullName = parsed.data.fullName;
    if (parsed.data.role !== undefined) patch.role = parsed.data.role;
    if (parsed.data.permissions !== undefined) patch.permissions = nextPerms;
    if (parsed.data.status !== undefined) patch.status = parsed.data.status;
    let bumpEpoch = false;
    if (parsed.data.password) {
      patch.passwordHash = await bcrypt.hash(parsed.data.password, 12);
      bumpEpoch = true;
    }
    if (parsed.data.status === "disabled") bumpEpoch = true;
    if (bumpEpoch) patch.sessionEpoch = existing.sessionEpoch + 1;

    const [row] = await db
      .update(adminUsersTable)
      .set(patch)
      .where(eq(adminUsersTable.id, id))
      .returning();
    void writeAudit({
      actor: me?.email ?? "admin",
      action: "admin_account_updated",
      targetType: "admin_user",
      targetId: id,
      oldValue: `${existing.role} · ${existing.status}`,
      newValue: `${row.role} · ${row.status}`,
    });
    res.json({ member: publicRow(row) });
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/staff/:id", requirePermission(PERM), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "معرّف غير صالح" });
      return;
    }
    const me = getAdmin(req);
    if (me && me.id === id) {
      res.status(400).json({ error: "لا يمكنك حذف حسابك الخاصّ" });
      return;
    }
    const [existing] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.id, id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    if (!me?.isSuper && existing.role === "super_admin") {
      res.status(403).json({ error: "لا يمكنك حذف حساب مدير أعلى" });
      return;
    }
    await db.delete(adminUsersTable).where(eq(adminUsersTable.id, id));
    void writeAudit({
      actor: me?.email ?? "admin",
      action: "admin_account_deleted",
      targetType: "admin_user",
      targetId: id,
      oldValue: existing.email,
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
