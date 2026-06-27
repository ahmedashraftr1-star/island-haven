import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";

interface Venture {
  id: number;
  name: string;
  tagline: string;
  founderName: string;
  sector: string;
  stage: string;
  featured: boolean;
}

const STAGE_EN: Record<string, string> = {
  idea: "Idea", mvp: "MVP", launched: "Launched", scaling: "Scaling", growth: "Growth",
};
const STAGE_AR: Record<string, string> = {
  idea: "فكرة", mvp: "نموذج أوّليّ", launched: "انطلق", scaling: "توسّع", growth: "نموّ",
};

/**
 * VenturesShowcase — the signature scroll-pinned portfolio ticker (Y Combinator
 * register, in our own crimson + editorial serif on a light canvas). As you
 * scroll, the section pins and a centred list of venture names glides through a
 * focus line — the focused one snaps to serif italic crimson while the others
 * fade — and a synced panel cross-fades that venture's details. Real /ventures
 * data. This is the "رهيبة" motion moment.
 */
export function VenturesShowcase() {
  const { t, lang } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const [rows, setRows] = useState<Venture[] | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api<{ ventures: Venture[] }>("/ventures")
      .then((r) => {
        if (cancelled) return;
        const sorted = [...r.ventures].sort((a, b) => Number(b.featured) - Number(a.featured));
        setRows(sorted.slice(0, 6));
      })
      .catch(() => !cancelled && setRows([]));
    return () => { cancelled = true; };
  }, []);

  const items = rows ?? [];
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (!items.length) return;
    const i = Math.min(items.length - 1, Math.max(0, Math.floor(v * items.length * 0.999)));
    setActive(i);
  });

  // Still loading — render nothing transiently (Reveal-safe sections around us
  // keep the page from looking skeletal; this resolves in a tick).
  if (!rows) return null;

  // EVERGREEN fallback — on a thin/unseeded DB the portfolio is empty, but this
  // is a CORE homepage proof section: it must never vanish. We hold the same
  // serif, light, crimson register and tell the true present-tense story: the
  // first cohort is building right now. + apply CTA.
  if (rows.length === 0) {
    return (
      <section id="ventures-band" className="theme-light relative bg-background section-y overflow-hidden">
        <div aria-hidden className="absolute inset-x-0 top-0 h-[45%] brand-aura opacity-50" />
        <div className="container-ih relative">
          <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5rem)] gap-y-12 items-center">
            <Reveal as="div" className="lg:col-span-7">
              <div className="flex items-center gap-3 mb-4">
                <span aria-hidden className="h-px w-9 bg-primary/50" />
                <span className="text-[11px] tracking-[0.22em] uppercase text-primary font-bold rtl:tracking-normal">
                  {t({ ar: "معرض المشاريع", en: "The portfolio" })}
                </span>
              </div>

              <h2
                className="font-editorial text-foreground"
                style={{ fontSize: "clamp(1.9rem, 4.4vw, 3.4rem)", lineHeight: 1.05, letterSpacing: "-0.02em", fontWeight: 600 }}
              >
                {t({ ar: "أوّل دفعة ", en: "The first cohort is " })}
                <span className="italic text-primary">{t({ ar: "تَبني الآن.", en: "building now." })}</span>
              </h2>

              <p className="t-body-lg mt-6 max-w-xl">
                {t({
                  ar: "هنا، قريبًا، تظهر أسماء المشاريع التي وُلدت في آيلاند. الدفعة الأولى تكتب سطورها الأولى اليوم — ومقعدك في الصفحة التالية.",
                  en: "This is where the names of ventures born at Island Haven will live. The first cohort is writing its opening lines today — and your seat is on the next page.",
                })}
              </p>

              <Reveal as="div" delay={0.08} className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  href="/apply"
                  data-testid="showcase-apply"
                  className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  {t({ ar: "قدّم للدفعة الأولى", en: "Apply to the first cohort" })}
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/ventures"
                  data-testid="showcase-all"
                  className="group inline-flex items-center gap-2 text-[14px] font-semibold text-primary"
                >
                  {t({ ar: "تعرّف على البرنامج", en: "Explore the program" })}
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                </Link>
              </Reveal>
            </Reveal>

            {/* Quiet placeholder ledger — three serif slots awaiting their first names */}
            <Reveal as="div" delay={0.1} className="lg:col-span-5">
              <div className="card-base p-7 lg:p-9">
                <div className="eyebrow eyebrow-sand mb-5">
                  {t({ ar: "الدفعة الأولى", en: "Cohort 01" })}
                </div>
                <ul>
                  {[0, 1, 2].map((i) => (
                    <li
                      key={i}
                      className="flex items-center gap-4 border-t border-border py-5 first:border-t-0 first:pt-0"
                    >
                      <span className="font-editorial tnum text-sand leading-none text-[1.6rem]" style={{ fontWeight: 600 }}>
                        {lang === "en" ? `0${i + 1}` : ["٠١", "٠٢", "٠٣"][i]}
                      </span>
                      <span className="font-editorial italic text-foreground/22 text-[clamp(1.2rem,2vw,1.7rem)] leading-none">
                        {t({ ar: "قيد البناء", en: "in the making" })}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="t-caption mt-6 pt-5 border-t border-border-strong">
                  {t({ ar: "أسماء حقيقيّة — قريبًا جدًّا.", en: "Real names — very soon." })}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    );
  }

  const ITEM_H = 88;
  const LIST_H = 420;
  const stageLabel = (s: string) => (lang === "ar" ? STAGE_AR[s] ?? s : STAGE_EN[s] ?? s);
  const cur = items[active];

  return (
    <section
      ref={ref}
      id="ventures-band"
      className="theme-light relative bg-background"
      style={{ height: `${items.length * 46 + 30}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col">
        <div aria-hidden className="absolute inset-x-0 top-0 h-[45%] brand-aura opacity-50" />

        {/* Header */}
        <div className="container-ih relative pt-[clamp(3.5rem,9vh,6.5rem)]">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-9 bg-primary/50" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-primary font-bold rtl:tracking-normal">
              {t({ ar: "معرض المشاريع", en: "The portfolio" })}
            </span>
          </div>
          <h2
            className="font-editorial text-foreground"
            style={{ fontSize: "clamp(1.9rem, 4.4vw, 3.4rem)", lineHeight: 1.05, letterSpacing: "-0.02em", fontWeight: 600 }}
          >
            {t({ ar: "مشاريع وُلدت في ", en: "Ventures built at " })}
            <span className="italic text-primary">{t({ ar: "آيلاند.", en: "Island Haven." })}</span>
          </h2>
        </div>

        {/* The scroll ticker */}
        <div className="container-ih relative flex-1 grid lg:grid-cols-12 items-center gap-x-[clamp(2rem,5vw,5rem)] gap-y-8">
          {/* Center focus list */}
          <div className="lg:col-span-7 relative overflow-hidden" style={{ height: LIST_H }}>
            {/* focus guide hairline */}
            <div aria-hidden className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-primary/30 via-transparent to-transparent rtl:bg-gradient-to-l" />
            <motion.div
              className="absolute inset-x-0 top-0"
              animate={{ y: LIST_H / 2 - (active + 0.5) * ITEM_H }}
              transition={{ type: "spring", stiffness: 150, damping: 26, mass: 0.7 }}
            >
              {items.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => setActive(i)}
                  className="flex items-center gap-4 w-full text-start"
                  style={{ height: ITEM_H }}
                  data-testid={`showcase-venture-${v.id}`}
                >
                  <span
                    className="font-editorial transition-all duration-300 truncate"
                    style={{
                      fontSize: i === active ? "clamp(2rem, 4.4vw, 3.4rem)" : "clamp(1.4rem, 2.6vw, 2rem)",
                      fontWeight: i === active ? 600 : 500,
                      fontStyle: i === active ? "italic" : "normal",
                      letterSpacing: "-0.022em",
                      color: i === active ? "hsl(var(--primary))" : "hsl(var(--foreground) / 0.22)",
                    }}
                  >
                    {v.name}
                  </span>
                </button>
              ))}
            </motion.div>
          </div>

          {/* Synced detail panel */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              {cur && (
                <motion.div
                  key={cur.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="card-base p-7 lg:p-9"
                >
                  <div className="eyebrow eyebrow-sand mb-3">{stageLabel(cur.stage)}</div>
                  <div className="font-editorial italic text-foreground" style={{ fontSize: "clamp(1.4rem, 2.4vw, 2rem)", lineHeight: 1.1 }}>
                    {cur.name}
                  </div>
                  {cur.tagline && <p className="t-body mt-4">{cur.tagline}</p>}
                  <div className="mt-6 pt-5 border-t border-border-strong flex items-center gap-2 text-[13px] text-muted-foreground">
                    {cur.founderName && <span className="font-semibold text-foreground">{cur.founderName}</span>}
                    {cur.founderName && cur.sector && <span className="text-border-strong">·</span>}
                    {cur.sector && <span>{cur.sector}</span>}
                  </div>
                  <Link
                    href={`/ventures/${cur.id}`}
                    className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold text-primary"
                  >
                    {t({ ar: "تفاصيل المشروع", en: "View venture" })}
                    <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mt-6 flex gap-1.5">
              {items.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${i === active ? "w-8 bg-primary" : "w-3 bg-foreground/15"}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="container-ih relative pb-[clamp(2.5rem,7vh,4.5rem)]">
          <Link
            href="/ventures"
            data-testid="showcase-all"
            className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
          >
            {t({ ar: "كلّ المشاريع", en: "All ventures" })}
            <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
