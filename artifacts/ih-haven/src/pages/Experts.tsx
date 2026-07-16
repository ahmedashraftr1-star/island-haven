import { useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Search, X } from "lucide-react";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { expertiseLabel } from "@/lib/expertiseTags";
import { useExperts, useTeam } from "@/hooks/use-public-data";
import { splitTags } from "@/lib/labels";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { ExpertAvatar, initials } from "@/components/ui/ExpertAvatar";
import { SpotlightOverlay } from "@/components/ui/SpotlightCard";

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
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const reduce = useReducedMotion();

  // Shared cached hooks: the homepage warms `experts`, so arriving here paints
  // from cache. Both keys are language-independent, so an AR↔EN toggle no longer
  // refetches (the old effect keyed on `lang` purely to localize the error copy —
  // that copy is now resolved at render time). /team stays best-effort: if it
  // fails, `groups` is simply empty, exactly as the old `.catch(() => ({team:[]}))`.
  const { data: expertsData, isLoading, isError } = useExperts<ExpertCard>();
  const rows = expertsData?.experts ?? [];
  const { data: teamData } = useTeam<TeamMember>();
  const groups = useMemo(() => {
    const g = new Map<string, string>();
    for (const m of teamData?.team ?? []) g.set(m.fullName.trim(), m.group);
    return g;
  }, [teamData]);

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
      heroAside={
        <div className="rounded-[18px] border border-border-strong bg-surface-2/40 p-6 sm:p-8">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary rtl:tracking-normal">
            {t({ ar: "شبكة المرشدين", en: "Mentor network" })}
          </p>
          <p
            className="font-display font-black text-sand-bright tnum leading-none mt-4"
            style={{ fontSize: "clamp(2.8rem,6vw,4rem)" }}
          >
            {num(total, lang)}
          </p>
          <p className="t-caption text-fg-secondary mt-1.5">
            {t({ ar: "مرشدًا في الشبكة", en: "mentors in the network" })}
          </p>
          <div aria-hidden className="my-5 h-px w-full bg-border-strong" />
          <div className="flex items-center justify-between text-[14px]">
            <span className="text-fg-secondary">{t({ ar: "متاحون للحجز", en: "available to book" })}</span>
            <span className="font-mono font-medium text-foreground tnum">{num(availableCount, lang)}</span>
          </div>
          <div aria-hidden className="my-4 h-px w-full bg-border-strong" />
          <p className="flex items-center gap-2 t-caption text-fg-secondary">
            <span aria-hidden className="inline-flex h-2 w-2 shrink-0 rounded-full bg-primary" />
            {t({ ar: "الجلسة الأولى مجّانيّة دائمًا", en: "First session always free" })}
          </p>
          <div className="mt-5 border-t border-border-strong pt-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-fg-faint mb-3">
              {t({ ar: "التخصّصات", en: "Specialties" })}
            </p>
            <div className="space-y-2">
              {[
                t({ ar: "ريادة الأعمال", en: "Entrepreneurship" }),
                t({ ar: "تطوير المنتج", en: "Product" }),
                t({ ar: "بناء الشبكات", en: "Networking" }),
                t({ ar: "صناعة المحتوى", en: "Content" }),
                t({ ar: "استراتيجيّة المشاريع", en: "Venture strategy" }),
              ].map((spec) => (
                <div key={spec} className="flex items-center justify-between text-[13.5px]">
                  <span className="text-fg-secondary">{spec}</span>
                  <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-sand/60" />
                </div>
              ))}
            </div>
          </div>
          <a
            href="#experts-grid"
            className="cta-fill mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-semibold"
            aria-label={t({ ar: "احجز جلسة إرشاد مجّانيّة", en: "Book a free mentoring session" })}
          >
            {t({ ar: "احجز جلسة مجّانًا", en: "Book a free session" })}
          </a>
        </div>
      }
    >
      {isLoading ? (
        <SkeletonExperts />
      ) : isError ? (
        <GlassCard className="p-5 text-primary text-center">
          {t({ ar: "تعذّر تحميل الخبراء", en: "Couldn't load experts" })}
        </GlassCard>
      ) : rows.length === 0 ? (
        <MentorsEmptyState reduce={!!reduce} />
      ) : (
        <>
          {/* Meet-the-mentors strip — real faces up front so the roster is visible
               in the first fold, before the editorial lead + filters. Horizontal
               scroll on mobile, wraps on desktop; each chip links to the profile. */}
          {rows && rows.length > 0 && (
            <div className="-mx-4 px-4 mb-[clamp(1.75rem,4vw,2.75rem)] flex gap-2.5 overflow-x-auto sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {rows.slice(0, 8).map((e) => {
                return (
                  <Link
                    key={e.id}
                    href={`/experts/${e.id}`}
                    className="group flex shrink-0 items-center gap-3 rounded-full border border-border-strong bg-surface-1 py-2 ps-2 pe-4 transition-colors hover:border-primary/40"
                  >
                    <ExpertAvatar name={e.fullName} avatarUrl={e.avatarUrl} size="sm" />
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-semibold text-foreground leading-tight line-clamp-1 transition-colors group-hover:text-primary">
                        {e.fullName}
                      </span>
                      <span className="block t-caption text-fg-secondary line-clamp-1">{e.headline || e.expertise}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* ── Monumental opening line — one crimson word, acres of space, and the
               only hard numbers in cerulean (real data). No icon-tile pillar grid. ── */}
          <StatementLead reduce={!!reduce} />

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
                    label={expertiseLabel(tag, lang)}
                  />
                ))}
              </div>
            )}
          </motion.div>

          <div id="experts-grid" className="scroll-mt-28" aria-hidden />

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
      // The visible tab is a 14px underline label (~28px tall) — fine to read, fiddly
      // to hit with a thumb. `py-2.5` grows the TAP TARGET to ~44px without moving the
      // text; the underline is glued to the label via the inner relative span, so it
      // stays under the words instead of dropping to the padded button's floor. Same
      // look, comfortably tappable on a phone.
      className={`relative inline-flex py-2.5 text-[14px] font-semibold transition-colors ${
        active ? "text-foreground" : "text-fg-secondary hover:text-foreground"
      }`}
    >
      <span className="relative pb-1">
        {label}
        <span
          aria-hidden
          className={`absolute inset-x-0 -bottom-px h-0.5 origin-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
            active ? "scale-x-100 bg-primary" : "scale-x-0 bg-foreground/40"
          }`}
        />
      </span>
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   StatementLead — the Apple-grade opening of the body. One monumental calm
   line (one crimson word), then the only hard figures on the page in cerulean
   (real data). No eyebrow kicker, no icon-tile pillars, no aura.
   ────────────────────────────────────────────────────────────────────────── */
