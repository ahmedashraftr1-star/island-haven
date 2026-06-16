import { Router, type IRouter, type Request } from "express";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import bcrypt from "bcryptjs";
import {
  db,
  usersTable,
  expertProfilesTable,
  mentorshipSessionsTable,
  expertProfileSchema,
  adminExpertProfileSchema,
  createExpertSchema,
  requestSessionSchema,
  SESSION_STATUSES,
  type SessionStatus,
} from "@workspace/db";
import {
  requireAdmin,
  requireUser,
  type UserSession,
} from "../lib/auth";
import { logger } from "../lib/logger";
import { sendEmail, sessionConfirmedEmail } from "../lib/email";
import { notify } from "./notifications";
import { prefAllows } from "./notificationPrefs";

const router: IRouter = Router();

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

function sessionOf(req: Request): UserSession | undefined {
  return (req as Request & { userSession?: UserSession }).userSession;
}

// Columns of a public expert card (joins the user's display fields).
const expertCardSelect = {
  id: expertProfilesTable.id,
  userId: expertProfilesTable.userId,
  fullName: usersTable.fullName,
  avatarUrl: usersTable.avatarUrl,
  headline: expertProfilesTable.headline,
  expertise: expertProfilesTable.expertise,
  bio: expertProfilesTable.bio,
  yearsExperience: expertProfilesTable.yearsExperience,
  languages: expertProfilesTable.languages,
  sessionMinutes: expertProfilesTable.sessionMinutes,
  availabilityNote: expertProfilesTable.availabilityNote,
  acceptingSessions: expertProfilesTable.acceptingSessions,
  featured: expertProfilesTable.featured,
  linkedinUrl: expertProfilesTable.linkedinUrl,
  websiteUrl: expertProfilesTable.websiteUrl,
  status: expertProfilesTable.status,
  createdAt: expertProfilesTable.createdAt,
};

// ─── Public: list active experts ─────────────────────────────────────────────

