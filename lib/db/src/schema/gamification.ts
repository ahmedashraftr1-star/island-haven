import {
  pgTable,
  serial,
  timestamp,
  varchar,
  integer,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { z } from "zod";

// Gamification — earnable badges + a community leaderboard. Badges are minted
// by admins and awarded to members; the leaderboard ranks members by a simple
// blend of their published works and the badges they've earned.

export const badgesTable = pgTable("badges", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 40 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  description: varchar("description", { length: 300 }).default("").notNull(),
  icon: varchar("icon", { length: 40 }).default("award").notNull(),
  color: varchar("color", { length: 24 }).default("amber").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const userBadgesTable = pgTable(
  "user_badges",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    badgeId: integer("badge_id").notNull(),
    awardedAt: timestamp("awarded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userIdx: index("user_badges_user_idx").on(t.userId),
    // One row per (user, badge) so auto-award can onConflictDoNothing safely.
    userBadgeUniq: unique("user_badges_user_badge_unique").on(t.userId, t.badgeId),
  }),
);

const safeText = (max: number) =>
  z.string().trim().max(max).regex(/^[^<>]*$/u, "رموز غير مسموح بها");

export const upsertBadgeSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2, "المُعرّف قصير جدًّا")
    .max(40)
    .regex(/^[a-z0-9_-]+$/u, "المُعرّف: أحرف لاتينية صغيرة وأرقام وشَرطات فقط"),
  name: safeText(120).min(2, "الاسم قصير جدًّا"),
  description: safeText(300).default(""),
  icon: safeText(40).default("award"),
  color: safeText(24).default("amber"),
  sortOrder: z.number().int().min(0).max(100000).default(0),
});

export const awardBadgeSchema = z.object({
  userId: z.number().int().positive(),
  badgeId: z.number().int().positive(),
});

export type Badge = typeof badgesTable.$inferSelect;
export type UserBadge = typeof userBadgesTable.$inferSelect;
