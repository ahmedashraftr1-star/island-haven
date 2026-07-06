import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { api } from "@/lib/api";
import { splitTags } from "@/lib/labels";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { CinematicMedia } from "@/components/landing/CinematicMedia";
import { imageUrl } from "@/hooks/use-content";

interface ExpertCard {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  headline: string;
  expertise: string;
  yearsExperience: number;
  acceptingSessions: boolean;
}

/**
 * Initials for the avatar fallback — first letters of the first two meaningful
 * name words, skipping single-letter honorifics ("م.", "أ.", "د."). Derived, not
 * hardcoded, so it holds for any mentor the API returns.
 */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const words = parts.filter((w) => w.replace(/\./g, "").length > 1);
  return (words.length ? words : parts)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("");
}

/**
 * ExpertsBand — mentor proof, told photo-first with the hero's "power".
 *
 * Inverted grandeur pass: the section now LEADS with a monumental full-bleed
 * photograph (shared CinematicMedia primitive — spring parallax + calibrated
 * scrim) carrying the eyebrow + the monumental headline + intro as a LIVE white
 * caption on the frame. Below, on a quieter dark canvas, the mentors follow as a
 * calm counterpoint: hairline rows, a dignified portrait, a large name, the
 * discipline as prose. Big bold modern-sans type, no serif, tasteful motion.
 * The never-empty evergreen fallback, the /experts link and the testids stay.
 */
