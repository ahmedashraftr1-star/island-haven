import { pgTable, serial, integer, timestamp, unique, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { worksTable } from "./works";

export const worksLikesTable = pgTable(
  "works_likes",
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
    uniqueUserWork: unique("works_likes_user_work_unique").on(t.userId, t.workId),
    workIdx: index("works_likes_work_idx").on(t.workId),
    userIdx: index("works_likes_user_idx").on(t.userId),
  }),
);
