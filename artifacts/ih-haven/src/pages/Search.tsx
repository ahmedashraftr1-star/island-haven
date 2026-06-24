import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Search as SearchIcon, ArrowLeft, Award, Rocket, Layers, BookOpen, Users } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";

interface Hit {
  id: number;
  title: string;
  subtitle: string;
  avatarUrl?: string | null;
  type?: string;
}
interface Results {
  experts: Hit[];
  ventures: Hit[];
  programs: Hit[];
  courses: Hit[];
  members: Hit[];
}

const CATEGORIES: {
  key: keyof Results;
  label: { ar: string; en: string };
  icon: typeof Award;
  to: (h: Hit) => string;
}[] = [
  { key: "experts", label: { ar: "الخبراء", en: "Experts" }, icon: Award, to: (h) => `/experts/${h.id}` },
  { key: "ventures", label: { ar: "المشاريع", en: "Ventures" }, icon: Rocket, to: (h) => `/ventures/${h.id}` },
  { key: "programs", label: { ar: "البرامج", en: "Programs" }, icon: Layers, to: (h) => `/programs/${h.id}` },
  { key: "courses", label: { ar: "الكورسات والورشات", en: "Courses & Workshops" }, icon: BookOpen, to: (h) => `/courses/${h.id}` },
  { key: "members", label: { ar: "المنتسبون", en: "Members" }, icon: Users, to: (h) => `/u/${h.id}` },
];

const EMPTY: Results = { experts: [], ventures: [], programs: [], courses: [], members: [] };

export default function Search() {
  const { lang, t } = useLanguage();
  const [q, setQ] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get("q") ?? "";
    } catch {
      return "";
    }
  });
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = lang === "ar" ? "بحث — آيلاند هيفن" : "Search — Island Haven";
    inputRef.current?.focus();
  }, [lang]);

  // Debounced search.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      let cancelled = false;
      api<Results & { q: string }>(`/search?q=${encodeURIComponent(term)}`)
        .then((r) => {
          if (cancelled) return;
          setResults({
            experts: r.experts ?? [],
            ventures: r.ventures ?? [],
            programs: r.programs ?? [],
            courses: r.courses ?? [],
            members: r.members ?? [],
          });
          setError(null);
        })
        .catch((e) => {
          if (!cancelled) setError(e instanceof ApiError ? e.message : t({ ar: "تعذّر البحث", en: "Search failed" }));
        })
        .finally(() => !cancelled && setLoading(false));
      return () => {
        cancelled = true;
      };
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const total = results
    ? CATEGORIES.reduce((n, c) => n + (results[c.key]?.length ?? 0), 0)
    : 0;
  const r = results ?? EMPTY;

  return (
    <PageShell
      eyebrow={t({ ar: "ابحث في الحاضنة · Search", en: "Search the incubator" })}
      title={t({ ar: "بحث", en: "Global" })}
      highlight={t({ ar: "شامل", en: "Search" })}
      subtitle={t({
        ar: "ابحث في الخبراء، المشاريع، البرامج، الكورسات، والمنتسبين — كلّ شيء من مكان واحد.",
        en: "Search experts, ventures, programs, courses, and members — all from one place.",
      })}
      maxWidth="max-w-3xl"
    >
      <div className="relative mb-8">
        <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/45 pointer-events-none" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t({ ar: "اكتب اسمًا، مهارة، أو موضوعًا…", en: "Type a name, skill, or topic…" })}
          className="w-full h-14 pe-12 ps-4 rounded-2xl bg-white/[0.05] border border-white/10 text-white text-[15px] placeholder-white/50 outline-none focus:border-primary/50 focus:bg-white/[0.07] transition-colors"
          data-testid="input-global-search"
        />
      </div>

      {error && <GlassCard className="p-5 text-red-200 text-center">{error}</GlassCard>}

      {q.trim().length < 2 ? (
        <EmptyState
          title={t({ ar: "ابدأ البحث", en: "Start searching" })}
          hint={t({ ar: "اكتب حرفين على الأقلّ لعرض النتائج.", en: "Type at least two characters to see results." })}
        />
      ) : loading && !results ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/[0.035] border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : results && total === 0 ? (
        <EmptyState
          title={t({ ar: "لا نتائج", en: "No results" })}
          hint={
            lang === "ar"
              ? `لم نجد شيئًا لـ «${q.trim()}». جرّب كلمة أخرى.`
              : `Nothing found for “${q.trim()}”. Try another term.`
          }
        />
      ) : (
        <div className="space-y-9">
          {CATEGORIES.map((c) => {
            const items = r[c.key];
            if (!items?.length) return null;
            const Icon = c.icon;
            return (
              <section key={c.key}>
                <div className="flex items-center gap-2.5 mb-3">
                  <Icon className="w-4 h-4 text-primary" />
                  <h2 className="text-white font-bold text-[15.5px]">{t(c.label)}</h2>
                  <span className="text-white/60 text-[12px] tabular-nums">({items.length})</span>
                </div>
                <div className="space-y-2.5">
                  {items.map((h, i) => (
                    <motion.div
                      key={`${c.key}-${h.id}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: Math.min(i, 5) * 0.03 }}
                    >
                      <Link
                        href={c.to(h)}
                        className="group flex items-center gap-3.5 rounded-2xl p-3.5 bg-white/[0.04] border border-white/[0.08] hover:border-primary/40 hover:bg-white/[0.06] transition-colors"
                        data-testid={`search-hit-${c.key}-${h.id}`}
                      >
                        {h.avatarUrl ? (
                          <img src={h.avatarUrl} alt="" className="w-11 h-11 rounded-xl object-cover border border-white/10 shrink-0" />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/30 to-primary/5 border border-white/10 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-primary/80" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-white font-semibold text-[14px] truncate group-hover:text-primary transition-colors">
                            {h.title}
                          </div>
                          {h.subtitle ? (
                            <div className="text-white/50 text-[12.5px] truncate">{h.subtitle}</div>
                          ) : null}
                        </div>
                        <ArrowLeft className="w-4 h-4 text-white/55 group-hover:text-primary group-hover:-translate-x-1 transition-all shrink-0" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
