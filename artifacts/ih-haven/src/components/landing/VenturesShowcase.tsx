import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { imageUrl, useContentSection } from "@/hooks/use-content";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";
import { ventureIdentity } from "@/lib/ventureIdentity";

interface Metric { v: string; ar: string; en: string }
interface Venture {
  id: number;
  name: string;
  tagline: string;
  founderName: string;
  sector: string;
  stage: string;
  featured: boolean;
  coverUrl: string | null;
  logoUrl: string | null;
  metrics?: Metric[]; // real, from the API/CMS when present
}

const STAGE_EN: Record<string, string> = {
  idea: "Idea", mvp: "MVP", launched: "Launched", scaling: "Scaling", growth: "Growth",
};
const STAGE_AR: Record<string, string> = {
  idea: "فكرة", mvp: "نموذج أوّليّ", launched: "انطلق", scaling: "توسّع", growth: "نموّ",
};

// Evergreen frames so a cover-less venture still wears real, dignified imagery.
const FRAMES = [
  "/photos/IMG_8344.webp", "/photos/IMG_8347.webp", "/photos/IMG_8349.webp",
  "/photos/IMG_8353.webp", "/photos/IMG_8357.webp", "/photos/IMG_8358.webp",
];
const frameFor = (id: number) => FRAMES[Math.abs(id) % FRAMES.length];

// ── Metrics come ONLY from real, confirmed sources: the API `venture.metrics`
//    field, or a CMS `venture_metrics` section (value = a JSON array of
//    {v,ar,en}, keyed by venture id or name). If neither is set, the card shows
//    NO metric row — never an invented number. The owner adds real figures in the
//    CMS and they appear automatically. (See plan Axis 0 — numbers honesty.) ──
function resolveMetrics(v: Venture, cms: Record<string, string>): Metric[] {
  if (v.metrics?.length) return v.metrics;
  const raw = cms[String(v.id)] ?? cms[v.name];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Metric[];
    } catch { /* malformed CMS value → show nothing, never invent */ }
  }
  return [];
}

/**
 * MetaBadges — the tidy metadata row beneath the title: STAGE · SECTOR · FOUNDER
 * set as small monochromatic pills, followed by any REAL metric figures as gold
 * pill badges (`text-sand-bright`, honesty preserved — the caller passes an empty
 * list → no metric pills render). Terracotta (primary) is the sole accent; the
 * sector dot uses the venture-identity hue only as a faint locating cue.
 */
function MetaBadges({ v, metrics, lang }: { v: Venture; metrics: Metric[]; lang: Lang }) {
  const vid = ventureIdentity(v.sector, v.id);
  const stage = lang === "ar" ? STAGE_AR[v.stage] ?? v.stage : STAGE_EN[v.stage] ?? v.stage;
  const pill = "inline-flex items-center gap-2 h-8 px-3.5 rounded-full ring-1 ring-white/12 bg-white/[0.04] text-[11.5px] font-bold uppercase tracking-[0.14em] rtl:tracking-normal";
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {stage && <span className={`${pill} text-primary ring-primary/25 bg-primary/[0.06]`}>{stage}</span>}
      {v.sector && (
        <span className={`${pill} text-white/72`}>
          <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: vid.accent }} />
          {v.sector}
        </span>
      )}
      {v.founderName && (
        <span className={`${pill} text-white/72 normal-case tracking-normal`}>
          <span className="text-white/40">{lang === "ar" ? "المؤسِّس" : "Founder"}</span>
          <span className="font-semibold text-white/85">{v.founderName}</span>
        </span>
      )}
      {/* Real metric figures only — rendered as gold pill badges, never invented. */}
      {metrics.map((m, i) => (
        <span key={i} className={`${pill} text-white/72 normal-case tracking-normal`}>
          <span className="font-display font-black tabular-nums text-sand-bright text-[14px] leading-none">{m.v}</span>
          <span className="text-white/60">{lang === "ar" ? m.ar : m.en}</span>
        </span>
      ))}
    </div>
  );
}

