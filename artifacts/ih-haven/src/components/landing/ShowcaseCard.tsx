import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { imageUrl } from "@/hooks/use-content";
import type { Lang } from "@/contexts/LanguageContext";
import { ventureIdentity } from "@/lib/ventureIdentity";

/**
 * ShowcaseCard — ONE venture rendered as a colored POSTER, shared by the homepage
 * VenturesShowcase and the /ventures gallery so both read as the same curated
 * exhibit. The card is still a dark-glass card, but it is TINTED by its sector's
 * identity: `ventureIdentity(sector,id).gradient` is a DEEP (~7–12% lightness),
 * desaturated wash that sits BEHIND the dark glass, and the sector `accent`
 * carries the eyebrow dot + a hairline. Harmonious across the grid (all deep and
 * dark), distinct by hue — never a rainbow of pop colors.
 *
 * Anatomy (top → bottom): EYEBROW (sector + optional real STATUS badge) → heavy
 * font-display TITLE → tagline → REAL proof metrics (honesty: rendered only when
 * present, never invented) → a large BLEED cover anchored to the card's bottom
 * edge (the cover scales 1.04 on hover inside an overflow-hidden frame). The whole
 * card is one clickable Link to /ventures/:id with an aria-label, a focus-visible
 * ring, and the "دراسة الحالة" cue whose arrow slides LEFT (RTL-correct).
 *
 * CONTRAST: because the tint is deep/dark, text stays white/near-white and passes
 * AA. The sector accent is used only for the small eyebrow dot + a faint hairline
 * (never as body text), so a light hue never has to carry readable copy.
 *
 * HONESTY: `stage` (→ status badge) and `metrics` come only from real API/CMS
 * fields; the caller passes an empty `metrics` array → no proof row renders, and a
 * missing `stage` → no status badge. Terracotta remains the site/CTA accent; the
 * sector hue is the CARD identity only (and terracotta is the default identity for
 * unknown sectors, via ventureIdentity's fallback).
 */

export interface ShowcaseMetric {
  /** The real figure, e.g. "1,200" or "٣ مدن". */
  v: string;
  /** Arabic label. */
  ar: string;
  /** English label. */
  en: string;
}

export interface ShowcaseVenture {
  id: number;
  name: string;
  tagline?: string | null;
  sector?: string | null;
  /** Raw stage key from the API (idea | mvp | launched | scaling | growth …). */
  stage?: string | null;
  coverUrl?: string | null;
  /** EN overrides — shown ONLY in English; empty → the field hides (never Arabic fallback). */
  nameEn?: string | null;
  taglineEn?: string | null;
  sectorEn?: string | null;
}

export interface ShowcaseCardProps {
  venture: ShowcaseVenture;
  /** Real metrics, already resolved by the caller (empty → no proof row). */
  metrics: ShowcaseMetric[];
  lang: Lang;
  t: (bi: { ar: string; en: string }) => string;
  /** Test id for the clickable card (e.g. `showcase-venture-3` / `venture-card-3`). */
  testId: string;
  /** Fallback cover when the venture has none (deterministic evergreen frame). */
  fallbackCover: string;
}

// Bilingual STATUS labels — the single source of truth for the poster's status
// badge, covering every stage either surface emits (Ventures' VentureStage plus
// VenturesShowcase's extra "growth"). Mirrors @/lib/labels VENTURE_STAGE_LABELS.
const STAGE_AR: Record<string, string> = {
  idea: "فكرة",
  mvp: "نموذج أوّليّ",
  launched: "أُطلِق",
  scaling: "توسّع",
  growth: "نموّ",
};
const STAGE_EN: Record<string, string> = {
  idea: "Idea",
  mvp: "MVP",
  launched: "Launched",
  scaling: "Scaling",
  growth: "Growth",
};

function stageLabel(stage: string | null | undefined, lang: Lang): string | null {
  if (!stage) return null;
  const map = lang === "ar" ? STAGE_AR : STAGE_EN;
  return map[stage] ?? stage;
}

