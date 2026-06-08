import { Router, type IRouter, type Request } from "express";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import {
  db,
  coursesTable,
  enrollmentsTable,
  upsertCourseSchema,
  COURSE_TYPES,
  COURSE_STATUSES,
  type CourseType,
  type CourseStatus,
} from "@workspace/db";
import {
  optionalUser,
  requireAdmin,
  requireUser,
  type UserSession,
} from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ─── Public list ────────────────────────────────────────────────────────────

router.get("/courses", async (req, res) => {
  try {
    const type = String(req.query.type ?? "");
    const status = String(req.query.status ?? "");
    const where = [] as ReturnType<typeof eq>[];
    if (COURSE_TYPES.includes(type as CourseType)) {
      where.push(eq(coursesTable.type, type as CourseType));
    }
    // Public never sees drafts — enforce regardless of any user-supplied filter.
    where.push(sql`${coursesTable.status} <> 'draft'` as never);
    if (
      COURSE_STATUSES.includes(status as CourseStatus) &&
      status !== "draft"
    ) {
      where.push(eq(coursesTable.status, status as CourseStatus));
    }
    const rows = await db
      .select({
        id: coursesTable.id,
        type: coursesTable.type,
        title: coursesTable.title,
        summary: coursesTable.summary,
        instructor: coursesTable.instructor,
        coverUrl: coursesTable.coverUrl,
        location: coursesTable.location,
        startsAt: coursesTable.startsAt,
        endsAt: coursesTable.endsAt,
        capacity: coursesTable.capacity,
        status: coursesTable.status,
        enrolled: sql<number>`(SELECT COUNT(*)::int FROM enrollments e WHERE e.course_id = courses.id AND e.status <> 'cancelled')`,
      })
      .from(coursesTable)
      .where(where.length ? and(...where) : undefined)
      .orderBy(
        sql`CASE WHEN ${coursesTable.startsAt} IS NULL THEN 1 ELSE 0 END`,
        asc(coursesTable.startsAt),
        desc(coursesTable.createdAt),
      );
    res.json({ courses: rows });
  } catch (err) {
    logger.error({ err }, "GET /courses failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Public detail (with personal isEnrolled if logged-in) ──────────────────

router.get("/courses/:id", optionalUser, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [course] = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.id, id))
      .limit(1);
    if (!course || course.status === "draft") {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(enrollmentsTable)
      .where(
        and(
          eq(enrollmentsTable.courseId, id),
          sql`${enrollmentsTable.status} <> 'cancelled'`,
        ),
      );
    let isEnrolled = false;
    let myEnrollmentStatus: string | null = null;
    const session = (req as Request & { userSession?: UserSession }).userSession;
    if (session) {
      const [mine] = await db
        .select({ status: enrollmentsTable.status })
        .from(enrollmentsTable)
        .where(
          and(
            eq(enrollmentsTable.courseId, id),
            eq(enrollmentsTable.userId, session.userId),
          ),
        )
        .limit(1);
      if (mine) {
        myEnrollmentStatus = mine.status;
        isEnrolled = mine.status !== "cancelled";
      }
    }
    res.json({
      course: { ...course, enrolled: count },
      isEnrolled,
      myEnrollmentStatus,
    });
  } catch (err) {
    logger.error({ err }, "GET /courses/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Enroll / cancel (user) ─────────────────────────────────────────────────

router.post("/courses/:id/enroll", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const courseId = Number(req.params.id);
    if (!Number.isInteger(courseId) || courseId <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [course] = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.id, courseId))
      .limit(1);
    if (!course || course.status === "draft") {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    if (course.status === "done") {
      res.status(400).json({ error: "هذه الدورة منتهية" });
      return;
    }
    if (course.status !== "open") {
      res.status(400).json({ error: "التسجيل مغلق حاليًا" });
      return;
    }
    // Atomic enrollment: lock the course row, recount inside the transaction,
    // then upsert the enrollment. This prevents overbooking under concurrency.
    let result: { ok: true; status: string } | { full: true } = { full: true };
    await db.transaction(async (tx) => {
      const lockRes = (await tx.execute(
        sql`SELECT capacity FROM ${coursesTable} WHERE id = ${courseId} FOR UPDATE`,
      )) as unknown as { rows: Array<{ capacity: number }> };
      const locked = lockRes.rows[0];
      if (!locked) {
        result = { ok: true, status: "pending" };
        return;
      }
      const [existing] = await tx
        .select()
        .from(enrollmentsTable)
        .where(
          and(
            eq(enrollmentsTable.courseId, courseId),
            eq(enrollmentsTable.userId, session.userId),
          ),
        )
        .limit(1);
      if (existing) {
        if (existing.status === "cancelled") {
          await tx
            .update(enrollmentsTable)
            .set({ status: "pending" })
            .where(eq(enrollmentsTable.id, existing.id));
        }
        result = { ok: true, status: "pending" };
        return;
      }
      if (locked.capacity > 0) {
        const [{ count }] = await tx
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(enrollmentsTable)
          .where(
            and(
              eq(enrollmentsTable.courseId, courseId),
              sql`${enrollmentsTable.status} <> 'cancelled'`,
            ),
          );
        if (count >= locked.capacity) {
          result = { full: true };
          return;
        }
      }
      try {
        await tx
          .insert(enrollmentsTable)
          .values({ userId: session.userId, courseId, status: "pending" });
        result = { ok: true, status: "pending" };
      } catch (err) {
        if (
          typeof err === "object" &&
          err !== null &&
          "cause" in err &&
          ((err as { cause: unknown }).cause as { code?: string })?.code ===
            "23505"
        ) {
          result = { ok: true, status: "pending" };
          return;
        }
        throw err;
      }
    });
    if ("full" in result) {
      res.status(409).json({ error: "اكتمل العدد" });
      return;
    }
    res.json(result);
  } catch (err) {
    logger.error({ err }, "POST /courses/:id/enroll failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/courses/:id/enroll", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const courseId = Number(req.params.id);
    if (!Number.isInteger(courseId) || courseId <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    await db
      .update(enrollmentsTable)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(enrollmentsTable.courseId, courseId),
          eq(enrollmentsTable.userId, session.userId),
        ),
      );
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /courses/:id/enroll failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── My enrollments ─────────────────────────────────────────────────────────

router.get("/courses/me/enrollments", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const rows = await db
      .select({
        course: coursesTable,
        enrollment: enrollmentsTable,
      })
      .from(enrollmentsTable)
      .innerJoin(coursesTable, eq(coursesTable.id, enrollmentsTable.courseId))
      .where(eq(enrollmentsTable.userId, session.userId))
      .orderBy(desc(enrollmentsTable.createdAt));
    res.json({ enrollments: rows });
  } catch (err) {
    logger.error({ err }, "GET /courses/me/enrollments failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Admin: list (incl. drafts), CRUD ───────────────────────────────────────

router.get("/admin/courses", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: coursesTable.id,
        type: coursesTable.type,
        title: coursesTable.title,
        instructor: coursesTable.instructor,
        startsAt: coursesTable.startsAt,
        capacity: coursesTable.capacity,
        status: coursesTable.status,
        createdAt: coursesTable.createdAt,
        enrolled: sql<number>`(SELECT COUNT(*)::int FROM enrollments e WHERE e.course_id = courses.id AND e.status <> 'cancelled')`,
      })
      .from(coursesTable)
      .orderBy(desc(coursesTable.createdAt));
    res.json({ courses: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/courses failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/admin/courses/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [course] = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.id, id))
      .limit(1);
    if (!course) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const enrollments = await db
      .select()
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.courseId, id))
      .orderBy(desc(enrollmentsTable.createdAt));
    res.json({ course, enrollments });
  } catch (err) {
    logger.error({ err }, "GET /admin/courses/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/courses", requireAdmin, async (req, res) => {
  try {
    const parsed = upsertCourseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "بيانات غير صحيحة",
        details: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
      return;
    }
    const data = parsed.data;
    const [row] = await db
      .insert(coursesTable)
      .values({
        type: data.type,
        title: data.title,
        summary: data.summary,
        description: data.description,
        instructor: data.instructor,
        coverUrl: data.coverUrl ?? null,
        location: data.location,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        capacity: data.capacity,
        status: data.status,
      })
      .returning();
    res.json({ course: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/courses failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/courses/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = upsertCourseSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "بيانات غير صحيحة",
        details: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
      return;
    }
    const d = parsed.data;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (d.type !== undefined) update.type = d.type;
    if (d.title !== undefined) update.title = d.title;
    if (d.summary !== undefined) update.summary = d.summary;
    if (d.description !== undefined) update.description = d.description;
    if (d.instructor !== undefined) update.instructor = d.instructor;
    if (d.coverUrl !== undefined) update.coverUrl = d.coverUrl;
    if (d.location !== undefined) update.location = d.location;
    if (d.startsAt !== undefined) {
      update.startsAt = d.startsAt ? new Date(d.startsAt) : null;
    }
    if (d.endsAt !== undefined) {
      update.endsAt = d.endsAt ? new Date(d.endsAt) : null;
    }
    if (d.capacity !== undefined) update.capacity = d.capacity;
    if (d.status !== undefined) update.status = d.status;
    const [row] = await db
      .update(coursesTable)
      .set(update)
      .where(eq(coursesTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ course: row });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/courses/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/courses/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    await db.delete(coursesTable).where(eq(coursesTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/courses/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
