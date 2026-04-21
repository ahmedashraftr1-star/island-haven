import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const siteSettingsTable = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type SiteSetting = typeof siteSettingsTable.$inferSelect;
export type InsertSiteSetting = typeof siteSettingsTable.$inferInsert;
