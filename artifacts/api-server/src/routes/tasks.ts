/**
 * Island Haven — internal task & communication system (staff-only).
 *
 *   GET    /admin/tasks                    list (+ comment counts + real team)
 *   POST   /admin/tasks                    create (assign → notify staff)
 *   GET    /admin/tasks/activity/feed      global activity heartbeat
 *   GET    /admin/tasks/:id/comments       one task + comments + activity + subtasks
 *   POST   /admin/tasks/:id/comments       comment (@mentions + assignee → notify)
 *   PATCH  /admin/tasks/:id                update (reassign → notify)
 *   DELETE /admin/tasks/:id                delete (cascades)
 *   POST   /admin/tasks/:id/subtasks       add a checklist item
 *   PATCH  /admin/tasks/:id/subtasks/:sid  toggle / rename a checklist item
 *   DELETE /admin/tasks/:id/subtasks/:sid  remove a checklist item
 *
 * Identity is server-authoritative: the acting admin comes from getAdmin(req),
 * never from the request body (no actor/author/createdBy spoofing). Assignees
 * are real admin_users accounts; assigning / @mentioning / commenting notifies
 * the relevant staff via the admin-notification lane.
 */
import { Router, type IRouter, type Request } from "express";
import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  ihTasksTable,
  ihTaskCommentsTable,
  ihTaskActivityTable,
  ihTaskSubtasksTable,
  adminUsersTable,
} from "@workspace/db";
import { requireAdmin, getAdmin } from "../lib/auth";
import { notifyAdmin, resolveMentionedAdminIds } from "../lib/adminNotify";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const STATUSES = ["backlog", "todo", "in_progress", "review", "done", "cancelled"] as const;
const PRIORITIES = ["urgent", "high", "medium", "low"] as const;

type TaskRow = typeof ihTasksTable.$inferSelect;

/** The acting admin — server-authoritative identity for attribution + notify. */
function actorOf(req: Request): { id: number | null; name: string } {
  const a = getAdmin(req);
  return { id: a?.id ?? null, name: a?.fullName || a?.email || "admin" };
}

/** Active staff accounts — the real assignee/mention source (replaces the old
 *  hardcoded name list). */
async function teamMembers(): Promise<Array<{ id: number; fullName: string }>> {
  return db
    .select({ id: adminUsersTable.id, fullName: adminUsersTable.fullName })
    .from(adminUsersTable)
    .where(eq(adminUsersTable.status, "active"))
    .orderBy(asc(adminUsersTable.fullName));
}

async function assigneeName(assigneeId: number | null | undefined): Promise<string> {
  if (!assigneeId || assigneeId <= 0) return "";
  const [row] = await db
    .select({ fullName: adminUsersTable.fullName })
    .from(adminUsersTable)
    .where(eq(adminUsersTable.id, assigneeId))
    .limit(1);
  return row?.fullName ?? "";
}

