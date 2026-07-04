import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

// Append-only audit trail for sensitive admin/staff mutations. Modeled on the
// task-activity log (actor / action / from / to) but generic across target types
// so any privileged change — a user's role or status, work moderation, a story
// approval — is attributable after the fact. Insert-only: never updated or
// deleted in code. `actor` is the admin email (via getAdminEmail()) or the
// "admin" sentinel until per-admin auth exists.
export const auditLogTable = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    actor: varchar("actor", { length: 160 }).notNull(),
    action: varchar("action", { length: 60 }).notNull(),
    targetType: varchar("target_type", { length: 40 }).notNull(),
    targetId: varchar("target_id", { length: 80 }).notNull().default(""),
    oldValue: text("old_value").notNull().default(""),
    newValue: text("new_value").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    // GET /admin/audit lists newest-first; (target_type, target_id) filters a
    // single entity's history.
    createdIdx: index("audit_log_created_idx").on(t.createdAt),
    targetIdx: index("audit_log_target_idx").on(t.targetType, t.targetId),
  }),
);

export type AuditLog = typeof auditLogTable.$inferSelect;
export type InsertAuditLog = typeof auditLogTable.$inferInsert;
