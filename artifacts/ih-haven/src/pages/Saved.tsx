import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Heart, MessageCircle, Bookmark } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { useAuth, type UserRole } from "@/lib/auth";

interface SavedRow {
  work: {
    id: number;
    title: string;
    summary: string;
    coverUrl: string | null;
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

export default function Saved() {
  const { lang, t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [rows, setRows] = useState<SavedRow[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title =
      lang === "ar" ? "المحفوظات — آيلاند هيفن" : "Saved — Island Haven";
  }, [lang]);

  // Saved works require a signed-in member; send guests to login (and back).
  useEffect(() => {
    if (!authLoading && !user) navigate("/login?next=/saved");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setRows(null);
    setError(null);
    api<{ works: SavedRow[]; totalPages: number }>(`/me/saved?page=${page}`)
      .then((r) => {
        if (cancelled) return;
        setRows(r.works);
        setTotalPages(r.totalPages ?? 1);
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
  }, [user, page]);

  return (
    <PageShell
      active="works"
      eyebrow={t({ ar: "مكتبتك", en: "Your library" })}
      title={t({ ar: "الأعمال", en: "Saved" })}
      highlight={t({ ar: "المحفوظة", en: "Works" })}
      subtitle={t({
        ar: "الأعمال التي حفظتها للرجوع إليها لاحقًا — قائمة خاصّة بك.",
        en: "Works you've saved to revisit later — your private list.",
      })}
    >
      {error && (
        <GlassCard className="p-5 text-red-200 text-center">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-72 rounded-[24px] bg-white/[0.035] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : rows && rows.length === 0 ? (
        <EmptyState
          title={t({ ar: "لا توجد أعمال محفوظة بعد", en: "No saved works yet" })}
          hint={t({
            ar: "اضغط «حفظ» على أيّ عمل يعجبك ليظهر هنا.",
            en: "Tap “Save” on any work you like and it'll show up here.",
          })}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rows?.map((row) => (
            <Link
              key={row.work.id}
              href={`/works/${row.work.id}`}
              className="group block h-full"
              data-testid={`saved-work-${row.work.id}`}
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
                    <Bookmark className="w-6 h-6 text-white/25" />
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-white font-bold text-[14.5px] leading-snug line-clamp-2">
                    {row.work.title}
                  </h3>
                  {row.work.summary && (
                    <p className="text-white/55 text-[12.5px] mt-1 line-clamp-2">
                      {row.work.summary}
                    </p>
                  )}
                  <div className="mt-auto pt-3 flex items-center gap-4 text-white/45 text-[12px]">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />
                      <span className="tabular-nums">{row.likesCount ?? 0}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="tabular-nums">{row.commentsCount ?? 0}</span>
                    </span>
                    <span className="ms-auto text-white/55 truncate">
                      {row.author.fullName}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10" dir="ltr">
          <button
            onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={page <= 1}
            className="px-4 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-white/70 text-[13px] font-semibold hover:bg-white/[0.11] disabled:opacity-35 disabled:cursor-not-allowed transition-all"
          >
            ←
          </button>
          <span className="text-white/55 text-[13px] tabular-nums px-2">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
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
