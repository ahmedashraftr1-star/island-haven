import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { imageUrl } from "@/hooks/use-content";
import { EASE_OUT_EXPO, DURATION } from "@/lib/motion";

/**
 * WhatYouGet — the PREMIUM LIGHT "breather". A bright, crisp EDITORIAL register
 * that breaks the run of dark cinematic sections around it. Warm-paper canvas
 * (theme-light flips the tokens), generous purposeful whitespace, a big calm
 * headline, one cleanly-framed product-shot of the space, and each value of
 * membership (workspace, mentorship, programs, community) set as a hairline-
 * separated editorial ROW — a large display title on the start, a concise
 * description on a readable measure, a small terracotta index. No icon circles,
 * no card grid, no serif, no gradient, no glass. Space + type carry it. All
 * data / i18n / routes / testids kept.
 */
export function WhatYouGet() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  // A calm, roomy list of what membership gives — set as editorial rows.
  const gives = [
    {
      stat: "٦",
      title: t({ ar: "مساحة عمل مجّانيّة", en: "A free workspace" }),
      body: t({
        ar: "مقعد ثابت في مساحة هادئة، بإنترنت موثوق وكهرباء — احجزه متى احتجت.",
        en: "A reliable seat in a calm space with stable internet and power — book it whenever you need.",
      }),
      href: "/book",
    },
    {
      title: t({ ar: "إرشاد من خبراء", en: "Expert mentorship" }),
      body: t({
        ar: "جلسات فرديّة مع مرشدين وروّاد أعمال ومتخصّصين — هندسةً وتصميمًا وأعمالًا.",
        en: "1:1 sessions with mentors, founders and specialists — engineering, design and business.",
      }),
      href: "/experts",
    },
    {
      title: t({ ar: "برامج ودفعات + Demo Day", en: "Programs, cohorts & Demo Day" }),
      body: t({
        ar: "مسارات احتضان وتسريع منظّمة، تُختم بيوم عرضٍ أمام شبكة من الدّاعمين.",
        en: "Structured incubation & acceleration tracks that culminate in a Demo Day to our network.",
      }),
      href: "/programs",
    },
    {
      accent: true,
      title: t({ ar: "شبكة ومجتمع", en: "A network & community" }),
      body: t({
        ar: "مجتمع من المستقلّين والخرّيجين والمؤسّسين — تعاون، أعمال، وفرص.",
        en: "A community of freelancers, graduates and founders — collaboration, work and opportunity.",
      }),
      href: "/members",
    },
  ];

  return (
    <section
      id="what-you-get"
      className="theme-light relative bg-background text-foreground border-y border-border overflow-hidden"
      style={{ paddingBlock: "clamp(4rem, 8vh, 6.5rem)" }}
    >
      <div className="container-ih relative">
        {/* Header — calm eyebrow, one monumental line, roomy sub. Split so the
            headline never sits beside an empty half on wide screens. */}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <motion.div
            className="lg:col-span-7"
            initial={reduce ? false : { opacity: 0, y: 22 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: DURATION.lg, ease: EASE_OUT_EXPO }}
          >
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary rtl:tracking-[0.12em]">
              {t({ ar: "ما تحصل عليه", en: "What you get" })}
            </p>
            <h2
              className="font-display text-foreground"
              style={{
                fontSize: "clamp(2.4rem, 5vw, 4.5rem)",
                fontWeight: 900,
                lineHeight: 0.98,
                letterSpacing: "-0.04em",
              }}
            >
              {t({ ar: "حاضنة كاملة. ", en: "A full incubator. " })}
              <span className="text-primary">{t({ ar: "مجّانًا.", en: "Free." })}</span>
            </h2>
          </motion.div>

          <motion.div
            className="lg:col-span-5"
            initial={reduce ? false : { opacity: 0, y: 22 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: DURATION.lg, delay: 0.08, ease: EASE_OUT_EXPO }}
          >
            <p className="max-w-xl text-[1.0625rem] lg:text-[1.2rem] leading-[1.7] text-fg-secondary">
              {t({
                ar: "مساحة، إرشاد، برامج، وشبكة — كلّ ما يحتاجه صانعٌ ليبدأ ويَنمو، من قلب غزّة.",
                en: "Space, mentorship, programs and a network — everything a maker needs to start and grow, from the heart of Gaza.",
              })}
            </p>
            <Link
              href="/programs"
              className="group mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-primary transition-all duration-200 hover:gap-3 motion-reduce:transition-none"
            >
              {t({ ar: "اعرف أكثر", en: "Learn more" })}
              <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" aria-hidden />
            </Link>
          </motion.div>
        </div>

        {/* One clean, framed product-shot of the place — soft shadow on paper,
            NOT a full-bleed dark scrim. The single editorial image element. */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: DURATION.xl, ease: EASE_OUT_EXPO }}
          className="mt-[clamp(3rem,7vh,5.5rem)] overflow-hidden rounded-[24px] border border-border bg-surface-2 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_24px_56px_-20px_rgba(16,24,40,0.18)]"
        >
          <img
            src={imageUrl("/photos/IMG_8347.webp")}
            alt={t({ ar: "مساحة عمل آيلاند هيفن في غزّة", en: "The Island Haven workspace in Gaza" })}
            loading="lazy"
            decoding="async"
            className="w-full aspect-[16/10] sm:aspect-[21/9] object-cover"
          />
        </motion.div>

        {/* Editorial value list — each membership value on its own hairline-
            separated row: terracotta index + large display title on the start,
            a concise description on a readable measure. Routes + testids kept. */}
        <div className="mt-[clamp(3rem,7vh,5.5rem)] border-t border-border">
          {gives.map((g, i) => (
            <motion.div
              key={g.href}
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: DURATION.lg, delay: i * 0.05, ease: EASE_OUT_EXPO }}
            >
              <Link
                href={g.href}
                data-testid={`pillar-${g.href.slice(1)}`}
                className="group grid grid-cols-1 items-baseline gap-x-10 gap-y-4 border-b border-border py-[clamp(1.75rem,4vh,3rem)] transition-colors duration-300 hover:border-primary/40 motion-reduce:transition-none md:grid-cols-12"
              >
                {/* Index + title */}
                <div className="flex items-baseline gap-4 md:col-span-6 lg:col-span-5">
                  <span
                    className="shrink-0 font-mono text-[13px] font-semibold tabular-nums text-primary"
                    aria-hidden
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3
                    className="font-display font-bold text-foreground leading-[1.05] transition-colors duration-300 group-hover:text-primary"
                    style={{
                      fontSize: "clamp(1.4rem, 2.4vw, 2rem)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {g.title}
                  </h3>
                </div>

                {/* Description on a readable measure */}
                <div className="md:col-span-6 lg:col-span-6 lg:col-start-6">
                  <p className="max-w-[52ch] text-[15px] leading-relaxed text-fg-secondary lg:text-[1.0625rem]">
                    {g.body}
                  </p>
                  {g.stat && (
                    <div className="mt-3 inline-flex items-baseline gap-2">
                      <span className="font-mono text-xl font-bold tabular-nums text-primary">{g.stat}</span>
                      <span className="text-[13px] text-fg-faint">{t({ ar: "مقاعد متاحة", en: "seats available" })}</span>
                    </div>
                  )}
                </div>

                {/* Hairline tick — a quiet directional cue, no medallion */}
                <div className="hidden items-center justify-end lg:col-span-1 lg:flex">
                  <ArrowLeft
                    className="h-4 w-4 text-fg-faint transition-all duration-300 rtl:rotate-180 group-hover:-translate-x-1 group-hover:text-primary rtl:group-hover:translate-x-1 motion-reduce:transition-none"
                    aria-hidden
                  />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