export function ExpertsBand() {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();
  const [rows, setRows] = useState<ExpertCard[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ experts: ExpertCard[] }>("/experts")
      .then((r) => { if (!cancelled) setRows(r.experts.slice(0, 5)); })
      .catch(() => { if (!cancelled) setRows([]); });
    return () => { cancelled = true; };
  }, []);

  const isEmpty = rows !== null && rows.length === 0;
  const experts = rows ?? Array.from({ length: 5 }).map(() => null);
  const available = rows?.filter((e) => e.acceptingSessions).length ?? 0;
  const availableLabel = lang === "en" ? available.toString() : available.toLocaleString("ar-EG");

  // ── Headline lines — one crimson word. The evergreen branch (thin/unseeded DB)
  //    holds the same monumental register and tells the true story: the roster
  //    is forming — and invites the reader to be one of the first. ──
  const headlineLines: React.ReactNode[] = isEmpty
    ? [
        t({ ar: "المرشدون", en: "The mentors" }),
        t({ ar: "يتجمّعون.", en: "are gathering." }),
        <span key="accent" className="text-primary">{t({ ar: "كن منهم.", en: "Be one." })}</span>,
      ]
    : [
        t({ ar: "خبراءٌ يأخذون", en: "Experts who take" }),
        t({ ar: "بيدك نحو ", en: "your hand " }),
        <span key="accent">
          {t({ ar: "", en: "toward " })}
          <span className="text-primary">{t({ ar: "الأثر.", en: "impact." })}</span>
        </span>,
      ];

  const intro = isEmpty
    ? t({
        ar: "مؤسّسون وبُناةٌ ومتخصّصون من حول العالم يجلسون مع جيلٍ غزّيّ شابّ، واحدًا لواحد. جلسة واحدة قد تفتح بابًا أغلقته الحرب.",
        en: "Founders, builders and specialists worldwide sit with a young Gazan generation, one to one. A single session can open a door the war had closed.",
      })
    : t({
        ar: "احجز جلسة إرشاد فرديّة مَجّانًا، وحوّل فكرتك إلى مشروع قابل للنموّ.",
        en: "Book a free one-to-one session, and turn your idea into a venture that can scale.",
      });

  return (
    <section id="experts" className="bg-[#060608]" data-testid="experts-band">
      {/* ══ PART A — the lead: a monumental full-bleed photograph carrying the
           headline as a live white caption. Spring parallax + heavy scrim keep
           the type razor-crisp. Generous section-y padding gives the ~60vh feel. ══ */}
      <CinematicMedia
        as="div"
        src={imageUrl("/photos/IMG_8313.webp")}
        alt={t({ ar: "مرشدون ومنتسبون في آيلاند هيفن بغزّة", en: "Mentors and members at Island Haven in Gaza" })}
        scrim="heavy"
        sideScrim
        className="border-b border-white/[0.06]"
        aria-label={t({ ar: "الخبراء والمرشدون", en: "Experts and mentors" })}
      >
        <div className="container-ih section-y flex min-h-[60vh] flex-col justify-end">
          {/* Eyebrow — quiet gold signature above the monument. */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="mb-[clamp(1.25rem,2.5vw,2rem)] inline-flex items-center gap-3"
          >
            <span aria-hidden className="h-px w-8 bg-sand-bright/70" />
            <span className="font-display font-semibold uppercase tracking-[0.22em] text-sand-bright" style={{ fontSize: "clamp(0.7rem,1vw,0.82rem)" }}>
              {t({ ar: "الخبراء والمرشدون", en: "Experts & mentors" })}
            </span>
          </motion.div>

          <motion.h2
            className="font-display text-white"
            style={{ fontSize: "clamp(2.4rem, 5vw, 4.5rem)", fontWeight: 900, lineHeight: 0.98, letterSpacing: "-0.05em" }}
          >
            {headlineLines.map((ln, i) => (
              <motion.span
                key={i}
                className="block will-change-transform"
                initial={reduce ? false : { opacity: 0, y: 30 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.85, delay: i * 0.09, ease: EASE_OUT_EXPO }}
              >
                {ln}
              </motion.span>
            ))}
          </motion.h2>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.85, delay: 0.42, ease: EASE_OUT_EXPO }}
            className="mt-[clamp(1.5rem,3vw,2.25rem)] max-w-2xl text-white/70"
            style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
          >
            {intro}
          </motion.p>

          {/* Live availability (default path) / dual CTA (evergreen path). */}
          {isEmpty ? (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.8, delay: 0.52, ease: EASE_OUT_EXPO }}
              className="mt-[clamp(2rem,4vw,2.75rem)] flex flex-wrap items-center gap-x-7 gap-y-4"
            >
              <Link
                href="/become-mentor?ref=home-experts-empty"
                data-testid="experts-empty-become-mentor"
                className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
              >
                {t({ ar: "سجّل كمرشد", en: "Become a mentor" })}
                <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              </Link>
              <Link
                href="/experts#how-it-works"
                className="group inline-flex items-center gap-2 text-[14px] font-semibold text-white/85 hover:text-white transition-colors"
              >
                {t({ ar: "كيف يعمل الإرشاد", en: "How mentorship works" })}
                <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              </Link>
            </motion.div>
          ) : (
            rows && available > 0 && (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 12 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-8%" }}
                transition={{ duration: 0.7, delay: 0.54, ease: EASE_OUT_EXPO }}
                className="mt-[clamp(1.75rem,3vw,2.5rem)] inline-flex items-center gap-2.5 text-sand-bright"
              >
                <span aria-hidden className="inline-flex h-1.5 w-1.5 rounded-full bg-sand-bright" />
                <span className="font-display font-semibold tnum" style={{ fontSize: "clamp(1rem,1.4vw,1.15rem)" }}>
                  {availableLabel} {t({ ar: "متاحون للحجز الآن", en: "available to book now" })}
                </span>
              </motion.div>
            )
          )}
        </div>
      </CinematicMedia>

      {/* ══ PART B — the roster, a quieter counterpoint on the dark canvas: calm
           editorial hairline rows. A dignified portrait (real face, no medallion),
           a large name, the discipline as prose. White/70 text, hairline dividers.
           Skipped on the evergreen branch — the photo caption CTA carries it. ══ */}
      {!isEmpty && (
        <div className="container-ih" style={{ paddingBlock: "clamp(4rem, 10vh, 8rem)" }}>
          <ul className="border-t border-white/10">
            {experts.map((e, i) => {
              if (!e) {
                return (
                  <li key={i} className="border-b border-white/10 py-[clamp(1.5rem,3vw,2.5rem)]">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-full bg-white/[0.06] animate-pulse shrink-0" />
                      <div className="h-7 w-48 max-w-[60%] rounded bg-white/[0.06] animate-pulse" />
                    </div>
                  </li>
                );
              }
              const tags = splitTags(e.expertise).slice(0, 2);
              return (
                <li key={e.id}>
                  <motion.div
                    initial={reduce ? false : { opacity: 0, y: 20 }}
                    whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.7, delay: i * 0.06, ease: EASE_OUT_EXPO }}
                    className="will-change-transform"
                  >
                    <Link
                      href={`/experts/${e.id}`}
                      data-testid={`home-expert-${e.id}`}
                      className="group grid grid-cols-[auto_1fr] md:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-[clamp(1.25rem,2.5vw,2.5rem)] gap-y-2 py-[clamp(1.5rem,3vw,2.5rem)] border-b border-white/10 transition-colors hover:border-white/25"
                    >
                      {/* Portrait — a real face where one exists; otherwise a toned
                          initial-avatar (crimson / gold, alternating) so every
                          mentor carries a visual identity in the booking list. */}
                      {e.avatarUrl ? (
                        <div className="relative h-[clamp(3.5rem,7vw,5rem)] w-[clamp(3.5rem,7vw,5rem)] shrink-0 overflow-hidden rounded-full ring-1 ring-white/15">
                          <img
                            src={e.avatarUrl}
                            alt={e.fullName}
                            loading="lazy"
                            className="h-full w-full object-cover saturate-[1.03] transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                          />
                        </div>
                      ) : (
                        <span
                          aria-hidden
                          className={`inline-flex h-[clamp(3.5rem,7vw,5rem)] w-[clamp(3.5rem,7vw,5rem)] shrink-0 items-center justify-center rounded-full ring-1 font-display font-black leading-none transition-transform duration-500 group-hover:scale-[1.05] ${
                            i % 2 === 0
                              ? "bg-primary/15 ring-primary/30 text-primary"
                              : "bg-sand/15 ring-sand/30 text-sand-bright"
                          }`}
                          style={{ fontSize: "clamp(1.05rem,2vw,1.6rem)" }}
                        >
                          {initials(e.fullName)}
                        </span>
                      )}

                      <div className="min-w-0">
                        <h3
                          className="font-display font-bold text-white group-hover:text-primary transition-colors"
                          style={{ fontSize: "clamp(1.4rem,3.2vw,2.4rem)", letterSpacing: "-0.03em", lineHeight: 1.1 }}
                        >
                          {e.fullName}
                        </h3>
                        {(e.headline || tags.length > 0) && (
                          <p className="text-white/55 text-[15px] md:text-[16px] mt-1.5 line-clamp-1">
                            {e.headline || tags.join(lang === "en" ? " · " : " • ")}
                          </p>
                        )}
                      </div>

                      {/* Quiet status + experience, start-aligned to the logical end. */}
                      <div className="hidden md:flex items-center gap-x-6 whitespace-nowrap justify-self-end">
                        {e.yearsExperience > 0 && (
                          <span className="text-white/55 text-[13px] tnum">
                            {lang === "en"
                              ? `${e.yearsExperience}+ yrs`
                              : `${e.yearsExperience.toLocaleString("ar-EG")}+ سنة`}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-2 text-[13px]">
                          {e.acceptingSessions ? (
                            <>
                              <span aria-hidden className="inline-flex h-1.5 w-1.5 rounded-full bg-sand-bright" />
                              <span className="text-sand-bright font-semibold">{t({ ar: "متاح", en: "Open" })}</span>
                            </>
                          ) : (
                            <span className="text-white/55">{t({ ar: "مشغول", en: "Busy" })}</span>
                          )}
                          <ArrowLeft className="w-4 h-4 text-white/40 rtl:rotate-180 transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:text-primary group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                </li>
              );
            })}
          </ul>

          {/* Terminal CTA — a calm confident line, no icon tile. */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT_EXPO }}
            className="mt-[clamp(2.5rem,5vw,4rem)] flex flex-wrap items-center gap-x-4 gap-y-3"
          >
            <p className="text-white/70" style={{ fontSize: "clamp(1rem,1.6vw,1.2rem)" }}>
              {t({ ar: "كلّ الخبراء، في مكانٍ واحد.", en: "Every expert, in one place." })}
            </p>
            <Link
              href="/experts"
              className="group inline-flex items-center gap-2 text-white hover:text-primary transition-colors"
              style={{ fontSize: "clamp(1rem,1.6vw,1.2rem)", fontWeight: 600 }}
            >
              {t({ ar: "تصفّح كل الخبراء", en: "Browse all experts" })}
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      )}
    </section>
  );
}
