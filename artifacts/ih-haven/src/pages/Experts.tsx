import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowLeft, Star, Clock, Users, Search, X, Briefcase, Globe2, MessageSquare, Compass } from "lucide-react";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
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
// First-initial medallion glyph (crimson, never a faint placeholder).
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase() || "؟";
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
        ar: "شبكة المرشدين · إرشاد فرديّ مَجّانيّ",
        en: "Mentor Network · Free 1:1 Mentorship",
      })}
      title={t({ ar: "مرشدو", en: "Island Haven" })}
      highlight={t({ ar: "آيلاند", en: "Mentors" })}
      subtitle={t({
        ar: "جلسات فرديّة مع مؤسّسين وخبراء ومتخصّصين من حول العالم — يرافقونك جلسةً بعد جلسة، حتّى تتحوّل الفكرة إلى مشروع، والمشروع إلى أثر. نؤمن أنّ الموهبة لا تحدّها الجغرافيا.",
        en: "1:1 sessions with founders, experts, and specialists worldwide — with you session after session, turning ideas into ventures and ventures into impact. Talent isn't bound by geography.",
      })}
    >
      {error && (
        <GlassCard className="p-5 text-primary text-center">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <SkeletonExperts />
      ) : rows && rows.length === 0 ? (
        <MentorsEmptyState reduce={!!reduce} />
      ) : (
        <>
          {/* Value framing band — the promise of 1:1 mentorship without borders */}
          <ValueBand
            total={total}
            availableCount={availableCount}
            featuredCount={featuredCount}
            reduce={!!reduce}
          />

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
                placeholder={t({ ar: "ابحث عن مرشد…", en: "Search mentors…" })}
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
            <div className="relative text-center py-16 sm:py-24">
              <div className="ambient-grid absolute inset-0 -z-10" aria-hidden />
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 border border-primary/30 mb-5 ring-edge">
                <Search className="w-5 h-5 text-primary" aria-hidden />
              </div>
              <div className="text-foreground text-[16px] font-semibold mb-1">
                {t({ ar: "لا يوجد مرشدون مطابقون", en: "No matching mentors" })}
              </div>
              <div className="text-muted-foreground text-[13.5px]">
                {t({
                  ar: "جرّب بحثًا أو تصفيةً مختلفة — أو كن أنت المرشد القادم.",
                  en: "Try a different search or filter — or become the next mentor.",
                })}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setActiveTag(null);
                  }}
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-full border border-border-strong bg-surface-2 text-fg-secondary text-[13px] font-semibold hover:border-primary/40 hover:text-foreground transition-colors"
                >
                  {t({ ar: "مسح الفلاتر", en: "Clear filters" })}
                </button>
                <Link
                  href="/become-mentor?ref=experts-no-match"
                  className="group inline-flex items-center gap-2 h-10 px-5 rounded-full cta-fill text-[13px] font-bold transition-transform duration-200 hover:-translate-y-0.5"
                >
                  {t({ ar: "كن مرشدًا", en: "Become a mentor" })}
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
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
          <BecomeMentorCTA reduce={!!reduce} />
        </>
      )}
    </PageShell>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   ValueBand — the promise of Island Haven mentorship, told the editorial way:
   one quiet line of proof figures (cerulean numerals), then three pillars of
   what a session is. No icon-tile grid — a hairline-divided ledger.
   ────────────────────────────────────────────────────────────────────────── */
