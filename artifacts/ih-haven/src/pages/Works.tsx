import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ExternalLink, Plus, Heart, MessageCircle, Search } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { useAuth, ROLE_LABELS, type UserRole } from "@/lib/auth";
import { splitTags } from "@/lib/labels";

interface WorkRow {
  work: {
    id: number;
    title: string;
    summary: string;
    coverUrl: string | null;
    link: string;
    tags: string;
    createdAt: string;
  };
  author: {
    id: number;
    fullName: string;
    role: UserRole;
    avatarUrl: string | null;
  };
  likesCount?: number;
  commentsCount?: number;
}

const ROLE_FILTERS: Array<{ key: "" | UserRole; label: { ar: string; en: string } }> = [
  { key: "", label: { ar: "الكلّ", en: "All" } },
  { key: "freelancer", label: { ar: "المستقلّون", en: "Freelancers" } },
  { key: "graduate", label: { ar: "الخرّيجون", en: "Graduates" } },
  { key: "student", label: { ar: "الطلّاب", en: "Students" } },
];

type SortKey = "newest" | "popular" | "discussed";
const SORT_OPTIONS: Array<{ key: SortKey; label: { ar: string; en: string } }> = [
  { key: "newest", label: { ar: "الأحدث", en: "Newest" } },
  { key: "popular", label: { ar: "الأكثر إعجابًا", en: "Most liked" } },
  { key: "discussed", label: { ar: "الأكثر نقاشًا", en: "Most discussed" } },
];

