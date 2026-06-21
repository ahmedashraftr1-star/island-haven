import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowLeft, Star, Clock, Users, Search, X, UserPlus, Briefcase } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
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

interface Team {
  key: string;
  index: number;
  title: { ar: string; en: string };
  blurb: { ar: string; en: string };
  variant: Variant;
}

const TEAMS: Team[] = [
  {
    key: "leadership",
    index: 1,
    title: { ar: "القيادة", en: "Leadership" },
    blurb: {
      ar: "الفريق المؤسّس الذي يقود الحاضنة, ويرافقك من الفكرة الأولى إلى الأثر.",
      en: "The founding team steering the incubator — with you from first idea to lasting impact.",
    },
    variant: "lead",
  },
  {
    key: "mentors",
    index: 2,
    title: { ar: "الإرشاد التقنيّ والمنتج", en: "Tech & Product Mentors" },
    blurb: {
      ar: "مرشدون يبنون معك المنتج — هندسةً وتصميمًا ونموًّا.",
      en: "Mentors who build the product with you — engineering, design, and growth.",
    },
    variant: "compact",
  },
  {
    key: "advisors",
    index: 3,
    title: { ar: "الاستشارات والأعمال", en: "Business Advisors" },
    blurb: {
      ar: "مستشارون يفتحون لك أبواب التمويل والقانون والاستراتيجيّة.",
      en: "Advisors who open doors to funding, legal, and strategy.",
    },
    variant: "compact",
  },
];

const FALLBACK_TEAM: Team = {
  key: "_other",
  index: 4,
  title: { ar: "خبراء آخرون", en: "More Experts" },
  blurb: {
    ar: "نخبة إضافيّة من المرشدين في شبكة آيلاند.",
    en: "An additional roster of mentors across the Island Haven network.",
  },
  variant: "compact",
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
// Localised numeral: Arabic-Indic in AR, Western digits in EN.
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}
// Two-digit section index (٠١ / 01).
function idx(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n).padStart(2, "٠") : String(n).padStart(2, "0");
}

