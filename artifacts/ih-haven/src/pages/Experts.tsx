import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowLeft, Star, Clock, Users } from "lucide-react";
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
  ratingAvg: number | null;
  ratingCount: number;
}

interface TeamMember {
  fullName: string;
  group: string;
}

type Variant = "lead" | "compact";

const TEAMS: {
  key: string;
  index: string;
  title: string;
  blurb: string;
  variant: Variant;
}[] = [
  {
    key: "leadership",
    index: "٠١",
    title: "القيادة",
    blurb: "الفريق المؤسّس الذي يقود الحاضنة، ويرافقك من الفكرة الأولى إلى الأثر.",
    variant: "lead",
  },
  {
    key: "mentors",
    index: "٠٢",
    title: "الإرشاد التقنيّ والمنتج",
    blurb: "مرشدون يبنون معك المنتج — هندسةً وتصميمًا ونموًّا.",
    variant: "compact",
  },
  {
    key: "advisors",
    index: "٠٣",
    title: "الاستشارات والأعمال",
    blurb: "مستشارون يفتحون لك أبواب التمويل والقانون والاستراتيجيّة.",
    variant: "compact",
  },
];

const FALLBACK_TEAM = {
  key: "_other",
  index: "٠٤",
  title: "خبراء آخرون",
  blurb: "نخبة إضافيّة من المرشدين في شبكة آيلاند.",
  variant: "compact" as Variant,
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

export default function Experts() {
  const [rows, setRows] = useState<ExpertCard[] | null>(null);
  const [groups, setGroups] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    document.title = "خبراء آيلاند — Island Haven";
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api<{ experts: ExpertCard[] }>("/experts"),
      api<{ team: TeamMember[] }>("/team").catch(() => ({ team: [] as TeamMember[] })),
    ])
      .then(([ex, tm]) => {
        if (cancelled) return;
        const g = new Map<string, string>();
        for (const t of tm.team) g.set(t.fullName.trim(), t.group);
        setGroups(g);
        setRows(ex.experts);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof ApiError ? e.message : "تعذّر تحميل الخبراء");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Partition experts into their teams (by name → group from /team), preserving
  // the API's featured/sortOrder ordering. Unmatched experts fall to the end.
  const buckets: Record<string, ExpertCard[]> = {};
  const extra: ExpertCard[] = [];
  for (const e of rows ?? []) {
    const g = groups.get(e.fullName.trim());
    if (g && TEAMS.some((t) => t.key === g)) {
      (buckets[g] ??= []).push(e);
    } else {
      extra.push(e);
    }
  }
  const sections = [
    ...TEAMS.filter((t) => (buckets[t.key]?.length ?? 0) > 0).map((t) => ({
      team: t,
      experts: buckets[t.key],
    })),
    ...(extra.length ? [{ team: FALLBACK_TEAM, experts: extra }] : []),
  ];
  const teamCount = sections.length;
  const total = rows?.length ?? 0;

  return (
    <PageShell
      active="experts"
      eyebrow="شبكة الخبراء · إرشاد فرديّ مَجّانيّ"
      title="خبراء"
      highlight="آيلاند"
      subtitle="ثلاثة فِرَق من المرشدين وروّاد الأعمال والمتخصّصين — يرافقونك جلسةً بعد جلسة، حتّى تتحوّل الفكرة إلى مشروع، والمشروع إلى أثر."
    >
      {error && (
        <GlassCard className="p-5 text-red-200 text-center">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <SkeletonExperts />
      ) : rows && rows.length === 0 ? (
        <EmptyState
          title="سيُعلَن عن الخبراء قريبًا"
          hint="نُجهّز شبكة من أفضل المرشدين لمجتمع آيلاند."
        />
      ) : (
        <>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap items-center gap-2.5 mb-14 sm:mb-16"
          >
            <Chip>{toArabicNum(total)} خبيرًا ومرشدًا</Chip>
            <Chip>{toArabicNum(teamCount)} فِرَق متخصّصة</Chip>
            <Chip>جلسات إرشاد مَجّانيّة</Chip>
          </motion.div>

          {sections.map(({ team, experts }) => (
            <TeamSection
              key={team.key}
              team={team}
              experts={experts}
              reduce={!!reduce}
            />
          ))}
        </>
      )}
    </PageShell>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[12.5px] font-medium text-white/70 bg-white/[0.04] border border-white/10">
      {children}
    </span>
  );
}

