import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";

/**
 * CredibilityBar — a slim DARK proof band directly under the hero, holding the
 * cinematic spell (near-black, a crimson hairline glow echoing the hero accent)
 * instead of breaking it with a pale strip. One confident editorial line names
 * our REAL backers (NasToNas + Gaza Sky Geeks), then hairline-divided wordmarks
 * of the tools/credits we unlock — labelled honestly, no invented logos.
 */
export function CredibilityBar() {
  const { t } = useLanguage();

  // Tools & credits we help members UNLOCK — honest text wordmarks, not "partners".
  const tools = ["Replit", "AWS Activate", "Google for Startups", "Payoneer", "Freelancer"];

  return (
    <section
      id="credibility-bar"
      data-testid="credibility-bar"
      className="relative glass-rail text-white section-y-compact overflow-hidden"
    >
      {/* Crimson hairline + a faint top aura — the hero's accent, carried one beat further. */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent)" }} />
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(70% 140% at 50% -30%, rgba(233,74,51,0.07) 0%, transparent 62%)" }} />

      <div className="container-ih relative">
        <Reveal
          as="div"
          distance={16}
          className="flex flex-col gap-x-[clamp(1.5rem,4vw,3.5rem)] gap-y-5 lg:flex-row lg:items-center lg:justify-between"
        >
          {/* The credibility line — REAL backers only, confident on dark. */}
          <p
            className="font-display shrink-0"
            style={{ fontSize: "clamp(1rem, 1.6vw, 1.3rem)", lineHeight: 1.3, letterSpacing: "-0.02em", fontWeight: 600 }}
          >
            <span className="text-white/45 font-medium">{t({ ar: "تأسّست ٢٠٢٤", en: "Founded 2024" })}</span>
            <span className="mx-2.5 text-white/20">·</span>
            <span className="text-sand-bright">{t({ ar: "١٠٠٪ مجّانًا", en: "100% free" })}</span>
            <span className="mx-2.5 text-white/20">·</span>
            <span className="text-white/55 font-medium">{t({ ar: "بدعم من", en: "Backed by" })} </span>
            <span className="text-white font-bold not-italic">NasToNas</span>
            <span className="text-white/45">{t({ ar: " و ", en: " & " })}</span>
            <span className="text-white font-bold not-italic">Gaza Sky Geeks</span>
          </p>

          {/* Tools & credits we UNLOCK — honest wordmarks, hairline-divided. */}
          <div className="flex flex-wrap items-center gap-x-1 gap-y-2 lg:justify-end">
            <span className="me-3 hidden items-center gap-2.5 sm:inline-flex">
              <span aria-hidden className="h-px w-6 bg-primary/70" />
              <span className="eyebrow eyebrow-sand">
                {t({ ar: "أدوات نفتحها لك", en: "Tools we unlock" })}
              </span>
            </span>
            {tools.map((name, i) => (
              <span key={name} className="inline-flex items-center">
                {i > 0 && <span aria-hidden className="mx-1 h-3.5 w-px bg-white/15" />}
                <span className="px-1.5 text-[13px] font-semibold tracking-tight text-white/70 transition-colors duration-200 hover:text-white">
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
