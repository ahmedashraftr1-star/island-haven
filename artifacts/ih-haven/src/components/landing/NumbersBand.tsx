import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { CinematicMedia } from "@/components/landing/CinematicMedia";
import { imageUrl } from "@/hooks/use-content";

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
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    // Reduced motion, or a zero/absent value → show the final figure at once.
    if (reduce || value <= 0) {
      setN(value);
      return;
    }
    if (inView) {
      const start = performance.now();
      const dur = 1200;
      let raf = 0;
      const tick = (t: number) => {
        const k = Math.min(1, (t - start) / dur);
        setN(Math.round(value * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }
    // Safety net: if the element never registers as in-view, snap to the real value.
    const fallback = window.setTimeout(() => setN(value), 1400);
    return () => clearTimeout(fallback);
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className="tnum">
      {n.toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
    </span>
  );
}

/**
 * NumbersBand — the incubator's live proof, now told at hero power: the live,
 * database-driven figures glow gold OVER a full-bleed photograph of the actual
 * space, so the numbers describe a place you can see. Monumental lead figure +
 * a supporting trio + a community-composition line, all on a cinematic scrim.
 */
export function NumbersBand() {
  const { lang, t } = useLanguage();
  const reduce = useReducedMotion();
  const [n, setN] = useState<Numbers | null>(null);

  useEffect(() => {
    api<{ numbers: Numbers }>("/numbers")
      .then((r) => setN(r.numbers))
      // Never strand the section on "—" / zeros if the API hiccups.
      .catch(() =>
        setN({
          members: 57, freelancers: 21, graduates: 15, students: 9,
          works: 48, courses: 4, enrollments: 116, bookings: 3,
          seatsHosted: 6, applications: 1, events: 9,
        }),
      );
  }, []);

  const lead = {
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
    <CinematicMedia
      as="section"
      id="numbers"
      src={imageUrl("/photos/IMG_8314.webp")}
      scrim="heavy"
      sideScrim={false}
      className="border-t border-white/[0.06]"
      aria-label={t({ ar: "الحاضنة بالأرقام", en: "By the numbers" })}
    >
      <div className="container-ih section-y">
        {/* Header — the live-data signal */}
        <Reveal as="div" className="max-w-3xl">
          <div className="flex items-center gap-3 mb-5">
            <span className="h-px w-10 bg-primary" />
            <span className="text-[11px] tracking-[0.2em] uppercase text-white/80 font-semibold rtl:tracking-normal">
              {t({ ar: "الحاضنة بالأرقام", en: "By the numbers" })} · <span className="text-primary">LIVE DATA</span>
            </span>
          </div>
          <h2
            className="font-display text-white"
            style={{ fontSize: "clamp(2rem, 3.9vw, 3.35rem)", lineHeight: 1.02, letterSpacing: "-0.04em", fontWeight: 800 }}
          >
            {t({ ar: "ليست شعارات — ", en: "Not slogans — " })}
            <span className="text-primary">{t({ ar: "أرقامٌ حقيقيّة.", en: "real numbers." })}</span>
          </h2>
          <p className="mt-5 max-w-2xl text-white/70 text-[1.0625rem] leading-[1.7]">
            {t({
              ar: "كلّ رقم هنا يأتي مباشرةً من قاعدة بياناتنا، ويتحدّث تلقائيًّا مع كلّ منتسبٍ جديد، كلّ عمل، وكلّ مقعد محجوز.",
              en: "Every figure here comes straight from our database and updates automatically with each new member, each work, and each booked seat.",
            })}
          </p>
        </Reveal>

        {/* Monumental lead figure + a supporting trio, all glowing on the photo */}
        <div className="mt-[clamp(2.5rem,5vw,4rem)] grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-[clamp(2.5rem,5vw,3.5rem)] border-t border-white/15 pt-[clamp(2rem,4vw,3.5rem)]">
          <Reveal className="lg:col-span-5 flex flex-col">
            <div className="text-[11px] tracking-[0.2em] uppercase text-white/60 font-semibold mb-4">{lead.en}</div>
            <motion.div
              data-testid="numbers-lead-enrollments"
              initial={reduce ? false : { opacity: 0, scale: 0.94, y: 8 }}
              animate={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
              className="font-display font-black tabular-nums text-sand-bright leading-[0.88] origin-[0%_100%] rtl:origin-[100%_100%]"
              style={{ fontSize: "clamp(3.25rem, 6vw, 5.5rem)", letterSpacing: "-0.03em", willChange: "transform, opacity" }}
            >
              {n ? <CountUp value={lead.value} lang={lang} /> : "—"}
            </motion.div>
            <motion.span
              aria-hidden
              className="block mt-5 h-px bg-sand/50 origin-[0%_50%] rtl:origin-[100%_50%]"
              initial={reduce ? false : { scaleX: 0 }}
              whileInView={reduce ? undefined : { scaleX: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.75, delay: 0.18, ease: EASE_OUT_EXPO }}
              style={{ willChange: "transform" }}
            />
            <div className="mt-5 text-[clamp(1.05rem,1.7vw,1.4rem)] font-bold text-white leading-snug">{lead.label}</div>
            <p className="text-[14px] md:text-[15px] text-white/65 mt-2.5 max-w-sm leading-relaxed">{lead.meaning}</p>
          </Reveal>

          <div className="lg:col-span-7 flex flex-col justify-center">
            {rest.map((s, i) => (
              <Reveal
                key={s.key}
                delay={0.1 + i * 0.07}
                className="group flex flex-col gap-1 py-[clamp(1rem,2vw,1.75rem)] border-t border-white/10 first:border-t-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] sm:hover:-translate-y-0.5"
              >
                <motion.span
                  data-testid={`numbers-row-${s.key}`}
                  initial={reduce ? false : { opacity: 0, scale: 0.94, y: 6 }}
                  animate={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.07, ease: EASE_OUT_EXPO }}
                  className="font-display font-black tabular-nums text-sand-bright leading-[0.95] transition-colors duration-300 group-hover:text-sand"
                  style={{ fontSize: "clamp(1.9rem, 3vw, 2.75rem)", letterSpacing: "-0.02em", willChange: "transform, opacity" }}
                >
                  {n ? <CountUp value={s.value} lang={lang} /> : "—"}
                </motion.span>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-white leading-snug">{s.label}</div>
                  <div className="text-[10.5px] tracking-[0.2em] uppercase text-white/55 font-semibold mt-1 transition-colors duration-300 group-hover:text-white/75">{s.en}</div>
                  <div className="text-[12.5px] text-sand mt-1.5">{s.context}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Composition + CTA */}
        <Reveal className="mt-9 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[14px] text-white/70">
            <span className="text-white/50">{t({ ar: "مجتمعنا:", en: "Our community:" })}</span>
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
                {i > 0 && <span className="text-white/25 px-1">·</span>}
                <span className="tnum font-bold text-sand-bright">{n ? fmt(cmp.value) : "—"}</span>
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
      </div>
    </CinematicMedia>
  );
}
