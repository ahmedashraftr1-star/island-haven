import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { CinematicMedia } from "@/components/landing/CinematicMedia";
import { imageUrl } from "@/hooks/use-content";

/**
 * WhyIslandHaven — the incubator's thesis, with the momentum set right: the
 * EMOTIONAL full-bleed photograph LEADS, carrying the real goal as a monumental
 * headline living on the frame (a single crimson word), with the CTAs. THEN the
 * three strategic axes follow as calm, premium dark cards — de-densified to
 * title + body, crimson/gold accents, roomy. Big, bold, dark-cinematic power.
 */
export function WhyIslandHaven() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  // The three strategic axes — clean premium cards, title + body only.
  const axes = [
    {
      id: "infrastructure",
      tag: "Infrastructure",
      label: t({ ar: "نوفّر الأساس", en: "We provide the foundation" }),
      body: t({
        ar: "مساحة عمل احترافيّة، أرصدة سحابيّة وأدوات مدفوعة، وحلول دفع دوليّة — الأساس الذي يتعذّر الوصول إليه من غزّة، نسلّمه جاهزًا.",
        en: "A professional workspace, cloud credits and paid tooling, and international payment rails — the foundation that's out of reach from Gaza, handed over ready to use.",
      }),
    },
    {
      id: "development",
      tag: "Mentorship",
      label: t({ ar: "نبني القدرة", en: "We build the capability" }),
      body: t({
        ar: "تدريب مستمرّ، مسارات احتضان منظّمة، وذكاءٌ اصطناعيّ مدمجٌ في عمل كلّ منتسب — لا أملًا مؤجّلًا، بل قدرةً تُبنى يومًا بيوم.",
        en: "Continuous training, structured incubation tracks, and AI embedded in every member's work — not deferred hope, but capability built day by day.",
      }),
    },
    {
      id: "networking",
      tag: "Global Access",
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
      className="relative bg-[#060608] text-white border-t border-white/[0.06]"
      data-testid="why-island-haven"
    >
      {/* ── LEAD: the emotional full-bleed photograph, the real goal overlaid as
           the monumental headline with the CTAs. The proof leads, not trails. ── */}
      <CinematicMedia
        as="div"
        src={imageUrl("/photos/IMG_8346.webp")}
        alt={t({ ar: "العمل من داخل آيلاند هيفن في غزّة", en: "At work inside Island Haven, Gaza" })}
        scrim="heavy"
        sideScrim
        aria-label={t({ ar: "هدف آيلاند هيفن", en: "The Island Haven goal" })}
      >
        <div className="container-ih flex min-h-[clamp(30rem,78vh,46rem)] flex-col justify-end pb-[clamp(3rem,8vh,6rem)] pt-[clamp(6rem,14vh,10rem)]">
          <motion.h2
            className="font-display max-w-[19ch] text-white"
            style={{
              fontSize: "clamp(2.4rem, 5vw, 4.5rem)",
              fontWeight: 900,
              lineHeight: 0.98,
              letterSpacing: "-0.05em",
            }}
            initial={reduce ? false : { opacity: 0, y: 30 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
          >
            {t({ ar: "نُعيد وصل ", en: "Reconnecting " })}
            <span className="text-primary tnum">{t({ ar: "١٬٠٠٠", en: "1,000" })}</span>
            {t({
              ar: " موهبة غزّيّة بالاقتصاد الرقميّ العالميّ خلال ثلاث سنوات.",
              en: " Gazan talents to the global digital economy within three years.",
            })}
          </motion.h2>

          <motion.p
            className="mt-6 max-w-[42ch] text-[clamp(1rem,1.4vw,1.2rem)] leading-relaxed text-white/70"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT_EXPO }}
          >
            {t({
              ar: "لا نمنحك أملًا — نمنحك بنية.",
              en: "We don't give you hope — we give you infrastructure.",
            })}
          </motion.p>

          <motion.div
            className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE_OUT_EXPO }}
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
      </CinematicMedia>

      {/* ── BELOW: the three strategic axes as clean premium dark cards. How the
           goal above is actually delivered — de-densified, roomy, restrained. ── */}
      <div className="container-ih" style={{ paddingBlock: "clamp(3.5rem, 8vh, 6rem)" }}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {axes.map((axis, i) => (
            <motion.div
              key={axis.id}
              data-testid={`why-axis-${axis.id}`}
              className="group flex flex-col gap-4 rounded-[20px] border border-white/12 bg-white/[0.04] p-8 transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.06] motion-reduce:transition-none will-change-transform"
              initial={reduce ? false : { opacity: 0, y: 22 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: EASE_OUT_EXPO }}
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-sand">
                {axis.tag}
              </span>
              <h3
                className="font-display font-semibold text-white leading-tight"
                style={{ fontSize: "clamp(1.3rem,2vw,1.7rem)", letterSpacing: "-0.02em" }}
              >
                {axis.label}
              </h3>
              <p className="text-[15px] leading-relaxed text-white/60">{axis.body}</p>
              <div
                aria-hidden
                className="mt-auto h-px w-0 bg-primary transition-[width] duration-500 ease-out group-hover:w-full motion-reduce:transition-none"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
