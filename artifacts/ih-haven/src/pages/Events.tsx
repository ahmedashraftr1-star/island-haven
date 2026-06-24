/**
 * Events page — public-facing alias of the Daily content feed,
 * rebranded as "فعاليّات آيلاند". Uses the same data + components as
 * the daily endpoint to avoid duplicating storage.
 */
import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { usePageMeta } from "@/hooks/use-meta";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar } from "lucide-react";
import {
  PageShell,
  GlassCard,
  BackLink,
  EmptyState,
} from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import {
  DAILY_TYPE_LABELS,
  DAILY_TYPE_LABELS_EN,
  formatDate,
  type DailyType,
} from "@/lib/labels";
import { useContentSection } from "@/hooks/use-content";

const FALLBACK = {
  eyebrow: "Events · ما يحدث",
  title: "فعاليّات آيلاند",
  subtitle:
    "جدولُ فعاليّاتنا، أخبارنا، ونصائحنا الأسبوعيّة — كلّ ما يحدث في المساحة في مكانٍ واحد.",
  filterAll: "الكلّ",
  filterNews: "أخبار",
  filterTip: "نصائح",
  filterStory: "قصص",
  filterQuote: "اقتباسات",
  emptyTitle: "لا توجد فعاليّات بعد",
  emptyHint: "ستظهر فعاليّاتنا القادمة هنا — تابعنا قريبًا.",
  detailsLabel: "التفاصيل",
};

// English equivalents of the CMS fallback. When the language is English we use
// these defaults; admin-provided AR overrides only apply in the AR view.
const FALLBACK_EN: typeof FALLBACK = {
  eyebrow: "Events · What's happening",
  title: "Island Haven Events",
  subtitle:
    "Our schedule, news, and weekly tips — everything happening in the space, in one place.",
  filterAll: "All",
  filterNews: "News",
  filterTip: "Tips",
  filterStory: "Stories",
  filterQuote: "Quotes",
  emptyTitle: "No events yet",
  emptyHint: "Our upcoming events will appear here — follow us soon.",
  detailsLabel: "Details",
};

interface Post {
  id: number;
  type: DailyType;
  title: string;
  body: string;
  coverUrl: string | null;
  publishedAt: string;
}