/** The "enter the story" affordance — reads like opening a case study, not a button. */
function CaseStudyCue({ t }: { t: ReturnType<typeof useLanguage>["t"] }) {
  return (
    <span className="inline-flex items-center gap-3 text-[14px] font-bold text-white transition-colors group-hover:text-primary">
      <span className="tracking-[0.02em] underline-offset-[6px] group-hover:underline decoration-primary/60 decoration-1">
        {t({ ar: "دراسة الحالة", en: "Case study" })}
      </span>
      <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
    </span>
  );
}

/**
 * VentureCard — the UNIFORM editorial card, repeated identically for every
 * venture (jonnyczar-style project list). Cover leads on TOP, generous and
 * edge-to-edge within the card; below it a clean content block carries the large
 * title, the tagline subtitle, the tidy metadata badge row (stage · sector ·
 * founder + real metric pills), and the case-study cue. Calm and minimal —
 * no lift, no shadow flash: only a restrained cover zoom + a slight arrow slide.
 */
function VentureCard({ v, index, metrics, lang, t }: { v: Venture; index: number; metrics: Metric[]; lang: Lang; t: ReturnType<typeof useLanguage>["t"] }) {
  const cover = v.coverUrl ? imageUrl(v.coverUrl) : frameFor(v.id);
  const vid = ventureIdentity(v.sector, v.id);
  return (
    <Reveal as="div" index={index}>
      <Link
        href={`/ventures/${v.id}`}
        data-testid={`showcase-venture-${v.id}`}
        className="group glass-panel-lg block p-3 -translate-y-0 transition-[transform,border-color] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] hover:border-white/20 motion-safe:hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060608]"
      >
        <div className="relative aspect-[16/9] overflow-hidden rounded-[24px] ring-1 ring-white/10 bg-[#070707]">
          <img
            src={cover}
            alt={v.name}
            loading="lazy"
            decoding="async"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = frameFor(v.id); }}
            className="absolute inset-0 h-full w-full object-cover object-center saturate-[1.05] transition-transform duration-[1100ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none motion-safe:group-hover:scale-[1.03]"
          />
          <div aria-hidden className="absolute inset-0 opacity-[0.16] mix-blend-soft-light" style={{ background: vid.gradient }} />
        </div>

        {/* Content block — large title, tagline subtitle, metadata badges, cue. */}
        <div className="px-[clamp(1.5rem,3vw,3.25rem)] pb-[clamp(2rem,3vw,3rem)] pt-[clamp(2rem,3vw,3rem)]">
          <h3 className="font-display font-black text-white" style={{ fontSize: "clamp(2.2rem,4vw,3.6rem)", lineHeight: 0.96, letterSpacing: "-0.045em" }}>
            {v.name}
          </h3>
          {v.tagline && (
            <p className="mt-5 max-w-2xl font-display text-white/82" style={{ fontSize: "clamp(1.15rem,1.8vw,1.55rem)", lineHeight: 1.38, letterSpacing: "-0.015em" }}>
              {v.tagline}
            </p>
          )}

          <div className="mt-8">
            <MetaBadges v={v} metrics={metrics} lang={lang} />
          </div>

          <div className="mt-8">
            <CaseStudyCue t={t} />
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

/**
 * VenturesShowcase — the portfolio as a uniform editorial project list: every
 * venture wears the same full-width card (cover on top, then title + tagline +
 * metadata badges + case-study cue), stacked with generous whitespace. Real
 * /ventures data, never-empty evergreen fallback. The signature "معرض المشاريع".
 */
