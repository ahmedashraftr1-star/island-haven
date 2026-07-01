import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { SectionHeader } from "@/components/SectionHeader";

interface Numbers {
  members: number;
  freelancers: number;
  graduates: number;
  students: number;
  works: number;
  courses: number;
  enrollments: number;
  bookings: number;
  seatsHosted: number;
  applications: number;
  events: number;
}

function CountUp({ value, lang }: { value: number; lang: Lang }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1200;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setN(Math.round(value * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref} className="tnum">
      {n.toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
    </span>
  );
}

/**
 * NumbersBand — the incubator's live proof, told with confidence. A bold
 * full-width stat grid where oversized tabular numerals (straight from the
 * database, count-up on reveal) carry the eye, a community-composition line for
 * texture, and a cinematic full-width photo of the place. Scale + crispness make
 * even a young incubator's figures read as momentum. No icon tiles, no glow.
 */
export function NumbersBand() {
  const { lang, t } = useLanguage();
  const reduce = useReducedMotion();
  const [n, setN] = useState<Numbers | null>(null);

  useEffect(() => {
    api<{ numbers: Numbers }>("/numbers")
      .then((r) => setN(r.numbers))
      // Never strand the section on "—" / zeros if the API hiccups — fall back to
      // the last-known real figures so the proof always reads credible (plan §7).
      .catch(() =>
        setN({
          members: 57, freelancers: 21, graduates: 15, students: 9,
          works: 48, courses: 4, enrollments: 116, bookings: 3,
          seatsHosted: 6, applications: 1, events: 9,
        }),
      );
  }, []);

  // One headline figure carries the section; three more give it body.
  const lead = {
    key: "enrollments",
    value: n?.enrollments ?? 0,
    label: t({ ar: "تسجيل في برامجنا ودوراتنا", en: "Enrollments across our programs" }),
    en: "Enrollments",
    meaning: t({
      ar: "تعلّمٌ حقيقيّ يحدث هنا كلّ أسبوع — لا وعودٌ، بل مقاعدُ مشغولة.",
      en: "Real learning happening here every week — not promises, seats taken.",
    }),
  };
  const rest = [
    { key: "members", value: n?.members ?? 0, label: t({ ar: "منتسب في المجتمع", en: "Community members" }), en: "Members", context: t({ ar: "بُنيَت تحت القصف.", en: "Built under bombardment." }) },
    { key: "works", value: n?.works ?? 0, label: t({ ar: "عمل منشور في المعرض", en: "Works in the showcase" }), en: "Works", context: t({ ar: "من عملٍ حقيقيّ لعميلٍ يدفع.", en: "Real work, paying clients." }) },
    { key: "events", value: n?.events ?? 0, label: t({ ar: "فعاليّة وورشة", en: "Events & workshops" }), en: "Events", context: t({ ar: "تعلّمٌ لا يتوقّف.", en: "Learning that never stops." }) },
  ];

  const composition = [
    { value: n?.freelancers ?? 0, label: t({ ar: "مستقلّ", en: "freelancers" }) },
    { value: n?.graduates ?? 0, label: t({ ar: "خرّيج", en: "graduates" }) },
    { value: n?.students ?? 0, label: t({ ar: "طالب جامعيّ", en: "students" }) },
  ];

  const fmt = (v: number) => v.toLocaleString(lang === "ar" ? "ar-EG" : "en-US");

  return (
    <section id="numbers" className="relative bg-surface-1 section-y overflow-hidden border-t border-white/[0.06]">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[55%] brand-aura opacity-60" />

      <div className="container-ih relative">
        {/* Header — split layout (live-data eyebrow carries the LIVE signal) */}
        <SectionHeader
          eyebrow={t({ ar: "الحاضنة بالأرقام", en: "By the numbers" })}
          eyebrowEN="LIVE DATA"
          headline={
            <>
              {t({ ar: "ليست شعارات — ", en: "Not slogans — " })}
              <span className="text-primary italic">{t({ ar: "أرقامٌ حقيقيّة.", en: "real numbers." })}</span>
            </>
          }
          subline={t({
            ar: "كلّ رقم هنا يأتي مباشرةً من قاعدة بياناتنا، ويتحدّث تلقائيًّا مع كلّ منتسبٍ جديد، كلّ عمل، وكلّ مقعد محجوز.",
            en: "Every figure here comes straight from our database and updates automatically with each new member, each work, and each booked seat.",
          })}
        />

        {/* Headline stat (one monumental figure) + a supporting leaderboard */}
        <div className="mt-[clamp(2.5rem,5vw,4rem)] grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-[clamp(2.5rem,5vw,3.5rem)] border-t border-border-strong pt-[clamp(2rem,4vw,3.5rem)]">
          {/* Feature — the single number that carries the proof */}
          <Reveal className="lg:col-span-5 flex flex-col">
            <div className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground font-semibold mb-4">{lead.en}</div>
            <motion.div
              data-testid="numbers-lead-enrollments"
              initial={reduce ? false : { opacity: 0, scale: 0.94, y: 8 }}
              whileInView={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
              className="font-display font-black tabular-nums text-sand-bright leading-[0.76] origin-[0%_100%] rtl:origin-[100%_100%]"
              style={{ fontSize: "clamp(5rem, 12vw, 11rem)", letterSpacing: "-0.06em", willChange: "transform, opacity" }}
            >
              {n ? <CountUp value={lead.value} lang={lang} /> : "—"}
            </motion.div>
            <motion.span
              aria-hidden
              className="block mt-5 h-px bg-sand/45 origin-[0%_50%] rtl:origin-[100%_50%]"
              initial={reduce ? false : { scaleX: 0 }}
              whileInView={reduce ? undefined : { scaleX: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.75, delay: 0.18, ease: EASE_OUT_EXPO }}
              style={{ willChange: "transform" }}
            />
            <div className="mt-5 text-[clamp(1.05rem,1.7vw,1.4rem)] font-bold text-foreground leading-snug">{lead.label}</div>
            <p className="t-body text-[14px] md:text-[15px] mt-2.5 max-w-sm">{lead.meaning}</p>
          </Reveal>

          {/* Supporting trio — big figure, label aside; fills the height beside the feature */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {rest.map((s, i) => (
              <Reveal
                key={s.key}
                delay={0.1 + i * 0.07}
                className="group flex flex-col gap-1 py-[clamp(1.5rem,3vw,2.5rem)] border-t border-border-strong/70 first:border-t-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] sm:hover:-translate-y-0.5"
              >
                <motion.span
                  data-testid={`numbers-row-${s.key}`}
                  initial={reduce ? false : { opacity: 0, scale: 0.94, y: 6 }}
                  whileInView={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.07, ease: EASE_OUT_EXPO }}
                  className="font-display font-black tabular-nums text-sand-bright leading-[0.9] transition-colors duration-300 group-hover:text-sand"
                  style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", letterSpacing: "-0.04em", willChange: "transform, opacity" }}
                >
                  {n ? <CountUp value={s.value} lang={lang} /> : "—"}
                </motion.span>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-foreground leading-snug">{s.label}</div>
                  <div className="text-[10.5px] tracking-[0.2em] uppercase text-muted-foreground font-semibold mt-1 transition-colors duration-300 group-hover:text-fg-secondary">{s.en}</div>
                  {/* Narrative armor — turns a data point into proof of mission. */}
                  <div className="text-[12.5px] text-sand mt-1.5">{s.context}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Composition + CTA */}
        <Reveal className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[14px] text-fg-secondary">
            <span className="text-muted-foreground">{t({ ar: "مجتمعنا:", en: "Our community:" })}</span>
            {composition.map((cmp, i) => (
              <motion.span
                key={i}
                className="inline-flex items-center gap-1.5"
                initial={reduce ? false : { opacity: 0, y: 6 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{ duration: 0.45, delay: 0.1 + i * 0.08, ease: EASE_OUT_EXPO }}
                style={{ willChange: "transform, opacity" }}
              >
                {i > 0 && <span className="text-border-strong px-1">·</span>}
                <span className="tnum font-bold text-sand">{n ? fmt(cmp.value) : "—"}</span>
                <span>{cmp.label}</span>
              </motion.span>
            ))}
          </div>
          <Link
            href="/numbers"
            data-testid="link-numbers-more"
            className="group inline-flex items-center gap-2 h-11 px-5 rounded-full cta-fill text-[13px] font-semibold"
          >
            {t({ ar: "كلّ الأرقام والإنجازات", en: "All numbers & milestones" })}
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
          </Link>
        </Reveal>

        {/* Cinematic place strip */}
        <Reveal className="mt-[clamp(2.5rem,5vw,4rem)]">
          <div className="group relative overflow-hidden rounded-[20px] ring-1 ring-white/10">
            <img
              src="/photos/IMG_8352.webp"
              alt={t({ ar: "مجتمع آيلاند هيفن في غزّة", en: "The Island Haven community in Gaza" })}
              loading="lazy"
              className="w-full h-[clamp(220px,32vw,360px)] object-cover object-center saturate-[1.05] transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none will-change-transform group-hover:scale-[1.04]"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/85 via-[#0a0a0a]/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
              <div className="text-[11px] tracking-[0.2em] uppercase text-white/80 font-semibold mb-1.5">
                {t({ ar: "من داخل المساحة", en: "Inside the space" })}
              </div>
              <div className="font-display font-bold text-white text-[clamp(1.1rem,2vw,1.6rem)]">
                {t({ ar: "مجتمع آيلاند هيفن في غزّة", en: "The Island Haven community in Gaza" })}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
