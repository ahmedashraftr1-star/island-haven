import { logger } from "./logger";

// ─── Email sending via Resend HTTP API ───────────────────────────────────────
// Uses fetch directly (same pattern as the Expo push integration) so we avoid
// adding an SDK dependency. If RESEND_API_KEY is unset — local dev, or before
// the provider is configured — we fall back to logging the message instead of
// throwing, so flows like password reset keep working without a real provider.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Island Haven <onboarding@resend.dev>";
// Provider endpoint is overridable (defaults to Resend). Lets the queue worker
// be pointed at a stub in tests without touching the real API.
const EMAIL_API_URL =
  process.env.EMAIL_API_URL ?? "https://api.resend.com/emails";

/**
 * Whether a real email provider is configured. The queue's email processor uses
 * this to decide: a `false` return from sendEmail with NO provider is a dev
 * no-op (job succeeds), but with a provider configured it's a real delivery
 * failure worth retrying.
 */
export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  /** Optional plain-text fallback for clients that don't render HTML. */
  text?: string;
}

/**
 * Sends an email through Resend. Returns true if the provider accepted it,
 * false if it was only logged (no API key) or the send failed. Callers should
 * not branch user-facing behaviour on the result — for security-sensitive
 * flows (password reset) we always respond success regardless.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  if (!RESEND_API_KEY) {
    if (process.env.NODE_ENV === "production") {
      // Never log the body in production — it can contain live reset tokens.
      logger.error(
        { to: opts.to, subject: opts.subject },
        "RESEND_API_KEY not set — email NOT sent. Refusing to log the email body.",
      );
      return false;
    }
    logger.warn(
      { to: opts.to, subject: opts.subject },
      "RESEND_API_KEY not set — email NOT sent (dev fallback). Set RESEND_API_KEY + EMAIL_FROM to enable real delivery.",
    );
    // Body (which may contain a live reset link/token) is only surfaced when
    // explicitly opted in, and never above debug level.
    if (process.env.EMAIL_DEBUG_BODY === "1") {
      logger.debug({ to: opts.to, html: opts.html }, "email body (dev opt-in)");
    }
    return false;
  }

  try {
    const r = await fetch(EMAIL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.text ? { text: opts.text } : {}),
      }),
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      logger.error(
        { status: r.status, detail, to: opts.to },
        "Resend send failed",
      );
      return false;
    }

    logger.info({ to: opts.to, subject: opts.subject }, "email sent");
    return true;
  } catch (err) {
    logger.error({ err, to: opts.to }, "email send threw");
    return false;
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

const BRAND = "آيلاند هيفن";
const PRIMARY = "#e0556b"; // hsl(354 80% 60%) — matches the app primary

/** Minimal RTL Arabic shell shared by all transactional emails. */
function shell(heading: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="ar" dir="rtl">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#0a0e1a;font-family:'IBM Plex Sans Arabic','Segoe UI',Tahoma,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#11162a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
          <tr><td style="background:${PRIMARY};padding:20px 28px;text-align:center;">
            <span style="color:#fff;font-size:20px;font-weight:700;">${BRAND}</span>
          </td></tr>
          <tr><td style="padding:32px 28px;color:#e8eaf2;">
            <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#fff;">${heading}</h1>
            ${bodyHtml}
          </td></tr>
          <tr><td style="padding:18px 28px;border-top:1px solid rgba(255,255,255,0.06);color:#7c849c;font-size:12px;text-align:center;">
            مساحة تتّسع لأحلامك — ${BRAND}
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function passwordResetEmail(
  resetUrl: string,
  fullName?: string | null,
): { subject: string; html: string; text: string } {
  const greeting = fullName ? `مرحبًا ${fullName}،` : "مرحبًا،";
  const html = shell(
    "إعادة تعيين كلمة السرّ",
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">${greeting}</p>
     <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#c7ccdc;">
       وصلنا طلب لإعادة تعيين كلمة سرّ حسابك. اضغط الزرّ أدناه لتعيين كلمة سرّ جديدة. هذا الرابط صالح لمدّة <strong style="color:#fff;">15 دقيقة</strong> فقط.
     </p>
     <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
       <tr><td style="border-radius:10px;background:${PRIMARY};">
         <a href="${resetUrl}" style="display:inline-block;padding:13px 28px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">إعادة تعيين كلمة السرّ</a>
       </td></tr>
     </table>
     <p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:#7c849c;">
       إذا لم يعمل الزرّ، انسخ هذا الرابط والصقه في المتصفّح:
     </p>
     <p style="margin:0 0 24px;font-size:13px;line-height:1.6;word-break:break-all;direction:ltr;text-align:left;">
       <a href="${resetUrl}" style="color:${PRIMARY};">${resetUrl}</a>
     </p>
     <p style="margin:0;font-size:13px;line-height:1.7;color:#7c849c;">
       إذا لم تطلب هذا، تجاهل هذه الرسالة وستبقى كلمة سرّك كما هي.
     </p>`,
  );
  const text = `${greeting}\n\nوصلنا طلب لإعادة تعيين كلمة سرّ حسابك في ${BRAND}.\nافتح الرابط التالي خلال 15 دقيقة لتعيين كلمة سرّ جديدة:\n\n${resetUrl}\n\nإذا لم تطلب هذا، تجاهل هذه الرسالة.`;
  return { subject: `إعادة تعيين كلمة السرّ — ${BRAND}`, html, text };
}

/** Sent when an admin accepts a member's application to an incubation program. */
export function programAcceptedEmail(
  fullName: string | null,
  programTitle: string,
): { subject: string; html: string; text: string } {
  const greeting = fullName ? `مبارك ${fullName}!` : "مبارك!";
  const html = shell(
    "تمّ قبولك في البرنامج 🎉",
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">${greeting}</p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">
       يسعدنا إبلاغك بقبول طلبك للانضمام إلى برنامج
       <strong style="color:#fff;">${programTitle}</strong> في ${BRAND}.
     </p>
     <p style="margin:0;font-size:14px;line-height:1.7;color:#7c849c;">
       سيتواصل معك فريقنا قريبًا بتفاصيل البدء والخطوات التالية. نحن متحمّسون لرحلتك معنا.
     </p>`,
  );
  const text = `${greeting}\n\nتمّ قبول طلبك للانضمام إلى برنامج "${programTitle}" في ${BRAND}.\nسيتواصل معك فريقنا قريبًا بالتفاصيل.`;
  return { subject: `🎉 قبولك في ${programTitle} — ${BRAND}`, html, text };
}

/** Sent to a mentor applicant immediately after they submit the /become-mentor form. */
export function mentorApplicationEmail(
  fullName: string,
): { subject: string; html: string; text: string } {
  const html = shell(
    "استلمنا طلبك للانضمام كمرشد 🎉",
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">مرحبًا ${fullName}،</p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">
       شكرًا لاهتمامك بالانضمام إلى برنامج الإرشاد في <strong style="color:#fff;">${BRAND}</strong>.
       استلمنا طلبك وهو الآن قيد المراجعة من قِبل فريقنا.
     </p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">
       سنتواصل معك في أقرب وقت لإعلامك بنتيجة الطلب وإرشادك للخطوات التالية.
     </p>
     <p style="margin:0;font-size:14px;line-height:1.7;color:#7c849c;">
       إذا كان لديك أيّ استفسار، لا تتردّد في التواصل معنا.
     </p>`,
  );
  const text = `مرحبًا ${fullName}،\n\nشكرًا لتقديمك طلب الانضمام كمرشد في ${BRAND}.\nاستلمنا طلبك وهو قيد المراجعة. سنتواصل معك قريبًا.\n\nفريق ${BRAND}`;
  return { subject: `استلمنا طلبك — برنامج الإرشاد في ${BRAND}`, html, text };
}

/** Sent to a mentor applicant when the admin activates their account (pending → active).
 *  Includes a 24-hour password-setup link so the applicant can log in immediately. */
export function mentorApplicationApprovedEmail(
  fullName: string,
  resetUrl: string,
): { subject: string; html: string; text: string } {
  const html = shell(
    "تمّ قبولك في برنامج الإرشاد ✅",
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">مبارك ${fullName}!</p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">
       يسعدنا إبلاغك بقبول طلبك للانضمام كمرشد في <strong style="color:#fff;">${BRAND}</strong>.
       حسابك الآن مُفعَّل — اضغط الزرّ أدناه لضبط كلمة سرّك والدخول إلى منصّتك.
     </p>
     <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#7c849c;">
       هذا الرابط صالح لمدّة <strong style="color:#fff;">24 ساعة</strong> فقط.
     </p>
     <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
       <tr><td style="border-radius:10px;background:${PRIMARY};">
         <a href="${resetUrl}" style="display:inline-block;padding:13px 28px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">ضبط كلمة السرّ وتسجيل الدخول</a>
       </td></tr>
     </table>
     <p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:#7c849c;">
       إذا لم يعمل الزرّ، انسخ هذا الرابط والصقه في المتصفّح:
     </p>
     <p style="margin:0 0 24px;font-size:13px;line-height:1.6;word-break:break-all;direction:ltr;text-align:left;">
       <a href="${resetUrl}" style="color:${PRIMARY};">${resetUrl}</a>
     </p>
     <p style="margin:0;font-size:14px;line-height:1.7;color:#7c849c;">
       نحن متحمّسون لرحلتك معنا في ${BRAND}.
     </p>`,
  );
  const text = `مبارك ${fullName}!\n\nتمّ قبولك في برنامج الإرشاد في ${BRAND}.\nاضغط الرابط أدناه لضبط كلمة سرّك خلال 24 ساعة:\n\n${resetUrl}\n\nفريق ${BRAND}`;
  return { subject: `✅ قبولك في برنامج الإرشاد — ${BRAND}`, html, text };
}

/** Sent to an approved mentor ~20 h after approval if they still haven't set
 *  their password. Contains a fresh 24-hour reset token so the mentor has a
 *  full day to complete setup even if they missed the original approval email. */
export function mentorPasswordReminderEmail(
  fullName: string,
  resetUrl: string,
): { subject: string; html: string; text: string } {
  const html = shell(
    "تذكير: لم تضبط كلمة سرّك بعد ⏰",
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">مرحبًا ${fullName}،</p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">
       لاحظنا أنّك لم تكمل ضبط كلمة سرّ حسابك في <strong style="color:#fff;">${BRAND}</strong> بعد قبولك كمرشد.
       أرسلنا لك هذا الرابط الجديد الصالح لمدّة <strong style="color:#fff;">24 ساعة</strong> لتتمكّن من الدخول إلى منصّتك.
     </p>
     <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#c7ccdc;">
       اضغط الزرّ أدناه لضبط كلمة سرّك والبدء في استخدام حسابك.
     </p>
     <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
       <tr><td style="border-radius:10px;background:${PRIMARY};">
         <a href="${resetUrl}" style="display:inline-block;padding:13px 28px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">ضبط كلمة السرّ الآن</a>
       </td></tr>
     </table>
     <p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:#7c849c;">
       إذا لم يعمل الزرّ، انسخ هذا الرابط والصقه في المتصفّح:
     </p>
     <p style="margin:0 0 24px;font-size:13px;line-height:1.6;word-break:break-all;direction:ltr;text-align:left;">
       <a href="${resetUrl}" style="color:${PRIMARY};">${resetUrl}</a>
     </p>
     <p style="margin:0;font-size:13px;line-height:1.7;color:#7c849c;">
       إذا انتهت صلاحية الرابط، استخدم خيار «نسيت كلمة السرّ» في صفحة تسجيل الدخول.
     </p>`,
  );
  const text = `مرحبًا ${fullName}،\n\nلاحظنا أنّك لم تكمل ضبط كلمة سرّ حسابك في ${BRAND} بعد قبولك كمرشد.\nأرسلنا لك رابطًا جديدًا صالحًا لمدّة 24 ساعة:\n\n${resetUrl}\n\nإذا انتهت صلاحيته، استخدم «نسيت كلمة السرّ» عند تسجيل الدخول.\n\nفريق ${BRAND}`;
  return { subject: `⏰ تذكير: أكمل ضبط كلمة سرّك في ${BRAND}`, html, text };
}

/** Sent to the admin when a new mentor application arrives via /become-mentor. */
export function adminMentorApplicationEmail(
  applicantName: string,
  expertise: string,
  adminUrl: string,
): { subject: string; html: string; text: string } {
  const html = shell(
    "طلب مرشد جديد 📋",
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">وصل طلب انضمام جديد كمرشد على منصّة <strong style="color:#fff;">${BRAND}</strong>.</p>
     <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;width:100%;border-collapse:collapse;">
       <tr>
         <td style="padding:10px 14px;background:#1a2040;border-radius:8px 8px 0 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#7c849c;font-size:13px;width:120px;">الاسم</td>
         <td style="padding:10px 14px;background:#1a2040;border-radius:8px 8px 0 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#e8eaf2;font-size:14px;font-weight:600;">${applicantName}</td>
       </tr>
       <tr>
         <td style="padding:10px 14px;background:#161b35;border-radius:0 0 8px 8px;color:#7c849c;font-size:13px;">مجالات الخبرة</td>
         <td style="padding:10px 14px;background:#161b35;border-radius:0 0 8px 8px;color:#e8eaf2;font-size:14px;">${expertise}</td>
       </tr>
     </table>
     <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
       <tr><td style="border-radius:10px;background:#e0556b;">
         <a href="${adminUrl}" style="display:inline-block;padding:13px 28px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">مراجعة الطلب في لوحة الإدارة</a>
       </td></tr>
     </table>
     <p style="margin:0;font-size:13px;line-height:1.7;color:#7c849c;">
       إذا لم يعمل الزرّ، افتح الرابط التالي:<br>
       <a href="${adminUrl}" style="color:#e0556b;direction:ltr;display:inline-block;">${adminUrl}</a>
     </p>`,
  );
  const text = `طلب مرشد جديد في ${BRAND}\n\nالاسم: ${applicantName}\nمجالات الخبرة: ${expertise}\n\nراجع الطلب في لوحة الإدارة:\n${adminUrl}`;
  return { subject: `📋 طلب مرشد جديد — ${applicantName}`, html, text };
}

/** Sent to the admin when a member submits a new success story. */
export function adminNewStoryEmail(
  memberName: string,
  quote: string,
  adminUrl: string,
): { subject: string; html: string; text: string } {
  const shortQuote =
    quote.length > 200 ? quote.slice(0, 200).trimEnd() + "…" : quote;
  const html = shell(
    "قصّة نجاح جديدة 📝",
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">قدَّم عضو قصّة نجاحه على منصّة <strong style="color:#fff;">${BRAND}</strong> وهي بانتظار المراجعة.</p>
     <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;width:100%;border-collapse:collapse;">
       <tr>
         <td style="padding:10px 14px;background:#1a2040;border-radius:8px 8px 0 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#7c849c;font-size:13px;width:120px;">الاسم</td>
         <td style="padding:10px 14px;background:#1a2040;border-radius:8px 8px 0 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#e8eaf2;font-size:14px;font-weight:600;">${memberName}</td>
       </tr>
       <tr>
         <td style="padding:10px 14px;background:#161b35;border-radius:0 0 8px 8px;color:#7c849c;font-size:13px;">الاقتباس</td>
         <td style="padding:10px 14px;background:#161b35;border-radius:0 0 8px 8px;color:#e8eaf2;font-size:14px;font-style:italic;">&laquo;${shortQuote}&raquo;</td>
       </tr>
     </table>
     <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
       <tr><td style="border-radius:10px;background:${PRIMARY};">
         <a href="${adminUrl}" style="display:inline-block;padding:13px 28px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">مراجعة القصّة في لوحة الإدارة</a>
       </td></tr>
     </table>
     <p style="margin:0;font-size:13px;line-height:1.7;color:#7c849c;">
       إذا لم يعمل الزرّ، افتح الرابط التالي:<br>
       <a href="${adminUrl}" style="color:${PRIMARY};direction:ltr;display:inline-block;">${adminUrl}</a>
     </p>`,
  );
  const text = `قصّة نجاح جديدة في ${BRAND}\n\nالاسم: ${memberName}\nالاقتباس: «${shortQuote}»\n\nراجع القصّة في لوحة الإدارة:\n${adminUrl}`;
  return { subject: `📝 قصّة نجاح جديدة — ${memberName}`, html, text };
}

/** Sent to a member when the admin publishes their success story. */
export function storyPublishedEmail(
  fullName: string,
): { subject: string; html: string; text: string } {
  const html = shell(
    "نُشرت قصّتك على المنصّة 🎉",
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">مبارك ${fullName}!</p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">
       يسعدنا إبلاغك بأنّ قصّة نجاحك قد <strong style="color:#fff;">نُشرت</strong> على منصّة
       <strong style="color:#fff;">${BRAND}</strong> وأصبحت متاحة للجميع.
     </p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">
       شكرًا لمشاركتك تجربتك مع مجتمعنا — قصّتك ستُلهم كثيرين في رحلتهم.
     </p>
     <p style="margin:0;font-size:14px;line-height:1.7;color:#7c849c;">
       فريق ${BRAND} يفخر بإنجازاتك ويتمنّى لك مزيدًا من التوفيق.
     </p>`,
  );
  const text = `مبارك ${fullName}!\n\nنُشرت قصّة نجاحك على منصّة ${BRAND} وأصبحت متاحة للجميع.\nشكرًا لمشاركتك تجربتك مع مجتمعنا.\n\nفريق ${BRAND}`;
  return { subject: `🎉 نُشرت قصّتك على ${BRAND}`, html, text };
}

/** Sent to a member when the admin rejects their success story. */
export function storyRejectedEmail(
  fullName: string,
  reason?: string,
): { subject: string; html: string; text: string } {
  const reasonBlock = reason
    ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">
         <strong style="color:#fff;">سبب القرار:</strong> ${reason}
       </p>`
    : "";
  const reasonText = reason ? `\nسبب القرار: ${reason}\n` : "";
  const html = shell(
    "بخصوص قصّتك على المنصّة",
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">مرحبًا ${fullName}،</p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">
       شكرًا جزيلًا لمشاركتك قصّة نجاحك مع مجتمع <strong style="color:#fff;">${BRAND}</strong>.
     </p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">
       بعد مراجعة فريقنا، لم نتمكّن من نشر قصّتك في الوقت الحالي. نقدّر وقتك وجهدك، ونشجّعك على التواصل معنا إذا كنت ترغب في مزيد من التفاصيل أو تعديل قصّتك وإعادة تقديمها.
     </p>
     ${reasonBlock}
     <p style="margin:0;font-size:14px;line-height:1.7;color:#7c849c;">
       نحن دائمًا هنا لدعمك في رحلتك — فريق ${BRAND}.
     </p>`,
  );
  const text = `مرحبًا ${fullName}،\n\nشكرًا لمشاركتك قصّة نجاحك مع ${BRAND}.\nبعد مراجعة فريقنا، لم نتمكّن من نشر قصّتك في الوقت الحالي.${reasonText}\nلا تتردّد في التواصل معنا إذا أردت مزيدًا من التفاصيل.\n\nفريق ${BRAND}`;
  return { subject: `بخصوص قصّة نجاحك على ${BRAND}`, html, text };
}

