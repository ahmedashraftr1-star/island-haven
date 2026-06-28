import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { EASE_OUT_EXPO, VIEWPORT } from "@/lib/motion";

interface Story {
  id: number;
  personName: string;
  role: string;
  quote: string;
  avatarUrl: string | null;
  ventureName: string;
}

/**
 * SuccessStories — member voices rendered as a single MONUMENTAL pull-quote on
 * acres of space, the Apple/Statement way. No eyebrow kicker, no quote-icon
 * medallions, no circular crimson avatar plates, no uniform card grid, no aura
 * blob. One huge quote against full-bleed Gaza-space photography; supporting
 * voices become a quiet, hairline-ruled editorial list — scale + restraint, not
 * decoration. The never-empty evergreen fallback is preserved in the same key.
 */
export function SuccessStories() {
  const reduce = useReducedMotion();
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<Story[] | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["8%", "-8%"]);

  useEffect(() => {
    let cancelled = false;
    api<{ stories: Story[] }>("/stories")
      .then((r) => !cancelled && setRows(r.stories.slice(0, 6)))
      .catch(() => !cancelled && setRows([]));
    return () => {
      cancelled = true;
    };
  }, []);

  // EVERGREEN fallback — before the first member story is recorded, this CORE
  // proof section must still stand monumental. We lead with the founding belief
  // itself, attributed to the team, on acres of calm space + an apply CTA.
  if (rows !== null && rows.length === 0) {
    return (
      <section
        id="stories"
        ref={ref}
        className="relative bg-surface-1 overflow-hidden"
        style={{ paddingBlock: "clamp(6rem, 15vh, 12rem)" }}
        data-testid="stories-band"
      >
        <div className="container-ih relative">
          <motion.figure style={{ y }} className="max-w-5xl will-change-transform">
            <blockquote
              className="font-display text-foreground"
              style={{
                fontSize: "clamp(2.6rem, 7.4vw, 5rem)",
                lineHeight: 1.02,
                letterSpacing: "-0.04em",
                fontWeight: 700,
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
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.85, delay: 0.4, ease: EASE_OUT_EXPO }}
              className="mt-9 sm:mt-12 max-w-2xl text-fg-secondary"
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
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.7, delay: 0.55, ease: EASE_OUT_EXPO }}
              className="mt-10 sm:mt-12 flex flex-wrap items-center gap-x-6 gap-y-5"
            >
              <span className="text-muted-foreground t-caption">
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
          </motion.figure>
        </div>
      </section>
    );
  }

  const lead = rows?.[0] ?? null;
  const rest = rows ? rows.slice(1, 4) : [];

  return (
    <section
      id="stories"
      ref={ref}
      className="relative bg-surface-1 overflow-hidden"
      style={{ paddingBlock: "clamp(6rem, 15vh, 12rem)" }}
      data-testid="stories-band"
    >
      {/* Loading — a single calm placeholder, no card deck. */}
      {!rows && (
        <div className="container-ih">
          <div className="h-[clamp(14rem,30vh,22rem)] max-w-5xl rounded-[20px] card-base skeleton-shimmer" />
        </div>
      )}

      {/* MONUMENTAL featured testimonial — one huge quote on acres of space,
          paired with full-bleed Gaza-space photography. Asymmetric, start-aligned. */}
      {lead && (
        <div className="container-ih relative">
          <motion.figure style={{ y }} className="will-change-transform">
            <div className="grid lg:grid-cols-12 gap-x-[clamp(2.5rem,6vw,6rem)] gap-y-12 items-end">
              <div className="lg:col-span-7">
                <motion.blockquote
                  initial={reduce ? false : { opacity: 0, y: 30 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={VIEWPORT}
                  transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
                  className="font-display text-foreground"
                  style={{
                    fontSize: "clamp(2.6rem, 6.4vw, 5.25rem)",
                    lineHeight: 1.04,
                    letterSpacing: "-0.04em",
                    fontWeight: 700,
                  }}
                >
                  {lead.quote}
                </motion.blockquote>

                <motion.figcaption
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={VIEWPORT}
                  transition={{ duration: 0.7, delay: 0.45, ease: EASE_OUT_EXPO }}
                  className="mt-10 sm:mt-12"
                >
                  <div className="font-bold text-foreground text-[clamp(1rem,1.6vw,1.2rem)]">
                    {lead.personName}
                  </div>
                  <div className="text-muted-foreground t-caption mt-1.5">
                    {[lead.role, lead.ventureName].filter(Boolean).join(" · ")}
                  </div>
                </motion.figcaption>
              </div>

              <motion.div
                initial={reduce ? false : { opacity: 0, scale: 0.98 }}
                whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
                viewport={VIEWPORT}
                transition={{ duration: 0.9, delay: 0.1, ease: EASE_OUT_EXPO }}
                className="lg:col-span-5 will-change-transform"
              >
                <div className="overflow-hidden rounded-[20px] ring-1 ring-white/10">
                  <img
                    src="/photos/IMG_8352.webp"
                    alt={t({ ar: "مساحة آيلاند هيفن في غزّة", en: "The Island Haven space in Gaza" })}
                    loading="lazy"
                    className="w-full aspect-[4/5] object-cover saturate-[1.03]"
                  />
                </div>
              </motion.div>
            </div>

            {/* Supporting voices — a quiet, hairline-ruled editorial list. NOT a
                uniform card grid: each is a calm line of space, separated by a rule. */}
            {rest.length > 0 && (
              <div className="mt-[clamp(4rem,9vh,7rem)] max-w-4xl">
                {rest.map((s, i) => (
                  <motion.figure
                    key={s.id}
                    initial={reduce ? false : { opacity: 0, y: 22 }}
                    whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                    viewport={VIEWPORT}
                    transition={{ duration: 0.7, delay: Math.min(i, 3) * 0.08, ease: EASE_OUT_EXPO }}
                    className="border-t border-border-strong py-[clamp(2rem,4vh,3.25rem)] first:border-t-0 first:pt-0"
                  >
                    <blockquote
                      className="font-display text-fg-secondary"
                      style={{
                        fontSize: "clamp(1.3rem, 2.6vw, 2rem)",
                        lineHeight: 1.32,
                        letterSpacing: "-0.02em",
                        fontWeight: 600,
                      }}
                    >
                      {s.quote}
                    </blockquote>
                    <figcaption className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-bold text-foreground text-[15px]">{s.personName}</span>
                      <span className="text-muted-foreground t-caption">
                        {[s.role, s.ventureName].filter(Boolean).join(" · ")}
                      </span>
                    </figcaption>
                  </motion.figure>
                ))}
              </div>
            )}
          </motion.figure>
        </div>
      )}
    </section>
  );
}
