import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Sparkles, Star, Clock,
  User, UserPlus, Briefcase, Search, X,
} from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import { splitTags } from "@/lib/labels";
import { useLanguage } from "@/contexts/LanguageContext";
import { I18N } from "@/lib/i18n";

export interface ExpertCard {
  id: number;
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  headline: string;
  expertise: string;
  bio: string;
  yearsExperience: number;
  languages: string;
  sessionMinutes: number;
  availabilityNote: string;
  acceptingSessions: boolean;
  featured: boolean;
  linkedinUrl: string;
  websiteUrl: string;
  status: string;
  createdAt: string;
}

const ACCENT_PALETTES = [
  { grad: "from-[#c9363a]/20 to-[#7a1a1c]/5", dot: "bg-[#c9363a]", tag: "bg-[#c9363a]/10 text-[#ff9a9b] border-[#c9363a]/20" },
  { grad: "from-[#1a6cff]/20 to-[#0a3080]/5", dot: "bg-[#1a6cff]", tag: "bg-[#1a6cff]/10 text-[#90b8ff] border-[#1a6cff]/20" },
  { grad: "from-[#0aad6e]/20 to-[#065c3a]/5", dot: "bg-emerald-500", tag: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
  { grad: "from-[#8b5cf6]/20 to-[#4c1d95]/5", dot: "bg-violet-500", tag: "bg-violet-500/10 text-violet-300 border-violet-500/20" },
  { grad: "from-[#f59e0b]/20 to-[#78350f]/5", dot: "bg-amber-500", tag: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
  { grad: "from-[#06b6d4]/20 to-[#0e4058]/5", dot: "bg-cyan-500", tag: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20" },
];

export default function Experts() {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<ExpertCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const p = I18N.pages.experts;

  useEffect(() => {
    document.title = lang === "en" ? "Island Haven — Experts & Mentors" : "خبراء آيلاند — Island Haven";
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    api<{ experts: ExpertCard[] }>("/experts")
      .then((r) => { if (!cancelled) setRows(r.experts); })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "تعذّر تحميل الخبراء");
      });
    return () => { cancelled = true; };
  }, []);

  const allTags = useMemo(() => {
    if (!rows) return [];
    const freq: Record<string, number> = {};
    rows.forEach((e) => splitTags(e.expertise).forEach((t) => { freq[t] = (freq[t] ?? 0) + 1; }));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
  }, [rows]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    return rows.filter((e) => {
      const q = query.toLowerCase();
      const matchQuery = !q || e.fullName.toLowerCase().includes(q) || e.headline.toLowerCase().includes(q) || e.expertise.toLowerCase().includes(q);
      const matchTag = !activeTag || splitTags(e.expertise).includes(activeTag);
      return matchQuery && matchTag;
    });
  }, [rows, query, activeTag]);

  const featured = filtered?.filter((e) => e.featured) ?? [];
  const rest = filtered?.filter((e) => !e.featured) ?? [];
  const available = rows?.filter((e) => e.acceptingSessions).length ?? 0;

  return (
    <PageShell
      active="experts"
      eyebrow={t(p.eyebrow)}
      title={t(p.title)}
      highlight={t(p.highlight)}
      subtitle={t(p.subtitle)}
      maxWidth="max-w-7xl"
    >
      {/* Stats bar */}
      {rows && rows.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap gap-4 mb-8"
        >
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/10">
            <Briefcase className="w-3.5 h-3.5 text-primary" />
            <span className="text-[13px] text-white/70">
              <span className="text-white font-bold">{rows.length}</span>{" "}
              {lang === "en" ? "expert" : "خبير"}
            </span>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[13px] text-white/70">
              <span className="text-emerald-300 font-bold">{available}</span>{" "}
              {lang === "en" ? "available now" : "يستقبل جلسات الآن"}
            </span>
          </div>
          {featured.length > 0 && (
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/10">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-[13px] text-white/70">
                <span className="text-amber-300 font-bold">{rows.filter(e => e.featured).length}</span>{" "}
                {lang === "en" ? "featured" : "خبير مميّز"}
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* Search + filters */}
      {rows && rows.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-8 space-y-4"
        >
          <div className="relative max-w-md">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === "en" ? "Search by name or specialty…" : "ابحث بالاسم أو التخصّص…"}
              className="w-full bg-white/[0.05] border border-white/10 rounded-2xl ps-10 pe-9 py-2.5 text-[13.5px] text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/[0.07] transition-all"
              dir={lang === "ar" ? "rtl" : "ltr"}
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTag(null)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all ${!activeTag ? "bg-primary text-white border-primary" : "bg-white/[0.04] text-white/55 border-white/10 hover:border-white/25 hover:text-white/80"}`}
              >
                {lang === "en" ? "All" : "الكلّ"}
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all ${activeTag === tag ? "bg-primary text-white border-primary" : "bg-white/[0.04] text-white/55 border-white/10 hover:border-white/25 hover:text-white/80"}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {error && (
        <GlassCard className="p-5 text-red-200 text-center mb-6">{error}</GlassCard>
      )}

      {/* Loading skeletons */}
      {rows === null && !error && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-[24px] h-72 bg-white/[0.035] border border-white/10 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty filtered result */}
      {filtered !== null && filtered.length === 0 && (
        <EmptyState
          title={lang === "en" ? "No experts found" : "لا يوجد خبراء مطابقون"}
          hint={lang === "en" ? "Try a different search or filter" : "جرّب بحثاً أو تصفية مختلفة"}
          action={
            <button onClick={() => { setQuery(""); setActiveTag(null); }} className="mt-2 text-primary text-[13px] underline underline-offset-2">
              {lang === "en" ? "Clear filters" : "مسح الفلاتر"}
            </button>
          }
        />
      )}

      {/* Featured experts — large showcase cards */}
      <AnimatePresence mode="wait">
        {featured.length > 0 && (
          <motion.div
            key="featured"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-[11px] tracking-[0.18em] uppercase font-bold text-amber-300/80">
                {lang === "en" ? "Featured Experts" : "خبراء مميّزون"}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {featured.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                >
                  <FeaturedExpertCard e={e} index={i} lang={lang} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rest of experts — grid */}
      {rest.length > 0 && (
        <div>
          {featured.length > 0 && (
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <span className="text-[11px] tracking-[0.18em] uppercase font-bold text-white/30">
                {lang === "en" ? "All Experts" : "بقيّة الخبراء"}
              </span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.04 }}
              >
                <RegularExpertCard e={e} index={i + (featured.length)} lang={lang} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Become a Mentor CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-16"
      >
        <div className="relative overflow-hidden rounded-[32px] border border-primary/20 bg-gradient-to-br from-primary/8 via-white/[0.02] to-primary/4 p-8 sm:p-12">
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -top-16 -end-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row items-center gap-6 sm:gap-10 text-center sm:text-start">
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <UserPlus className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1" dir={lang === "ar" ? "rtl" : "ltr"}>
              <h3 className="text-white font-bold text-[20px] mb-2">
                {t(p.ctaHeading)}
              </h3>
              <p className="text-white/50 text-[14.5px] leading-relaxed max-w-lg">
                {t(p.ctaBody)}
              </p>
            </div>
            <Link
              href="/become-mentor"
              className="flex-shrink-0 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-primary text-white font-bold text-[14px] hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-8px_rgba(201,54,58,0.5)] transition-all"
            >
              {t(p.ctaButton)}
              {lang === "en" ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            </Link>
          </div>
        </div>
      </motion.div>
    </PageShell>
  );
}

function FeaturedExpertCard({ e, index, lang }: { e: ExpertCard; index: number; lang: string }) {
  const palette = ACCENT_PALETTES[index % ACCENT_PALETTES.length];
  const tags = splitTags(e.expertise).slice(0, 5);
  const initials = e.fullName.trim().split(" ").slice(0, 2).map((w) => w[0]).join("");

  return (
    <Link
      href={`/experts/${e.id}`}
      className="group block h-full"
      data-testid={`expert-card-${e.id}`}
    >
      <div className={`relative h-full rounded-[28px] bg-gradient-to-br ${palette.grad} border border-white/[0.09] hover:border-white/20 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_28px_60px_-16px_rgba(0,0,0,0.7)] p-6 flex flex-col`}>
        {/* Glow accent */}
        <div className={`pointer-events-none absolute -top-10 -end-10 w-48 h-48 rounded-full ${palette.dot} opacity-20 blur-3xl`} />

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="relative flex-shrink-0">
            {e.avatarUrl ? (
              <img
                src={e.avatarUrl}
                alt={e.fullName}
                className="w-16 h-16 rounded-2xl object-cover border border-white/15"
                loading="lazy"
              />
            ) : (
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${palette.grad} border border-white/15 flex items-center justify-center`}>
                <span className="text-2xl font-black text-white/40">{initials}</span>
              </div>
            )}
            {/* Availability pulse */}
            {e.acceptingSessions && (
              <span className="absolute -bottom-1 -end-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-[#0d1020]" />
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
              <span className="text-[10px] tracking-widest uppercase font-bold text-amber-300/80">
                {lang === "en" ? "Featured" : "مميّز"}
              </span>
            </div>
            <h3 className="text-white font-bold text-[17px] leading-tight">{e.fullName}</h3>
            {e.headline && (
              <p className="text-white/50 text-[12.5px] mt-0.5 line-clamp-1">{e.headline}</p>
            )}
          </div>
          {e.yearsExperience > 0 && (
            <div className="flex-shrink-0 text-center">
              <div className="text-[22px] font-black text-white/80" style={{ letterSpacing: "-0.04em" }}>
                {e.yearsExperience}+
              </div>
              <div className="text-[9px] tracking-widest uppercase text-white/35 font-bold -mt-0.5">
                {lang === "en" ? "yrs" : "سنة"}
              </div>
            </div>
          )}
        </div>

        {e.bio && (
          <p className="text-white/50 text-[13px] leading-[1.75] line-clamp-3 mb-4 flex-1">
            {e.bio}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((tag) => (
              <span key={tag} className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${palette.tag}`}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-white/[0.07]">
          <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${e.acceptingSessions ? "text-emerald-300/80" : "text-white/35"}`}>
            {e.acceptingSessions ? (
              <><Sparkles className="w-3.5 h-3.5" /> {lang === "en" ? "Accepting sessions" : "يستقبل جلسات"}</>
            ) : (
              <><Clock className="w-3.5 h-3.5" /> {lang === "en" ? "Unavailable" : "غير متاح"}</>
            )}
          </span>
          <span className="inline-flex items-center gap-1 text-[12.5px] text-white/50 group-hover:text-white font-semibold transition-colors">
            {lang === "en" ? "Full profile" : "الملف الكامل"}
            {lang === "en" ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />}
          </span>
        </div>
      </div>
    </Link>
  );
}

function RegularExpertCard({ e, index, lang }: { e: ExpertCard; index: number; lang: string }) {
  const palette = ACCENT_PALETTES[index % ACCENT_PALETTES.length];
  const tags = splitTags(e.expertise).slice(0, 4);
  const initials = e.fullName.trim().split(" ").slice(0, 2).map((w) => w[0]).join("");

  return (
    <Link
      href={`/experts/${e.id}`}
      className="group block h-full"
      data-testid={`expert-card-${e.id}`}
    >
      <GlassCard className="h-full flex flex-col p-5 hover:border-white/20 transition-all hover:-translate-y-0.5">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="relative flex-shrink-0">
            {e.avatarUrl ? (
              <img
                src={e.avatarUrl}
                alt={e.fullName}
                className="w-12 h-12 rounded-xl object-cover border border-white/10"
                loading="lazy"
              />
            ) : (
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${palette.grad} border border-white/10 flex items-center justify-center`}>
                <span className="text-lg font-black text-white/40">{initials}</span>
              </div>
            )}
            {e.acceptingSessions && (
              <span className="absolute -bottom-0.5 -end-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-[#0d1020]" />
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-[15px] leading-snug truncate">{e.fullName}</h3>
            {e.headline && (
              <p className="text-white/45 text-[12px] leading-snug mt-0.5 line-clamp-1">{e.headline}</p>
            )}
          </div>
          {e.yearsExperience > 0 && (
            <div className="flex-shrink-0 text-end">
              <div className="text-[18px] font-black text-white/60" style={{ letterSpacing: "-0.04em" }}>{e.yearsExperience}+</div>
              <div className="text-[9px] tracking-widest uppercase text-white/30 -mt-0.5">{lang === "en" ? "yrs" : "سنة"}</div>
            </div>
          )}
        </div>

        {e.bio && (
          <p className="text-white/45 text-[12.5px] leading-[1.7] line-clamp-2 mb-3 flex-1">
            {e.bio}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((tag) => (
              <span key={tag} className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium border ${palette.tag}`}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-medium ${e.acceptingSessions ? "text-emerald-300/70" : "text-white/35"}`}>
            {e.acceptingSessions
              ? <><Sparkles className="w-3 h-3" />{lang === "en" ? "Open" : "متاح"}</>
              : <><Clock className="w-3 h-3" />{lang === "en" ? "Unavailable" : "غير متاح"}</>
            }
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] text-white/40 group-hover:text-white/80 font-semibold transition-colors">
            {lang === "en" ? "Profile" : "الملف"}
            {lang === "en" ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />}
          </span>
        </div>
      </GlassCard>
    </Link>
  );
}
