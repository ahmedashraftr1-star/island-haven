import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { z } from "zod";

// Applicant review & scoring — the CRM layer over raw applications. Each reviewer
// (admin_users id; 0 = ENV super) leaves ONE review per application: a 1–5 score,
// a recommendation, and notes. The dashboard aggregates these into an average
// score + a recommendation tally so a cohort selection is evidence-based, not a
// single person's gut call.

export const REVIEW_RECOMMENDATIONS = ["advance", "hold", "reject"] as const;
export type ReviewRecommendation = (typeof REVIEW_RECOMMENDATIONS)[number];

export const applicationReviewsTable = pgTable(
  "application_reviews",
  {
    id: serial("id").primaryKey(),
    applicationId: integer("application_id").notNull(),
    reviewerId: integer("reviewer_id").notNull(),
    reviewerName: varchar("reviewer_name", { length: 120 }).default("").notNull(),
    score: integer("score").notNull(), // 1..5
    recommendation: varchar("recommendation", { length: 12 }).notNull().$type<ReviewRecommendation>(),
    notes: text("notes").default("").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    appIdx: index("application_reviews_app_idx").on(t.applicationId),
    // One review per (application, reviewer) — a new one upserts.
    uniq: uniqueIndex("application_reviews_uniq").on(t.applicationId, t.reviewerId),
  }),
);

export const upsertApplicationReviewSchema = z.object({
  score: z.number().int().min(1).max(5),
  recommendation: z.enum(REVIEW_RECOMMENDATIONS),
  notes: z
    .string()
    .trim()
    .max(2000)
    .regex(/^[^<>]*$/u, "رموز غير مسموح بها")
    .optional(),
});

export type ApplicationReview = typeof applicationReviewsTable.$inferSelect;
