import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { DAILY_TYPE_LABELS, DAILY_TYPE_LABELS_EN, formatDate, type DailyType } from "@/lib/labels";
import { useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";

const FALLBACK = {
  eyebrow: "فعاليّات آيلاند · Events",
  title: "ما يحدث في المساحة هذا الأسبوع.",
  ctaAll: "كلّ الفعاليّات",
  ctaCard: "اقرأ المزيد",
  emptyText: "لا توجد فعاليّات معلَنة بعد — تابعنا قريبًا.",
  prevAria: "السّابق",
  nextAria: "التّالي",
};

const FALLBACK_EN = {
  eyebrow: "Island Events · فعاليّات",
  title: "What's happening at the space this week.",
  ctaAll: "All events",
  ctaCard: "Read more",
  emptyText: "No upcoming events announced yet — stay tuned.",
  prevAria: "Previous",
  nextAria: "Next",
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
 * NewsSlider — the incubator's pulse, told as a horizontal editorial carousel on
 * the homepage's DARK cinematic canvas (#060608), directly below the "من قلب غزّة"
 * band. Apple-caliber dark: an oversized solid display headline with a single
 * crimson accent word, and one photo-forward glass card spec per event — a real
 * cover with a gentle hover zoom, or a branded crimson medallion block when there
 * is none (never a faint void). Premium roomy cards on white-based glass surfaces,
 * circular glass nav, gold + crimson accents. No serif, no scheme-flip.
 */
export function NewsSlider() {
  const { lang } = useLanguage();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cAr = useContentSection("newsSlider", FALLBACK);
  const c = lang === "en" ? { ...cAr, ...FALLBACK_EN } : cAr;
  const typeLabels = lang === "en" ? DAILY_TYPE_LABELS_EN : DAILY_TYPE_LABELS;

  useEffect(() => {
    api<{ posts: Post[] }>("/daily")
      .then((r) => setPosts(r.posts.slice(0, 10)))
      .catch(() => setPosts([]));
  }, []);

  function scrollBy(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const dx = (card?.offsetWidth ?? 320) + 20;
    // RTL: positive dx scrolls visually to the left (older content).
    // We invert for RTL so chevron-left (◀) advances chronologically.
    el.scrollBy({ left: dir * dx, behavior: "smooth" });
  }

  return (
    <section
      id="events-slider"
      className="relative bg-[#060608] text-white section-y overflow-hidden border-t border-white/[0.06]"
    >
      {/* Crimson aura glow at the top — a lit-canvas cue, kept subtle on dark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60%]"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, hsl(var(--primary) / 0.16) 0%, transparent 62%)",
        }}
      />

      <div className="container-ih relative">
        {/* Header — start-aligned, oversized solid display, matching the dark band */}
        <div className="flex items-end justify-between gap-6 mb-[clamp(2.5rem,5vw,4rem)]">
          <Reveal as="div">
            <div className="flex items-center gap-3 mb-5">
              <span aria-hidden className="h-px w-9 bg-primary/70" />
              <span className="text-[11px] tracking-[0.2em] uppercase text-white/70 font-semibold rtl:tracking-normal">
                {c.eyebrow}
              </span>
            </div>
            <h2
              className="font-display text-white max-w-2xl"
              style={{
                fontSize: "clamp(2.4rem,5vw,4.5rem)",
                fontWeight: 900,
                lineHeight: 0.98,
                letterSpacing: "-0.05em",
              }}
            >
              {lang === "en" ? (
                <>What's happening at the space <span className="text-primary">this week.</span></>
              ) : (
                <>ما يحدث في المساحة <span className="text-primary">هذا الأسبوع.</span></>
              )}
            </h2>
            <p className="mt-6 max-w-xl text-[1.0625rem] lg:text-lg text-white/60 leading-[1.7]">
              {lang === "en"
                ? "Workshops, talks and the daily life of the incubator — pulled live from the space."
                : "ورشٌ ولقاءات ونبض الحاضنة اليوميّ — تُسحب مباشرةً من قلب المساحة."}
            </p>
          </Reveal>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label={c.prevAria}
              className="w-11 h-11 rounded-full border border-white/15 bg-white/[0.08] text-white/80 hover:bg-white/15 hover:text-white transition-colors flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label={c.nextAria}
              className="w-11 h-11 rounded-full border border-white/15 bg-white/[0.08] text-white/80 hover:bg-white/15 hover:text-white transition-colors flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <Link
              href="/events"
              className="ms-2 inline-flex items-center gap-2 h-11 px-5 rounded-full cta-fill text-[13px] font-semibold transition-colors"
              data-testid="link-all-events"
            >
              {c.ctaAll}
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>

        {posts === null ? (
          <div className="flex gap-5 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="shrink-0 w-[300px] sm:w-[340px] h-[380px] rounded-[20px] border border-white/12 bg-white/[0.04] skeleton-shimmer"
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-white/15 bg-white/[0.03] p-12 text-center">
            <Calendar className="w-7 h-7 mx-auto mb-3 text-white/40" />
            <p className="text-white/60 text-[1.0625rem]">
              {c.emptyText}
            </p>
          </div>
        ) : (
          <div className="relative -mx-6 lg:-mx-12">
          <div
            ref={trackRef}
            role="region"
            aria-label={lang === "en" ? "Events carousel" : "شريط الفعاليّات"}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                e.preventDefault();
                scrollBy(1);
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                scrollBy(-1);
              }
            }}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 px-6 lg:px-12 scroll-smooth scrollbar-thin rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            style={{ scrollbarColor: "transparent transparent" }}
          >
            {posts.map((p, i) => {
              // Branded matte fallback for cover-less posts — a crimson medallion
              // initial on a radial wash, never a faint typographic placeholder.
              const initial = (p.title.trim()[0] ?? typeLabels[p.type][0] ?? "·").toUpperCase();
              return (
                <Reveal
                  key={p.id}
                  as="div"
                  delay={Math.min(i, 4) * 0.06}
                  className="snap-start shrink-0 w-[300px] sm:w-[340px]"
                >
                  <Link
                    href={`/events/${p.id}`}
                    data-card
                    className="group block h-full overflow-hidden rounded-[20px] border border-white/12 bg-white/[0.04] transition-[transform,border-color,background-color,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06] hover:shadow-[0_28px_64px_-24px_rgba(0,0,0,0.7)]"
                    data-testid={`event-card-${p.id}`}
                  >
                    {/* Cover — real photo with hover zoom, or a branded crimson medallion */}
                    <div
                      className="aspect-[4/3] overflow-hidden relative flex items-center justify-center rounded-t-[20px]"
                      style={
                        p.coverUrl
                          ? { background: "rgba(255,255,255,0.04)" }
                          : { background: "radial-gradient(130% 120% at 50% 0%, hsl(var(--primary) / 0.32) 0%, rgba(6,6,8,0.9) 72%)" }
                      }
                    >
                      {/* Imageless cover — a subtle gold dot-grid over the crimson
                          wash so the card reads as editorial, never an empty void. */}
                      {!p.coverUrl && (
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-0 opacity-60"
                          style={{
                            backgroundImage:
                              "radial-gradient(hsl(var(--sand) / 0.22) 1px, transparent 1.5px)",
                            backgroundSize: "14px 14px",
                            WebkitMaskImage:
                              "radial-gradient(125% 100% at 50% 0%, #000 28%, transparent 76%)",
                            maskImage:
                              "radial-gradient(125% 100% at 50% 0%, #000 28%, transparent 76%)",
                          }}
                        />
                      )}
                      {p.coverUrl ? (
                        <img
                          src={p.coverUrl}
                          alt={p.title}
                          className="w-full h-full object-cover saturate-[1.06] contrast-[1.03] transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          aria-hidden
                          className="flex h-[84px] w-[84px] items-center justify-center rounded-full text-white font-display font-black text-[30px] ring-2 ring-white/15 shadow-soft select-none transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
                          style={{ background: "linear-gradient(140deg, hsl(var(--primary)) 0%, hsl(var(--primary-pressed)) 100%)" }}
                        >
                          {initial}
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                      <div className="absolute top-3 end-3 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-[10px] tracking-[0.14em] uppercase font-semibold text-sand-bright rtl:tracking-normal">
                        {typeLabels[p.type]}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-5">
                      <div className="text-[12px] text-white/45 mb-2 font-mono tnum">
                        {formatDate(p.publishedAt, lang)}
                      </div>
                      <h3 className="font-display font-bold text-white text-[1.0625rem] leading-[1.3] line-clamp-2 group-hover:text-sand-bright transition-colors min-h-[2.6em]">
                        {p.title}
                      </h3>
                      {p.body && (
                        <p className="mt-2 text-[13px] text-white/55 leading-[1.6] line-clamp-2 min-h-[2.6em]">
                          {trimExcerpt(p.body, 90)}
                        </p>
                      )}
                      <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary">
                        {c.ctaCard}
                        <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
            {/* Edge fades — signal that the track scrolls; physical left/right so
                they read correctly in both RTL and LTR. */}
            <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-14 bg-gradient-to-r from-[#060608] to-transparent" />
            <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-14 bg-gradient-to-l from-[#060608] to-transparent" />
          </div>
        )}

        <div className="md:hidden mt-6 flex justify-center">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full cta-fill text-[13px] font-semibold"
          >
            {c.ctaAll}
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </section>
  );
}
