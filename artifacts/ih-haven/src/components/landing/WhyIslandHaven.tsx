import { useRef } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * WhyIslandHaven — the incubator's thesis, told the Apple way: SCALE + SPACE +
 * RESTRAINT. One monumental headline on a dark canvas ("we don't give you hope —
 * we give you infrastructure", a single crimson word), then the three strategic
 * axes woven in as calm large prose — NOT a card deck. A single full-bleed
 * photograph closes it with the real goal overlaid. No eyebrow kicker, no
 * numbered ledger, no accent rails, no medallions, no aura blobs, no icon tiles.
 * Typography and acres of space carry the grandeur.
 */
export function WhyIslandHaven() {
  const { t, dir } = useLanguage();
  const reduce = useReducedMotion();

  const mediaRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: mediaRef,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-8%", "8%"]);

  // The three strategic axes — kept as data, but woven as calm prose, not a grid.
  const axes = [
    {
      id: "infrastructure",
      label: t({ ar: "نوفّر الأساس", en: "We provide the foundation" }),
      body: t({
        ar: "مساحة عمل احترافيّة، أرصدة سحابيّة وأدوات مدفوعة، وحلول دفع دوليّة — الأساس الذي يتعذّر الوصول إليه من غزّة، نسلّمه جاهزًا.",
        en: "A professional workspace, cloud credits and paid tooling, and international payment rails — the foundation that's out of reach from Gaza, handed over ready to use.",
      }),
    },
    {
      id: "development",
      label: t({ ar: "نبني القدرة", en: "We build the capability" }),
      body: t({
        ar: "تدريب مستمرّ، مسارات احتضان منظّمة، وذكاءٌ اصطناعيّ مدمجٌ في عمل كلّ منتسب — لا أملًا مؤجّلًا، بل قدرةً تُبنى يومًا بيوم.",
        en: "Continuous training, structured incubation tracks, and AI embedded in every member's work — not deferred hope, but capability built day by day.",
      }),
    },
    {
      id: "networking",
      label: t({ ar: "نفتح الباب على العالم", en: "We open the door to the world" }),
      body: t({
        ar: "روابط حقيقيّة بالعمل والتدريب والاستثمار خارج الحدود — المنفّذ الموثوق داخل غزّة، بأثرٍ يُقاس لا يُدّعى.",
        en: "Real connections to work, training and investment beyond the border — the trusted executor inside Gaza, with impact that's measured, not claimed.",
      }),
    },
  ];

  return (
    <section
      id="why-island-haven"
      className="relative bg-background overflow-hidden"
      style={{ paddingBlock: "clamp(6.5rem, 16vh, 12rem)" }}
      data-testid="why-island-haven"
    >
      <div className="container-ih relative">
        {/* ── The monumental thesis — one calm line, acres of space ── */}
        <motion.h2
          className="font-display text-foreground max-w-[18ch]"
          style={{
            fontSize: "clamp(2.6rem, 8.6vw, 6.25rem)",
            lineHeight: 1.0,
            letterSpacing: "-0.04em",
            fontWeight: 700,
          }}
        >
          <motion.span
            className="block will-change-transform"
            initial={reduce ? false : { opacity: 0, y: 30 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
          >
            {t({ ar: "لا نمنحك أملًا.", en: "We don't give you hope." })}
          </motion.span>
          <motion.span
            className="block will-change-transform"
            initial={reduce ? false : { opacity: 0, y: 30 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.85, delay: 0.1, ease: EASE_OUT_EXPO }}
          >
            {t({ ar: "نمنحك ", en: "We give you " })}
            <span className="text-primary">{t({ ar: "بنية.", en: "infrastructure." })}</span>
          </motion.span>
        </motion.h2>

        {/* ── The three axes, woven as calm large prose — one idea per row, but each
             with its own measure and offset so the cadence breaks: the first axis
             opens full-width and wide, the next two settle into an offset right-hand
             column. Not a grid, not numbered, no rails — woven, not listed. ── */}
        <div className="mt-[clamp(4rem,9vh,7.5rem)] space-y-[clamp(2.75rem,5vh,4.25rem)]">
          {axes.map((axis, i) => {
            // Vary measure + alignment per row to escape the uniform 3-row list.
            const isLead = i === 0;
            const rowClass = isLead ? "max-w-4xl me-auto" : "max-w-3xl ms-auto";
            const bodyClass = isLead ? "max-w-3xl" : "max-w-2xl";
            return (
              <motion.div
                key={axis.id}
                data-testid={`why-axis-${axis.id}`}
                className={`will-change-transform ${rowClass}`}
                initial={reduce ? false : { opacity: 0, y: 22 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.8, delay: i * 0.06, ease: EASE_OUT_EXPO }}
              >
                <h3
                  className="font-display text-foreground"
                  style={{
                    fontSize: isLead
                      ? "clamp(1.65rem, 3.4vw, 2.6rem)"
                      : "clamp(1.5rem, 3vw, 2.25rem)",
                    lineHeight: 1.08,
                    letterSpacing: "-0.025em",
                    fontWeight: 600,
                  }}
                >
                  {axis.label}
                </h3>
                <p
                  className={`mt-4 text-fg-secondary ${bodyClass}`}
                  style={{ fontSize: "clamp(1.0625rem, 1.6vw, 1.3rem)", lineHeight: 1.65 }}
                >
                  {axis.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── One full-bleed photograph, the goal overlaid calmly — the proof the
           thesis points to. Real photo, real number, no decoration. ── */}
      <motion.div
        ref={mediaRef}
        className="relative mt-[clamp(5rem,11vh,9rem)] w-full overflow-hidden"
        initial={reduce ? false : { opacity: 0 }}
        whileInView={reduce ? undefined : { opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1, ease: EASE_OUT_EXPO }}
      >
        <div className="relative h-[clamp(22rem,60vh,40rem)]">
          <motion.img
            src="/photos/IMG_8346.webp"
            alt={t({ ar: "العمل من داخل آيلاند هيفن في غزّة", en: "At work inside Island Haven, Gaza" })}
            loading="lazy"
            style={{ y: imgY }}
            className="absolute inset-x-0 top-[-9%] h-[118%] w-full object-cover will-change-transform"
          />
          {/* Calm legibility wash — start-anchored: the dark anchor follows the
              text, flipping the gradient angle in RTL so the Arabic headline +
              CTAs sit over the ≥0.55 region, never the transparent end. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `linear-gradient(${
                dir === "rtl" ? 270 : 90
              }deg, hsl(0 0% 4% / 0.92) 0%, hsl(0 0% 4% / 0.55) 45%, transparent 80%)`,
            }}
          />
          <div className="absolute inset-0 flex items-end">
            <div className="container-ih w-full pb-[clamp(2.5rem,6vh,5rem)]">
              <motion.p
                className="max-w-[24ch] text-white"
                style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.6rem)", lineHeight: 1.18, letterSpacing: "-0.02em", fontWeight: 600 }}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
              >
                {t({ ar: "نُعيد وصل ", en: "Reconnecting " })}
                <span className="text-sand tnum">{t({ ar: "١٬٠٠٠", en: "1,000" })}</span>
                {t({
                  ar: " موهبة غزّيّة بالاقتصاد الرقميّ العالميّ خلال ثلاث سنوات.",
                  en: " Gazan talents to the global digital economy within three years.",
                })}
              </motion.p>

              <motion.div
                className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4"
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.8, delay: 0.12, ease: EASE_OUT_EXPO }}
              >
                <Link
                  href="/apply"
                  data-testid="why-apply"
                  className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  {t({ ar: "ابدأ من هنا", en: "Start here" })}
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/book"
                  data-testid="why-book"
                  className="group inline-flex items-center gap-2 text-[14px] font-semibold text-white/85 hover:text-white transition-colors"
                >
                  {t({ ar: "احجز جولة في المساحة", en: "Book a visit to the space" })}
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