export default function Works() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const [filter, setFilter] = useState<"" | UserRole>("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [q, setQ] = useState("");
  const [followingFeed, setFollowingFeed] = useState(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<WorkRow[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title =
      lang === "ar"
        ? "أعمال المستقلّين — آيلاند هيفن"
        : "Freelancer Works — Island Haven";
  }, [lang]);

  // Reset page when filter, sort, query, or feed scope changes
  useEffect(() => { setPage(1); }, [filter, sort, q, followingFeed]);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    const params = new URLSearchParams();
    if (filter) params.set("role", filter);
    if (sort !== "newest") params.set("sort", sort);
    if (q.trim()) params.set("q", q.trim());
    if (followingFeed) params.set("following", "1");
    params.set("page", String(page));
    api<{ works: WorkRow[]; totalPages: number }>(`/works?${params}`)
      .then((r) => {
        if (!cancelled) {
          setRows(r.works);
          setTotalPages(r.totalPages ?? 1);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(
          e instanceof ApiError
            ? e.message
            : t({ ar: "تعذّر التحميل", en: "Couldn't load works" }),
        );
      });
    return () => { cancelled = true; };
  }, [filter, sort, q, followingFeed, page]);

  return (
    <PageShell
      active="works"
      eyebrow={t({ ar: "معرض المجتمع", en: "Community Showcase" })}
      title={t({ ar: "أعمال", en: "Works by" })}
      highlight={t({ ar: "مستقلّينا", en: "Our Freelancers" })}
      subtitle={t({
        ar: "مشاريع وأعمال أنجزها أعضاء آيلاند هيفن — تَصفَّح، تواصل، أو شارك أنت أيضًا.",
        en: "Projects and work made by Island Haven members — browse, connect, or share your own.",
      })}
    >
      <div className="relative mb-5">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45 pointer-events-none" aria-hidden="true" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t({
            ar: "ابحث في الأعمال بالعنوان أو الوصف أو الوسوم…",
            en: "Search works by title, summary, or tags…",
          })}
          aria-label={t({
            ar: "ابحث في الأعمال بالعنوان أو الوصف أو الوسوم",
            en: "Search works by title, summary, or tags",
          })}
          className="w-full h-12 pe-11 ps-4 rounded-2xl bg-white/[0.05] border border-white/10 text-white text-[14px] placeholder-white/40 outline-none focus:border-primary/45 focus:bg-white/[0.07] transition-colors"
          data-testid="input-search-works"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-2 flex-wrap">
          {ROLE_FILTERS.map((f) => (
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
              data-testid={`filter-${f.key || "all"}`}
            >
              {t(f.label)}
            </button>
          ))}
        </div>
        {user ? (
          <Link
            href="/works/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white font-bold text-[12.5px] hover:shadow-[0_14px_30px_-10px_rgba(220,38,55,0.55)] hover:-translate-y-px transition-all"
            data-testid="button-add-work"
          >
            <Plus className="w-4 h-4" />
            {t({ ar: "أضف عملًا", en: "Add work" })}
          </Link>
        ) : (
          <Link
            href="/login?next=/works/new"
            className="text-[12.5px] text-white/55 hover:text-primary font-semibold transition-colors"
          >
            {t({ ar: "سجّل دخولك لإضافة أعمالك", en: "Sign in to add your work" })}
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-8 -mt-4">
        <span className="text-white/40 text-[12px] font-semibold me-1">
          {t({ ar: "ترتيب:", en: "Sort:" })}
        </span>
        {SORT_OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => setSort(o.key)}
            aria-pressed={sort === o.key ? "true" : "false"}
            className={`px-3.5 py-1 rounded-full text-[12px] font-semibold transition-colors border ${
              sort === o.key
                ? "bg-primary/15 text-primary border-primary/35"
                : "bg-white/[0.03] text-white/55 border-white/10 hover:text-white hover:bg-white/[0.07]"
            }`}
            data-testid={`sort-${o.key}`}
          >
            {t(o.label)}
          </button>
        ))}
        {user && (
          <button
            type="button"
            onClick={() => setFollowingFeed((v) => !v)}
            aria-pressed={followingFeed ? "true" : "false"}
            className={`ms-1 px-3.5 py-1 rounded-full text-[12px] font-semibold transition-colors border ${
              followingFeed
                ? "bg-primary text-white border-primary"
                : "bg-white/[0.03] text-white/55 border-white/10 hover:text-white hover:bg-white/[0.07]"
            }`}
            data-testid="toggle-following-feed"
          >
            {t({ ar: "أتابِعهم", en: "Following" })}
          </button>
        )}
      </div>
      {followingFeed && rows !== null && rows.length === 0 && !error && (
        <GlassCard className="p-6 text-center text-white/65 text-[13.5px] mb-6">
          {t({
            ar: "لا توجد أعمال من الأعضاء الذين تتابِعهم بعد — تابِع أعضاء من صفحاتهم لترى أعمالهم هنا.",
            en: "No works yet from members you follow — follow members from their profiles to see their work here.",
          })}
        </GlassCard>
      )}

      {error && (
        <GlassCard className="p-5 text-red-200 text-center">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-[24px] h-72 bg-white/[0.035] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : rows && rows.length === 0 ? (
        // In following-feed mode the tailored card above already explains the
        // empty state — don't also show the generic "be the first" prompt.
        followingFeed ? null : (
          <EmptyState
            title={t({ ar: "لا توجد أعمال بعد", en: "No works yet" })}
            hint={t({
              ar: "كن أوّل من يشارك عمله.",
              en: "Be the first to share your work.",
            })}
          />
        )
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rows?.map((row, i) => (
            <motion.div
              key={row.work.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
            >
              <WorkCard row={row} />
            </motion.div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 mt-10" dir="ltr" aria-label={t({ ar: "ترقيم الصفحات", en: "Pagination" })}>
          <button
            type="button"
            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={page <= 1}
            aria-label={t({ ar: "الصفحة السابقة", en: "Previous page" })}
            className="px-4 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-white/70 text-[13px] font-semibold hover:bg-white/[0.11] disabled:opacity-35 disabled:cursor-not-allowed transition-all"
          >
            <span aria-hidden="true">←</span>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | "…")[]>((acc, p, i, arr) => {
              if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} className="text-white/30 text-[13px] px-1">…</span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setPage(p as number); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  aria-label={t({ ar: `الصفحة ${p}`, en: `Page ${p}` })}
                  aria-current={p === page ? "page" : undefined}
                  className={`w-9 h-9 rounded-xl text-[13px] font-semibold transition-all ${
                    p === page
                      ? "bg-primary text-white shadow-[0_4px_14px_-3px_rgba(220,38,55,0.5)]"
                      : "bg-white/[0.07] border border-white/15 text-white/70 hover:bg-white/[0.11]"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          <button
            type="button"
            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={page >= totalPages}
            aria-label={t({ ar: "الصفحة التالية", en: "Next page" })}
            className="px-4 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-white/70 text-[13px] font-semibold hover:bg-white/[0.11] disabled:opacity-35 disabled:cursor-not-allowed transition-all"
          >
            <span aria-hidden="true">→</span>
          </button>
        </nav>
      )}
    </PageShell>
  );
}

function WorkCard({ row }: { row: WorkRow }) {
  const { t } = useLanguage();
  const tags = splitTags(row.work.tags);
  return (
    <Link
      href={`/works/${row.work.id}`}
      className="group block h-full"
      data-testid={`work-card-${row.work.id}`}
    >
      <GlassCard className="h-full flex flex-col hover:border-primary/40 transition-colors">
        {row.work.coverUrl ? (
          <div className="aspect-[16/10] overflow-hidden bg-black/30">
            <img
              src={row.work.coverUrl}
              alt={row.work.title}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="aspect-[16/10] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-center justify-center">
            <div className="text-white/30 text-[12px] tracking-[0.22em] uppercase">
              {t({ ar: "لا توجد صورة", en: "No image" })}
            </div>
          </div>
        )}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-white font-bold text-[16.5px] leading-snug mb-1.5 line-clamp-2">
            {row.work.title}
          </h3>
          {row.work.summary && (
            <p className="text-white/55 text-[13px] leading-[1.7] line-clamp-2 mb-3">
              {row.work.summary}
            </p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full bg-white/[0.05] text-white/55 text-[11px] border border-white/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="mt-auto flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/30 flex items-center justify-center text-[11px] font-bold text-white">
              {(row.author.fullName || "·").slice(0, 1)}
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-white text-[12.5px] font-semibold truncate">
                {row.author.fullName}
              </div>
              <div className="text-white/45 text-[10.5px] tracking-[0.16em] uppercase">
                {ROLE_LABELS[row.author.role]}
              </div>
            </div>
            <div className="ms-auto flex items-center gap-3 text-white/45 text-[11.5px] tabular-nums shrink-0">
              <span
                className="inline-flex items-center gap-1"
                title={t({ ar: "إعجابات", en: "Likes" })}
              >
                <Heart className="w-3.5 h-3.5" />
                {row.likesCount ?? 0}
              </span>
              <span
                className="inline-flex items-center gap-1"
                title={t({ ar: "تعليقات", en: "Comments" })}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                {row.commentsCount ?? 0}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}

export { type WorkRow };
