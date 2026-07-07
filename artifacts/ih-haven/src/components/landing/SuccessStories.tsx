import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { Reveal } from "@/components/landing/Reveal";
import { CinematicMedia } from "@/components/landing/CinematicMedia";
import { imageUrl } from "@/hooks/use-content";

interface Story {
  id: number;
  personName: string;
  role: string;
  quote: string;
  avatarUrl: string | null;
  ventureName: string;
}

/**
 * SuccessStories — member voices told at hero power on a VIVID full-bleed Gaza
 * photograph (the FeaturedMembers standard), not on flat black. Glass tiles
 * FLOAT on the photo + a slow ambient field: ONE featured pull-quote set large
 * in white inside a `glass-panel-lg` tile with a terracotta quote mark, then the
 * supporting voices as small `glass-panel` rows. The never-empty evergreen
 * fallback stands on the same lit photo register. Terracotta is the sole accent.
 * All data / quotes / i18n / routes / testids kept.
 */

const PHOTO = imageUrl("/photos/IMG_8307.webp");

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

  // Loading — a single calm glass placeholder floating on the lit photo field.
  if (!rows) {
    return (
      <CinematicMedia
        as="section"
        id="stories"
        src={PHOTO}
        scrim="medium"
        sideScrim={false}
        className="relative overflow-hidden border-t border-white/[0.06]"
        data-testid="stories-band"
      >
        <div aria-hidden className="absolute inset-0 glass-ambient pointer-events-none" />
        <div className="container-ih section-y relative">
          <div className="h-[clamp(14rem,30vh,20rem)] max-w-4xl rounded-[32px] glass-panel-lg skeleton-shimmer" />
        </div>
      </CinematicMedia>
    );
  }

  // EVERGREEN fallback — before the first member story is recorded, this CORE
  // proof section must still stand. We lead with the founding belief itself,
  // attributed to the team, as a large white pull-quote inside a glass tile
  // floating on the vivid photo + an apply CTA. No invented testimonials.
  if (rows.length === 0) {
    return (
      <CinematicMedia
        as="section"
        id="stories"
        src={PHOTO}
        scrim="medium"
        sideScrim={false}
        className="relative overflow-hidden border-t border-white/[0.06]"
        aria-label={t({ ar: "قصص النجاح", en: "Success stories" })}
        data-testid="stories-band"
      >
        <div aria-hidden className="absolute inset-0 glass-ambient pointer-events-none" />
        <div className="container-ih section-y relative">
          <figure className="relative max-w-4xl glass-panel-lg p-[clamp(1.75rem,4vw,3.5rem)]">
            {/* Terracotta quote mark — sole accent. */}
            <span
              aria-hidden
              className="font-display text-primary/90 leading-none select-none"
              style={{
                position: "absolute",
                top: "clamp(0.5rem, 2vw, 1.5rem)",
                insetInlineStart: "clamp(1.25rem, 3vw, 2.75rem)",
                fontSize: "clamp(4rem, 9vw, 8rem)",
              }}
            >
              &ldquo;
            </span>

            <div className="relative">
              <Reveal as="div">{eyebrow}</Reveal>
              <Reveal as="p" delay={0.05} className="font-display text-white">
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

              <Reveal as="p" delay={0.12} className="mt-9 sm:mt-12 max-w-2xl text-white/70">
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
                <span className="text-[13px] uppercase tracking-[0.16em] text-white/55">
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
            </div>
          </figure>
        </div>
      </CinematicMedia>
    );
  }

  const lead = rows[0];
  const rest = rows.slice(1, 4);

  return (
    <CinematicMedia
      as="section"
      id="stories"
      src={PHOTO}
      scrim="medium"
      sideScrim={false}
      className="relative overflow-hidden border-t border-white/[0.06]"
      aria-label={t({ ar: "أصوات أعضائنا", en: "Voices of our members" })}
      data-testid="stories-band"
    >
      <div aria-hidden className="absolute inset-0 glass-ambient pointer-events-none" />
      <div className="container-ih section-y relative">
        {/* Header — calm eyebrow + one monumental line. */}
        <Reveal as="div" className="max-w-4xl">
          {eyebrow}
          <h2
            className="font-display text-white"
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

        {/* FEATURED — the lead testimonial set large in white inside a glass tile
            floating on the vivid photo, with a terracotta quote mark. */}
        <Reveal as="div" delay={0.06} className="mt-[clamp(2.5rem,6vh,4.5rem)] max-w-5xl">
          <figure className="relative glass-panel-lg p-[clamp(1.75rem,4vw,3.5rem)]">
            <span
              aria-hidden
              className="font-display text-primary/90 leading-none select-none"
              style={{
                position: "absolute",
                top: "clamp(0.25rem, 1.5vw, 1rem)",
                insetInlineStart: "clamp(1.25rem, 3vw, 2.75rem)",
                fontSize: "clamp(4rem, 9vw, 8rem)",
              }}
            >
              &ldquo;
            </span>

            <div className="relative">
              <blockquote
                className="font-display text-white"
                style={{
                  fontSize: "clamp(1.7rem, 3vw, 2.7rem)",
                  lineHeight: 1.22,
                  letterSpacing: "-0.02em",
                  fontWeight: 700,
                }}
              >
                {lead.quote}
              </blockquote>

              {lang === "en" && (
                <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-white/45">
                  {t({ ar: "", en: "Original · Arabic" })}
                </p>
              )}

              <figcaption className="mt-8 sm:mt-10 flex items-center gap-4">
                {lead.avatarUrl ? (
                  <img
                    src={lead.avatarUrl}
                    alt={lead.personName}
                    loading="lazy"
                    className="h-14 w-14 rounded-full object-cover ring-1 ring-white/20"
                  />
                ) : (
                  <span className="grid h-14 w-14 place-items-center rounded-full border border-white/20 bg-white/[0.06] font-display text-xl font-black text-sand-bright">
                    {lead.personName.trim().charAt(0)}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="font-bold text-white text-[clamp(1rem,1.6vw,1.2rem)] leading-tight">
                    {lead.personName}
                  </div>
                  <div className="mt-1.5 text-[13px] uppercase tracking-[0.14em] text-white/55">
                    {[lead.role, lead.ventureName].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </figcaption>
            </div>
          </figure>
        </Reveal>

        {/* SUPPORTING VOICES — small frosted glass rows floating on the photo,
            each a calm quote + attribution. NOT a hairline list on flat black. */}
        {rest.length > 0 && (
          <div className="mt-[clamp(2rem,5vh,3.25rem)] grid max-w-5xl gap-3 sm:gap-4 lg:grid-cols-3">
            {rest.map((s, i) => (
              <Reveal
                as="div"
                key={s.id}
                delay={Math.min(i, 3) * 0.06}
                className="h-full"
              >
                <figure
                  className="group relative flex h-full flex-col glass-panel p-[clamp(1.25rem,2.5vw,1.75rem)] transition-[transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(.2,.7,.2,1)] hover:-translate-y-1 hover:border-primary/45 hover:shadow-[0_44px_100px_-36px_hsl(0_0%_0%/0.8)]"
                >
                  <span
                    aria-hidden
                    className="font-display text-primary/80 leading-none select-none"
                    style={{ fontSize: "clamp(2rem,4vw,3rem)" }}
                  >
                    &ldquo;
                  </span>
                  <blockquote
                    className="mt-1 font-display text-white/85"
                    style={{
                      fontSize: "clamp(1.05rem, 1.7vw, 1.3rem)",
                      lineHeight: 1.36,
                      letterSpacing: "-0.015em",
                      fontWeight: 600,
                    }}
                  >
                    {s.quote}
                  </blockquote>
                  {lang === "en" && (
                    <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-white/40">
                      {t({ ar: "", en: "Original · Arabic" })}
                    </p>
                  )}
                  <figcaption className="mt-auto flex flex-col gap-0.5 pt-5">
                    <span className="font-bold text-white text-[14px] leading-tight">{s.personName}</span>
                    <span className="text-[12px] uppercase tracking-[0.14em] text-white/55">
                      {[s.role, s.ventureName].filter(Boolean).join(" · ")}
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </CinematicMedia>
  );
}
