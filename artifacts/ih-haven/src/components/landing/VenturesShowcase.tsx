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

/** First real glyph of a name — the founder monogram in the collaborator credit. */
function monogram(name: string): string {
  const c = (name ?? "").trim().charAt(0);
  return c ? c.toUpperCase() : "•";
}

/** Gold figures. Real metrics only — the caller passes an empty list → renders nothing. */
function MetricRow({ metrics, lang }: { metrics: Metric[]; lang: Lang }) {
  if (!metrics.length) return null;
  return (
    <ul className="flex flex-wrap gap-x-12 gap-y-6 border-t border-white/10 pt-7 list-none">
      {metrics.map((m, i) => (
        <li key={i}>
          <div className="font-display font-black tabular-nums text-sand-bright leading-none" style={{ fontSize: "clamp(1.6rem,2.6vw,2.3rem)", letterSpacing: "-0.02em" }}>
            {m.v}
          </div>
          <div className="mt-2 text-[11px] uppercase tracking-[0.14em] rtl:tracking-normal text-white/55 font-semibold">{lang === "ar" ? m.ar : m.en}</div>
        </li>
      ))}
    </ul>
  );
}

/**
 * MetaLine — the editorial credit line: STAGE · SECTOR, set quietly in small
 * caps. Terracotta (primary) is the sole accent; the sector dot uses the venture
 * identity hue only as a faint locating cue, never as a competing accent.
 */
function MetaLine({ v, lang }: { v: Venture; lang: Lang }) {
  const vid = ventureIdentity(v.sector, v.id);
  const stage = lang === "ar" ? STAGE_AR[v.stage] ?? v.stage : STAGE_EN[v.stage] ?? v.stage;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px] font-bold uppercase tracking-[0.2em] rtl:tracking-normal">
      <span className="text-primary">{stage}</span>
      {v.sector && (
        <>
          <span aria-hidden className="text-white/18">·</span>
          <span className="inline-flex items-center gap-2 text-white/70">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: vid.accent }} />
            {v.sector}
          </span>
        </>
      )}
    </div>
  );
}

/**
 * Collaborator — a small circular founder monogram + name, credited like the
 * author of a case study. Refined, editorial, human — the "who built this".
 */
function Collaborator({ v, lang, size = "lg" }: { v: Venture; lang: Lang; size?: "lg" | "sm" }) {
  if (!v.founderName) return null;
  const dim = size === "lg" ? "h-11 w-11 text-[15px]" : "h-9 w-9 text-[13px]";
  return (
    <div className="flex items-center gap-3.5">
      <span
        aria-hidden
        className={`grid place-items-center ${dim} shrink-0 rounded-full font-display font-black text-white/90 ring-1 ring-white/20 bg-white/[0.06]`}
      >
        {monogram(v.founderName)}
      </span>
      <div className="leading-tight">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] rtl:tracking-normal text-white/45">
          {lang === "ar" ? "المؤسِّس" : "Founder"}
        </div>
        <div className={`${size === "lg" ? "text-[15px]" : "text-[13.5px]"} font-semibold text-white/85 mt-0.5`}>
          {v.founderName}
        </div>
      </div>
    </div>
  );
}

/** The "enter the story" affordance — reads like opening a case study, not a button. */
function CaseStudyCue({ t, size = "lg" }: { t: ReturnType<typeof useLanguage>["t"]; size?: "lg" | "sm" }) {
  return (
    <span className={`inline-flex items-center gap-3 ${size === "lg" ? "text-[15px]" : "text-[13.5px]"} font-bold text-white transition-colors group-hover:text-primary`}>
      <span className="tracking-[0.02em] underline-offset-[6px] group-hover:underline decoration-primary/60 decoration-1">
        {t({ ar: "دراسة الحالة", en: "Case study" })}
      </span>
      <span aria-hidden className="grid place-items-center h-8 w-8 rounded-full ring-1 ring-white/20 bg-white/[0.05] transition-[background-color,border-color] duration-300 group-hover:bg-primary/15 group-hover:ring-primary/40">
        <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
      </span>
    </span>
  );
}

/**
 * FlagshipCard — the portfolio's headline case study, given room to breathe. The
 * cover leads on TOP (fully intact, never fighting overlaid text); below it a
 * long editorial column carries the credit line, a monumental title, the tagline
 * set as a LARGE pull-quote statement, real proof figures, and — separated by a
 * hairline — the founder as a credited collaborator opposite the case-study cue.
 */
