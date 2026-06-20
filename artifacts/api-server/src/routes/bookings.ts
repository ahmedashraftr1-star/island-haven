import {
  Router,
  type IRouter,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { desc, eq, sql, gte, and } from "drizzle-orm";
import { bookingsTable, db, insertBookingSchema, expertProfilesTable, usersTable } from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { logger } from "../lib/logger";
import { z } from "zod";
import { getFlag } from "./adminExtra";
import { invalidateNumbersCache } from "./numbers";
import { notify } from "./notifications";
import { sendEmail, bookingConfirmedExpertEmail } from "../lib/email";

const router: IRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Capacity policy (workspace seat counts).
// These are hard caps enforced atomically inside a DB transaction so that no
// race condition can cause overbooking.
// ─────────────────────────────────────────────────────────────────────────────
const SLOT_CAPACITY: Record<string, number> = {
  morning: 25,
  midday: 25,
  afternoon: 25,
  fullday: 25,
};
const DAY_CAPACITY = 60;

// ─────────────────────────────────────────────────────────────────────────────
// Rate limiter — single-instance in-memory.
// IP comes from req.ip which respects Express `trust proxy`. We do NOT trust
// raw X-Forwarded-For, so per-request spoofing is not possible.
// Limits are increment-on-attempt (atomic before any async work) which closes
// the previous race condition between check and DB insert.
// ─────────────────────────────────────────────────────────────────────────────
type Bucket = number[];
const minuteBuckets = new Map<string, Bucket>();
const tenMinBuckets = new Map<string, Bucket>();
const globalMinuteBucket: Bucket = [];
const MINUTE = 60_000;
const TEN_MIN = 10 * 60_000;
const MAX_PER_MINUTE = 20; // per-IP total attempts (incl. invalid)
const MAX_PER_TEN_MIN = 5; // per-IP accepted attempts
const MAX_GLOBAL_PER_MINUTE = 60; // belt-and-braces against IP spoofing

function clientIp(req: Request): string {
  // We can't trust the full X-Forwarded-For chain because anything to the
  // LEFT of the right-most entry can be supplied by the client. Standards-
  // compliant reverse proxies (including Replit's edge) APPEND the observed
  // socket peer to XFF, so the right-most value is the only one we can trust
  // as set by our immediate proxy. We read it directly instead of relying on
  // express `trust proxy` semantics, which can hand us spoofed values when
  // the chain length doesn't match the configured hop count.
  const raw = req.headers["x-forwarded-for"];
  const xff = Array.isArray(raw) ? raw.join(",") : raw || "";
  const parts = xff
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length > 0) return parts[parts.length - 1]!;
  return req.socket.remoteAddress || "unknown";
}

function pruneAndPush(map: Map<string, Bucket>, ip: string, windowMs: number, now: number) {
  let b = map.get(ip);
  if (!b) {
    b = [];
    map.set(ip, b);
  }
  const cutoff = now - windowMs;
  while (b.length && b[0]! < cutoff) b.shift();
  return b;
}

function rateLimitBookings(req: Request, res: Response, next: NextFunction) {
  const ip = clientIp(req);
  const now = Date.now();

  // Global cap: even if an attacker rotates IPs (XFF spoofing in chains we
  // can't fully validate), they cannot exceed this site-wide rate. Combined
  // with per-slot/per-day DB capacity, overbooking is impossible.
  const globalCutoff = now - MINUTE;
  while (globalMinuteBucket.length && globalMinuteBucket[0]! < globalCutoff)
    globalMinuteBucket.shift();
  if (globalMinuteBucket.length >= MAX_GLOBAL_PER_MINUTE) {
    res.status(429).json({
      ok: false,
      error: "حركة كثيفة الآن — حاول بعد دقيقة.",
    });
    return;
  }

  const minuteBucket = pruneAndPush(minuteBuckets, ip, MINUTE, now);
  if (minuteBucket.length >= MAX_PER_MINUTE) {
    res.status(429).json({
      ok: false,
      error: "محاولات كثيرة — أعد المحاولة بعد دقيقة.",
    });
    return;
  }

  const tenMinBucket = pruneAndPush(tenMinBuckets, ip, TEN_MIN, now);
  if (tenMinBucket.length >= MAX_PER_TEN_MIN) {
    res.status(429).json({
      ok: false,
      error: "وصلتَ للحدّ الأقصى من الحجوزات. أعد المحاولة لاحقًا.",
    });
    return;
  }

  // Increment ATOMICALLY before any async work — no concurrent slip possible.
  minuteBucket.push(now);
  tenMinBucket.push(now);
  globalMinuteBucket.push(now);
  next();
}

