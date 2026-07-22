import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Btn } from "@/components/ui/Btn";
import { I18N } from "@/lib/i18n";
import {
  Briefcase,
  MapPin,
  Clock,
  ArrowLeft,
  Star,
  Search,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { api } from "@/lib/api";
import { Link } from "wouter";
import { GLOBAL_JOBS } from "@/data/globalJobs";

interface Job {
  id: number;
  title: string;
  companyName: string;
  companyLogoUrl: string | null;
  location: string;
  type: string;
  category: string;
  description: string;
  requirements: string;
  salaryRange: string;
  applyUrl: string;
  featured: boolean;
  createdAt: string;
}

const TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  "full-time": { ar: "دوام كامل", en: "Full-time" },
  "part-time": { ar: "دوام جزئي", en: "Part-time" },
  remote: { ar: "عن بُعد", en: "Remote" },
  contract: { ar: "عقد مؤقت", en: "Contract" },
  internship: { ar: "تدريب", en: "Internship" },
};

const CAT_LABELS: Record<string, { ar: string; en: string }> = {
  all: { ar: "الكل", en: "All" },
  tech: { ar: "تقنية", en: "Tech" },
  design: { ar: "تصميم", en: "Design" },
  marketing: { ar: "تسويق", en: "Marketing" },
  data: { ar: "بيانات", en: "Data" },
  sales: { ar: "مبيعات", en: "Sales" },
  operations: { ar: "عمليات", en: "Operations" },
  finance: { ar: "مالية", en: "Finance" },
  security: { ar: "أمن", en: "Security" },
  translation: { ar: "ترجمة", en: "Translation" },
  admin: { ar: "إدارة", en: "Admin" },
  management: { ar: "إدارة برامج", en: "Program management" },
  training: { ar: "تدريب", en: "Training" },
  other: { ar: "أخرى", en: "Other" },
};

