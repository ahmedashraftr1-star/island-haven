import { useRef, type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { useVentures } from "@/hooks/use-public-data";
import { type VentureStage } from "@/lib/labels";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { Ticker } from "@/components/landing/Ticker";
import { Reveal } from "@/components/landing/Reveal";
import { ShowcaseCard } from "@/components/landing/ShowcaseCard";
import { useCountUp } from "@/hooks/use-count-up";
import { useContentSection } from "@/hooks/use-content";

// The sectors the incubator builds across — a calm, evergreen roster that glides
// in the hero aside (font-mono, faint). Not live data; a qualitative register of
// the problem-spaces the portfolio spans.
const SECTOR_TAGS = [
  "LegalTech",
  "HealthTech",
  "ReliefTech",
  "EdTech",
  "FinTech",
  "AgriTech",
  "WellTech",
  "ConstructionTech",
];

interface Metric {
  v: string;
  ar: string;
  en: string;
}
interface Venture {
  id: number;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string | null;
  coverUrl: string | null;
  websiteUrl: string;
  founderName: string;
  founderQuote?: string;
  sector: string;
  stage: VentureStage;
  foundedYear: number;
  teamSize: number;
  featured: boolean;
  // EN overrides — passed through to ShowcaseCard, shown ONLY in English.
  nameEn?: string | null;
  taglineEn?: string | null;
  sectorEn?: string | null;
  metrics?: Metric[]; // real, from the API/CMS when present
}

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
// Localised numeral: Arabic-Indic in AR, Western digits in EN.
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}

// A handful of evergreen photographs to give cover-less ventures dignified,
// real imagery instead of a crimson initial-medallion. Deterministic by id so a
// given venture always wears the same frame.
const VENTURE_FRAMES = [
  "/photos/IMG_8344.webp",
  "/photos/IMG_8347.webp",
  "/photos/IMG_8349.webp",
  "/photos/IMG_8353.webp",
  "/photos/IMG_8357.webp",
  "/photos/IMG_8358.webp",
];
function frameFor(id: number): string {
  return VENTURE_FRAMES[Math.abs(id) % VENTURE_FRAMES.length];
}

export default function Ventures() {
  const { lang, t } = useLanguage();
  // Shared cached hook: the homepage already warms the `ventures` key, so landing
  // here paints from cache instead of a spinner. It also drops the old effect's
  // `lang` dependency, which refetched the whole list on every AR↔EN toggle —
  // the error copy is now resolved at render time instead.
  const { data, isLoading, isError } = useVentures<Venture>();
  const rows = data?.ventures ?? [];
  const reduce = useReducedMotion();
  // Confirmed metrics only — the owner adds real per-venture figures in this CMS
  // section (value = JSON array of {v,ar,en}, keyed by venture id or name).
  const metricsCms = useContentSection("venture_metrics", {} as Record<string, string>);

  const featured = (rows ?? []).filter((v) => v.featured);
  const rest = (rows ?? []).filter((v) => !v.featured);
  // Featured ventures lead the gallery; then the rest, in order.
  const all = [...featured, ...rest];
  const total = rows?.length ?? 0;
  const launched = (rows ?? []).filter(
    (v) => v.stage === "launched" || v.stage === "scaling",
  ).length;
  // Real, defensible third figure — the count of distinct sectors the live
  // portfolio actually spans (derived from the /ventures data, no invention).
  const sectorCount = new Set(
    (rows ?? []).map((v) => v.sector?.trim().toLowerCase()).filter(Boolean),
  ).size;

  return (
    <PageShell
      active="ventures"
      eyebrow={t({ ar: "صُنِع في آيلاند · Made in Gaza", en: "Made in Island Haven · Made in Gaza" })}
      title={t({ ar: "مشاريع وُلدت", en: "Ventures built" })}
      highlight={t({ ar: "في آيلاند", en: "at Island Haven" })}
      titleClassName="text-foreground/50"
      subtitle={t({
        ar: "من فكرة على ورقة، إلى يوم عرضٍ أمام الدّاعمين، إلى منتجٍ يخدم النّاس ويصنع فرص عمل في غزّة — هذه هي المحفظة التي تنمو داخل مساحتنا.",
        en: "From an idea on paper, to a Demo Day in front of our backers, to a product that serves people and creates jobs in Gaza — this is the portfolio growing inside our space.",
      })}
      heroAside={<SectorTickerAside />}
    >
      {isLoading ? (
        <SkeletonVentures />
      ) : isError ? (
        <GlassCard className="p-5 text-primary text-center font-medium">
          {t({ ar: "تعذّر التحميل", en: "Couldn't load ventures" })}
        </GlassCard>
      ) : rows.length === 0 ? (
        <EmptyPortfolio />
      ) : (
        <>
          {/* Live portfolio reading — three stat boxes, divided by hairline
              borders (no shadows). Real figures only: portfolio count, live in
              market, and the number of sectors the portfolio spans (or, when the
              spread is too thin to read, the 100%-free truth). */}
          <StatRow
            total={total}
            launched={launched}
            sectorCount={sectorCount}
            lang={lang}
            reduce={!!reduce}
          />

          {/* The portfolio — a quiet editorial gallery: one uniform full-width
              card per venture (cover on top → title → tagline → metadata badges →
              case-study cue), mirroring the homepage VenturesShowcase. */}
          <VentureGallery ventures={all} cms={metricsCms} lang={lang} reduce={!!reduce} />

          {/* Terminal CTA — your venture is the next line */}
          <ClosingCTA />
        </>
      )}
    </PageShell>
  );
}