export default function Experts() {
  const { lang, dir, t } = useLanguage();
  const [rows, setRows] = useState<ExpertCard[] | null>(null);
  const [groups, setGroups] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    document.title =
      lang === "ar" ? "خبراء آيلاند — Island Haven" : "Experts — Island Haven";
  }, [lang]);

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
          setError(
            e instanceof ApiError
              ? e.message
              : lang === "ar"
                ? "تعذّر تحميل الخبراء"
                : "Couldn't load experts",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  // Top expertise tags by frequency (across all experts, unfiltered).
  const allTags = useMemo(() => {
    if (!rows) return [];
    const freq: Record<string, number> = {};
    for (const e of rows)
      for (const tg of splitTags(e.expertise)) freq[tg] = (freq[tg] ?? 0) + 1;
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tg]) => tg);
  }, [rows]);

  // Apply live search + active-tag filter to the expert list BEFORE partitioning
  // into team sections, so each section only shows matching experts.
  const filtered = useMemo(() => {
    if (!rows) return null;
    const q = query.trim().toLowerCase();
    return rows.filter((e) => {
      const matchQuery =
        !q ||
        e.fullName.toLowerCase().includes(q) ||
        (e.headline ?? "").toLowerCase().includes(q) ||
        (e.expertise ?? "").toLowerCase().includes(q);
      const matchTag = !activeTag || splitTags(e.expertise).includes(activeTag);
      return matchQuery && matchTag;
    });
  }, [rows, query, activeTag]);

  const isFiltering = query.trim().length > 0 || activeTag !== null;

  // Partition the filtered experts into their teams (by name → group from /team),
  // preserving the API's featured/sortOrder ordering. Unmatched fall to the end.
  const buckets: Record<string, ExpertCard[]> = {};
  const extra: ExpertCard[] = [];
  for (const e of filtered ?? []) {
    const g = groups.get(e.fullName.trim());
    if (g && TEAMS.some((tm) => tm.key === g)) {
      (buckets[g] ??= []).push(e);
    } else {
      extra.push(e);
    }
  }
  const sections = [
    ...TEAMS.filter((tm) => (buckets[tm.key]?.length ?? 0) > 0).map((tm) => ({
      team: tm,
      experts: buckets[tm.key],
    })),
    ...(extra.length ? [{ team: FALLBACK_TEAM, experts: extra }] : []),
  ];
  const total = rows?.length ?? 0;
  const availableCount = rows?.filter((e) => e.acceptingSessions).length ?? 0;
  const featuredCount = rows?.filter((e) => e.featured).length ?? 0;

  return (
    <PageShell
      active="experts"
      eyebrow={t({
        ar: "شبكة الخبراء · إرشاد فرديّ مَجّانيّ",
        en: "Expert Network · Free 1:1 Mentorship",
      })}
      title={t({ ar: "خبراء", en: "Island Haven" })}
      highlight={t({ ar: "آيلاند", en: "Experts" })}
      subtitle={t({
        ar: "ثلاثة فِرَق من المرشدين وروّاد الأعمال والمتخصّصين — يرافقونك جلسةً بعد جلسة، حتّى تتحوّل الفكرة إلى مشروع، والمشروع إلى أثر.",
        en: "Three teams of mentors, founders, and specialists — with you session after session, turning ideas into ventures and ventures into impact.",
      })}
    >
      {error && (
        <GlassCard className="p-5 text-red-200 text-center">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <SkeletonExperts />
      ) : rows && rows.length === 0 ? (
        <EmptyState
          title={t({ ar: "سيُعلَن عن الخبراء قريبًا", en: "Experts coming soon" })}
          hint={t({
            ar: "نُجهّز شبكة من أفضل المرشدين لمجتمع آيلاند.",
            en: "We're assembling a network of top mentors for the Island Haven community.",
          })}
        />
      ) : (
        <>
          {/* Stats bar — total / available now / featured */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex flex-wrap items-center gap-3 mb-6"
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/10">
              <Briefcase className="w-3.5 h-3.5 text-primary" />
              <span className="text-[13px] text-white/70">
                <span className="text-white font-bold tabular-nums">
                  {num(total, lang)}
                </span>{" "}
                {t({ ar: "خبيرًا", en: "experts" })}
              </span>
            </div>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/10">
              <span className="relative flex h-2 w-2">
                {!reduce && (
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/70 animate-ping" />
                )}
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[13px] text-white/70">
                <span className="text-emerald-300 font-bold tabular-nums">
                  {num(availableCount, lang)}
                </span>{" "}
                {t({ ar: "يستقبل جلسات الآن", en: "available now" })}
              </span>
            </div>
            {featuredCount > 0 && (
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/10">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-[13px] text-white/70">
                  <span className="text-amber-300 font-bold tabular-nums">
                    {num(featuredCount, lang)}
                  </span>{" "}
                  {t({ ar: "خبير مميّز", en: "featured" })}
                </span>
              </div>
            )}
          </motion.div>

          {/* Search + expertise filter chips */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="mb-12 sm:mb-14 space-y-4"
          >
            <div className="relative max-w-md">
              <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t({ ar: "ابحث عن خبير…", en: "Search experts…" })}
                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl ps-10 pe-9 py-2.5 text-[13.5px] text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/[0.07] transition-all"
                dir={dir}
                data-testid="expert-search"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={t({ ar: "مسح البحث", en: "Clear search" })}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTag(null)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                    !activeTag
                      ? "bg-primary text-white border-primary"
                      : "bg-white/[0.04] text-white/55 border-white/10 hover:border-white/25 hover:text-white/80"
                  }`}
                >
                  {t({ ar: "الكلّ", en: "All" })}
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                      activeTag === tag
                        ? "bg-primary text-white border-primary"
                        : "bg-white/[0.04] text-white/55 border-white/10 hover:border-white/25 hover:text-white/80"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Empty state when search/filter matches nothing */}
          {isFiltering && (filtered?.length ?? 0) === 0 ? (
            <EmptyState
              title={t({ ar: "لا يوجد خبراء مطابقون", en: "No matching experts" })}
              hint={t({
                ar: "جرّب بحثًا أو تصفيةً مختلفة.",
                en: "Try a different search or filter.",
              })}
              action={
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setActiveTag(null);
                  }}
                  className="mt-2 text-primary text-[13px] underline underline-offset-2"
                >
                  {t({ ar: "مسح الفلاتر", en: "Clear filters" })}
                </button>
              }
            />
          ) : (
            sections.map(({ team, experts }) => (
              <TeamSection
                key={team.key}
                team={team}
                experts={experts}
                reduce={!!reduce}
              />
            ))
          )}

          {/* Become a Mentor CTA */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.55 }}
            className="mt-16 sm:mt-20"
          >
            <div className="relative overflow-hidden rounded-[32px] border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-white/[0.02] to-primary/[0.04] p-8 sm:p-12">
              <div className="pointer-events-none absolute -top-16 -start-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative flex flex-col sm:flex-row items-center gap-6 sm:gap-10 text-center sm:text-start">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <UserPlus className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-[20px] mb-2">
                    {t({
                      ar: "كن مرشداً في آيلاند",
                      en: "Become a Mentor at Island Haven",
                    })}
                  </h3>
                  <p className="text-white/50 text-[14.5px] leading-relaxed max-w-lg">
                    {t({
                      ar: "شارك خبرتك مع الجيل القادم من روّاد الأعمال — انضمّ إلى شبكة المرشدين، واترك أثرًا يبقى.",
                      en: "Share your expertise with the next generation of founders — join the mentor network and leave a lasting impact.",
                    })}
                  </p>
                </div>
                <Link
                  href="/become-mentor"
                  data-testid="become-mentor-cta"
                  className="flex-shrink-0 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-primary text-white font-bold text-[14px] hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-8px_rgba(201,54,58,0.5)] transition-all"
                >
                  {t({ ar: "كن مرشداً", en: "Become a Mentor" })}
                  <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </PageShell>
  );
}

function TeamSection({
  team,
  experts,
  reduce,
}: {
  team: Team;
  experts: ExpertCard[];
  reduce: boolean;
}) {
  const { lang, t } = useLanguage();
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
          {idx(team.index, lang)}
        </span>
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <h2
              className="text-white font-bold"
              style={{ fontSize: "clamp(1.3rem, 3vw, 1.85rem)", letterSpacing: "-0.025em" }}
            >
              {t(team.title)}
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-primary bg-primary/10 border border-primary/25">
              <Users className="w-3 h-3" />
              {num(experts.length, lang)}
            </span>
          </div>
          <p className="text-white/50 text-[13.5px] leading-[1.8] max-w-xl">
            {t(team.blurb)}
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
  const { lang, t } = useLanguage();
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
              <Star className="w-3 h-3 fill-amber-300 text-amber-300" />{" "}
              {t({ ar: "خبير مميّز", en: "Featured" })}
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
            <div className="min-w-0 flex-1">
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
                    ({num(e.ratingCount, lang)})
                  </span>
                </div>
              )}
            </div>
            {e.yearsExperience > 0 && (
              <div className="shrink-0 text-center self-start">
                <div
                  className={`font-black text-white/80 ${isLead ? "text-[22px]" : "text-[18px]"}`}
                  style={{ letterSpacing: "-0.04em" }}
                >
                  {num(e.yearsExperience, lang)}+
                </div>
                <div className="text-[9px] tracking-widest text-white/35 font-bold -mt-0.5">
                  {t({ ar: "سنة خبرة", en: "yrs exp" })}
                </div>
              </div>
            )}
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
                {t({ ar: "متاح للحجز", en: "Available" })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11.5px] text-white/45">
                <Clock className="w-3.5 h-3.5" />{" "}
                {t({ ar: "غير متاح حاليًا", en: "Unavailable" })}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[12.5px] text-white/65 group-hover:text-primary transition-colors font-semibold">
              {t({ ar: "الملف الكامل", en: "Full profile" })}
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 ltr:rotate-180" />
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