const TYPE_COLORS: Record<string, string> = {
  "full-time": "bg-white/[0.06] text-fg-secondary border-border-strong",
  "part-time": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  remote: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  contract: "bg-white/[0.06] text-fg-secondary border-border-strong",
  internship: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

function JobCard({ job, index }: { job: Job; index: number }) {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <GlassCard className="p-5 hover:border-primary/30 transition-all duration-300 group">
        <div className="flex items-start gap-4">
          {job.companyLogoUrl ? (
            <img loading="lazy" decoding="async"
              src={job.companyLogoUrl}
              alt={job.companyName}
              className="w-12 h-12 rounded-xl object-cover border border-border-strong flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0 border border-border-strong">
              <span className="text-xl font-bold text-muted-foreground">{job.companyName[0]}</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-[15px] font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                {job.title}
                {job.featured && <Star className="w-3.5 h-3.5 text-amber-400 fill-current inline-block mr-1.5" />}
              </h3>
              <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${TYPE_COLORS[job.type] ?? "bg-surface-2 text-muted-foreground border-border-strong"}`}>
                {TYPE_LABELS[job.type] ? t(TYPE_LABELS[job.type]) : job.type}
              </span>
            </div>

            <div className="text-[13px] font-medium text-muted-foreground mb-2">{job.companyName}</div>

            {job.description && (
              <p className="text-[13px] text-fg-secondary line-clamp-2 leading-relaxed mb-3">
                {job.description}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {job.location}
                </span>
                {job.salaryRange && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {job.salaryRange}
                  </span>
                )}
              </div>

              {job.applyUrl ? (
                <a
                  href={job.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary-bright hover:text-primary/80 transition-colors"
                >
                  قدّم الآن <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                </a>
              ) : (
                <span className="text-[12px] text-muted-foreground">تواصل مع الشركة</span>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export default function Jobs() {
  const { lang, t } = useLanguage();
  const jp = I18N.pages.jobs;
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => api<{ jobs: Job[] }>("/jobs"),
    staleTime: 60_000,
  });

  // The /jobs board is API-driven; we widen it "to the whole world" by merging in a
  // curated set of international/remote roles (frontend-only — server is off-limits).
  const jobs: Job[] = useMemo(() => [...(data?.jobs ?? []), ...GLOBAL_JOBS], [data]);
  const remoteCount = useMemo(() => jobs.filter((j) => j.type === "remote").length, [jobs]);
  const localCount = jobs.length - remoteCount;
  const nf = (n: number) => n.toLocaleString(lang === "ar" ? "ar-EG" : "en-US");
  // Featured roles surface first, preserving original order within each group. Memoised so
  // a keystroke in the search box doesn't re-filter and re-sort the whole list every render.
  const ordered = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = jobs.filter((j) => {
      const matchCat = activeCategory === "all" || j.category === activeCategory;
      const matchSearch =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.companyName.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
    return [...filtered].sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [jobs, activeCategory, search]);

  // One pass for the category list + per-category counts — was an O(categories × jobs)
  // filter re-run inside the button map on every render/keystroke.
  const { categories, catCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const j of jobs) counts[j.category] = (counts[j.category] ?? 0) + 1;
    return { categories: ["all", ...Object.keys(counts)], catCounts: counts };
  }, [jobs]);

  return (
    <PageShell
      eyebrow={t(jp.eyebrow)}
      title={t(jp.title)}
      highlight={t(jp.highlight)}
      subtitle={t(jp.subtitle)}
      heroAside={
        <div className="rounded-[18px] border border-border-strong bg-surface-2/40 p-7 sm:p-8">
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary-bright rtl:tracking-normal">
            {t({ ar: "وظائف مفتوحة", en: "Open positions" })}
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span
              className="font-mono font-black text-sand-bright tnum leading-none"
              style={{ fontSize: "clamp(2.8rem,6vw,4rem)" }}
            >
              {nf(jobs.length)}
            </span>
            <span className="t-caption text-fg-secondary">{t({ ar: "وظيفة مفتوحة", en: "roles open" })}</span>
          </div>
          <div aria-hidden className="my-5 h-px w-full bg-border-strong" />
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="font-mono font-bold text-foreground tnum text-[22px] leading-none">{nf(remoteCount)}</dt>
              <dd className="t-caption text-fg-secondary mt-1.5">{t({ ar: "فرصة عن بُعد", en: "remote roles" })}</dd>
            </div>
            <div>
              <dt className="font-mono font-bold text-foreground tnum text-[22px] leading-none">{nf(localCount)}</dt>
              <dd className="t-caption text-fg-secondary mt-1.5">{t({ ar: "فرصة محلّيّة", en: "local roles" })}</dd>
            </div>
          </dl>
          <div aria-hidden className="my-5 h-px w-full bg-border-strong" />
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
            <span className="text-[13px] font-semibold text-foreground">{t({ ar: "تُضاف فرص جديدة أسبوعيًّا", en: "New roles added weekly" })}</span>
          </div>
        </div>
      }
    >
      <div className="space-y-7">
        {/* Search + Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-faint pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(jp.searchPlaceholder)}
              aria-label={t(jp.searchPlaceholder)}
              className="w-full h-12 pr-11 pl-5 rounded-2xl bg-surface-2 border border-border-strong text-foreground placeholder:text-muted-foreground text-[14px] focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                aria-pressed={activeCategory === cat ? "true" : "false"}
                className={`inline-flex items-center justify-center min-h-[44px] sm:min-h-0 px-4 py-1.5 rounded-full text-[12.5px] font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-primary-cta text-white shadow-lg shadow-primary/20"
                    : "bg-surface-2 text-muted-foreground hover:text-fg-secondary border border-border-strong"
                }`}
              >
                {CAT_LABELS[cat] ? t(CAT_LABELS[cat]) : cat}
                {cat !== "all" && (
                  <span className="mr-1.5 opacity-90">
                    ({catCounts[cat] ?? 0})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        {!isLoading && (
          <div className="text-[13px] text-muted-foreground">
            {ordered.length} {lang === "en" ? "jobs available" : "وظيفة متاحة"}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-surface-2 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && ordered.length === 0 && (
          <div className="text-center py-20">
            <Briefcase className="w-12 h-12 text-foreground/10 mx-auto mb-4" />
            <p className="text-foreground text-[15px] font-semibold mb-2">{t(jp.empty)}</p>
            <p className="text-muted-foreground text-[13px]">{lang === "en" ? "Check back later or follow us to stay updated." : "ارجع لاحقاً أو تابعنا للبقاء على اطّلاع."}</p>
          </div>
        )}

        {/* Jobs */}
        {!isLoading && ordered.length > 0 && (
          <div className="space-y-3">
            {/* Named section so each JobCard's h3 title doesn't skip a level after the
                page h1 (WCAG 1.3.1). Redundant with the page title, so sr-only. */}
            <h2 className="sr-only">{t({ ar: "الفرص المتاحة", en: "Open opportunities" })}</h2>
            {ordered.map((job, i) => (
              <JobCard key={job.id} job={job} index={i} />
            ))}
          </div>
        )}

        {/* Post a job CTA */}
        <div className="rounded-2xl border border-border-strong bg-surface-2 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-[15px] font-bold text-foreground mb-1">هل لديك وظيفة تودّ نشرها؟</h3>
            <p className="text-[13px] text-muted-foreground">شركاء آيلاند يمكنهم نشر فرصهم مجاناً لمجتمع الحاضنة.</p>
          </div>
          <Btn
            asChild
            variant="secondary"
            size="sm"
            className="shrink-0 bg-primary/10 border-primary/20 text-primary-bright backdrop-blur-none hover:bg-primary/20"
          >
            <a href="https://wa.me/972567536815" target="_blank" rel="noopener noreferrer">
              تواصل معنا
            </a>
          </Btn>
        </div>

        {/* Become a member */}
        <div className="text-center">
          <p className="text-muted-foreground text-[13px] mb-3">
            الأعضاء المسجّلون يحصلون على إشعار فوري بكل وظيفة جديدة.
          </p>
          <Link
            href="/apply"
            className="text-[13px] text-primary-bright hover:text-primary/80 font-medium underline underline-offset-2 transition-colors"
          >
            انضم للحاضنة ←
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
