import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, seatOverridesTable, SEAT_OVERRIDE_STATES } from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { writeAudit, auditActor } from "../lib/audit";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// The hall has 38 physical seats (matches the shared hall-plan / SeatMap).
const MAX_SEAT = 38;

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/seat-status — PUBLIC. The seats an admin has taken out of the pool
// (disabled / maintenance / manually reserved), so /book AND the homepage preview
// render them unavailable. No personal data — seat number + state only.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/seat-status", async (_req, res) => {
  try {
    const rows = await db
      .select({ seat: seatOverridesTable.seatNumber, state: seatOverridesTable.state })
      .from(seatOverridesTable)
      .orderBy(asc(seatOverridesTable.seatNumber));
    res.json({ blocked: rows });
  } catch (err) {
    logger.error({ err }, "GET /seat-status failed");
    res.json({ blocked: [] }); // never break the booking surface over this
  }
});

// ─── ADMIN — 401 without a valid session (requireAdmin) ───────────────────────
router.get("/admin/seat-overrides", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(seatOverridesTable)
      .orderBy(asc(seatOverridesTable.seatNumber));
    res.json({ overrides: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/seat-overrides failed");
    res.status(500).json({ error: "failed" });
  }
});

const upsertSchema = z.object({
  seatNumber: z.coerce.number().int().min(1).max(MAX_SEAT),
  state: z.enum(SEAT_OVERRIDE_STATES),
  note: z.string().trim().max(500).optional().default(""),
});

// POST /api/admin/seat-overrides — set (or update) a seat's state. Upsert on seat.
router.post("/admin/seat-overrides", requireAdmin, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return void res.status(400).json({ error: "قيمة غير صالحة", issues: parsed.error.flatten().fieldErrors });
  }
  const { seatNumber, state, note } = parsed.data;
  try {
    const [row] = await db
      .insert(seatOverridesTable)
      .values({ seatNumber, state, note, createdBy: auditActor(req) })
      .onConflictDoUpdate({
        target: seatOverridesTable.seatNumber,
        set: { state, note, updatedAt: new Date() },
      })
      .returning();
    void writeAudit({
      actor: auditActor(req),
      action: "seat_override_set",
      targetType: "seat",
      targetId: seatNumber,
      newValue: state,
    });
    res.json({ override: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/seat-overrides failed");
    res.status(500).json({ error: "failed" });
  }
});

// DELETE /api/admin/seat-overrides/:seat — clear a seat's override (back in the pool).
router.delete("/admin/seat-overrides/:seat", requireAdmin, async (req, res) => {
  const seat = parseInt(String(req.params.seat), 10);
  if (!Number.isFinite(seat)) return void res.status(400).json({ error: "bad seat" });
  try {
    const [row] = await db
      .delete(seatOverridesTable)
      .where(eq(seatOverridesTable.seatNumber, seat))
      .returning({ seat: seatOverridesTable.seatNumber });
    if (!row) return void res.status(404).json({ error: "not found" });
    void writeAudit({
      actor: auditActor(req),
      action: "seat_override_cleared",
      targetType: "seat",
      targetId: seat,
    });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/seat-overrides failed");
    res.status(500).json({ error: "failed" });
  }
});

export default router;
