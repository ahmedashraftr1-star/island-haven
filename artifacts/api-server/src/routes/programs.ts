import { Router, type IRouter, type Request } from "express";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import {
  db,
  programsTable,
  programApplicationsTable,
  usersTable,
  upsertProgramSchema,
  applyProgramSchema,
  PROGRAM_APPLICATION_STATUSES,
  type ProgramApplicationStatus,
} from "@workspace/db";
import {
  optionalUser,
  requireAdmin,
  requireUser,
  type UserSession,
} from "../lib/auth";
import { logger } from "../lib/logger";
import { sendEmail, programAcceptedEmail } from "../lib/email";
import { notify } from "./notifications";
import { prefAllows } from "./notificationPrefs";

const router: IRouter = Router();

function sessionOf(req: Request): UserSession | undefined {
  return (req as Request & { userSession?: UserSession }).userSession;
}

function badData(res: import("express").Response, err: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  res.status(400).json({
    error: "بيانات غير صحيحة",
    details: err.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    })),
  });
}

// ─── Public ──────────────────────────────────────────────────────────────────

router.get("/programs", async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: programsTable.id,
        title: programsTable.title,
        summary: programsTable.summary,
        coverUrl: programsTable.coverUrl,
        durationWeeks: programsTable.durationWeeks,
        seats: programsTable.seats,
        tags: programsTable.tags,
        startsAt: programsTable.startsAt,
        applyDeadline: programsTable.applyDeadline,
        status: programsTable.status,
        applicants: sql<number>`COALESCE(COUNT(pa.id), 0)::int`,
      })
      .from(programsTable)
      .leftJoin(
        sql`program_applications pa`,
        sql`pa.program_id = ${programsTable.id}`,
      )
      .where(sql`${programsTable.status} <> 'draft'`)
      .groupBy(programsTable.id)
      .orderBy(asc(programsTable.sortOrder), desc(programsTable.createdAt));
    res.json({ programs: rows });
  } catch (err) {
    logger.error({ err }, "GET /programs failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/programs/:id", optionalUser, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [program] = await db
      .select()
      .from(programsTable)
      .where(eq(programsTable.id, id))
      .limit(1);
    if (!program || program.status === "draft") {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    let hasApplied = false;
    let myStatus: string | null = null;
    const session = sessionOf(req);
    if (session) {
      const [mine] = await db
        .select({ status: programApplicationsTable.status })
        .from(programApplicationsTable)
        .where(
          and(
            eq(programApplicationsTable.programId, id),
            eq(programApplicationsTable.userId, session.userId),
          ),
        )
        .limit(1);
      if (mine) {
        hasApplied = true;
        myStatus = mine.status;
      }
    }
    res.json({ program, hasApplied, myStatus });
  } catch (err) {
    logger.error({ err }, "GET /programs/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Apply (member) ──────────────────────────────────────────────────────────

router.post("/programs/:id/apply", requireUser, async (req, res) => {
  try {
    const session = sessionOf(req)!;
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [program] = await db
      .select()
      .from(programsTable)
      .where(eq(programsTable.id, id))
      .limit(1);
    if (!program || program.status === "draft") {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    if (program.status !== "open") {
      res.status(400).json({ error: "التقديم مغلق حاليًا" });
      return;
    }
    const parsed = applyProgramSchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const d = parsed.data;
    try {
      const [row] = await db
        .insert(programApplicationsTable)
        .values({
          programId: id,
          userId: session.userId,
          ventureName: d.ventureName,
          idea: d.idea,
          motivation: d.motivation,
          status: "new",
        })
        .returning();
      res.json({ application: row });
    } catch (err) {
      // unique (user, program) violation → already applied
      if (
        typeof err === "object" &&
        err !== null &&
        "cause" in err &&
        ((err as { cause: unknown }).cause as { code?: string })?.code ===
          "23505"
      ) {
        res.status(409).json({ error: "لقد قدّمت على هذا البرنامج مسبقًا" });
        return;
      }
      throw err;
    }
  } catch (err) {
    logger.error({ err }, "POST /programs/:id/apply failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Admin ───────────────────────────────────────────────────────────────────

router.get("/admin/programs", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: programsTable.id,
        title: programsTable.title,
        status: programsTable.status,
        seats: programsTable.seats,
        startsAt: programsTable.startsAt,
        sortOrder: programsTable.sortOrder,
        createdAt: programsTable.createdAt,
        applicants: sql<number>`(SELECT COUNT(*)::int FROM program_applications pa WHERE pa.program_id = programs.id)`,
      })
      .from(programsTable)
      .orderBy(asc(programsTable.sortOrder), desc(programsTable.createdAt));
    res.json({ programs: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/programs failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/admin/programs/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [program] = await db
      .select()
      .from(programsTable)
      .where(eq(programsTable.id, id))
      .limit(1);
    if (!program) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const applications = await db
      .select({
        application: programApplicationsTable,
        applicantName: usersTable.fullName,
        applicantEmail: usersTable.email,
      })
      .from(programApplicationsTable)
      .innerJoin(
        usersTable,
        eq(usersTable.id, programApplicationsTable.userId),
      )
      .where(eq(programApplicationsTable.programId, id))
      .orderBy(desc(programApplicationsTable.createdAt));
    res.json({ program, applications });
  } catch (err) {
    logger.error({ err }, "GET /admin/programs/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/programs", requireAdmin, async (req, res) => {
  try {
    const parsed = upsertProgramSchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const d = parsed.data;
    const [row] = await db
      .insert(programsTable)
      .values({
        title: d.title,
        summary: d.summary,
        description: d.description,
        coverUrl: d.coverUrl ?? null,
        durationWeeks: d.durationWeeks,
        seats: d.seats,
        perks: d.perks,
        tags: d.tags,
        startsAt: d.startsAt ? new Date(d.startsAt) : null,
        applyDeadline: d.applyDeadline ? new Date(d.applyDeadline) : null,
        status: d.status,
        sortOrder: d.sortOrder,
      })
      .returning();
    res.json({ program: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/programs failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/programs/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = upsertProgramSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const d = parsed.data;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of [
      "title",
      "summary",
      "description",
      "durationWeeks",
      "seats",
      "perks",
      "tags",
      "status",
      "sortOrder",
    ] as const) {
      if (d[k] !== undefined) update[k] = d[k];
    }
    if (d.coverUrl !== undefined) update.coverUrl = d.coverUrl;
    if (d.startsAt !== undefined)
      update.startsAt = d.startsAt ? new Date(d.startsAt) : null;
    if (d.applyDeadline !== undefined)
      update.applyDeadline = d.applyDeadline ? new Date(d.applyDeadline) : null;
    const [row] = await db
      .update(programsTable)
      .set(update)
      .where(eq(programsTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ program: row });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/programs/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/programs/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    await db.delete(programsTable).where(eq(programsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/programs/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch(
  "/admin/program-applications/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(404).json({ error: "غير موجود" });
        return;
      }
      const status = String(req.body?.status ?? "");
      if (
        !(PROGRAM_APPLICATION_STATUSES as readonly string[]).includes(status)
      ) {
        res.status(400).json({ error: "حالة غير صحيحة" });
        return;
      }
      const notes =
        typeof req.body?.notes === "string"
          ? req.body.notes.slice(0, 2000)
          : undefined;
      const [row] = await db
        .update(programApplicationsTable)
        .set({
          status: status as ProgramApplicationStatus,
          ...(notes !== undefined ? { notes } : {}),
        })
        .where(eq(programApplicationsTable.id, id))
        .returning();
      if (!row) {
        res.status(404).json({ error: "غير موجود" });
        return;
      }
      // Congratulate the applicant by email the moment they're accepted.
      if (row.status === "accepted") {
        const [u] = await db
          .select({ email: usersTable.email, fullName: usersTable.fullName })
          .from(usersTable)
          .where(eq(usersTable.id, row.userId))
          .limit(1);
        const [p] = await db
          .select({ title: programsTable.title })
          .from(programsTable)
          .where(eq(programsTable.id, row.programId))
          .limit(1);
        if (u && p) {
          const mail = programAcceptedEmail(u.fullName, p.title);
          if (await prefAllows(row.userId, "emailPrograms")) {
            void sendEmail({ to: u.email, ...mail });
          }
          void notify(row.userId, {
            type: "program_accepted",
            title: "تمّ قبولك في البرنامج 🎉",
            body: `قُبِل طلبك للانضمام إلى «${p.title}».`,
            link: `/programs/${row.programId}`,
          });
        }
      }
      res.json({ application: row });
    } catch (err) {
      logger.error({ err }, "PATCH /admin/program-applications/:id failed");
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  },
);

export default router;
