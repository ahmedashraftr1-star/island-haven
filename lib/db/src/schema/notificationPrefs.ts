import { pgTable, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

// Per-user notification preferences. One row per member (userId is the PK —
// there is at most one prefs row per user). Defaults favour the channels a
// member most likely wants on (session/program emails + push) and keep the
// noisier daily digest off until they opt in.

export const notificationPrefsTable = pgTable("notification_prefs", {
  userId: integer("user_id").primaryKey(),
  emailSessions: boolean("email_sessions").default(true).notNull(),
  emailPrograms: boolean("email_programs").default(true).notNull(),
  emailDaily: boolean("email_daily").default(false).notNull(),
  pushEnabled: boolean("push_enabled").default(true).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const updateNotificationPrefsSchema = z
  .object({
    emailSessions: z.boolean(),
    emailPrograms: z.boolean(),
    emailDaily: z.boolean(),
    pushEnabled: z.boolean(),
  })
  .partial();

export type NotificationPrefs = typeof notificationPrefsTable.$inferSelect;
