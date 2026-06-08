import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Users, Star } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import { VENTURE_STAGE_LABELS, type VentureStage } from "@/lib/labels";

interface Venture {
  id: number;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string | null;
  coverUrl: string | null;
  websiteUrl: string;
  founderName: string;
  sector: string;
  stage: VentureStage;
  foundedYear: number;
  teamSize: number;
  featured: boolean;
}

export default function Ventures() {
  const [rows, setRows] = useState<Venture[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "المشاريع الناشئة — Island Haven";
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<{ ventures: Venture[] }>("/ventures")
      .then((r) => !cancelled && setRows(r.ventures))
      .catch(
        (e) =>
          !cancelled &&
          setError(e instanceof ApiError ? e.message : "تعذّر التحميل"),
      );
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell
      active="ventures"
      eyebrow="صُنِع في آيلاند"
      title="المشاريع"
      highlight="الناشئة"
      subtitle="مشاريع وُلدت ونمت داخل مساحتنا — من فكرة على ورقة إلى منتجات تخدم النّاس وتصنع فرص عمل في غزّة."
    >
      {error && (
        <GlassCard className="p-5 text-red-200 text-center">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-[24px] h-72 bg-white/[0.035] border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : rows && rows.length === 0 ? (
        <EmptyState
          title="قريبًا — أوّل دفعة مشاريع"
          hint="نعمل مع روّاد الأعمال على إطلاق مشاريعهم. تابعنا."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rows?.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
            >
              <GlassCard className="h-full flex flex-col hover:border-primary/40 transition-colors">
                {v.coverUrl ? (
                  <div className="aspect-[16/9] overflow-hidden bg-black/30">
                    <img src={v.coverUrl} alt={v.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
                )}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-2.5">
                    {v.logoUrl ? (
                      <img src={v.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/70 font-bold">
                        {v.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-white font-bold text-[16px] truncate">{v.name}</h3>
                        {v.featured && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />}
                      </div>
                      <span className="text-[11px] text-primary/90 font-medium">
                        {VENTURE_STAGE_LABELS[v.stage]}
                        {v.sector ? ` · ${v.sector}` : ""}
                      </span>
                    </div>
                  </div>
                  {v.tagline && (
                    <p className="text-white/65 text-[13px] leading-[1.7] mb-2">{v.tagline}</p>
                  )}
                  {v.description && (
                    <p className="text-white/45 text-[12.5px] leading-[1.7] line-clamp-3 mb-4">{v.description}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between text-[12px] text-white/55 pt-3 border-t border-white/[0.06]">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-primary/80" />
                      {v.teamSize} في الفريق
                      {v.foundedYear ? ` · ${v.foundedYear}` : ""}
                    </span>
                    {v.websiteUrl && (
                      <a
                        href={v.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-white/65 hover:text-primary transition-colors font-semibold"
                      >
                        زيارة <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
