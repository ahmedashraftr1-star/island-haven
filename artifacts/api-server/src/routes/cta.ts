import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, siteSettingsTable } from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { writeAudit, auditActor } from "../lib/audit";
import { logger } from "../lib/logger";
import { z } from "zod";

const router: IRouter = Router();

// ─── Homepage CTA buttons — fully owner-controllable from the panel ───────────
// Stored as ONE jsonb blob under the existing `site_settings` key below (no new
// table, no migration). An empty/missing row means the site renders exactly its
// current defaults, so nothing breaks if the owner never touches it.
const CTA_KEY = "homepage_cta";

export interface CtaButton {
  labelAr: string;
  labelEn: string;
  href: string;
  visible: boolean;
  registrationOpen: boolean;
  closedTitleAr: string;
  closedTitleEn: string;
  closedBodyAr: string;
  closedBodyEn: string;
  // Shown in the closed-registration notice: the official upcoming dates and the
  // membership conditions, each editable from the panel.
  closedDatesAr: string;
  closedDatesEn: string;
  closedConditionsAr: string;
  closedConditionsEn: string;
}
// A third, OPTIONAL promotional button — fully owner-controlled from the panel
// for events/offers: text, destination, a style variant, and an optional
// start/end window (auto shows/hides). Off by default.
export const PROMO_VARIANTS = ["gold", "solid", "glass", "gradient"] as const;
export type PromoVariant = (typeof PROMO_VARIANTS)[number];
export interface PromoButton {
  labelAr: string;
  labelEn: string;
  href: string;
  visible: boolean;
  variant: PromoVariant;
  startAt: string | null; // ISO date (inclusive) or null = no lower bound
  endAt: string | null; // ISO date (inclusive) or null = no upper bound
}
export interface CtaConfig {
  primary: CtaButton;
  guest: CtaButton;
  promo: PromoButton;
}

// Defaults MIRROR the current hardcoded Hero behaviour, so an untouched site is
// byte-identical to before this feature.
export const DEFAULT_CTA: CtaConfig = {
  primary: {
    labelAr: "قدّم على الحاضنة",
    labelEn: "Apply to Island Haven",
    href: "/apply",
    visible: true,
    registrationOpen: true,
    closedTitleAr: "التسجيل مغلق حاليًّا",
    closedTitleEn: "Registration is currently closed",
    closedBodyAr:
      "سيُفتح التسجيل في الدورة القادمة. تابِعنا لمعرفة المواعيد الرسميّة، وتأكّد من استيفاء شروط الانتساب.",
    closedBodyEn:
      "Registration opens for the next cohort. Follow us for the official dates and make sure you meet the membership requirements.",
    closedDatesAr: "دورة الخريف ٢٠٢٦: يفتح التسجيل ١ أيلول ويغلق ٣٠ أيلول.",
    closedDatesEn: "Autumn 2026 cohort: registration opens Sep 1 and closes Sep 30.",
    closedConditionsAr:
      "أن تكون من غزّة · عمر ١٨+ · فكرة أو مشروع تقنيّ · التفرّغ لحضور جلسات الدفعة.",
    closedConditionsEn:
      "Based in Gaza · 18+ · a tech idea or venture · availability to attend the cohort sessions.",
  },
  guest: {
    labelAr: "احجز مقعدك",
    labelEn: "Book your seat",
    href: "/book",
    visible: true,
    registrationOpen: true,
    closedTitleAr: "الحجز مغلق حاليًّا",
    closedTitleEn: "Booking is currently closed",
    closedBodyAr: "حجز مقاعد الضيوف مغلق مؤقّتًا. تابِعنا لمعرفة مواعيد إعادة الفتح.",
    closedBodyEn: "Guest seat booking is temporarily closed. Follow us for reopening dates.",
    closedDatesAr: "يُعاد فتح حجز مقاعد الضيوف مع بداية الفصل القادم.",
    closedDatesEn: "Guest seat booking reopens at the start of the next term.",
    closedConditionsAr: "زيارة تعريفيّة لمساحة العمل · بلا رسوم.",
    closedConditionsEn: "An intro visit to the workspace · free of charge.",
  },
  promo: {
    labelAr: "",
    labelEn: "",
    href: "",
    visible: false, // off until the owner turns it on for an event/offer
    variant: "gold",
    startAt: null,
    endAt: null,
  },
};

