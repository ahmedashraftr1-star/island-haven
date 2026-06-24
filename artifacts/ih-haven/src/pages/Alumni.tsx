import { motion } from "framer-motion";
import { GraduationCap, ArrowLeft, Layers, ExternalLink, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { Link } from "wouter";

interface Story {
  id: number;
  personName: string;
  role: string;
  quote: string;
  avatarUrl: string | null;
  ventureName: string;
  featured: boolean;
}

interface Cohort {
  id: number;
  name: string;
  slug: string;
  season: string;
  description: string;
  status: string;
  memberCount?: number;
  startDate?: string;
  endDate?: string;
}

interface Venture {
  id: number;
  name: string;
  logoUrl: string | null;
  tagline: string;
  category: string;
  website: string;
}

const IMPACT_STATS = [
  {
    label: { ar: "خرّيج وخرّيجة", en: "graduates" },
    value: { ar: "٤٨+", en: "48+" },
    icon: GraduationCap,
  },
  {
    label: { ar: "مشروع أُطلق", en: "ventures launched" },
    value: { ar: "٣٢+", en: "32+" },
    icon: TrendingUp,
  },
  {
    label: { ar: "دُفعة مكتملة", en: "cohorts completed" },
    value: { ar: "٦", en: "6" },
    icon: Layers,
  },
];

export default function Alumni() {
  const { t } = useLanguage();
  const storiesQuery = useQuery({
    queryKey: ["stories"],
    queryFn: () => api<{ stories: Story[] }>("/stories"),
    staleTime: 60_000,
  });

  const cohortsQuery = useQuery({
    queryKey: ["cohorts-public"],
    queryFn: () => api<{ cohorts: Cohort[] }>("/cohorts"),
    staleTime: 60_000,
  });

  const venturesQuery = useQuery({
    queryKey: ["ventures"],
    queryFn: () => api<{ ventures: Venture[] }>("/ventures"),
    staleTime: 60_000,
  });

  const stories = storiesQuery.data?.stories ?? [];
  const cohorts = (cohortsQuery.data?.cohorts ?? []).filter(
    (c) => c.status === "completed" || c.status === "ended",
  );
  const ventures = (venturesQuery.data?.ventures ?? []).slice(0, 9);

  return (
    <PageShell
      eyebrow={t({ ar: "Alumni · خرّيجو الحاضنة", en: "Alumni" })}
      title={t({
        ar: "خرّيجون صنعوا الفارق",
        en: "Graduates who made a difference",
      })}
      subtitle={t({
        ar: "منتسبون سابقون أكملوا رحلتهم مع آيلاند هيفن وانطلقوا نحو السوق.",
        en: "Former members who completed their journey with Island Haven and launched into the market.",
      })}
    >
      <div className="space-y-14">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {IMPACT_STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard className="p-6 text-center">
                  <Icon className="w-6 h-6 text-primary/60 mx-auto mb-2" />
                  <div className="text-[32px] font-black text-white leading-none mb-1">{t(stat.value)}</div>
                  <div className="text-[12px] text-white/65 font-medium">{t(stat.label)}</div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {/* Past Cohorts */}
        {cohorts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[11px] font-bold text-primary/60 tracking-widest uppercase mb-1">Graduated Cohorts</div>
                <h2 className="text-[20px] font-bold text-white">
                  {t({ ar: "الدُّفعات المكتملة", en: "Completed cohorts" })}
                </h2>
              </div>
              <Link href="/cohorts" className="text-[13px] text-white/60 hover:text-primary transition-colors flex items-center gap-1.5">
                {t({ ar: "كل الدُّفعات", en: "All cohorts" })} <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cohorts.map((cohort, i) => (
                <motion.div
                  key={cohort.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link href={`/cohorts/${cohort.slug}`}>
                    <GlassCard className="p-5 hover:border-primary/30 transition-all group cursor-pointer">
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Layers className="w-5 h-5 text-primary/70" />
                        </div>
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/20">
                          {t({ ar: "مكتمل", en: "Completed" })}
                        </span>
                      </div>
                      <h3 className="text-[15px] font-bold text-white mt-3 mb-1">{cohort.name}</h3>
                      <p className="text-[12px] text-white/60 line-clamp-2">{cohort.description}</p>
                      <div className="mt-3 flex items-center gap-1.5 text-primary text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        {t({ ar: "عرض الدُّفعة", en: "View cohort" })} <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                      </div>
                    </GlassCard>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Ventures from Alumni */}
        {ventures.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[11px] font-bold text-primary/60 tracking-widest uppercase mb-1">Portfolio</div>
                <h2 className="text-[20px] font-bold text-white">
                  {t({ ar: "مشاريع الخرّيجين", en: "Alumni ventures" })}
                </h2>
              </div>
              <Link href="/ventures" className="text-[13px] text-white/60 hover:text-primary transition-colors flex items-center gap-1.5">
                {t({ ar: "كل المشاريع", en: "All ventures" })} <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ventures.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GlassCard className="p-5 flex items-start gap-4 hover:border-primary/20 transition-all">
                    {v.logoUrl ? (
                      <img src={v.logoUrl} alt={v.name} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-white/60">{v.name[0]}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold text-white leading-tight">{v.name}</div>
                      <div className="text-[12px] text-white/60 mt-0.5 truncate">{v.tagline}</div>
                      {v.website && (
                        <a
                          href={v.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-[11px] text-primary/60 hover:text-primary transition-colors"
                        >
                          {t({ ar: "زيارة الموقع", en: "Visit site" })} <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Stories from Alumni */}
        {stories.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[11px] font-bold text-primary/60 tracking-widest uppercase mb-1">Testimonials</div>
                <h2 className="text-[20px] font-bold text-white">
                  {t({ ar: "بكلماتهم", en: "In their words" })}
                </h2>
              </div>
              <Link href="/stories" className="text-[13px] text-white/60 hover:text-primary transition-colors flex items-center gap-1.5">
                {t({ ar: "كل القصص", en: "All stories" })} <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stories.slice(0, 4).map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <GlassCard className="p-5">
                    <p className="text-[14px] text-white/65 italic leading-relaxed mb-4">"{s.quote}"</p>
                    <div className="flex items-center gap-3">
                      {s.avatarUrl ? (
                        <img src={s.avatarUrl} alt={s.personName} className="w-9 h-9 rounded-xl object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                          <span className="text-base font-bold text-primary">{s.personName[0]}</span>
                        </div>
                      )}
                      <div>
                        <div className="text-[13px] font-bold text-white">{s.personName}</div>
                        <div className="text-[11px] text-white/60">{s.role} · {s.ventureName}</div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="text-center py-8">
          <h3 className="text-[20px] font-bold text-white mb-2">
            {t({ ar: "أنت التالي؟", en: "Are you next?" })}
          </h3>
          <p className="text-white/65 text-[14px] mb-5">
            {t({
              ar: "انضم لمجتمع خرّيجي آيلاند هيفن وابدأ مشروعك.",
              en: "Join the Island Haven alumni community and start your venture.",
            })}
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-white font-semibold text-[14px] hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            {t({ ar: "قدّم الآن", en: "Apply now" })}
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
