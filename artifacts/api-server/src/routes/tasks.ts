/**
 * Island Haven — internal task & communication system (staff-only).
 *
 *   GET    /admin/tasks                    list (+ comment counts + team)
 *   POST   /admin/tasks                    create
 *   GET    /admin/tasks/activity/feed      global activity heartbeat
 *   GET    /admin/tasks/:id/comments       one task + its comments + activity
 *   POST   /admin/tasks/:id/comments       add a comment (logs activity)
 *   PATCH  /admin/tasks/:id                update (logs status/priority/assign)
 *   DELETE /admin/tasks/:id                delete (cascades comments + activity)
 *
 * Drizzle + Postgres; every route behind requireAdmin. Matches adminExtra.ts.
 */
import { Router, type IRouter } from "express";
import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  ihTasksTable,
  ihTaskCommentsTable,
  ihTaskActivityTable,
} from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const TEAM_MEMBERS = [
  "مهنّد جندية",
  "أحمد أشرف",
  "يوسف حلّس",
  "رؤى",
  "م. باسل أبو ندى",
];

const STATUSES = ["backlog", "todo", "in_progress", "review", "done", "cancelled"] as const;
const PRIORITIES = ["urgent", "high", "medium", "low"] as const;

type TaskRow = typeof ihTasksTable.$inferSelect;

/** DB row → API shape (tags comma-string → array). */
function serialize(row: TaskRow) {
  return {
    ...row,
    tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
  };
}

async function logActivity(
  taskId: number,
  actor: string,
  action: string,
  from = "",
  to = "",
) {
  await db.insert(ihTaskActivityTable).values({
    taskId,
    actor: actor.slice(0, 120) || "admin",
    action,
    fromValue: String(from).slice(0, 200),
    toValue: String(to).slice(0, 200),
  });
}

const dueDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .optional();

const createSchema = z.object({
  title: z.string().trim().min(2).max(255),
  description: z.string().max(8000).optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  category: z.string().max(80).optional(),
  assignee: z.string().max(120).optional(),
  dueDate,
  tags: z.array(z.string().max(60)).max(20).optional(),
  createdBy: z.string().max(120).optional(),
});

const patchSchema = z.object({
  title: z.string().trim().min(2).max(255).optional(),
  description: z.string().max(8000).optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  category: z.string().max(80).optional(),
  assignee: z.string().max(120).optional(),
  dueDate,
  tags: z.array(z.string().max(60)).max(20).optional(),
  orderIndex: z.number().int().optional(),
});

// ── GET /admin/tasks ─────────────────────────────────────────────────────────
router.get("/admin/tasks", requireAdmin, async (_req, res) => {
  try {
    const tasks = await db
      .select()
      .from(ihTasksTable)
      .orderBy(asc(ihTasksTable.orderIndex), desc(ihTasksTable.createdAt));

    const ids = tasks.map((t) => t.id);
    const counts = ids.length
      ? await db
          .select({
            taskId: ihTaskCommentsTable.taskId,
            cnt: sql<number>`count(*)::int`,
          })
          .from(ihTaskCommentsTable)
          .where(inArray(ihTaskCommentsTable.taskId, ids))
          .groupBy(ihTaskCommentsTable.taskId)
      : [];
    const countMap = new Map(counts.map((c) => [c.taskId, Number(c.cnt)]));

    return res.json({
      tasks: tasks.map((t) => ({ ...serialize(t), commentCount: countMap.get(t.id) ?? 0 })),
      teamMembers: TEAM_MEMBERS,
    });
  } catch (err) {
    logger.error({ err }, "GET /admin/tasks failed");
    return res.status(500).json({ error: "تعذّر تحميل المهام" });
  }
});

// ── POST /admin/tasks ────────────────────────────────────────────────────────
router.post("/admin/tasks", requireAdmin, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "بيانات غير صحيحة — العنوان مطلوب" });
  }
  try {
    const { tags, dueDate: due, ...rest } = parsed.data;
    const [task] = await db
      .insert(ihTasksTable)
      .values({
        ...rest,
        dueDate: due ?? null,
        tags: (tags ?? []).join(","),
      })
      .returning();

    await logActivity(task.id, task.createdBy, "created", "", task.title);
    return res.status(201).json({ task: serialize(task) });
  } catch (err) {
    logger.error({ err }, "POST /admin/tasks failed");
    return res.status(500).json({ error: "تعذّر إنشاء المهمة" });
  }
});

