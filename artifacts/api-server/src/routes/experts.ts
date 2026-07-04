import { Router, type IRouter, type Request } from "express";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import bcrypt from "bcryptjs";
import {
  db,
  usersTable,
  expertProfilesTable,
  mentorshipSessionsTable,
  pendingRemindersTable,
  expertProfileSchema,
  adminExpertProfileSchema,
  createExpertSchema,
  applyMentorSchema,
  requestSessionSchema,
  SESSION_STATUSES,
  type SessionStatus,
} from "@workspace/db";
import {
  requireAdmin,
  requireUser,
  type UserSession,
} from "../lib/auth";
import { createResetToken } from "./auth";
import { schedulePendingReminder } from "../lib/mentorReminderJob";
import { logger } from "../lib/logger";
import { cached } from "../lib/cache";
import {
  sendEmail,
  sessionConfirmedEmail,
  mentorApplicationEmail,
  mentorApplicationApprovedEmail,
  adminMentorApplicationEmail,
  mentorPasswordReminderEmail,
} from "../lib/email";
import { notify } from "./notifications";
import { prefAllows } from "./notificationPrefs";
import { awardBadgeByKey } from "./gamification";
import { getAdminEmail } from "./adminExtra";

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
  ratingAvg: sql<number | null>`(SELECT ROUND(AVG(rating)::numeric, 1)::float8 FROM session_ratings WHERE expert_id = ${expertProfilesTable.id})`,
  ratingCount: sql<number>`(SELECT COUNT(*)::int FROM session_ratings WHERE expert_id = ${expertProfilesTable.id})`,
};

// ─── Public: list active experts ─────────────────────────────────────────────

