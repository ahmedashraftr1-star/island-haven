import { Link } from "wouter";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { imageUrl } from "@/hooks/use-content";
import { Reveal } from "@/components/landing/Reveal";
import { CinematicMedia } from "./CinematicMedia";
import { TrustStrip } from "./TrustStrip";

const WHATSAPP = "https://wa.me/972567536815";

/**
 * FinalCTA — the closing CLIMAX of the homepage, and the ONE dark section in
 * this light editorial page. Built on the shared CinematicMedia primitive: a
 * full-bleed Gaza photograph (parallax + Ken-Burns) under a MEDIUM scrim so the
 * photo breathes, a monumental font-display headline (a single crimson accent),
 * one decisive crimson CTA (Apply), a glass secondary (Book a seat), a quiet
 * WhatsApp text link, and a faded TrustStrip for credibility that never competes
 * with the CTAs. Hardcoded dark — NOT theme-light.
 */

// Dark-register token reset: the homepage is wrapped in `.theme-light`, which
// flips these tokens to their light values. This section is hardcoded dark, so
// we restore the canonical `:root` dark values for every token TrustStrip
// consumes (surface / foreground / border / muted / sand), keeping it on-brand
// on the photograph.
const DARK_TOKENS = {
  "--surface-2": "223 30% 13%",
  "--foreground": "210 30% 99%",
  "--border-strong": "224 20% 34%",
  "--muted-foreground": "217 17% 67%",
  "--sand": "211 90% 62%",
  "--sand-bright": "205 96% 70%",
} as React.CSSProperties;

export function FinalCTA() {
  const { t } = useLanguage();

  return (
    <CinematicMedia
      id="final-cta"
      data-testid="final-cta"
      src={imageUrl("/photos/IMG_8356.webp")}
      scrim="medium"
      sideScrim
      className="section-y"
      overlay={
        // Signature cerulean + crimson aura, faint over the scrim.
        <div aria-hidden className="absolute inset-x-0 top-0 h-[60%] brand-aura opacity-60" />
      }
    >
      <div style={DARK_TOKENS} className="container-ih">
        <div className="relative max-w-3xl">
          {/* Soft terracotta→gold radial glow anchored behind the headline & CTA
              area — a single low-opacity wash for depth, NOT a bright blob. Sits
              under the copy, over the photo scrim. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-16 -top-10 bottom-[-4rem] -z-[1]"
            style={{
              background:
                "radial-gradient(46% 52% at 22% 34%, hsl(var(--primary) / 0.14) 0%, transparent 68%), radial-gradient(38% 44% at 12% 78%, hsl(var(--accent-2) / 0.08) 0%, transparent 70%)",
            }}
          />

          {/* Hairline-accent eyebrow */}
          <Reveal as="div" index={0} className="mb-6 flex items-center gap-3">
            <span className="h-px w-9 bg-primary" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-primary font-bold rtl:tracking-normal">
              {t({ ar: "خطوتك الأخيرة", en: "Your last step" })}
            </span>
          </Reveal>

          {/* Monumental belief headline — the finale, a touch bigger than the
              other sections. One terracotta accent phrase. */}
          <Reveal as="div" index={1}>
            <h2
              className="font-display text-white"
              style={{
                fontSize: "clamp(2.6rem, 5.6vw, 5.25rem)",
                fontWeight: 900,
                lineHeight: 0.96,
                letterSpacing: "-0.05em",
              }}
            >
              {t({ ar: "طريقك للعالم يبدأ ", en: "Your path to the world starts " })}
              <span className="text-primary">
                {t({ ar: "بمقعد في غزّة.", en: "with a seat in Gaza." })}
              </span>
            </h2>
          </Reveal>

          {/* Tight sub */}
          <Reveal as="div" index={2}>
            <p className="mt-7 max-w-xl text-[1.0625rem] lg:text-lg leading-[1.7] text-white/85">
              {t({
                ar: "حاضنة كاملة — مجّانًا. قدّم اليوم، أو احجز مقعدك في المساحة وتعرّف علينا عن قرب.",
                en: "A full incubator — free. Apply today, or book a seat in the space and get to know us up close.",
              })}
            </p>
          </Reveal>

          {/* CTAs — one decisive terracotta primary, a glass ghost secondary, a
              quiet WhatsApp text link. Confident, generously spaced. */}
          <Reveal as="div" index={3}>
            <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-5">
              <Link
                href="/apply"
                data-testid="final-cta-apply"
                className="cta-fill group inline-flex items-center justify-center gap-3 h-14 px-9 rounded-full font-bold text-[15.5px] tracking-[-0.005em] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 shadow-[0_28px_72px_-14px_hsl(354_82%_40%/0.6)]"
              >
                {t({ ar: "قدّم على الحاضنة", en: "Apply to the incubator" })}
                <ArrowLeft className="h-4 w-4 ltr:rotate-180 transition-transform duration-300 rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
              </Link>

              <Link
                href="/book"
                data-testid="final-cta-book"
                className="group inline-flex items-center justify-center gap-3 h-14 px-7 rounded-full text-white/90 font-semibold text-[14px] tracking-[-0.005em] bg-white/[0.04] border border-white/20 backdrop-blur-sm transition-[transform,color,background-color,border-color] duration-200 hover:-translate-y-0.5 hover:text-white hover:bg-white/[0.08] hover:border-white/35 active:translate-y-0"
              >
                {t({ ar: "احجز مقعدك", en: "Book a seat" })}
                <ArrowLeft className="h-4 w-4 ltr:rotate-180 transition-transform duration-300 rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
              </Link>

              <a
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="final-cta-whatsapp"
                className="group inline-flex items-center justify-center sm:justify-start gap-2 h-12 sm:h-auto px-2 text-white/70 font-semibold text-[14px] transition-colors duration-200 hover:text-white"
              >
                <MessageCircle className="h-4 w-4 text-sand-bright transition-colors group-hover:text-white" />
                <span className="underline-offset-[6px] group-hover:underline">
                  {t({ ar: "تحدّث معنا واتساب", en: "Chat on WhatsApp" })}
                </span>
              </a>
            </div>
          </Reveal>
        </div>

        {/* Credibility row — kept, but faded quieter so it never competes with
            the CTAs. Restored to the dark register via the token reset above. */}
        <Reveal as="div" index={4}>
          <div className="mt-14 lg:mt-16 border-t border-white/10 pt-9 lg:pt-10 opacity-80">
            <TrustStrip />
          </div>
        </Reveal>
      </div>
    </CinematicMedia>
  );
}