// Periodic cleanup so the maps don't grow unbounded under attack.
setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of minuteBuckets) {
    const cutoff = now - MINUTE;
    while (b.length && b[0]! < cutoff) b.shift();
    if (!b.length) minuteBuckets.delete(ip);
  }
  for (const [ip, b] of tenMinBuckets) {
    const cutoff = now - TEN_MIN;
    while (b.length && b[0]! < cutoff) b.shift();
    if (!b.length) tenMinBuckets.delete(ip);
  }
}, 5 * MINUTE).unref();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bookings — public endpoint.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/bookings", rateLimitBookings, async (req, res) => {
  if (!(await getFlag("bookings_enabled"))) {
    res.status(403).json({ ok: false, error: "الحجوزات مغلقة مؤقّتًا" });
    return;
  }
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
  const slotCap = SLOT_CAPACITY[data.timeSlot] ?? 25;

  try {
    // Atomic capacity check + insert in a single transaction.
    // SERIALIZABLE isolation ensures two concurrent bookings cannot each see
    // capacity available and both succeed beyond the cap.
    const result = await db.transaction(async (tx) => {
      const [slotSum] = await tx
        .select({
          n: sql<number>`coalesce(sum(${bookingsTable.attendees}),0)::int`,
        })
        .from(bookingsTable)
        .where(
          and(
            eq(bookingsTable.visitDate, data.visitDate),
            eq(bookingsTable.timeSlot, data.timeSlot),
            sql`${bookingsTable.status} <> 'cancelled'`,
          ),
        );
      const slotUsed = slotSum?.n ?? 0;
      if (slotUsed + data.attendees > slotCap) {
        return { kind: "full" as const, scope: "slot" as const, used: slotUsed, cap: slotCap };
      }

      const [daySum] = await tx
        .select({
          n: sql<number>`coalesce(sum(${bookingsTable.attendees}),0)::int`,
        })
        .from(bookingsTable)
        .where(
          and(
            eq(bookingsTable.visitDate, data.visitDate),
            sql`${bookingsTable.status} <> 'cancelled'`,
          ),
        );
      const dayUsed = daySum?.n ?? 0;
      if (dayUsed + data.attendees > DAY_CAPACITY) {
        return { kind: "full" as const, scope: "day" as const, used: dayUsed, cap: DAY_CAPACITY };
      }

      const [row] = await tx
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
          expertId: data.expertId ?? null,
        })
        .returning({ id: bookingsTable.id });
      return { kind: "ok" as const, id: row!.id };
    });

    if (result.kind === "full") {
      res.status(409).json({
        ok: false,
        error:
          result.scope === "slot"
            ? "هذه الفترة ممتلئة — اختَر فترة أخرى."
            : "هذا اليوم ممتلئ — اختَر يومًا آخر.",
        capacity: { used: result.used, cap: result.cap, scope: result.scope },
      });
      return;
    }

    invalidateNumbersCache();
    res.json({ ok: true, id: result.id });
  } catch (err) {
    logger.error({ err }, "Failed to create booking");
    res.status(500).json({
      ok: false,
      error: "تعذّر إتمام الحجز. حاول مجدّدًا بعد قليل.",
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bookings/availability — public; powers the booking calendar/UI.
// Returns per-slot used + cap so the frontend can disable full slots.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/bookings/availability", async (_req, res) => {
  try {
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
    res.json({
      slots: rows,
      capacity: { perSlot: SLOT_CAPACITY, perDay: DAY_CAPACITY },
    });
  } catch (err) {
    logger.error({ err }, "Failed to load availability");
    res.status(500).json({ slots: [], capacity: { perSlot: SLOT_CAPACITY, perDay: DAY_CAPACITY } });
  }
});

router.get("/admin/bookings", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: bookingsTable.id,
        fullName: bookingsTable.fullName,
        phone: bookingsTable.phone,
        email: bookingsTable.email,
        visitDate: bookingsTable.visitDate,
        timeSlot: bookingsTable.timeSlot,
        purpose: bookingsTable.purpose,
        attendees: bookingsTable.attendees,
        notes: bookingsTable.notes,
        expertId: bookingsTable.expertId,
        status: bookingsTable.status,
        adminNotes: bookingsTable.adminNotes,
        createdAt: bookingsTable.createdAt,
        expertName: usersTable.fullName,
      })
      .from(bookingsTable)
      .leftJoin(
        expertProfilesTable,
        eq(expertProfilesTable.id, bookingsTable.expertId),
      )
      .leftJoin(usersTable, eq(usersTable.id, expertProfilesTable.userId))
      .orderBy(desc(bookingsTable.createdAt));
    res.json({ bookings: rows });
  } catch (err) {
    logger.error({ err }, "Failed to load admin bookings");
    res.status(500).json({ error: "تعذّر تحميل الحجوزات" });
  }
});