/** Sent to a member when the admin deletes their submitted success story. */
export function storyDeletedEmail(
  fullName: string,
  reason?: string,
): { subject: string; html: string; text: string } {
  const reasonBlock = reason
    ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">
         <strong style="color:#fff;">سبب الحذف:</strong> ${reason}
       </p>`
    : "";
  const reasonText = reason ? `\nسبب الحذف: ${reason}\n` : "";
  const html = shell(
    "بخصوص قصّتك على المنصّة",
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">مرحبًا ${fullName}،</p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">
       أودّ إعلامك بأنّ قصّة نجاحك التي قدّمتها إلى منصّة <strong style="color:#fff;">${BRAND}</strong> قد تمّ حذفها من قِبَل فريق الإدارة.
     </p>
     ${reasonBlock}
     <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">
       يمكنك التواصل معنا في أيّ وقت إذا كنت ترغب في مزيد من التفاصيل أو إعادة تقديم قصّتك.
     </p>
     <p style="margin:0;font-size:14px;line-height:1.7;color:#7c849c;">
       نحن دائمًا هنا لدعمك — فريق ${BRAND}.
     </p>`,
  );
  const text = `مرحبًا ${fullName}،\n\nنودّ إعلامك بأنّ قصّة نجاحك على منصّة ${BRAND} قد تمّ حذفها من قِبَل فريق الإدارة.${reasonText}\nتواصل معنا إذا أردت مزيدًا من التفاصيل.\n\nفريق ${BRAND}`;
  return { subject: `بخصوص قصّة نجاحك على ${BRAND}`, html, text };
}