router.get("/experts", async (_req, res) => {
  try {
    // Public, session-independent directory (ratingAvg/Count are the same for
    // everyone). 60s cache matches the Cache-Control app.ts sets for this route.
    const data = await cached("experts", 60, async () => {
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
      return { experts: rows };
    });
    res.json(data);
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

// ─── Public: self-apply as mentor ────────────────────────────────────────────

router.post("/experts/apply", async (req, res) => {
  try {
    const parsed = applyMentorSchema.safeParse(req.body);
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
    const { fullName, email, expertise, yearsExperience, bio, linkedinUrl, ref } =
      parsed.data;

    if (ref) {
      logger.info({ ref, applicant: email }, "mentor application from referral");
    }

    // Generate a random temporary password — the admin will set a proper one
    // or the applicant can use "forgot password" once approved.
    const tmpPassword =
      Math.random().toString(36).slice(2, 10) +
      Math.random().toString(36).slice(2, 10);
    const passwordHash = await bcrypt.hash(tmpPassword, 12);

    try {
      await db.transaction(async (tx) => {
        const [user] = await tx
          .insert(usersTable)
          .values({
            email,
            passwordHash,
            fullName,
            role: "expert",
          })
          .returning();
        await tx.insert(expertProfilesTable).values({
          userId: user.id,
          expertise,
          yearsExperience,
          bio,
          linkedinUrl: linkedinUrl ?? "",
          status: "pending",
          acceptingSessions: false,
          ...(ref ? { ref } : {}),
        });
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        res.status(409).json({ error: "هذا البريد مسجّل مسبقًا" });
        return;
      }
      throw err;
    }

    // Fire-and-forget confirmation email to the applicant
    const mail = mentorApplicationEmail(fullName);
    void sendEmail({ to: email, ...mail });

    // Fire-and-forget admin notification
    const adminEmail = await getAdminEmail();
    if (adminEmail) {
      const appUrl =
        process.env.APP_URL ?? "https://islandhaven.replit.app";
      const adminMail = adminMentorApplicationEmail(
        fullName,
        expertise,
        `${appUrl}/admin`,
      );
      void sendEmail({ to: adminEmail, ...adminMail });

      // In-app bell notification for the admin user (looked up by role, not email)
      const [adminUser] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.role, "expert" as any))
        .limit(0); // Admin users live outside the users table; this is a no-op placeholder
      if (adminUser) {
        void notify(adminUser.id, {
          type: "mentor_application",
          title: "طلب انضمام مرشد جديد",
          body: `${fullName} يطلب الانضمام كمرشد (${expertise}).`,
          link: "/admin",
        });
      }
    } else {
      logger.warn(
        { applicant: email },
        "ADMIN_EMAIL not configured — admin mentor-application notification skipped",
      );
    }


    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "POST /experts/apply failed");
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

async function myExpertProfileWithAvatar(userId: number) {
  const [row] = await db
    .select({
      id: expertProfilesTable.id,
      userId: expertProfilesTable.userId,
      headline: expertProfilesTable.headline,
      expertise: expertProfilesTable.expertise,
      bio: expertProfilesTable.bio,
      yearsExperience: expertProfilesTable.yearsExperience,
      languages: expertProfilesTable.languages,
      sessionMinutes: expertProfilesTable.sessionMinutes,
      availabilityNote: expertProfilesTable.availabilityNote,
      acceptingSessions: expertProfilesTable.acceptingSessions,
      linkedinUrl: expertProfilesTable.linkedinUrl,
      websiteUrl: expertProfilesTable.websiteUrl,
      status: expertProfilesTable.status,
      featured: expertProfilesTable.featured,
      sortOrder: expertProfilesTable.sortOrder,
      createdAt: expertProfilesTable.createdAt,
      updatedAt: expertProfilesTable.updatedAt,
      avatarUrl: usersTable.avatarUrl,
    })
    .from(expertProfilesTable)
    .innerJoin(usersTable, eq(usersTable.id, expertProfilesTable.userId))
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
    const profile = await myExpertProfileWithAvatar(session.userId);
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

router.patch("/experts/me/avatar", requireUser, async (req, res) => {
  try {
    const session = sessionOf(req)!;
    const profile = await myExpertProfile(session.userId);
    if (!profile) {
      res.status(404).json({ error: "لست خبيرًا مسجَّلًا" });
      return;
    }
    const avatarUrl =
      typeof req.body?.avatarUrl === "string"
        ? req.body.avatarUrl.trim().slice(0, 800) || null
        : null;
    await db
      .update(usersTable)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(usersTable.id, session.userId));
    res.json({ ok: true, avatarUrl });
  } catch (err) {
    logger.error({ err }, "PATCH /experts/me/avatar failed");
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
    // Auto-award the mentee the "active learner" badge for engaging mentorship.
    void awardBadgeByKey(session.userId, "mentor_fan");
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
        approvedAt: expertProfilesTable.approvedAt,
        passwordSetAt: usersTable.passwordSetAt,
        lastLoginAt: usersTable.lastLoginAt,
        sessionsCount: sql<number>`COALESCE(COUNT(${mentorshipSessionsTable.id}), 0)::int`,
        ref: expertProfilesTable.ref,
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
    const avatarUrl =
      typeof req.body?.avatarUrl === "string"
        ? req.body.avatarUrl.trim().slice(0, 800) || null
        : undefined;
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
    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({
          userId: expertProfilesTable.userId,
          prevStatus: expertProfilesTable.status,
        })
        .from(expertProfilesTable)
        .where(eq(expertProfilesTable.id, id))
        .limit(1);
      if (!existing) return null;
      if (avatarUrl !== undefined) {
        await tx
          .update(usersTable)
          .set({ avatarUrl, updatedAt: new Date() })
          .where(eq(usersTable.id, existing.userId));
      }
      const [row] = await tx
        .update(expertProfilesTable)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(expertProfilesTable.id, id))
        .returning();
      return { row, userId: existing.userId, prevStatus: existing.prevStatus };
    });
    if (!result) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    // Send approval email when a pending application is activated for the first time.
    // A 24-hour password-reset token is minted so the applicant can set their
    // password immediately without going through the "forgot password" flow.
    // approvedAt is persisted so the scheduled reminder job can query it.
    if (
      result.prevStatus === "pending" &&
      parsed.data.status === "active"
    ) {
      try {
        const [user] = await db
          .select({ email: usersTable.email, fullName: usersTable.fullName })
          .from(usersTable)
          .where(eq(usersTable.id, result.userId))
          .limit(1);
        if (user) {
          const TTL_24H = 24 * 60 * 60 * 1000;
          const rawToken = await createResetToken(user.email, TTL_24H);
          const frontendUrl =
            process.env.FRONTEND_URL ?? "https://islandhaven.replit.app";
          const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
          const mail = mentorApplicationApprovedEmail(user.fullName, resetUrl);
          void sendEmail({ to: user.email, ...mail });

          const approvedAt = new Date();

          // Persist approvedAt so the reminder job can find this expert.
          await db
            .update(expertProfilesTable)
            .set({ approvedAt, updatedAt: approvedAt })
            .where(eq(expertProfilesTable.id, id));

          // Schedule the 20-hour password-setup reminder.
          // 1. Insert a persistent row so the reminder survives restarts.
          // 2. Also schedule it in-process via schedulePendingReminder so it
          //    fires even if the server never restarts before the 20-hour mark.
          const REMINDER_DELAY_MS = 20 * 60 * 60 * 1000; // 20 h
          const sendAt = new Date(approvedAt.getTime() + REMINDER_DELAY_MS);
          const [reminderRow] = await db
            .insert(pendingRemindersTable)
            .values({ email: user.email, fullName: user.fullName, sendAt })
            .onConflictDoNothing()
            .returning();
          if (reminderRow) {
            schedulePendingReminder(reminderRow);
          } else {
            logger.info(
              { email: user.email },
              "pending reminder already exists for this email — skipping duplicate",
            );
          }
        }
      } catch (emailErr) {
        logger.error({ emailErr }, "Failed to send mentor approval email");
      }
    }
    res.json({ expert: result.row });
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

// Resend a fresh 24-hour password-setup link to an active expert who hasn't
// logged in yet (passwordSetAt IS NULL).
router.post("/admin/experts/:id/resend-setup-link", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    // Fetch expert profile + user row
    const [row] = await db
      .select({
        userId: expertProfilesTable.userId,
        status: expertProfilesTable.status,
        email: usersTable.email,
        fullName: usersTable.fullName,
        passwordSetAt: usersTable.passwordSetAt,
      })
      .from(expertProfilesTable)
      .innerJoin(usersTable, eq(usersTable.id, expertProfilesTable.userId))
      .where(eq(expertProfilesTable.id, id))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    if (row.status !== "active") {
      res.status(400).json({ error: "الخبير ليس مُفعَّلًا" });
      return;
    }
    if (row.passwordSetAt) {
      res.status(400).json({ error: "قام هذا المرشد بضبط كلمة السرّ بالفعل" });
      return;
    }
    const TTL_24H = 24 * 60 * 60 * 1000;
    const rawToken = await createResetToken(row.email, TTL_24H);
    const frontendUrl = process.env.FRONTEND_URL ?? "https://islandhaven.replit.app";
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
    const mail = mentorPasswordReminderEmail(row.fullName, resetUrl);
    const delivered = await sendEmail({ to: row.email, ...mail });
    if (!delivered) {
      res.status(502).json({ error: "تعذّر إرسال البريد الإلكترونيّ — تحقّق من إعدادات البريد وحاول لاحقًا" });
      return;
    }
    logger.info({ expertId: id, email: row.email }, "Resent mentor setup link");
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "POST /admin/experts/:id/resend-setup-link failed");
    res.status(500).json({ error: "تعذّر إرسال الرابط" });
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