// Same URL/path safety rule the content editor uses: relative paths, mailto/tel,
// or http(s) absolute URLs only — never javascript: or other schemes.
function isSafeUrlOrPath(v: string): boolean {
  if (v === "") return true;
  if (v.startsWith("/")) return true;
  if (/^(mailto:|tel:)/i.test(v)) return true;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const buttonSchema = z.object({
  labelAr: z.string().max(120),
  labelEn: z.string().max(120),
  href: z.string().max(500).refine(isSafeUrlOrPath, "رابط غير صالح"),
  visible: z.boolean(),
  registrationOpen: z.boolean(),
  closedTitleAr: z.string().max(200),
  closedTitleEn: z.string().max(200),
  closedBodyAr: z.string().max(4000),
  closedBodyEn: z.string().max(4000),
  closedDatesAr: z.string().max(2000),
  closedDatesEn: z.string().max(2000),
  closedConditionsAr: z.string().max(2000),
  closedConditionsEn: z.string().max(2000),
});
const promoSchema = z.object({
  labelAr: z.string().max(120),
  labelEn: z.string().max(120),
  href: z.string().max(500).refine(isSafeUrlOrPath, "رابط غير صالح"),
  visible: z.boolean(),
  variant: z.enum(PROMO_VARIANTS),
  startAt: z.string().max(40).nullable(),
  endAt: z.string().max(40).nullable(),
});
const ctaSchema = z.object({ primary: buttonSchema, guest: buttonSchema, promo: promoSchema });

// Merge a stored (possibly partial / legacy) blob over the defaults so the shape
// is always complete and safe, even if a field was added after a row was saved.
function mergeCta(stored: unknown): CtaConfig {
  const s = (stored ?? {}) as {
    primary?: Partial<CtaButton>;
    guest?: Partial<CtaButton>;
    promo?: Partial<PromoButton>;
  };
  return {
    primary: { ...DEFAULT_CTA.primary, ...(s.primary ?? {}) },
    guest: { ...DEFAULT_CTA.guest, ...(s.guest ?? {}) },
    promo: { ...DEFAULT_CTA.promo, ...(s.promo ?? {}) },
  };
}

async function readCta(): Promise<CtaConfig> {
  const [row] = await db
    .select({ value: siteSettingsTable.value })
    .from(siteSettingsTable)
    .where(sql`${siteSettingsTable.key} = ${CTA_KEY}`)
    .limit(1);
  return mergeCta(row?.value);
}

// GET /site/cta — public: what the homepage renders (merged with defaults).
router.get("/site/cta", async (_req, res) => {
  try {
    res.json({ cta: await readCta() });
  } catch (err) {
    logger.error({ err }, "GET /site/cta failed");
    // Never break the homepage over a settings read — fall back to defaults.
    res.json({ cta: DEFAULT_CTA });
  }
});

// GET /admin/cta — admin editor: current config + the defaults (for a reset).
router.get("/admin/cta", requireAdmin, async (_req, res) => {
  try {
    res.json({ cta: await readCta(), defaults: DEFAULT_CTA });
  } catch (err) {
    logger.error({ err }, "GET /admin/cta failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// PUT /admin/cta — save the full config (both buttons). Validated + audited.
router.put("/admin/cta", requireAdmin, async (req, res) => {
  const parsed = ctaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "قيمة غير صالحة",
      details: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
    return;
  }
  try {
    const value = parsed.data;
    await db
      .insert(siteSettingsTable)
      .values({ key: CTA_KEY, value })
      .onConflictDoUpdate({
        target: siteSettingsTable.key,
        set: { value, updatedAt: sql`now()` },
      });
    void writeAudit({
      actor: auditActor(req),
      action: "cta_updated",
      targetType: "cta",
      newValue: `primary:${value.primary.visible ? "on" : "off"}/${value.primary.registrationOpen ? "open" : "closed"} · guest:${value.guest.visible ? "on" : "off"}/${value.guest.registrationOpen ? "open" : "closed"} · promo:${value.promo.visible ? "on" : "off"}(${value.promo.variant})`,
    });
    res.json({ ok: true, cta: value });
  } catch (err) {
    logger.error({ err }, "PUT /admin/cta failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
