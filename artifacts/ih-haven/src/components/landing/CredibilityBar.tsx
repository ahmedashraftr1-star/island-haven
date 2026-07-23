import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";
import { useContentSection } from "@/hooks/use-content";

/**
 * CredibilityBar — a slim DARK proof band directly under the hero, holding the
 * cinematic spell (near-black, a crimson hairline glow echoing the hero accent)
 * instead of breaking it with a pale strip. One confident editorial line names
 * our REAL backers (NasToNas + Gaza Sky Geeks), then hairline-divided wordmarks
 * of the tools/credits we unlock — labelled honestly, no invented logos.
 */

// AR is the CMS-overridable source of truth (useContentSection); English keeps its
// literal via …En keys. The REAL backer names + the tool/credit wordmarks are
// displayed copy too, so they move here as well. Defaults below are byte-verbatim
// copies of the previous hardcoded copy — an un-edited site renders as before.
const FALLBACK = {
  founded: "تأسّست ٢٠٢٤",
  foundedEn: "Founded 2024",
  free100: "١٠٠٪ مجّانًا",
  free100En: "100% free",
  backedBy: "بدعم من",
  backedByEn: "Backed by",
  backer1: "NasToNas",
  and: " و ",
  andEn: " & ",
  backer2: "Gaza Sky Geeks",
  toolsLabel: "أدوات نفتحها لك",
  toolsLabelEn: "Tools we unlock",
  tool0: "Replit",
  tool1: "AWS Activate",
  tool2: "Google for Startups",
  tool3: "Payoneer",
  tool4: "Freelancer",
};

export function CredibilityBar() {
  const { t } = useLanguage();
  const c = useContentSection("credibilityBar", FALLBACK);

  // Tools & credits we help members UNLOCK — honest text wordmarks, not "partners".
  const tools = [c.tool0, c.tool1, c.tool2, c.tool3, c.tool4];

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
            <span className="text-white/45 font-medium">{t({ ar: c.founded, en: c.foundedEn })}</span>
            <span className="mx-2.5 text-white/20">·</span>
            <span className="text-sand-bright">{t({ ar: c.free100, en: c.free100En })}</span>
            <span className="mx-2.5 text-white/20">·</span>
            <span className="text-white/55 font-medium">{t({ ar: c.backedBy, en: c.backedByEn })} </span>
            <span className="text-white font-bold not-italic">{c.backer1}</span>
            <span className="text-white/45">{t({ ar: c.and, en: c.andEn })}</span>
            <span className="text-white font-bold not-italic">{c.backer2}</span>
          </p>

          {/* Tools & credits we UNLOCK — honest wordmarks, hairline-divided. */}
          <div className="flex flex-wrap items-center gap-x-1 gap-y-2 lg:justify-end">
            <span className="me-3 hidden items-center gap-2.5 sm:inline-flex">
              <span aria-hidden className="h-px w-6 bg-primary/70" />
              <span className="eyebrow eyebrow-sand">
                {t({ ar: c.toolsLabel, en: c.toolsLabelEn })}
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
