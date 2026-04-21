import { pgTable, serial, timestamp, text } from "drizzle-orm/pg-core";

export const pageViewsTable = pgTable("page_views", {
  id: serial("id").primaryKey(),
  path: text("path").notNull().default("/"),
  referrer: text("referrer").default(""),
  userAgent: text("user_agent").default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type PageView = typeof pageViewsTable.$inferSelect;
