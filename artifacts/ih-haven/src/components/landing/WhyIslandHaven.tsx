import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * WhyIslandHaven — "لماذا آيلاند؟ / Why Island Haven" told as the incubator's
 * thesis: we don't hand out hope, we hand over infrastructure. A light editorial
 * section (warm-white canvas, deep-navy ink, crimson accents — inherited from the
 * page's .) with a serif font-editorial header carrying one italic
 * crimson accent word, then the THREE STRATEGIC AXES as a strong asymmetric
 * layout: a sticky thesis column on one side, and the axes as numbered (٠١/٠٢/٠٣
 * in cerulean) card-base panels with depth on the other. No icon-tile grids, no
 * glass, no gradient text — typography + a single hairline ledger carry it.
 */
export function WhyIslandHaven() {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();

  const idx = (i: number) =>
    lang === "en" ? String(i + 1).padStart(2, "0") : ["٠١", "٠٢", "٠٣"][i];

  const axes = [
    {
      id: "infrastructure",
      title: t({ ar: "البنية التحتيّة والحلول", en: "Infrastructure & solutions" }),
      body: t({
        ar: "مساحة عمل احترافيّة، أرصدة سحابيّة وأدوات مدفوعة، وحلول دفع دوليّة — الأساس الذي يتعذّر الوصول إليه من غزّة، نوفّره جاهزًا.",
        en: "A professional workspace, cloud credits and paid tooling, and international payment rails — the foundation that's out of reach from Gaza, handed over ready to use.",
      }),
      points: [
        t({ ar: "مساحة عمل احترافيّة", en: "Professional workspace" }),
        t({ ar: "أرصدة سحابيّة وأدوات", en: "Cloud credits & tools" }),
        t({ ar: "حلول دفع دوليّة", en: "Global payment rails" }),
      ],
    },
    {
      id: "development",
      title: t({ ar: "التطوير والابتكار", en: "Development & innovation" }),
      body: t({
        ar: "تدريب مستمرّ، مسارات احتضان منظّمة، وذكاءٌ اصطناعيّ مدمجٌ في عمل كلّ منتسب — لا أملًا مؤجّلًا، بل قدرةً تُبنى يومًا بيوم.",
        en: "Continuous training, structured incubation tracks, and AI embedded in every member's work — not deferred hope, but capability built day by day.",
      }),
      points: [
        t({ ar: "تدريب مستمرّ", en: "Continuous training" }),
        t({ ar: "مسارات احتضان منظّمة", en: "Structured incubation" }),
        t({ ar: "ذكاء اصطناعيّ مدمج", en: "AI embedded in the work" }),
      ],
    },
    {
      id: "networking",
      title: t({ ar: "التشبيك والتأثير العالميّ", en: "Networking & global impact" }),
      body: t({
        ar: "روابط حقيقيّة بالعمل والتدريب والاستثمار خارج الحدود — المنفّذ الموثوق داخل غزّة، بأثرٍ يُقاس لا يُدّعى.",
        en: "Real connections to work, training and investment beyond the border — the trusted executor inside Gaza, with impact that's measured, not claimed.",
      }),
      points: [
        t({ ar: "روابط عمل واستثمار", en: "Work & investment links" }),
        t({ ar: "المنفّذ الموثوق في غزّة", en: "The trusted executor in Gaza" }),
        t({ ar: "أثرٌ يُقاس", en: "Measured impact" }),
      ],
    },
  ];

  return (
    <section id="why-island-haven" className="relative bg-background section-y overflow-hidden">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[40%] brand-aura opacity-50" />

      <div className="container-ih relative">
        <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5.5rem)] gap-y-14 items-start">
          {/* ── Thesis column — the differentiator, stated plainly ── */}
          <Reveal as="div" className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-9 bg-primary/50" />
              <span className="text-[11px] tracking-[0.22em] uppercase text-primary font-bold rtl:tracking-normal">
                {t({ ar: "لماذا آيلاند؟", en: "Why Island Haven" })}
              </span>
            </div>

            <h2
              className="font-editorial text-foreground"
              style={{ fontSize: "clamp(2rem, 4.4vw, 3.5rem)", lineHeight: 1.04, letterSpacing: "-0.02em", fontWeight: 600 }}
            >
              {t({ ar: "لا نعطيك أملًا — نعطيك ", en: "We don't give you hope — we give you " })}
              <span className="italic text-primary">{t({ ar: "بنية.", en: "infrastructure." })}</span>
            </h2>

            <p className="t-body-lg mt-6 max-w-md">
              {t({
                ar: "ثلاثة محاور استراتيجيّة تُحوّل الموهبة في غزّة إلى ناتجٍ عالميّ: نوفّر الأساس، نبني القدرة، ونفتح الباب على العالم.",
                en: "Three strategic axes that turn talent in Gaza into global output: we provide the foundation, build the capability, and open the door to the world.",
              })}
            </p>

            <div className="group mt-8 overflow-hidden rounded-[20px] ring-1 ring-border-strong shadow-soft">
              <img
                src="/photos/IMG_8346.webp"
                alt={t({ ar: "العمل من داخل آيلاند هيفن في غزّة", en: "At work inside Island Haven, Gaza" })}
                loading="lazy"
                className="w-full aspect-[5/4] object-cover saturate-[1.03] transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none will-change-transform group-hover:scale-[1.045]"
              />
            </div>

            {/* The goal — the proof the thesis points to */}
            <div className="mt-7 border-t border-border-strong pt-6">
              <p className="t-body max-w-md">
                {t({
                  ar: "هدفنا: إعادة وصل ",
                  en: "Our goal: reconnect ",
                })}
                <span className="font-bold text-sand tnum">{t({ ar: "١٬٠٠٠", en: "1,000" })}</span>
                {t({
                  ar: " موهبة غزّيّة بالاقتصاد الرقميّ العالميّ خلال ثلاث سنوات.",
                  en: " Gazan talents to the global digital economy within three years.",
                })}
              </p>
            </div>
          </Reveal>

          {/* ── The three axes — numbered card panels with depth, asymmetric ── */}
          <div className="lg:col-span-7 flex flex-col gap-[clamp(1.25rem,2.4vw,2rem)]">
            {axes.map((axis, i) => (
              <Reveal key={axis.id} delay={i * 0.06}>
                <article
                  data-testid={`why-axis-${axis.id}`}
                  className="card-base card-hover group relative overflow-hidden p-7 sm:p-9 lg:[&:nth-child(2)]:ms-0"
                >
                  {/* Leading accent rail — draws down on hover (RTL-safe edge) */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 start-0 w-[3px] bg-primary origin-top scale-y-0 transition-transform duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:scale-y-100"
                  />
                  <div className="grid grid-cols-[auto_1fr] gap-x-6 sm:gap-x-9 items-start">
                    <motion.span
                      className="font-editorial tnum text-sand leading-none transition-colors duration-300 group-hover:text-sand-bright"
                      style={{ fontSize: "clamp(2.1rem, 3.4vw, 3rem)", fontWeight: 600, letterSpacing: "-0.02em", willChange: "transform, opacity" }}
                      initial={reduce ? false : { opacity: 0, y: 10, scale: 0.92 }}
                      whileInView={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{ duration: 0.55, delay: 0.08 + i * 0.06, ease: EASE_OUT_EXPO }}
                    >
                      {idx(i)}
                    </motion.span>

                    <div>
                      <h3
                        className="font-editorial text-foreground"
                        style={{ fontSize: "clamp(1.4rem, 2.4vw, 1.95rem)", fontWeight: 600, letterSpacing: "-0.018em", lineHeight: 1.12 }}
                      >
                        {axis.title}
                      </h3>

                      <p className="t-body mt-3.5 max-w-xl">{axis.body}</p>

                      {/* Distilled sub-points — hairline ledger, not chips */}
                      <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5">
                        {axis.points.map((pt, j) => (
                          <motion.li
                            key={j}
                            className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-fg-secondary"
                            initial={reduce ? false : { opacity: 0, y: 6 }}
                            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.8 }}
                            transition={{ duration: 0.4, delay: 0.28 + i * 0.06 + j * 0.07, ease: EASE_OUT_EXPO }}
                            style={{ willChange: "transform, opacity" }}
                          >
                            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary/70 transition-transform duration-300 group-hover:scale-125" />
                            {pt}
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}

            {/* Closing CTA — invitation into the structure */}
            <Reveal delay={0.1} className="flex flex-wrap items-center gap-4 pt-1">
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
                className="group inline-flex items-center gap-2 text-[14px] font-semibold text-primary"
              >
                {t({ ar: "احجز جولة في المساحة", en: "Book a visit to the space" })}
                <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
