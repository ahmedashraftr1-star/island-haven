import { useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, Monitor, Users, Layers, Globe } from "lucide-react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { SectionHeader } from "@/components/SectionHeader";

/**
 * WhatYouGet — the incubator's promise, told the Apple way: one monumental calm
 * line on acres of space, a single large photograph of the place, and a quiet
 * asymmetric list of what membership gives you. No eyebrow kicker, no numbered
 * "01/02/03" ledger, no medallions, no icon tiles, no uniform card grid, no aura.
 * Scale, space and restraint carry the grandeur; photography and type do the rest.
 */
export function WhatYouGet() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const photoRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: photoRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["8%", "-8%"]);

  // The promise, broken into monumental lines. At most one crimson word.
  const headline = [
    { ar: "حاضنة كاملة.", en: "A full incubator." },
    { ar: "مجّانًا.", en: "Free.", accent: true },
  ];

  // A calm, asymmetric index of what membership gives — quiet editorial lines,
  // not identical CTA cards. Routes / testids preserved.
  const gives = [
    {
      num: "٠١",
      tag: "WORKSPACE",
      Icon: Monitor,
      wide: true,
      lead: true,
      stat: "٦",
      title: t({ ar: "مساحة عمل مجّانيّة", en: "A free workspace" }),
      body: t({
        ar: "مقعد ثابت في مساحة هادئة، بإنترنت موثوق وكهرباء — احجزه متى احتجت.",
        en: "A reliable seat in a calm space with stable internet and power — book it whenever you need.",
      }),
      href: "/book",
    },
    {
      num: "٠٢",
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
      num: "٠٣",
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
      num: "٠٤",
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
      className="relative bg-surface-1 overflow-hidden border-t border-white/[0.06]"
      style={{ paddingBlock: "clamp(3.5rem, 8vh, 6rem)" }}
    >
      <div className="container-ih relative">
        {/* Split header — headline (start) + subline/CTA (opposite column) so the
            heading never sits beside an empty half. */}
        <SectionHeader
          eyebrow={t({ ar: "ما تحصل عليه", en: "What you get" })}
          eyebrowEN="WHAT YOU GET"
          headline={
            <>
              {headline.map((ln, i) => (
                <span key={i} className={`block ${ln.accent ? "text-primary" : ""}`}>
                  {t(ln)}
                </span>
              ))}
            </>
          }
          subline={t({
            ar: "مساحة، إرشاد، برامج، وشبكة — كلّ ما يحتاجه صانعٌ ليبدأ ويَنمو، من قلب غزّة.",
            en: "Space, mentorship, programs and a network — everything a maker needs to start and grow, from the heart of Gaza.",
          })}
          cta={{ label: t({ ar: "اعرف أكثر", en: "Learn more" }), href: "/programs" }}
        />

        {/* One large photograph of the place — shown, not described. */}
        <motion.div
          ref={photoRef}
          initial={reduce ? false : { opacity: 0 }}
          whileInView={reduce ? undefined : { opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1, ease: EASE_OUT_EXPO }}
          className="relative mt-[clamp(3.5rem,8vh,6.5rem)] overflow-hidden rounded-[24px] ring-1 ring-border-strong"
        >
          <motion.img
            src="/photos/IMG_8347.webp"
            alt={t({ ar: "مساحة عمل آيلاند هيفن في غزّة", en: "The Island Haven workspace in Gaza" })}
            loading="lazy"
            style={{ y }}
            className="w-full aspect-[16/10] sm:aspect-[2/1] object-cover scale-110 will-change-transform"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-[clamp(1.5rem,4vw,3.5rem)]">
            <p
              className="font-display text-white max-w-2xl"
              style={{ fontSize: "clamp(1.3rem, 3vw, 2.1rem)", lineHeight: 1.15, letterSpacing: "-0.025em", fontWeight: 700 }}
            >
              {t({
                ar: "مكانٌ هادئ ليبدأ منه العمل الجادّ.",
                en: "A calm place where serious work begins.",
              })}
            </p>
          </div>
        </motion.div>

        {/* Quiet asymmetric index — what membership gives. Hairline-divided
            editorial lines, NOT numbered cards or identical CTA tiles. */}
        {/* Dense feature bento — number + icon + tag + title + body, whole cell a
            link (routes + testids preserved). Card 1 wide with a mini-stat, card 4
            wide with a red accent. */}
        <div className="mt-[clamp(3rem,6vh,5rem)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-border-strong bg-border-strong">
          {gives.map((g, i) => (
            <motion.div
              key={g.href}
              initial={reduce ? false : { opacity: 0, y: 22 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: i * 0.06, ease: EASE_OUT_EXPO }}
              className={g.wide ? "sm:col-span-2" : ""}
            >
              <Link
                href={g.href}
                data-testid={`pillar-${g.href.slice(1)}`}
                className={`group relative flex h-full flex-col gap-6 overflow-hidden p-7 sm:p-8 transition-colors duration-300 motion-reduce:transition-none ${
                  g.lead ? "border-t-2 border-t-primary" : ""
                } ${
                  g.accent
                    ? "bg-background hover:bg-primary/[0.04] border-e-2 border-e-primary/30"
                    : "bg-background hover:bg-surface-2"
                }`}
              >
                <span
                  aria-hidden
                  className={`pointer-events-none absolute top-4 start-6 select-none font-mono leading-none tnum motion-reduce:hidden ${
                    g.accent ? "text-primary/[0.08]" : "text-primary/[0.06]"
                  }`}
                  style={{ fontSize: "clamp(2.4rem, 5vw, 4.5rem)" }}
                >
                  {g.num}
                </span>
                <span
                  className={`relative z-[1] grid h-10 w-10 place-items-center rounded-full border transition-colors duration-300 motion-reduce:transition-none ${
                    g.accent
                      ? "border-primary/40 text-primary"
                      : "border-border-strong text-foreground group-hover:border-primary/40"
                  }`}
                >
                  <g.Icon className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
                </span>
                <div className="relative z-[1] flex flex-1 flex-col gap-3">
                  <p className={`font-mono text-[11px] tracking-[0.15em] uppercase ${g.accent ? "text-primary" : "text-fg-faint"}`}>
                    {g.tag}
                  </p>
                  <h3
                    className="font-display font-bold text-foreground leading-snug transition-colors group-hover:text-primary"
                    style={{ fontSize: "clamp(1.15rem,2vw,1.4rem)", letterSpacing: "-0.02em" }}
                  >
                    {g.title}
                  </h3>
                  <p className="t-body text-[14px] leading-relaxed">{g.body}</p>
                  {g.stat && (
                    <div className="mt-1 inline-flex items-baseline gap-2">
                      <span className="font-mono text-2xl font-bold text-primary tnum">{g.stat}</span>
                      <span className="t-caption text-fg-faint">{t({ ar: "مقاعد متاحة", en: "seats available" })}</span>
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
