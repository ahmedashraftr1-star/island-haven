import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { DAILY_TYPE_LABELS, DAILY_TYPE_LABELS_EN, formatDate, type DailyType } from "@/lib/labels";
import { useContentSection, imageUrl } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { CinematicMedia } from "@/components/landing/CinematicMedia";
import { Reveal } from "@/components/landing/Reveal";
import { EASE_OUT_EXPO } from "@/lib/motion";

const FALLBACK = {
  eyebrow: "دفتر آيلاند · Journal",
  title: "ما يحدث في المساحة هذا الأسبوع.",
  ctaAll: "كلّ الفعاليّات",
  ctaCard: "اقرأ المزيد",
  emptyText: "لا توجد فعاليّات معلَنة بعد — تابعنا قريبًا.",
};

const FALLBACK_EN = {
  eyebrow: "Island Journal · دفتر",
  title: "What's happening at the space this week.",
  ctaAll: "All events",
  ctaCard: "Read more",
  emptyText: "No upcoming events announced yet — stay tuned.",
};

interface Post {
  id: number;
  type: DailyType;
  title: string;
  body: string;
  coverUrl: string | null;
  publishedAt: string;
}

function trimExcerpt(s: string, n = 110): string {
  const t = (s ?? "").trim().replace(/\s+/g, " ");
  if (t.length <= n) return t;
  return t.slice(0, n).replace(/[،,.\s]+$/, "") + "…";
}

/**
 * NewsSlider — the incubator's Journal as an INTERACTIVE master-detail (in the
 * register of jonnyczar's projects list): one large lead FEATURE tile in a
 * `glass-panel-lg` shows the currently-SELECTED item large (ringed cover,
 * terracotta type tag + tabular mono date, a confident font-display headline, a
 * precise excerpt, and a distinct "read →" link that navigates to the event).
 * The right column is a tight, hairline-ruled list of SELECTOR rows inside a
 * `glass-panel` — every row impeccably aligned with COMPLETE details (tabular
 * mono DATE, terracotta TYPE tag, font-display TITLE, one-line excerpt, ringed
 * thumb). Clicking a row — or focusing + Enter/Space — SELECTS it: it animates
 * (crossfade + scale, framer-motion) into the feature tile and gets highlighted
 * with a terracotta marker. Selecting NEVER navigates; only the feature's read
 * link routes to `/events/${id}`. Default selection = the first item. Kept:
 * dark-glass system, hover affordances, all `/daily` data / fallback / empty /
 * loading, i18n, links + testids, lazy images + alt, focus-visible rings, and
 * full reduced-motion safety (instant swap, no scale).
 */
