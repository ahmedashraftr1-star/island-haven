import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { imageUrl } from "@/hooks/use-content";
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

// ── OWNER-PROVIDED metrics (from the design brief), keyed by normalised name.
//    TEMPORARY: shown so the "proof inside the card" reads now; the code prefers
//    real `venture.metrics` from the API/CMS whenever present. Verify + move
//    these into the venture records before production — do NOT invent numbers. ──
const norm = (s: string) => s.replace(/[ً-ٰٟ]/g, "").replace(/\s+/g, "").trim();
const OWNER_METRICS: Record<string, Metric[]> = {
  [norm("مُستشارك")]: [{ v: "٤٬٠٠٠+", ar: "مستخدم", en: "users" }, { v: "2ⁿᵈ", ar: "هاكثون البنّائين", en: "builders' hackathon" }],
  [norm("إغاثة+")]: [{ v: "٤٠K", ar: "أسرة", en: "families reached" }, { v: "٠٪", ar: "ازدواجيّة", en: "duplication" }],
  [norm("طبيبك عن بُعد")]: [{ v: "٢٤/٧", ar: "وصول", en: "access" }],
  [norm("مَنهجي")]: [{ v: "Offline", ar: "يعمل بلا شبكة", en: "works offline" }],
};
const metricsFor = (v: Venture): Metric[] => v.metrics ?? OWNER_METRICS[norm(v.name)] ?? [];

function MetricRow({ metrics, lang }: { metrics: Metric[]; lang: Lang }) {
  if (!metrics.length) return null;
  return (
    <ul className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/12 pt-5 list-none">
      {metrics.map((m, i) => (
        <li key={i}>
          <div className="font-display font-black tabular-nums text-white leading-none" style={{ fontSize: "clamp(1.5rem,2.4vw,2.1rem)", letterSpacing: "-0.02em" }}>
            {m.v}
          </div>
          <div className="mt-1.5 text-[11.5px] text-white/50 font-medium">{lang === "ar" ? m.ar : m.en}</div>
        </li>
      ))}
    </ul>
  );
}

function Meta({ v, lang, t }: { v: Venture; lang: Lang; t: ReturnType<typeof useLanguage>["t"] }) {
  const vid = ventureIdentity(v.sector, v.id);
  const stage = lang === "ar" ? STAGE_AR[v.stage] ?? v.stage : STAGE_EN[v.stage] ?? v.stage;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] font-bold uppercase tracking-[0.14em] rtl:tracking-normal">
      <span className="text-primary">{stage}</span>
      {v.sector && (
        <>
          <span aria-hidden className="text-white/22">/</span>
          <span className="inline-flex items-center gap-1.5" style={{ color: vid.accent }}>
            <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: vid.accent }} />
            {v.sector}
          </span>
        </>
      )}
      {v.founderName && (<><span aria-hidden className="text-white/22">/</span><span className="text-white/70">{v.founderName}</span></>)}
    </div>
  );
}

/**
 * FlagshipCard — the portfolio's headline project. The cover leads on TOP (fully
 * intact, not fighting overlaid text), then a readable dark panel carries the
 * name at display scale, the tagline, the proof metrics, and the case-study CTA.
 */
function FlagshipCard({ v, lang, t }: { v: Venture; lang: Lang; t: ReturnType<typeof useLanguage>["t"] }) {
  const cover = v.coverUrl ? imageUrl(v.coverUrl) : frameFor(v.id);
  const vid = ventureIdentity(v.sector, v.id);
  return (
    <Reveal as="div">
      <Link
        href={`/ventures/${v.id}`}
        data-testid={`showcase-venture-${v.id}`}
        className="group block overflow-hidden rounded-[26px] border border-white/12 bg-surface-2 transition-[transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] hover:-translate-y-1.5 hover:border-white/25 hover:shadow-[0_40px_80px_-40px_rgba(0,0,0,0.7)]"
      >
        <div className="relative aspect-[21/9] overflow-hidden bg-[#070707]">
          <img
            src={cover}
            alt={v.name}
            loading="lazy"
            decoding="async"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = frameFor(v.id); }}
            className="absolute inset-0 h-full w-full object-cover object-center saturate-[1.05] transition-transform duration-[1100ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none group-hover:scale-[1.04]"
          />
          <div aria-hidden className="absolute inset-0 opacity-[0.18] mix-blend-soft-light" style={{ background: vid.gradient }} />
          <span className="absolute top-5 inset-inline-start-5 text-[10px] tracking-[0.2em] uppercase font-bold text-white bg-primary-cta rounded-full px-3.5 h-7 inline-flex items-center rtl:tracking-normal">
            {t({ ar: "مشروع مميّز", en: "Flagship" })}
          </span>
        </div>

        <div className="p-[clamp(1.75rem,3.5vw,3rem)]">
          <Meta v={v} lang={lang} t={t} />
          <h3 className="mt-4 font-display font-black text-white" style={{ fontSize: "clamp(2.2rem,4.4vw,3.75rem)", lineHeight: 0.98, letterSpacing: "-0.04em" }}>
            {v.name}
          </h3>
          {v.tagline && (
            <p className="mt-4 max-w-2xl text-white/72 leading-relaxed" style={{ fontSize: "clamp(1.05rem,1.6vw,1.35rem)" }}>
              {v.tagline}
            </p>
          )}
          <MetricRow metrics={metricsFor(v)} lang={lang} />
          <span className="mt-7 inline-flex items-center gap-2.5 text-[14px] font-bold text-white">
            {t({ ar: "دراسة الحالة", en: "Case study" })}
            <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1.5 rtl:group-hover:translate-x-1.5" />
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

