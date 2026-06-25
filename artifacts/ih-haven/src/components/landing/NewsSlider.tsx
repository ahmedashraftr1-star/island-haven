import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { DAILY_TYPE_LABELS, DAILY_TYPE_LABELS_EN, formatDate, type DailyType } from "@/lib/labels";
import { useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO, VIEWPORT } from "@/lib/motion";

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
 * NewsSlider — horizontal carousel of upcoming/recent events.
 * Each card shows a cover image and a 2-line clickable title that
 * routes to the event detail page.
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
      className="relative bg-surface-1 section-y"
    >
      <div className="container-ih">
        <div className="flex items-end justify-between gap-6 mb-[clamp(2rem,4vw,3.5rem)]">
          <div>
            <div className="eyebrow mb-4">
              {c.eyebrow}
            </div>
            <h2 className="t-h2 !text-foreground max-w-2xl">
              {c.title}
            </h2>
          </div>
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
                className="shrink-0 w-[320px] h-[380px] rounded-[20px] card-base skeleton-shimmer"
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
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6 lg:-mx-12 lg:px-12 scroll-smooth scrollbar-thin"
            style={{ scrollbarColor: "transparent transparent" }}
          >
            {posts.map((p, i) => (
              <motion.div
                key={p.id}
                data-card
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT}
                transition={{ duration: 0.55, delay: Math.min(i, 4) * 0.06, ease: EASE_OUT_EXPO }}
                className="snap-start shrink-0 w-[300px] sm:w-[340px]"
              >
                <Link
                  href={`/events/${p.id}`}
                  className="group block rounded-[20px] card-base card-hover overflow-hidden"
                  data-testid={`event-card-${p.id}`}
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    {p.coverUrl ? (
                      <>
                        <img
                          src={p.coverUrl}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-400"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </>
                    ) : (
                      // Editorial typographic placeholder — large index day numeral
                      // on a matte surface, a sand hairline and the excerpt. No
                      // decorative gradient blobs, no glyph marks, no dots.
                      <div className="w-full h-full bg-surface-3 relative overflow-hidden flex flex-col justify-end p-5">
                        <div
                          dir="ltr"
                          className="absolute top-3 end-4 font-display font-extrabold tabular-nums text-sand/20 leading-none select-none pointer-events-none"
                          style={{ fontSize: "clamp(4.5rem, 9vw, 6.5rem)", letterSpacing: "-0.04em" }}
                          aria-hidden
                        >
                          {new Date(p.publishedAt).toLocaleDateString("en-US", { day: "2-digit" })}
                        </div>
                        <span aria-hidden className="hairline-sand block w-12 mb-3" />
                        {p.body && (
                          <p className="relative text-[13px] leading-relaxed text-fg-secondary line-clamp-3 max-w-[28ch]">
                            {trimExcerpt(p.body, 120)}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full chip-sand eyebrow !text-sand-bright">
                      {typeLabels[p.type]}
                    </div>
                  </div>
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
                    <div className="mt-4 flex items-center gap-1.5 t-caption font-semibold text-primary">
                      {c.ctaCard}
                      <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180 transition-transform group-hover:-translate-x-1" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
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
