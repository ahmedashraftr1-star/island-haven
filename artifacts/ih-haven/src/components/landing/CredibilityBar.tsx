import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";

/**
 * CredibilityBar — a slim, quiet trust strip that sits right under the hero.
 * Light (inherits the warm-white canvas), compact (section-y-compact). One calm
 * editorial line — "founded 2024 · 100% free · backed by NasToNas" with a single
 * crimson accent — followed by a hairline-divided row of partner wordmarks as
 * clean text chips (no fake logos). Confident, not loud: a credibility strip,
 * not a hero. No glass, no icon tiles, no gradient text.
 */
export function CredibilityBar() {
  const { t } = useLanguage();

  // Partner wordmarks as honest text chips (no invented logos).
  const partners = ["Replit", "AWS", "Payoneer", "Freelancer", "Google for Startups"];

  return (
    <section
      id="credibility-bar"
      data-testid="credibility-bar"
      className="relative bg-surface-1 section-y-compact border-y border-border-strong"
    >
      <div className="container-ih">
        <Reveal
          as="div"
          distance={16}
          className="flex flex-col gap-x-[clamp(1.5rem,4vw,3.5rem)] gap-y-6 lg:flex-row lg:items-center lg:justify-between"
        >
          {/* The quiet credibility line — editorial serif with one crimson accent */}
          <p
            className="font-editorial text-fg-secondary shrink-0"
            style={{ fontSize: "clamp(0.95rem, 1.5vw, 1.2rem)", lineHeight: 1.3, letterSpacing: "-0.01em", fontWeight: 500 }}
          >
            {t({ ar: "تأسّست ٢٠٢٤", en: "Founded 2024" })}
            <span className="mx-2 text-border-strong">·</span>
            <span className="text-primary italic">{t({ ar: "١٠٠٪ مجّانًا", en: "100% free" })}</span>
            <span className="mx-2 text-border-strong">·</span>
            {t({ ar: "مدعومة من ", en: "Backed by " })}
            <span className="text-foreground font-semibold not-italic">NasToNas</span>
          </p>

          {/* Partner wordmarks — clean text chips, hairline-divided, muted but legible */}
          <div className="flex flex-wrap items-center gap-x-1 gap-y-2 lg:justify-end">
            <span className="eyebrow eyebrow-sand me-3 hidden sm:inline">
              {t({ ar: "بدعم من", en: "Partners" })}
            </span>
            {partners.map((name, i) => (
              <span key={name} className="inline-flex items-center">
                {i > 0 && (
                  <span aria-hidden className="mx-1 h-3.5 w-px bg-border-strong" />
                )}
                <span className="px-1.5 text-[13px] font-semibold tracking-tight text-muted-foreground transition-colors hover:text-foreground">
                  {name}
                </span>
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
