import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Quote } from "lucide-react";
import { PageShell, GlassCard, BackLink, EmptyState } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import {
  DAILY_TYPE_LABELS,
  formatArabicDate,
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

const FILTERS: Array<{ key: "" | DailyType; label: string }> = [
  { key: "", label: "الكلّ" },
  { key: "tip", label: "نصائح" },
  { key: "news", label: "أخبار" },
  { key: "quote", label: "اقتباسات" },
  { key: "story", label: "قصص" },
];

export default function Daily() {
  const [filter, setFilter] = useState<"" | DailyType>("");
  const [rows, setRows] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "اليوميّات — آيلاند هيفن";
  }, []);

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
        setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
      });
    return () => {
      cancelled = true;
    };
  }, [filter]);

  return (
    <PageShell
      active="daily"
      eyebrow="نَبضُ المساحة"
      title="اليوميّات"
      subtitle="نَصائح، أخبار، قَصص واقتباسات نَشاركها يوميًا — لِنُلهِم بعضنا بعضًا."
    >
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors border ${
              filter === f.key
                ? "bg-primary/20 text-white border-primary/40"
                : "bg-white/[0.04] text-white/65 border-white/10 hover:text-white hover:bg-white/[0.08]"
            }`}
            data-testid={`filter-${f.key || "all"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <GlassCard className="p-5 text-red-200 text-center">{error}</GlassCard>
      )}

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
        <EmptyState title="لا توجد مَنشورات بعد" hint="عُد قريبًا — هناك جديد كلّ يوم." />
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
                {DAILY_TYPE_LABELS[post.type]}
              </span>
              <span className="text-white/45 text-[11.5px]">
                {formatArabicDate(post.publishedAt)}
              </span>
            </div>
            <h3 className="text-white font-bold text-[18px] leading-snug mb-2">
              {post.title}
            </h3>
            {post.body && (
              <p className="text-white/60 text-[13.5px] leading-[1.85] line-clamp-3">
                {post.body}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2 text-[12.5px] text-white/55 group-hover:text-primary font-semibold transition-colors">
              <span>اقرأ المزيد</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}

export function DailyDetail() {
  const [, params] = useRoute("/daily/:id");
  const id = params?.id;
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api<{ post: Post }>(`/daily/${id}`)
      .then((r) => setPost(r.post))
      .catch((e) => setError(e instanceof ApiError ? e.message : "تعذّر التحميل"));
  }, [id]);

  useEffect(() => {
    if (post?.title) document.title = `${post.title} — آيلاند هيفن`;
  }, [post?.title]);

  if (error && !post) {
    return (
      <PageShell active="daily">
        <BackLink href="/daily" label="عودة" />
        <GlassCard className="p-8 text-center text-red-200">{error}</GlassCard>
      </PageShell>
    );
  }
  if (!post) {
    return (
      <PageShell active="daily">
        <div className="h-72 rounded-[28px] bg-white/[0.035] border border-white/10 animate-pulse" />
      </PageShell>
    );
  }

  return (
    <PageShell active="daily" maxWidth="max-w-3xl">
      <BackLink href="/daily" label="كلّ اليوميّات" />
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
              {DAILY_TYPE_LABELS[post.type]}
            </span>
            <span className="text-white/45 text-[11.5px]">
              {formatArabicDate(post.publishedAt)}
            </span>
          </div>
          <h1
            className="font-bold text-white leading-tight mb-5"
            style={{ fontSize: "clamp(1.85rem, 4.5vw, 2.6rem)" }}
            data-testid="text-daily-title"
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