export function ShowcaseCard({ venture, metrics, lang, t, testId, fallbackCover }: ShowcaseCardProps) {
  const v = venture;
  // GOLDEN RULE: in EN show ONLY the stored _en value; if it's empty, hide the
  // field — never fall back to Arabic (and never show English in AR).
  const L = (ar: string | null | undefined, en: string | null | undefined) =>
    (lang === "en" ? en : ar)?.trim() || "";
  // The visual identity (hue) MUST key off the ORIGINAL sector — only the
  // DISPLAYED label switches to sectorEn in English.
  const vid = ventureIdentity(v.sector, v.id);
  const cover = v.coverUrl ? imageUrl(v.coverUrl) : fallbackCover;
  const status = stageLabel(v.stage, lang);
  const name = L(v.name, v.nameEn);
  const tagline = L(v.tagline, v.taglineEn);
  const sector = L(v.sector, v.sectorEn);
  // aria-label / img alt need a non-empty string; fall to the neutral brand word
  // when the active-locale name is empty (avoids leaking the other language).
  const label = name || t({ ar: "مشروع", en: "Venture" });

  return (
    <Link
      href={`/ventures/${v.id}`}
      data-testid={testId}
      aria-label={label}
      className="group relative block overflow-hidden glass-panel-lg -translate-y-0 transition-[transform,border-color,box-shadow] duration-[240ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] hover:border-white/22 hover:shadow-[0_60px_120px_-40px_hsl(0_0%_0%/0.85)] motion-safe:hover:-translate-y-1 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060608]"
    >
      {/* DEEP sector tint — a subtle color wash behind the dark glass. Because the
          gradient stops are ~7–12% lightness the whole grid stays harmoniously
          dark; only the hue changes card-to-card. Sits under everything, above
          nothing readable. */}
      <span aria-hidden className="absolute inset-0 opacity-[0.55]" style={{ background: vid.gradient }} />
      {/* A faint downward darken so the lower (cover) half reads even deeper and
          the top copy keeps maximum contrast. */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, hsl(0 0% 0% / 0.12) 0%, hsl(0 0% 0% / 0.34) 100%)" }}
      />

      <div className="relative">
        {/* ── Copy block ── */}
        <div className="px-[clamp(1.5rem,3vw,3rem)] pt-[clamp(1.75rem,3vw,2.75rem)] pb-[clamp(1.5rem,2.5vw,2.25rem)]">
          {/* EYEBROW: sector name + a hairline in the sector accent, then the real
              status badge (only if a stage is present). */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
            {sector && (
              <span
                className="inline-flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.16em] rtl:tracking-normal text-white/80"
              >
                <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: vid.accent }} />
                {sector}
              </span>
            )}
            {status && (
              <span
                className="inline-flex items-center h-7 px-3 rounded-full text-[10.5px] font-bold uppercase tracking-[0.12em] rtl:tracking-normal text-white/85 ring-1"
                style={{ borderColor: "transparent", background: vid.soft, boxShadow: `inset 0 0 0 1px ${vid.accent}55` }}
              >
                {status}
              </span>
            )}
          </div>

          {/* Accent hairline — the sector hue as a thin locating rule under the eyebrow. */}
          <span
            aria-hidden
            className="mt-4 block h-px w-14 rounded-full"
            style={{ background: `linear-gradient(90deg, ${vid.accent}, transparent)` }}
          />

          {/* TITLE — heavy display. Hidden in EN if there's no English name. */}
          {name && (
            <h3
              className="mt-5 font-display font-black text-white"
              style={{ fontSize: "clamp(1.9rem,3.4vw,3rem)", lineHeight: 0.98, letterSpacing: "-0.04em" }}
            >
              {name}
            </h3>
          )}

          {/* Tagline. */}
          {tagline && (
            <p
              className="mt-4 max-w-2xl font-display text-white/80"
              style={{ fontSize: "clamp(1.05rem,1.6vw,1.35rem)", lineHeight: 1.38, letterSpacing: "-0.012em" }}
            >
              {tagline}
            </p>
          )}

          {/* REAL proof — gold figures only when present, never invented. */}
          {metrics.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              {metrics.map((m, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full ring-1 ring-white/12 bg-white/[0.05] text-[11.5px] font-bold"
                >
                  <span className="font-display font-black tabular-nums text-sand-bright text-[14px] leading-none">{m.v}</span>
                  <span className="text-white/62">{lang === "ar" ? m.ar : m.en}</span>
                </span>
              ))}
            </div>
          )}

          {/* Case-study cue — arrow slides LEFT (RTL-correct). */}
          <span className="mt-7 inline-flex items-center gap-3 text-[14px] font-bold text-white transition-colors group-hover:text-primary">
            <span className="tracking-[0.02em] underline-offset-[6px] group-hover:underline decoration-primary/60 decoration-1">
              {t({ ar: "دراسة الحالة", en: "Case study" })}
            </span>
            <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 motion-reduce:transition-none" />
          </span>
        </div>

        {/* ── BLEED cover — anchored to the card's bottom edge, no rounded frame of
            its own (it inherits the card's rounded corners via overflow-hidden on
            the Link). Scales 1.04 on hover inside the overflow-hidden frame. A top
            fade blends the image into the tinted copy block above. ── */}
        <div className="relative mt-2 aspect-[16/9] overflow-hidden">
          <img
            src={cover}
            alt={label}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (img.src !== fallbackCover) img.src = fallbackCover;
            }}
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[280ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none motion-safe:group-hover:scale-[1.04]"
          />
          {/* Sector tint over the cover (soft-light) keeps the image family-tinted
              to its hue without washing detail. */}
          <span aria-hidden className="absolute inset-0 opacity-[0.22] mix-blend-soft-light" style={{ background: vid.gradient }} />
          {/* Top fade → dissolves the cover's upper edge into the copy block. */}
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-24"
            style={{ background: "linear-gradient(180deg, hsl(24 14% 5% / 0.6) 0%, transparent 100%)" }}
          />
        </div>
      </div>
    </Link>
  );
}
