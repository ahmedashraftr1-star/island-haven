import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * About — the /about HERO, told the Apple way: SCALE + SPACE + RESTRAINT.
 *
 * Grandeur pass: gone are the per-section eyebrow kicker, the aura blob, the
 * boxed sticky photo and the white-on-dark ledger styling — all AI tells. In
 * their place a single monumental headline on the dark canvas (one crimson
 * word), the war-born narrative as calm prose, the bridge belief set large, and
 * the honest 3-year goal as a quiet cerulean data row (cerulean reserved for
 * real numbers only). One full-bleed photograph of the place carries the scene
 * with a slow scroll parallax. Vision/Mission/axes/values live in their own
 * sections below (composed in pages/About.tsx).
 */
export function About() {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();
  const photoRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: photoRef,
    offset: ["start end", "end start"],
  });
  const photoY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-7%", "7%"]);

  const narrative = [
    t({
      ar: "عامان من الدمار المتواصل أفقدا الشباب الغزّي ما يحتاجه أيّ إنسان ليعمل ويبني مستقبله: لا إنترنت كافٍ، ولا كهرباء منتظمة، ولا مكان هادئ للتفكير والإنتاج. الحرب لم تدمّر البنية التحتية فحسب، بل كادت أن تدمّر الأمل في أن يكون للموهبة الغزّية مكان في هذا العالم.",
      en: "Two years of relentless destruction stripped Gaza's youth of what anyone needs to work and build a future: no reliable internet, no steady power, no quiet place to think and create. The war didn't just destroy infrastructure — it nearly destroyed the hope that Gazan talent could have a place in this world.",
    }),
    t({
      ar: "من هذا الواقع وُلدت آيلاند هيفن — منظومة تقاوم الظرف بالعمل، وتردّ على الدمار بالبناء، وتقول لكلّ شابّ وشابّة في غزّة: موهبتك لم تُدمَّر، وطريقك لم يُغلَق.",
      en: "From that reality, Island Haven was born — an ecosystem that resists circumstance with work, answers destruction with building, and tells every young person in Gaza: your talent wasn't destroyed, and your path isn't closed.",
    }),
    t({
      ar: "بدأنا بمساحة عمل مشتركة تستقبل الخرّيجين والمستقلّين والطلبة، وتطوّرنا لنبني منظومة متكاملة: تدريبًا وتأهيلًا، أرصدةً سحابيّة، حلولًا لاستقبال المدفوعات الدوليّة، وتشبيكًا بفرصٍ مهنيّة حول العالم — مع توظيف الذكاء الاصطناعيّ في خدمة أعضائنا.",
      en: "We began with a shared workspace for graduates, freelancers and students, and grew into a full ecosystem: training and upskilling, cloud credits, international payment solutions, and real connections to opportunities worldwide — putting AI to work in our members' service.",
    }),
  ];

  const goal = [
    { v: lang === "en" ? "1,000" : "١٬٠٠٠", l: t({ ar: "كفاءة غزّية", en: "Gazan talents" }) },
    { v: lang === "en" ? "3" : "٣", l: t({ ar: "سنوات", en: "years" }) },
    { v: lang === "en" ? "2024" : "٢٠٢٤", l: t({ ar: "تأسّسنا", en: "founded" }) },
    { v: lang === "en" ? "100%" : "١٠٠٪", l: t({ ar: "مجّانًا", en: "free" }) },
  ];

  return (
    <section id="about" className="relative bg-background overflow-hidden" style={{ paddingBlock: "clamp(3.5rem, 8vh, 6rem)" }}>
      <div className="container-ih relative">
        {/* ── Hero split: monumental heading (start) ↔ hook + mini-stats (opposite) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-[clamp(3rem,6vw,8rem)] gap-y-12 items-start">
          <div className="order-first">
            <div className="mb-6 flex items-center gap-3">
              <span aria-hidden className="block h-px w-5 shrink-0 bg-primary" />
              <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary rtl:tracking-normal">
                <span className="opacity-50">OUR STORY · </span>قصّتنا
              </span>
            </div>
            <motion.h2
              className="font-display text-foreground"
              style={{ fontSize: "clamp(2.6rem, 7.4vw, 5.75rem)", lineHeight: 1.0, letterSpacing: "-0.04em", fontWeight: 700 }}
            >
              {[
                t({ ar: "وُلدنا في", en: "Born in the" }),
                t({ ar: "قلب", en: "heart of" }),
                <span key="accent" className="text-primary">{t({ ar: "غزّة.", en: "Gaza." })}</span>,
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
            </motion.h2>
          </div>

          <div className="order-last flex flex-col gap-8 lg:pt-[clamp(1rem,3vw,2.5rem)]">
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.85, delay: 0.42, ease: EASE_OUT_EXPO }}
              className="text-fg-secondary"
              style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
            >
              {t({
                ar: "لم تولد آيلاند هيفن في مكتبٍ مريح، ولا في ظروفٍ مثالية — بل وسط حربٍ لم تُبقِ حجرًا على حجر، ولا حلمًا بلا جرح. لكنّنا رفضنا أن نقف متفرّجين.",
                en: "Island Haven wasn't born in a comfortable office or ideal conditions — but amid a war that left no stone, and no dream, untouched. We refused to stand by.",
              })}
            </motion.p>
            <Reveal delay={0.06}>
              <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border-strong bg-border-strong">
                {[
                  { n: lang === "en" ? "2024" : "٢٠٢٤", ar: "تأسّسنا", en: "EST" },
                  { n: lang === "en" ? "57+" : "٥٧+", ar: "منتسب", en: "MEMBERS" },
                  { n: lang === "en" ? "100%" : "١٠٠٪", ar: "مجّانًا", en: "FREE" },
                ].map((stat) => (
                  <div key={stat.en} className="bg-background px-4 py-5 text-center">
                    <div
                      className="font-mono font-bold text-sand tabular-nums leading-none"
                      style={{ fontSize: "clamp(1.4rem,2.5vw,1.9rem)" }}
                    >
                      {stat.n}
                    </div>
                    <div className="t-caption text-fg-secondary mt-1">{stat.ar}</div>
                    <div className="font-mono text-[9px] tracking-widest uppercase text-fg-faint mt-0.5">{stat.en}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        {/* ── The narrative — calm editorial prose, no boxes ── */}
        <div className="mt-[clamp(3.5rem,7vw,6rem)] max-w-3xl space-y-7" style={{ fontSize: "clamp(1.05rem,1.5vw,1.2rem)", lineHeight: 1.85 }}>
          {narrative.map((p, i) => (
            <Reveal key={i} delay={i * 0.05} as="p">
              <span className="text-fg-secondary">{p}</span>
            </Reveal>
          ))}
        </div>

        {/* ── The bridge belief — set large, unboxed ── */}
        <Reveal delay={0.05}>
          <p
            className="mt-[clamp(3rem,6vw,5rem)] font-display font-bold text-foreground max-w-3xl"
            style={{ fontSize: "clamp(1.6rem, 3.4vw, 2.75rem)", lineHeight: 1.18, letterSpacing: "-0.028em" }}
          >
            {t({
              ar: "نحن لسنا مجرّد مكانٍ للعمل — نحن جسرٌ يهيّئ الإنسان الغزّي ليقف على خطّ المنافسة الحقيقيّ مع العالم.",
              en: "We're not just a place to work — we're a bridge that prepares Gaza's people to compete, for real, with the world.",
            })}
          </p>
        </Reveal>

        {/* ── The 3-year goal — quiet cerulean data row (cerulean = real numbers only) ── */}
        <Reveal delay={0.08}>
          <div className="mt-[clamp(3.5rem,7vw,6rem)] border-t border-border-strong pt-[clamp(2.25rem,4.5vw,3.5rem)]">
            <p className="t-caption text-fg-secondary mb-[clamp(1.75rem,3.5vw,2.75rem)]">
              {t({ ar: "هدفنا في ثلاث سنوات", en: "Our 3-year goal" })}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10">
              {goal.map((g, i) => (
                <div key={i}>
                  <div
                    className="font-display font-black text-sand tnum leading-none"
                    style={{ fontSize: "clamp(2.4rem, 4.4vw, 3.6rem)", letterSpacing: "-0.03em" }}
                  >
                    {g.v}
                  </div>
                  <div className="t-body text-[15px] md:text-[16px] mt-3.5 text-foreground/85">{g.l}</div>
                </div>
              ))}
            </div>
            <p className="t-body text-[15px] md:text-[17px] mt-[clamp(2rem,4vw,3rem)] max-w-2xl">
              {t({
                ar: "نردم الفجوة التي خلّفتها الحرب بتأهيل ألف كفاءة غزّية خلال ثلاث سنوات، ونعيد وصلها بالاقتصاد الرقميّ العالميّ — حتى تصل إلى مرحلة المنافسة والتفوّق.",
                en: "We close the gap the war left by qualifying a thousand Gazan talents within three years, and reconnecting them to the global digital economy — until they reach real competition and excellence.",
              })}
            </p>
          </div>
        </Reveal>
      </div>

      {/* ── The place itself — one full-bleed photograph, slow parallax, a calm line overlaid ── */}
      <motion.div
        ref={photoRef}
        className="relative mt-[clamp(4rem,9vh,7rem)] w-full overflow-hidden"
        initial={reduce ? false : { opacity: 0 }}
        whileInView={reduce ? undefined : { opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1, ease: EASE_OUT_EXPO }}
      >
        <div className="relative h-[clamp(20rem,54vh,36rem)]">
          <motion.img
            src="/photos/IMG_8358.webp"
            alt={t({ ar: "من داخل مساحة آيلاند هيفن في غزّة", en: "Inside the Island Haven workspace in Gaza" })}
            loading="lazy"
            style={{ y: photoY }}
            className="absolute inset-0 h-[114%] -top-[7%] w-full object-cover object-center saturate-[1.04] will-change-transform"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, hsl(0 0% 4% / 0.92) 0%, hsl(0 0% 4% / 0.5) 45%, transparent 80%)" }}
          />
          <div className="absolute inset-0 flex items-end">
            <div className="container-ih w-full pb-[clamp(2.5rem,6vh,4.5rem)]">
              <motion.p
                className="max-w-[22ch] text-white"
                style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.6rem)", lineHeight: 1.18, letterSpacing: "-0.02em", fontWeight: 600 }}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
              >
                {t({ ar: "مكانٌ هادئٌ يعمل فيه الأمل.", en: "A quiet place where hope gets to work." })}
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
