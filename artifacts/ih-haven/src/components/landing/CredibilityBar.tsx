import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";

/**
 * CredibilityBar — a slim, quiet trust strip that sits right under the hero.
 * Light (inherits the warm-white canvas), compact (section-y-compact). One calm
 * editorial line names our REAL backers — NasToNas + Gaza Sky Geeks — with a
 * single crimson accent. Then a hairline-divided row of wordmarks labelled
 * honestly as "tools & credits we unlock for you" (NOT partners): Replit, AWS,
 * Google for Startups, Payoneer, Freelancer. Truthful + internally consistent
 * with Partners + HomeFAQ. Confident, not loud. No glass, no icon tiles, no
 * gradient text, no fake logos.
 */
export function CredibilityBar() {
  const { t } = useLanguage();

  // Tools & credits we help members UNLOCK — honest text chips, not "partners"
  // (no invented logos). Backers are named in the editorial line instead.
  const tools = ["Replit", "AWS Activate", "Google for Startups", "Payoneer", "Freelancer"];

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
          {/* The quiet credibility line — editorial serif, one crimson accent.
              Names our REAL backers only (NasToNas + Gaza Sky Geeks). */}
          <p
            className="font-display text-fg-secondary shrink-0"
            style={{ fontSize: "clamp(0.95rem, 1.5vw, 1.2rem)", lineHeight: 1.3, letterSpacing: "-0.01em", fontWeight: 500 }}
          >
            {t({ ar: "تأسّست ٢٠٢٤", en: "Founded 2024" })}
            <span className="mx-2 text-border-strong">·</span>
            <span className="text-primary italic">{t({ ar: "١٠٠٪ مجّانًا", en: "100% free" })}</span>
            <span className="mx-2 text-border-strong">·</span>
            {t({ ar: "بدعم من ", en: "Backed by " })}
            <span className="text-foreground font-semibold not-italic">NasToNas</span>
            {t({ ar: " و", en: " & " })}
            <span className="text-foreground font-semibold not-italic">Gaza Sky Geeks</span>
          </p>

          {/* Tools & credits we UNLOCK — honest wordmarks, labelled truthfully
              (NOT "partners"). Hairline-divided text chips, no fake logos. */}
          <div className="flex flex-wrap items-center gap-x-1 gap-y-2 lg:justify-end">
            <span className="eyebrow eyebrow-sand me-3 hidden sm:inline">
              {t({ ar: "أدوات نفتحها لك", en: "Tools we unlock" })}
            </span>
            {tools.map((name, i) => (
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
