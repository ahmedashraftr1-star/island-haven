import {
  pgTable,
  serial,
  timestamp,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { z } from "zod";

// A member's self-reported progress through a course/workshop. One row per
// (user, course) pair — enforced by a unique index so PUT is a true upsert.
// When percent reaches 100 the row's completedAt is stamped, which unlocks a
// printable completion certificate.

export const courseProgressTable = pgTable(
  "course_progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    courseId: integer("course_id").notNull(),
    percent: integer("percent").default(0).notNull(), // 0..100
    completedAt: timestamp("completed_at", { withTimezone: true }), // nullable
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userCourseIdx: uniqueIndex("course_progress_user_course_idx").on(
      t.userId,
      t.courseId,
    ),
  }),
);

export const upsertCourseProgressSchema = z.object({
  courseId: z.number().int().positive(),
  percent: z.number().int().min(0).max(100),
});

export type CourseProgress = typeof courseProgressTable.$inferSelect;