export function NewsSlider() {
  const { lang, t } = useLanguage();
  const reduce = useReducedMotion();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const cAr = useContentSection("newsSlider", FALLBACK);
  const c = lang === "en" ? { ...cAr, ...FALLBACK_EN } : cAr;
  const typeLabels = lang === "en" ? DAILY_TYPE_LABELS_EN : DAILY_TYPE_LABELS;

  useEffect(() => {
    let cancelled = false;
    api<{ posts: Post[] }>("/daily")
      .then((r) => {
        if (cancelled) return;
        const next = r.posts.slice(0, 7);
        setPosts(next);
        // Default selection = the first item.
        setSelectedId(next.length > 0 ? next[0].id : null);
      })
      .catch(() => !cancelled && setPosts([]));
    return () => {
      cancelled = true;
    };
  }, []);

  // The selected post drives the feature; fall back to the first item so the
  // feature is never blank if the selection ever drifts out of the list.
  const selected = useMemo<Post | null>(() => {
    if (!posts || posts.length === 0) return null;
    return posts.find((p) => p.id === selectedId) ?? posts[0];
  }, [posts, selectedId]);

  return (
    <CinematicMedia
      as="section"
      id="events-slider"
      src={imageUrl("/photos/IMG_8346.webp")}
      scrim="medium"
      sideScrim={false}
      className="relative overflow-hidden border-t border-white/[0.06]"
      aria-label={t({ ar: "دفتر آيلاند", en: "Island Journal" })}
    >
      <div aria-hidden className="absolute inset-0 glass-ambient pointer-events-none" />

      <div className="container-ih section-y relative">
        {/* Header — calm eyebrow, one monumental white line, roomy sub. */}
        <div className="mb-[clamp(2.5rem,5vw,4rem)] grid gap-8 lg:grid-cols-12 lg:items-end">
          <Reveal as="div" className="lg:col-span-8">
            <div className="mb-5 flex items-center gap-3">
              <span aria-hidden className="h-px w-9 bg-primary/70" />
              <span className="eyebrow">
                {c.eyebrow}
              </span>
            </div>
            <h2
              className="font-display text-white max-w-2xl"
              style={{
                fontSize: "clamp(2.4rem,5vw,4.5rem)",
                fontWeight: 900,
                lineHeight: 0.98,
                letterSpacing: "-0.04em",
              }}
            >
              {lang === "en" ? (
                <>What's happening at the space <span className="text-primary">this week.</span></>
              ) : (
                <>ما يحدث في المساحة <span className="text-primary">هذا الأسبوع.</span></>
              )}
            </h2>
            <p className="mt-6 max-w-xl text-[1.0625rem] leading-[1.7] text-white/70 lg:text-lg">
              {t({
                ar: "ورشٌ ولقاءات ونبض الحاضنة اليوميّ — تُسحب مباشرةً من قلب المساحة.",
                en: "Workshops, talks and the daily life of the incubator — pulled live from the space.",
              })}
            </p>
          </Reveal>

          <Reveal as="div" delay={0.08} className="hidden lg:col-span-4 lg:flex lg:justify-end">
            <Link
              href="/events"
              className="group inline-flex h-11 items-center gap-2 rounded-full px-5 text-[13px] font-semibold text-white ring-1 ring-inset ring-white/15 transition-all duration-200 hover:bg-white/[0.06] hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060608] motion-reduce:transition-none"
              data-testid="link-all-events"
            >
              {c.ctaAll}
              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 rtl:rotate-180 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" aria-hidden />
            </Link>
          </Reveal>
        </div>

        {posts === null ? (
          <div className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="glass-panel-lg overflow-hidden p-3">
                <div className="aspect-[16/10] w-full rounded-[24px] bg-white/[0.04] skeleton-shimmer" />
                <div className="px-3 pb-3 pt-6">
                  <div className="h-4 w-32 rounded bg-white/[0.05] skeleton-shimmer" />
                  <div className="mt-4 h-7 w-3/4 rounded-lg bg-white/[0.05] skeleton-shimmer" />
                  <div className="mt-3 h-4 w-full rounded bg-white/[0.04] skeleton-shimmer" />
                </div>
              </div>
            </div>
            <div className="lg:col-span-7">
              <div className="glass-panel divide-y divide-white/10 px-5 sm:px-7">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-5 py-6">
                    <div className="min-w-0 flex-1">
                      <div className="h-3.5 w-40 rounded bg-white/[0.05] skeleton-shimmer" />
                      <div className="mt-3 h-5 w-2/3 rounded bg-white/[0.05] skeleton-shimmer" />
                      <div className="mt-2.5 h-3.5 w-4/5 rounded bg-white/[0.04] skeleton-shimmer" />
                    </div>
                    <div className="h-16 w-20 shrink-0 rounded-xl bg-white/[0.04] skeleton-shimmer" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <Calendar className="mx-auto mb-3 h-7 w-7 text-white/40" aria-hidden />
            <p className="text-[1.0625rem] text-white/70">{c.emptyText}</p>
          </div>
        ) : (
          <div className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
            {/* FEATURE — the currently-SELECTED story, large, inside a
                glass-panel-lg. Selecting a row crossfades + scales a new item in
                (framer-motion, reduced-motion → instant). NOT a link: the read
                cue below is the only thing that navigates. */}
            {selected && (
              <Reveal as="div" className="lg:col-span-5">
                <div className="glass-panel-lg overflow-hidden p-3">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={selected.id}
                      initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.985 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={reduce ? { opacity: 1 } : { opacity: 0, scale: 1.008 }}
                      transition={reduce ? { duration: 0 } : { duration: 0.42, ease: EASE_OUT_EXPO }}
                    >
                      <div className="overflow-hidden rounded-[24px] ring-1 ring-white/10">
                        {selected.coverUrl ? (
                          <img
                            src={selected.coverUrl}
                            alt={selected.title}
                            loading="lazy"
                            decoding="async"
                            className="aspect-[16/10] w-full object-cover"
                          />
                        ) : (
                          <div
                            aria-hidden
                            className="flex aspect-[16/10] w-full items-center justify-center bg-primary/15"
                          >
                            <span className="font-display text-[clamp(3rem,8vw,6rem)] font-black leading-none text-primary/60 select-none">
                              {(selected.title.trim()[0] ?? typeLabels[selected.type][0] ?? "·").toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="px-3 pb-3 pt-6">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary rtl:tracking-normal">
                            {typeLabels[selected.type]}
                          </span>
                          <span aria-hidden className="h-3 w-px bg-white/15" />
                          <span className="font-mono text-[12px] tabular-nums text-white/55">
                            {formatDate(selected.publishedAt, lang)}
                          </span>
                        </div>

                        <h3
                          className="mt-3 font-display font-bold text-white/90"
                          style={{
                            fontSize: "clamp(1.6rem,3vw,2.4rem)",
                            lineHeight: 1.12,
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {selected.title}
                        </h3>

                        {selected.body && (
                          <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-white/65 lg:text-[1.0625rem]">
                            {trimExcerpt(selected.body, 150)}
                          </p>
                        )}

                        {/* Read cue — the ONLY navigation in the feature. */}
                        <Link
                          href={`/events/${selected.id}`}
                          data-testid={`event-read-${selected.id}`}
                          className="group mt-5 inline-flex items-center gap-1.5 rounded-full text-[14px] font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-4 focus-visible:ring-offset-[#060608]"
                        >
                          {c.ctaCard}
                          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-[400ms] ease-[cubic-bezier(.2,.7,.2,1)] rtl:rotate-180 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden />
                        </Link>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </Reveal>
            )}

            {/* SELECTORS — the professional editorial column: each row is a
                SELECTOR (button) that grows the item into the feature on click /
                Enter / Space / focus, NOT a navigation. One glass-panel, ruled by
                white/10 hairlines, COMPLETE precise details — tabular mono date ·
                terracotta type tag · font-display title · one-line excerpt ·
                ringed thumb · trailing arrow. The active row carries a terracotta
                marker + lifted background. */}
            <Reveal as="div" className="lg:col-span-7">
              <ol className="glass-panel divide-y divide-white/10 px-5 sm:px-7">
                {posts.map((p) => {
                  const active = selected?.id === p.id;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(p.id)}
                        onFocus={() => setSelectedId(p.id)}
                        aria-pressed={active ? "true" : "false"}
                        data-testid={`event-card-${p.id}`}
                        className={`group relative -mx-3 flex w-[calc(100%+1.5rem)] items-center gap-4 rounded-2xl px-3 py-[clamp(1.15rem,2.6vh,1.6rem)] text-start transition-[background-color,transform] duration-[400ms] ease-[cubic-bezier(.2,.7,.2,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060608] motion-reduce:transition-none sm:gap-6 ${
                          active ? "bg-white/[0.06]" : "hover:bg-white/[0.045]"
                        }`}
                      >
                        {/* Active marker — a terracotta bar on the inline-start edge. */}
                        <span
                          aria-hidden
                          className={`absolute inset-y-3 start-0 w-[3px] rounded-full bg-primary transition-opacity duration-[400ms] ease-[cubic-bezier(.2,.7,.2,1)] motion-reduce:transition-none ${
                            active ? "opacity-100" : "opacity-0"
                          }`}
                        />

                        {/* Meta + title + one-line excerpt. */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2.5">
                            <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary rtl:tracking-normal">
                              {typeLabels[p.type]}
                            </span>
                            <span aria-hidden className="h-3 w-px bg-white/15" />
                            <span className="font-mono text-[11px] tabular-nums text-white/50">
                              {formatDate(p.publishedAt, lang)}
                            </span>
                          </div>

                          <h3
                            className={`mt-2.5 font-display text-[1.0625rem] font-bold leading-[1.28] line-clamp-1 transition-colors duration-[400ms] ease-[cubic-bezier(.2,.7,.2,1)] motion-reduce:transition-none sm:text-[1.15rem] ${
                              active ? "text-primary" : "text-white/90 group-hover:text-primary"
                            }`}
                          >
                            {p.title}
                          </h3>

                          {p.body && (
                            <p className="mt-1.5 text-[13.5px] leading-[1.55] text-white/60 line-clamp-1">
                              {trimExcerpt(p.body, 96)}
                            </p>
                          )}
                        </div>

                        {/* Refined cover thumb — rounded, ringed in white/10. */}
                        <div
                          className={`h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-white/[0.04] ring-1 transition-[box-shadow] duration-[400ms] ease-[cubic-bezier(.2,.7,.2,1)] motion-reduce:transition-none sm:h-16 sm:w-20 ${
                            active ? "ring-primary/60" : "ring-white/10"
                          }`}
                        >
                          {p.coverUrl ? (
                            <img
                              src={p.coverUrl}
                              alt={p.title}
                              loading="lazy"
                              decoding="async"
                              className={`h-full w-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.06] motion-reduce:transition-none ${
                                active ? "scale-[1.06]" : ""
                              }`}
                            />
                          ) : (
                            <div aria-hidden className="flex h-full w-full items-center justify-center bg-primary/15">
                              <span className="font-display text-lg font-black text-primary/60 select-none">
                                {(p.title.trim()[0] ?? typeLabels[p.type][0] ?? "·").toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Trailing arrow — slides on hover / when active. */}
                        <ArrowLeft
                          className={`hidden h-4 w-4 shrink-0 transition-[transform,color] duration-[400ms] ease-[cubic-bezier(.2,.7,.2,1)] rtl:rotate-180 motion-reduce:transition-none sm:block ${
                            active
                              ? "text-primary -translate-x-1 rtl:translate-x-1"
                              : "text-white/35 group-hover:text-primary group-hover:-translate-x-1 rtl:group-hover:translate-x-1"
                          }`}
                          aria-hidden
                        />
                      </button>
                    </li>
                  );
                })}
              </ol>
            </Reveal>
          </div>
        )}

        {/* Mobile all-events CTA — the header CTA is desktop-only. */}
        <div className="mt-[clamp(2.5rem,5vh,3.5rem)] flex justify-center lg:hidden">
          <Link
            href="/events"
            className="group inline-flex h-11 items-center gap-2 rounded-full px-5 text-[13px] font-semibold text-white ring-1 ring-inset ring-white/15 transition-all duration-200 hover:bg-white/[0.06] hover:ring-primary/40 motion-reduce:transition-none"
          >
            {c.ctaAll}
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 rtl:rotate-180 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      </div>
    </CinematicMedia>
  );
}
