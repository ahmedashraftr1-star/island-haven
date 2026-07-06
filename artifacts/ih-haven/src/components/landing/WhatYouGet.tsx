import { Link } from "wouter";
import { ArrowLeft, Monitor, Users, Layers, Globe } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { imageUrl } from "@/hooks/use-content";
import { EASE_OUT_EXPO, DURATION } from "@/lib/motion";

/**
 * WhatYouGet — the PREMIUM LIGHT "breather". A bright, crisp Apple-features
 * register that breaks the run of dark cinematic sections around it. Clean warm
 * white canvas (theme-light flips the tokens), generous purposeful whitespace, a
 * big calm headline, one cleanly-framed product-shot of the space, and a roomy
 * grid of feature cards for what membership GIVES you (workspace, mentorship,
 * programs, community). No serif, no gradient text, no glass, no dark scrim —
 * space + type + white cards carry it. All data / i18n / routes / testids kept.
 */
export function WhatYouGet() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  // A calm, roomy list of what membership gives — clean white feature cards.
  const gives = [
    {
      tag: "WORKSPACE",
      Icon: Monitor,
      wide: true,
      stat: "٦",
      title: t({ ar: "مساحة عمل مجّانيّة", en: "A free workspace" }),
      body: t({
        ar: "مقعد ثابت في مساحة هادئة، بإنترنت موثوق وكهرباء — احجزه متى احتجت.",
        en: "A reliable seat in a calm space with stable internet and power — book it whenever you need.",
      }),
      href: "/book",
    },
    {
      tag: "MENTORSHIP",
      Icon: Users,
      title: t({ ar: "إرشاد من خبراء", en: "Expert mentorship" }),
      body: t({
        ar: "جلسات فرديّة مع مرشدين وروّاد أعمال ومتخصّصين — هندسةً وتصميمًا وأعمالًا.",
        en: "1:1 sessions with mentors, founders and specialists — engineering, design and business.",
      }),
      href: "/experts",
    },
    {
      tag: "PROGRAMS",
      Icon: Layers,
      title: t({ ar: "برامج ودفعات + Demo Day", en: "Programs, cohorts & Demo Day" }),
      body: t({
        ar: "مسارات احتضان وتسريع منظّمة، تُختم بيوم عرضٍ أمام شبكة من الدّاعمين.",
        en: "Structured incubation & acceleration tracks that culminate in a Demo Day to our network.",
      }),
      href: "/programs",
    },
    {
      tag: "COMMUNITY",
      Icon: Globe,
      wide: true,
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

        {/* One clean, framed product-shot of the place — soft shadow on white,
            NOT a full-bleed dark scrim. Apple product-page register. */}
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

        {/* Roomy feature grid — clean white cards, big type, purposeful space.
            Routes + testids preserved. Card 1 & 4 span wide. */}
        <div className="mt-[clamp(3rem,7vh,5.5rem)] grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {gives.map((g, i) => (
            <motion.div
              key={g.href}
              initial={reduce ? false : { opacity: 0, y: 22 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: DURATION.lg, delay: i * 0.06, ease: EASE_OUT_EXPO }}
              className={g.wide ? "sm:col-span-2" : ""}
            >
              <Link
                href={g.href}
                data-testid={`pillar-${g.href.slice(1)}`}
                className={`group flex h-full flex-col gap-5 rounded-[20px] border bg-surface-2 p-6 sm:p-8 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_12px_28px_-12px_rgba(16,24,40,0.12)] transition-all duration-300 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                  g.accent ? "border-primary/25 hover:border-primary/50" : "border-border hover:border-primary/40"
                }`}
              >
                <span
                  className={`grid h-11 w-11 place-items-center rounded-full border transition-colors duration-300 motion-reduce:transition-none ${
                    g.accent
                      ? "border-primary/40 text-primary"
                      : "border-border text-primary group-hover:border-primary/40"
                  }`}
                >
                  <g.Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden />
                </span>
                <div className="flex flex-1 flex-col gap-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-fg-faint">
                    {g.tag}
                  </p>
                  <h3
                    className="font-display font-bold text-foreground leading-snug transition-colors group-hover:text-primary"
                    style={{ fontSize: "clamp(1.2rem, 2vw, 1.5rem)", letterSpacing: "-0.02em" }}
                  >
                    {g.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-fg-secondary">{g.body}</p>
                  {g.stat && (
                    <div className="mt-1 inline-flex items-baseline gap-2">
                      <span className="font-mono text-2xl font-bold text-primary tnum">{g.stat}</span>
                      <span className="text-[13px] text-fg-faint">{t({ ar: "مقاعد متاحة", en: "seats available" })}</span>
                    </div>
                  )}
                  <span className="mt-auto inline-flex items-center gap-1.5 self-start pt-2 text-[13px] font-semibold text-primary transition-all duration-200 group-hover:gap-2.5 motion-reduce:transition-none">
                    {t({ ar: "اعرف المزيد", en: "Learn more" })}
                    <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