router.get("/experts", async (_req, res) => {
  try {
    const rows = await db
      .select(expertCardSelect)
      .from(expertProfilesTable)
      .innerJoin(usersTable, eq(usersTable.id, expertProfilesTable.userId))
      .where(
        and(
          eq(expertProfilesTable.status, "active"),
          eq(usersTable.status, "active"),
        ),
      )
      .orderBy(
        desc(expertProfilesTable.featured),
        asc(expertProfilesTable.sortOrder),
        desc(expertProfilesTable.createdAt),
      );
    res.json({ experts: rows });
  } catch (err) {
    logger.error({ err }, "GET /experts failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Public: expert detail ───────────────────────────────────────────────────

router.get("/experts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [expert] = await db
      .select(expertCardSelect)
      .from(expertProfilesTable)
      .innerJoin(usersTable, eq(usersTable.id, expertProfilesTable.userId))
      .where(eq(expertProfilesTable.id, id))
      .limit(1);
    if (!expert || expert.status !== "active") {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ expert });
  } catch (err) {
    logger.error({ err }, "GET /experts/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Expert self-management ──────────────────────────────────────────────────
// Resolve the expert profile owned by the logged-in user, or null.

async function myExpertProfile(userId: number) {
  const [row] = await db
    .select()
    .from(expertProfilesTable)
    .where(eq(expertProfilesTable.userId, userId))
    .limit(1);
  return row ?? null;
}

// Fire-and-forget: email the mentee when their session is confirmed.
async function notifySessionConfirmed(row: {
  menteeId: number;
  expertId: number;
  topic: string;
  status: string;
}) {
  try {
    if (row.status !== "confirmed") return;
    const [mentee] = await db
      .select({ email: usersTable.email, fullName: usersTable.fullName })
      .from(usersTable)
      .where(eq(usersTable.id, row.menteeId))
      .limit(1);
    const [expert] = await db
      .select({ fullName: usersTable.fullName })
      .from(expertProfilesTable)
      .innerJoin(usersTable, eq(usersTable.id, expertProfilesTable.userId))
      .where(eq(expertProfilesTable.id, row.expertId))
      .limit(1);
    if (mentee && expert) {
      const mail = sessionConfirmedEmail(
        mentee.fullName,
        expert.fullName,
        row.topic,
      );
      if (await prefAllows(row.menteeId, "emailSessions")) {
        void sendEmail({ to: mentee.email, ...mail });
      }
      void notify(row.menteeId, {
        type: "session_confirmed",
        title: "تأكّدت جلسة الإرشاد ✅",
        body: `أكّد ${expert.fullName} جلسة «${row.topic}».`,
        link: "/profile",
      });
    }
  } catch (err) {
    logger.error({ err }, "notifySessionConfirmed failed");
  }
}

router.get("/experts/me/profile", requireUser, async (req, res) => {
  try {
    const session = sessionOf(req)!;
    const profile = await myExpertProfile(session.userId);
    if (!profile) {
      res.status(404).json({ error: "لست خبيرًا مسجَّلًا" });
      return;
    }
    res.json({ profile });
  } catch (err) {
    logger.error({ err }, "GET /experts/me/profile failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/experts/me/profile", requireUser, async (req, res) => {
  try {
    const session = sessionOf(req)!;
    const profile = await myExpertProfile(session.userId);
    if (!profile) {
      res.status(404).json({ error: "لست خبيرًا مسجَّلًا" });
      return;
    }
    const parsed = expertProfileSchema.partial().safeParse(req.body);
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
    const [row] = await db
      .update(expertProfilesTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(expertProfilesTable.id, profile.id))
      .returning();
    res.json({ profile: row });
  } catch (err) {
    logger.error({ err }, "PATCH /experts/me/profile failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// Sessions addressed to the logged-in expert.
router.get("/experts/me/sessions", requireUser, async (req, res) => {
  try {
    const session = sessionOf(req)!;
    const profile = await myExpertProfile(session.userId);
    if (!profile) {
      res.status(404).json({ error: "لست خبيرًا مسجَّلًا" });
      return;
    }
    const rows = await db
      .select({
        session: mentorshipSessionsTable,
        menteeName: usersTable.fullName,
        menteeAvatar: usersTable.avatarUrl,
      })
      .from(mentorshipSessionsTable)
      .innerJoin(
        usersTable,
        eq(usersTable.id, mentorshipSessionsTable.menteeId),
      )
      .where(eq(mentorshipSessionsTable.expertId, profile.id))
      .orderBy(desc(mentorshipSessionsTable.createdAt));
    res.json({ sessions: rows });
  } catch (err) {
    logger.error({ err }, "GET /experts/me/sessions failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// Expert responds to a session request (confirm / decline / complete / cancel).
router.patch("/experts/me/sessions/:id", requireUser, async (req, res) => {
  try {
    const session = sessionOf(req)!;
    const profile = await myExpertProfile(session.userId);
    if (!profile) {
      res.status(404).json({ error: "لست خبيرًا مسجَّلًا" });
      return;
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const status = String(req.body?.status ?? "");
    const allowed: SessionStatus[] = [
      "confirmed",
      "declined",
      "completed",
      "cancelled",
    ];
    if (!allowed.includes(status as SessionStatus)) {
      res.status(400).json({ error: "حالة غير صحيحة" });
      return;
    }
    const expertNote =
      typeof req.body?.expertNote === "string"
        ? req.body.expertNote.slice(0, 2000)
        : undefined;
    const [row] = await db
      .update(mentorshipSessionsTable)
      .set({
        status: status as SessionStatus,
        ...(expertNote !== undefined ? { expertNote } : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(mentorshipSessionsTable.id, id),
          eq(mentorshipSessionsTable.expertId, profile.id),
        ),
      )
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    void notifySessionConfirmed(row);
    res.json({ session: row });
  } catch (err) {
    logger.error({ err }, "PATCH /experts/me/sessions/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Mentee: request / list / cancel sessions ────────────────────────────────

router.post("/experts/:id/sessions", requireUser, async (req, res) => {
  try {
    const session = sessionOf(req)!;
    const expertId = Number(req.params.id);
    if (!Number.isInteger(expertId) || expertId <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [expert] = await db
      .select()
      .from(expertProfilesTable)
      .where(eq(expertProfilesTable.id, expertId))
      .limit(1);
    if (!expert || expert.status !== "active") {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    if (expert.userId === session.userId) {
      res.status(400).json({ error: "لا يمكنك حجز جلسة مع نفسك" });
      return;
    }
    if (!expert.acceptingSessions) {
      res.status(400).json({ error: "هذا الخبير لا يستقبل جلسات حاليًا" });
      return;
    }
    const parsed = requestSessionSchema.safeParse(req.body);
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
    const [row] = await db
      .insert(mentorshipSessionsTable)
      .values({
        expertId,
        menteeId: session.userId,
        topic: d.topic,
        message: d.message,
        mode: d.mode,
        preferredAt: d.preferredAt ? new Date(d.preferredAt) : null,
        status: "requested",
      })
      .returning();
    // Let the expert know a request is waiting (they're a user → in-app bell).
    void notify(expert.userId, {
      type: "session_requested",
      title: "طلب جلسة إرشاد جديد",
      body: `طلب أحد المنتسبين جلسة حول «${d.topic}».`,
      link: "/expert/dashboard",
    });
    res.json({ session: row });
  } catch (err) {
    logger.error({ err }, "POST /experts/:id/sessions failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/me/sessions", requireUser, async (req, res) => {
  try {
    const session = sessionOf(req)!;
    const rows = await db
      .select({
        session: mentorshipSessionsTable,
        expertName: usersTable.fullName,
        expertAvatar: usersTable.avatarUrl,
        expertHeadline: expertProfilesTable.headline,
      })
      .from(mentorshipSessionsTable)
      .innerJoin(
        expertProfilesTable,
        eq(expertProfilesTable.id, mentorshipSessionsTable.expertId),
      )
      .innerJoin(usersTable, eq(usersTable.id, expertProfilesTable.userId))
      .where(eq(mentorshipSessionsTable.menteeId, session.userId))
      .orderBy(desc(mentorshipSessionsTable.createdAt));
    res.json({ sessions: rows });
  } catch (err) {
    logger.error({ err }, "GET /me/sessions failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/me/sessions/:id", requireUser, async (req, res) => {
  try {
    const session = sessionOf(req)!;
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    await db
      .update(mentorshipSessionsTable)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          eq(mentorshipSessionsTable.id, id),
          eq(mentorshipSessionsTable.menteeId, session.userId),
        ),
      );
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /me/sessions/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Admin: experts CRUD ─────────────────────────────────────────────────────

router.get("/admin/experts", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: expertProfilesTable.id,
        userId: expertProfilesTable.userId,
        fullName: usersTable.fullName,
        email: usersTable.email,
        avatarUrl: usersTable.avatarUrl,
        headline: expertProfilesTable.headline,
        expertise: expertProfilesTable.expertise,
        status: expertProfilesTable.status,
        featured: expertProfilesTable.featured,
        sortOrder: expertProfilesTable.sortOrder,
        acceptingSessions: expertProfilesTable.acceptingSessions,
        createdAt: expertProfilesTable.createdAt,
        sessionsCount: sql<number>`COALESCE(COUNT(${mentorshipSessionsTable.id}), 0)::int`,
      })
      .from(expertProfilesTable)
      .innerJoin(usersTable, eq(usersTable.id, expertProfilesTable.userId))
      .leftJoin(
        mentorshipSessionsTable,
        eq(mentorshipSessionsTable.expertId, expertProfilesTable.id),
      )
      .groupBy(expertProfilesTable.id, usersTable.id)
      .orderBy(
        desc(expertProfilesTable.featured),
        asc(expertProfilesTable.sortOrder),
        desc(expertProfilesTable.createdAt),
      );
    res.json({ experts: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/experts failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/admin/experts/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [row] = await db
      .select({
        profile: expertProfilesTable,
        fullName: usersTable.fullName,
        email: usersTable.email,
        avatarUrl: usersTable.avatarUrl,
      })
      .from(expertProfilesTable)
      .innerJoin(usersTable, eq(usersTable.id, expertProfilesTable.userId))
      .where(eq(expertProfilesTable.id, id))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ expert: row });
  } catch (err) {
    logger.error({ err }, "GET /admin/experts/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// Create a fresh expert: a user account (role "expert") + its profile.
router.post("/admin/experts", requireAdmin, async (req, res) => {
  try {
    const parsed = createExpertSchema.safeParse(req.body);
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
    const { fullName, email, password, avatarUrl, profile } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);
    try {
      const created = await db.transaction(async (tx) => {
        const [user] = await tx
          .insert(usersTable)
          .values({
            email,
            passwordHash,
            fullName,
            role: "expert",
            avatarUrl: avatarUrl ?? null,
          })
          .returning();
        const [row] = await tx
          .insert(expertProfilesTable)
          .values({
            userId: user.id,
            headline: profile?.headline ?? "",
            expertise: profile?.expertise ?? "",
            bio: profile?.bio ?? "",
            yearsExperience: profile?.yearsExperience ?? 0,
            languages: profile?.languages ?? "",
            sessionMinutes: profile?.sessionMinutes ?? 45,
            availabilityNote: profile?.availabilityNote ?? "",
            acceptingSessions: profile?.acceptingSessions ?? true,
            linkedinUrl: profile?.linkedinUrl ?? "",
            websiteUrl: profile?.websiteUrl ?? "",
            status: profile?.status ?? "active",
            featured: profile?.featured ?? false,
            sortOrder: profile?.sortOrder ?? 0,
          })
          .returning();
        return { user, profile: row };
      });
      res.json({ expert: created.profile, userId: created.user.id });
    } catch (err) {
      if (isUniqueViolation(err)) {
        res.status(409).json({ error: "هذا البريد مسجّل مسبقًا" });
        return;
      }
      throw err;
    }
  } catch (err) {
    logger.error({ err }, "POST /admin/experts failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/experts/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = adminExpertProfileSchema.partial().safeParse(req.body);
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
    const [row] = await db
      .update(expertProfilesTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(expertProfilesTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ expert: row });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/experts/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// Remove an expert: delete the profile and demote the account to a plain member
// (we keep the user account itself to avoid accidental data loss).
router.delete("/admin/experts/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    await db.transaction(async (tx) => {
      const [row] = await tx
        .select({ userId: expertProfilesTable.userId })
        .from(expertProfilesTable)
        .where(eq(expertProfilesTable.id, id))
        .limit(1);
      await tx
        .delete(expertProfilesTable)
        .where(eq(expertProfilesTable.id, id));
      if (row) {
        await tx
          .update(usersTable)
          .set({ role: "other", updatedAt: new Date() })
          .where(eq(usersTable.id, row.userId));
      }
    });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/experts/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Admin: all mentorship sessions ──────────────────────────────────────────

router.get("/admin/sessions", requireAdmin, async (req, res) => {
  try {
    const status = String(req.query.status ?? "");
    const where = [] as Array<ReturnType<typeof eq>>;
    if ((SESSION_STATUSES as readonly string[]).includes(status)) {
      where.push(
        eq(mentorshipSessionsTable.status, status as SessionStatus),
      );
    }
    const expertUser = alias(usersTable, "expert_user");
    const rows = await db
      .select({
        session: mentorshipSessionsTable,
        expertName: expertUser.fullName,
        menteeName: usersTable.fullName,
      })
      .from(mentorshipSessionsTable)
      .innerJoin(
        expertProfilesTable,
        eq(expertProfilesTable.id, mentorshipSessionsTable.expertId),
      )
      .innerJoin(expertUser, eq(expertUser.id, expertProfilesTable.userId))
      .innerJoin(
        usersTable,
        eq(usersTable.id, mentorshipSessionsTable.menteeId),
      )
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(mentorshipSessionsTable.createdAt))
      .limit(500);
    res.json({ sessions: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/sessions failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/sessions/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const status = String(req.body?.status ?? "");
    if (!(SESSION_STATUSES as readonly string[]).includes(status)) {
      res.status(400).json({ error: "حالة غير صحيحة" });
      return;
    }
    const expertNote =
      typeof req.body?.expertNote === "string"
        ? req.body.expertNote.slice(0, 2000)
        : undefined;
    const [row] = await db
      .update(mentorshipSessionsTable)
      .set({
        status: status as SessionStatus,
        ...(expertNote !== undefined ? { expertNote } : {}),
        updatedAt: new Date(),
      })
      .where(eq(mentorshipSessionsTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    void notifySessionConfirmed(row);
    res.json({ session: row });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/sessions/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
