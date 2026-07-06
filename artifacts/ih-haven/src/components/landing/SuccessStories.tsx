import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { EASE_OUT_EXPO, DURATION, VIEWPORT } from "@/lib/motion";
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
 * SuccessStories — member voices rendered CINEMATIC, matching the homepage's
 * hero power: the featured testimonial lives as large white type living directly
 * ON a full-bleed Gaza-space photograph (via the shared CinematicMedia primitive),
 * with the supporting voices flowing below on deep dark as a quiet, hairline-ruled
 * editorial list. Big bold modern-sans, dark cinematic — no sidebar photo, no
 * card grid, no serif. The never-empty evergreen fallback is preserved in the
 * same key, now a monumental statement on the same cinematic backdrop.
 */
export function SuccessStories() {
  const reduce = useReducedMotion();
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<Story[] | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ stories: Story[] }>("/stories")
      .then((r) => !cancelled && setRows(r.stories.slice(0, 6)))
      .catch(() => !cancelled && setRows([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const photo = imageUrl("/photos/IMG_8307.webp");

  // EVERGREEN fallback — before the first member story is recorded, this CORE
  // proof section must still stand monumental. We lead with the founding belief
  // itself, attributed to the team, as large white type on the cinematic photo
  // + an apply CTA.
  if (rows !== null && rows.length === 0) {
    return (
      <CinematicMedia
        as="section"
        id="stories"
        src={photo}
        scrim="heavy"
        sideScrim
        contentParallax
        className="border-t border-white/[0.06]"
        aria-label={t({ ar: "قصص النجاح", en: "Success stories" })}
      >
        <div className="container-ih section-y" data-testid="stories-band">
          <figure className="max-w-5xl">
            <p className="text-sand-bright t-caption mb-6 sm:mb-8">
              {t({ ar: "أصوات أعضائنا", en: "Voices of our members" })}
            </p>
            <blockquote
              className="font-display text-white"
              style={{
                fontSize: "clamp(2.4rem, 5vw, 4.5rem)",
                lineHeight: 1.08,
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
            </blockquote>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: DURATION.xl, delay: 0.4, ease: EASE_OUT_EXPO }}
              className="mt-9 sm:mt-12 max-w-2xl text-white/75"
              style={{ fontSize: "clamp(1.1rem, 1.9vw, 1.5rem)", lineHeight: 1.6 }}
            >
              {t({
                ar: "في غزّة كفاءاتٌ تستحقّ مقعدًا في الاقتصاد الرقميّ العالميّ — ومهمّتنا أن نوصلها إليه. أوّل من يقدّم اليوم، يكتب أوّل القصص.",
                en: "Gaza holds talent that deserves a seat in the global digital economy — our mission is to get it there. Whoever applies today writes the first story.",
              })}
            </motion.p>

            <motion.figcaption
              initial={reduce ? false : { opacity: 0, y: 14 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: DURATION.lg, delay: 0.55, ease: EASE_OUT_EXPO }}
              className="mt-10 sm:mt-12 flex flex-wrap items-center gap-x-6 gap-y-5"
            >
              <span className="text-white/55 t-caption">
                {t({ ar: "فريق آيلاند هيفن — قناعتنا التأسيسيّة", en: "The Island Haven team — our founding belief" })}
              </span>
              <Link
                href="/apply"
                data-testid="stories-empty-apply"
                className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
              >
                {t({ ar: "اكتب أوّل قصّة", en: "Write the first story" })}
                <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              </Link>
            </motion.figcaption>
          </figure>
        </div>
      </CinematicMedia>
    );
  }

  // Loading — a single calm placeholder on dark, no card deck.
  if (!rows) {
    return (
      <section
        id="stories"
        ref={ref}
        className="relative bg-[#060608] overflow-hidden"
        style={{ paddingBlock: "clamp(6rem, 15vh, 12rem)" }}
        data-testid="stories-band"
      >
        <div className="container-ih">
          <div className="h-[clamp(14rem,30vh,22rem)] max-w-5xl rounded-[20px] bg-white/[0.04] skeleton-shimmer" />
        </div>
      </section>
    );
  }

  const lead = rows[0];
  const rest = rows.slice(1, 4);

  return (
    <section id="stories" ref={ref} data-testid="stories-band">
      {/* LEAD — the featured testimonial as large white type living directly on a
          full-bleed Gaza-space photograph, hero-power via the shared primitive. */}
      <CinematicMedia
        as="div"
        src={photo}
        scrim="heavy"
        sideScrim
        contentParallax
        className="border-t border-white/[0.06]"
        aria-label={t({ ar: "قصّة عضو مميّزة", en: "Featured member story" })}
      >
        <div className="container-ih section-y">
          <figure className="max-w-5xl">
            <p className="text-sand-bright t-caption mb-6 sm:mb-8">
              {t({ ar: "أصوات أعضائنا", en: "Voices of our members" })}
            </p>

            <motion.blockquote
              initial={reduce ? false : { opacity: 0, y: 30 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: DURATION.xl, ease: EASE_OUT_EXPO }}
              className="font-display text-white"
              style={{
                fontSize: "clamp(1.9rem, 3.6vw, 3.1rem)",
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
                fontWeight: 700,
              }}
            >
              {lead.quote}
            </motion.blockquote>

            {lang === "en" && (
              <p className="mt-4 text-white/55 text-[11px] tracking-[0.2em] uppercase">
                Original · Arabic
              </p>
            )}

            <motion.figcaption
              initial={reduce ? false : { opacity: 0, y: 14 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: DURATION.lg, delay: 0.45, ease: EASE_OUT_EXPO }}
              className="mt-10 sm:mt-12"
            >
              <div className="font-bold text-white text-[clamp(1rem,1.6vw,1.2rem)]">
                {lead.personName}
              </div>
              <div className="text-white/55 t-caption mt-1.5">
                {[lead.role, lead.ventureName].filter(Boolean).join(" · ")}
              </div>
            </motion.figcaption>
          </figure>
        </div>
      </CinematicMedia>

      {/* SUPPORTING VOICES — a quiet, hairline-ruled editorial list on deep dark.
          NOT a card grid: each is a calm line of space, separated by a rule. */}
      {rest.length > 0 && (
        <div className="relative bg-[#060608] overflow-hidden" style={{ paddingBlock: "clamp(4rem, 12vh, 9rem)" }}>
          <div className="container-ih">
            <div className="max-w-4xl">
              {rest.map((s, i) => (
                <motion.figure
                  key={s.id}
                  initial={reduce ? false : { opacity: 0, y: 22 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={VIEWPORT}
                  transition={{ duration: DURATION.lg, delay: Math.min(i, 3) * 0.08, ease: EASE_OUT_EXPO }}
                  className="border-t border-white/10 py-[clamp(2rem,4vh,3.25rem)] first:border-t-0 first:pt-0"
                >
                  <blockquote
                    className="font-display text-white/75"
                    style={{
                      fontSize: "clamp(1.3rem, 2.6vw, 2rem)",
                      lineHeight: 1.32,
                      letterSpacing: "-0.02em",
                      fontWeight: 600,
                    }}
                  >
                    {s.quote}
                  </blockquote>
                  {lang === "en" && (
                    <p className="mt-3 text-white/55 text-[11px] tracking-[0.2em] uppercase">
                      Original · Arabic
                    </p>
                  )}
                  <figcaption className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-bold text-white text-[15px]">{s.personName}</span>
                    <span className="text-white/55 t-caption">
                      {[s.role, s.ventureName].filter(Boolean).join(" · ")}
                    </span>
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
