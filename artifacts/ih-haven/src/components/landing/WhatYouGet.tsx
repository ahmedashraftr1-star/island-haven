import { useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";

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
      className="relative bg-background overflow-hidden"
      style={{ paddingBlock: "clamp(6rem, 15vh, 12rem)" }}
    >
      <div className="container-ih relative">
        {/* MONUMENTAL promise — one calm idea, acres of space. */}
        <motion.h2
          className="font-display text-foreground max-w-[16ch]"
          style={{
            fontSize: "clamp(2.6rem, 8vw, 5rem)",
            lineHeight: 1.0,
            letterSpacing: "-0.04em",
            fontWeight: 700,
          }}
        >
          {headline.map((ln, i) => (
            <motion.span
              key={i}
              className={`block will-change-transform ${ln.accent ? "text-primary" : ""}`}
              initial={reduce ? false : { opacity: 0, y: 32 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.85, delay: i * 0.1, ease: EASE_OUT_EXPO }}
            >
              {t(ln)}
            </motion.span>
          ))}
        </motion.h2>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 18 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ duration: 0.85, delay: 0.3, ease: EASE_OUT_EXPO }}
          className="mt-8 sm:mt-10 max-w-xl text-fg-secondary"
          style={{ fontSize: "clamp(1.1rem, 1.9vw, 1.4rem)", lineHeight: 1.6 }}
        >
          {t({
            ar: "مساحة، إرشاد، برامج، وشبكة — كلّ ما يحتاجه صانعٌ ليبدأ ويَنمو، من قلب غزّة.",
            en: "Space, mentorship, programs and a network — everything a maker needs to start and grow, from the heart of Gaza.",
          })}
        </motion.p>

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
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0E1A] via-[#0A0E1A]/10 to-transparent" />
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
        <div className="mt-[clamp(3.5rem,8vh,6.5rem)] grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5rem)]">
          <div className="lg:col-span-3" aria-hidden="true" />
          <ul className="lg:col-span-9 lg:col-start-4">
            {gives.map((g, i) => (
              <motion.li
                key={g.href}
                initial={reduce ? false : { opacity: 0, y: 22 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.7, delay: i * 0.06, ease: EASE_OUT_EXPO }}
                className="border-t border-border-strong first:border-t-0"
              >
                <Link
                  href={g.href}
                  className="group block py-[clamp(1.75rem,3.5vw,2.75rem)] first:pt-0"
                  data-testid={`pillar-${g.href.slice(1)}`}
                >
                  <div className="flex items-baseline justify-between gap-6">
                    <h3
                      className="font-display font-bold text-foreground transition-colors group-hover:text-primary"
                      style={{ fontSize: "clamp(1.4rem, 3vw, 2.4rem)", letterSpacing: "-0.025em", lineHeight: 1.1 }}
                    >
                      {g.title}
                    </h3>
                    <ArrowLeft className="mt-1 h-5 w-5 shrink-0 rotate-180 text-fg-faint transition-all group-hover:text-primary group-hover:-translate-x-1.5 rtl:group-hover:translate-x-1.5" />
                  </div>
                  <p className="t-body mt-3 max-w-2xl">{g.body}</p>
                </Link>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
