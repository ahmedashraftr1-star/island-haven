import { motion } from "framer-motion";
import {
  TrendingUp,
  Globe,
  Users,
  Lightbulb,
  ArrowLeft,
  ExternalLink,
  Mail,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { api } from "@/lib/api";

interface Investor {
  id: number;
  name: string;
  logoUrl: string | null;
  websiteUrl: string;
  description: string;
  type: string;
  investmentFocus: string;
  status: string;
  sortOrder: number;
}

const TYPE_LABELS: Record<string, string> = {
  lead: "مستثمر رئيسي",
  angel: "مستثمر ملاك",
  vc: "صندوق رأس مال مخاطر",
  corporate: "شراكة مؤسسية",
  ngo: "منظمة دولية",
  individual: "مانح فردي",
};

const TYPE_COLORS: Record<string, string> = {
  lead: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  angel: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  vc: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  corporate: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  ngo: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  individual: "bg-white/10 text-white/50 border-white/10",
};

const WHY_ITEMS = [
  {
    icon: Globe,
    title: "وصول لسوق غير مستغَل",
    desc: "غزة سوق ناشئة بقاعدة شبابية هائلة وحاجة حقيقية للتكنولوجيا. المستثمرون الباكرون يدخلون بميزة تنافسية لا تُضاهى.",
  },
  {
    icon: Users,
    title: "رواد أعمال متحمّسون ومدرَّبون",
    desc: "نختار بعناية ونُدرّب منتسبينا على أعلى المعايير. مشاريعنا تُبنى لتدوم وتنمو.",
  },
  {
    icon: TrendingUp,
    title: "أثر مضاعف وعوائد حقيقية",
    desc: "استثمارك لا يُدرّ عوائداً مالية فحسب — بل يبني اقتصاداً، يخلق وظائف، ويُغيّر مسار مجتمع بأكمله.",
  },
  {
    icon: Lightbulb,
    title: "شبكة محليّة ودولية",
    desc: "انضم لشبكة من المستثمرين والشركاء الذين يؤمنون بقدرة الإنسان الغزاوي على الابتكار.",
  },
];

export default function Investors() {
  const { data, isLoading } = useQuery({
    queryKey: ["investors"],
    queryFn: () => api<{ investors: Investor[] }>("/investors"),
    staleTime: 60_000,
  });

  const investors = data?.investors ?? [];

  return (
    <PageShell
      eyebrow="Investors & Sponsors · الداعمون والمستثمرون"
      title="ابنِ معنا غزّة الجديدة"
      subtitle="نبحث عن شركاء يؤمنون بأنّ الاستثمار في الإنسان هو أعلى عوائد."
    >
      <div className="space-y-16">
        {/* Why Invest */}
        <section>
          <div className="text-center mb-10">
            <div className="text-[11px] font-bold text-primary/60 tracking-widest uppercase mb-2">Why Invest</div>
            <h2 className="text-[26px] font-black text-white">لماذا تستثمر في آيلاند؟</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {WHY_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.08 }}
                >
                  <GlassCard className="p-6 h-full">
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-[16px] font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-[13.5px] text-white/50 leading-relaxed">{item.desc}</p>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Current Investors */}
        <section>
          <div className="mb-6">
            <div className="text-[11px] font-bold text-primary/60 tracking-widest uppercase mb-1">Our Backers</div>
            <h2 className="text-[20px] font-bold text-white">مستثمرونا وداعمونا</h2>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-36 rounded-2xl bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && investors.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
              <p className="text-white/30 text-[14px]">يُعلَن عنهم قريباً.</p>
            </div>
          )}

          {!isLoading && investors.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {investors.map((inv, i) => (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <GlassCard className="p-5 h-full flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      {inv.logoUrl ? (
                        <img src={inv.logoUrl} alt={inv.name} className="w-12 h-12 rounded-xl object-cover border border-white/10 flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0 border border-white/[0.08]">
                          <span className="text-xl font-bold text-white/30">{inv.name[0]}</span>
                        </div>
                      )}
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${TYPE_COLORS[inv.type] ?? "bg-white/10 text-white/50 border-white/10"}`}>
                        {TYPE_LABELS[inv.type] ?? inv.type}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-[15px] font-bold text-white">{inv.name}</h3>
                      {inv.investmentFocus && (
                        <p className="text-[12px] text-white/40 mt-0.5">{inv.investmentFocus}</p>
                      )}
                    </div>

                    {inv.description && (
                      <p className="text-[13px] text-white/50 leading-relaxed flex-1">
                        {inv.description}
                      </p>
                    )}

                    {inv.websiteUrl && (
                      <a
                        href={inv.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[12px] text-primary/60 hover:text-primary transition-colors mt-auto"
                      >
                        زيارة الموقع <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Investment CTA */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] to-transparent p-10 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
              <TrendingUp className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-[24px] font-black text-white mb-3">
              مستعدّ للاستثمار في المستقبل؟
            </h3>
            <p className="text-[14px] text-white/50 max-w-lg mx-auto mb-7 leading-relaxed">
              سواء كنت مستثمراً ملاكاً أو مؤسسة أو شركة تبحث عن أثر حقيقي — نريد أن نسمع منك.
              تواصل معنا وسنشاركك كل ما تحتاجه.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <a
                href="mailto:invest@islandhaven.ps"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-primary text-white font-semibold text-[14px] hover:bg-primary/90 transition-colors shadow-xl shadow-primary/25"
              >
                <Mail className="w-4 h-4" />
                راسلنا الآن
              </a>
              <a
                href="https://wa.me/972567536815"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-white/15 text-white/70 font-medium text-[14px] hover:border-white/30 hover:text-white transition-all"
              >
                واتساب
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              </a>
            </div>
          </motion.div>
        </section>
      </div>
    </PageShell>
  );
}