/** A regex-valid YYYY-MM-DD that is ALSO a real calendar date (rejects 2026-13-40). */
function isRealDate(s: string): boolean {
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function serialize(row: TaskRow) {
  return { ...row, tags: row.tags ? row.tags.split(",").filter(Boolean) : [] };
}

async function logActivity(taskId: number, actor: string, action: string, from = "", to = "") {
  await db.insert(ihTaskActivityTable).values({
    taskId,
    actor: actor.slice(0, 120) || "admin",
    action,
    fromValue: String(from).slice(0, 200),
    toValue: String(to).slice(0, 200),
  });
}

const dueDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional();
const assigneeId = z.number().int().positive().nullable().optional();

const createSchema = z.object({
  title: z.string().trim().min(2).max(255),
  description: z.string().max(8000).optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  category: z.string().max(80).optional(),
  assigneeId,
  dueDate,
  tags: z.array(z.string().max(60)).max(20).optional(),
});

const patchSchema = z.object({
  title: z.string().trim().min(2).max(255).optional(),
  description: z.string().max(8000).optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  category: z.string().max(80).optional(),
  assigneeId,
  dueDate,
  tags: z.array(z.string().max(60)).max(20).optional(),
  orderIndex: z.number().int().optional(),
});

// ── GET /admin/tasks ─────────────────────────────────────────────────────────
router.get("/admin/tasks", requireAdmin, async (req, res) => {
  try {
    const tasks = await db
      .select()
      .from(ihTasksTable)
      .orderBy(asc(ihTasksTable.orderIndex), desc(ihTasksTable.createdAt));

    const ids = tasks.map((t) => t.id);
    const [counts, done, team] = await Promise.all([
      ids.length
        ? db
            .select({ taskId: ihTaskCommentsTable.taskId, cnt: sql<number>`count(*)::int` })
            .from(ihTaskCommentsTable)
            .where(inArray(ihTaskCommentsTable.taskId, ids))
            .groupBy(ihTaskCommentsTable.taskId)
        : Promise.resolve([]),
      ids.length
        ? db
            .select({
              taskId: ihTaskSubtasksTable.taskId,
              total: sql<number>`count(*)::int`,
              done: sql<number>`count(*) filter (where ${ihTaskSubtasksTable.done})::int`,
            })
            .from(ihTaskSubtasksTable)
            .where(inArray(ihTaskSubtasksTable.taskId, ids))
            .groupBy(ihTaskSubtasksTable.taskId)
        : Promise.resolve([]),
      teamMembers(),
    ]);
    const countMap = new Map(counts.map((c) => [c.taskId, Number(c.cnt)]));
    const subMap = new Map(done.map((d) => [d.taskId, { total: Number(d.total), done: Number(d.done) }]));

    return res.json({
      tasks: tasks.map((t) => ({
        ...serialize(t),
        commentCount: countMap.get(t.id) ?? 0,
        subtasks: subMap.get(t.id) ?? { total: 0, done: 0 },
      })),
      teamMembers: team,
      me: actorOf(req).id,
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
  if (parsed.data.dueDate && !isRealDate(parsed.data.dueDate)) {
    return res.status(400).json({ error: "تاريخ غير صالح" });
  }
  try {
    const actor = actorOf(req);
    const { tags, dueDate: due, assigneeId: aId, ...rest } = parsed.data;
    const aName = await assigneeName(aId);
    const [task] = await db
      .insert(ihTasksTable)
      .values({
        ...rest,
        assigneeId: aId ?? null,
        assignee: aName,
        createdBy: actor.name,
        dueDate: due ?? null,
        tags: (tags ?? []).join(","),
      })
      .returning();

    await logActivity(task.id, actor.name, "created", "", task.title);
    if (aId && aId !== actor.id) {
      void notifyAdmin(aId, {
        type: "task_assigned",
        title: `كُلِّفت بمهمّة: ${task.title}`,
        body: `${actor.name} كلّفك بهذه المهمّة`,
        link: `tasks:${task.id}`,
        actor: actor.name,
      });
    }
    return res.status(201).json({ task: serialize(task) });
  } catch (err) {
    logger.error({ err }, "POST /admin/tasks failed");
    return res.status(500).json({ error: "تعذّر إنشاء المهمة" });
  }
});

// ── GET /admin/tasks/activity/feed ───────────────────────────────────────────
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

    const [comments, activity, subtasks] = await Promise.all([
      db.select().from(ihTaskCommentsTable).where(eq(ihTaskCommentsTable.taskId, id)).orderBy(asc(ihTaskCommentsTable.createdAt)),
      db.select().from(ihTaskActivityTable).where(eq(ihTaskActivityTable.taskId, id)).orderBy(desc(ihTaskActivityTable.createdAt)).limit(30),
      db.select().from(ihTaskSubtasksTable).where(eq(ihTaskSubtasksTable.taskId, id)).orderBy(asc(ihTaskSubtasksTable.orderIndex), asc(ihTaskSubtasksTable.id)),
    ]);
    return res.json({ task: serialize(task), comments, activity, subtasks });
  } catch (err) {
    logger.error({ err }, "GET /admin/tasks/:id/comments failed");
    return res.status(500).json({ error: "تعذّر تحميل النقاش" });
  }
});

// ── POST /admin/tasks/:id/comments ───────────────────────────────────────────
router.post("/admin/tasks/:id/comments", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "معرّف غير صحيح" });
  const parsed = z.object({ body: z.string().trim().min(1).max(4000) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "النص مطلوب" });
  try {
    const [task] = await db.select().from(ihTasksTable).where(eq(ihTasksTable.id, id));
    if (!task) return res.status(404).json({ error: "المهمة غير موجودة" });

    const actor = actorOf(req);
    const body = parsed.data.body;
    const [comment] = await db
      .insert(ihTaskCommentsTable)
      .values({ taskId: id, author: actor.name, body })
      .returning();
    await logActivity(id, actor.name, "commented", "", body.slice(0, 100));

    // @mentions → notify the mentioned staff.
    const mentioned = await resolveMentionedAdminIds(body, actor.id ?? undefined);
    for (const mid of mentioned) {
      void notifyAdmin(mid, {
        type: "task_mention",
        title: `ذكرك ${actor.name} في مهمّة`,
        body: body.slice(0, 120),
        link: `tasks:${id}`,
        actor: actor.name,
      });
    }
    // Notify the assignee of new discussion (unless they wrote it / were mentioned).
    if (task.assigneeId && task.assigneeId !== actor.id && !mentioned.includes(task.assigneeId)) {
      void notifyAdmin(task.assigneeId, {
        type: "task_comment",
        title: `تعليق جديد على: ${task.title}`,
        body: `${actor.name}: ${body.slice(0, 100)}`,
        link: `tasks:${id}`,
        actor: actor.name,
      });
    }
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
  if (parsed.data.dueDate && !isRealDate(parsed.data.dueDate)) {
    return res.status(400).json({ error: "تاريخ غير صالح" });
  }
  try {
    const [existing] = await db.select().from(ihTasksTable).where(eq(ihTasksTable.id, id));
    if (!existing) return res.status(404).json({ error: "المهمة غير موجودة" });

    const actor = actorOf(req);
    const { tags, dueDate: due, assigneeId: aId, ...rest } = parsed.data;
    const update: Partial<typeof ihTasksTable.$inferInsert> = { ...rest, updatedAt: new Date() };
    if (tags !== undefined) update.tags = tags.join(",");
    if (due !== undefined) update.dueDate = due ?? null;

    let reassignedTo: number | null = null;
    if (aId !== undefined && aId !== existing.assigneeId) {
      update.assigneeId = aId ?? null;
      update.assignee = await assigneeName(aId);
      reassignedTo = aId ?? null;
    }

    const activities: Array<[string, string, string]> = [];
    if (rest.status && rest.status !== existing.status) activities.push(["status_changed", existing.status, rest.status]);
    if (rest.priority && rest.priority !== existing.priority) activities.push(["priority_changed", existing.priority, rest.priority]);
    if (reassignedTo !== null || (aId !== undefined && aId !== existing.assigneeId))
      activities.push(["assigned", existing.assignee || "—", update.assignee || "—"]);

    const [task] = await db.update(ihTasksTable).set(update).where(eq(ihTasksTable.id, id)).returning();
    if (activities.length)
      await db.insert(ihTaskActivityTable).values(
        activities.map(([action, from, to]) => ({
          taskId: id,
          actor: actor.name.slice(0, 120) || "admin",
          action,
          fromValue: String(from).slice(0, 200),
          toValue: String(to).slice(0, 200),
        })),
      );

    if (reassignedTo && reassignedTo !== actor.id) {
      void notifyAdmin(reassignedTo, {
        type: "task_assigned",
        title: `كُلِّفت بمهمّة: ${task.title}`,
        body: `${actor.name} كلّفك بهذه المهمّة`,
        link: `tasks:${id}`,
        actor: actor.name,
      });
    }
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

// ── Subtasks (checklist) ─────────────────────────────────────────────────────
router.post("/admin/tasks/:id/subtasks", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "معرّف غير صحيح" });
  const parsed = z.object({ title: z.string().trim().min(1).max(300) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "العنوان مطلوب" });
  try {
    const [task] = await db.select({ id: ihTasksTable.id }).from(ihTasksTable).where(eq(ihTasksTable.id, id));
    if (!task) return res.status(404).json({ error: "المهمة غير موجودة" });
    const [{ n }] = await db
      .select({ n: sql<number>`coalesce(max(${ihTaskSubtasksTable.orderIndex}), -1)::int` })
      .from(ihTaskSubtasksTable)
      .where(eq(ihTaskSubtasksTable.taskId, id));
    const [sub] = await db
      .insert(ihTaskSubtasksTable)
      .values({ taskId: id, title: parsed.data.title, orderIndex: Number(n) + 1 })
      .returning();
    return res.status(201).json({ subtask: sub });
  } catch (err) {
    logger.error({ err }, "POST subtask failed");
    return res.status(500).json({ error: "تعذّر إضافة العنصر" });
  }
});

