import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ExternalLink, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/shell/PageShell";
import { Reveal } from "@/components/landing/Reveal";
import { Ticker } from "@/components/landing/Ticker";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { I18N } from "@/lib/i18n";
import { EASE_OUT_EXPO } from "@/lib/motion";

interface Investor {
  id: number;
  name: string;
  logoUrl: string | null;
  websiteUrl: string;
  description: string;
  type: string;
  investmentFocus: string;
  status: string;
  sortOrder: number;
}

const TYPE_LABELS_AR: Record<string, string> = {
  lead: "مستثمر رئيسي", angel: "مستثمر ملاك", vc: "صندوق رأس مال مخاطر",
  corporate: "شراكة مؤسسية", ngo: "منظمة دولية", individual: "مانح فردي",
};
const TYPE_LABELS_EN: Record<string, string> = {
  lead: "Lead Investor", angel: "Angel Investor", vc: "Venture Capital",
  corporate: "Corporate Partner", ngo: "International NGO", individual: "Individual Donor",
};

const TYPE_COLORS: Record<string, string> = {
  lead: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  angel: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  vc: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  corporate: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  ngo: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  individual: "bg-surface-2 text-muted-foreground border-border-strong",
};

/* The bare HSL of each investor type — used for the quiet colour cue (a hairline
   accent + dot) that carries the taxonomy without the chip-noise of the old grid.
   Mirrors TYPE_COLORS so amber=lead, violet=angel, blue=vc, emerald=corporate,
   rose=ngo, neutral=individual stays the agreed semantics. */
const TYPE_DOT: Record<string, string> = {
  lead: "hsl(38 92% 56%)",
  angel: "hsl(258 90% 70%)",
  vc: "hsl(217 91% 64%)",
  corporate: "hsl(160 84% 44%)",
  ngo: "hsl(350 89% 64%)",
  individual: "hsl(30 6% 60%)",
};

