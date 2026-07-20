import { Router, type IRouter, type Request } from "express";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  seatAssignmentsTable,
  attendanceSessionsTable,
  assignSeatSchema,
  TOTAL_SEATS,
} from "@workspace/db";
import { requireUser, requireAdmin, type UserSession } from "../lib/auth";
import { writeAudit, auditActor } from "../lib/audit";
import { logger } from "../lib/logger";
import { z } from "zod";

const router: IRouter = Router();

// Postgres unique-violation SQLSTATE — used to treat a one-open-per-user /
// one-active-per-seat race as an idempotent no-op or a friendly 409 instead of
// letting drizzle bubble up as a generic 500. Drizzle re-throws as
// DrizzleQueryError and stashes the original pg error on `.cause`, so we walk a
// couple of levels.
const PG_UNIQUE_VIOLATION = "23505";
function isUniqueViolation(err: unknown): boolean {
  let cur: unknown = err;
  for (let i = 0; i < 4 && cur; i++) {
    if (
      typeof cur === "object" &&
      cur !== null &&
      "code" in cur &&
      (cur as { code: unknown }).code === PG_UNIQUE_VIOLATION
    ) {
      return true;
    }
    cur =
      typeof cur === "object" && cur !== null && "cause" in cur
        ? (cur as { cause: unknown }).cause
        : null;
  }
  return false;
}

function toIso(d: Date | null): string | null {
  return d ? d.toISOString() : null;
}

// ─── MEMBER ─────────────────────────────────────────────────────────────────
// The member's own presence + seat. Requires a logged-in user.

