import { pgTable, serial, integer, timestamp, unique, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { worksTable } from "./works";

// A member's saved/bookmarked works — a private curation list. One row per
// (user, work); both sides cascade so deletes never orphan a bookmark.
export const worksSavesTable = pgTable(
  "works_saves",
  {
    id: serial("id").primaryKey(),
    workId: integer("work_id")
      .notNull()
      .references(() => worksTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqueUserWork: unique("works_saves_user_work_unique").on(t.userId, t.workId),
    workIdx: index("works_saves_work_idx").on(t.workId),
    userIdx: index("works_saves_user_idx").on(t.userId),
  }),
);

export type WorkSave = typeof worksSavesTable.$inferSelect;