// ── Hero aside — a calm, edge-masked strip of sector tags gliding past in
// font-mono / fg-faint. Sits to the right of the page title so the hero never
// reads as empty space. Two strips drifting at different speeds give the aside a
// quiet sense of vertical depth without ever shouting. Reduced-motion → the
// Ticker itself falls back to a static centred wrap. ──
function SectorTickerAside() {
  const { t } = useLanguage();
  const tag = (label: string) => (
    <span
      key={label}
      className="inline-flex items-center gap-2 font-mono text-fg-faint"
      style={{ fontSize: "clamp(0.72rem,0.9vw,0.82rem)", letterSpacing: "0.06em" }}
    >
      <span aria-hidden className="h-1 w-1 rounded-full bg-sand/60" />
      {label}
    </span>
  );
  const items = SECTOR_TAGS.map(tag);
  const itemsAlt = [...SECTOR_TAGS].reverse().map(tag);
  return (
    <div
      aria-hidden
      className="relative w-full select-none"
    >
      <div aria-hidden className="mb-5 h-px w-full hairline-sand opacity-50" />
      {/* faint mono caption — names what the strip is, RTL-safe */}
      <div
        className="mb-3 font-mono text-fg-faint"
        style={{ fontSize: "0.6875rem", letterSpacing: "0.18em" }}
      >
        <span className="rtl:tracking-normal">
          {t({ ar: "القطاعات", en: "SECTORS" })}
        </span>
      </div>
      <Ticker
        speedSeconds={56}
        gapClass="gap-x-7"
        ariaLabel={t({ ar: "القطاعات التي نبني فيها", en: "Sectors we build across" })}
        items={items}
      />
      <div className="mt-3">
        <Ticker speedSeconds={72} gapClass="gap-x-7" items={itemsAlt} />
      </div>
      <div aria-hidden className="mt-4 h-px w-full hairline-sand opacity-50" />
    </div>
  );
}