export function VenturesShowcase() {
  const { t, lang } = useLanguage();
  useReducedMotion();
  // Confirmed metrics only — the owner adds real per-venture figures in this CMS
  // section (value = JSON array of {v,ar,en}, keyed by venture id or name).
  const metricsCms = useContentSection("venture_metrics", {} as Record<string, string>);
  const [rows, setRows] = useState<Venture[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ ventures: Venture[] }>("/ventures")
      .then((r) => {
        if (cancelled) return;
        const sorted = [...r.ventures].sort((a, b) => Number(b.featured) - Number(a.featured));
        setRows(sorted.slice(0, 4));
      })
      .catch(() => !cancelled && setRows([]));
    return () => { cancelled = true; };
  }, []);

  if (!rows) return null;

  return (
    <section id="ventures-band" className="relative bg-background section-y overflow-hidden">
      <div aria-hidden className="absolute inset-0 glass-ambient pointer-events-none" />
      <div className="container-ih relative">
        <Reveal as="header" className="max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <span aria-hidden className="h-px w-9 bg-primary/70" />
            <span className="eyebrow">
              {t({ ar: "معرض المشاريع", en: "The portfolio" })}
            </span>
          </div>
          <h2 className="font-display font-black text-foreground" style={{ fontSize: "clamp(2.4rem, 5vw, 4.5rem)", lineHeight: 0.98, letterSpacing: "-0.045em" }}>
            {t({ ar: "مشاريع وُلدت في ", en: "Ventures built at " })}
            <span className="text-primary">{t({ ar: "آيلاند.", en: "Island Haven." })}</span>
          </h2>
          <p className="t-body-lg mt-6 max-w-2xl">
            {t({
              ar: "من فكرة على ورقة، إلى يوم عرضٍ أمام الدّاعمين، إلى منتجٍ يخدم النّاس — هذه المحفظة تنمو داخل مساحتنا في غزّة.",
              en: "From an idea on paper, to a Demo Day in front of our backers, to a product serving people — this portfolio is growing inside our space in Gaza.",
            })}
          </p>
        </Reveal>

        {rows.length === 0 ? (
          <Reveal className="mt-[clamp(2.5rem,5vw,4rem)]">
            <div className="relative overflow-hidden rounded-[24px] ring-1 ring-white/10 h-[clamp(420px,58vh,640px)]">
              <img src={frameFor(1)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#070707] via-[#070707]/55 to-[#070707]/15" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9 lg:p-12 max-w-3xl">
                <div className="text-[12px] font-bold uppercase tracking-[0.14em] rtl:tracking-normal text-primary mb-4">
                  {t({ ar: "الدفعة الأولى", en: "Cohort 01" })}
                </div>
                <h3 className="font-display font-black text-white" style={{ fontSize: "clamp(2rem, 4.6vw, 4rem)", lineHeight: 0.98, letterSpacing: "-0.04em" }}>
                  {t({ ar: "أوّل دفعة تَبني الآن.", en: "The first cohort is building now." })}
                </h3>
                <p className="mt-4 max-w-xl text-white/72 leading-relaxed" style={{ fontSize: "clamp(1rem, 1.5vw, 1.25rem)" }}>
                  {t({
                    ar: "هنا، قريبًا، تظهر أسماء المشاريع التي وُلدت في آيلاند — ومقعدك في الصفحة التالية.",
                    en: "This is where the names of ventures born at Island Haven will live — and your seat is on the next page.",
                  })}
                </p>
                <Link href="/apply" data-testid="showcase-apply" className="cta-fill group mt-7 inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#060608] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                  {t({ ar: "قدّم للدفعة الأولى", en: "Apply to the first cohort" })}
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </Reveal>
        ) : (
          <>
            {/* Uniform project list — every venture gets the same editorial card,
                separated by generous whitespace (gallery rhythm), no dividers. */}
            <div className="mt-[clamp(3rem,6vw,5rem)] flex flex-col gap-[clamp(3rem,6vw,5.5rem)]">
              {rows.map((v, i) => (
                <VentureCard key={v.id} v={v} index={i} metrics={resolveMetrics(v, metricsCms)} lang={lang} t={t} />
              ))}
            </div>

            <Reveal className="mt-[clamp(2.5rem,5vw,4rem)]">
              <Link
                href="/ventures"
                data-testid="showcase-all"
                className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#060608] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                {t({ ar: "كلّ المشاريع", en: "All ventures" })}
                <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </>
        )}
      </div>
    </section>
  );
}
