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
import { SpotlightOverlay } from "@/components/ui/SpotlightCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { ROLE_LABELS, type UserRole } from "@/lib/auth";
import { splitTags } from "@/lib/labels";
import { useContentSection } from "@/hooks/use-content";

// Arabic chrome — also the editable CMS fallback ("pageMembers" section).
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

// English chrome.
const EN: typeof FALLBACK = {
  eyebrow: "About Us",
  title: "Community Members",
  subtitle:
    "A community of freelancers, graduates, and students building their work from the heart of Gaza. Meet them — and explore what they've made.",
  searchPlaceholder: "Search by name, field, or skill…",
  filterAll: "All",
  filterFreelancer: "Freelancers",
  filterGraduate: "Graduates",
  filterStudent: "Students",
  filterOther: "Members",
  worksLabel: "works",
  emptyTitle: "No results",
  emptyHint: "Try a different filter or search term.",
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

/** Role-coloured badge styles — gold freelancers, red graduates, neutral rest. */
const ROLE_BADGE: Partial<Record<UserRole, string>> = {
  freelancer: "bg-sand/15 text-sand border-sand/30",
  graduate: "bg-primary/10 text-primary border-primary/25",
  student: "bg-white/[0.06] text-fg-secondary border-border-strong",
  other: "bg-white/[0.06] text-fg-secondary border-border-strong",
};

export default function Members() {
  const { lang, t } = useLanguage();
  const [role, setRole] = useState<"" | UserRole>("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Member[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  // Directory figures from the SAME /members query that feeds the list, so the
  // hero total, the role breakdown, and the list can never disagree. Both reflect
  // the whole community (active non-experts), independent of the current filter.
  const [communityTotal, setCommunityTotal] = useState<number | null>(null);
  const [roleCounts, setRoleCounts] = useState<{
    freelancer: number;
    graduate: number;
    student: number;
    other: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Arabic chrome comes from CMS (with FALLBACK); English from the static EN map.
  const ar = useContentSection("pageMembers", FALLBACK);
  const c = lang === "en" ? EN : ar;

  const ROLE_FILTERS: Array<{ key: "" | UserRole; label: string }> = [
    { key: "", label: c.filterAll },
    { key: "freelancer", label: c.filterFreelancer },
    { key: "graduate", label: c.filterGraduate },
    { key: "student", label: c.filterStudent },
    { key: "other", label: c.filterOther },
  ];

  useEffect(() => {
    document.title = t({
      ar: "منتسبو المساحة — آيلاند هيفن",
      en: "Community Members — Island Haven",
    });
  }, [lang, t]);

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
    api<{
      members: Member[];
      totalPages: number;
      total: number;
      communityTotal: number;
      roleCounts: { freelancer: number; graduate: number; student: number; other: number };
    }>(`/members?${params}`)
      .then((r) => {
        if (!cancelled) {
          setRows(r.members);
          setTotalPages(r.totalPages ?? 1);
          setTotal(r.total ?? null);
          setCommunityTotal(r.communityTotal ?? null);
          setRoleCounts(r.roleCounts ?? null);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(
          t({ ar: "تعذّر التحميل", en: "Couldn't load" }),
        );
      });
    return () => { cancelled = true; };
  }, [role, q, page]);


  return (
    <PageShell
      active="members"
      eyebrow={c.eyebrow}
      title={c.title}
      subtitle={c.subtitle}
      heroAside={
        <div className="rounded-[18px] border border-border-strong bg-surface-2/40 p-7 sm:p-8">
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary rtl:tracking-normal">
            {t({ ar: "مجتمع المنتسبين", en: "Community members" })}
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span
              className="font-mono font-black text-sand-bright tnum leading-none"
              style={{ fontSize: "clamp(2.8rem,6vw,4rem)" }}
            >
              {communityTotal != null ? communityTotal.toLocaleString(lang === "ar" ? "ar-EG" : "en-US") : "—"}
            </span>
            <span className="t-caption text-fg-secondary">
              {t({ ar: "منتسبًا في المجتمع", en: "members & alumni" })}
            </span>
          </div>
          <div aria-hidden className="my-5 h-px w-full bg-border-strong" />
          <p className="t-body text-[14px]">
            {t({
              ar: "مجتمعٌ واحد ينمو كلّ أسبوع.",
              en: "One community, growing every week.",
            })}
          </p>
          <div aria-hidden className="my-5 h-px w-full bg-border-strong" />
          <div className="space-y-2">
            {[
              { label: t({ ar: "مستقلّون", en: "Freelancers" }), n: roleCounts?.freelancer },
              { label: t({ ar: "خرّيجون", en: "Graduates" }), n: roleCounts?.graduate },
              { label: t({ ar: "طلّاب", en: "Students" }), n: roleCounts?.student },
              // Show the remainder only when it exists, so the rows always sum to
              // the hero total above — the breakdown is never a partial figure.
              ...(roleCounts && roleCounts.other > 0
                ? [{ label: t({ ar: "أخرى", en: "Other" }), n: roleCounts.other }]
                : []),
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-[13.5px]">
                <span className="text-fg-secondary">{row.label}</span>
                <span className="font-mono font-medium text-foreground tnum">
                  {row.n != null ? row.n.toLocaleString(lang === "ar" ? "ar-EG" : "en-US") : "—"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2.5">
            <span aria-hidden className="inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
            <span className="text-[13px] font-semibold text-foreground">
              {t({ ar: "يُضاف أعضاء جدد أسبوعيًّا", en: "New members added weekly" })}
            </span>
          </div>
        </div>
      }
    >
      {/* Toolbar — THREE distinct zones: search · filter controls · primary
          action. The "Join as freelancer" CTA lives in its own zone (split off by
          a hairline on desktop, its own full-width line on mobile) so it never
          reads as just another filter chip. */}
      <div className="sticky top-[68px] z-30 -mx-4 px-4 py-3 mb-6 bg-[#0a0a0a]/85 backdrop-blur-xl border-b border-white/10 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        {/* Zone 1 — search */}
        <div className="relative lg:flex-1">
          <Search className="absolute end-4 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-faint pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={c.searchPlaceholder}
            aria-label={c.searchPlaceholder}
            className="w-full h-12 pe-11 ps-4 rounded-2xl bg-surface-2 border border-border-strong text-foreground text-[14px] placeholder-white/50 outline-none focus:border-primary/45 focus:bg-surface-2 transition-colors"
            data-testid="input-search-members"
          />
        </div>

        {/* Zone 2 — filter controls (change what you see) */}
        <div
          role="group"
          aria-label={t({ ar: "تصفية المنتسبين", en: "Filter members" })}
          className="flex items-center gap-1.5 flex-wrap"
        >
          {ROLE_FILTERS.map((f) => {
            const active = role === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setRole(f.key)}
                aria-pressed={active ? "true" : "false"}
                className={`min-h-[44px] sm:min-h-0 px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors border flex items-center justify-center gap-1.5 ${
                  active
                    ? "bg-primary/20 text-foreground border-primary/40"
                    : "bg-surface-2 text-fg-secondary border-border-strong hover:text-foreground hover:bg-surface-2"
                }`}
                data-testid={`filter-role-${f.key || "all"}`}
              >
                <span>{f.label}</span>
                {active && total !== null && (
                  <span className="text-[10.5px] text-muted-foreground tabular-nums">
                    {total.toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Zone 3 — primary action, its own zone (hairline-split on lg) */}
        <div className="lg:border-s lg:border-white/10 lg:ps-4">
          <Link
            href="/apply?type=freelancer"
            data-testid="members-join-freelancer"
            className="inline-flex w-full lg:w-auto items-center justify-center gap-1.5 rounded-full border border-primary/40 px-4 py-2 text-[12.5px] font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            {t({ ar: "انضمّ كفريلانسر", en: "Join as freelancer" })}
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </div>
      </div>

      {error && !rows && (
        <GlassCard className="p-6 text-center text-destructive">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-72 rounded-[24px] bg-white/[0.035] border border-border-strong animate-pulse"
            />
          ))}
        </div>
      ) : rows && rows.length === 0 ? (
        <EmptyState title={c.emptyTitle} hint={c.emptyHint} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Named section so the member cards' h3 names don't skip a level after the
              page h1 (WCAG 1.3.1). Redundant with the page title, so sr-only. */}
          <h2 className="sr-only">{t({ ar: "المنتسبون", en: "Community members" })}</h2>
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
        <nav className="flex items-center justify-center gap-2 mt-10" dir="ltr" aria-label={t({ ar: "ترقيم الصفحات", en: "Pagination" })}>
          <button
            type="button"
            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={page <= 1}
            aria-label={t({ ar: "الصفحة السابقة", en: "Previous page" })}
            className="inline-flex items-center justify-center min-h-[44px] sm:min-h-0 px-4 py-2 rounded-xl bg-surface-2 border border-border-strong text-fg-secondary text-[13px] font-semibold hover:bg-white/[0.11] disabled:opacity-35 disabled:cursor-not-allowed transition-all"
          ><span aria-hidden="true">←</span></button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | "…")[]>((acc, p, i, arr) => {
              if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
              acc.push(p); return acc;
            }, [])
            .map((p, i) => p === "…"
              ? <span key={`e${i}`} className="text-fg-faint text-[13px] px-1">…</span>
              : <button key={p} type="button" onClick={() => { setPage(p as number); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  aria-label={t({ ar: `الصفحة ${p}`, en: `Page ${p}` })}
                  aria-current={p === page ? "page" : undefined}
                  className={`w-9 h-9 max-sm:w-11 max-sm:h-11 rounded-xl text-[13px] font-semibold transition-all ${p === page ? "bg-primary-cta text-white" : "bg-surface-2 border border-border-strong text-fg-secondary hover:bg-white/[0.11]"}`}
                >{p}</button>
            )}
          <button
            type="button"
            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={page >= totalPages}
            aria-label={t({ ar: "الصفحة التالية", en: "Next page" })}
            className="inline-flex items-center justify-center min-h-[44px] sm:min-h-0 px-4 py-2 rounded-xl bg-surface-2 border border-border-strong text-fg-secondary text-[13px] font-semibold hover:bg-white/[0.11] disabled:opacity-35 disabled:cursor-not-allowed transition-all"
          ><span aria-hidden="true">→</span></button>
        </nav>
      )}
    </PageShell>
  );
}

function MemberCard({ m, worksLabel }: { m: Member; worksLabel: string }) {
  const { lang, t } = useLanguage();
  const initials = m.fullName.split(/\s+/).slice(0, 2).map((p) => p[0]).join("");
  const skills = splitTags(m.skills).slice(0, 5);

  return (
    <Link
      href={`/u/${m.id}`}
      className="group block h-full"
      data-testid={`member-card-${m.id}`}
    >
      <GlassCard className="group spectral-edge h-full p-6 hover:border-primary/45 transition-colors flex flex-col">
        <SpotlightOverlay />
        <div className="flex items-start gap-4 mb-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/40 overflow-hidden flex items-center justify-center text-[20px] font-bold text-foreground shadow-[0_8px_30px_-12px_rgba(220,38,55,0.55)]">
              {m.avatarUrl ? (
                <img loading="lazy" decoding="async" src={m.avatarUrl} alt={m.fullName} className="w-full h-full object-cover" />
              ) : (
                initials || "·"
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono font-semibold mb-1.5 ${
                ROLE_BADGE[m.role] ?? "bg-white/[0.06] text-fg-secondary border-border-strong"
              }`}
            >
              {ROLE_LABELS[m.role]}
            </span>
            <h3 className="text-foreground font-bold text-[16.5px] leading-tight truncate group-hover:text-primary transition-colors">
              {m.fullName}
            </h3>
            {m.jobTitle && (
              <div className="text-fg-secondary text-[12.5px] mt-1 truncate flex items-center gap-1.5">
                <Briefcase className="w-3 h-3 shrink-0" />
                <span className="truncate">{m.jobTitle}</span>
              </div>
            )}
          </div>
        </div>

        {m.bio ? (
          <p className="text-fg-secondary text-[13px] leading-[1.85] line-clamp-3 mb-4 flex-1">
            {m.bio}
          </p>
        ) : (
          <p className="text-muted-foreground text-[13px] italic mb-4 flex-1">
            {t({ ar: "لا توجد نبذة بعد.", en: "No bio yet." })}
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
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="font-semibold tabular-nums">
              {m.worksCount.toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
            </span>
            <span className="text-muted-foreground">{worksLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            {m.linkedinUrl && (
              <span className="w-7 h-7 rounded-full bg-surface-2 border border-border-strong flex items-center justify-center text-muted-foreground">
                <Linkedin className="w-3 h-3" />
              </span>
            )}
            {m.githubUrl && (
              <span className="w-7 h-7 rounded-full bg-surface-2 border border-border-strong flex items-center justify-center text-muted-foreground">
                <Github className="w-3 h-3" />
              </span>
            )}
            {m.portfolioUrl && (
              <span className="w-7 h-7 rounded-full bg-surface-2 border border-border-strong flex items-center justify-center text-muted-foreground">
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