export default function Investors() {
  const { lang, t } = useLanguage();
  const reduce = useReducedMotion();
  const p = I18N.pages.investors;
  const { data, isLoading } = useQuery({
    queryKey: ["investors"],
    queryFn: () => api<{ investors: Investor[] }>("/investors"),
    staleTime: 60_000,
  });

  const investors = data?.investors ?? [];

  /* The taxonomy actually present in the roster — drives the quiet legend strip
     so the colour key only ever shows types we really have backers for. */
  const presentTypes = Array.from(new Set(investors.map((i) => i.type)))
    .filter((typeKey) => TYPE_DOT[typeKey]);

  return (
    <PageShell
      eyebrow={t(p.eyebrow)}
      title={t(p.title)}
      highlight={t(p.highlight)}
      subtitle={t(p.subtitle)}
    >
      <div className="space-y-[clamp(5rem,11vw,9rem)]">
        {/* ── Why Invest — a monumental statement over a numbered hairline ledger ── */}
        <section>
          <header className="max-w-4xl">
            <div className="eyebrow eyebrow-sand mb-5">
              {t({ ar: "لماذا تستثمر", en: "Why invest" })}
            </div>
            <motion.h2
              className="font-display font-bold text-foreground"
              style={{ fontSize: "clamp(2.1rem, 5vw, 3.6rem)", lineHeight: 1.04, letterSpacing: "-0.035em" }}
              initial={reduce ? false : { opacity: 0, y: 22 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
            >
              {t({ ar: "أربعة أسباب تجعل غزّة ", en: "Four reasons Gaza is the " })}
              <span className="text-primary">{t({ ar: "الرهان الأذكى.", en: "smartest bet." })}</span>
            </motion.h2>
          </header>

          <ol className="mt-[clamp(2.75rem,6vw,4.5rem)] border-t border-border-strong/60">
            {p.whyItems.map((item, i) => (
              <li key={i}>
                <Reveal delay={Math.min(i, 4) * 0.06}>
                  <div className="grid grid-cols-[auto_1fr] gap-x-[clamp(1.5rem,4vw,3rem)] items-baseline border-b border-border-strong/60 py-[clamp(1.75rem,3.5vw,3rem)]">
                    <span
                      className="font-display font-black text-sand tnum leading-none"
                      style={{ fontSize: "clamp(1.6rem, 3vw, 2.5rem)", letterSpacing: "-0.02em" }}
                    >
                      {lang === "en" ? String(i + 1).padStart(2, "0") : ["٠١", "٠٢", "٠٣", "٠٤"][i]}
                    </span>
                    <div>
                      <h3
                        className="font-display font-bold text-foreground"
                        style={{ fontSize: "clamp(1.25rem, 2.2vw, 1.8rem)", letterSpacing: "-0.02em", lineHeight: 1.16 }}
                      >
                        {t(item.title)}
                      </h3>
                      <p className="t-body text-[15px] md:text-[16.5px] mt-3 max-w-2xl">{t(item.desc)}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Our Backers — editorial hairline rows, the type colour carried as a
             quiet accent dot + chip instead of a card deck ── */}
        <section>
          <header className="max-w-4xl">
            <div className="eyebrow eyebrow-sand mb-5">
              {t({ ar: "داعمونا", en: "Our backers" })}
            </div>
            <motion.h2
              className="font-display font-bold text-foreground"
              style={{ fontSize: "clamp(2.1rem, 5vw, 3.6rem)", lineHeight: 1.04, letterSpacing: "-0.035em" }}
              initial={reduce ? false : { opacity: 0, y: 22 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
            >
              {t({ ar: "الذين يقفون ", en: "The ones who " })}
              <span className="text-primary">{t({ ar: "معنا.", en: "stand with us." })}</span>
            </motion.h2>
            <p className="t-body text-[15px] md:text-[16.5px] mt-5 max-w-2xl">
              {t({
                ar: "رأس مال مخاطر، مستثمرو ملاك، شركاء مؤسّسيّون ومنظّمات دوليّة — يؤمنون أنّ الموهبة الغزّية تستحقّ مكانًا في الاقتصاد الرقميّ العالميّ.",
                en: "Venture capital, angel investors, corporate partners and international organizations — believing Gaza's talent deserves a place in the global digital economy.",
              })}
            </p>
          </header>

          {/* Loading — quiet hairline placeholders, matching the row rhythm */}
          {isLoading && (
            <div className="mt-[clamp(2.75rem,6vw,4.5rem)] border-t border-border-strong/60">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="border-b border-border-strong/60 py-[clamp(1.75rem,3.5vw,2.75rem)] flex items-center gap-5"
                >
                  <div className="w-14 h-14 rounded-2xl bg-surface-2 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 w-44 rounded-full bg-surface-2 animate-pulse" />
                    <div className="h-3 w-72 max-w-full rounded-full bg-surface-2 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && investors.length === 0 && (
            <div className="mt-[clamp(2.75rem,6vw,4.5rem)] border-t border-b border-border-strong/60 py-[clamp(3rem,7vw,5rem)]">
              <p
                className="font-display font-bold text-fg-secondary"
                style={{ fontSize: "clamp(1.4rem, 2.6vw, 2rem)", letterSpacing: "-0.02em", lineHeight: 1.16 }}
              >
                {t(p.empty)}
              </p>
              <p className="t-body text-[15px] mt-3 max-w-xl">{t(p.emptyHint)}</p>
            </div>
          )}

          {!isLoading && investors.length > 0 && (
            <>
              {/* Quiet type legend — the colour key, only for taxonomies present */}
              {presentTypes.length > 1 && (
                <Reveal delay={0.04} className="mt-[clamp(2.5rem,5vw,3.5rem)]">
                  <ul className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
                    {presentTypes.map((typeKey) => (
                      <li key={typeKey} className="inline-flex items-center gap-2">
                        <span
                          aria-hidden
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: TYPE_DOT[typeKey] }}
                        />
                        <span className="t-caption text-fg-secondary">
                          {(lang === "en" ? TYPE_LABELS_EN : TYPE_LABELS_AR)[typeKey] ?? typeKey}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}

              <ul className="mt-[clamp(1.75rem,3.5vw,2.75rem)] border-t border-border-strong/60">
                {investors.map((inv, i) => {
                  const label =
                    (lang === "en" ? TYPE_LABELS_EN : TYPE_LABELS_AR)[inv.type] ?? inv.type;
                  const dot = TYPE_DOT[inv.type] ?? TYPE_DOT.individual;
                  const RowTag = inv.websiteUrl ? "a" : "div";
                  return (
                    <li key={inv.id}>
                      <Reveal delay={Math.min(i, 6) * 0.05}>
                        <RowTag
                          {...(inv.websiteUrl
                            ? {
                                href: inv.websiteUrl,
                                target: "_blank",
                                rel: "noopener noreferrer",
                              }
                            : {})}
                          className="group relative grid grid-cols-[auto_1fr] md:grid-cols-[auto_minmax(0,1fr)_auto] items-start md:items-baseline gap-x-[clamp(1.25rem,3vw,2.5rem)] gap-y-3 border-b border-border-strong/60 py-[clamp(1.75rem,3.5vw,2.75rem)] transition-colors hover:border-border-strong"
                        >
                          {/* Type accent rail — a hairline of the type colour on the
                              leading edge, lit on hover (RTL-safe via start-0). */}
                          <span
                            aria-hidden
                            className="absolute start-0 top-[clamp(1.75rem,3.5vw,2.75rem)] bottom-[clamp(1.75rem,3.5vw,2.75rem)] w-px opacity-50 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: dot }}
                          />

                          {/* Logo or initial mark */}
                          <div className="ps-[clamp(0.875rem,2vw,1.5rem)]">
                            {inv.logoUrl ? (
                              <img
                                src={inv.logoUrl}
                                alt={inv.name}
                                loading="lazy"
                                className="w-[clamp(2.75rem,5vw,3.5rem)] h-[clamp(2.75rem,5vw,3.5rem)] rounded-2xl object-cover border border-border-strong"
                              />
                            ) : (
                              <div className="w-[clamp(2.75rem,5vw,3.5rem)] h-[clamp(2.75rem,5vw,3.5rem)] rounded-2xl bg-surface-2 border border-border-strong flex items-center justify-center">
                                <span
                                  className="font-display font-bold leading-none"
                                  style={{ fontSize: "clamp(1.1rem,2vw,1.5rem)", color: dot }}
                                >
                                  {inv.name[0]}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Name + type + focus + description */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3
                                className="font-display font-bold text-foreground group-hover:text-primary transition-colors"
                                style={{ fontSize: "clamp(1.2rem,2.2vw,1.7rem)", letterSpacing: "-0.02em", lineHeight: 1.14 }}
                              >
                                {inv.name}
                              </h3>
                              <span
                                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0"
                                style={{ borderColor: `color-mix(in srgb, ${dot} 28%, transparent)`, color: dot, backgroundColor: `color-mix(in srgb, ${dot} 12%, transparent)` }}
                              >
                                {label}
                              </span>
                            </div>
                            {inv.investmentFocus && (
                              <p className="t-caption text-fg-secondary mt-2">{inv.investmentFocus}</p>
                            )}
                            {inv.description && (
                              <p className="t-body text-[14.5px] md:text-[15.5px] mt-2.5 max-w-2xl">
                                {inv.description}
                              </p>
                            )}
                          </div>

                          {/* Website link — cerulean, the data/link accent */}
                          {inv.websiteUrl && (
                            <span className="col-span-2 md:col-span-1 ps-[clamp(0.875rem,2vw,1.5rem)] md:ps-0 inline-flex items-center gap-2 t-caption text-sand whitespace-nowrap group-hover:text-sand-bright transition-colors tnum">
                              {t({ ar: "زيارة الموقع", en: "Visit site" })}
                              <ExternalLink className="w-3.5 h-3.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                            </span>
                          )}
                        </RowTag>
                      </Reveal>
                    </li>
                  );
                })}
              </ul>

              {/* Quiet roster strip — the backers' names gliding as one calm line,
                  reinforcing the network without shouting. */}
              {investors.length >= 4 && (
                <Reveal delay={0.06} className="mt-[clamp(2.75rem,6vw,4rem)]">
                  <Ticker
                    speedSeconds={52}
                    gapClass="gap-x-10"
                    ariaLabel={t({ ar: "شبكة الداعمين", en: "Network of backers" })}
                    items={investors.map((inv) => (
                      <span
                        key={inv.id}
                        className="inline-flex items-center gap-2.5 t-caption text-fg-faint"
                      >
                        <span
                          aria-hidden
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: TYPE_DOT[inv.type] ?? TYPE_DOT.individual }}
                        />
                        <span className="font-display font-semibold text-[14px] text-fg-secondary tracking-tight">
                          {inv.name}
                        </span>
                      </span>
                    ))}
                  />
                </Reveal>
              )}
            </>
          )}
        </section>

        {/* ── Invest CTA — a calm full-bleed band, mailto + WhatsApp preserved ── */}
        <section>
          <Reveal>
            <div className="relative overflow-hidden rounded-[clamp(1.75rem,3vw,2.25rem)] border border-border-strong/70 surface-2 px-[clamp(1.75rem,5vw,4rem)] py-[clamp(2.75rem,6vw,4.5rem)]">
              <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-1/3 h-[150%] brand-aura opacity-60" />
              <div className="relative max-w-2xl">
                <h3
                  className="font-display font-bold text-foreground"
                  style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", lineHeight: 1.06, letterSpacing: "-0.032em" }}
                >
                  {t(p.investTitle)}
                </h3>
                <p className="t-body text-[15px] md:text-[17px] mt-5 max-w-xl">
                  {t(p.investBody)}
                </p>
                <div className="mt-[clamp(2rem,4vw,2.75rem)] flex items-center gap-3 flex-wrap">
                  <a
                    href="mailto:island-haven@nastonas.org"
                    className="group inline-flex items-center gap-2.5 h-12 px-7 rounded-full cta-fill font-bold text-[14px] transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-16px_hsl(354_82%_30%_/_0.55)]"
                  >
                    <Mail className="w-4 h-4" />
                    {t(p.contactBtn)}
                  </a>
                  <a
                    href="https://wa.me/972567536815"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 h-12 px-7 rounded-full border border-border-strong text-fg-secondary font-medium text-[14px] hover:border-foreground/30 hover:text-foreground transition-colors"
                  >
                    WhatsApp
                    <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </PageShell>
  );
}
