import { Link } from "wouter";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";
import { TrustStrip } from "./TrustStrip";

const WHATSAPP = "https://wa.me/972567536815";

/**
 * FinalCTA — the decisive closing band, and the ONE dark section in this light
 * editorial homepage (a cinematic close before the footer). A cinematic photo
 * backdrop under a deep navy scrim carries the brand belief in oversized
 * editorial serif (a single italic crimson accent word), one primary crimson
 * CTA (Apply), a quiet glass secondary (Book a seat), a low-weight WhatsApp text
 * link, and a TrustStrip for credibility. Hardcoded dark (bg-[#0a0a0a] + white)
 * — NOT theme-light. The TrustStrip's token-driven colours are restored to the
 * dark register via a scoped CSS-var reset on the section root, so it never
 * inherits the page's light theme.
 */

// Dark-register token reset: the homepage is wrapped in `.theme-light`, which
// flips these tokens to their light values. This section is hardcoded dark, so
// we restore the canonical `:root` dark values for every token its children
// (TrustStrip + the data numerals) consume — keeping the strip on-brand on navy.
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
    <section
      id="final-cta"
      style={DARK_TOKENS}
      className="relative overflow-hidden bg-[#0a0a0a] text-white section-y"
    >
      {/* Cinematic place backdrop + deep navy scrim — the photo breathes, the
          copy stays crisp. Start-anchored gradient (RTL-safe via symmetry). */}
      <div aria-hidden className="absolute inset-0">
        <img
          src="/photos/IMG_8356.webp"
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-center saturate-[1.05]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,14,26,0.92) 0%, rgba(10,14,26,0.82) 42%, rgba(10,14,26,0.94) 100%)",
          }}
        />
      </div>
      {/* Signature cerulean + crimson aura, faint over the scrim. */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[60%] brand-aura opacity-70" />

      <div className="container-ih relative">
        <div className="max-w-3xl">
          {/* Hairline-accent eyebrow */}
          <Reveal as="div" className="mb-6 flex items-center gap-3">
            <span className="h-px w-9 bg-primary/60" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-primary font-bold rtl:tracking-normal">
              {t({ ar: "خطوتك الأخيرة", en: "Your last step" })}
            </span>
          </Reveal>

          {/* Belief headline — editorial serif on white, one italic crimson word */}
          <Reveal as="div" delay={0.05}>
            <h2
              className="font-editorial text-white"
              style={{
                fontSize: "clamp(2.1rem, 5vw, 4rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                fontWeight: 600,
              }}
            >
              {t({ ar: "طريقك للعالم يبدأ ", en: "Your path to the world starts " })}
              <span className="italic text-primary">
                {t({ ar: "بمقعد في غزّة.", en: "with a seat in Gaza." })}
              </span>
            </h2>
          </Reveal>

          {/* Tight sub */}
          <Reveal as="div" delay={0.1}>
            <p className="mt-6 max-w-xl text-[1.0625rem] lg:text-lg leading-[1.7] text-white/82">
              {t({
                ar: "حاضنة كاملة — مجّانًا. قدّم اليوم، أو احجز مقعدك في المساحة وتعرّف علينا عن قرب.",
                en: "A full incubator — free. Apply today, or book a seat in the space and get to know us up close.",
              })}
            </p>
          </Reveal>

          {/* CTAs — one decisive primary, a quiet glass secondary, a WhatsApp link */}
          <Reveal as="div" delay={0.15}>
            <div className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Link
                href="/apply"
                data-testid="final-cta-apply"
                className="cta-fill group inline-flex items-center justify-center gap-3 h-14 px-9 rounded-full font-bold text-[15.5px] tracking-[-0.005em] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 shadow-[0_24px_64px_-14px_hsl(354_82%_40%/0.55)]"
              >
                {t({ ar: "قدّم على الحاضنة", en: "Apply to the incubator" })}
                <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              </Link>

              <Link
                href="/book"
                data-testid="final-cta-book"
                className="group inline-flex items-center justify-center gap-3 h-14 px-7 rounded-full border border-white/20 bg-white/10 text-white font-semibold text-[14px] tracking-[-0.005em] transition-colors duration-300 hover:bg-white/15 hover:border-white/30 active:bg-white/20"
              >
                {t({ ar: "احجز مقعدك", en: "Book a seat" })}
                <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              </Link>

              <a
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="final-cta-whatsapp"
                className="group inline-flex items-center justify-center sm:justify-start gap-2 h-12 sm:h-auto px-2 text-white/75 font-semibold text-[14px] transition-colors duration-200 hover:text-white"
              >
                <MessageCircle className="h-4 w-4 text-white/60 transition-colors group-hover:text-white" />
                <span className="underline-offset-[6px] group-hover:underline">
                  {t({ ar: "تحدّث معنا واتساب", en: "Chat on WhatsApp" })}
                </span>
              </a>
            </div>
          </Reveal>
        </div>

        {/* Credibility row — restored to the dark register via the token reset */}
        <Reveal as="div" delay={0.2}>
          <div className="mt-12 lg:mt-14 border-t border-white/12 pt-9 lg:pt-10">
            <TrustStrip />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
