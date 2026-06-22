import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Trophy, Award, Briefcase, Medal, Crown } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";

interface LeaderRow {
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  score: number;
  badgeCount: number;
  worksCount: number;
}

// Top-3 medal treatment — gold / silver / bronze.
const MEDALS: Record<
  number,
  { ring: string; chip: string; Icon: typeof Crown; label: { ar: string; en: string } }
> = {
  0: {
    ring: "ring-amber-400/60",
    chip: "bg-amber-400/15 text-amber-200 border-amber-400/40",
    Icon: Crown,
    label: { ar: "الأوّل", en: "1st" },
  },
  1: {
    ring: "ring-slate-300/50",
    chip: "bg-slate-300/10 text-slate-200 border-slate-300/30",
    Icon: Medal,
    label: { ar: "الثاني", en: "2nd" },
  },
  2: {
    ring: "ring-orange-400/50",
    chip: "bg-orange-400/12 text-orange-200 border-orange-400/30",
    Icon: Medal,
    label: { ar: "الثالث", en: "3rd" },
  },
};

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
// Localised numeral: Arabic-Indic in AR, Western digits in EN.
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export default function Leaderboard() {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title =
      lang === "ar" ? "الصدارة — Island Haven" : "Leaderboard — Island Haven";
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    api<{ leaderboard: LeaderRow[] }>("/leaderboard")
      .then((r) => !cancelled && setRows(r.leaderboard))
      .catch(
        (e) =>
          !cancelled &&
          setError(
            e instanceof ApiError
              ? e.message
              : lang === "ar"
                ? "تعذّر التحميل"
                : "Couldn't load the leaderboard",
          ),
      );
    return () => {
      cancelled = true;
    };
  }, [lang]);

  return (
    <PageShell
      active="leaderboard"
      eyebrow={t({ ar: "مجتمع يصنع الفرق", en: "A community making a difference" })}
      title={t({ ar: "لوحة", en: "Community" })}
      highlight={t({ ar: "الصدارة", en: "Leaderboard" })}
      subtitle={t({
        ar: "أكثر المنتسبين تأثيرًا في المجتمع — تُحتسب الصدارة من أعمالهم المنشورة والشارات التي حصدوها. انشر عملك واصنع أثرك لتصعد.",
        en: "The community's most impactful members — ranked by their published work and the badges they've earned. Publish your work, make your mark, and rise.",
      })}
    >
      {error && (
        <GlassCard className="p-5 text-red-200 text-center">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-[20px] h-[76px] bg-white/[0.035] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : rows && rows.length === 0 ? (
        <EmptyState
          title={t({ ar: "لا متصدّرين بعد", en: "No leaders yet" })}
          hint={t({
            ar: "كن أوّل من ينشر عملًا ويحصد شارة — وستظهر في الصدارة.",
            en: "Be the first to publish work and earn a badge — and you'll appear on the leaderboard.",
          })}
        />
      ) : (
        <div className="space-y-3">
          {rows?.map((r, i) => {
            const medal = MEDALS[i];
            return (
              <motion.div
                key={r.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.035 }}
              >
                <Link
                  href={`/u/${r.userId}`}
                  className="group block"
                  data-testid={`leader-row-${r.userId}`}
                >
                  <GlassCard
                    className={`flex items-center gap-4 p-4 sm:px-5 group-hover:border-primary/40 transition-colors ${
                      medal ? "border-white/[0.14]" : ""
                    }`}
                  >
                    {/* Rank */}
                    <div className="shrink-0 w-9 text-center">
                      {medal ? (
                        <medal.Icon
                          className={`w-6 h-6 mx-auto ${
                            i === 0
                              ? "text-amber-300"
                              : i === 1
                                ? "text-slate-200"
                                : "text-orange-300"
                          }`}
                        />
                      ) : (
                        <span className="text-white/45 font-bold text-[15px] tabular-nums">
                          {num(i + 1, lang)}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div
                      className={`shrink-0 w-11 h-11 rounded-full overflow-hidden bg-white/[0.06] border border-white/10 flex items-center justify-center ${
                        medal ? `ring-2 ${medal.ring}` : ""
                      }`}
                    >
                      {r.avatarUrl ? (
                        <img
                          src={r.avatarUrl}
                          alt={r.fullName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-[13px] font-bold text-white/70">
                          {initials(r.fullName)}
                        </span>
                      )}
                    </div>

                    {/* Name + stats */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold text-[15px] truncate group-hover:text-primary transition-colors">
                          {r.fullName}
                        </h3>
                        {medal && (
                          <span
                            className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${medal.chip}`}
                          >
                            {t(medal.label)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[12px] text-white/50">
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-primary/75" />
                          {num(r.worksCount, lang)}{" "}
                          {t({ ar: "عمل", en: "works" })}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-300/80" />
                          {num(r.badgeCount, lang)}{" "}
                          {t({ ar: "شارة", en: "badges" })}
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="shrink-0 text-left">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/12 border border-primary/25">
                        <Trophy className="w-3.5 h-3.5 text-primary" />
                        <span className="text-white font-extrabold text-[15px] tabular-nums">
                          {num(r.score, lang)}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/35 text-center mt-1 tracking-wide">
                        {t({ ar: "نقطة", en: "points" })}
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Scoring note */}
      {rows && rows.length > 0 && (
        <p className="text-center text-white/35 text-[12px] mt-8">
          {t({
            ar: "النقاط = عدد الأعمال + (عدد الشارات × ٣)",
            en: "Points = number of works + (number of badges × 3)",
          })}
        </p>
      )}
    </PageShell>
  );
}
