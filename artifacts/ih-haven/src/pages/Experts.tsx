import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Star, Clock } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import { splitTags } from "@/lib/labels";

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

export default function Experts() {
  const [rows, setRows] = useState<ExpertCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "خبراء آيلاند — Island Haven";
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<{ experts: ExpertCard[] }>("/experts")
      .then((r) => {
        if (!cancelled) setRows(r.experts);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "تعذّر تحميل الخبراء");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell
      active="experts"
      eyebrow="إرشاد · خبرة · شبكة علاقات"
      title="خبراء"
      highlight="آيلاند"
      subtitle="نخبة من المرشدين وروّاد الأعمال والمتخصّصين — احجز جلسة إرشاد فرديّة مَجّانًا، وحوّل فكرتك إلى مشروع، ومشروعك إلى أثر."
    >
      {error && (
        <GlassCard className="p-5 text-red-200 text-center">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-[24px] h-64 bg-white/[0.035] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : rows && rows.length === 0 ? (
        <EmptyState
          title="سيُعلَن عن الخبراء قريبًا"
          hint="نُجهّز شبكة من أفضل المرشدين لمجتمع آيلاند."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rows?.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
            >
              <ExpertCardView e={e} />
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function ExpertCardView({ e }: { e: ExpertCard }) {
  const areas = splitTags(e.expertise).slice(0, 4);
  const initials = e.fullName.trim().charAt(0) || "؟";
  return (
    <Link
      href={`/experts/${e.id}`}
      className="group block h-full"
      data-testid={`expert-card-${e.id}`}
    >
      <GlassCard className="h-full flex flex-col p-6 hover:border-primary/40 transition-colors">
        {e.featured && (
          <div className="inline-flex items-center gap-1.5 self-start mb-4 px-2.5 py-0.5 rounded-full text-[10px] tracking-[0.16em] uppercase font-bold bg-amber-400/10 text-amber-200 border border-amber-400/30">
            <Star className="w-3 h-3 fill-amber-300 text-amber-300" /> خبير مميّز
          </div>
        )}
        <div className="flex items-center gap-4 mb-4">
          {e.avatarUrl ? (
            <img
              src={e.avatarUrl}
              alt={e.fullName}
              className="w-16 h-16 rounded-2xl object-cover border border-white/10"
              loading="lazy"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 border border-white/10 flex items-center justify-center text-2xl font-bold text-white/80">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-white font-bold text-[16px] leading-snug truncate">
              {e.fullName}
            </h3>
            {e.headline && (
              <p className="text-primary/90 text-[12.5px] font-medium leading-snug line-clamp-2 mt-0.5">
                {e.headline}
              </p>
            )}
          </div>
        </div>

        {e.bio && (
          <p className="text-white/55 text-[13px] leading-[1.7] line-clamp-3 mb-4">
            {e.bio}
          </p>
        )}

        {areas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {areas.map((a) => (
              <span
                key={a}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.05] text-white/70 border border-white/10"
              >
                {a}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-white/50">
            {e.acceptingSessions ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-emerald-200/80">يستقبل جلسات</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5" />
                <span>غير متاح حاليًا</span>
              </>
            )}
          </span>
          <span className="inline-flex items-center gap-1 text-[12.5px] text-white/65 group-hover:text-primary transition-colors font-semibold">
            الملف الكامل
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </span>
        </div>
      </GlassCard>
    </Link>
  );
}
