import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { z } from "zod";

// Leadership / mentor profiles surfaced on the public /team page. Distinct
// from `experts` (who are bookable mentors with sessions) and `partners`
// (organizations) — these are the humans behind Island Haven itself.

export const TEAM_ROLE_GROUPS = [
  "leadership",
  "mentors",
  "advisors",
  "support",
] as const;
export type TeamRoleGroup = (typeof TEAM_ROLE_GROUPS)[number];

export const TEAM_MEMBER_STATUSES = ["visible", "hidden"] as const;
export type TeamMemberStatus = (typeof TEAM_MEMBER_STATUSES)[number];

export const teamMembersTable = pgTable(
  "team_members",
  {
    id: serial("id").primaryKey(),
    fullName: varchar("full_name", { length: 200 }).notNull(),
    role: varchar("role", { length: 200 }).default("").notNull(),
    bio: varchar("bio", { length: 1200 }).default("").notNull(),
    avatarUrl: text("avatar_url"),
    linkedinUrl: text("linkedin_url").default("").notNull(),
    websiteUrl: text("website_url").default("").notNull(),
    email: varchar("email", { length: 200 }).default("").notNull(),
    group: varchar("group", { length: 20 })
      .notNull()
      .$type<TeamRoleGroup>()
      .default("leadership"),
    featured: boolean("featured").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    status: varchar("status", { length: 16 })
      .notNull()
      .$type<TeamMemberStatus>()
      .default("visible"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    statusIdx: index("team_members_status_idx").on(t.status),
    groupIdx: index("team_members_group_idx").on(t.group),
  }),
);

const safeText = (max: number) =>
  z.string().trim().max(max).regex(/^[^<>]*$/u, "رموز غير مسموح بها");

const httpUrl = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (v) => v === "" || /^https?:\/\//i.test(v),
      "الرابط يجب أن يبدأ بـ http(s)://",
    );

export const upsertTeamMemberSchema = z.object({
  fullName: safeText(200).min(1, "الاسم مطلوب"),
  role: safeText(200).default(""),
  bio: safeText(1200).default(""),
  avatarUrl: z.string().trim().max(800).optional().nullable(),
  linkedinUrl: httpUrl(400).default(""),
  websiteUrl: httpUrl(400).default(""),
  email: z.string().trim().max(200).default(""),
  group: z.enum(TEAM_ROLE_GROUPS).default("leadership"),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(100000).default(0),
  status: z.enum(TEAM_MEMBER_STATUSES).default("visible"),
});

export type TeamMember = typeof teamMembersTable.$inferSelect;

export const TEAM_ROLE_GROUP_LABELS: Record<TeamRoleGroup, string> = {
  leadership: "القيادة",
  mentors: "المرشدون",
  advisors: "المستشارون",
  support: "الدّعم والتشغيل",
};
