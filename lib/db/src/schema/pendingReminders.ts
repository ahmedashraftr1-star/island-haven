import {
  pgTable,
  serial,
  varchar,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * Stores one row per pending mentor password-setup reminder.
 * Inserted at approval time with sendAt = approvedAt + 20 h.
 * Survives server restarts: on startup the job re-reads the table,
 * fires overdue rows immediately, and reschedules future ones.
 */
export const pendingRemindersTable = pgTable(
  "pending_reminders",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 160 }).notNull(),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    sendAt: timestamp("send_at", { withTimezone: true }).notNull(),
    sent: boolean("sent").default(false).notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    sentIdx: index("pending_reminders_sent_idx").on(t.sent),
    sendAtIdx: index("pending_reminders_send_at_idx").on(t.sendAt),
  }),
);

export type PendingReminder = typeof pendingRemindersTable.$inferSelect;
