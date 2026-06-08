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
import { venturesTable } from "./ventures";

// Typed milestones on a venture's timeline — turn a static profile into a
// living story: idea → MVP → first customer → first revenue → funding.
// Optional `amount` for funding rounds (USD), `metricValue` for things like
// MRR or team-size snapshots.

export const VENTURE_MILESTONE_TYPES = [
  "idea",
  "mvp",
  "launch",
  "first_customer",
  "first_revenue",
  "funding",
  "team_grew",
  "press",
  "partnership",
  "other",
] as const;
export type VentureMilestoneType = (typeof VENTURE_MILESTONE_TYPES)[number];

export const ventureMilestonesTable = pgTable(
  "venture_milestones",
  {
    id: serial("id").primaryKey(),
    ventureId: integer("venture_id")
      .notNull()
      .references(() => venturesTable.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body").default("").notNull(),
    type: varchar("type", { length: 32 })
      .notNull()
      .$type<VentureMilestoneType>()
      .default("other"),
    achievedAt: timestamp("achieved_at", { withTimezone: true }).notNull(),
    // Optional structured fields by type. `amount` is for funding rounds (USD or
    // local currency, we leave that to the title). `metricValue` is for snapshots
    // (e.g. MRR=500, team=4). Keep loose to stay flexible.
    amount: integer("amount"),
    metricValue: integer("metric_value"),
    link: text("link").default("").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    ventureIdx: index("venture_milestones_venture_idx").on(t.ventureId),
    achievedAtIdx: index("venture_milestones_achieved_at_idx").on(t.achievedAt),
  }),
);

const safeText = (max: number) =>
  z.string().trim().max(max).regex(/^[^<>]*$/u, "رموز غير مسموح بها");

export const upsertVentureMilestoneSchema = z.object({
  ventureId: z.number().int().positive(),
  title: safeText(200).min(2),
  body: safeText(4000).default(""),
  type: z.enum(VENTURE_MILESTONE_TYPES).default("other"),
  achievedAt: z.string().datetime({ offset: true }),
  amount: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
  metricValue: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
  link: z
    .string()
    .trim()
    .max(800)
    .refine(
      (v) => v === "" || /^https?:\/\//i.test(v),
      "الرابط يجب أن يبدأ بـ http(s)://",
    )
    .default(""),
  sortOrder: z.number().int().min(0).max(100000).default(0),
});

export type VentureMilestone = typeof ventureMilestonesTable.$inferSelect;

export const VENTURE_MILESTONE_TYPE_LABELS: Record<VentureMilestoneType, string> = {
  idea: "الفكرة",
  mvp: "MVP / نموذج أوّليّ",
  launch: "إطلاق",
  first_customer: "أوّل عميل",
  first_revenue: "أوّل إيراد",
  funding: "تمويل",
  team_grew: "نموّ الفريق",
  press: "تغطية إعلاميّة",
  partnership: "شراكة",
  other: "حدث",
};
