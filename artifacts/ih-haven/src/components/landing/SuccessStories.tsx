import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { Reveal } from "@/components/landing/Reveal";

interface Story {
  id: number;
  personName: string;
  role: string;
  quote: string;
  avatarUrl: string | null;
  ventureName: string;
}

/**
 * SuccessStories — member voices rendered as a PREMIUM LIGHT newsroom/editorial
 * "voices" section, matching the sibling light breathers (WhatYouGet, HomeFAQ).
 * Warm paper canvas (theme-light flips the tokens), a big bold display headline,
 * ONE featured pull-quote set large in dark ink, then the supporting voices as a
 * clean hairline-divided editorial LIST — quote + attribution rows, NOT a card
 * deck, NOT a photo scrim. The never-empty evergreen fallback is preserved on
 * the same light register. No serif-photo cinematic, no gradient, no glass.
 * All data / quotes / i18n / routes / testids kept.
 */
export function SuccessStories() {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<Story[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ stories: Story[] }>("/stories")
      .then((r) => !cancelled && setRows(r.stories.slice(0, 6)))
      .catch(() => !cancelled && setRows([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const eyebrow = (
    <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary rtl:tracking-[0.12em]">
      {t({ ar: "أصوات أعضائنا", en: "Voices of our members" })}
    </p>
  );

  // Loading — a single calm paper placeholder, no card deck.
  if (!rows) {
    return (
      <section
        id="stories"
        className="theme-light relative bg-background text-foreground border-y border-border overflow-hidden section-y"
        data-testid="stories-band"
      >
        <div className="container-ih">
          <div className="h-[clamp(14rem,30vh,20rem)] max-w-4xl rounded-[20px] bg-surface-2 skeleton-shimmer" />
        </div>
      </section>
    );
  }

  // EVERGREEN fallback — before the first member story is recorded, this CORE
  // proof section must still stand. We lead with the founding belief itself,
  // attributed to the team, as a large dark-ink pull-quote on warm paper + an
  // apply CTA. Same light register, no invented testimonials.
  if (rows.length === 0) {
    return (
      <section
        id="stories"
        className="theme-light relative bg-background text-foreground border-y border-border overflow-hidden section-y"
        aria-label={t({ ar: "قصص النجاح", en: "Success stories" })}
        data-testid="stories-band"
      >
        <div className="container-ih relative">
          <figure className="max-w-4xl">
            <Reveal as="div">{eyebrow}</Reveal>
            <Reveal
              as="p"
              delay={0.05}
              className="font-display text-foreground"
              // A monumental founding statement, dark ink on paper.
            >
              <span
                style={{
                  display: "block",
                  fontSize: "clamp(2.4rem, 5vw, 4.5rem)",
                  lineHeight: 0.98,
                  letterSpacing: "-0.04em",
                  fontWeight: 900,
                }}
              >
                {lang === "ar" ? (
                  <>
                    الموهبة لا تحدّها <span className="text-primary">الجغرافيا</span>.
                  </>
                ) : (
                  <>
                    Talent is not bound by <span className="text-primary">geography</span>.
                  </>
                )}
              </span>
            </Reveal>

            <Reveal
              as="p"
              delay={0.12}
              className="mt-9 sm:mt-12 max-w-2xl text-fg-secondary"
            >
              <span style={{ fontSize: "clamp(1.1rem, 1.9vw, 1.4rem)", lineHeight: 1.6 }}>
                {t({
                  ar: "في غزّة كفاءاتٌ تستحقّ مقعدًا في الاقتصاد الرقميّ العالميّ — ومهمّتنا أن نوصلها إليه. أوّل من يقدّم اليوم، يكتب أوّل القصص.",
                  en: "Gaza holds talent that deserves a seat in the global digital economy — our mission is to get it there. Whoever applies today writes the first story.",
                })}
              </span>
            </Reveal>

            <Reveal
              as="div"
              delay={0.18}
              className="mt-10 sm:mt-12 flex flex-wrap items-center gap-x-6 gap-y-5"
            >
              <span className="text-[13px] uppercase tracking-[0.16em] text-fg-faint">
                {t({ ar: "فريق آيلاند هيفن — قناعتنا التأسيسيّة", en: "The Island Haven team — our founding belief" })}
              </span>
              <Link
                href="/apply"
                data-testid="stories-empty-apply"
                className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t({ ar: "اكتب أوّل قصّة", en: "Write the first story" })}
                <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" aria-hidden />
              </Link>
            </Reveal>
          </figure>
        </div>
      </section>
    );
  }

  const lead = rows[0];
  const rest = rows.slice(1, 4);

  return (
    <section
      id="stories"
      className="theme-light relative bg-background text-foreground border-y border-border overflow-hidden section-y"
      aria-label={t({ ar: "أصوات أعضائنا", en: "Voices of our members" })}
      data-testid="stories-band"
    >
      <div className="container-ih relative">
        {/* Header — calm eyebrow + one monumental line. */}
        <Reveal as="div" className="max-w-4xl">
          {eyebrow}
          <h2
            className="font-display text-foreground"
            style={{
              fontSize: "clamp(2.4rem, 5vw, 4.5rem)",
              fontWeight: 900,
              lineHeight: 0.98,
              letterSpacing: "-0.04em",
            }}
          >
            {t({ ar: "أصواتٌ من ", en: "Voices from " })}
            <span className="text-primary">{t({ ar: "الميدان.", en: "the ground." })}</span>
          </h2>
        </Reveal>

        {/* FEATURED — the lead testimonial set large as a dark-ink pull-quote on
            paper, with an em-dash attribution. Newsroom "above the fold". */}
        <Reveal as="div" delay={0.06} className="mt-[clamp(2.5rem,6vh,4.5rem)] max-w-5xl">
          <figure>
            <blockquote
              className="font-display text-foreground"
              style={{
                fontSize: "clamp(1.6rem, 3vw, 2.6rem)",
                lineHeight: 1.22,
                letterSpacing: "-0.02em",
                fontWeight: 700,
              }}
            >
              {lead.quote}
            </blockquote>

            {lang === "en" && (
              <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-fg-faint">
                {t({ ar: "", en: "Original · Arabic" })}
              </p>
            )}

            <figcaption className="mt-8 sm:mt-10">
              <div className="font-bold text-foreground text-[clamp(1rem,1.6vw,1.2rem)]">
                {lead.personName}
              </div>
              <div className="mt-1.5 text-[13px] uppercase tracking-[0.14em] text-fg-faint">
                {[lead.role, lead.ventureName].filter(Boolean).join(" · ")}
              </div>
            </figcaption>
          </figure>
        </Reveal>

        {/* SUPPORTING VOICES — a clean, hairline-divided editorial LIST. Each is
            a calm quote + attribution row separated by a rule. NOT a card deck. */}
        {rest.length > 0 && (
          <div className="mt-[clamp(3rem,7vh,5rem)] max-w-4xl border-t border-border-strong">
            {rest.map((s, i) => (
              <Reveal
                as="div"
                key={s.id}
                delay={Math.min(i, 3) * 0.06}
                className="border-b border-border py-[clamp(1.75rem,4vh,2.75rem)]"
              >
                <figure>
                  <blockquote
                    className="font-display text-foreground/80"
                    style={{
                      fontSize: "clamp(1.2rem, 2.3vw, 1.7rem)",
                      lineHeight: 1.34,
                      letterSpacing: "-0.015em",
                      fontWeight: 600,
                    }}
                  >
                    {s.quote}
                  </blockquote>
                  {lang === "en" && (
                    <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-fg-faint">
                      {t({ ar: "", en: "Original · Arabic" })}
                    </p>
                  )}
                  <figcaption className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-bold text-foreground text-[15px]">{s.personName}</span>
                    <span className="text-[13px] uppercase tracking-[0.14em] text-fg-faint">
                      {[s.role, s.ventureName].filter(Boolean).join(" · ")}
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
