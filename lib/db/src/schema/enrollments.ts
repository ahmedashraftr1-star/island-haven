import {
  pgTable,
  serial,
  timestamp,
  varchar,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { coursesTable } from "./courses";

export const ENROLLMENT_STATUSES = [
  "pending",
  "confirmed",
  "cancelled",
] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const enrollmentsTable = pgTable(
  "enrollments",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    courseId: integer("course_id")
      .notNull()
      .references(() => coursesTable.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 16 })
      .notNull()
      .$type<EnrollmentStatus>()
      .default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userIdx: index("enrollments_user_idx").on(t.userId),
    courseIdx: index("enrollments_course_idx").on(t.courseId),
    uniqUserCourse: uniqueIndex("enrollments_user_course_uniq").on(
      t.userId,
      t.courseId,
    ),
  }),
);

export type Enrollment = typeof enrollmentsTable.$inferSelect;

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  pending: "بانتظار التأكيد",
  confirmed: "مؤكَّد",
  cancelled: "ملغى",
};
