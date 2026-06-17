import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ExternalLink, Plus } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
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
}

const ROLE_FILTERS: Array<{ key: "" | UserRole; label: string }> = [
  { key: "", label: "الكلّ" },
  { key: "freelancer", label: "المستقلّون" },
  { key: "graduate", label: "الخرّيجون" },
  { key: "student", label: "الطلّاب" },
];

export default function Works() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"" | UserRole>("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<WorkRow[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "أعمال المستقلّين — آيلاند هيفن";
  }, []);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [filter]);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    const params = new URLSearchParams();
    if (filter) params.set("role", filter);
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
        setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
      });
    return () => { cancelled = true; };
  }, [filter, page]);

  return (
    <PageShell
      active="works"
      eyebrow="معرض المجتمع"
      title="أعمال"
      highlight="مستقلّينا"
      subtitle="مشاريع وأعمال أنجزها أعضاء آيلاند هيفن — تَصفَّح، تواصل، أو شارك أنت أيضًا."
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-2 flex-wrap">
          {ROLE_FILTERS.map((f) => (
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
        {user ? (
          <Link
            href="/works/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white font-bold text-[12.5px] hover:shadow-[0_14px_30px_-10px_rgba(220,38,55,0.55)] hover:-translate-y-px transition-all"
            data-testid="button-add-work"
          >
            <Plus className="w-4 h-4" />
            أضف عملًا
          </Link>
        ) : (
          <Link
            href="/login?next=/works/new"
            className="text-[12.5px] text-white/55 hover:text-primary font-semibold transition-colors"
          >
            سجّل دخولك لإضافة أعمالك
          </Link>
        )}
      </div>

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
        <EmptyState title="لا توجد أعمال بعد" hint="كن أوّل من يشارك عمله." />
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
        <div className="flex items-center justify-center gap-2 mt-10" dir="ltr">
          <button
            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={page <= 1}
            className="px-4 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-white/70 text-[13px] font-semibold hover:bg-white/[0.11] disabled:opacity-35 disabled:cursor-not-allowed transition-all"
          >
            ←
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
                  onClick={() => { setPage(p as number); window.scrollTo({ top: 0, behavior: "smooth" }); }}
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
            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-white/70 text-[13px] font-semibold hover:bg-white/[0.11] disabled:opacity-35 disabled:cursor-not-allowed transition-all"
          >
            →
          </button>
        </div>
      )}
    </PageShell>
  );
}

function WorkCard({ row }: { row: WorkRow }) {
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
              لا توجد صورة
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
              {tags.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-full bg-white/[0.05] text-white/55 text-[11px] border border-white/10"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="mt-auto flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/30 overflow-hidden flex items-center justify-center text-[11px] font-bold text-white shrink-0">
              {row.author.avatarUrl ? (
                <img
                  src={row.author.avatarUrl}
                  alt={row.author.fullName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                (row.author.fullName || "·").slice(0, 1)
              )}
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-white text-[12.5px] font-semibold truncate">
                {row.author.fullName}
              </div>
              <div className="text-white/45 text-[10.5px] tracking-[0.16em] uppercase">
                {ROLE_LABELS[row.author.role]}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}

export { type WorkRow };
