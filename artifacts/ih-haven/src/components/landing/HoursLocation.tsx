import { Link } from "wouter";
import { ArrowLeft, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { GazaPulseMap } from "./GazaPulseMap";
import { OpeningHours } from "./OpeningHours";
import { useContentSection, imageUrl } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * HoursLocation — "Visit us", reframed as a PREMIUM LIGHT breather.
 *
 * This section deliberately breaks the run of dark cinematic chapters: it flips to
 * the warm-white `theme-light` register (Apple product-page: bright, crisp, acres
 * of whitespace) so the eye rests before the page closes. The photograph is no
 * longer a full-bleed dark plate — it's a clean, softly-shadowed FRAMED product
 * shot sitting on white, its caption legible behind a small local scrim only. The
 * opening-hours dial keeps its own crafted light treatment (and day testids); the
 * place reads as a calm 2-column: framed photo beside address, status, coords and
 * CTAs — all on light tokens, no glass, no serif. Keeps id="visit", the child
 * components + their testids, the content fetch, routes and forms.
 */
export function HoursLocation() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  // The CMS "hours" section only ships the Arabic fields (titleA/titleB/…),
  // never their EN counterparts — so we mirror the about-section pattern:
  // the Arabic comes from the CMS (or the AR fallback here), and a static EN
  // fallback (…En) carries English until the CMS grows those fields. If the CMS
  // later adds e.g. titleAEn, it wins automatically via the override merge.
  const FALLBACK = {
    titleA: "تابعنا، سجّل،",
    titleAEn: "Follow us, sign up,",
    titleB: "أو",
    titleBEn: "or",
    titleAccent: "زرنا.",
    titleAccentEn: "visit us.",
    sub: "نحن متواجدون على كلّ المنصّات الرئيسيّة. اختر القناة التي تناسبك واختبر المساحة قبل أن تقرّر.",
    subEn: "We're on every major platform. Choose your channel and get a feel for the space before you decide.",
    locationTitle: "في قلب غزّة، على ضفّة المتوسّط.",
    locationTitleEn: "In the heart of Gaza, on the shores of the Mediterranean.",
    locationBody:
      "المساحة في موقع آمن ومركزيّ نُرسله عبر الرسائل الخاصّة بعد تأكيد الانتساب. النقطة النابضة على الخريطة تدلّ على الحيّ تقريباً — لا الإحداثيّات الدقيقة.",
    locationBodyEn:
      "The space is in a secure, central location — we share the exact address privately after your membership is confirmed. The pulsing dot on the map shows the approximate neighbourhood.",
    locationStatus: "مفتوح الآن للزوّار بموعد مسبق",
    locationStatusEn: "Open now for visitors with an appointment",
    locationCoords: "٣١.٥٠° ش · ٣٤.٤٧° شرق",
    locationCoordsEn: "31.50° N · 34.47° E",
    photo: "/photos/IMG_8353.webp",
  };

  const c = useContentSection("hours", FALLBACK);

  return (
    <section
      id="visit"
      className="theme-light section-y relative bg-background text-foreground border-y border-border overflow-hidden"
    >
      <div className="container-ih relative">
        {/* ── Header — one calm monumental line, one crimson word, on white ── */}
        <header className="max-w-4xl">
          <h2
            className="font-display text-foreground"
            style={{
              fontSize: "clamp(2.4rem, 5vw, 4.5rem)",
              fontWeight: 900,
              lineHeight: "var(--lh-display)",
              letterSpacing: "-0.04em",
            }}
          >
            {[
              t({ ar: c.titleA, en: c.titleAEn }),
              t({ ar: c.titleB, en: c.titleBEn }),
              <span key="accent" className="text-primary">{t({ ar: c.titleAccent, en: c.titleAccentEn })}</span>,
            ].map((ln, i) => (
              <motion.span
                key={i}
                className="block will-change-transform"
                initial={reduce ? false : { opacity: 0, y: 30 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.85, delay: i * 0.09, ease: EASE_OUT_EXPO }}
              >
                {ln}
              </motion.span>
            ))}
          </h2>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.85, delay: 0.42, ease: EASE_OUT_EXPO }}
            className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-2xl text-fg-secondary"
            style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
          >
            {t({ ar: c.sub, en: c.subEn })}
          </motion.p>
        </header>

        {/* Opening hours — the dial keeps its own crafted light treatment + day testids */}
        <div className="mt-[clamp(3.5rem,7vw,6rem)]">
          <OpeningHours />
        </div>

        {/* ── The place — Apple product-shot: a clean FRAMED photograph beside a
             calm address / status / coords / CTA column. Bright, aligned, airy. ── */}
        <div className="mt-[clamp(4rem,8vw,7rem)] grid grid-cols-1 lg:grid-cols-2 gap-[clamp(2.5rem,5vw,4.5rem)] items-center">
          {/* Framed image — soft shadow on white, rounded corners, caption scrim only. */}
          <motion.figure
            className="relative w-full"
            initial={reduce ? false : { opacity: 0, y: 26 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
          >
            <div className="relative overflow-hidden rounded-[24px] bg-surface-2 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_20px_50px_-20px_rgba(16,24,40,0.22)]">
              <img
                src={imageUrl(c.photo)}
                alt={t({ ar: "مساحة آيلاند هيفن في غزّة", en: "The Island Haven space in Gaza" })}
                loading="lazy"
                className="w-full aspect-[4/3] object-cover object-center"
              />
              {/* Small local scrim ONLY behind the caption so it stays legible. */}
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1/3"
                style={{ background: "linear-gradient(0deg, hsl(0 0% 4% / 0.62) 0%, transparent 100%)" }}
              />
              <figcaption className="absolute inset-x-0 bottom-0 p-[clamp(1.25rem,3vw,2rem)]">
                <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse" />
                  {t({ ar: c.locationStatus, en: c.locationStatusEn })}
                </div>
              </figcaption>
            </div>
          </motion.figure>

          {/* Address / status / coords / CTAs — clean dark ink on white. */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 22 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.9, delay: 0.1, ease: EASE_OUT_EXPO }}
          >
            <h3
              className="font-display text-foreground whitespace-pre-line"
              style={{ fontSize: "clamp(1.6rem, 3.4vw, 2.75rem)", lineHeight: 1.12, letterSpacing: "-0.025em", fontWeight: 800 }}
            >
              {t({ ar: c.locationTitle, en: c.locationTitleEn })}
            </h3>

            <p
              className="mt-5 max-w-xl text-fg-secondary whitespace-pre-line"
              style={{ fontSize: "clamp(1.0625rem, 1.6vw, 1.25rem)", lineHeight: 1.65 }}
            >
              {t({ ar: c.locationBody, en: c.locationBodyEn })}
            </p>

            {/* Quiet co-ordinate line — the hand-drawn map reads as a mark beside
                the live status and coords, on light tokens. Not a card. */}
            <div className="mt-8 flex items-center gap-5">
              <GazaPulseMap className="w-16 h-16 shrink-0" />
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  {t({ ar: c.locationStatus, en: c.locationStatusEn })}
                </div>
                <div className="mt-1.5 text-[13px] font-mono tnum text-fg-faint">{t({ ar: c.locationCoords, en: c.locationCoordsEn })}</div>
              </div>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link
                href="/apply"
                data-testid="visit-apply"
                className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
              >
                {t({ ar: "انتسب لتعرف العنوان", en: "Join to get the address" })}
                <ArrowLeft className="w-4 h-4 ltr:rotate-180 transition-transform rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
              </Link>
              <Link
                href="/contact"
                data-testid="visit-contact"
                className="group inline-flex items-center gap-2 text-[14px] font-semibold text-fg-secondary hover:text-foreground transition-colors"
              >
                <MapPin className="w-4 h-4 text-primary" />
                {t({ ar: "اسأل عن الزيارة", en: "Ask about visiting" })}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
