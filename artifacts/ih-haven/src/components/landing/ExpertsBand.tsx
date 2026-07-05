import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { api } from "@/lib/api";
import { splitTags } from "@/lib/labels";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";

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
 * ExpertsBand — the mentor roster, told the Apple way: SCALE + SPACE + RESTRAINT.
 *
 * Grandeur pass: gone are the crimson medallion card-deck, the featured-star
 * chips, the icon-tile CTA and the aura blob — all AI tells. In their place a
 * single monumental headline on a dark canvas (one crimson word), and the
 * mentors as calm editorial hairline rows: a large name, a dignified portrait
 * where one exists, the discipline as prose. Type and acres of space carry it.
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

  // EVERGREEN fallback — this proof section is CORE to the homepage and must
  // never vanish on a thin/unseeded DB. When no experts exist yet, hold the
  // monumental register and tell the true story: the roster is forming — and
  // invite the reader to be one of the first. No eyebrow rule, no aura.
  if (rows !== null && rows.length === 0) {
    return (
      <section
        id="experts"
        className="relative bg-surface-1 overflow-hidden"
        style={{ paddingTop: "clamp(4rem, 10vh, 8rem)", paddingBottom: "clamp(6.5rem, 17vh, 13rem)" }}
        data-testid="experts-band"
      >
        <div className="container-ih relative">
          <motion.h2
            className="font-display text-foreground max-w-[15ch]"
            style={{ fontSize: "clamp(1.9rem, 3.6vw, 3.1rem)", lineHeight: 0.99, letterSpacing: "-0.045em", fontWeight: 700 }}
          >
            {[
              t({ ar: "المرشدون", en: "The mentors" }),
              t({ ar: "يتجمّعون.", en: "are gathering." }),
              <span key="accent" className="text-primary">{t({ ar: "كن منهم.", en: "Be one." })}</span>,
            ].map((ln, i) => (
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
            transition={{ duration: 0.85, delay: 0.4, ease: EASE_OUT_EXPO }}
            className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-2xl text-fg-secondary"
            style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
          >
            {t({
              ar: "مؤسّسون وبُناةٌ ومتخصّصون من حول العالم يجلسون مع جيلٍ غزّيّ شابّ، واحدًا لواحد. جلسة واحدة قد تفتح بابًا أغلقته الحرب.",
              en: "Founders, builders and specialists worldwide sit with a young Gazan generation, one to one. A single session can open a door the war had closed.",
            })}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.8, delay: 0.52, ease: EASE_OUT_EXPO }}
            className="mt-[clamp(2rem,4vw,3rem)] flex flex-wrap items-center gap-x-7 gap-y-4"
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
              className="group inline-flex items-center gap-2 text-[14px] font-semibold text-foreground/85 hover:text-foreground transition-colors"
            >
              {t({ ar: "كيف يعمل الإرشاد", en: "How mentorship works" })}
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {/* The place and its people — one full-bleed photograph, a calm line overlaid. */}
        <motion.div
          className="relative mt-[clamp(4rem,9vh,7rem)] w-full overflow-hidden"
          initial={reduce ? false : { opacity: 0 }}
          whileInView={reduce ? undefined : { opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1, ease: EASE_OUT_EXPO }}
        >
          <div className="relative h-[clamp(20rem,52vh,34rem)]">
            <img
              src="/photos/IMG_8352.webp"
              alt={t({ ar: "مرشدون ومنتسبون في آيلاند هيفن بغزّة", en: "Mentors and members at Island Haven in Gaza" })}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-center saturate-[1.04]"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, hsl(0 0% 4% / 0.92) 0%, hsl(0 0% 4% / 0.5) 45%, transparent 80%)" }}
            />
            <div className="absolute inset-0 flex items-end">
              <div className="container-ih w-full pb-[clamp(2.5rem,6vh,4.5rem)]">
                <motion.p
                  className="max-w-[20ch] text-white"
                  style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.6rem)", lineHeight: 1.18, letterSpacing: "-0.02em", fontWeight: 600 }}
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
                >
                  {t({ ar: "موهبةٌ تنتظر من يأخذ بيدها.", en: "Talent waiting for a hand to guide it." })}
                </motion.p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    );
  }

  const experts = rows ?? Array.from({ length: 5 }).map(() => null);
  const available = rows?.filter((e) => e.acceptingSessions).length ?? 0;
  const availableLabel = lang === "en" ? available.toString() : available.toLocaleString("ar-EG");

  return (
    <section
      id="experts"
      className="relative bg-surface-1 overflow-hidden"
      style={{ paddingBlock: "clamp(6.5rem, 17vh, 13rem)" }}
      data-testid="experts-band"
    >
      <div className="container-ih relative">
        {/* ── Monumental header — one quiet line, one crimson word, acres of space ── */}
        <header className="max-w-4xl">
          <motion.h2
            className="font-display text-foreground"
            style={{ fontSize: "clamp(1.9rem, 3.6vw, 3.1rem)", lineHeight: 0.99, letterSpacing: "-0.045em", fontWeight: 700 }}
          >
            {[
              t({ ar: "خبراءٌ يأخذون", en: "Experts who take" }),
              t({ ar: "بيدك نحو ", en: "your hand " }),
              <span key="accent">
                {t({ ar: "", en: "toward " })}
                <span className="text-primary">{t({ ar: "الأثر.", en: "impact." })}</span>
              </span>,
            ].map((ln, i) => (
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
            className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-2xl text-fg-secondary"
            style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
          >
            {t({
              ar: "احجز جلسة إرشاد فرديّة مَجّانًا، وحوّل فكرتك إلى مشروع قابل للنموّ.",
              en: "Book a free one-to-one session, and turn your idea into a venture that can scale.",
            })}
          </motion.p>

          {rows && available > 0 && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.7, delay: 0.54, ease: EASE_OUT_EXPO }}
              className="mt-[clamp(1.75rem,3vw,2.5rem)] inline-flex items-center gap-2.5 text-sand"
            >
              <span aria-hidden className="inline-flex h-1.5 w-1.5 rounded-full bg-sand" />
              <span className="font-display font-semibold tnum" style={{ fontSize: "clamp(1rem,1.4vw,1.15rem)" }}>
                {availableLabel} {t({ ar: "متاحون للحجز الآن", en: "available to book now" })}
              </span>
            </motion.div>
          )}
        </header>

        {/* ── The roster — calm editorial hairline rows. A dignified portrait (real
             face, no medallion), a large name, the discipline as prose. Not a deck. ── */}
        <ul className="mt-[clamp(3.5rem,7vw,6rem)] border-t border-border-strong/60">
          {experts.map((e, i) => {
            if (!e) {
              return (
                <li key={i} className="border-b border-border-strong/60 py-[clamp(1.5rem,3vw,2.5rem)]">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-full bg-surface-3 animate-pulse shrink-0" />
                    <div className="h-7 w-48 max-w-[60%] rounded bg-surface-3 animate-pulse" />
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
                    className="group grid grid-cols-[auto_1fr] md:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-[clamp(1.25rem,2.5vw,2.5rem)] gap-y-2 py-[clamp(1.5rem,3vw,2.5rem)] border-b border-border-strong/60 transition-colors hover:border-border-strong"
                  >
                    {/* Portrait — a real face where one exists; otherwise a toned
                        initial-avatar (crimson / cerulean, alternating) so every
                        mentor carries a visual identity in the booking list. */}
                    {e.avatarUrl ? (
                      <div className="relative h-[clamp(3.5rem,7vw,5rem)] w-[clamp(3.5rem,7vw,5rem)] shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
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
                        className="font-display font-bold text-foreground group-hover:text-primary transition-colors"
                        style={{ fontSize: "clamp(1.4rem,3.2vw,2.4rem)", letterSpacing: "-0.03em", lineHeight: 1.1 }}
                      >
                        {e.fullName}
                      </h3>
                      {(e.headline || tags.length > 0) && (
                        <p className="t-body text-[15px] md:text-[16px] mt-1.5 line-clamp-1">
                          {e.headline || tags.join(lang === "en" ? " · " : " • ")}
                        </p>
                      )}
                    </div>

                    {/* Quiet status + experience, start-aligned to the logical end. */}
                    <div className="hidden md:flex items-center gap-x-6 whitespace-nowrap justify-self-end">
                      {e.yearsExperience > 0 && (
                        <span className="t-caption text-fg-secondary tnum">
                          {lang === "en"
                            ? `${e.yearsExperience}+ yrs`
                            : `${e.yearsExperience.toLocaleString("ar-EG")}+ سنة`}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-2 t-caption">
                        {e.acceptingSessions ? (
                          <>
                            <span aria-hidden className="inline-flex h-1.5 w-1.5 rounded-full bg-sand" />
                            <span className="text-sand font-semibold">{t({ ar: "متاح", en: "Open" })}</span>
                          </>
                        ) : (
                          <span className="text-fg-secondary">{t({ ar: "مشغول", en: "Busy" })}</span>
                        )}
                        <ArrowLeft className="w-4 h-4 text-fg-faint rtl:rotate-180 transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:text-primary group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
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
          <p className="text-fg-secondary" style={{ fontSize: "clamp(1rem,1.6vw,1.2rem)" }}>
            {t({ ar: "كلّ الخبراء، في مكانٍ واحد.", en: "Every expert, in one place." })}
          </p>
          <Link
            href="/experts"
            className="group inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            style={{ fontSize: "clamp(1rem,1.6vw,1.2rem)", fontWeight: 600 }}
          >
            {t({ ar: "تصفّح كل الخبراء", en: "Browse all experts" })}
            <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>

      {/* The place and its people — one full-bleed photograph, a calm line overlaid.
          The default path earns the same editorial grandeur as the evergreen fallback. */}
      <motion.div
        className="relative mt-[clamp(4rem,9vh,7rem)] w-full overflow-hidden"
        initial={reduce ? false : { opacity: 0 }}
        whileInView={reduce ? undefined : { opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1, ease: EASE_OUT_EXPO }}
      >
        <div className="relative h-[clamp(20rem,52vh,34rem)]">
          <img
            src="/photos/IMG_8352.webp"
            alt={t({ ar: "مرشدون ومنتسبون في آيلاند هيفن بغزّة", en: "Mentors and members at Island Haven in Gaza" })}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center saturate-[1.04]"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, hsl(0 0% 4% / 0.92) 0%, hsl(0 0% 4% / 0.5) 45%, transparent 80%)" }}
          />
          <div className="absolute inset-0 flex items-end">
            <div className="container-ih w-full pb-[clamp(2.5rem,6vh,4.5rem)]">
              <motion.p
                className="max-w-[20ch] text-white"
                style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.6rem)", lineHeight: 1.18, letterSpacing: "-0.02em", fontWeight: 600 }}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
              >
                {t({ ar: "موهبةٌ تنتظر من يأخذ بيدها.", en: "Talent waiting for a hand to guide it." })}
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
