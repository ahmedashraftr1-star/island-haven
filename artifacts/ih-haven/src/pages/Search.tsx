import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { Search as SearchIcon, ArrowLeft, X, Award, Rocket, Layers, BookOpen, Users } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { EASE_OUT_EXPO } from "@/lib/motion";

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
  const reduce = useReducedMotion();
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
      <div className="relative mb-6">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t({ ar: "اكتب اسمًا، مهارة، أو موضوعًا…", en: "Type a name, skill, or topic…" })}
          className="peer w-full h-16 ps-12 pe-12 rounded-2xl bg-surface-2 border border-border-strong text-foreground text-[16px] tracking-tight placeholder-fg-faint shadow-soft outline-none transition-colors focus:border-primary/50"
          data-testid="input-global-search"
        />
        <SearchIcon
          className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-fg-faint transition-colors peer-focus:text-primary"
          aria-hidden
        />
        {q.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              inputRef.current?.focus();
            }}
            aria-label={t({ ar: "مسح البحث", en: "Clear search" })}
            className="absolute end-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Live result tally — cerulean data accent, hairline-set above the rows. */}
      <div className="flex items-center gap-3 mb-8 min-h-[1.25rem]" aria-live="polite">
        <span className="hairline flex-1" aria-hidden />
        {results && total > 0 ? (
          <span className="text-[12px] tracking-[0.18em] uppercase text-accent-2 font-semibold tabular-nums rtl:tracking-normal">
            {lang === "ar"
              ? `${total} ${total === 1 ? "نتيجة" : "نتائج"}`
              : `${total} ${total === 1 ? "result" : "results"}`}
          </span>
        ) : (
          <span className="text-[12px] tracking-[0.18em] uppercase text-fg-faint font-semibold rtl:tracking-normal">
            {t({ ar: "الحاضنة كاملةً", en: "The whole incubator" })}
          </span>
        )}
      </div>

      {error && <GlassCard className="p-5 text-destructive text-center">{error}</GlassCard>}

      {q.trim().length < 2 ? (
        <EmptyState
          title={t({ ar: "ابدأ البحث", en: "Start searching" })}
          hint={t({ ar: "اكتب حرفين على الأقلّ لعرض النتائج.", en: "Type at least two characters to see results." })}
        />
      ) : loading && !results ? (
        <div className="space-y-2.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[4.25rem] rounded-2xl border border-border-strong skeleton-shimmer"
              style={{ opacity: 1 - i * 0.14 }}
            />
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
        <div className="space-y-12">
          {CATEGORIES.map((c) => {
            const items = r[c.key];
            if (!items?.length) return null;
            const Icon = c.icon;
            return (
              <section key={c.key}>
                {/* Category header — editorial caption row, hairline-set, cerulean count. */}
                <div className="flex items-baseline gap-3 pb-3 mb-3.5 border-b border-border-strong/60">
                  <Icon className="w-4 h-4 text-primary self-center shrink-0" aria-hidden />
                  <h2 className="text-foreground font-bold text-[12px] tracking-[0.16em] uppercase rtl:tracking-normal rtl:text-[14px]">
                    {t(c.label)}
                  </h2>
                  <span className="text-accent-2 text-[12px] font-semibold tabular-nums">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((h, i) => (
                    <motion.div
                      key={`${c.key}-${h.id}`}
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={reduce ? undefined : { opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: Math.min(i, 5) * 0.04, ease: EASE_OUT_EXPO }}
                    >
                      <Link
                        href={c.to(h)}
                        className="group flex items-center gap-4 rounded-2xl p-3.5 bg-surface-2 border border-border-strong shadow-soft hover:border-primary/40 transition-colors"
                        data-testid={`search-hit-${c.key}-${h.id}`}
                      >
                        {h.avatarUrl ? (
                          <img loading="lazy" decoding="async" src={h.avatarUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-border-strong shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-primary-soft border border-border-strong flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-primary" aria-hidden />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-foreground font-semibold text-[14.5px] tracking-tight truncate group-hover:text-primary transition-colors">
                            {h.title}
                          </div>
                          {h.subtitle ? (
                            <div className="text-muted-foreground text-[12.5px] truncate mt-0.5">{h.subtitle}</div>
                          ) : null}
                        </div>
                        <ArrowLeft className="w-4 h-4 text-fg-faint group-hover:text-primary transition-all shrink-0 ltr:rotate-180 rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1 rtl:group-hover:translate-x-1" />
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
