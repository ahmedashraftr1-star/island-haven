import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

// In-app notifications for members. Written server-side at event time
// (program acceptance, session confirmation, …). Plain int userId (acyclic).

export const NOTIFICATION_TYPES = [
  "program_accepted",
  "session_confirmed",
  "session_requested",
  "generic",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const notificationsTable = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    type: varchar("type", { length: 32 })
      .notNull()
      .$type<NotificationType>()
      .default("generic"),
    title: varchar("title", { length: 200 }).notNull(),
    body: varchar("body", { length: 500 }).default("").notNull(),
    link: varchar("link", { length: 400 }).default("").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userIdx: index("notifications_user_idx").on(t.userId),
  }),
);

export type Notification = typeof notificationsTable.$inferSelect;
