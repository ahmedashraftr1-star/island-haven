import { Router, type IRouter, type Request } from "express";
import { eq, sql } from "drizzle-orm";
import {
  db,
  sessionRatingsTable,
  rateSessionSchema,
  mentorshipSessionsTable,
} from "@workspace/db";
import { requireUser, type UserSession } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function badData(
  res: import("express").Response,
  err: { issues: Array<{ path: PropertyKey[]; message: string }> },
) {
  res.status(400).json({
    error: "بيانات غير صحيحة",
    details: err.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    })),
  });
}

// ─── Member (mentee) ─────────────────────────────────────────────────────────

// Rate a completed session. The caller must be the mentee of that session AND
// the session must be 'completed'. Upserts (one rating per session).
router.post("/me/sessions/:id/rating", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const sessionId = Number(req.params.id);
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }

    const parsed = rateSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const { rating, feedback } = parsed.data;

    // Verify ownership + status straight from the mentorship session row.
    const [ms] = await db
      .select({
        id: mentorshipSessionsTable.id,
        menteeId: mentorshipSessionsTable.menteeId,
        expertId: mentorshipSessionsTable.expertId,
        status: mentorshipSessionsTable.status,
      })
      .from(mentorshipSessionsTable)
      .where(eq(mentorshipSessionsTable.id, sessionId))
      .limit(1);
    if (!ms) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    if (ms.menteeId !== session.userId) {
      res.status(403).json({ error: "غير مصرّح" });
      return;
    }
    if (ms.status !== "completed") {
      res
        .status(400)
        .json({ error: "يمكنك تقييم الجلسات المكتملة فقط" });
      return;
    }

    const [row] = await db
      .insert(sessionRatingsTable)
      .values({
        sessionId,
        menteeId: session.userId,
        expertId: ms.expertId,
        rating,
        feedback,
      })
      .onConflictDoUpdate({
        target: sessionRatingsTable.sessionId,
        set: { rating, feedback, expertId: ms.expertId },
      })
      .returning();
    res.json({ rating: row });
  } catch (err) {
    logger.error({ err }, "POST /me/sessions/:id/rating failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// The caller's existing rating for a session, or null.
router.get("/me/sessions/:id/rating", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const sessionId = Number(req.params.id);
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [row] = await db
      .select()
      .from(sessionRatingsTable)
      .where(eq(sessionRatingsTable.sessionId, sessionId))
      .limit(1);
    if (!row || row.menteeId !== session.userId) {
      res.json({ rating: null });
      return;
    }
    res.json({ rating: row });
  } catch (err) {
    logger.error({ err }, "GET /me/sessions/:id/rating failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Public ──────────────────────────────────────────────────────────────────

// Aggregate rating for an expert: { average: number|null, count: number }.
router.get("/experts/:id/rating", async (req, res) => {
  try {
    const expertId = Number(req.params.id);
    if (!Number.isInteger(expertId) || expertId <= 0) {
      res.json({ average: null, count: 0 });
      return;
    }
    const [agg] = await db
      .select({
        average: sql<number | null>`AVG(${sessionRatingsTable.rating})::float`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(sessionRatingsTable)
      .where(eq(sessionRatingsTable.expertId, expertId));
    const count = agg?.count ?? 0;
    res.json({
      average: count > 0 ? Number(agg.average) : null,
      count,
    });
  } catch (err) {
    logger.error({ err }, "GET /experts/:id/rating failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
