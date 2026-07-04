import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { z } from "zod";

// A mentee's rating + written feedback for a *completed* mentorship session.
// One rating per session (unique on session_id), upserted by the mentee. The
// expertId is denormalized so the public per-expert average is a single, cheap
// aggregate that never has to join back to mentorship_sessions.

export const sessionRatingsTable = pgTable(
  "session_ratings",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id").notNull(),
    menteeId: integer("mentee_id").notNull(),
    expertId: integer("expert_id").notNull(),
    rating: integer("rating").notNull(),
    feedback: text("feedback").default("").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    sessionUniq: uniqueIndex("session_ratings_session_uniq").on(t.sessionId),
    // The experts list computes per-expert `AVG(rating)` + `COUNT(*)` as
    // correlated subqueries (`WHERE expert_id = ?`), one pair per expert row.
    // A composite (expert_id, rating) index answers both from the index alone
    // (index-only scan) — no heap fetch per rating.
    expertRatingIdx: index("session_ratings_expert_rating_idx").on(
      t.expertId,
      t.rating,
    ),
  }),
);

const safeText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .regex(/^[^<>]*$/u, "رموز غير مسموح بها");

// Mentee submits this to rate a completed session.
export const rateSessionSchema = z.object({
  rating: z.number().int().min(1, "اختر تقييمًا").max(5, "أعلى تقييم هو ٥"),
  feedback: safeText(2000).default(""),
});

export type SessionRating = typeof sessionRatingsTable.$inferSelect;
