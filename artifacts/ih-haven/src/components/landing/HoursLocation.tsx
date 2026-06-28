import { useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, MapPin } from "lucide-react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { GazaPulseMap } from "./GazaPulseMap";
import { OpeningHours } from "./OpeningHours";
import { useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * HoursLocation — "Visit us", told in the homepage's monumental editorial voice.
 *
 * Grandeur pass: SCALE + SPACE + RESTRAINT. One calm, oversized headline with a
 * single crimson word opens the chapter — no eyebrow kicker, no aura blob. The
 * OpeningHours dial keeps its own crafted treatment (and day testids). The place
 * is no longer a packed two-card deck: it's a single full-bleed photograph of the
 * real space, with the address line and CTA overlaid calmly, and the hand-drawn
 * GazaPulseMap reading as a quiet co-ordinate beside the prose — not boxed, not
 * chipped, not floating on a void. Keeps id="visit", the child components + their
 * testids, the content fetch, routes and forms.
 */
export function HoursLocation() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  const mediaRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: mediaRef,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-8%", "8%"]);

  const FALLBACK = {
    label: t({ ar: "كل الأبواب مفتوحة", en: "Every door is open" }),
    titleA: t({ ar: "زرنا.", en: "Visit us." }),
    titleB: t({ ar: "اعرف أين", en: "Find out where" }),
    titleAccent: t({ ar: "نحن.", en: "we are." }),
    sub: t({
      ar: "ساعات العمل، الموقع، وكلّ ما تحتاج معرفته قبل أن تأتي.",
      en: "Opening hours, our location, and everything you need to know before you come.",
    }),
    locationEyebrow: t({ ar: "Where we are · أين نحن", en: "Where we are · أين نحن" }),
    locationTitle: t({
      ar: "في قلب غزّة، على ضفّة المتوسّط.",
      en: "In the heart of Gaza, on the Mediterranean shore.",
    }),
    locationBody: t({
      ar: "المساحة في موقع آمن ومركزيّ نُرسله عبر الرسائل الخاصّة بعد تأكيد الانتساب.",
      en: "The space sits in a safe, central location we share by private message once your membership is confirmed.",
    }),
    locationStatus: t({
      ar: "مفتوح الآن للزوّار بموعد مسبق",
      en: "Open now for visitors with an appointment",
    }),
    locationCoords: t({
      ar: "٣١.٥٠° ش · ٣٤.٤٧° شرق",
      en: "31.50° N · 34.47° E",
    }),
  };

  const c = useContentSection("hours", FALLBACK);

  return (
    <section
      id="visit"
      className="relative bg-background overflow-hidden"
      style={{ paddingBlock: "clamp(6.5rem, 16vh, 12rem)" }}
    >
      <div className="container-ih relative">
        {/* ── Monumental header — one calm line, one crimson word, acres of space ── */}
        <header className="max-w-4xl">
          <h2
            className="font-display text-foreground"
            style={{
              fontSize: "clamp(2.6rem, 7.4vw, 5rem)",
              lineHeight: 1.0,
              letterSpacing: "-0.04em",
              fontWeight: 700,
            }}
          >
            {[
              c.titleA,
              c.titleB,
              <span key="accent" className="text-primary">{c.titleAccent}</span>,
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
            {c.sub}
          </motion.p>
        </header>

        {/* Opening hours — the dial keeps its own crafted treatment + day testids */}
        <div className="mt-[clamp(3.5rem,7vw,6rem)]">
          <OpeningHours />
        </div>
      </div>

      {/* ── The place — one full-bleed photograph of the real space, the address
           line and CTA overlaid calmly. No card deck, no chips, no boxed map. ── */}
      <motion.div
        ref={mediaRef}
        className="relative mt-[clamp(4.5rem,9vw,8rem)] w-full overflow-hidden"
        initial={reduce ? false : { opacity: 0 }}
        whileInView={reduce ? undefined : { opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1, ease: EASE_OUT_EXPO }}
      >
        <div className="relative h-[clamp(26rem,72vh,46rem)]">
          <motion.img
            src="/photos/IMG_8353.webp"
            alt={t({ ar: "مساحة آيلاند هيفن في غزّة", en: "The Island Haven space in Gaza" })}
            loading="lazy"
            style={{ y: imgY }}
            className="absolute inset-0 h-[118%] w-full object-cover object-center will-change-transform"
          />
          {/* Calm legibility wash — start-aligned, not a centered card. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, hsl(225 44% 5% / 0.94) 0%, hsl(225 44% 5% / 0.6) 46%, transparent 82%)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/2"
            style={{ background: "linear-gradient(0deg, hsl(225 44% 5% / 0.55) 0%, transparent 100%)" }}
          />

          <div className="absolute inset-0 flex items-end">
            <div className="container-ih w-full pb-[clamp(2.5rem,6vh,5rem)]">
              <div className="max-w-2xl">
                <motion.h3
                  className="font-display text-white whitespace-pre-line"
                  style={{ fontSize: "clamp(1.6rem, 3.4vw, 2.75rem)", lineHeight: 1.12, letterSpacing: "-0.025em", fontWeight: 700 }}
                  initial={reduce ? false : { opacity: 0, y: 22 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
                >
                  {c.locationTitle}
                </motion.h3>

                <motion.p
                  className="mt-5 max-w-xl text-white/70 whitespace-pre-line"
                  style={{ fontSize: "clamp(1.0625rem, 1.6vw, 1.25rem)", lineHeight: 1.65 }}
                  initial={reduce ? false : { opacity: 0, y: 18 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.85, delay: 0.1, ease: EASE_OUT_EXPO }}
                >
                  {c.locationBody}
                </motion.p>

                {/* Quiet co-ordinate line — the hand-drawn map reads as a mark
                    beside the address, status and coords. Not boxed, not chipped. */}
                <motion.div
                  className="mt-8 flex items-center gap-5"
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.8, delay: 0.18, ease: EASE_OUT_EXPO }}
                >
                  <GazaPulseMap className="w-16 h-16 shrink-0 opacity-90" />
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-white/90">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-2 animate-pulse" />
                      {c.locationStatus}
                    </div>
                    <div className="mt-1.5 text-[13px] font-mono tnum text-white/55">{c.locationCoords}</div>
                  </div>
                </motion.div>

                <motion.div
                  className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4"
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.8, delay: 0.26, ease: EASE_OUT_EXPO }}
                >
                  <Link
                    href="/apply"
                    data-testid="visit-apply"
                    className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    {t({ ar: "انتسب لتعرف العنوان", en: "Join to get the address" })}
                    <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/contact"
                    data-testid="visit-contact"
                    className="group inline-flex items-center gap-2 text-[14px] font-semibold text-white/85 hover:text-white transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-primary" />
                    {t({ ar: "اسأل عن الزيارة", en: "Ask about visiting" })}
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
