import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { DAILY_TYPE_LABELS, formatArabicDate, type DailyType } from "@/lib/labels";
import { useContentSection } from "@/hooks/use-content";

const FALLBACK = {
  eyebrow: "فعاليّات آيلاند · Events",
  title: "ما يحدث في المساحة هذا الأسبوع.",
  ctaAll: "كلّ الفعاليّات",
  ctaCard: "اقرأ المزيد",
  emptyText: "لا توجد فعاليّات معلَنة بعد — تابعنا قريبًا.",
  prevAria: "السّابق",
  nextAria: "التّالي",
};

interface Post {
  id: number;
  type: DailyType;
  title: string;
  body: string;
  coverUrl: string | null;
  publishedAt: string;
}

const TYPE_ACCENT: Record<DailyType, { from: string; to: string; mark: string }> = {
  tip: { from: "from-amber-100", to: "to-rose-100", mark: "✦" },
  news: { from: "from-sky-100", to: "to-indigo-100", mark: "◇" },
  quote: { from: "from-violet-100", to: "to-fuchsia-100", mark: "❝" },
  story: { from: "from-emerald-100", to: "to-cyan-100", mark: "✿" },
};

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
  const [posts, setPosts] = useState<Post[] | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const c = useContentSection("newsSlider", FALLBACK);

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
      className="relative bg-background py-20 lg:py-28 border-t border-border"
    >
      <div className="container mx-auto px-6 lg:px-10 max-w-[1500px]">
        <div className="flex items-end justify-between gap-6 mb-8 lg:mb-10">
          <div>
            <div className="text-[11px] tracking-[0.18em] uppercase text-primary font-bold mb-3">
              {c.eyebrow}
            </div>
            <h2
              className="font-bold text-foreground tracking-tight leading-[1.1]"
              style={{ fontSize: "clamp(1.85rem, 4.2vw, 3rem)" }}
            >
              {c.title}
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              onClick={() => scrollBy(1)}
              aria-label={c.prevAria}
              className="w-11 h-11 rounded-full border border-border bg-white text-foreground hover:bg-foreground/[0.04] transition-colors flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollBy(-1)}
              aria-label={c.nextAria}
              className="w-11 h-11 rounded-full border border-border bg-white text-foreground hover:bg-foreground/[0.04] transition-colors flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <Link
              href="/events"
              className="ms-2 inline-flex items-center gap-2 h-11 px-5 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-colors"
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
                className="shrink-0 w-[320px] h-[380px] rounded-3xl bg-foreground/[0.04] animate-pulse"
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-3xl bg-foreground/[0.03] border border-dashed border-border p-12 text-center">
            <Calendar className="w-7 h-7 mx-auto mb-3 text-foreground/30" />
            <p className="text-foreground/55 text-[14px]">
              {c.emptyText}
            </p>
          </div>
        ) : (
          <div
            ref={trackRef}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6 lg:-mx-10 lg:px-10 scroll-smooth scrollbar-thin"
            style={{ scrollbarColor: "transparent transparent" }}
          >
            {posts.map((p, i) => (
              <motion.div
                key={p.id}
                data-card
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: Math.min(i, 4) * 0.06 }}
                className="snap-start shrink-0 w-[300px] sm:w-[340px]"
              >
                <Link
                  href={`/events/${p.id}`}
                  className="group block rounded-3xl bg-white border border-border overflow-hidden shadow-soft hover:shadow-soft-hover hover:-translate-y-1 transition-all duration-500"
                  data-testid={`event-card-${p.id}`}
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    {p.coverUrl ? (
                      <>
                        <img
                          src={p.coverUrl}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </>
                    ) : (
                      <div
                        className={`w-full h-full bg-gradient-to-br ${TYPE_ACCENT[p.type].from} ${TYPE_ACCENT[p.type].to} relative overflow-hidden`}
                      >
                        {/* Decorative editorial pattern — sparse marks, large date numerals */}
                        <div className="absolute inset-0 opacity-[0.07]" aria-hidden>
                          <div
                            className="absolute -top-6 -right-6 text-[160px] leading-none font-bold text-foreground select-none"
                            style={{ letterSpacing: "-0.04em" }}
                          >
                            {new Date(p.publishedAt).toLocaleDateString("ar-EG", { day: "2-digit" })}
                          </div>
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center">
                          <div
                            className="text-[40px] leading-none mb-3 text-foreground/55 group-hover:text-primary group-hover:scale-110 transition-all duration-500"
                            aria-hidden
                          >
                            {TYPE_ACCENT[p.type].mark}
                          </div>
                          {p.body && (
                            <p className="text-[13px] leading-relaxed text-foreground/75 line-clamp-3 max-w-[26ch]">
                              {trimExcerpt(p.body, 130)}
                            </p>
                          )}
                        </div>
                        {/* subtle decorative arabesque dots in corners */}
                        <div className="absolute bottom-3 left-3 flex gap-1 opacity-30" aria-hidden>
                          <span className="w-1 h-1 rounded-full bg-foreground" />
                          <span className="w-1 h-1 rounded-full bg-foreground" />
                          <span className="w-1 h-1 rounded-full bg-foreground" />
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-[10.5px] tracking-[0.16em] uppercase text-primary font-bold">
                      {DAILY_TYPE_LABELS[p.type]}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="text-[11px] text-foreground/55 mb-2 font-medium tabular-nums">
                      {formatArabicDate(p.publishedAt)}
                    </div>
                    <h3 className="text-foreground font-bold text-[16px] leading-snug line-clamp-2 group-hover:text-primary transition-colors min-h-[2.6em]">
                      {p.title}
                    </h3>
                    {p.body && (
                      <p className="mt-2 text-[12.5px] text-foreground/60 leading-relaxed line-clamp-2 min-h-[2.6em]">
                        {trimExcerpt(p.body, 90)}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-1.5 text-[12.5px] font-semibold text-primary">
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
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold"
          >
            {c.ctaAll}
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </section>
  );
}
