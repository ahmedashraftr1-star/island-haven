import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  date,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Island Haven — internal task & communication system (staff-only).
 *   ih_tasks          — task records (kanban board + list)
 *   ih_task_comments  — threaded discussion per task
 *   ih_task_activity  — immutable audit log (created / status / assign / comment)
 *
 * status:   backlog | todo | in_progress | review | done | cancelled
 * priority: urgent  | high | medium | low
 * (kept as varchar + validated in the route, matching the codebase convention
 *  of not using pgEnum — see bookings/works status columns.)
 */
export const ihTasksTable = pgTable("ih_tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").default("").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("todo"),
  priority: varchar("priority", { length: 12 }).notNull().default("medium"),
  category: varchar("category", { length: 80 }).notNull().default("general"),
  // assigneeId links to a real admin_users account (null = unassigned); the
  // `assignee` string is the denormalised display name kept in sync server-side.
  assigneeId: integer("assignee_id"),
  assignee: varchar("assignee", { length: 120 }).notNull().default(""),
  createdBy: varchar("created_by", { length: 120 }).notNull().default("admin"),
  dueDate: date("due_date"),
  tags: varchar("tags", { length: 500 }).notNull().default(""),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const ihTaskCommentsTable = pgTable("ih_task_comments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id")
    .notNull()
    .references(() => ihTasksTable.id, { onDelete: "cascade" }),
  author: varchar("author", { length: 120 }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const ihTaskActivityTable = pgTable("ih_task_activity", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id")
    .notNull()
    .references(() => ihTasksTable.id, { onDelete: "cascade" }),
  actor: varchar("actor", { length: 120 }).notNull(),
  action: varchar("action", { length: 60 }).notNull(),
  fromValue: varchar("from_value", { length: 200 }).notNull().default(""),
  toValue: varchar("to_value", { length: 200 }).notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Checklist items under a task (Notion-tier subtasks). Cascade-deleted with the
// parent task. `done` toggles; orderIndex keeps them ordered.
export const ihTaskSubtasksTable = pgTable("ih_task_subtasks", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id")
    .notNull()
    .references(() => ihTasksTable.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 300 }).notNull(),
  done: boolean("done").notNull().default(false),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type IhTaskSubtask = typeof ihTaskSubtasksTable.$inferSelect;
