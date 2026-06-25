import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { I18N } from "@/lib/i18n";

/**
 * BecomeMentorBand — editorial, photo-forward band in the approved WhatYouGet
 * language. Real Gaza imagery on one column; an oversized solid headline, lead,
 * and a quiet hairline ledger of what mentoring gives (replacing the old pill
 * badges) plus a single decisive CTA on the other. Start-aligned, asymmetric.
 * Removed: text-accent-gradient heading, centered glass card, two-pill row.
 */
export function BecomeMentorBand() {
  const { lang, t } = useLanguage();
  const s = I18N.landing.becomeMentor;

  const idx = (i: number) =>
    lang === "en" ? String(i + 1).padStart(2, "0") : ["٠١", "٠٢", "٠٣"][i];

  const reasons = [t(s.badge1), t(s.badge2), t(s.badge3)];

  return (
    <section
      className="relative section-y-compact overflow-hidden bg-surface-1"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div className="container-ih">
        <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5rem)] gap-y-12 items-center">
          {/* Photo — the place and its people, shown not described */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5"
          >
            <div className="overflow-hidden rounded-[20px] ring-1 ring-white/10">
              <img
                src={`${import.meta.env.BASE_URL}photos/IMG_8352.webp`}
                alt={t({ ar: "مرشدون ومنتسبون في آيلاند هيفن بغزّة", en: "Mentors and members at Island Haven in Gaza" })}
                loading="lazy"
                className="w-full aspect-[5/4] object-cover saturate-[1.04]"
              />
            </div>
          </motion.div>

          {/* Lead + ledger + CTA — start-aligned, oversized solid type */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="lg:col-span-7"
          >
            <div className="eyebrow eyebrow-sand mb-5">
              {t(s.eyebrow)}
            </div>

            <h2
              className="font-display font-extrabold text-foreground"
              style={{ fontSize: "clamp(1.9rem, 3.8vw, 3.2rem)", lineHeight: 1.05, letterSpacing: "-0.025em" }}
            >
              {t(s.title)} <span className="text-sand">{t(s.highlight)}</span>
            </h2>

            <p className="t-body mt-5 max-w-xl">
              {t(s.body)}
            </p>

            {/* Quiet hairline ledger — replaces the two-pill badge row */}
            <div className="mt-8 border-t border-border-strong">
              {reasons.map((label, i) => (
                <div
                  key={label}
                  className="grid grid-cols-[auto_1fr] gap-x-5 items-baseline border-b border-border py-4"
                >
                  <span className="font-display text-[15px] font-bold tabular-nums text-sand leading-none">
                    {idx(i)}
                  </span>
                  <span className="text-[15px] font-semibold text-foreground">{label}</span>
                </div>
              ))}
            </div>

            <Link
              href="/become-mentor?ref=home-banner"
              className="group mt-9 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full cta-fill font-bold text-[14px] transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-16px_hsl(354_82%_30%_/_0.55)]"
              data-testid="cta-become-mentor"
              onClick={() => console.log("[analytics] become-mentor cta clicked", { ref: "home-banner" })}
            >
              <Sparkles className="w-4 h-4" />
              {t(s.cta)}
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 rtl:rotate-180" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
