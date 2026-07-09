import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

// Per-staff in-dashboard notifications — the admin-side analog of the member
// notificationsTable. Keyed by admin_users.id (0 = the ENV super-admin, which
// has no row). Written when a task is assigned to you, you're @mentioned in a
// task comment or the team channel, or a member replies to a DM you own.
// Surfaced by a bell in the admin shell. Fire-and-forget at call sites.

export const ADMIN_NOTIFICATION_TYPES = [
  "task_assigned",
  "task_mention",
  "task_comment",
  "channel_mention",
  "member_reply",
  "generic",
] as const;
export type AdminNotificationType = (typeof ADMIN_NOTIFICATION_TYPES)[number];

export const adminNotificationsTable = pgTable(
  "admin_notifications",
  {
    id: serial("id").primaryKey(),
    adminUserId: integer("admin_user_id").notNull(),
    type: varchar("type", { length: 32 })
      .notNull()
      .$type<AdminNotificationType>()
      .default("generic"),
    title: varchar("title", { length: 200 }).notNull(),
    body: varchar("body", { length: 500 }).default("").notNull(),
    // In-app deep link, e.g. "tasks:42" (open task 42) or "channel".
    link: varchar("link", { length: 200 }).default("").notNull(),
    actor: varchar("actor", { length: 120 }).default("").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    adminIdx: index("admin_notifications_admin_idx").on(t.adminUserId, t.readAt),
  }),
);

export type AdminNotification = typeof adminNotificationsTable.$inferSelect;