function ValueBand({
  total,
  availableCount,
  featuredCount,
  reduce,
}: {
  total: number;
  availableCount: number;
  featuredCount: number;
  reduce: boolean;
}) {
  const { lang, t } = useLanguage();

  const pillars = [
    {
      icon: MessageSquare,
      title: t({ ar: "جلسة فرديّة، مَجّانًا", en: "A free 1:1 session" }),
      body: t({
        ar: "احجز وقتًا مع مرشد يستمع لمشروعك ويأخذ بيدك — لا رسوم، لا شروط.",
        en: "Book time with a mentor who hears your project and takes you forward — no fees, no strings.",
      }),
    },
    {
      icon: Globe2,
      title: t({ ar: "خبرة بلا حدود جغرافيّة", en: "Expertise without borders" }),
      body: t({
        ar: "مؤسّسون وبُناة ومتخصّصون من حول العالم — لأنّ الموهبة لا تحدّها الجغرافيا.",
        en: "Founders, builders and specialists worldwide — because talent isn't bound by geography.",
      }),
    },
    {
      icon: Compass,
      title: t({ ar: "من الفكرة إلى الأثر", en: "From idea to impact" }),
      body: t({
        ar: "إرشاد عمليّ في الهندسة والتصميم والأعمال — يرافقك حتّى يوم العرض.",
        en: "Practical guidance across engineering, design and business — all the way to Demo Day.",
      }),
    },
  ];

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12 sm:mb-16"
    >
      {/* Live proof figures — cerulean numerals, hairline ledger */}
      <div className="flex flex-wrap items-center gap-x-7 gap-y-3 mb-8">
        <Figure value={total} lang={lang} label={t({ ar: "مرشدًا في الشبكة", en: "mentors in the network" })} />
        <span aria-hidden className="hidden sm:block h-8 w-px bg-border-strong" />
        <div className="inline-flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            {!reduce && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent-2/70 animate-ping" />
            )}
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-2" />
          </span>
          <span className="text-[13.5px] text-fg-secondary">
            <span className="text-sand-bright font-bold tnum">{num(availableCount, lang)}</span>{" "}
            {t({ ar: "يستقبل جلسات الآن", en: "available now" })}
          </span>
        </div>
        {featuredCount > 0 && (
          <>
            <span aria-hidden className="hidden sm:block h-8 w-px bg-border-strong" />
            <div className="inline-flex items-center gap-2">
              <Star className="w-3.5 h-3.5 fill-primary text-primary" />
              <span className="text-[13.5px] text-fg-secondary">
                <span className="text-primary font-bold tnum">{num(featuredCount, lang)}</span>{" "}
                {t({ ar: "مرشد مميّز", en: "featured" })}
              </span>
            </div>
          </>
        )}
      </div>

      {/* What a session is — three pillars, hairline-divided ledger */}
      <div className="grid sm:grid-cols-3 border-t border-border-strong">
        {pillars.map((p, i) => (
          <div
            key={i}
            className={`py-7 sm:py-8 sm:px-6 sm:first:ps-0 ${
              i > 0 ? "border-t border-border-strong sm:border-t-0 sm:border-s" : ""
            }`}
          >
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 mb-4">
              <p.icon className="w-4 h-4 text-primary" />
            </span>
            <h3 className="text-foreground font-bold text-[15.5px] leading-snug">{p.title}</h3>
            <p className="text-fg-secondary text-[13px] leading-[1.75] mt-2">{p.body}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function Figure({ value, lang, label }: { value: number; lang: Lang; label: string }) {
  return (
    <div className="inline-flex items-baseline gap-2">
      <span
        className="font-display font-black text-sand-bright tnum leading-none"
        style={{ fontSize: "clamp(1.6rem, 3vw, 2.1rem)", letterSpacing: "-0.04em" }}
      >
        {num(value, lang)}
      </span>
      <span className="text-[13px] text-fg-secondary font-medium">{label}</span>
    </div>
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
          className="absolute -top-7 sm:-top-9 right-0 rtl:right-auto rtl:left-0 select-none font-black leading-none"
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
              className="font-display text-foreground font-bold"
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
  const initials = initialsOf(e.fullName);

  return (
    <motion.div
      variants={reduce ? undefined : rise}
      className="h-full"
    >
      <Link
        href={`/experts/${e.id}`}
        className="card-base card-hover group relative flex h-full flex-col overflow-hidden"
        data-testid={`expert-card-${e.id}`}
      >
        {/* Portrait header — real photo, or a crafted crimson medallion */}
        <div
          className={`relative flex items-center justify-center overflow-hidden ${
            isLead ? "h-52" : "h-44"
          }`}
          style={
            e.avatarUrl
              ? { background: "hsl(var(--surface-3))" }
              : { background: "radial-gradient(130% 120% at 50% 0%, hsl(var(--primary) / 0.20) 0%, hsl(var(--surface-3)) 68%)" }
          }
        >
          {e.avatarUrl ? (
            <img
              src={e.avatarUrl}
              alt={e.fullName}
              className="w-full h-full object-cover saturate-[1.03] transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div
              className={`flex items-center justify-center rounded-full text-white font-display font-black ring-2 ring-white/15 shadow-soft select-none transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06] ${
                isLead ? "h-[104px] w-[104px] text-[34px]" : "h-[88px] w-[88px] text-[28px]"
              }`}
              style={{ background: "linear-gradient(140deg, hsl(var(--primary)) 0%, hsl(var(--primary-pressed)) 100%)" }}
            >
              {initials}
            </div>
          )}
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />

          {e.featured && (
            <div className="absolute top-3 start-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full chip-sand">
              <Star className="w-3 h-3 fill-sand-bright text-sand-bright" />
              <span className="text-[10px] font-bold tracking-wide">
                {t({ ar: "مميّز", en: "FEATURED" })}
              </span>
            </div>
          )}

          {/* Availability dot — lives over the portrait, in white for legibility */}
          <div className="absolute bottom-3 start-3 inline-flex items-center gap-1.5">
            {e.acceptingSessions ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white">
                <span className="relative flex h-1.5 w-1.5">
                  {!reduce && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-2 opacity-75" />
                  )}
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-2" />
                </span>
                {t({ ar: "متاح للحجز", en: "Open" })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/70">
                <Clock className="w-3 h-3" />
                {t({ ar: "مشغول", en: "Busy" })}
              </span>
            )}
          </div>

          {e.yearsExperience > 0 && (
            <div className="absolute bottom-3 end-3 inline-flex items-baseline gap-0.5 text-white/90">
              <span className="text-[13px] font-black tnum" style={{ letterSpacing: "-0.03em" }}>
                {num(e.yearsExperience, lang)}+
              </span>
              <span className="text-[10px] font-semibold">{t({ ar: "سنة", en: "yrs" })}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className={`relative flex flex-1 flex-col ${isLead ? "p-6" : "p-5"}`}>
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`font-display font-bold text-foreground leading-snug truncate group-hover:text-primary transition-colors ${
                isLead ? "text-[18px]" : "text-[16px]"
              }`}
            >
              {e.fullName}
            </h3>
            {e.ratingCount > 0 && e.ratingAvg != null && (
              <span className="inline-flex items-center gap-1 shrink-0 mt-0.5 text-[12px] font-semibold text-sand-bright tnum">
                <Star className="w-3.5 h-3.5 fill-sand-bright text-sand-bright" />
                {e.ratingAvg.toFixed(1)}
                <span className="text-[10.5px] text-muted-foreground font-normal">
                  ({num(e.ratingCount, lang)})
                </span>
              </span>
            )}
          </div>

          {e.headline && (
            <p className="text-primary text-[12.5px] font-medium leading-snug line-clamp-2 mt-1">
              {e.headline}
            </p>
          )}

          {isLead && e.bio && (
            <p className="text-fg-secondary text-[13px] leading-[1.75] line-clamp-2 mt-3">
              {e.bio}
            </p>
          )}

          {areas.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3.5">
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

          <span className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-fg-secondary group-hover:text-primary group-hover:gap-2.5 transition-all">
            {t({ ar: "الملف الكامل", en: "Full profile" })}
            <ArrowLeft className="w-4 h-4 rotate-180 rtl:rotate-0" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   MentorsEmptyState — EDUCATIONAL empty state (NOT "coming soon"). The roster
   is forming right now; we hold the editorial register, tell the true story,
   show what a session gives, and invite the reader to be one of the first
   mentors. Mirrors the homepage ExpertsBand evergreen fallback.
   ────────────────────────────────────────────────────────────────────────── */
function MentorsEmptyState({ reduce }: { reduce: boolean }) {
  const { lang, t } = useLanguage();

  const promises = [
    t({ ar: "جلسة فرديّة مَجّانًا", en: "A free 1:1 session" }),
    t({ ar: "خبرة بلا حدود جغرافيّة", en: "Expertise without borders" }),
    t({ ar: "إرشاد حتّى يوم العرض", en: "Guidance to Demo Day" }),
  ];

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden"
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[55%] brand-aura opacity-50" />
      <div className="relative grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5rem)] gap-y-12 items-center">
        {/* The true story + invitation */}
        <div className="lg:col-span-7">
          <div className="flex items-center gap-3 mb-5">
            <span aria-hidden className="h-px w-9 bg-primary/50" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-primary font-bold rtl:tracking-normal">
              {t({ ar: "الشبكة تتشكّل", en: "The roster is forming" })}
            </span>
          </div>

          <h2
            className="font-display font-extrabold text-foreground"
            style={{ fontSize: "clamp(1.9rem, 4.4vw, 3.2rem)", lineHeight: 1.05, letterSpacing: "-0.028em" }}
          >
            {t({ ar: "مرشدونا ينضمّون — ", en: "Mentors are joining — " })}
            <span className="text-primary">{t({ ar: "كن منهم.", en: "become one." })}</span>
          </h2>

          <p className="text-fg-secondary text-[15px] sm:text-[16.5px] leading-[1.8] mt-6 max-w-xl">
            {t({
              ar: "شبكة المرشدين تتشكّل الآن. مؤسّسون وبُناة ومتخصّصون من حول العالم يقدّمون لجيلٍ غزّيّ شابّ إرشادًا فرديًّا — جلسة واحدة قد تفتح بابًا أغلقته الحرب. نؤمن أنّ الموهبة لا تحدّها الجغرافيا.",
              en: "The mentor roster is forming right now. Founders, builders and specialists worldwide give a young Gazan generation 1:1 guidance — one session can open a door the war had closed. Talent isn't bound by geography.",
            })}
          </p>

          {/* What a session gives — quick proof chips */}
          <div className="flex flex-wrap gap-2 mt-7">
            {promises.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-surface-2 text-fg-secondary border border-border-strong"
              >
                <span className="block w-1.5 h-1.5 rounded-full bg-primary" aria-hidden />
                {p}
              </span>
            ))}
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/become-mentor?ref=experts-empty"
              data-testid="experts-empty-become-mentor"
              className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
            >
              {t({ ar: "سجّل كمرشد", en: "Become a mentor" })}
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            </Link>
            <Link
              href="/book"
              data-testid="experts-empty-book"
              className="group inline-flex items-center gap-2 text-[14px] font-semibold text-primary"
            >
              {t({ ar: "احجز جلسة إرشاد", en: "Book a session" })}
              <ArrowLeft className="w-4 h-4 rotate-180 rtl:rotate-0 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* The place and its people — large photo with dark legibility gradient */}
        <div className="lg:col-span-5">
          <div className="relative overflow-hidden rounded-[20px] ring-1 ring-white/10 shadow-soft">
            <img
              src="/photos/IMG_8352.webp"
              alt={t({ ar: "مرشدون ومنتسبون في آيلاند هيفن بغزّة", en: "Mentors and members at Island Haven in Gaza" })}
              loading="lazy"
              className="w-full h-[clamp(340px,46vw,500px)] object-cover object-center saturate-[1.04]"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A]/85 via-[#0A0E1A]/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 lg:p-7">
              <div className="text-[11px] tracking-[0.2em] uppercase text-white/80 font-semibold mb-1.5">
                {t({ ar: "من داخل المساحة", en: "Inside the space" })}
              </div>
              <div className="font-display font-bold text-white text-[clamp(1.05rem,1.9vw,1.5rem)]">
                {t({ ar: "موهبة تنتظر من يأخذ بيدها", en: "Talent waiting for a hand to guide it" })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function BecomeMentorCTA({ reduce }: { reduce: boolean }) {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.55 }}
      className="mt-16 sm:mt-20"
    >
      <div className="relative overflow-hidden rounded-[24px] bg-surface-2 border border-border-strong shadow-soft p-8 sm:p-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 brand-aura opacity-40" />
        <div className="relative flex flex-col gap-6 text-start lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span aria-hidden className="h-px w-9 bg-primary/50" />
              <span className="text-[11px] tracking-[0.22em] uppercase text-primary font-bold rtl:tracking-normal">
                {t({ ar: "كن مرشدًا", en: "Mentor with us" })}
              </span>
            </div>
            <h3
              className="font-display text-foreground font-extrabold"
              style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.3rem)", lineHeight: 1.08, letterSpacing: "-0.028em" }}
            >
              {t({ ar: "شارك خبرتك. ", en: "Share your expertise. " })}
              <span className="text-primary">{t({ ar: "اترك أثرًا.", en: "Leave a mark." })}</span>
            </h3>
            <p className="text-fg-secondary text-[14.5px] leading-relaxed mt-3">
              {t({
                ar: "ساعة واحدة من وقتك قد تكون البوابة لموهبة غزّيّة نحو الاقتصاد الرقميّ العالميّ. انضمّ إلى شبكة المرشدين، واترك أثرًا يبقى.",
                en: "One hour of your time can be a Gazan talent's gateway to the global digital economy. Join the mentor network and leave a lasting impact.",
              })}
            </p>
          </div>
          <Link
            href="/become-mentor"
            data-testid="become-mentor-cta"
            className="group flex-shrink-0 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full cta-fill font-bold text-[14px] transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-16px_hsl(354_82%_30%_/_0.55)]"
          >
            {t({ ar: "كن مرشدًا", en: "Become a Mentor" })}
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function SkeletonExperts() {
  return (
    <div className="space-y-12">
      {/* value band skeleton */}
      <div className="space-y-6">
        <div className="flex gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 w-32 rounded-lg bg-surface-3 animate-pulse" />
          ))}
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-surface-2 border border-border-strong animate-pulse" />
          ))}
        </div>
      </div>
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
                className="rounded-[24px] h-72 bg-surface-2 border border-border-strong shadow-soft animate-pulse"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