// ── GET /admin/tasks/activity/feed ───────────────────────────────────────────
// (declared before the parametric routes so "activity" is never read as an :id)
router.get("/admin/tasks/activity/feed", requireAdmin, async (_req, res) => {
  try {
    const feed = await db
      .select({
        id: ihTaskActivityTable.id,
        taskId: ihTaskActivityTable.taskId,
        actor: ihTaskActivityTable.actor,
        action: ihTaskActivityTable.action,
        fromValue: ihTaskActivityTable.fromValue,
        toValue: ihTaskActivityTable.toValue,
        createdAt: ihTaskActivityTable.createdAt,
        taskTitle: ihTasksTable.title,
      })
      .from(ihTaskActivityTable)
      .innerJoin(ihTasksTable, eq(ihTaskActivityTable.taskId, ihTasksTable.id))
      .orderBy(desc(ihTaskActivityTable.createdAt))
      .limit(50);
    return res.json({ feed });
  } catch (err) {
    logger.error({ err }, "GET /admin/tasks/activity/feed failed");
    return res.status(500).json({ error: "تعذّر تحميل النشاط" });
  }
});

// ── GET /admin/tasks/:id/comments ────────────────────────────────────────────
router.get("/admin/tasks/:id/comments", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "معرّف غير صحيح" });
  try {
    const [task] = await db.select().from(ihTasksTable).where(eq(ihTasksTable.id, id));
    if (!task) return res.status(404).json({ error: "المهمة غير موجودة" });

    const [comments, activity] = await Promise.all([
      db
        .select()
        .from(ihTaskCommentsTable)
        .where(eq(ihTaskCommentsTable.taskId, id))
        .orderBy(asc(ihTaskCommentsTable.createdAt)),
      db
        .select()
        .from(ihTaskActivityTable)
        .where(eq(ihTaskActivityTable.taskId, id))
        .orderBy(desc(ihTaskActivityTable.createdAt))
        .limit(30),
    ]);
    return res.json({ task: serialize(task), comments, activity });
  } catch (err) {
    logger.error({ err }, "GET /admin/tasks/:id/comments failed");
    return res.status(500).json({ error: "تعذّر تحميل النقاش" });
  }
});

// ── POST /admin/tasks/:id/comments ───────────────────────────────────────────
router.post("/admin/tasks/:id/comments", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "معرّف غير صحيح" });
  const parsed = z
    .object({ body: z.string().trim().min(1).max(4000), author: z.string().max(120).optional() })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "النص مطلوب" });
  try {
    const [task] = await db.select({ id: ihTasksTable.id }).from(ihTasksTable).where(eq(ihTasksTable.id, id));
    if (!task) return res.status(404).json({ error: "المهمة غير موجودة" });

    const author = parsed.data.author || "admin";
    const [comment] = await db
      .insert(ihTaskCommentsTable)
      .values({ taskId: id, author, body: parsed.data.body })
      .returning();

    await logActivity(id, author, "commented", "", parsed.data.body.slice(0, 100));
    return res.status(201).json({ comment });
  } catch (err) {
    logger.error({ err }, "POST /admin/tasks/:id/comments failed");
    return res.status(500).json({ error: "تعذّر إضافة التعليق" });
  }
});

// ── PATCH /admin/tasks/:id ───────────────────────────────────────────────────
router.patch("/admin/tasks/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "معرّف غير صحيح" });
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  try {
    const [existing] = await db.select().from(ihTasksTable).where(eq(ihTasksTable.id, id));
    if (!existing) return res.status(404).json({ error: "المهمة غير موجودة" });

    const { tags, dueDate: due, ...rest } = parsed.data;
    const update: Partial<typeof ihTasksTable.$inferInsert> = { ...rest, updatedAt: new Date() };
    if (tags !== undefined) update.tags = tags.join(",");
    if (due !== undefined) update.dueDate = due ?? null;

    const actor = "admin";
    const activities: Array<[string, string, string]> = [];
    if (rest.status && rest.status !== existing.status)
      activities.push(["status_changed", existing.status, rest.status]);
    if (rest.priority && rest.priority !== existing.priority)
      activities.push(["priority_changed", existing.priority, rest.priority]);
    if (rest.assignee !== undefined && rest.assignee !== existing.assignee)
      activities.push(["assigned", existing.assignee, rest.assignee]);

    const [task] = await db.update(ihTasksTable).set(update).where(eq(ihTasksTable.id, id)).returning();
    // Log every field change in ONE multi-row insert (was one round-trip per
    // change). Mirrors logActivity's actor/value truncation exactly.
    if (activities.length)
      await db.insert(ihTaskActivityTable).values(
        activities.map(([action, from, to]) => ({
          taskId: id,
          actor: actor.slice(0, 120) || "admin",
          action,
          fromValue: String(from).slice(0, 200),
          toValue: String(to).slice(0, 200),
        })),
      );

    return res.json({ task: serialize(task) });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/tasks/:id failed");
    return res.status(500).json({ error: "تعذّر تحديث المهمة" });
  }
});

// ── DELETE /admin/tasks/:id ──────────────────────────────────────────────────
router.delete("/admin/tasks/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "معرّف غير صحيح" });
  try {
    await db.delete(ihTasksTable).where(eq(ihTasksTable.id, id));
    return res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/tasks/:id failed");
    return res.status(500).json({ error: "تعذّر حذف المهمة" });
  }
});

export default router;
