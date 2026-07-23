import { Router, type IRouter } from "express";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import {
  db,
  venturesTable,
  blogPostsTable,
  dailyPostsTable,
  successStoriesTable,
  teamMembersTable,
  partnersTable,
  investorsTable,
  jobListingsTable,
  rosterMembersTable,
} from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { writeAudit, auditActor } from "../lib/audit";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// The Trash / سلّة المحذوفات — one place to review, restore, or (gated) purge
// soft-deleted rows. Every soft-deletable entity registers its table + the columns
// the Trash needs. Restore is live; permanent purge is DISABLED (403) until the
// owner explicitly enables it, so nothing here can ever lose real data.
interface TrashEntity {
  table: PgTable;
  id: PgColumn;
  name: PgColumn;
  deletedAt: PgColumn;
  label: { ar: string; en: string };
  audit: string; // audit action prefix, e.g. "venture" → "venture_restored"
}

const ENTITIES: Record<string, TrashEntity> = {
  ventures: { table: venturesTable, id: venturesTable.id, name: venturesTable.name, deletedAt: venturesTable.deletedAt, label: { ar: "المشاريع", en: "Ventures" }, audit: "venture" },
  blog: { table: blogPostsTable, id: blogPostsTable.id, name: blogPostsTable.title, deletedAt: blogPostsTable.deletedAt, label: { ar: "المدوّنة", en: "Blog" }, audit: "blog" },
  daily: { table: dailyPostsTable, id: dailyPostsTable.id, name: dailyPostsTable.title, deletedAt: dailyPostsTable.deletedAt, label: { ar: "الفعاليّات", en: "Events" }, audit: "daily" },
  stories: { table: successStoriesTable, id: successStoriesTable.id, name: successStoriesTable.personName, deletedAt: successStoriesTable.deletedAt, label: { ar: "قصص النجاح", en: "Success Stories" }, audit: "story" },
  team: { table: teamMembersTable, id: teamMembersTable.id, name: teamMembersTable.fullName, deletedAt: teamMembersTable.deletedAt, label: { ar: "الفريق", en: "Team" }, audit: "team" },
  partners: { table: partnersTable, id: partnersTable.id, name: partnersTable.name, deletedAt: partnersTable.deletedAt, label: { ar: "الشركاء", en: "Partners" }, audit: "partner" },
  investors: { table: investorsTable, id: investorsTable.id, name: investorsTable.name, deletedAt: investorsTable.deletedAt, label: { ar: "المستثمرون", en: "Investors" }, audit: "investor" },
  jobs: { table: jobListingsTable, id: jobListingsTable.id, name: jobListingsTable.title, deletedAt: jobListingsTable.deletedAt, label: { ar: "الوظائف", en: "Jobs" }, audit: "job" },
  roster: { table: rosterMembersTable, id: rosterMembersTable.id, name: rosterMembersTable.fullName, deletedAt: rosterMembersTable.deletedAt, label: { ar: "سجل المواهب", en: "Talent roster" }, audit: "roster" },
};

// GET /admin/trash — soft-deleted counts per entity (drives the Trash page tabs).
router.get("/admin/trash", requireAdmin, async (_req, res) => {
  try {
    const entities = [];
    for (const [key, e] of Object.entries(ENTITIES)) {
      const [row] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(e.table)
        .where(isNotNull(e.deletedAt));
      entities.push({ entity: key, label: e.label, count: row?.n ?? 0 });
    }
    res.json({ entities });
  } catch (err) {
    logger.error({ err }, "GET /admin/trash failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// GET /admin/trash/:entity — the soft-deleted rows of one entity.
router.get("/admin/trash/:entity", requireAdmin, async (req, res) => {
  const e = ENTITIES[String(req.params.entity)];
  if (!e) {
    res.status(404).json({ error: "كيان غير معروف" });
    return;
  }
  try {
    const items = await db
      .select({ id: e.id, name: e.name, deletedAt: e.deletedAt })
      .from(e.table)
      .where(isNotNull(e.deletedAt))
      .orderBy(desc(e.deletedAt));
    res.json({ items, label: e.label });
  } catch (err) {
    logger.error({ err, entity: req.params.entity }, "GET /admin/trash/:entity failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// POST /admin/trash/:entity/:id/restore — bring a soft-deleted row back.
router.post("/admin/trash/:entity/:id/restore", requireAdmin, async (req, res) => {
  const e = ENTITIES[String(req.params.entity)];
  if (!e) {
    res.status(404).json({ error: "كيان غير معروف" });
    return;
  }
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(404).json({ error: "غير موجود" });
    return;
  }
  try {
    const [row] = await db
      .update(e.table)
      .set({ deletedAt: null } as never)
      .where(and(eq(e.id, id), isNotNull(e.deletedAt)))
      .returning({ id: e.id, name: e.name });
    if (!row) {
      res.status(404).json({ error: "غير موجود في السلّة" });
      return;
    }
    void writeAudit({
      actor: auditActor(req),
      action: `${e.audit}_restored`,
      targetType: e.audit,
      targetId: id,
      newValue: String((row as { name?: unknown }).name ?? ""),
    });
    res.json({ ok: true, item: row });
  } catch (err) {
    logger.error({ err, entity: req.params.entity, id }, "restore failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// DELETE /admin/trash/:entity/:id/purge — PERMANENT delete. Intentionally DISABLED
// (403): the UI shows the button behind a double confirm, but the actual purge is
// gated OFF until the owner explicitly authorises it — no real data can be lost.
router.delete("/admin/trash/:entity/:id/purge", requireAdmin, (_req, res) => {
  res.status(403).json({
    error: "الحذف النهائيّ معطَّل — بانتظار تفعيل صريح من المالك (لا يمكن فقدان بيانات).",
    code: "purge_disabled",
  });
});

export default router;