/**
 * VentureRow — a supporting project: cover on the logical-start side, the readable
 * panel on the other. Uneven against the flagship, so the sequence has rhythm.
 */
function VentureRow({ v, index, lang, t }: { v: Venture; index: number; lang: Lang; t: ReturnType<typeof useLanguage>["t"] }) {
  const cover = v.coverUrl ? imageUrl(v.coverUrl) : frameFor(v.id);
  const vid = ventureIdentity(v.sector, v.id);
  return (
    <Reveal as="div" delay={0.04 * index}>
      <Link
        href={`/ventures/${v.id}`}
        data-testid={`showcase-venture-${v.id}`}
        className="group grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] overflow-hidden rounded-[24px] border border-white/12 bg-surface-2 transition-[transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_30px_60px_-36px_rgba(0,0,0,0.7)]"
      >
        <div className="relative aspect-[16/11] md:aspect-auto md:min-h-[300px] overflow-hidden bg-[#070707]">
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
        <div className="p-[clamp(1.5rem,2.6vw,2.5rem)] flex flex-col justify-center">
          <Meta v={v} lang={lang} t={t} />
          <h3 className="mt-3.5 font-display font-black text-white" style={{ fontSize: "clamp(1.7rem,2.8vw,2.6rem)", lineHeight: 1.0, letterSpacing: "-0.03em" }}>
            {v.name}
          </h3>
          {v.tagline && (
            <p className="mt-3 text-white/70 leading-relaxed" style={{ fontSize: "clamp(0.98rem,1.3vw,1.1rem)" }}>
              {v.tagline}
            </p>
          )}
          <MetricRow metrics={metricsFor(v)} lang={lang} />
          <span className="mt-6 inline-flex items-center gap-2 text-[13.5px] font-bold text-white">
            {t({ ar: "دراسة الحالة", en: "Case study" })}
            <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1.5 rtl:group-hover:translate-x-1.5" />
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

/**
 * VenturesShowcase — the portfolio as THE flagship section: one headline project
 * (cover on top, readable panel below) followed by an uneven sequence of
 * supporting projects, each carrying real proof. Real /ventures data, never-empty
 * evergreen fallback. The signature "معرض المشاريع".
 */
export function VenturesShowcase() {
  const { t, lang } = useLanguage();
  useReducedMotion();
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
      <div className="container-ih relative">
        <Reveal as="header" className="max-w-3xl">
          <div className="flex items-center gap-3 mb-5">
            <span aria-hidden className="h-px w-9 bg-primary" />
            <span className="text-[11px] tracking-[0.2em] uppercase text-primary font-bold rtl:tracking-normal">
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
                <Link href="/apply" data-testid="showcase-apply" className="cta-fill group mt-7 inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5">
                  {t({ ar: "قدّم للدفعة الأولى", en: "Apply to the first cohort" })}
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </Reveal>
        ) : (
          <>
            <div className="mt-[clamp(2.5rem,5vw,4rem)] flex flex-col gap-[clamp(1.5rem,3vw,2.75rem)]">
              <FlagshipCard v={rows[0]} lang={lang} t={t} />
              {rows.slice(1).map((v, i) => (
                <VentureRow key={v.id} v={v} index={i} lang={lang} t={t} />
              ))}
            </div>

            <Reveal className="mt-[clamp(2.5rem,5vw,4rem)]">
              <Link
                href="/ventures"
                data-testid="showcase-all"
                className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
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