// ── Stat row — three boxes side by side, divided only by 1px hairline borders
// (no shadows, per the house bar). Big font-mono numerals + small mono labels.
// Stacks to a single column on the narrowest screens; RTL handled by border
// utilities (border-s / border-e flip automatically). ──
function StatRow({
  total,
  launched,
  sectorCount,
  lang,
  reduce,
}: {
  total: number;
  launched: number;
  sectorCount: number;
  lang: Lang;
  reduce: boolean;
}) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  // Third box: prefer the real sector spread; if it's too thin to read as a
  // figure (a forming portfolio), fall back to the 100%-free truth.
  const thirdIsSectors = sectorCount >= 2;
  return (
    <motion.div
      ref={ref}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_EXPO }}
      className="grid grid-cols-1 sm:grid-cols-3 border border-border-strong rounded-[20px] overflow-hidden divide-y sm:divide-y-0 sm:divide-x rtl:sm:divide-x-reverse divide-border-strong"
    >
      <StatBox
        value={<AnimatedNum target={total} lang={lang} inView={inView} duration={1000} />}
        label={t({ ar: "في المحفظة", en: "in the portfolio" })}
        hint={t({ ar: "كلّها صُنعت داخل الحاضنة", en: "all built inside the incubator" })}
      />
      <StatBox
        value={launched > 0 ? <AnimatedNum target={launched} lang={lang} inView={inView} duration={900} /> : "—"}
        label={t({ ar: "في السّوق الآن", en: "live in market" })}
        hint={t({ ar: "بمرحلة الإطلاق أو التوسّع", en: "at launch or scaling stage" })}
      />
      {thirdIsSectors ? (
        <StatBox
          value={<AnimatedNum target={sectorCount} lang={lang} inView={inView} duration={800} />}
          label={t({ ar: "قطاعات نبني فيها", en: "sectors represented" })}
          hint={t({ ar: "من القانون إلى الصحّة إلى التعليم", en: "from legal to health to education" })}
        />
      ) : (
        <StatBox
          value={t({ ar: "١٠٠٪", en: "100%" })}
          label={t({ ar: "مجّانًا بالكامل", en: "free for founders" })}
          hint={t({ ar: "لا رسوم، لا حصص ملكيّة", en: "no fees, no equity taken" })}
        />
      )}
    </motion.div>
  );
}

// Counts 0→target on first view, then renders the Arabic/Latin numeral via the
// page's own num() formatter. Honours reduced-motion (snaps) inside useCountUp.
function AnimatedNum({
  target,
  lang,
  inView,
  duration = 1100,
}: {
  target: number;
  lang: Lang;
  inView: boolean;
  duration?: number;
}) {
  const count = useCountUp(target, duration, inView);
  return <>{num(count, lang)}</>;
}

