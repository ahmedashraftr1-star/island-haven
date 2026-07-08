import { useMemo } from "react";
import { Link } from "wouter";
import { useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useContentSection } from "@/hooks/use-content";
import { useVentures } from "@/hooks/use-public-data";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";
import { ShowcaseCard } from "@/components/landing/ShowcaseCard";

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
  // EN overrides — passed through to ShowcaseCard, shown ONLY in English.
  nameEn?: string | null;
  taglineEn?: string | null;
  sectorEn?: string | null;
  metrics?: Metric[]; // real, from the API/CMS when present
}

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
  const { data, isLoading, isError } = useVentures<Venture>();

  // Featured-first sort + top-4 slice, memoized off the cached query data.
  const rows = useMemo<Venture[] | null>(() => {
    // Loading → null (quiet, render nothing). Error → [] so the evergreen
    // fallback stands instead of a broken blank.
    if (isLoading) return null;
    if (isError || !data) return [];
    const sorted = [...data.ventures].sort((a, b) => Number(b.featured) - Number(a.featured));
    return sorted.slice(0, 4);
  }, [data, isLoading, isError]);

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
            <div className="mt-[clamp(3rem,6vw,5rem)] grid grid-cols-1 md:grid-cols-2 gap-[clamp(1.75rem,3.5vw,2.75rem)]">
              {rows.map((v, i) => (
                <Reveal as="div" key={v.id} index={i}>
                  <ShowcaseCard
                    venture={v}
                    metrics={resolveMetrics(v, metricsCms)}
                    lang={lang}
                    t={t}
                    testId={`showcase-venture-${v.id}`}
                    fallbackCover={frameFor(v.id)}
                  />
                </Reveal>
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