function FlagshipCard({ v, metrics, lang, t }: { v: Venture; metrics: Metric[]; lang: Lang; t: ReturnType<typeof useLanguage>["t"] }) {
  const cover = v.coverUrl ? imageUrl(v.coverUrl) : frameFor(v.id);
  const vid = ventureIdentity(v.sector, v.id);
  return (
    <Reveal as="div">
      <Link
        href={`/ventures/${v.id}`}
        data-testid={`showcase-venture-${v.id}`}
        className="group glass-panel-lg block p-3 transition-[transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] hover:-translate-y-1.5 hover:border-white/25 hover:shadow-[0_48px_100px_-38px_hsl(0_0%_0%/0.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        <div className="relative aspect-[21/9] overflow-hidden rounded-[24px] ring-1 ring-white/10 bg-[#070707]">
          <img
            src={cover}
            alt={v.name}
            loading="lazy"
            decoding="async"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = frameFor(v.id); }}
            className="absolute inset-0 h-full w-full object-cover object-center saturate-[1.05] transition-transform duration-[1100ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none group-hover:scale-[1.04]"
          />
          <div aria-hidden className="absolute inset-0 opacity-[0.18] mix-blend-soft-light" style={{ background: vid.gradient }} />
          <span className="absolute top-6 inset-inline-start-6 text-[10px] tracking-[0.24em] uppercase font-bold text-white bg-primary-cta rounded-full px-4 h-7 inline-flex items-center rtl:tracking-normal">
            {t({ ar: "مشروع مميّز", en: "Flagship" })}
          </span>
        </div>

        {/* Editorial column — deliberate, generous vertical rhythm. */}
        <div className="px-[clamp(1.75rem,4vw,4.5rem)] pb-[clamp(2.5rem,4vw,4rem)] pt-[clamp(2.5rem,3.5vw,3.75rem)]">
          <div className="max-w-4xl">
            <MetaLine v={v} lang={lang} />
            <h3 className="mt-6 font-display font-black text-white" style={{ fontSize: "clamp(3rem,6.4vw,5rem)", lineHeight: 0.94, letterSpacing: "-0.05em" }}>
              {v.name}
            </h3>
            {v.tagline && (
              <p className="mt-8 max-w-3xl font-display text-white/85" style={{ fontSize: "clamp(1.4rem,2.6vw,2.15rem)", lineHeight: 1.32, letterSpacing: "-0.02em" }}>
                {v.tagline}
              </p>
            )}
          </div>

          {metrics.length > 0 && (
            <div className="mt-10">
              <MetricRow metrics={metrics} lang={lang} />
            </div>
          )}

          {/* Byline row — founder credited as collaborator, opposite the cue. */}
          <div className="mt-12 flex flex-col gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <Collaborator v={v} lang={lang} size="lg" />
            <CaseStudyCue t={t} size="lg" />
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

/**
 * VentureRow — a supporting case study carrying the same editorial DNA at a
 * quieter scale: cover on the logical-start side, a generous editorial column on
 * the other with the credit line, title, tagline statement, real figures, and the
 * founder byline paired with the case-study cue. Uneven against the flagship so
 * the sequence keeps a deliberate, magazine-like rhythm.
 */
function VentureRow({ v, index, metrics, lang, t }: { v: Venture; index: number; metrics: Metric[]; lang: Lang; t: ReturnType<typeof useLanguage>["t"] }) {
  const cover = v.coverUrl ? imageUrl(v.coverUrl) : frameFor(v.id);
  const vid = ventureIdentity(v.sector, v.id);
  return (
    <Reveal as="div" delay={0.04 * index}>
      <Link
        href={`/ventures/${v.id}`}
        data-testid={`showcase-venture-${v.id}`}
        className="group grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-[clamp(0.5rem,1vw,0.75rem)] glass-panel p-3 transition-[transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] hover:-translate-y-1.5 hover:border-white/25 hover:shadow-[0_44px_100px_-36px_hsl(0_0%_0%/0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        <div className="relative aspect-[16/11] md:aspect-auto md:min-h-[340px] overflow-hidden rounded-[20px] ring-1 ring-white/10 bg-[#070707]">
          <img
            src={cover}
            alt={v.name}
            loading="lazy"
            decoding="async"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = frameFor(v.id); }}
            className="absolute inset-0 h-full w-full object-cover object-center saturate-[1.05] transition-transform duration-[1100ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none group-hover:scale-[1.04]"
          />
          <div aria-hidden className="absolute inset-0 opacity-[0.16] mix-blend-soft-light" style={{ background: vid.gradient }} />
        </div>
        <div className="px-[clamp(1.5rem,2.6vw,2.75rem)] py-[clamp(2rem,3vw,3rem)] flex flex-col justify-center">
          <MetaLine v={v} lang={lang} />
          <h3 className="mt-5 font-display font-black text-white" style={{ fontSize: "clamp(1.9rem,3vw,2.85rem)", lineHeight: 0.98, letterSpacing: "-0.035em" }}>
            {v.name}
          </h3>
          {v.tagline && (
            <p className="mt-5 max-w-xl font-display text-white/82" style={{ fontSize: "clamp(1.1rem,1.55vw,1.35rem)", lineHeight: 1.4, letterSpacing: "-0.01em" }}>
              {v.tagline}
            </p>
          )}
          {metrics.length > 0 && (
            <div className="mt-8">
              <MetricRow metrics={metrics} lang={lang} />
            </div>
          )}
          <div className="mt-9 flex flex-col gap-5 border-t border-white/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
            <Collaborator v={v} lang={lang} size="sm" />
            <CaseStudyCue t={t} size="sm" />
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

/**
 * VenturesShowcase — the portfolio as an editorial spread: one headline case
 * study (cover on top, a long editorial column below) followed by an uneven
 * sequence of supporting studies, each credited to its founder and carrying real
 * proof. Real /ventures data, never-empty evergreen fallback. The signature
 * "معرض المشاريع".
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
                <Link href="/apply" data-testid="showcase-apply" className="cta-fill group mt-7 inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                  {t({ ar: "قدّم للدفعة الأولى", en: "Apply to the first cohort" })}
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </Reveal>
        ) : (
          <>
            {/* Editorial spread — generous vertical air between studies for pacing. */}
            <div className="mt-[clamp(3rem,6vw,5rem)] flex flex-col gap-[clamp(2rem,4vw,4rem)]">
              <FlagshipCard v={rows[0]} metrics={resolveMetrics(rows[0], metricsCms)} lang={lang} t={t} />
              {rows.slice(1).map((v, i) => (
                <VentureRow key={v.id} v={v} index={i} metrics={resolveMetrics(v, metricsCms)} lang={lang} t={t} />
              ))}
            </div>

            <Reveal className="mt-[clamp(2.5rem,5vw,4rem)]">
              <Link
                href="/ventures"
                data-testid="showcase-all"
                className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0"
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
