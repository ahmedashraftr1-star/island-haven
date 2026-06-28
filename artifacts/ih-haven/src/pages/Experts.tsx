import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Search, X } from "lucide-react";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { splitTags } from "@/lib/labels";
import { EASE_OUT_EXPO } from "@/lib/motion";

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

interface Team {
  key: string;
  title: { ar: string; en: string };
  blurb: { ar: string; en: string };
}

// The roster's groups — kept as honest editorial chapters, NOT numbered ledgers.
const TEAMS: Team[] = [
  {
    key: "leadership",
    title: { ar: "القيادة", en: "Leadership" },
    blurb: {
      ar: "الفريق المؤسّس الذي يقود الحاضنة، ويرافقك من الفكرة الأولى إلى الأثر.",
      en: "The founding team steering the incubator — with you from first idea to lasting impact.",
    },
  },
  {
    key: "mentors",
    title: { ar: "الإرشاد التقنيّ والمنتج", en: "Tech & Product Mentors" },
    blurb: {
      ar: "مرشدون يبنون معك المنتج — هندسةً وتصميمًا ونموًّا.",
      en: "Mentors who build the product with you — engineering, design, and growth.",
    },
  },
  {
    key: "advisors",
    title: { ar: "الاستشارات والأعمال", en: "Business Advisors" },
    blurb: {
      ar: "مستشارون يفتحون لك أبواب التمويل والقانون والاستراتيجيّة.",
      en: "Advisors who open doors to funding, legal, and strategy.",
    },
  },
];

const FALLBACK_TEAM: Team = {
  key: "_other",
  title: { ar: "خبراء آخرون", en: "More Experts" },
  blurb: {
    ar: "نخبة إضافيّة من المرشدين في شبكة آيلاند.",
    en: "An additional roster of mentors across the Island Haven network.",
  },
};

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
// Localised numeral: Arabic-Indic in AR, Western digits in EN.
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
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
        for (const m of tm.team) g.set(m.fullName.trim(), m.group);
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
          {/* ── Monumental opening line — one crimson word, acres of space, and the
               only hard numbers in cerulean (real data). No icon-tile pillar grid. ── */}
          <StatementLead
            total={total}
            availableCount={availableCount}
            reduce={!!reduce}
          />

          {/* Search + expertise filter — a calm bar, no glass tiles */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="mt-[clamp(3rem,6vw,5rem)] space-y-5"
          >
            <div className="relative max-w-md">
              <Search className="absolute start-0 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-faint" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t({ ar: "ابحث عن مرشد…", en: "Search mentors…" })}
                className="w-full bg-transparent border-0 border-b border-border-strong/70 ps-7 pe-8 py-3 text-[15px] text-foreground placeholder:text-fg-faint focus:outline-none focus:border-primary transition-colors"
                dir={dir}
                data-testid="expert-search"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={t({ ar: "مسح البحث", en: "Clear search" })}
                  className="absolute end-0 top-1/2 -translate-y-1/2 text-fg-faint hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-x-5 gap-y-2.5">
                <FilterTag
                  active={!activeTag}
                  onClick={() => setActiveTag(null)}
                  label={t({ ar: "الكلّ", en: "All" })}
                />
                {allTags.map((tag) => (
                  <FilterTag
                    key={tag}
                    active={activeTag === tag}
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    label={tag}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* Empty state when search/filter matches nothing — held in register */}
          {isFiltering && (filtered?.length ?? 0) === 0 ? (
            <div className="mt-[clamp(4rem,8vw,7rem)] max-w-2xl" data-testid="experts-empty">
              <h2
                className="font-display text-foreground"
                style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", lineHeight: 1.04, letterSpacing: "-0.04em", fontWeight: 700 }}
              >
                {t({ ar: "لا مرشد يطابق هذه التصفية", en: "No mentor matches that filter" })}{" "}
                <span className="text-primary">{t({ ar: "بعد.", en: "yet." })}</span>
              </h2>
              <p className="mt-5 text-fg-secondary max-w-xl" style={{ fontSize: "clamp(1.05rem,1.7vw,1.3rem)", lineHeight: 1.6 }}>
                {t({
                  ar: "جرّب بحثًا أو تصفيةً مختلفة — أو كن أنت المرشد القادم في الشبكة.",
                  en: "Try a different search or filter — or be the next mentor in the network.",
                })}
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setActiveTag(null);
                  }}
                  className="group inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                  style={{ fontSize: "clamp(1rem,1.6vw,1.2rem)", fontWeight: 600 }}
                >
                  {t({ ar: "مسح الفلاتر", en: "Clear filters" })}
                </button>
                <Link
                  href="/become-mentor?ref=experts-no-match"
                  className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
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

          {/* Become a Mentor — full-bleed photograph, calm line, no aura card */}
          <BecomeMentorBand reduce={!!reduce} />
        </>
      )}
    </PageShell>
  );
}

