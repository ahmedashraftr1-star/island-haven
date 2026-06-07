import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Briefcase,
  Linkedin,
  Github,
  Globe,
  Sparkles,
} from "lucide-react";
import {
  PageShell,
  GlassCard,
  EmptyState,
} from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import { ROLE_LABELS, type UserRole } from "@/lib/auth";
import { splitTags } from "@/lib/labels";
import { useContentSection } from "@/hooks/use-content";

const FALLBACK = {
  eyebrow: "من نحن",
  title: "منتسبو المساحة",
  subtitle:
    "مُجتمعٌ من المستقلّين، الخرّيجين، والطّلّاب يصنعون أعمالهم من قلب غزّة. تعرّف عليهم — واطّلع على أعمالهم.",
  searchPlaceholder: "ابحث بالاسم، التّخصّص، أو المهارة…",
  filterAll: "الكلّ",
  filterFreelancer: "مُستقلّون",
  filterGraduate: "خرّيجون",
  filterStudent: "طلّاب",
  filterOther: "أعضاء",
  worksLabel: "عمل",
  emptyTitle: "لا توجد نتائج",
  emptyHint: "جرّب فلترًا آخر أو كلمة بحث مختلفة.",
};

interface Member {
  id: number;
  fullName: string;
  role: UserRole;
  avatarUrl: string | null;
  bio: string;
  jobTitle: string;
  skills: string;
  portfolioUrl: string;
  linkedinUrl: string;
  behanceUrl: string;
  githubUrl: string;
  worksCount: number;
  createdAt: string;
}

export default function Members() {
  const [role, setRole] = useState<"" | UserRole>("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Member[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const c = useContentSection("pageMembers", FALLBACK);

  const ROLE_FILTERS: Array<{ key: "" | UserRole; label: string }> = [
    { key: "", label: c.filterAll },
    { key: "freelancer", label: c.filterFreelancer },
    { key: "graduate", label: c.filterGraduate },
    { key: "student", label: c.filterStudent },
    { key: "other", label: c.filterOther },
  ];

  useEffect(() => {
    document.title = "منتسبو المساحة — آيلاند هيفن";
  }, []);

  // Reset page on filter/search change
  useEffect(() => { setPage(1); }, [role, q]);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (q.trim()) params.set("q", q.trim());
    params.set("page", String(page));
    api<{ members: Member[]; totalPages: number; total: number }>(`/members?${params}`)
      .then((r) => {
        if (!cancelled) {
          setRows(r.members);
          setTotalPages(r.totalPages ?? 1);
          setTotal(r.total ?? null);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
      });
    return () => { cancelled = true; };
  }, [role, q, page]);


  return (
    <PageShell
      active="members"
      eyebrow={c.eyebrow}
      title={c.title}
      subtitle={c.subtitle}
    >
      <div className="grid lg:grid-cols-[1fr_auto] gap-4 mb-8 items-center">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45 pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={c.searchPlaceholder}
            className="w-full h-12 pe-11 ps-4 rounded-2xl bg-white/[0.05] border border-white/10 text-white text-[14px] placeholder-white/40 outline-none focus:border-primary/45 focus:bg-white/[0.07] transition-colors"
            data-testid="input-search-members"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {ROLE_FILTERS.map((f) => {
            const active = role === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setRole(f.key)}
                className={`px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors border flex items-center gap-1.5 ${
                  active
                    ? "bg-primary/20 text-white border-primary/40"
                    : "bg-white/[0.04] text-white/65 border-white/10 hover:text-white hover:bg-white/[0.08]"
                }`}
                data-testid={`filter-role-${f.key || "all"}`}
              >
                <span>{f.label}</span>
                {active && total !== null && (
                  <span className="text-[10.5px] text-white/55 tabular-nums">
                    {total}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {error && !rows && (
        <GlassCard className="p-6 text-center text-red-200">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-72 rounded-[24px] bg-white/[0.035] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : rows && rows.length === 0 ? (
        <EmptyState title={c.emptyTitle} hint={c.emptyHint} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rows?.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: Math.min(i, 6) * 0.04 }}
            >
              <MemberCard m={m} worksLabel={c.worksLabel} />
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
          >←</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | "…")[]>((acc, p, i, arr) => {
              if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
              acc.push(p); return acc;
            }, [])
            .map((p, i) => p === "…"
              ? <span key={`e${i}`} className="text-white/30 text-[13px] px-1">…</span>
              : <button key={p} onClick={() => { setPage(p as number); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className={`w-9 h-9 rounded-xl text-[13px] font-semibold transition-all ${p === page ? "bg-primary text-white" : "bg-white/[0.07] border border-white/15 text-white/70 hover:bg-white/[0.11]"}`}
                >{p}</button>
            )}
          <button
            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-white/70 text-[13px] font-semibold hover:bg-white/[0.11] disabled:opacity-35 disabled:cursor-not-allowed transition-all"
          >→</button>
        </div>
      )}
    </PageShell>
  );
}

function MemberCard({ m, worksLabel }: { m: Member; worksLabel: string }) {
  const initials = m.fullName.split(/\s+/).slice(0, 2).map((p) => p[0]).join("");
  const skills = splitTags(m.skills).slice(0, 5);

  return (
    <Link
      href={`/u/${m.id}`}
      className="group block h-full"
      data-testid={`member-card-${m.id}`}
    >
      <GlassCard className="h-full p-6 hover:border-primary/45 transition-colors flex flex-col">
        <div className="flex items-start gap-4 mb-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/40 overflow-hidden flex items-center justify-center text-[20px] font-bold text-white shadow-[0_8px_30px_-12px_rgba(220,38,55,0.55)]">
              {m.avatarUrl ? (
                <img src={m.avatarUrl} alt={m.fullName} className="w-full h-full object-cover" />
              ) : (
                initials || "·"
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] tracking-[0.18em] uppercase text-primary font-bold mb-1">
              {ROLE_LABELS[m.role]}
            </div>
            <h3 className="text-white font-bold text-[16.5px] leading-tight truncate group-hover:text-primary transition-colors">
              {m.fullName}
            </h3>
            {m.jobTitle && (
              <div className="text-white/65 text-[12.5px] mt-1 truncate flex items-center gap-1.5">
                <Briefcase className="w-3 h-3 shrink-0" />
                <span className="truncate">{m.jobTitle}</span>
              </div>
            )}
          </div>
        </div>

        {m.bio ? (
          <p className="text-white/70 text-[13px] leading-[1.85] line-clamp-3 mb-4 flex-1">
            {m.bio}
          </p>
        ) : (
          <p className="text-white/35 text-[13px] italic mb-4 flex-1">
            لا توجد نبذة بعد.
          </p>
        )}

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {skills.map((s) => (
              <span
                key={s}
                className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10.5px] font-semibold border border-primary/30"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-white/8 text-[12px]">
          <div className="flex items-center gap-2 text-white/55">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="font-semibold tabular-nums">
              {m.worksCount.toLocaleString("ar-EG")}
            </span>
            <span className="text-white/45">{worksLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            {m.linkedinUrl && (
              <span className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/55">
                <Linkedin className="w-3 h-3" />
              </span>
            )}
            {m.githubUrl && (
              <span className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/55">
                <Github className="w-3 h-3" />
              </span>
            )}
            {m.portfolioUrl && (
              <span className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/55">
                <Globe className="w-3 h-3" />
              </span>
            )}
            <ArrowLeft className="w-3.5 h-3.5 text-primary group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