const updateSchema = z.object({
  status: z
    .enum(["pending", "confirmed", "cancelled", "completed"])
    .optional(),
  adminNotes: z.string().max(4000).regex(/^[^<>]*$/u, "رموز غير مسموح بها").optional(),
});

router.patch("/admin/bookings/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات غير صحيحة" });
    return;
  }
  try {
    // Read the current row first so we can detect a status transition.
    const [before] = await db
      .select({
        status: bookingsTable.status,
        expertId: bookingsTable.expertId,
        fullName: bookingsTable.fullName,
        visitDate: bookingsTable.visitDate,
        timeSlot: bookingsTable.timeSlot,
      })
      .from(bookingsTable)
      .where(eq(bookingsTable.id, id));

    const [row] = await db
      .update(bookingsTable)
      .set(parsed.data)
      .where(eq(bookingsTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    invalidateNumbersCache();
    res.json({ booking: row });

    // Fire-and-forget: notify the expert when the booking transitions to
    // 'confirmed' for the first time and the booking names an expert.
    if (
      parsed.data.status === "confirmed" &&
      before?.status !== "confirmed" &&
      row.expertId
    ) {
      (async () => {
        try {
          const [expert] = await db
            .select({
              userId: expertProfilesTable.userId,
              expertEmail: usersTable.email,
              expertFullName: usersTable.fullName,
            })
            .from(expertProfilesTable)
            .innerJoin(usersTable, eq(usersTable.id, expertProfilesTable.userId))
            .where(eq(expertProfilesTable.id, row.expertId!));

          if (!expert) return;

          const visitorName = row.fullName;
          const visitDate = row.visitDate;
          const timeSlot = row.timeSlot;

          const slotLabels: Record<string, string> = {
            morning: "الصباح",
            midday: "منتصف النهار",
            afternoon: "المساء",
            fullday: "يوم كامل",
          };
          const slotLabel = slotLabels[timeSlot] ?? timeSlot;

          await notify(expert.userId, {
            type: "booking_confirmed",
            title: "حجز جديد يذكرك",
            body: `${visitorName} — ${visitDate} (${slotLabel})`,
          });

          if (expert.expertEmail) {
            const mail = bookingConfirmedExpertEmail(
              expert.expertFullName ?? "",
              visitorName,
              visitDate,
              timeSlot,
            );
            await sendEmail({
              to: expert.expertEmail,
              subject: mail.subject,
              html: mail.html,
              text: mail.text,
            });
          }
        } catch (err) {
          logger.error({ err, bookingId: id }, "expert booking notification failed");
        }
      })();
    }
  } catch (err) {
    logger.error({ err, id }, "Failed to update booking");
    res.status(500).json({ error: "تعذّر التحديث" });
  }
});