/** A site-wide announcement the team broadcasts to members. Plain, honest — the
 *  title/body are authored by an admin; an optional CTA links deeper into the app. */
export function broadcastEmail(
  fullName: string | null,
  title: string,
  body: string,
  url?: string,
): { subject: string; html: string; text: string } {
  const greeting = fullName ? `مرحبًا ${fullName}،` : "مرحبًا،";
  // Escape the admin-authored strings — they are rendered as HTML, including
  // inside a quoted href attribute, so quotes MUST be escaped too or an admin
  // could inject extra attributes onto the <a> (attribute injection).
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const bodyHtml = esc(body).replace(/\n/g, "<br>");
  const cta =
    url && /^https?:\/\//i.test(url)
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
           <tr><td style="border-radius:10px;background:${PRIMARY};">
             <a href="${esc(url)}" style="display:inline-block;padding:13px 28px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">عرض التفاصيل</a>
           </td></tr>
         </table>`
      : "";
  const html = shell(
    esc(title),
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">${greeting}</p>
     <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#c7ccdc;">${bodyHtml}</p>
     ${cta}
     <p style="margin:8px 0 0;font-size:12px;line-height:1.7;color:#7c849c;">
       تصلك هذه الرسالة لأنّك عضو في ${BRAND}. يمكنك إيقاف رسائل الإعلانات من إعدادات الإشعارات في حسابك.
     </p>`,
  );
  const text = `${greeting}\n\n${title}\n\n${body}${url ? `\n\n${url}` : ""}\n\nتصلك هذه الرسالة لأنّك عضو في ${BRAND}. يمكنك إيقاف رسائل الإعلانات من إعدادات الإشعارات.`;
  return { subject: `${title} — ${BRAND}`, html, text };
}