function TeamSection({
  team,
  experts,
  reduce,
}: {
  team: (typeof TEAMS)[number];
  experts: ExpertCard[];
  reduce: boolean;
}) {
  const isLead = team.variant === "lead";
  return (
    <section className="relative mb-16 sm:mb-24 last:mb-0">
      {/* Section header — oversized outlined index numeral as a quiet landmark */}
      <div className="relative mb-7 sm:mb-9">
        <span
          aria-hidden
          className="absolute -top-7 sm:-top-9 right-0 select-none font-black leading-none"
          style={{
            fontSize: "clamp(4.5rem, 13vw, 9rem)",
            WebkitTextStroke: "1.25px rgba(255,255,255,0.065)",
            color: "transparent",
          }}
        >
          {team.index}
        </span>
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <h2
              className="text-white font-bold"
              style={{ fontSize: "clamp(1.3rem, 3vw, 1.85rem)", letterSpacing: "-0.025em" }}
            >
              {team.title}
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-primary bg-primary/10 border border-primary/25">
              <Users className="w-3 h-3" />
              {toArabicNum(experts.length)}
            </span>
          </div>
          <p className="text-white/50 text-[13.5px] leading-[1.8] max-w-xl">
            {team.blurb}
          </p>
        </div>
      </div>

      <motion.div
        variants={reduce ? undefined : stagger}
        initial={reduce ? undefined : "hidden"}
        whileInView={reduce ? undefined : "show"}
        viewport={{ once: true, margin: "-8% 0px" }}
        className={
          isLead
            ? "grid sm:grid-cols-2 gap-5"
            : "grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        }
      >
        {experts.map((e) => (
          <ExpertCardView
            key={e.id}
            e={e}
            variant={team.variant}
            reduce={reduce}
          />
        ))}
      </motion.div>
    </section>
  );
}

function ExpertCardView({
  e,
  variant,
  reduce,
}: {
  e: ExpertCard;
  variant: Variant;
  reduce: boolean;
}) {
  const isLead = variant === "lead";
  const areas = splitTags(e.expertise).slice(0, isLead ? 4 : 3);
  const initials = e.fullName.trim().charAt(0) || "؟";

  return (
    <motion.div
      variants={reduce ? undefined : rise}
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="h-full"
    >
      <Link
        href={`/experts/${e.id}`}
        className="group relative block h-full"
        data-testid={`expert-card-${e.id}`}
      >
        <GlassCard
          className={`h-full flex flex-col ${
            isLead ? "p-7" : "p-6"
          } transition-colors duration-300 group-hover:border-primary/40 group-hover:bg-white/[0.06]`}
        >
          {/* Warm radial glow that blooms on hover */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background:
                "radial-gradient(130% 90% at 85% 0%, hsl(354 80% 55% / 0.12), transparent 60%)",
            }}
          />

          {e.featured && (
            <div className="relative inline-flex items-center gap-1.5 self-start mb-4 px-2.5 py-0.5 rounded-full text-[10px] tracking-[0.16em] uppercase font-bold bg-amber-400/10 text-amber-200 border border-amber-400/30">
              <Star className="w-3 h-3 fill-amber-300 text-amber-300" /> خبير مميّز
            </div>
          )}

          <div className="relative flex items-center gap-4 mb-4">
            {e.avatarUrl ? (
              <img
                src={e.avatarUrl}
                alt={e.fullName}
                className={`${
                  isLead ? "w-20 h-20" : "w-16 h-16"
                } rounded-2xl object-cover border border-white/10`}
                loading="lazy"
              />
            ) : (
              <div
                className={`${
                  isLead ? "w-20 h-20 text-[1.9rem]" : "w-16 h-16 text-2xl"
                } shrink-0 rounded-2xl bg-gradient-to-br from-primary/35 to-primary/[0.06] border border-white/10 flex items-center justify-center font-bold text-white/90 transition-transform duration-300 group-hover:scale-[1.06]`}
              >
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <h3
                className={`text-white font-bold leading-snug truncate ${
                  isLead ? "text-[18px]" : "text-[16px]"
                }`}
              >
                {e.fullName}
              </h3>
              {e.headline && (
                <p className="text-primary/90 text-[12.5px] font-medium leading-snug line-clamp-2 mt-0.5">
                  {e.headline}
                </p>
              )}
              {e.ratingCount > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                  <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                  <span className="text-[11.5px] text-white/85 font-bold tabular-nums">
                    {e.ratingAvg?.toFixed(1)}
                  </span>
                  <span className="text-[10.5px] text-white/40">
                    ({toArabicNum(e.ratingCount)})
                  </span>
                </div>
              )}
            </div>
          </div>

          {isLead && e.bio && (
            <p className="relative text-white/55 text-[13px] leading-[1.75] line-clamp-2 mb-4">
              {e.bio}
            </p>
          )}

          {areas.length > 0 && (
            <div className="relative flex flex-wrap gap-1.5 mb-5">
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

          <div className="relative mt-auto flex items-center justify-between pt-3.5 border-t border-white/[0.06]">
            {e.acceptingSessions ? (
              <span className="inline-flex items-center gap-2 text-[11.5px] text-emerald-200/85 font-medium">
                <span className="relative flex h-2 w-2">
                  {!reduce && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/60 animate-ping" />
                  )}
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                متاح للحجز
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11.5px] text-white/45">
                <Clock className="w-3.5 h-3.5" /> غير متاح حاليًا
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[12.5px] text-white/65 group-hover:text-primary transition-colors font-semibold">
              الملف الكامل
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </span>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}

function SkeletonExperts() {
  return (
    <div className="space-y-12">
      <div className="flex gap-2.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-8 w-32 rounded-full bg-white/[0.04] border border-white/10 animate-pulse"
          />
        ))}
      </div>
      {[0, 1].map((s) => (
        <div key={s}>
          <div className="h-7 w-48 rounded-lg bg-white/[0.05] animate-pulse mb-6" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-[24px] h-56 bg-white/[0.035] border border-white/10 animate-pulse"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
