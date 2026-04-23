import { Router, type IRouter } from "express";
import { desc, eq, sql, gte, and } from "drizzle-orm";
import { bookingsTable, db, insertBookingSchema } from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { z } from "zod";

const router: IRouter = Router();

router.post("/bookings", async (req, res) => {
  const parsed = insertBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      error: "تحقّق من البيانات",
      issues: parsed.error.issues.map(
        (i: { path: PropertyKey[]; message: string }) => ({
          path: i.path.join("."),
          message: i.message,
        }),
      ),
    });
    return;
  }
  const data = parsed.data;
  const [row] = await db
    .insert(bookingsTable)
    .values({
      fullName: data.fullName,
      phone: data.phone,
      email: data.email ?? "",
      visitDate: data.visitDate,
      timeSlot: data.timeSlot,
      purpose: data.purpose,
      attendees: data.attendees,
      notes: data.notes,
    })
    .returning({ id: bookingsTable.id });
  res.json({ ok: true, id: row.id });
});

// Public lightweight stats for landing (capacity indicator).
router.get("/bookings/availability", async (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db
    .select({
      visitDate: bookingsTable.visitDate,
      timeSlot: bookingsTable.timeSlot,
      attendees: sql<number>`coalesce(sum(${bookingsTable.attendees}),0)::int`,
    })
    .from(bookingsTable)
    .where(
      and(
        gte(bookingsTable.visitDate, today),
        sql`${bookingsTable.status} <> 'cancelled'`,
      ),
    )
    .groupBy(bookingsTable.visitDate, bookingsTable.timeSlot);
  res.json({ slots: rows });
});

router.get("/admin/bookings", requireAdmin, async (_req, res) => {
  const rows = await db
    .select()
    .from(bookingsTable)
    .orderBy(desc(bookingsTable.createdAt));
  res.json({ bookings: rows });
});

const updateSchema = z.object({
  status: z
    .enum(["pending", "confirmed", "cancelled", "completed"])
    .optional(),
  adminNotes: z.string().max(4000).optional(),
});

router.patch("/admin/bookings/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات غير صحيحة" });
    return;
  }
  const [row] = await db
    .update(bookingsTable)
    .set(parsed.data)
    .where(eq(bookingsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "غير موجود" });
    return;
  }
  res.json({ booking: row });
});

router.delete("/admin/bookings/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }
  await db.delete(bookingsTable).where(eq(bookingsTable.id, id));
  res.json({ ok: true });
});

router.get("/admin/bookings/stats", requireAdmin, async (_req, res) => {
  const byStatus = await db
    .select({
      status: bookingsTable.status,
      count: sql<number>`count(*)::int`,
    })
    .from(bookingsTable)
    .groupBy(bookingsTable.status);
  const byPurpose = await db
    .select({
      purpose: bookingsTable.purpose,
      count: sql<number>`count(*)::int`,
    })
    .from(bookingsTable)
    .groupBy(bookingsTable.purpose);
  const total = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(bookingsTable);
  res.json({ byStatus, byPurpose, total: total[0]?.n ?? 0 });
});

export default router;