const SLOT_LABELS_AR: Record<string, string> = {
  morning: "الصباح",
  midday: "منتصف النهار",
  afternoon: "المساء",
  fullday: "يوم كامل",
};

/** Sent to an expert when a booking that names them is confirmed by an admin. */
export function bookingConfirmedExpertEmail(
  expertName: string,
  visitorName: string,
  visitDate: string,
  timeSlot: string,
): { subject: string; html: string; text: string } {
  const slotLabel = SLOT_LABELS_AR[timeSlot] ?? timeSlot;
  const html = shell(
    "لديك حجز جديد 🗓️",
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">مرحبًا ${expertName}،</p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">
       أكّد أحد الزوّار رغبته في لقائك في <strong style="color:#fff;">${BRAND}</strong>.
       إليك تفاصيل الحجز:
     </p>
     <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;width:100%;border-collapse:collapse;">
       <tr>
         <td style="padding:10px 14px;background:#1a2040;border-radius:8px 8px 0 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#7c849c;font-size:13px;width:130px;">الزائر</td>
         <td style="padding:10px 14px;background:#1a2040;border-radius:8px 8px 0 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#e8eaf2;font-size:14px;font-weight:600;">${visitorName}</td>
       </tr>
       <tr>
         <td style="padding:10px 14px;background:#161b35;border-bottom:1px solid rgba(255,255,255,0.06);color:#7c849c;font-size:13px;">التاريخ</td>
         <td style="padding:10px 14px;background:#161b35;border-bottom:1px solid rgba(255,255,255,0.06);color:#e8eaf2;font-size:14px;direction:ltr;text-align:left;">${visitDate}</td>
       </tr>
       <tr>
         <td style="padding:10px 14px;background:#1a2040;border-radius:0 0 8px 8px;color:#7c849c;font-size:13px;">الوقت</td>
         <td style="padding:10px 14px;background:#1a2040;border-radius:0 0 8px 8px;color:#e8eaf2;font-size:14px;">${slotLabel}</td>
       </tr>
     </table>
     <p style="margin:0;font-size:13px;line-height:1.7;color:#7c849c;">
       سيتواصل معك فريق ${BRAND} إذا احتجت لأيّ تفاصيل إضافية.
     </p>`,
  );
  const text = `مرحبًا ${expertName}،\n\nلديك حجز جديد في ${BRAND}.\n\nالزائر: ${visitorName}\nالتاريخ: ${visitDate}\nالوقت: ${slotLabel}\n\nسيتواصل معك فريق ${BRAND} إذا احتجت لأيّ تفاصيل إضافية.\n\nفريق ${BRAND}`;
  return { subject: `🗓️ حجز جديد يذكرك — ${BRAND}`, html, text };
}

/** Sent to a mentee when an expert/admin confirms their mentorship session. */
export function sessionConfirmedEmail(
  fullName: string | null,
  expertName: string,
  topic: string,
): { subject: string; html: string; text: string } {
  const greeting = fullName ? `مرحبًا ${fullName}،` : "مرحبًا،";
  const html = shell(
    "تأكّدت جلسة الإرشاد ✅",
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">${greeting}</p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">
       أكّد الخبير <strong style="color:#fff;">${expertName}</strong> جلسة الإرشاد حول
       «<span style="color:#fff;">${topic}</span>».
     </p>
     <p style="margin:0;font-size:14px;line-height:1.7;color:#7c849c;">
       ستصلك تفاصيل الموعد قريبًا. جهّز أسئلتك لتحصل على أقصى فائدة من الجلسة.
     </p>`,
  );
  const text = `${greeting}\n\nأكّد الخبير ${expertName} جلسة الإرشاد حول «${topic}» في ${BRAND}.\nستصلك تفاصيل الموعد قريبًا.`;
  return { subject: `✅ تأكيد جلسة الإرشاد — ${BRAND}`, html, text };
}

