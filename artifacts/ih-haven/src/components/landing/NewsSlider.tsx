import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { DAILY_TYPE_LABELS, DAILY_TYPE_LABELS_EN, formatDate, type DailyType } from "@/lib/labels";
import { useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";

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
 * NewsSlider — the incubator's Journal, rebuilt as a PREMIUM LIGHT newsroom on
 * warm paper (theme-light flips the tokens). NOT a carousel of identical dark
 * cards: one large FEATURE story (a cover framed with soft shadow on paper, its
 * headline set in dark ink, with a terracotta type tag + date), and the rest as
 * a clean editorial LIST — each row a small date, a terracotta type tag
 * (خبر/قصّة/نصيحة), a title, and a thin cover thumb, ruled by hairline dividers.
 * Space + type carry it. All data / fallback / i18n / routes / testids kept.
 */
export function NewsSlider() {
  const { lang, t } = useLanguage();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const cAr = useContentSection("newsSlider", FALLBACK);
  const c = lang === "en" ? { ...cAr, ...FALLBACK_EN } : cAr;
  const typeLabels = lang === "en" ? DAILY_TYPE_LABELS_EN : DAILY_TYPE_LABELS;

  useEffect(() => {
    let cancelled = false;
    api<{ posts: Post[] }>("/daily")
      .then((r) => !cancelled && setPosts(r.posts.slice(0, 7)))
      .catch(() => !cancelled && setPosts([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const feature = posts && posts.length > 0 ? posts[0] : null;
  const list = posts ? posts.slice(1) : [];

  return (
    <section
      id="events-slider"
      className="theme-light relative bg-background text-foreground border-y border-border overflow-hidden section-y"
    >
      <div className="container-ih relative">
        {/* Header — calm eyebrow, one monumental line in dark ink, roomy sub. */}
        <div className="mb-[clamp(2.5rem,5vw,4rem)] grid gap-8 lg:grid-cols-12 lg:items-end">
          <Reveal as="div" className="lg:col-span-8">
            <div className="mb-5 flex items-center gap-3">
              <span aria-hidden className="h-px w-9 bg-primary/70" />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary rtl:tracking-[0.12em]">
                {c.eyebrow}
              </span>
            </div>
            <h2
              className="font-display text-foreground max-w-2xl"
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
            <p className="mt-6 max-w-xl text-[1.0625rem] leading-[1.7] text-fg-secondary lg:text-lg">
              {t({
                ar: "ورشٌ ولقاءات ونبض الحاضنة اليوميّ — تُسحب مباشرةً من قلب المساحة.",
                en: "Workshops, talks and the daily life of the incubator — pulled live from the space.",
              })}
            </p>
          </Reveal>

          <Reveal as="div" delay={0.08} className="hidden lg:col-span-4 lg:flex lg:justify-end">
            <Link
              href="/events"
              className="group inline-flex h-11 items-center gap-2 rounded-full px-5 text-[13px] font-semibold text-foreground ring-1 ring-inset ring-border-strong transition-all duration-200 hover:bg-surface-2 hover:ring-primary/40 motion-reduce:transition-none"
              data-testid="link-all-events"
            >
              {c.ctaAll}
              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 rtl:rotate-180 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" aria-hidden />
            </Link>
          </Reveal>
        </div>

        {posts === null ? (
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="aspect-[16/10] rounded-[24px] bg-surface-2 border border-border skeleton-shimmer" />
              <div className="mt-6 h-8 w-3/4 rounded-lg bg-surface-2 skeleton-shimmer" />
            </div>
            <div className="lg:col-span-5 space-y-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-surface-2 border border-border skeleton-shimmer" />
              ))}
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-border-strong bg-surface-2 p-12 text-center">
            <Calendar className="mx-auto mb-3 h-7 w-7 text-fg-faint" aria-hidden />
            <p className="text-[1.0625rem] text-fg-secondary">{c.emptyText}</p>
          </div>
        ) : (
          <div className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
            {/* FEATURE — the lead story, a cover framed with soft shadow on paper,
                headline in dark ink + a terracotta type tag and date. */}
            {feature && (
              <Reveal as="div" className="lg:col-span-7">
                <Link
                  href={`/events/${feature.id}`}
                  data-testid={`event-card-${feature.id}`}
                  className="group block rounded-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                >
                  <div className="overflow-hidden rounded-[24px] border border-border bg-surface-2 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_24px_56px_-20px_rgba(16,24,40,0.18)]">
                    {feature.coverUrl ? (
                      <img
                        src={feature.coverUrl}
                        alt={feature.title}
                        loading="lazy"
                        decoding="async"
                        className="aspect-[16/10] w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] motion-reduce:transition-none"
                      />
                    ) : (
                      <div
                        aria-hidden
                        className="flex aspect-[16/10] w-full items-center justify-center bg-primary-soft"
                      >
                        <span className="font-display text-[clamp(3rem,8vw,6rem)] font-black leading-none text-primary/35 select-none">
                          {(feature.title.trim()[0] ?? typeLabels[feature.type][0] ?? "·").toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <span className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary rtl:tracking-normal">
                      {typeLabels[feature.type]}
                    </span>
                    <span className="font-mono text-[12px] tabular-nums text-fg-faint">
                      {formatDate(feature.publishedAt, lang)}
                    </span>
                  </div>

                  <h3
                    className="mt-3 font-display font-bold text-foreground transition-colors duration-300 group-hover:text-primary"
                    style={{
                      fontSize: "clamp(1.6rem,3vw,2.4rem)",
                      lineHeight: 1.12,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {feature.title}
                  </h3>

                  {feature.body && (
                    <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-fg-secondary lg:text-[1.0625rem]">
                      {trimExcerpt(feature.body, 150)}
                    </p>
                  )}

                  <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary">
                    {c.ctaCard}
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 rtl:rotate-180 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              </Reveal>
            )}

            {/* LIST — a clean editorial column: date + terracotta type tag + title
                + a thin cover thumb, ruled by hairline dividers. NOT a card deck. */}
            {list.length > 0 && (
              <div className="lg:col-span-5">
                <div className="border-t border-border">
                  {list.map((p, i) => (
                    <Reveal key={p.id} as="div" delay={Math.min(i, 4) * 0.06}>
                      <Link
                        href={`/events/${p.id}`}
                        data-testid={`event-card-${p.id}`}
                        className="group grid grid-cols-[1fr_auto] items-start gap-x-5 gap-y-2 border-b border-border py-[clamp(1.25rem,3vh,1.75rem)] transition-colors duration-300 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
                      >
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2.5">
                            <span className="inline-flex items-center rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary rtl:tracking-normal">
                              {typeLabels[p.type]}
                            </span>
                            <span className="font-mono text-[11px] tabular-nums text-fg-faint">
                              {formatDate(p.publishedAt, lang)}
                            </span>
                          </div>
                          <h3 className="font-display text-[1.0625rem] font-bold leading-[1.3] text-foreground line-clamp-2 transition-colors duration-300 group-hover:text-primary">
                            {p.title}
                          </h3>
                        </div>

                        {/* Thin cover thumb — soft-framed on paper, never a void. */}
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-2">
                          {p.coverUrl ? (
                            <img
                              src={p.coverUrl}
                              alt={p.title}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
                            />
                          ) : (
                            <div aria-hidden className="flex h-full w-full items-center justify-center bg-primary-soft">
                              <span className="font-display text-lg font-black text-primary/40 select-none">
                                {(p.title.trim()[0] ?? typeLabels[p.type][0] ?? "·").toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile all-events CTA — the header CTA is desktop-only. */}
        <div className="mt-[clamp(2.5rem,5vh,3.5rem)] flex justify-center lg:hidden">
          <Link
            href="/events"
            className="group inline-flex h-11 items-center gap-2 rounded-full px-5 text-[13px] font-semibold text-foreground ring-1 ring-inset ring-border-strong transition-all duration-200 hover:bg-surface-2 hover:ring-primary/40 motion-reduce:transition-none"
          >
            {c.ctaAll}
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 rtl:rotate-180 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
