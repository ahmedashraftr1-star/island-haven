import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Quote } from "lucide-react";
import { PageShell, GlassCard, BackLink, EmptyState } from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import {
  DAILY_TYPE_LABELS,
  DAILY_TYPE_LABELS_EN,
  formatDate,
  type DailyType,
} from "@/lib/labels";

interface Post {
  id: number;
  type: DailyType;
  title: string;
  body: string;
  coverUrl: string | null;
  publishedAt: string;
}

const FILTERS: Array<{ key: "" | DailyType; label: { ar: string; en: string } }> = [
  { key: "", label: { ar: "الكلّ", en: "All" } },
  { key: "tip", label: { ar: "نصائح", en: "Tips" } },
  { key: "news", label: { ar: "أخبار", en: "News" } },
  { key: "quote", label: { ar: "اقتباسات", en: "Quotes" } },
  { key: "story", label: { ar: "قصص", en: "Stories" } },
];

export default function Daily() {
  const { lang, t } = useLanguage();
  const [filter, setFilter] = useState<"" | DailyType>("");
  const [rows, setRows] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title =
      lang === "ar" ? "اليوميّات — آيلاند هيفن" : "Daily — Island Haven";
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    api<{ posts: Post[] }>(`/daily${filter ? `?type=${filter}` : ""}`)
      .then((r) => {
        if (!cancelled) setRows(r.posts);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(
          e instanceof ApiError
            ? e.message
            : t({ ar: "تعذّر التحميل", en: "Couldn't load" }),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [filter, lang]);

  return (
    <PageShell
      active="daily"
      eyebrow={t({ ar: "نَبضُ المساحة", en: "The Space's Pulse" })}
      title={t({ ar: "اليوميّات", en: "Daily" })}
      subtitle={t({
        ar: "نَصائح، أخبار، قَصص واقتباسات نَشاركها يوميًا — لِنُلهِم بعضنا بعضًا.",
        en: "Tips, news, stories, and quotes we share daily — to inspire one another.",
      })}
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
                ? "bg-primary/20 text-foreground border-primary/40"
                : "bg-surface-2 text-fg-secondary border-border-strong hover:text-foreground hover:bg-surface-2"
            }`}
            data-testid={`filter-${f.key || "all"}`}
          >
            {t(f.label)}
          </button>
        ))}
      </div>

      {error && (
        <GlassCard className="p-5 text-destructive text-center">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-[24px] h-40 bg-white/[0.035] border border-border-strong animate-pulse"
            />
          ))}
        </div>
      ) : rows && rows.length === 0 ? (
        <EmptyState
          title={t({ ar: "لا توجد مَنشورات بعد", en: "No posts yet" })}
          hint={t({
            ar: "عُد قريبًا — هناك جديد كلّ يوم.",
            en: "Check back soon — there's something new every day.",
          })}
        />
      ) : (
        <div className="space-y-5">
          {rows?.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.04 }}
            >
              <DailyCard post={p} />
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function DailyCard({ post }: { post: Post }) {
  const { lang, t } = useLanguage();
  return (
    <Link
      href={`/daily/${post.id}`}
      className="group block"
      data-testid={`daily-card-${post.id}`}
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
              {post.type === "quote" && <Quote className="w-12 h-12 text-primary/50" />}
            </div>
          )}
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.18em] uppercase font-bold bg-primary/15 text-primary border border-primary/30">
                {lang === "ar"
                  ? DAILY_TYPE_LABELS[post.type]
                  : DAILY_TYPE_LABELS_EN[post.type]}
              </span>
              <span className="text-muted-foreground text-[11.5px]">
                {formatDate(post.publishedAt, lang)}
              </span>
            </div>
            <h3 className="text-foreground font-bold text-[18px] leading-snug mb-2">
              {post.title}
            </h3>
            {post.body && (
              <p className="text-muted-foreground text-[13.5px] leading-[1.85] line-clamp-3">
                {post.body}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2 text-[12.5px] text-muted-foreground group-hover:text-primary font-semibold transition-colors">
              <span>{t({ ar: "اقرأ المزيد", en: "Read more" })}</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 ltr:rotate-180" />
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}

export function DailyDetail() {
  const { lang, t } = useLanguage();
  const [, params] = useRoute("/daily/:id");
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

  useEffect(() => {
    if (post?.title)
      document.title = `${post.title} — ${
        lang === "ar" ? "آيلاند هيفن" : "Island Haven"
      }`;
  }, [post?.title, lang]);

  if (error && !post) {
    return (
      <PageShell active="daily">
        <BackLink href="/daily" label={t({ ar: "عودة", en: "Back" })} />
        <GlassCard className="p-8 text-center text-destructive">{error}</GlassCard>
      </PageShell>
    );
  }
  if (!post) {
    return (
      <PageShell active="daily">
        <div className="h-72 rounded-[28px] bg-white/[0.035] border border-border-strong animate-pulse" />
      </PageShell>
    );
  }

  return (
    <PageShell active="daily" maxWidth="max-w-3xl">
      <BackLink href="/daily" label={t({ ar: "كلّ اليوميّات", en: "All daily" })} />
      <GlassCard>
        {post.coverUrl && (
          <div className="aspect-[16/9] overflow-hidden bg-black/30">
            <img loading="lazy" decoding="async"
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
            <span className="text-muted-foreground text-[11.5px]">
              {formatDate(post.publishedAt, lang)}
            </span>
          </div>
          <h1
            className="font-bold text-foreground leading-tight mb-5"
            style={{ fontSize: "clamp(1.85rem, 4.5vw, 2.6rem)" }}
            data-testid="text-daily-title"
          >
            {post.title}
          </h1>
          {post.body && (
            <div className="text-foreground text-[15px] leading-[2.05] whitespace-pre-wrap">
              {post.body}
            </div>
          )}
        </div>
      </GlassCard>
    </PageShell>
  );
}
