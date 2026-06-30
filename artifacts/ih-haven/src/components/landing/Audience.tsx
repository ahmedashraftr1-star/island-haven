import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useContentSection } from "@/hooks/use-content";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { FREELANCERS } from "@/data/freelancers";

/**
 * Audience — "لِمَن آيلاند؟". Reframed for العظمة: scale, space, restraint.
 * One monumental calm headline on acres of room, a single large full-bleed
 * photograph, then the four real tracks as a quiet big-type editorial sequence
 * — no eyebrow kicker, no 01/02/03 numbered ledger, no cerulean index, no
 * medallions, no aura blob, no uniform card grid. Type and one image carry it.
 */
export function Audience() {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();
  // Preserve the CMS hook so the section stays editable from the content panel.
  const cms = useContentSection("audience", {});
  void cms;

  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const photoY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["8%", "-8%"]);

  const tracks = [
    {
      key: "graduates",
      title: t({ ar: "الخرّيجون", en: "Graduates" }),
      line: t({
        ar: "أوّل خطوة بعد الشهادة — مهارة تُكسبك الدخل، وبيئة تعمل فيها فعلًا بدل الانتظار.",
        en: "The first step after the diploma — a skill that earns, and a place to actually work instead of waiting.",
      }),
    },
    {
      key: "freelancers",
      title: t({ ar: "المستقلّون", en: "Freelancers" }),
      line: t({
        ar: "مقعدٌ ثابت بإنترنت وكهرباء، وحلول دفع دوليّة تصل بك إلى عميلك في الخارج.",
        en: "A reliable seat with internet and power, plus payment solutions that reach your client abroad.",
      }),
    },
    {
      key: "students",
      title: t({ ar: "طلبة الجامعات", en: "University students" }),
      line: t({
        ar: "تدريبٌ وإرشاد يبنيان مهارة سوق العمل قبل التخرّج، لا بعد فوات الفرصة.",
        en: "Training and mentorship that build a market-ready skill before graduation, not after the chance is gone.",
      }),
    },
    {
      key: "founders",
      title: t({ ar: "أصحاب الأفكار والمشاريع الناشئة", en: "Founders & idea-owners" }),
      line: t({
        ar: "مسارات احتضان منظّمة تحوّل الفكرة إلى مشروع قابل للحياة — حتى يوم العرض.",
        en: "Structured incubation that turns an idea into a viable venture — all the way to Demo Day.",
      }),
    },
  ];

  return (
    <section
      id="audience"
      ref={ref}
      className="relative bg-background overflow-hidden"
      style={{ paddingBlock: "clamp(6.5rem, 16vh, 12rem)" }}
    >
      <div className="container-ih relative">
        {/* Monumental opening — one calm idea, acres of space, no eyebrow. */}
        <div className="max-w-5xl">
          <motion.h2
            className="font-display text-foreground"
            style={{
              fontSize: "clamp(2.6rem, 7.6vw, 5rem)",
              lineHeight: 1.0,
              letterSpacing: "-0.04em",
              fontWeight: 700,
            }}
            initial={reduce ? false : { opacity: 0, y: 28 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
          >
            {t({ ar: "مكانٌ لكلّ ", en: "A place for every " })}
            <span className="text-primary">{t({ ar: "موهبة", en: "talent" })}</span>
            {t({ ar: ".", en: "." })}
          </motion.h2>

          <motion.p
            className="mt-9 sm:mt-11 max-w-2xl text-fg-secondary"
            style={{ fontSize: "clamp(1.1rem, 1.9vw, 1.5rem)", lineHeight: 1.6 }}
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.85, delay: 0.12, ease: EASE_OUT_EXPO }}
          >
            {t({
              ar: "الموهبة لا تحدّها الجغرافيا، ولا يحدّها الظرف. أربع فئات تجد مكانها هنا.",
              en: "Talent is bound neither by geography nor by circumstance. Four tracks find their place here.",
            })}
          </motion.p>

          {/* Talent cross-link — a quiet, compact bridge to the freelancer marketplace */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE_OUT_EXPO }}
            className="mt-10 sm:mt-12"
          >
            <Link
              href="/freelancers"
              className="group inline-flex items-center gap-4 rounded-[14px] border border-border-strong bg-surface-2/40 px-5 py-4 transition-colors hover:border-primary/40"
            >
              <span
                className="font-mono font-black text-sand-bright tnum leading-none"
                style={{ fontSize: "1.9rem" }}
              >
                {new Intl.NumberFormat(lang === "en" ? "en-US" : "ar-EG").format(FREELANCERS.length)}
              </span>
              <span className="text-start">
                <span className="block t-caption text-fg-secondary">
                  {t({ ar: "موهبة فريلانسر في الشبكة", en: "freelancers listed" })}
                </span>
                <span className="mt-0.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary">
                  {t({ ar: "استعرض المواهب", en: "Browse talent" })}
                  <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                </span>
              </span>
            </Link>
          </motion.div>
        </div>

        {/* One large, calm full-bleed photograph — restraint, not a card deck. */}
        <motion.figure
          className="relative mt-16 sm:mt-24 overflow-hidden rounded-[24px] ring-1 ring-border-strong"
          initial={reduce ? false : { opacity: 0, y: 30 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        >
          <motion.img
            src="/photos/IMG_8341.webp"
            alt={t({ ar: "أعضاء آيلاند هيفن في مساحة العمل بغزّة", en: "Island Haven members in the Gaza workspace" })}
            loading="lazy"
            style={{ y: photoY }}
            className="w-full aspect-[16/9] object-cover scale-110 will-change-transform"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/70 via-transparent to-transparent" />
        </motion.figure>

        {/* The four tracks — a quiet big-type editorial sequence, one idea per line.
            No numbers, no per-row eyebrows, no medallions, no uniform grid. */}
        <div className="mt-20 sm:mt-28 max-w-4xl">
          {tracks.map((track, i) => (
            <motion.div
              key={track.key}
              data-testid={`audience-track-${track.key}`}
              className="border-t border-border-strong py-9 sm:py-12 first:border-t-0 first:pt-0"
              initial={reduce ? false : { opacity: 0, y: 22 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, delay: i * 0.06, ease: EASE_OUT_EXPO }}
            >
              <h3
                className="font-display text-foreground"
                style={{
                  fontSize: "clamp(1.6rem, 3.4vw, 2.6rem)",
                  lineHeight: 1.08,
                  letterSpacing: "-0.03em",
                  fontWeight: 700,
                }}
              >
                {track.title}
              </h3>
              <p
                className="mt-4 max-w-2xl text-fg-secondary"
                style={{ fontSize: "clamp(1rem, 1.5vw, 1.2rem)", lineHeight: 1.6 }}
              >
                {track.line}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
