import { Router, type IRouter, type Request } from "express";
import { and, asc, eq, gte, sql } from "drizzle-orm";
import {
  db,
  expertAvailabilitySlotsTable,
  expertProfilesTable,
  mentorshipSessionsTable,
  upsertSlotSchema,
  slotShape,
  bookSlotSchema,
  usersTable,
} from "@workspace/db";
import { requireAdmin, requireUser, type UserSession } from "../lib/auth";
import { logger } from "../lib/logger";
import { sendEmail, sessionConfirmedEmail } from "../lib/email";

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

function sessionOf(req: Request): UserSession | undefined {
  return (req as Request & { userSession?: UserSession }).userSession;
}

// Public — upcoming available slots for one expert.
router.get("/experts/:id/slots", async (req, res) => {
  try {
    const expertId = Number(req.params.id);
    if (!Number.isInteger(expertId) || expertId <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const rows = await db
      .select()
      .from(expertAvailabilitySlotsTable)
      .where(
        and(
          eq(expertAvailabilitySlotsTable.expertId, expertId),
          eq(expertAvailabilitySlotsTable.status, "available"),
          gte(
            expertAvailabilitySlotsTable.startAt,
            sql`NOW()`,
          ),
        ),
      )
      .orderBy(asc(expertAvailabilitySlotsTable.startAt));
    res.json({ slots: rows });
  } catch (err) {
    logger.error({ err }, "GET /experts/:id/slots failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// Member books a slot. Atomic update: only the first booker wins.
router.post("/slots/:id/book", requireUser, async (req, res) => {
  try {
    const session = sessionOf(req)!;
    const slotId = Number(req.params.id);
    if (!Number.isInteger(slotId) || slotId <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = bookSlotSchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const d = parsed.data;

    const result = await db.transaction(async (tx) => {
      const lockRes = (await tx.execute(
        sql`SELECT id, expert_id, start_at, end_at, mode, status
            FROM ${expertAvailabilitySlotsTable}
            WHERE id = ${slotId} FOR UPDATE`,
      )) as unknown as {
        rows: Array<{
          id: number;
          expert_id: number;
          start_at: Date;
          end_at: Date;
          mode: "online" | "onsite";
          status: string;
        }>;
      };
      const locked = lockRes.rows[0];
      if (!locked) return { notFound: true as const };
      if (locked.status !== "available") return { taken: true as const };
      const [sessionRow] = await tx
        .insert(mentorshipSessionsTable)
        .values({
          expertId: locked.expert_id,
          menteeId: session.userId,
          topic: d.topic,
          message: d.message,
          mode: locked.mode,
          preferredAt: locked.start_at,
          status: "confirmed",
        })
        .returning();
      const [updatedSlot] = await tx
        .update(expertAvailabilitySlotsTable)
        .set({
          status: "booked",
          bookedSessionId: sessionRow.id,
          updatedAt: new Date(),
        })
        .where(eq(expertAvailabilitySlotsTable.id, slotId))
        .returning();
      return { ok: { slot: updatedSlot, session: sessionRow } };
    });

    if ("notFound" in result) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    if ("taken" in result) {
      res.status(409).json({ error: "هذا الموعد حُجِز للتوّ — اختر آخر." });
      return;
    }
    const { slot, session: sessionRow } = result.ok;

    // Best-effort confirmation email (don't block response on this).
    void (async () => {
      try {
        const [user] = await db
          .select({ fullName: usersTable.fullName, email: usersTable.email })
          .from(usersTable)
          .where(eq(usersTable.id, sessionRow.menteeId))
          .limit(1);
        const [expert] = await db
          .select({ fullName: usersTable.fullName })
          .from(expertProfilesTable)
          .innerJoin(usersTable, eq(usersTable.id, expertProfilesTable.userId))
          .where(eq(expertProfilesTable.id, slot.expertId))
          .limit(1);
        if (user && expert) {
          const mail = sessionConfirmedEmail(
            user.fullName,
            expert.fullName,
            d.topic,
          );
          await sendEmail({ to: user.email, ...mail });
        }
      } catch (err) {
        logger.warn({ err }, "send slot confirmation email failed");
      }
    })();

    res.json({ slot, session: sessionRow });
  } catch (err) {
    logger.error({ err }, "POST /slots/:id/book failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Admin ──────────────────────────────────────────────────────────────────

router.get("/admin/slots", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select({
        slot: expertAvailabilitySlotsTable,
        expert: {
          id: expertProfilesTable.id,
          fullName: usersTable.fullName,
        },
      })
      .from(expertAvailabilitySlotsTable)
      .innerJoin(
        expertProfilesTable,
        eq(expertProfilesTable.id, expertAvailabilitySlotsTable.expertId),
      )
      .innerJoin(usersTable, eq(usersTable.id, expertProfilesTable.userId))
      .orderBy(asc(expertAvailabilitySlotsTable.startAt));
    res.json({ slots: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/slots failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/slots", requireAdmin, async (req, res) => {
  try {
    const parsed = upsertSlotSchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const d = parsed.data;
    const [row] = await db
      .insert(expertAvailabilitySlotsTable)
      .values({
        ...d,
        startAt: new Date(d.startAt),
        endAt: new Date(d.endAt),
      })
      .returning();
    res.json({ slot: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/slots failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/slots/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = slotShape.partial().safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const d = parsed.data;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of ["expertId", "mode", "location", "status", "note"] as const) {
      if (d[k] !== undefined) update[k] = d[k];
    }
    if (d.startAt !== undefined) update.startAt = new Date(d.startAt);
    if (d.endAt !== undefined) update.endAt = new Date(d.endAt);
    const [row] = await db
      .update(expertAvailabilitySlotsTable)
      .set(update)
      .where(eq(expertAvailabilitySlotsTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ slot: row });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/slots/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/slots/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    await db
      .delete(expertAvailabilitySlotsTable)
      .where(eq(expertAvailabilitySlotsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/slots/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