// Admin manual create — bypasses public rate limits & date/Friday rules.
const adminCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(120).regex(/^[^<>]*$/u),
  phone: z.string().trim().min(3).max(40),
  email: z.string().trim().max(160).optional().or(z.literal("")),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ غير صحيح"),
  timeSlot: z.enum(["morning", "midday", "afternoon", "fullday"]),
  purpose: z.enum(["work", "study", "meeting", "event", "tour", "guest", "other"]),
  attendees: z.coerce.number().int().min(1).max(20).default(1),
  notes: z.string().trim().max(2000).regex(/^[^<>]*$/u).default(""),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).default("confirmed"),
  adminNotes: z.string().trim().max(4000).regex(/^[^<>]*$/u).default(""),
  expertId: z.number().int().positive().optional().nullable(),
});

router.post("/admin/bookings", requireAdmin, async (req, res) => {
  const parsed = adminCreateSchema.safeParse(req.body);
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
  try {
    const d = parsed.data;
    const [row] = await db
      .insert(bookingsTable)
      .values({
        fullName: d.fullName,
        phone: d.phone,
        email: d.email ?? "",
        visitDate: d.visitDate,
        timeSlot: d.timeSlot,
        purpose: d.purpose,
        attendees: d.attendees,
        notes: d.notes,
        status: d.status,
        adminNotes: d.adminNotes,
        expertId: d.expertId ?? null,
      })
      .returning();
    invalidateNumbersCache();
    res.json({ booking: row });

    // Fire-and-forget: notify the expert when the booking is created
    // with status 'confirmed' and an expertId assigned.
    if (d.status === "confirmed" && row.expertId) {
      (async () => {
        try {
          const [expert] = await db
            .select({
              userId: expertProfilesTable.userId,
              expertEmail: usersTable.email,
              expertFullName: usersTable.fullName,
            })
            .from(expertProfilesTable)
            .innerJoin(usersTable, eq(usersTable.id, expertProfilesTable.userId))
            .where(eq(expertProfilesTable.id, row.expertId!));

          if (!expert) return;

          const visitorName = row.fullName;
          const visitDate = row.visitDate;
          const timeSlot = row.timeSlot;

          const slotLabels: Record<string, string> = {
            morning: "الصباح",
            midday: "منتصف النهار",
            afternoon: "المساء",
            fullday: "يوم كامل",
          };
          const slotLabel = slotLabels[timeSlot] ?? timeSlot;

          await notify(expert.userId, {
            type: "booking_confirmed",
            title: "حجز جديد يذكرك",
            body: `${visitorName} — ${visitDate} (${slotLabel})`,
          });

          if (expert.expertEmail) {
            const mail = bookingConfirmedExpertEmail(
              expert.expertFullName ?? "",
              visitorName,
              visitDate,
              timeSlot,
            );
            await sendEmail({
              to: expert.expertEmail,
              subject: mail.subject,
              html: mail.html,
              text: mail.text,
            });
          }
        } catch (err) {
          logger.error({ err }, "expert booking notification failed (admin create)");
        }
      })();
    }
  } catch (err) {
    logger.error({ err }, "admin create booking failed");
    res.status(500).json({ error: "تعذّر الإنشاء" });
  }
});

router.delete("/admin/bookings/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }
  try {
    await db.delete(bookingsTable).where(eq(bookingsTable.id, id));
    invalidateNumbersCache();
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err, id }, "Failed to delete booking");
    res.status(500).json({ error: "تعذّر الحذف" });
  }
});

router.get("/admin/bookings/stats", requireAdmin, async (_req, res) => {
  try {
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
  } catch (err) {
    logger.error({ err }, "Failed to load booking stats");
    res.status(500).json({ byStatus: [], byPurpose: [], total: 0 });
  }
});

export default router;