/** A single line item in the daily digest (one piece of new community activity). */
export interface DigestSection {
  /** Section heading, e.g. "أعمال جديدة". */
  heading: string;
  /** Items in this section. `meta` is an optional muted sub-line. */
  items: Array<{ title: string; meta?: string }>;
}

/**
 * Daily community digest. Summarises the last 24h of new activity grouped into
 * sections. The caller guarantees at least one non-empty section (empty digests
 * are never sent), so this renders the sections it is given.
 */
export function dailyDigestEmail(
  fullName: string | null,
  sections: DigestSection[],
): { subject: string; html: string; text: string } {
  const greeting = fullName ? `مرحبًا ${fullName}،` : "مرحبًا،";

  const sectionsHtml = sections
    .filter((s) => s.items.length > 0)
    .map(
      (s) => `
     <div style="margin:0 0 24px;">
       <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#fff;border-right:3px solid ${PRIMARY};padding-right:10px;">${s.heading}</h2>
       ${s.items
         .map(
           (it) => `
       <div style="margin:0 0 10px;padding:12px 14px;background:#0a0e1a;border-radius:10px;border:1px solid rgba(255,255,255,0.06);">
         <p style="margin:0;font-size:14px;line-height:1.6;color:#e8eaf2;font-weight:600;">${it.title}</p>
         ${
           it.meta
             ? `<p style="margin:4px 0 0;font-size:12px;line-height:1.5;color:#7c849c;">${it.meta}</p>`
             : ""
         }
       </div>`,
         )
         .join("")}
     </div>`,
    )
    .join("");

  const html = shell(
    "ملخّص اليوم في المجتمع ✨",
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c7ccdc;">${greeting}</p>
     <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#c7ccdc;">
       إليك أبرز ما جدّ في ${BRAND} خلال الـ٢٤ ساعة الماضية.
     </p>
     ${sectionsHtml}
     <p style="margin:8px 0 0;font-size:12px;line-height:1.7;color:#7c849c;">
       تصلك هذه الرسالة لأنّك فعّلت «الملخّص اليوميّ». يمكنك إيقافه من إعدادات الإشعارات في حسابك.
     </p>`,
  );

  const textSections = sections
    .filter((s) => s.items.length > 0)
    .map(
      (s) =>
        `${s.heading}:\n` +
        s.items
          .map((it) => `  • ${it.title}${it.meta ? ` — ${it.meta}` : ""}`)
          .join("\n"),
    )
    .join("\n\n");
  const text = `${greeting}\n\nأبرز ما جدّ في ${BRAND} خلال الـ٢٤ ساعة الماضية:\n\n${textSections}\n\nتصلك هذه الرسالة لأنّك فعّلت «الملخّص اليوميّ». يمكنك إيقافه من إعدادات الإشعارات.`;

  return { subject: `✨ ملخّص اليوم — ${BRAND}`, html, text };
}
