import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { worksTable } from "./works";

export const worksCommentsTable = pgTable(
  "works_comments",
  {
    id: serial("id").primaryKey(),
    workId: integer("work_id")
      .notNull()
      .references(() => worksTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    // One-level threading: a reply points at its top-level parent comment.
    // Deleting a parent cascades to its replies.
    parentId: integer("parent_id").references(
      (): AnyPgColumn => worksCommentsTable.id,
      { onDelete: "cascade" },
    ),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    // Stamped when the author edits the comment; null = never edited.
    editedAt: timestamp("edited_at", { withTimezone: true }),
  },
  (t) => ({
    workIdx: index("works_comments_work_idx").on(t.workId),
    userIdx: index("works_comments_user_idx").on(t.userId),
    parentIdx: index("works_comments_parent_idx").on(t.parentId),
  }),
);
