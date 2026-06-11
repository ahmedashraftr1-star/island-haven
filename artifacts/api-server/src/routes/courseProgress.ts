import { Router, type IRouter, type Request } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  courseProgressTable,
  coursesTable,
  usersTable,
  upsertCourseProgressSchema,
} from "@workspace/db";
import { requireUser, type UserSession } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ─── My course progress (member) ─────────────────────────────────────────────

// The member's progress rows, each joined with its course title/type.
router.get("/me/course-progress", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const rows = await db
      .select({
        id: courseProgressTable.id,
        courseId: courseProgressTable.courseId,
        percent: courseProgressTable.percent,
        completedAt: courseProgressTable.completedAt,
        updatedAt: courseProgressTable.updatedAt,
        courseTitle: coursesTable.title,
        courseType: coursesTable.type,
      })
      .from(courseProgressTable)
      .innerJoin(
        coursesTable,
        eq(coursesTable.id, courseProgressTable.courseId),
      )
      .where(eq(courseProgressTable.userId, session.userId))
      .orderBy(desc(courseProgressTable.updatedAt));
    res.json({ progress: rows });
  } catch (err) {
    logger.error({ err }, "GET /me/course-progress failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// Upsert {courseId, percent}. percent>=100 stamps completedAt (and clears it
// again if a later update drops back below 100).
router.put("/me/course-progress", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const parsed = upsertCourseProgressSchema.safeParse(req.body);
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
    const { courseId, percent } = parsed.data;

    // Guard: the course must exist (and not be a draft) before we track it.
    const [course] = await db
      .select({ id: coursesTable.id, status: coursesTable.status })
      .from(coursesTable)
      .where(eq(coursesTable.id, courseId))
      .limit(1);
    if (!course || course.status === "draft") {
      res.status(404).json({ error: "الدورة غير موجودة" });
      return;
    }

    const now = new Date();
    const completedAt = percent >= 100 ? now : null;

    const [row] = await db
      .insert(courseProgressTable)
      .values({
        userId: session.userId,
        courseId,
        percent,
        completedAt,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [courseProgressTable.userId, courseProgressTable.courseId],
        set: { percent, completedAt, updatedAt: now },
      })
      .returning();
    res.json({ progress: row });
  } catch (err) {
    logger.error({ err }, "PUT /me/course-progress failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Completion certificate (member) ─────────────────────────────────────────

// Returns the certificate payload only when a completed (percent>=100) progress
// row exists for this member + course; otherwise 404.
router.get("/me/certificate/:courseId", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const courseId = Number(req.params.courseId);
    if (!Number.isInteger(courseId) || courseId <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }

    const [row] = await db
      .select({
        percent: courseProgressTable.percent,
        completedAt: courseProgressTable.completedAt,
        courseTitle: coursesTable.title,
        fullName: usersTable.fullName,
      })
      .from(courseProgressTable)
      .innerJoin(
        coursesTable,
        eq(coursesTable.id, courseProgressTable.courseId),
      )
      .innerJoin(usersTable, eq(usersTable.id, courseProgressTable.userId))
      .where(
        and(
          eq(courseProgressTable.userId, session.userId),
          eq(courseProgressTable.courseId, courseId),
        ),
      )
      .limit(1);

    if (!row || row.percent < 100) {
      res.status(404).json({ error: "لم تُكمل هذه الدورة بعد" });
      return;
    }

    res.json({
      course: { title: row.courseTitle },
      user: { fullName: row.fullName },
      completedAt: row.completedAt,
    });
  } catch (err) {
    logger.error({ err }, "GET /me/certificate/:courseId failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
