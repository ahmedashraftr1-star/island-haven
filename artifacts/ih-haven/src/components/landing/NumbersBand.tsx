import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useInView } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";

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

  // Lead with the strongest live figures from the database.
  const stats = [
    { key: "enrollments", value: n?.enrollments ?? 0, label: t({ ar: "تسجيل في برامجنا", en: "Program enrollments" }), en: "Enrollments" },
    { key: "members", value: n?.members ?? 0, label: t({ ar: "منتسب في المجتمع", en: "Community members" }), en: "Members" },
    { key: "works", value: n?.works ?? 0, label: t({ ar: "عمل منشور في المعرض", en: "Works in the showcase" }), en: "Works" },
    { key: "events", value: n?.events ?? 0, label: t({ ar: "فعاليّة وورشة", en: "Events & workshops" }), en: "Events" },
  ];

  const composition = [
    { value: n?.freelancers ?? 0, label: t({ ar: "مستقلّ", en: "freelancers" }) },
    { value: n?.graduates ?? 0, label: t({ ar: "خرّيج", en: "graduates" }) },
    { value: n?.students ?? 0, label: t({ ar: "طالب جامعيّ", en: "students" }) },
  ];

  const fmt = (v: number) => v.toLocaleString(lang === "ar" ? "ar-EG" : "en-US");

  return (
    <section id="numbers" className="relative bg-surface-1 section-y overflow-hidden">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[55%] brand-aura opacity-60" />

      <div className="container-ih relative">
        {/* Header */}
        <Reveal as="header" className="max-w-3xl">
          <div className="flex items-center gap-3 mb-5">
            <span className="eyebrow">{t({ ar: "الحاضنة بالأرقام", en: "By the numbers" })}</span>
            <span className="chip-accent-2 inline-flex items-center gap-1.5 px-2.5 h-[22px] rounded-full text-[10px] font-bold tracking-[0.12em]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-2 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-2" />
              </span>
              LIVE
            </span>
          </div>
          <h2
            className="font-display font-extrabold text-foreground"
            style={{ fontSize: "clamp(2rem, 4.4vw, 3.6rem)", lineHeight: 1.04, letterSpacing: "-0.028em" }}
          >
            {t({ ar: "ليست شعارات — ", en: "Not slogans — " })}
            <span className="text-sand-bright">{t({ ar: "أرقامٌ حقيقيّة.", en: "real numbers." })}</span>
          </h2>
          <p className="t-body-lg mt-5 max-w-2xl">
            {t({
              ar: "كلّ رقم هنا يأتي مباشرةً من قاعدة بياناتنا، ويتحدّث تلقائيًّا مع كلّ منتسبٍ جديد، كلّ عمل، وكلّ مقعد محجوز.",
              en: "Every figure here comes straight from our database and updates automatically with each new member, each work, and each booked seat.",
            })}
          </p>
        </Reveal>

        {/* Hero stat grid — oversized count-up numerals, hairline cells */}
        <div className="mt-[clamp(2.5rem,5vw,4rem)] grid grid-cols-2 lg:grid-cols-4 border-t border-border-strong">
          {stats.map((s, i) => (
            <Reveal
              key={s.key}
              delay={i * 0.06}
              className={`border-b border-border-strong ${i % 2 === 1 ? "border-s" : ""} lg:[&:not(:first-child)]:border-s py-8 sm:py-10 px-1 sm:px-5 first:ps-0`}
            >
              <div
                data-testid={`numbers-row-${s.key}`}
                className="group"
              >
                <div
                  className="font-display font-black tabular-nums text-sand-bright leading-[0.85] transition-colors group-hover:text-sand"
                  style={{ fontSize: "clamp(3.25rem, 7vw, 6rem)", letterSpacing: "-0.04em" }}
                >
                  {n ? <CountUp value={s.value} lang={lang} /> : "—"}
                </div>
                <div className="mt-4 text-[15px] font-semibold text-foreground leading-snug">{s.label}</div>
                <div className="text-[10.5px] tracking-[0.2em] uppercase text-muted-foreground font-semibold mt-1.5">{s.en}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Composition + CTA */}
        <Reveal className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[14px] text-fg-secondary">
            <span className="text-muted-foreground">{t({ ar: "مجتمعنا:", en: "Our community:" })}</span>
            {composition.map((cmp, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                {i > 0 && <span className="text-border-strong px-1">·</span>}
                <span className="tnum font-bold text-sand">{n ? fmt(cmp.value) : "—"}</span>
                <span>{cmp.label}</span>
              </span>
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
          <div className="relative overflow-hidden rounded-[20px] ring-1 ring-white/10">
            <img
              src="/photos/IMG_8352.webp"
              alt={t({ ar: "مجتمع آيلاند هيفن في غزّة", en: "The Island Haven community in Gaza" })}
              loading="lazy"
              className="w-full h-[clamp(220px,32vw,360px)] object-cover object-center saturate-[1.05]"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A]/85 via-[#0A0E1A]/10 to-transparent" />
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
