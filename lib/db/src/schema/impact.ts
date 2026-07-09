import {
  pgTable,
  serial,
  integer,
  bigint,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Monitoring & Evaluation (M&E) — the outcome layer an incubator lives or dies by.
// The platform already holds OPERATIONAL data (applications, cohorts, ventures);
// this adds longitudinal OUTCOME snapshots per venture so the incubator can prove
// impact over time: jobs created, funding raised, revenue, survival. One row per
// (venture, period) — record a snapshot each quarter/period and the dashboards
// derive funnels, totals, survival rate, and trends from it.
// ─────────────────────────────────────────────────────────────────────────────

export const OUTCOME_STATUSES = ["active", "scaling", "acquired", "closed", "dormant"] as const;
export type OutcomeStatus = (typeof OUTCOME_STATUSES)[number];

// A venture is counted as "surviving" if its latest snapshot is one of these.
export const SURVIVING_STATUSES: OutcomeStatus[] = ["active", "scaling", "acquired"];

export const ventureOutcomesTable = pgTable(
  "venture_outcomes",
  {
    id: serial("id").primaryKey(),
    ventureId: integer("venture_id").notNull(),
    // A label like "2026-Q2" or "2026-06" — the reporting period this snapshot covers.
    period: varchar("period", { length: 16 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().$type<OutcomeStatus>().default("active"),
    // Current headcount employed by the venture at this snapshot.
    jobs: integer("jobs").default(0).notNull(),
    // Cumulative external funding raised to date (whole USD). bigint: a
    // successful portfolio's cumulative funding can exceed the int4 max (~2.1B).
    fundingUsd: bigint("funding_usd", { mode: "number" }).default(0).notNull(),
    // Revenue in the period (whole USD).
    revenueUsd: bigint("revenue_usd", { mode: "number" }).default(0).notNull(),
    note: text("note").default("").notNull(),
    recordedBy: varchar("recorded_by", { length: 120 }).default("").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    ventureIdx: index("venture_outcomes_venture_idx").on(t.ventureId),
    periodIdx: index("venture_outcomes_period_idx").on(t.period),
  }),
);

export const insertVentureOutcomeSchema = z.object({
  period: z
    .string()
    .trim()
    .min(4, "الفترة مطلوبة")
    .max(16)
    .regex(/^[0-9A-Za-z-]+$/u, "صيغة الفترة غير صحيحة"),
  status: z.enum(OUTCOME_STATUSES),
  jobs: z.number().int().min(0).max(1_000_000).optional(),
  fundingUsd: z.number().int().min(0).max(100_000_000_000).optional(),
  revenueUsd: z.number().int().min(0).max(100_000_000_000).optional(),
  note: z.string().max(2000).optional(),
});

export type VentureOutcome = typeof ventureOutcomesTable.$inferSelect;
