import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
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

const TYPE_LABELS: Record<string, string> = {
  "full-time": "دوام كامل",
  "part-time": "دوام جزئي",
  remote: "عن بُعد",
  contract: "عقد مؤقت",
  internship: "تدريب",
};

const CAT_LABELS: Record<string, string> = {
  all: "الكل",
  tech: "تقنية",
  design: "تصميم",
  marketing: "تسويق",
  sales: "مبيعات",
  operations: "عمليات",
  finance: "مالية",
  other: "أخرى",
};

const TYPE_COLORS: Record<string, string> = {
  "full-time": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "part-time": "bg-blue-500/15 text-blue-400 border-blue-500/20",
  remote: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  contract: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  internship: "bg-rose-500/15 text-rose-400 border-rose-500/20",
};

function JobCard({ job, index }: { job: Job; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <GlassCard className="p-5 hover:border-primary/30 transition-all duration-300 group">
        <div className="flex items-start gap-4">
          {job.companyLogoUrl ? (
            <img
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
                {TYPE_LABELS[job.type] ?? job.type}
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
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:text-primary/80 transition-colors"
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

  const jobs = data?.jobs ?? [];
  const filtered = jobs.filter((j) => {
    const matchCat = activeCategory === "all" || j.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      j.title.toLowerCase().includes(q) ||
      j.companyName.toLowerCase().includes(q) ||
      j.description.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });
  // Featured roles surface first, preserving original order within each group.
  const ordered = [...filtered].sort(
    (a, b) => Number(b.featured) - Number(a.featured),
  );

  const categories = ["all", ...Array.from(new Set(jobs.map((j) => j.category)))];

  return (
    <PageShell
      eyebrow={t(jp.eyebrow)}
      title={t(jp.title)}
      highlight={t(jp.highlight)}
      subtitle={t(jp.subtitle)}
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
                className={`px-4 py-1.5 rounded-full text-[12.5px] font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "bg-surface-2 text-muted-foreground hover:text-fg-secondary border border-border-strong"
                }`}
              >
                {CAT_LABELS[cat] ?? cat}
                {cat !== "all" && (
                  <span className="mr-1.5 opacity-60">
                    ({jobs.filter((j) => j.category === cat).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        {!isLoading && (
          <div className="text-[13px] text-muted-foreground">
            {filtered.length} {lang === "en" ? "jobs available" : "وظيفة متاحة"}
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
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20">
            <Briefcase className="w-12 h-12 text-foreground/10 mx-auto mb-4" />
            <p className="text-foreground text-[15px] font-semibold mb-2">{t(jp.empty)}</p>
            <p className="text-muted-foreground text-[13px]">{lang === "en" ? "Check back later or follow us to stay updated." : "ارجع لاحقاً أو تابعنا للبقاء على اطّلاع."}</p>
          </div>
        )}

        {/* Jobs */}
        {!isLoading && ordered.length > 0 && (
          <div className="space-y-3">
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
          <a
            href="https://wa.me/972567536815"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[13px] font-semibold hover:bg-primary/20 transition-colors"
          >
            تواصل معنا
          </a>
        </div>

        {/* Become a member */}
        <div className="text-center">
          <p className="text-muted-foreground text-[13px] mb-3">
            الأعضاء المسجّلون يحصلون على إشعار فوري بكل وظيفة جديدة.
          </p>
          <Link
            href="/apply"
            className="text-[13px] text-primary hover:text-primary/80 font-medium underline underline-offset-2 transition-colors"
          >
            انضم للحاضنة ←
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
