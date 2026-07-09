import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import {
  ADMIN_ROLES,
  ADMIN_STATUSES,
  ALL_ADMIN_PERMISSIONS,
  type AdminRole,
  type AdminStatus,
} from "./admin-permissions";
// Re-export the pure RBAC taxonomy so `@workspace/db` (and the contracts entry)
// expose it to the API and the frontend permission-matrix UI unchanged.
export * from "./admin-permissions";

/**
 * admin_users — DB-backed staff/admin accounts (separate from the public `users`
 * table). The bootstrap ENV admin (ADMIN_USERNAME/ADMIN_PASSWORD) is NOT a row
 * here; it acts as a virtual super-admin (id 0). Every account holds a resolved
 * `permissions` set (seeded from a role preset, then editable); `super_admin`
 * bypasses checks. Sessions embed `sessionEpoch` so disabling/rotating revokes
 * all prior tokens (same mechanism as `users`).
 */
export const adminUsersTable = pgTable(
  "admin_users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 160 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    role: varchar("role", { length: 24 }).notNull().$type<AdminRole>(),
    // Resolved grant set — the authorization authority (role is for display/quick-fill).
    permissions: text("permissions").array().$type<string[]>().default([]).notNull(),
    status: varchar("status", { length: 16 })
      .default("active")
      .notNull()
      .$type<AdminStatus>(),
    // Bumped on password change / disable → revokes all previously-issued tokens.
    sessionEpoch: integer("session_epoch").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (t) => ({
    emailIdx: index("admin_users_email_idx").on(t.email),
  }),
);

export type AdminUserRow = typeof adminUsersTable.$inferSelect;

// ── Zod contracts (reused by the admin-team routes) ──────────────────────────
const permissionSchema = z
  .array(z.enum(ALL_ADMIN_PERMISSIONS as unknown as [string, ...string[]]))
  .max(ALL_ADMIN_PERMISSIONS.length);

export const createAdminUserSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(160),
  fullName: z.string().trim().min(2).max(120),
  password: z.string().min(10).max(200),
  role: z.enum(ADMIN_ROLES),
  // Optional explicit overrides; when omitted the role preset is used.
  permissions: permissionSchema.optional(),
});

export const updateAdminUserSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  role: z.enum(ADMIN_ROLES).optional(),
  permissions: permissionSchema.optional(),
  status: z.enum(ADMIN_STATUSES).optional(),
  password: z.string().min(10).max(200).optional(),
});