// GET /attendance/me — { seat, present, since }
router.get("/attendance/me", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;

    const [seatRow] = await db
      .select({ seatNumber: seatAssignmentsTable.seatNumber })
      .from(seatAssignmentsTable)
      .where(
        and(
          eq(seatAssignmentsTable.userId, session.userId),
          isNull(seatAssignmentsTable.releasedAt),
        ),
      )
      .limit(1);

    const [openSession] = await db
      .select({ checkInAt: attendanceSessionsTable.checkInAt })
      .from(attendanceSessionsTable)
      .where(
        and(
          eq(attendanceSessionsTable.userId, session.userId),
          isNull(attendanceSessionsTable.checkOutAt),
        ),
      )
      .limit(1);

    res.json({
      seat: seatRow?.seatNumber ?? null,
      present: !!openSession,
      since: toIso(openSession?.checkInAt ?? null),
    });
  } catch (err) {
    logger.error({ err }, "GET /attendance/me failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// POST /attendance/check-in — { present: true, since, seat }
// Idempotent: an already-open session is returned as-is. The member's active
// seat is snapshotted onto the new session.
router.post("/attendance/check-in", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;

    // Already present? Return the existing open session (idempotent).
    const [existing] = await db
      .select({
        checkInAt: attendanceSessionsTable.checkInAt,
        seatNumber: attendanceSessionsTable.seatNumber,
      })
      .from(attendanceSessionsTable)
      .where(
        and(
          eq(attendanceSessionsTable.userId, session.userId),
          isNull(attendanceSessionsTable.checkOutAt),
        ),
      )
      .limit(1);
    if (existing) {
      res.json({
        present: true,
        since: existing.checkInAt.toISOString(),
        seat: existing.seatNumber ?? null,
      });
      return;
    }

    // Snapshot the member's current active seat (may be null — a member can
    // check in before an admin assigns them a seat).
    const [seatRow] = await db
      .select({ seatNumber: seatAssignmentsTable.seatNumber })
      .from(seatAssignmentsTable)
      .where(
        and(
          eq(seatAssignmentsTable.userId, session.userId),
          isNull(seatAssignmentsTable.releasedAt),
        ),
      )
      .limit(1);
    const seat = seatRow?.seatNumber ?? null;

    try {
      const [row] = await db
        .insert(attendanceSessionsTable)
        .values({ userId: session.userId, seatNumber: seat })
        .returning({ checkInAt: attendanceSessionsTable.checkInAt });
      res.json({ present: true, since: row!.checkInAt.toISOString(), seat });
    } catch (err) {
      // One-open-per-user unique violation → a concurrent check-in already
      // opened a session. Treat as already present by reading it back.
      if (isUniqueViolation(err)) {
        const [open] = await db
          .select({
            checkInAt: attendanceSessionsTable.checkInAt,
            seatNumber: attendanceSessionsTable.seatNumber,
          })
          .from(attendanceSessionsTable)
          .where(
            and(
              eq(attendanceSessionsTable.userId, session.userId),
              isNull(attendanceSessionsTable.checkOutAt),
            ),
          )
          .limit(1);
        // Report the member's REAL current state. If the racing session was
        // already checked out (read-back empty), we are honestly not present —
        // never fabricate a present-since timestamp.
        if (open) {
          res.json({
            present: true,
            since: open.checkInAt.toISOString(),
            seat: open.seatNumber ?? seat,
          });
        } else {
          res.json({ present: false, since: null, seat });
        }
        return;
      }
      throw err;
    }
  } catch (err) {
    logger.error({ err }, "POST /attendance/check-in failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// POST /attendance/check-out — { present: false }
// Closes the member's open session; a no-op when none is open.
router.post("/attendance/check-out", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    await db
      .update(attendanceSessionsTable)
      .set({ checkOutAt: new Date() })
      .where(
        and(
          eq(attendanceSessionsTable.userId, session.userId),
          isNull(attendanceSessionsTable.checkOutAt),
        ),
      );
    res.json({ present: false });
  } catch (err) {
    logger.error({ err }, "POST /attendance/check-out failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── BOARD ──────────────────────────────────────────────────────────────────
// The live room grid — any logged-in member may view. Occupant identity is
// joined LIVE from usersTable (never duplicated, never invented).

// Build the live seat board: every seat 1..TOTAL_SEATS with its active occupant
// (if any) and whether that occupant currently has an open session. Shared by the
// member endpoint and the admin endpoint so both stay byte-identical.
async function buildBoard() {
  const rows = await db
    .select({
      seatNumber: seatAssignmentsTable.seatNumber,
      occupantId: usersTable.id,
      fullName: usersTable.fullName,
      jobTitle: usersTable.jobTitle,
      skills: usersTable.skills,
      avatarUrl: usersTable.avatarUrl,
      role: usersTable.role,
      checkInAt: attendanceSessionsTable.checkInAt,
    })
    .from(seatAssignmentsTable)
    .innerJoin(usersTable, eq(usersTable.id, seatAssignmentsTable.userId))
    .leftJoin(
      attendanceSessionsTable,
      and(
        eq(attendanceSessionsTable.userId, seatAssignmentsTable.userId),
        isNull(attendanceSessionsTable.checkOutAt),
      ),
    )
    .where(isNull(seatAssignmentsTable.releasedAt));

  const bySeat = new Map<
    number,
    {
      occupant: {
        id: number;
        fullName: string;
        jobTitle: string;
        skills: string;
        avatarUrl: string | null;
        role: string;
      };
      present: boolean;
      since: string | null;
    }
  >();
  for (const r of rows) {
    bySeat.set(r.seatNumber, {
      occupant: {
        id: r.occupantId,
        fullName: r.fullName,
        jobTitle: r.jobTitle,
        skills: r.skills,
        avatarUrl: r.avatarUrl,
        role: r.role,
      },
      present: !!r.checkInAt,
      since: toIso(r.checkInAt),
    });
  }

  const seats = Array.from({ length: TOTAL_SEATS }, (_, i) => {
    const number = i + 1;
    const entry = bySeat.get(number);
    return {
      number,
      present: entry?.present ?? false,
      since: entry?.since ?? null,
      occupant: entry?.occupant ?? null,
    };
  });

  const assignedCount = bySeat.size;
  let presentCount = 0;
  for (const s of seats) if (s.present) presentCount++;

  return { totalSeats: TOTAL_SEATS, presentCount, assignedCount, seats };
}

// GET /attendance/board — for a signed-in member (their live floor view).
router.get("/attendance/board", requireUser, async (_req, res) => {
  try {
    res.json(await buildBoard());
  } catch (err) {
    logger.error({ err }, "GET /attendance/board failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// Throttle repeated board-view audits: the admin panel polls the board every
// ~30s, so we log at most one "viewed" entry per admin per window instead of
// flooding the audit trail with thousands of identical rows.
const BOARD_AUDIT_WINDOW_MS = 10 * 60 * 1000;
const lastBoardAudit = new Map<string, number>();

// GET /admin/attendance/board — same data, but authorised by requireAdmin so the
// seat map loads in a pure admin session (no member cookie needed). Read-only,
// admin-only, and access is audited (throttled). No data is exposed to non-admins.
router.get("/admin/attendance/board", requireAdmin, async (req, res) => {
  try {
    const actor = auditActor(req);
    const key = String(actor ?? "admin");
    const now = Date.now();
    const prev = lastBoardAudit.get(key) ?? 0;
    if (now - prev > BOARD_AUDIT_WINDOW_MS) {
      lastBoardAudit.set(key, now);
      void writeAudit({ actor, action: "attendance_board_viewed", targetType: "attendance" });
    }
    res.json(await buildBoard());
  } catch (err) {
    logger.error({ err }, "GET /admin/attendance/board failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── PUBLIC ─────────────────────────────────────────────────────────────────
// Aggregate-only summary for the homepage. No auth, no names.

// GET /attendance/summary — { totalSeats, assignedCount, presentCount }
router.get("/attendance/summary", async (_req, res) => {
  try {
    const [assigned] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(seatAssignmentsTable)
      .where(isNull(seatAssignmentsTable.releasedAt));
    // Count only open sessions whose member is still active, so the public
    // "present now" matches the board's live semantics (banned/inactive members
    // don't inflate the count). Still just a count — no names, PII-free.
    const [present] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(attendanceSessionsTable)
      .innerJoin(usersTable, eq(usersTable.id, attendanceSessionsTable.userId))
      .where(
        and(
          isNull(attendanceSessionsTable.checkOutAt),
          eq(usersTable.status, "active"),
        ),
      );
    res.json({
      totalSeats: TOTAL_SEATS,
      assignedCount: assigned?.n ?? 0,
      presentCount: present?.n ?? 0,
    });
  } catch (err) {
    logger.error({ err }, "GET /attendance/summary failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── ADMIN ──────────────────────────────────────────────────────────────────

// GET /admin/attendance/members — active users + their current seat.
router.get("/admin/attendance/members", requireAdmin, async (_req, res) => {
  try {
    const members = await db
      .select({
        id: usersTable.id,
        fullName: usersTable.fullName,
        jobTitle: usersTable.jobTitle,
        skills: usersTable.skills,
        avatarUrl: usersTable.avatarUrl,
        role: usersTable.role,
        seatNumber: seatAssignmentsTable.seatNumber,
      })
      .from(usersTable)
      .leftJoin(
        seatAssignmentsTable,
        and(
          eq(seatAssignmentsTable.userId, usersTable.id),
          isNull(seatAssignmentsTable.releasedAt),
        ),
      )
      .where(eq(usersTable.status, "active"))
      .orderBy(asc(usersTable.fullName));
    res.json({ members });
  } catch (err) {
    logger.error({ err }, "GET /admin/attendance/members failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// POST /admin/attendance/assign — atomically move a member onto a seat.
router.post("/admin/attendance/assign", requireAdmin, async (req, res) => {
  const parsed = assignSeatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "بيانات غير صحيحة",
      issues: parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }
  const { seatNumber, userId } = parsed.data;
  try {
    const result = await db.transaction(async (tx) => {
      // (1) Verify the user exists AND is active. (Done first so a
      // missing/inactive user still 404s/400s even on the no-op path below.)
      const [user] = await tx
        .select({ id: usersTable.id, status: usersTable.status })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);
      if (!user) return { kind: "notFound" as const };
      if (user.status !== "active") return { kind: "inactive" as const };

      // (2) No-op short-circuit: if this exact (seat, member) is already the
      // current active assignment, don't release + re-insert — that would reset
      // assignedAt and log a spurious released row for an unchanged pairing.
      const [current] = await tx
        .select({ id: seatAssignmentsTable.id })
        .from(seatAssignmentsTable)
        .where(
          and(
            isNull(seatAssignmentsTable.releasedAt),
            eq(seatAssignmentsTable.seatNumber, seatNumber),
            eq(seatAssignmentsTable.userId, userId),
          ),
        )
        .limit(1);
      if (current) return { kind: "ok" as const };

      // (3) Release any active assignment on this seat OR held by this user, so
      // both the seat and the member end up with a single fresh assignment.
      await tx
        .update(seatAssignmentsTable)
        .set({ releasedAt: new Date() })
        .where(
          and(
            isNull(seatAssignmentsTable.releasedAt),
            sql`(${seatAssignmentsTable.seatNumber} = ${seatNumber} OR ${seatAssignmentsTable.userId} = ${userId})`,
          ),
        );

      // (4) Insert a fresh active assignment.
      await tx
        .insert(seatAssignmentsTable)
        .values({ seatNumber, userId });

      return { kind: "ok" as const };
    });

    if (result.kind === "notFound") {
      res.status(404).json({ error: "العضو غير موجود" });
      return;
    }
    if (result.kind === "inactive") {
      res.status(400).json({ error: "العضو غير مُفعّل" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    // A concurrent assign grabbed the same seat/user between our release and
    // insert → the partial-unique index rejects the duplicate active row.
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: "تعارض — أُسنِد هذا المقعد للتوّ. أعد المحاولة." });
      return;
    }
    logger.error({ err, seatNumber, userId }, "POST /admin/attendance/assign failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// POST /admin/attendance/release — free a seat.
const releaseSchema = z.object({
  seatNumber: z.coerce.number().int().min(1).max(TOTAL_SEATS),
});

router.post("/admin/attendance/release", requireAdmin, async (req, res) => {
  const parsed = releaseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "رقم المقعد غير صحيح" });
    return;
  }
  const { seatNumber } = parsed.data;
  try {
    await db
      .update(seatAssignmentsTable)
      .set({ releasedAt: new Date() })
      .where(
        and(
          isNull(seatAssignmentsTable.releasedAt),
          eq(seatAssignmentsTable.seatNumber, seatNumber),
        ),
      );
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err, seatNumber }, "POST /admin/attendance/release failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