// A filter as a quiet word — underlined when active, never a pill-deck button.
function FilterTag({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative pb-1 text-[14px] font-semibold transition-colors ${
        active ? "text-foreground" : "text-fg-secondary hover:text-foreground"
      }`}
    >
      {label}
      <span
        aria-hidden
        className={`absolute inset-x-0 -bottom-px h-0.5 origin-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
          active ? "scale-x-100 bg-primary" : "scale-x-0 bg-foreground/40"
        }`}
      />
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   StatementLead — the Apple-grade opening of the body. One monumental calm
   line (one crimson word), then the only hard figures on the page in cerulean
   (real data). No eyebrow kicker, no icon-tile pillars, no aura.
   ────────────────────────────────────────────────────────────────────────── */
function StatementLead({
  total,
  availableCount,
  reduce,
}: {
  total: number;
  availableCount: number;
  reduce: boolean;
}) {
  const { lang, t } = useLanguage();

  return (
    <section className="max-w-4xl">
      <h2
        className="font-display text-foreground"
        style={{ fontSize: "clamp(2.4rem, 6.4vw, 4.75rem)", lineHeight: 1.0, letterSpacing: "-0.04em", fontWeight: 700 }}
      >
        {[
          t({ ar: "خبرةٌ بلا", en: "Expertise that" }),
          <span key="accent">
            {t({ ar: "حدودٍ ", en: "knows no " })}
            <span className="text-primary">{t({ ar: "جغرافيّة.", en: "borders." })}</span>
          </span>,
        ].map((ln, i) => (
          <motion.span
            key={i}
            className="block will-change-transform"
            initial={reduce ? false : { opacity: 0, y: 30 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.85, delay: i * 0.09, ease: EASE_OUT_EXPO }}
          >
            {ln}
          </motion.span>
        ))}
      </h2>

      <motion.p
        initial={reduce ? false : { opacity: 0, y: 18 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.85, delay: 0.32, ease: EASE_OUT_EXPO }}
        className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-2xl text-fg-secondary"
        style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
      >
        {t({
          ar: "احجز جلسة فرديّة مَجّانًا مع من يستمع لمشروعك ويأخذ بيدك — من الفكرة الأولى إلى يوم العرض. جلسة واحدة قد تفتح بابًا أغلقته الحرب.",
          en: "Book a free 1:1 with someone who hears your project and takes you forward — from first idea to Demo Day. A single session can open a door the war had closed.",
        })}
      </motion.p>

      {/* The only hard figures on the page — cerulean numerals, a hairline ledger. */}
      {total > 0 && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ duration: 0.75, delay: 0.46, ease: EASE_OUT_EXPO }}
          className="mt-[clamp(2.25rem,4vw,3.25rem)] flex flex-wrap items-baseline gap-x-[clamp(2rem,4vw,3.5rem)] gap-y-4"
        >
          <Figure
            value={num(total, lang)}
            label={t({ ar: "مرشدًا في الشبكة", en: "mentors in the network" })}
          />
          {availableCount > 0 && (
            <div className="inline-flex items-baseline gap-2.5">
              <span className="self-center inline-flex h-1.5 w-1.5 rounded-full bg-sand" aria-hidden />
              <span
                className="font-display font-black text-sand-bright tnum leading-none"
                style={{ fontSize: "clamp(1.6rem, 3vw, 2.1rem)", letterSpacing: "-0.04em" }}
              >
                {num(availableCount, lang)}
              </span>
              <span className="t-caption text-fg-secondary">
                {t({ ar: "يستقبل جلسات الآن", en: "available to book now" })}
              </span>
            </div>
          )}
        </motion.div>
      )}
    </section>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className="inline-flex items-baseline gap-2.5">
      <span
        className="font-display font-black text-sand-bright tnum leading-none"
        style={{ fontSize: "clamp(1.6rem, 3vw, 2.1rem)", letterSpacing: "-0.04em" }}
      >
        {value}
      </span>
      <span className="t-caption text-fg-secondary">{label}</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   TeamSection — an honest editorial chapter. A calm group heading (name +
   one-line note, a hairline beneath) and the mentors as full-width editorial
   rows: a dignified portrait, a large name, the discipline as prose. No
   numbered ledger, no count medallion, no card deck.
   ────────────────────────────────────────────────────────────────────────── */
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
  return (
    <section className="mt-[clamp(4.5rem,9vw,8rem)]">
      <motion.header
        initial={reduce ? false : { opacity: 0, y: 18 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
        className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 pb-[clamp(1.25rem,2.5vw,2rem)] border-b border-border-strong"
      >
        <div className="max-w-2xl">
          <h2
            className="font-display font-bold text-foreground"
            style={{ fontSize: "clamp(1.5rem,3.4vw,2.4rem)", letterSpacing: "-0.03em", lineHeight: 1.08 }}
          >
            {t(team.title)}
          </h2>
          <p className="t-body text-[15px] md:text-[16px] mt-2.5 max-w-xl">{t(team.blurb)}</p>
        </div>
        {/* Count is a quiet ledger; show it only on the catch-all fallback chapter
            so it doesn't become a repeating per-section ornament. */}
        {team.key === "_other" && (
          <span className="t-caption text-fg-secondary tnum whitespace-nowrap">
            {num(experts.length, lang)} {t({ ar: "مرشد", en: experts.length === 1 ? "mentor" : "mentors" })}
          </span>
        )}
      </motion.header>

      <ul>
        {experts.map((e, i) => (
          <ExpertRow key={e.id} e={e} i={i} reduce={reduce} />
        ))}
      </ul>
    </section>
  );
}

// One mentor — a calm editorial hairline row (no card, no medallion). A real
// dignified portrait where one exists; otherwise the name simply stands alone.
function ExpertRow({ e, i, reduce }: { e: ExpertCard; i: number; reduce: boolean }) {
  const { lang, t } = useLanguage();
  const areas = splitTags(e.expertise).slice(0, 3);
  const detail = e.headline || areas.join(lang === "en" ? " · " : " • ");

  return (
    <li>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.7, delay: Math.min(i, 6) * 0.05, ease: EASE_OUT_EXPO }}
        className="will-change-transform"
      >
        <Link
          href={`/experts/${e.id}`}
          data-testid={`expert-card-${e.id}`}
          className="group grid grid-cols-[auto_1fr] md:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-[clamp(1.25rem,2.5vw,2.5rem)] gap-y-2 py-[clamp(1.5rem,3vw,2.5rem)] border-b border-border-strong/60 transition-colors hover:border-border-strong"
        >
          {/* Portrait — a real face where one exists; no initial-medallion fallback. */}
          {e.avatarUrl ? (
            <div className="relative h-[clamp(3.5rem,7vw,5rem)] w-[clamp(3.5rem,7vw,5rem)] shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
              <img
                src={e.avatarUrl}
                alt={e.fullName}
                loading="lazy"
                className="h-full w-full object-cover saturate-[1.03] transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
              />
            </div>
          ) : (
            <span aria-hidden className="h-[clamp(3.5rem,7vw,5rem)] w-px shrink-0" />
          )}

          <div className="min-w-0">
            <h3
              title={e.fullName}
              className="font-display font-bold text-foreground group-hover:text-primary transition-colors"
              style={{ fontSize: "clamp(1.4rem,3.2vw,2.4rem)", letterSpacing: "-0.03em", lineHeight: 1.1 }}
            >
              {e.fullName}
            </h3>
            {detail && (
              <p title={detail} className="t-body text-[15px] md:text-[16px] mt-1.5 line-clamp-1">{detail}</p>
            )}
          </div>

          {/* Quiet status + experience + rating, start-aligned to the logical end. */}
          <div className="hidden md:flex items-center gap-x-6 whitespace-nowrap justify-self-end">
            {e.ratingCount > 0 && e.ratingAvg != null && (
              <span className="t-caption text-fg-secondary tnum">
                {e.ratingAvg.toFixed(1)} · {num(e.ratingCount, lang)}
              </span>
            )}
            {e.yearsExperience > 0 && (
              <span className="t-caption text-fg-secondary tnum">
                {lang === "en"
                  ? `${e.yearsExperience}+ yrs`
                  : `${toArabicNum(e.yearsExperience)}+ سنة`}
              </span>
            )}
            <span className="inline-flex items-center gap-2 t-caption">
              {e.acceptingSessions ? (
                <>
                  <span aria-hidden className="inline-flex h-1.5 w-1.5 rounded-full bg-sand" />
                  <span className="text-sand font-semibold">{t({ ar: "متاح", en: "Open" })}</span>
                </>
              ) : (
                <span className="text-fg-secondary">{t({ ar: "مشغول", en: "Busy" })}</span>
              )}
              <ArrowLeft className="w-4 h-4 text-fg-faint rtl:rotate-180 transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:text-primary group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      </motion.div>
    </li>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   MentorsEmptyState — EDUCATIONAL empty state (NOT "coming soon"). The roster
   is forming right now; we hold the monumental register, tell the true story,
   and invite the reader to be one of the first mentors. Mirrors the homepage
   ExpertsBand evergreen fallback — monumental head, no aura, full-bleed photo.
   ────────────────────────────────────────────────────────────────────────── */
function MentorsEmptyState({ reduce }: { reduce: boolean }) {
  const { t } = useLanguage();

  return (
    <section className="-mt-2">
      <h2
        className="font-display text-foreground max-w-[15ch]"
        style={{ fontSize: "clamp(2.4rem, 7vw, 5rem)", lineHeight: 1.0, letterSpacing: "-0.045em", fontWeight: 700 }}
      >
        {[
          t({ ar: "المرشدون", en: "The mentors" }),
          t({ ar: "يتجمّعون.", en: "are gathering." }),
          <span key="accent" className="text-primary">{t({ ar: "كن منهم.", en: "Be one." })}</span>,
        ].map((ln, i) => (
          <motion.span
            key={i}
            className="block will-change-transform"
            initial={reduce ? false : { opacity: 0, y: 30 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.85, delay: i * 0.09, ease: EASE_OUT_EXPO }}
          >
            {ln}
          </motion.span>
        ))}
      </h2>

      <motion.p
        initial={reduce ? false : { opacity: 0, y: 18 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.85, delay: 0.4, ease: EASE_OUT_EXPO }}
        className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-2xl text-fg-secondary"
        style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
      >
        {t({
          ar: "شبكة المرشدين تتشكّل الآن. مؤسّسون وبُناةٌ ومتخصّصون من حول العالم يجلسون مع جيلٍ غزّيّ شابّ، واحدًا لواحد. جلسة واحدة قد تفتح بابًا أغلقته الحرب — نؤمن أنّ الموهبة لا تحدّها الجغرافيا.",
          en: "The mentor roster is forming right now. Founders, builders and specialists worldwide sit with a young Gazan generation, one to one. A single session can open a door the war had closed — talent isn't bound by geography.",
        })}
      </motion.p>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.8, delay: 0.52, ease: EASE_OUT_EXPO }}
        className="mt-[clamp(2rem,4vw,3rem)] flex flex-wrap items-center gap-x-7 gap-y-4"
      >
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
          className="group inline-flex items-center gap-2 text-[14px] font-semibold text-foreground/85 hover:text-foreground transition-colors"
        >
          {t({ ar: "احجز جلسة إرشاد", en: "Book a session" })}
          <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
        </Link>
      </motion.div>

      {/* The place and its people — one full-bleed photograph, a calm line overlaid. */}
      <FullBleedPhoto reduce={reduce} className="mt-[clamp(4rem,9vh,7rem)]" />
    </section>
  );
}

// Become a Mentor — the terminal invitation, told the house way: a calm line,
// a confident CTA, then one full-bleed photograph. No aura card, no eyebrow.
function BecomeMentorBand({ reduce }: { reduce: boolean }) {
  const { t } = useLanguage();
  return (
    <section className="mt-[clamp(5rem,11vw,9rem)]">
      <h2
        className="font-display text-foreground max-w-[16ch]"
        style={{ fontSize: "clamp(2.2rem, 6vw, 4.5rem)", lineHeight: 1.0, letterSpacing: "-0.04em", fontWeight: 700 }}
      >
        {[
          t({ ar: "شارك خبرتك.", en: "Share your expertise." }),
          <span key="accent" className="text-primary">{t({ ar: "اترك أثرًا.", en: "Leave a mark." })}</span>,
        ].map((ln, i) => (
          <motion.span
            key={i}
            className="block will-change-transform"
            initial={reduce ? false : { opacity: 0, y: 30 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.85, delay: i * 0.09, ease: EASE_OUT_EXPO }}
          >
            {ln}
          </motion.span>
        ))}
      </h2>

      <motion.p
        initial={reduce ? false : { opacity: 0, y: 18 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.85, delay: 0.32, ease: EASE_OUT_EXPO }}
        className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-2xl text-fg-secondary"
        style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
      >
        {t({
          ar: "ساعة واحدة من وقتك قد تكون البوابة لموهبة غزّيّة نحو الاقتصاد الرقميّ العالميّ. انضمّ إلى شبكة المرشدين، واترك أثرًا يبقى.",
          en: "One hour of your time can be a Gazan talent's gateway to the global digital economy. Join the mentor network and leave a lasting mark.",
        })}
      </motion.p>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.8, delay: 0.46, ease: EASE_OUT_EXPO }}
        className="mt-[clamp(2rem,4vw,3rem)] flex flex-wrap items-center gap-x-7 gap-y-4"
      >
        <Link
          href="/become-mentor"
          data-testid="become-mentor-cta"
          className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
        >
          {t({ ar: "كن مرشدًا", en: "Become a Mentor" })}
          <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
        </Link>
      </motion.div>

      <FullBleedPhoto reduce={reduce} className="mt-[clamp(4rem,9vh,7rem)]" />
    </section>
  );
}

// One full-bleed photograph with a dark legibility gradient and a calm line
// overlaid — the shared house device. Breaks the PageShell padding to bleed
// edge-to-edge via the viewport-width trick, matching the homepage register.
function FullBleedPhoto({ reduce, className = "" }: { reduce: boolean; className?: string }) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  // Slow full-bleed parallax under the photo — the shared house device
  // (matches Statement.tsx). Gated off when the user prefers reduced motion.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-8%", "8%"]);
  return (
    <motion.div
      ref={ref}
      initial={reduce ? false : { opacity: 0 }}
      whileInView={reduce ? undefined : { opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1, ease: EASE_OUT_EXPO }}
      className={`relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden ${className}`}
    >
      <div className="relative h-[clamp(20rem,52vh,34rem)]">
        <motion.img
          src="/photos/IMG_8352.webp"
          alt={t({ ar: "مرشدون ومنتسبون في آيلاند هيفن بغزّة", en: "Mentors and members at Island Haven in Gaza" })}
          loading="lazy"
          style={{ y }}
          className="absolute inset-0 h-[116%] w-full -top-[8%] object-cover object-center saturate-[1.04] will-change-transform"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "linear-gradient(90deg, hsl(225 44% 5% / 0.92) 0%, hsl(225 44% 5% / 0.5) 45%, transparent 80%)" }}
        />
        <div className="absolute inset-0 flex items-end">
          <div className="container-ih w-full pb-[clamp(2.5rem,6vh,4.5rem)]">
            <motion.p
              className="max-w-[20ch] text-white"
              style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.6rem)", lineHeight: 1.18, letterSpacing: "-0.02em", fontWeight: 600 }}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
            >
              {t({ ar: "موهبةٌ تنتظر من يأخذ بيدها.", en: "Talent waiting for a hand to guide it." })}
            </motion.p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SkeletonExperts() {
  return (
    <div className="space-y-12">
      {/* statement lead skeleton */}
      <div className="space-y-5 max-w-4xl">
        <div className="h-14 w-3/4 rounded-lg bg-surface-3 animate-pulse" />
        <div className="h-6 w-2/3 rounded bg-surface-3 animate-pulse" />
        <div className="flex gap-8 pt-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-9 w-40 rounded-lg bg-surface-3 animate-pulse" />
          ))}
        </div>
      </div>
      {/* filter skeleton */}
      <div className="flex gap-5 pt-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-5 w-20 rounded bg-surface-3 animate-pulse" />
        ))}
      </div>
      {/* roster skeleton — editorial rows */}
      <div className="pt-6 space-y-0 border-t border-border-strong/60">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-5 py-7 border-b border-border-strong/60">
            <div className="h-14 w-14 rounded-full bg-surface-3 animate-pulse shrink-0" />
            <div className="h-8 w-48 max-w-[60%] rounded bg-surface-3 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