function StatementLead({ reduce }: { reduce: boolean }) {
  const { t } = useLanguage();

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

      <ul className="mt-[clamp(2rem,4vw,3rem)] grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {experts.map((e, i) => (
          <ExpertCard key={e.id} e={e} i={i} reduce={reduce} />
        ))}
      </ul>
    </section>
  );
}

// One mentor — a premium card. A real portrait where one exists; otherwise an
// elegant gold-initials panel (restrained, NOT a circular medallion). Name,
// discipline, specialization pills, rating/experience, a status dot, and a
// "Book a session →" link. The /experts/:id link + expert-card-* testid stay.
function ExpertCard({ e, i, reduce }: { e: ExpertCard; i: number; reduce: boolean }) {
  const { lang, t } = useLanguage();
  const areas = splitTags(e.expertise).slice(0, 3);

  return (
    <li className="h-full">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: Math.min(i, 6) * 0.05, ease: EASE_OUT_EXPO }}
        className="h-full will-change-transform"
      >
        <Link
          href={`/experts/${e.id}`}
          data-testid={`expert-card-${e.id}`}
          className="group relative flex h-full flex-col overflow-hidden rounded-[18px] border border-border-strong bg-surface-2/50 transition-[transform,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none hover:-translate-y-0.5 hover:border-primary/40"
        >
          <SpotlightOverlay />
          {/* Avatar panel — real face, else a neutral panel with the same
              gold two-letter initials used everywhere else (shared initials()). */}
          <div className="relative h-[clamp(8.5rem,18vw,10.5rem)] w-full overflow-hidden bg-white/[0.03]">
            {e.avatarUrl ? (
              <img
                src={e.avatarUrl}
                alt={e.fullName}
                loading="lazy"
                className="h-full w-full object-cover saturate-[1.03] transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:scale-[1.05]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span
                  aria-hidden
                  className="font-display font-black text-sand-bright"
                  style={{ fontSize: "clamp(2.5rem,5vw,3.5rem)", letterSpacing: "0.02em" }}
                >
                  {initials(e.fullName)}
                </span>
              </div>
            )}
            <span className="absolute top-3 end-3 inline-flex items-center gap-1.5 rounded-full bg-[#0a0a0a]/70 backdrop-blur-md px-2.5 h-6 text-[10.5px] font-semibold">
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${e.acceptingSessions ? "bg-primary" : "bg-fg-faint"}`} />
              <span className={e.acceptingSessions ? "text-primary" : "text-fg-secondary"}>
                {e.acceptingSessions ? t({ ar: "متاح", en: "Open" }) : t({ ar: "مشغول", en: "Busy" })}
              </span>
            </span>
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col p-5">
            <h3
              title={e.fullName}
              className="font-display font-bold text-foreground text-[18px] leading-tight line-clamp-1 group-hover:text-primary transition-colors"
            >
              {e.fullName}
            </h3>
            {e.headline && (
              <p title={e.headline} className="t-caption text-fg-secondary mt-1 line-clamp-1">{e.headline}</p>
            )}
            {areas.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {areas.map((a) => (
                  <span key={a} className="inline-flex items-center rounded-full border border-border-strong px-2.5 py-0.5 text-[11px] text-fg-secondary">
                    {a}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-auto pt-4 flex items-center justify-between gap-2">
              {e.ratingCount > 0 && e.ratingAvg != null ? (
                <span className="font-mono text-[12px] text-sand tnum">
                  {e.ratingAvg.toFixed(1)} · {num(e.ratingCount, lang)}
                </span>
              ) : e.yearsExperience > 0 ? (
                <span className="font-mono text-[12px] text-fg-secondary tnum">
                  {lang === "en" ? `${e.yearsExperience}+ yrs` : `${toArabicNum(e.yearsExperience)}+ سنة`}
                </span>
              ) : (
                <span />
              )}
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary">
                {t({ ar: "احجز جلسة", en: "Book a session" })}
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              </span>
            </div>
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
        {/* This was a 90deg wash darkening the LEFT of the frame to 0.92 — but the line
            it was meant to protect is start-aligned, which in Arabic is the RIGHT. So it
            drowned half the photograph and left the type standing on bare picture: the
            headline measured 1.34:1 against the worst pixel beneath it. A scrim that
            assumes English on an Arabic page.
            The line takes a plinth instead — direction-agnostic, like the hero — and the
            veil relaxes into a floor for the bottom edge. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, hsl(0 0% 4% / 0.28) 0%, hsl(0 0% 4% / 0.08) 40%, hsl(0 0% 4% / 0.5) 100%)" }}
        />
        {/* The line takes a CONTAINED plinth panel in the corner — a wrapper (never the
            <p> itself, so its ground survives when the text is inspected). The earlier
            full-height 54% slab gave the type a ground but read as a black box hiding
            half the room; a small panel keeps the caption legible while the vivid
            photograph fills the whole band. */}
        <div className="absolute inset-x-0 bottom-0 px-[clamp(1.25rem,5vw,4rem)] pb-[clamp(2rem,5vh,3.5rem)]">
          <div className="plinth w-fit max-w-[20rem] rounded-2xl p-[clamp(1.25rem,2.4vw,2rem)]">
              <motion.p
                className="text-white text-balance"
                style={{ fontSize: "clamp(1.4rem, 2.6vw, 2rem)", lineHeight: 1.2, letterSpacing: "-0.02em", fontWeight: 600 }}
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