router.patch("/admin/tasks/:id/subtasks/:sid", requireAdmin, async (req, res) => {
  const sid = Number(req.params.sid);
  if (!Number.isInteger(sid)) return res.status(400).json({ error: "معرّف غير صحيح" });
  const parsed = z.object({ done: z.boolean().optional(), title: z.string().trim().min(1).max(300).optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  try {
    const [sub] = await db
      .update(ihTaskSubtasksTable)
      .set({ ...(parsed.data.done !== undefined ? { done: parsed.data.done } : {}), ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}) })
      .where(eq(ihTaskSubtasksTable.id, sid))
      .returning();
    if (!sub) return res.status(404).json({ error: "غير موجود" });
    return res.json({ subtask: sub });
  } catch (err) {
    logger.error({ err }, "PATCH subtask failed");
    return res.status(500).json({ error: "تعذّر التحديث" });
  }
});

router.delete("/admin/tasks/:id/subtasks/:sid", requireAdmin, async (req, res) => {
  const sid = Number(req.params.sid);
  if (!Number.isInteger(sid)) return res.status(400).json({ error: "معرّف غير صحيح" });
  try {
    await db.delete(ihTaskSubtasksTable).where(eq(ihTaskSubtasksTable.id, sid));
    return res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE subtask failed");
    return res.status(500).json({ error: "تعذّر الحذف" });
  }
});

export default router;