export default function Events() {
  const { lang, t } = useLanguage();
  const [filter, setFilter] = useState<"" | DailyType>("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Post[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  // CMS overrides are authored in Arabic; in English we fall back to the
  // English defaults rather than showing the raw Arabic copy.
  const c = useContentSection(
    "pageEvents",
    lang === "ar" ? FALLBACK : FALLBACK_EN,
  );

  const FILTERS: Array<{ key: "" | DailyType; label: string }> = [
    { key: "", label: c.filterAll },
    { key: "news", label: c.filterNews },
    { key: "tip", label: c.filterTip },
    { key: "story", label: c.filterStory },
    { key: "quote", label: c.filterQuote },
  ];

  useEffect(() => {
    document.title =
      lang === "ar"
        ? "فعاليّات آيلاند — آيلاند هيفن"
        : "Island Haven Events — Island Haven";
  }, [lang]);

  useEffect(() => { setPage(1); }, [filter]);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    const params = new URLSearchParams();
    if (filter) params.set("type", filter);
    params.set("page", String(page));
    params.set("limit", "12");
    api<{ posts: Post[]; total?: number }>(`/daily?${params}`)
      .then((r) => {
        if (!cancelled) {
          setRows(r.posts);
          setTotalPages(r.total ? Math.ceil(r.total / 12) : 1);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(
          e instanceof ApiError
            ? e.message
            : t({ ar: "تعذّر التحميل", en: "Couldn't load" }),
        );
      });
    return () => { cancelled = true; };
  }, [filter, page, lang]);

  return (
    <PageShell
      active="events"
      eyebrow={c.eyebrow}
      title={c.title}
      subtitle={c.subtitle}
    >
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key ? "true" : "false"}
            className={`px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors border ${
              filter === f.key
                ? "bg-primary/20 text-white border-primary/40"
                : "bg-white/[0.04] text-white/65 border-white/10 hover:text-white hover:bg-white/[0.08]"
            }`}
            data-testid={`events-filter-${f.key || "all"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <GlassCard className="p-5 text-red-200 text-center">{error}</GlassCard>}

      {rows === null && !error ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-[24px] h-40 bg-white/[0.035] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : rows && rows.length === 0 ? (
        <EmptyState title={c.emptyTitle} hint={c.emptyHint} />
      ) : (
        <div className="space-y-5">
          {rows?.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.04 }}
            >
              <EventCard post={p} detailsLabel={c.detailsLabel} lang={lang} />
            </motion.div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 mt-10" dir="ltr" aria-label={t({ ar: "ترقيم الصفحات", en: "Pagination" })}>
          <button type="button" onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }} disabled={page <= 1}
            aria-label={t({ ar: "الصفحة السابقة", en: "Previous page" })}
            className="px-4 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-white/70 text-[13px] font-semibold hover:bg-white/[0.11] disabled:opacity-35 disabled:cursor-not-allowed transition-all"><span aria-hidden="true">←</span></button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | "…")[]>((acc, p, i, arr) => {
              if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
              acc.push(p); return acc;
            }, [])
            .map((p, i) => p === "…"
              ? <span key={`e${i}`} className="text-white/30 text-[13px] px-1">…</span>
              : <button key={p} type="button" onClick={() => { setPage(p as number); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  aria-label={t({ ar: `الصفحة ${p}`, en: `Page ${p}` })}
                  aria-current={p === page ? "page" : undefined}
                  className={`w-9 h-9 rounded-xl text-[13px] font-semibold transition-all ${p === page ? "bg-primary text-white" : "bg-white/[0.07] border border-white/15 text-white/70 hover:bg-white/[0.11]"}`}>{p}</button>
            )}
          <button type="button" onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }} disabled={page >= totalPages}
            aria-label={t({ ar: "الصفحة التالية", en: "Next page" })}
            className="px-4 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-white/70 text-[13px] font-semibold hover:bg-white/[0.11] disabled:opacity-35 disabled:cursor-not-allowed transition-all"><span aria-hidden="true">→</span></button>
        </nav>
      )}
    </PageShell>
  );
}

function EventCard({
  post,
  detailsLabel,
  lang,
}: {
  post: Post;
  detailsLabel: string;
  lang: "ar" | "en";
}) {
  return (
    <Link
      href={`/events/${post.id}`}
      className="group block"
      data-testid={`event-row-${post.id}`}
    >
      <GlassCard className="p-0 hover:border-primary/40 transition-colors">
        <div className="grid sm:grid-cols-[200px_1fr]">
          {post.coverUrl ? (
            <div className="aspect-[4/3] sm:aspect-auto overflow-hidden bg-black/30">
              <img
                src={post.coverUrl}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="hidden sm:flex bg-gradient-to-br from-primary/20 to-transparent items-center justify-center">
              <Calendar className="w-12 h-12 text-primary/50" />
            </div>
          )}
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.18em] uppercase font-bold bg-primary/15 text-primary border border-primary/30">
                {lang === "ar"
                  ? DAILY_TYPE_LABELS[post.type]
                  : DAILY_TYPE_LABELS_EN[post.type]}
              </span>
              <span className="text-white/60 text-[11.5px]">
                {formatDate(post.publishedAt, lang)}
              </span>
            </div>
            <h3 className="text-white font-bold text-[18px] leading-snug mb-2 line-clamp-2">
              {post.title}
            </h3>
            {post.body && (
              <p className="text-white/60 text-[13.5px] leading-[1.85] line-clamp-2">
                {post.body}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2 text-[12.5px] text-white/55 group-hover:text-primary font-semibold transition-colors">
              <span>{detailsLabel}</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 ltr:rotate-180" />
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}

export function EventDetail() {
  const { lang, t } = useLanguage();
  const [, params] = useRoute("/events/:id");
  const id = params?.id;
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api<{ post: Post }>(`/daily/${id}`)
      .then((r) => setPost(r.post))
      .catch((e) =>
        setError(
          e instanceof ApiError
            ? e.message
            : t({ ar: "تعذّر التحميل", en: "Couldn't load" }),
        ),
      );
  }, [id, lang]);

  usePageMeta({
    title: post?.title,
    description: post?.body ? post.body.slice(0, 160) : undefined,
    image: post?.coverUrl || undefined,
    type: "article",
  });

  if (error && !post) {
    return (
      <PageShell active="events">
        <BackLink href="/events" label={t({ ar: "الفعاليّات", en: "Events" })} />
        <GlassCard className="p-8 text-center text-red-200">{error}</GlassCard>
      </PageShell>
    );
  }
  if (!post) {
    return (
      <PageShell active="events">
        <div className="h-72 rounded-[28px] bg-white/[0.035] border border-white/10 animate-pulse" />
      </PageShell>
    );
  }

  return (
    <PageShell active="events" maxWidth="max-w-3xl">
      <BackLink
        href="/events"
        label={t({ ar: "كلّ الفعاليّات", en: "All events" })}
      />
      <GlassCard>
        {post.coverUrl && (
          <div className="aspect-[16/9] overflow-hidden bg-black/30">
            <img
              src={post.coverUrl}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6 sm:p-10">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.18em] uppercase font-bold bg-primary/15 text-primary border border-primary/30">
              {lang === "ar"
                ? DAILY_TYPE_LABELS[post.type]
                : DAILY_TYPE_LABELS_EN[post.type]}
            </span>
            <span className="text-white/60 text-[11.5px]">
              {formatDate(post.publishedAt, lang)}
            </span>
          </div>
          <h1
            className="font-bold text-white leading-tight mb-5"
            style={{ fontSize: "clamp(1.85rem, 4.5vw, 2.6rem)" }}
            data-testid="text-event-title"
          >
            {post.title}
          </h1>
          {post.body && (
            <div className="text-white/80 text-[15px] leading-[2.05] whitespace-pre-wrap">
              {post.body}
            </div>
          )}
        </div>
      </GlassCard>
    </PageShell>
  );
}
