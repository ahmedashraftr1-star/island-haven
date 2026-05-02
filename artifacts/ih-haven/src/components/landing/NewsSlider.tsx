import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { DAILY_TYPE_LABELS, formatArabicDate, type DailyType } from "@/lib/labels";

interface Post {
  id: number;
  type: DailyType;
  title: string;
  body: string;
  coverUrl: string | null;
  publishedAt: string;
}

/**
 * NewsSlider — horizontal carousel of upcoming/recent events.
 * Each card shows a cover image and a 2-line clickable title that
 * routes to the event detail page.
 */
export function NewsSlider() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

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
              فعاليّات آيلاند · Events
            </div>
            <h2
              className="font-bold text-foreground tracking-tight leading-[1.1]"
              style={{ fontSize: "clamp(1.85rem, 4.2vw, 3rem)" }}
            >
              ما يحدث في المساحة هذا الأسبوع.
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              onClick={() => scrollBy(1)}
              aria-label="السّابق"
              className="w-11 h-11 rounded-full border border-border bg-white text-foreground hover:bg-foreground/[0.04] transition-colors flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollBy(-1)}
              aria-label="التّالي"
              className="w-11 h-11 rounded-full border border-border bg-white text-foreground hover:bg-foreground/[0.04] transition-colors flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <Link
              href="/events"
              className="ms-2 inline-flex items-center gap-2 h-11 px-5 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-colors"
              data-testid="link-all-events"
            >
              كلّ الفعاليّات
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
              لا توجد فعاليّات معلَنة بعد — تابعنا قريبًا.
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
                  <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/15 to-foreground/[0.04] relative">
                    {p.coverUrl ? (
                      <img
                        src={p.coverUrl}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="w-10 h-10 text-primary/40" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-[10.5px] tracking-[0.16em] uppercase text-primary font-bold">
                      {DAILY_TYPE_LABELS[p.type]}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="text-[11px] text-foreground/55 mb-2 font-medium">
                      {formatArabicDate(p.publishedAt)}
                    </div>
                    <h3
                      className="text-foreground font-bold text-[16px] leading-snug line-clamp-2 group-hover:text-primary transition-colors min-h-[2.6em]"
                    >
                      {p.title}
                    </h3>
                    <div className="mt-4 flex items-center gap-1.5 text-[12.5px] font-semibold text-primary">
                      اقرأ المزيد
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
            كلّ الفعاليّات
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </section>
  );
}