// A single stat box — a monumental font-mono numeral, a calm mono label, and a
// faint supporting line. tnum keeps numerals aligned.
function StatBox({ value, label, hint }: { value: ReactNode; label: string; hint: string }) {
  return (
    <div className="p-[clamp(1.25rem,2.6vw,2rem)]">
      <div
        className="font-mono font-medium tnum text-foreground leading-none"
        style={{ fontSize: "clamp(2.5rem,6vw,3.5rem)", letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
      <div
        className="mt-3 font-mono text-fg-secondary"
        style={{ fontSize: "clamp(0.8rem,1vw,0.9rem)", letterSpacing: "0.04em" }}
      >
        <span className="rtl:tracking-normal">{label}</span>
      </div>
      <p className="mt-1.5 t-caption text-fg-faint">{hint}</p>
    </div>
  );
}

// ── Metrics come ONLY from real, confirmed sources: the API `venture.metrics`
//    field, or a CMS `venture_metrics` section (value = a JSON array of
//    {v,ar,en}, keyed by venture id or name). If neither is set, the card shows
//    NO metric pills — never an invented number. The owner adds real figures in
//    the CMS and they appear automatically. (Mirrors VenturesShowcase honesty.) ──
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

// ── The portfolio gallery — a calm, static editorial list. Every venture wears
// the SAME uniform full-width card (cover on top → title → tagline → metadata
// badges → case-study cue), stacked with generous gallery whitespace. A light,
// staggered entrance (each card fades up as it enters view) rides on Reveal,
// which double-gates on useReducedMotion internally. The /ventures/:id link and
// the venture-card-* testid are preserved. ──
function VentureGallery({
  ventures,
  cms,
  lang,
  reduce,
}: {
  ventures: Venture[];
  cms: Record<string, string>;
  lang: Lang;
  reduce: boolean;
}) {
  const { t } = useLanguage();
  return (
    <>
      {/* Named section so the venture cards' h3 titles don't skip a level after the
          page h1 (WCAG 1.3.1). Visually redundant with the page title, so sr-only. */}
      <h2 className="sr-only">{t({ ar: "محفظة المشاريع", en: "Ventures portfolio" })}</h2>
      <div className="mt-[clamp(3rem,6vw,5rem)] grid grid-cols-1 md:grid-cols-2 gap-[clamp(1.75rem,3.5vw,2.75rem)]">
        {ventures.map((v, i) => (
        <Reveal as="div" key={v.id} delay={reduce ? 0 : 0.05 * Math.min(i, 8)}>
          <ShowcaseCard
            venture={v}
            metrics={resolveMetrics(v, cms)}
            lang={lang}
            t={t}
            testId={`venture-card-${v.id}`}
            fallbackCover={frameFor(v.id)}
          />
        </Reveal>
        ))}
      </div>
    </>
  );
}



/**
 * EmptyPortfolio — educational, not a bare "coming soon". The portfolio is
 * forming now; we hold the monumental dark register, tell the true story
 * (idea → Demo Day → market) as one calm line, anchor it with a real full-bleed
 * photograph of the space, and put the apply CTA front and centre. The
 * ventures-empty-* testids and educational framing are preserved.
 */
function EmptyPortfolio() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  return (
    <div className="relative">
      <motion.h2
        className="font-display text-foreground max-w-[16ch]"
        style={{ fontSize: "clamp(2.4rem, 7vw, 5rem)", lineHeight: 1.0, letterSpacing: "-0.045em", fontWeight: 700 }}
      >
        {[
          t({ ar: "أوّل دفعةٍ", en: "The first cohort" }),
          <span key="a" className="text-primary">{t({ ar: "تَبني الآن.", en: "is building now." })}</span>,
        ].map((ln, i) => (
          <motion.span
            key={i}
            className="block will-change-transform"
            initial={reduce ? false : { opacity: 0, y: 28 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, delay: i * 0.09, ease: EASE_OUT_EXPO }}
          >
            {ln}
          </motion.span>
        ))}
      </motion.h2>

      <motion.p
        initial={reduce ? false : { opacity: 0, y: 18 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.85, delay: 0.4, ease: EASE_OUT_EXPO }}
        className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-2xl text-fg-secondary"
        style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
      >
        {t({
          ar: "هنا، قريبًا، تظهر أسماء المشاريع التي وُلدت في آيلاند — تبدأ بفكرة، تمرّ بيوم عرضٍ أمام الدّاعمين، وتصل إلى السّوق. الدفعة الأولى تكتب سطورها الأولى اليوم، ومقعدك في الصفحة التالية.",
          en: "This is where the names of ventures born at Island Haven will live — they start as an idea, pass through a Demo Day, and reach the market. The first cohort is writing its opening lines today, and your seat is on the next page.",
        })}
      </motion.p>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.8, delay: 0.52, ease: EASE_OUT_EXPO }}
        className="mt-[clamp(2rem,4vw,3rem)] flex flex-wrap items-center gap-x-7 gap-y-4"
      >
        <Link
          href="/apply"
          data-testid="ventures-empty-apply"
          className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
        >
          {t({ ar: "قدّم للدفعة الأولى", en: "Apply to the first cohort" })}
          <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
        </Link>
        <Link
          href="/programs"
          data-testid="ventures-empty-programs"
          className="group inline-flex items-center gap-2 text-[14px] font-semibold text-foreground/85 hover:text-foreground transition-colors"
        >
          {t({ ar: "كيف يعمل الاحتضان", en: "How incubation works" })}
          <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
        </Link>
      </motion.div>

      {/* The space, full-bleed — a real photograph carries the wait, one calm line */}
      <motion.div
        className="relative mt-[clamp(4rem,9vh,7rem)] w-full overflow-hidden rounded-[clamp(20px,2.5vw,32px)] ring-1 ring-white/10"
        initial={reduce ? false : { opacity: 0 }}
        whileInView={reduce ? undefined : { opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1, ease: EASE_OUT_EXPO }}
      >
        <div className="relative h-[clamp(20rem,52vh,34rem)]">
          <img
            src="/photos/IMG_8347.webp"
            alt={t({ ar: "منتسبون يبنون مشاريعهم في آيلاند هيفن بغزّة", en: "Members building their ventures at Island Haven in Gaza" })}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center saturate-[1.04]"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "linear-gradient(90deg, hsl(0 0% 4% / 0.92) 0%, hsl(0 0% 4% / 0.5) 45%, transparent 80%)" }}
          />
          <div className="absolute inset-0 flex items-end">
            <div className="w-full p-[clamp(1.5rem,4vw,3.5rem)]">
              <motion.p
                className="max-w-[22ch] text-white"
                style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.6rem)", lineHeight: 1.18, letterSpacing: "-0.02em", fontWeight: 600 }}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
              >
                {t({ ar: "من فكرة، إلى يوم عرض، إلى السّوق.", en: "From idea, to Demo Day, to market." })}
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Terminal CTA — a calm confident line, your venture is the next in the list. No
// aura blob, no glass deck, no icon tile.
function ClosingCTA() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  return (
    <section className="mt-[clamp(5rem,11vw,9rem)] border-t border-border-strong/60 pt-[clamp(3rem,6vw,5rem)]">
      <motion.h2
        className="font-display text-foreground max-w-[18ch]"
        style={{ fontSize: "clamp(2.2rem, 6vw, 4.25rem)", lineHeight: 1.0, letterSpacing: "-0.04em", fontWeight: 700 }}
      >
        {[
          t({ ar: "مشروعك القادم", en: "Your venture is the" }),
          <span key="a" className="text-primary">{t({ ar: "في هذه المحفظة.", en: "next in this portfolio." })}</span>,
        ].map((ln, i) => (
          <motion.span
            key={i}
            className="block will-change-transform"
            initial={reduce ? false : { opacity: 0, y: 26 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, delay: i * 0.09, ease: EASE_OUT_EXPO }}
          >
            {ln}
          </motion.span>
        ))}
      </motion.h2>

      <motion.p
        initial={reduce ? false : { opacity: 0, y: 16 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.8, delay: 0.36, ease: EASE_OUT_EXPO }}
        className="mt-[clamp(1.5rem,3vw,2.5rem)] max-w-2xl text-fg-secondary"
        style={{ fontSize: "clamp(1.05rem,1.8vw,1.35rem)", lineHeight: 1.6 }}
      >
        {t({
          ar: "احتضانٌ مجّانيّ، إرشاد، وDemo Day — كلّ ما يلزم لتأخذ فكرتك من الورقة إلى السّوق، من قلب غزّة إلى العالم.",
          en: "Free incubation, mentorship and a Demo Day — everything you need to take your idea from paper to market, from the heart of Gaza to the world.",
        })}
      </motion.p>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 14 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.75, delay: 0.46, ease: EASE_OUT_EXPO }}
        className="mt-[clamp(2rem,4vw,3rem)] flex flex-wrap items-center gap-x-7 gap-y-4"
      >
        <Link
          href="/apply"
          data-testid="ventures-cta-apply"
          className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
        >
          {t({ ar: "ابدأ مشروعك", en: "Start your venture" })}
          <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
        </Link>
        <Link
          href="/programs"
          data-testid="ventures-cta-programs"
          className="group inline-flex items-center gap-2 text-[14px] font-semibold text-foreground/85 hover:text-foreground transition-colors"
        >
          {t({ ar: "البرامج والدفعات", en: "Programs & cohorts" })}
          <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </section>
  );
}

// Skeleton — mirrors the new gallery rhythm: a live-reading stat row, then a
// stack of uniform full-width cards (16/9 cover placeholder + content lines),
// spaced with the same generous gallery gap.
function SkeletonVentures() {
  return (
    <div>
      <div className="flex gap-8 pb-8 border-b border-border-strong/60">
        {[0, 1].map((i) => (
          <div key={i} className="h-12 w-40 rounded-lg bg-surface-2 animate-pulse" />
        ))}
      </div>
      <div className="mt-[clamp(3rem,6vw,5rem)] flex flex-col gap-[clamp(3rem,6vw,5.5rem)]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass-panel-lg p-3">
            <div className="aspect-[16/9] rounded-[24px] bg-surface-2 animate-pulse" />
            <div className="px-[clamp(1.5rem,3vw,3.25rem)] pb-[clamp(2rem,3vw,3rem)] pt-[clamp(2rem,3vw,3rem)] space-y-6">
              <div className="h-12 w-2/3 rounded-lg bg-surface-2 animate-pulse" />
              <div className="h-5 w-1/2 rounded bg-surface-2 animate-pulse" />
              <div className="flex gap-2.5">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="h-8 w-28 rounded-full bg-surface-2 animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
