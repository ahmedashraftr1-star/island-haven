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
 * NewsSlider — the incubator's pulse, told as a horizontal editorial carousel
 * sitting directly below the "من قلب غزّة" cinematic band. ONE photo-forward card
 * spec for every event (real cover with a hover zoom, or a branded crimson
 * medallion block when there is none — never a faint typographic placeholder), on
 * the canonical .card-base + .card-hover surface. Header matches the top sections:
 * crimson eyebrow, oversized solid display headline with a single accent word, a
 * t-body sub. No gradient text, no glass, no scheme-flip cards.
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
      className="relative bg-surface-1 section-y overflow-hidden"
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-[55%] brand-aura opacity-50" />

      <div className="container-ih relative">
        {/* Header — start-aligned, oversized solid display, matching the top sections */}
        <div className="flex items-end justify-between gap-6 mb-[clamp(2.5rem,5vw,4rem)]">
          <Reveal as="div">
            <div className="flex items-center gap-3 mb-5">
              <span aria-hidden className="h-px w-9 bg-primary/50" />
              <span className="eyebrow">{c.eyebrow}</span>
            </div>
            <h2
              className="font-display font-extrabold text-foreground max-w-2xl"
              style={{ fontSize: "clamp(2rem, 4.4vw, 3.6rem)", lineHeight: 1.04, letterSpacing: "-0.028em" }}
            >
              {lang === "en" ? (
                <>What's happening at the space <span className="text-primary">this week.</span></>
              ) : (
                <>ما يحدث في المساحة <span className="text-primary">هذا الأسبوع.</span></>
              )}
            </h2>
            <p className="t-body mt-5 max-w-xl">
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
              className="w-11 h-11 rounded-full border border-border-strong bg-surface-2 text-foreground hover:bg-primary/10 hover:border-primary/35 hover:text-primary transition-colors flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label={c.nextAria}
              className="w-11 h-11 rounded-full border border-border-strong bg-surface-2 text-foreground hover:bg-primary/10 hover:border-primary/35 hover:text-primary transition-colors flex items-center justify-center"
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
                className="shrink-0 w-[300px] sm:w-[340px] h-[380px] rounded-[20px] card-base skeleton-shimmer"
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-[20px] surface-1 border border-dashed border-border-strong p-12 text-center">
            <Calendar className="w-7 h-7 mx-auto mb-3 text-muted-foreground" />
            <p className="text-fg-secondary t-body">
              {c.emptyText}
            </p>
          </div>
        ) : (
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
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6 lg:-mx-12 lg:px-12 scroll-smooth scrollbar-thin rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
                    className="group block h-full overflow-hidden card-base card-hover"
                    data-testid={`event-card-${p.id}`}
                  >
                    {/* Cover — real photo with hover zoom, or a branded crimson medallion */}
                    <div
                      className="aspect-[4/3] overflow-hidden relative flex items-center justify-center"
                      style={
                        p.coverUrl
                          ? { background: "hsl(var(--surface-3))" }
                          : { background: "radial-gradient(130% 120% at 50% 0%, hsl(var(--primary) / 0.20) 0%, hsl(var(--surface-3)) 70%)" }
                      }
                    >
                      {p.coverUrl ? (
                        <img
                          src={p.coverUrl}
                          alt={p.title}
                          className="w-full h-full object-cover saturate-[1.03] transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
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
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />
                      <div className="absolute top-3 end-3 px-2.5 py-1 rounded-full chip-sand eyebrow !text-sand-bright">
                        {typeLabels[p.type]}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-5">
                      <div className="t-caption !text-muted-foreground mb-2 font-mono tnum">
                        {formatDate(p.publishedAt, lang)}
                      </div>
                      <h3 className="t-h3 !text-foreground line-clamp-2 group-hover:text-primary transition-colors min-h-[2.6em]">
                        {p.title}
                      </h3>
                      {p.body && (
                        <p className="mt-2 t-caption !text-muted-foreground line-clamp-2 min-h-[2.6em]">
                          {trimExcerpt(p.body, 90)}
                        </p>
                      )}
                      <span className="mt-4 inline-flex items-center gap-1.5 t-caption font-semibold text-primary">
                        {c.ctaCard}
                        <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
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
