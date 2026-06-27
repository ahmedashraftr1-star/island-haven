import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowLeft, Star, Clock, Users, Search, X, Briefcase } from "lucide-react";
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
      lang === "ar" ? "مرشدو آيلاند — Island Haven" : "Island Haven Mentors";
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
      title={t({ ar: "مرشدو", en: "Island Haven" })}
      highlight={t({ ar: "آيلاند", en: "Mentors" })}
      subtitle={t({
        ar: "ثلاثة فِرَق من المرشدين وروّاد الأعمال والمتخصّصين — يرافقونك جلسةً بعد جلسة، حتّى تتحوّل الفكرة إلى مشروع، والمشروع إلى أثر.",
        en: "Three teams of mentors, founders, and specialists — with you session after session, turning ideas into ventures and ventures into impact.",
      })}
    >
      {error && (
        <GlassCard className="p-5 text-primary text-center">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <SkeletonExperts />
      ) : rows && rows.length === 0 ? (
        <EmptyState
          title={t({ ar: "سيُعلَن عن المرشدين قريبًا", en: "Mentors coming soon" })}
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
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-surface-2 border border-border-strong shadow-soft">
              <Briefcase className="w-3.5 h-3.5 text-primary" />
              <span className="text-[13px] text-fg-secondary">
                <span className="text-foreground font-bold tabular-nums">
                  {num(total, lang)}
                </span>{" "}
                {t({ ar: "خبيرًا", en: "experts" })}
              </span>
            </div>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-surface-2 border border-border-strong shadow-soft">
              <span className="relative flex h-2 w-2">
                {!reduce && (
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500/70 animate-ping" />
                )}
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[13px] text-fg-secondary">
                <span className="text-emerald-700 font-bold tabular-nums">
                  {num(availableCount, lang)}
                </span>{" "}
                {t({ ar: "يستقبل جلسات الآن", en: "available now" })}
              </span>
            </div>
            {featuredCount > 0 && (
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-surface-2 border border-border-strong shadow-soft">
                <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                <span className="text-[13px] text-fg-secondary">
                  <span className="text-primary font-bold tabular-nums">
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
              <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t({ ar: "ابحث عن خبير…", en: "Search experts…" })}
                className="w-full bg-surface-2 border border-border-strong shadow-soft rounded-2xl ps-10 pe-9 py-2.5 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
                dir={dir}
                data-testid="expert-search"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={t({ ar: "مسح البحث", en: "Clear search" })}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                      ? "cta-fill border-transparent"
                      : "bg-surface-2 text-fg-secondary border-border-strong hover:border-primary/40 hover:text-foreground"
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
                        ? "cta-fill border-transparent"
                        : "bg-surface-2 text-fg-secondary border-border-strong hover:border-primary/40 hover:text-foreground"
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
              title={t({ ar: "لا يوجد مرشدون مطابقون", en: "No matching mentors" })}
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
            <div className="rounded-[24px] bg-surface-2 border border-border-strong shadow-soft p-8 sm:p-12">
              <div className="flex flex-col gap-6 text-start lg:flex-row lg:items-center lg:justify-between lg:gap-12">
                <div className="max-w-2xl">
                  <h3
                    className="text-foreground font-bold"
                    style={{ fontSize: "clamp(1.3rem, 3vw, 1.85rem)", lineHeight: 1.1, letterSpacing: "-0.025em" }}
                  >
                    {t({
                      ar: "كن مرشداً في آيلاند",
                      en: "Become a Mentor at Island Haven",
                    })}
                  </h3>
                  <p className="text-fg-secondary text-[14.5px] leading-relaxed mt-3">
                    {t({
                      ar: "شارك خبرتك مع الجيل القادم من روّاد الأعمال — انضمّ إلى شبكة المرشدين، واترك أثرًا يبقى.",
                      en: "Share your expertise with the next generation of founders — join the mentor network and leave a lasting impact.",
                    })}
                  </p>
                </div>
                <Link
                  href="/become-mentor"
                  data-testid="become-mentor-cta"
                  className="group flex-shrink-0 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full cta-fill font-bold text-[14px] transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-16px_hsl(354_82%_30%_/_0.55)]"
                >
                  {t({ ar: "كن مرشداً", en: "Become a Mentor" })}
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 rtl:rotate-180" />
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
            WebkitTextStroke: "1.25px hsl(var(--primary) / 0.12)",
            color: "transparent",
          }}
        >
          {idx(team.index, lang)}
        </span>
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <h2
              className="text-foreground font-bold"
              style={{ fontSize: "clamp(1.3rem, 3vw, 1.85rem)", letterSpacing: "-0.025em" }}
            >
              {t(team.title)}
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-primary bg-primary/12 border border-primary/30">
              <Users className="w-3 h-3" />
              {num(experts.length, lang)}
            </span>
          </div>
          <p className="text-fg-secondary text-[13.5px] leading-[1.8] max-w-xl">
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
          } transition-[border-color,box-shadow] duration-300 group-hover:border-primary/40 group-hover:shadow-[0_24px_56px_-22px_hsl(354_82%_30%_/_0.30)]`}
        >
          {/* Warm radial glow that blooms on hover */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background:
                "radial-gradient(130% 90% at 85% 0%, hsl(354 80% 55% / 0.07), transparent 60%)",
            }}
          />

          {e.featured && (
            <div className="relative inline-flex items-center gap-1.5 self-start mb-4 px-2.5 py-0.5 rounded-full text-[10px] tracking-[0.16em] uppercase font-bold bg-primary/12 text-primary border border-primary/30">
              <Star className="w-3 h-3 fill-primary text-primary" />{" "}
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
                } rounded-2xl object-cover border border-border`}
                loading="lazy"
              />
            ) : (
              <div
                className={`${
                  isLead ? "w-20 h-20 text-[1.9rem]" : "w-16 h-16 text-2xl"
                } shrink-0 rounded-2xl ring-1 ring-border-strong shadow-soft flex items-center justify-center font-display font-black text-white select-none transition-transform duration-300 group-hover:scale-[1.06]`}
                style={{ background: "linear-gradient(140deg, hsl(var(--primary)) 0%, hsl(var(--primary-pressed)) 100%)" }}
              >
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3
                className={`text-foreground font-bold leading-snug truncate ${
                  isLead ? "text-[18px]" : "text-[16px]"
                }`}
              >
                {e.fullName}
              </h3>
              {e.headline && (
                <p className="text-primary text-[12.5px] font-medium leading-snug line-clamp-2 mt-0.5">
                  {e.headline}
                </p>
              )}
              {e.ratingCount > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                  <Star className="w-3 h-3 fill-sand text-sand" />
                  <span className="text-[11.5px] text-foreground font-bold tabular-nums">
                    {e.ratingAvg?.toFixed(1)}
                  </span>
                  <span className="text-[10.5px] text-muted-foreground">
                    ({num(e.ratingCount, lang)})
                  </span>
                </div>
              )}
            </div>
            {e.yearsExperience > 0 && (
              <div className="shrink-0 text-center self-start">
                <div
                  className={`font-black text-sand ${isLead ? "text-[22px]" : "text-[18px]"}`}
                  style={{ letterSpacing: "-0.04em" }}
                >
                  {num(e.yearsExperience, lang)}+
                </div>
                <div className="text-[9px] tracking-widest text-muted-foreground font-bold -mt-0.5">
                  {t({ ar: "سنة خبرة", en: "yrs exp" })}
                </div>
              </div>
            )}
          </div>

          {isLead && e.bio && (
            <p className="relative text-fg-secondary text-[13px] leading-[1.75] line-clamp-2 mb-4">
              {e.bio}
            </p>
          )}

          {areas.length > 0 && (
            <div className="relative flex flex-wrap gap-1.5 mb-5">
              {areas.map((a) => (
                <span
                  key={a}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surface-3 text-fg-secondary border border-border"
                >
                  {a}
                </span>
              ))}
            </div>
          )}

          <div className="relative mt-auto flex items-center justify-between pt-3.5 border-t border-border">
            {e.acceptingSessions ? (
              <span className="inline-flex items-center gap-2 text-[11.5px] text-emerald-700 font-medium">
                <span className="relative flex h-2 w-2">
                  {!reduce && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500/60 animate-ping" />
                  )}
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                {t({ ar: "متاح للحجز", en: "Available" })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />{" "}
                {t({ ar: "غير متاح حاليًا", en: "Unavailable" })}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[12.5px] text-fg-secondary group-hover:text-primary transition-colors font-semibold">
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
            className="h-8 w-32 rounded-full bg-surface-3 border border-border animate-pulse"
          />
        ))}
      </div>
      {[0, 1].map((s) => (
        <div key={s}>
          <div className="h-7 w-48 rounded-lg bg-surface-3 animate-pulse mb-6" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-[24px] h-56 bg-surface-2 border border-border-strong shadow-soft animate-pulse"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
