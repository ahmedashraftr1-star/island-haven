import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Globe, Linkedin, Mail } from "lucide-react";
import { PageShell, EmptyState } from "@/components/shell/PageShell";
import { Reveal } from "@/components/landing/Reveal";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";

type RoleGroup = "leadership" | "mentors" | "advisors" | "support";

interface TeamMember {
  id: number;
  fullName: string;
  role: string;
  bio: string;
  avatarUrl: string | null;
  linkedinUrl: string;
  websiteUrl: string;
  email: string;
  group: RoleGroup;
  featured: boolean;
}

const GROUPS: {
  key: RoleGroup;
  index: number;
  ar: string;
  en: string;
  blurb: { ar: string; en: string };
  variant: "lead" | "compact";
}[] = [
  {
    key: "leadership",
    index: 1,
    ar: "القيادة",
    en: "Leadership",
    blurb: {
      ar: "الفريق المؤسِّس الذي وُلد مع الحاضنة في غزّة — يرسم الرؤية، يبني البنية، ويقف خلف كلّ موهبة.",
      en: "The founding team born with the incubator in Gaza — drawing the vision, building the infrastructure, standing behind every talent.",
    },
    variant: "lead",
  },
  {
    key: "mentors",
    index: 2,
    ar: "الإرشاد",
    en: "Mentors",
    blurb: {
      ar: "خبراء ومؤسِّسون يرافقون الفرق خطوةً بخطوة في رحلتها التقنيّة وبناء المنتج حتّى يوم العرض.",
      en: "Experts and founders who walk with each team — step by step — from a first commit to Demo Day.",
    },
    variant: "compact",
  },
  {
    key: "advisors",
    index: 3,
    ar: "الاستشارة",
    en: "Advisors",
    blurb: {
      ar: "مستشارو الأعمال والتمويل والقانون والشّبكات الذين يفتحون الأبواب الأصعب نحو الاقتصاد الرّقميّ.",
      en: "Business, finance, legal and network advisors who open the hardest doors toward the global digital economy.",
    },
    variant: "compact",
  },
  {
    key: "support",
    index: 4,
    ar: "التشغيل",
    en: "Operations",
    blurb: {
      ar: "الفريق الذي يُبقي المساحة والمجتمع يعملان يومًا بيوم، خلف الكواليس وبلا ضجيج.",
      en: "The team that keeps the space and the community running day by day — behind the scenes, without noise.",
    },
    variant: "compact",
  },
];

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
// First grapheme of the name → medallion initial.
function initialOf(name: string): string {
  return Array.from(name.trim())[0] ?? "؟";
}

export default function Team() {
  const { lang, t } = useLanguage();
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = t({
      ar: "الفريق خلف آيلاند — حاضنة أعمال غزّة",
      en: "The Team Behind Island Haven — Gaza Business Incubator",
    });
  }, [lang, t]);

  useEffect(() => {
    let cancelled = false;
    api<{ team: TeamMember[] }>("/team")
      .then((r) => !cancelled && setTeam(r.team))
      .catch(
        (e) =>
          !cancelled &&
          setError(
            e instanceof ApiError
              ? e.message
              : lang === "ar"
                ? "تعذّر تحميل الفريق"
                : "Couldn't load the team",
          ),
      );
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const grouped = (team ?? []).reduce<Record<RoleGroup, TeamMember[]>>(
    (acc, m) => {
      (acc[m.group] ||= []).push(m);
      return acc;
    },
    { leadership: [], mentors: [], advisors: [], support: [] },
  );
  const sections = GROUPS.filter((g) => grouped[g.key]?.length);
  const total = team?.length ?? 0;
  const hasTeam = team !== null && team.length > 0;

  return (
    <PageShell
      eyebrow={t({ ar: "من يقف خلف الحاضنة · The Team", en: "Who Stands Behind the Incubator · The Team" })}
      title={t({ ar: "الفريق خلف", en: "The Team Behind" })}
      highlight={t({ ar: "آيلاند", en: "Island Haven" })}
      subtitle={t({
        ar: "حاضنة وُلدت في غزّة أثناء الحرب، ويقودها فريق غزّاويّ-دوليّ يؤمن بأنّ الموهبة هنا تستحقّ مساحةً وإرشادًا ودعمًا حقيقيًّا. لا نَعِد بالمعجزات — نَبني، خطوةً بخطوة، مع كلّ من ينضمّ إلينا.",
        en: "An incubator born in Gaza during the war, led by a Gazan-international team that believes the talent here deserves a real space, mentorship and support. We don't promise miracles — we build, step by step, with everyone who joins us.",
      })}
    >
      {error && (
        <div className="card-base p-5 text-primary text-center font-medium">{error}</div>
      )}

      {team === null && !error ? (
        <SkeletonTeam />
      ) : team && team.length === 0 ? (
        <TeamEmpty />
      ) : (
        <>
          {/* Founding narrative — the "why", told the editorial way. Real story,
              no fabricated names; numerals in cerulean .tnum. */}
          <FoundingNarrative total={total} teams={sections.length} />

          {sections.map((g) => (
            <TeamSection key={g.key} group={g} members={grouped[g.key]} />
          ))}
        </>
      )}

      {/* Warm dual-path closing — mentor + join, never a dead end */}
      <JoinBand show={hasTeam || (team !== null && team.length === 0)} />
    </PageShell>
  );
}

/* ───────────────────────── Founding narrative ───────────────────────── */

function FoundingNarrative({ total, teams }: { total: number; teams: number }) {
  const { lang, t } = useLanguage();

  const ledger = [
    {
      v: total,
      label: t({ ar: "عضوًا في الفريق", en: "team members" }),
    },
    {
      v: teams,
      label: t({ ar: "فِرَق متخصِّصة", en: "specialised teams" }),
    },
  ];

  return (
    <Reveal as="section" className="mb-16 sm:mb-20">
      <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,4.5rem)] gap-y-8 items-start">
        <div className="lg:col-span-7">
          <div className="flex items-center gap-3 mb-5">
            <span aria-hidden className="h-px w-9 bg-primary/50" />
            <span className="eyebrow">{t({ ar: "بدأنا عام ٢٠٢٤", en: "Founded in 2024" })}</span>
          </div>
          <h2
            className="font-display font-extrabold text-foreground"
            style={{ fontSize: "clamp(1.6rem, 3.4vw, 2.6rem)", lineHeight: 1.08, letterSpacing: "-0.028em" }}
          >
            {t({ ar: "فريقٌ صغير، ", en: "A small team, " })}
            <span className="text-primary">{t({ ar: "هدفٌ كبير.", en: "a vast goal." })}</span>
          </h2>
          <p className="t-body mt-5 max-w-xl">
            {t({
              ar: "نَسعى لتمكين ألف موهبة غزّاويّة خلال ثلاث سنوات للدّخول إلى الاقتصاد الرّقميّ العالميّ — عبر ثلاثة محاور: البنية والحلول، التطوير والابتكار، والشّبكات والأثر العالميّ. كلّ هذا مجّانًا، بدعمٍ من «من النّاس إلى النّاس».",
              en: "We aim to empower a thousand Gazan talents over three years to enter the global digital economy — across three axes: infrastructure & solutions, development & innovation, and global networking & impact. All of it free, backed by NasToNas.",
            })}
          </p>
        </div>

        {/* Ledger panel — cerulean numerals carry the proof */}
        <div className="lg:col-span-5">
          <div className="card-base p-7 sm:p-8">
            <div className="grid grid-cols-2 gap-6">
              {ledger.map((row, i) => (
                <div key={i}>
                  <div
                    className="tnum font-display font-black text-sand-bright leading-[0.9]"
                    style={{ fontSize: "clamp(2.4rem, 5vw, 3.4rem)", letterSpacing: "-0.04em" }}
                  >
                    {num(row.v, lang)}
                  </div>
                  <div className="mt-2 text-[13px] text-fg-secondary leading-snug">{row.label}</div>
                </div>
              ))}
            </div>
            <div aria-hidden className="my-6 h-px bg-border-strong/70" />
            <div className="flex items-center gap-2.5 text-[12.5px] text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-2 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-2" />
              </span>
              {t({ ar: "بدعمٍ من · من النّاس إلى النّاس", en: "Backed by · NasToNas" })}
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ───────────────────────────── Section ───────────────────────────── */

function TeamSection({
  group,
  members,
}: {
  group: (typeof GROUPS)[number];
  members: TeamMember[];
}) {
  const { lang, t } = useLanguage();
  const isLead = group.variant === "lead";
  return (
    <section className="relative mb-16 sm:mb-24">
      <Reveal as="div" className="relative mb-7 sm:mb-9">
        <span
          aria-hidden
          className="absolute -top-7 sm:-top-9 end-0 select-none font-display font-black leading-none"
          style={{
            fontSize: "clamp(4.5rem, 13vw, 9rem)",
            WebkitTextStroke: "1.25px hsl(var(--primary) / 0.16)",
            color: "transparent",
          }}
        >
          {idx(group.index, lang)}
        </span>
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h2
              className="text-foreground font-display font-extrabold"
              style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.028em" }}
            >
              {t({ ar: group.ar, en: group.en })}
            </h2>
            <span className="text-[10.5px] tracking-[0.22em] uppercase text-muted-foreground font-bold rtl:tracking-normal">
              {group.en}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 h-[22px] rounded-full text-[11px] font-bold text-sand bg-surface-2 border border-border-strong">
              <span className="tnum">{num(members.length, lang)}</span>
            </span>
          </div>
          <p className="t-body max-w-xl">{t(group.blurb)}</p>
        </div>
      </Reveal>

      <div
        className={
          isLead
            ? "grid sm:grid-cols-2 gap-5 auto-rows-fr"
            : "grid sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr"
        }
      >
        {members.map((m, i) => (
          <Reveal key={m.id} delay={Math.min(i, 5) * 0.06} className="h-full">
            <TeamCard m={m} variant={group.variant} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ────────────────────────────── Card ────────────────────────────── */

function TeamCard({ m, variant }: { m: TeamMember; variant: "lead" | "compact" }) {
  const { t } = useLanguage();
  const isLead = variant === "lead";
  const hasLinks = m.linkedinUrl || m.websiteUrl || m.email;
  return (
    <div
      className={`group card-base card-hover h-full flex flex-col ${isLead ? "p-7" : "p-6"} hover:border-primary/40`}
    >
      {/* Hover aura — crimson, transform/opacity only */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: "radial-gradient(130% 90% at 85% 0%, hsl(354 80% 55% / 0.1), transparent 60%)",
        }}
      />

      {m.featured && (
        <div className="relative inline-flex items-center gap-1.5 self-start mb-4 px-2.5 py-0.5 rounded-full text-[10px] tracking-[0.16em] uppercase font-bold chip-sand">
          {t({ ar: "مؤسِّس", en: "Founding" })}
        </div>
      )}

      <div className="relative flex items-center gap-4 mb-4">
        {m.avatarUrl ? (
          <img
            src={m.avatarUrl}
            alt={m.fullName}
            className={`${isLead ? "w-20 h-20" : "w-16 h-16"} shrink-0 rounded-2xl object-cover border border-border-strong shadow-soft saturate-[1.03] transition-transform duration-300 group-hover:scale-[1.04]`}
            loading="lazy"
          />
        ) : (
          // Crimson MEDALLION — the signature for people without a photo.
          <div
            className={`${isLead ? "w-20 h-20 text-[1.9rem]" : "w-16 h-16 text-2xl"} shrink-0 rounded-2xl ring-2 ring-white/15 shadow-soft flex items-center justify-center font-display font-black text-white transition-transform duration-300 group-hover:scale-[1.06]`}
            style={{ background: "linear-gradient(140deg, hsl(var(--primary)) 0%, hsl(var(--primary-pressed)) 100%)" }}
          >
            {initialOf(m.fullName)}
          </div>
        )}
        <div className="min-w-0">
          <h3
            className={`text-foreground font-display font-bold leading-snug truncate group-hover:text-primary transition-colors ${isLead ? "text-[18px]" : "text-[16px]"}`}
          >
            {m.fullName}
          </h3>
          {m.role && (
            <p className="text-fg-secondary text-[12.5px] font-semibold leading-snug mt-1 line-clamp-2">
              {m.role}
            </p>
          )}
        </div>
      </div>

      {m.bio && (
        <p
          className={`relative text-fg-secondary text-[13.5px] leading-[1.85] mb-5 flex-1 ${isLead ? "" : "line-clamp-3"}`}
        >
          {m.bio}
        </p>
      )}

      {hasLinks && (
        <div className="relative flex items-center flex-wrap gap-3.5 mt-auto pt-3.5 border-t border-border">
          {m.linkedinUrl && (
            <a
              href={m.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`LinkedIn — ${m.fullName}`}
              className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5" /> LinkedIn
            </a>
          )}
          {m.websiteUrl && (
            <a
              href={m.websiteUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={t({ ar: `الموقع — ${m.fullName}`, en: `Website — ${m.fullName}` })}
              className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary transition-colors"
            >
              <Globe className="w-3.5 h-3.5" /> {t({ ar: "الموقع", en: "Website" })}
            </a>
          )}
          {m.email && (
            <a
              href={`mailto:${m.email}`}
              aria-label={t({ ar: `راسل ${m.fullName}`, en: `Email ${m.fullName}` })}
              className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span dir="ltr" className="truncate max-w-[160px]">{m.email}</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────── Educational empty state ──────────────────────── */

function TeamEmpty() {
  const { t } = useLanguage();
  return (
    <EmptyState
      title={t({ ar: "الفريق يتشكّل الآن", en: "The team is forming" })}
      hint={t({
        ar: "حاضنة فتيّة وُلدت عام ٢٠٢٤ — قيادتها ومرشدوها ومستشاروها ينضمّون تباعًا. هذه الصّفحة تكبر مع كلّ من يقف معنا. كُن أوّل من يكتب اسمه هنا.",
        en: "A young incubator founded in 2024 — its leadership, mentors and advisors are joining one by one. This page grows with everyone who stands with us. Be among the first names on it.",
      })}
      action={
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/become-mentor?ref=team-empty"
            data-testid="team-empty-become-mentor"
            className="cta-fill group inline-flex items-center gap-2.5 h-11 px-6 rounded-full font-bold text-[13.5px] transition-transform duration-200 hover:-translate-y-0.5"
          >
            {t({ ar: "كُن مرشدًا", en: "Become a mentor" })}
            <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
          </Link>
          <Link
            href="/about"
            className="group inline-flex items-center gap-2 text-[13.5px] font-semibold text-primary"
          >
            {t({ ar: "قصّة آيلاند", en: "The Island Haven story" })}
            <ArrowLeft className="w-4 h-4 rotate-180 rtl:rotate-0 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
          </Link>
        </div>
      }
    />
  );
}

/* ───────────────────────── Closing — join band ───────────────────────── */

function JoinBand({ show }: { show: boolean }) {
  const { t } = useLanguage();
  if (!show) return null;
  return (
    <Reveal as="div" className="mt-16 card-base p-8 sm:p-11">
      <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,4rem)] gap-y-7 items-end">
        <div className="lg:col-span-8">
          <div className="flex items-center gap-3 mb-5">
            <span aria-hidden className="h-px w-9 bg-primary/50" />
            <span className="eyebrow">{t({ ar: "انضمّ إلينا", en: "Join us" })}</span>
          </div>
          <h3
            className="font-display font-extrabold text-foreground"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", lineHeight: 1.08, letterSpacing: "-0.028em" }}
          >
            {t({ ar: "هذا الفريق ", en: "This team " })}
            <span className="text-primary">{t({ ar: "يكبر بك.", en: "grows with you." })}</span>
          </h3>
          <p className="t-body mt-4 max-w-xl">
            {t({
              ar: "نَبحث دائمًا عن مرشدين وخبراء قطاع ومتطوّعين يؤمنون بريادة الأعمال في غزّة. ساعتك، أو خبرتك، أو شبكتك — كلٌّ منها يفتح بابًا أمام موهبة تنتظر.",
              en: "We're always looking for mentors, industry experts and volunteers who believe in entrepreneurship in Gaza. An hour, an expertise, a network — each one opens a door for talent that's waiting.",
            })}
          </p>
        </div>
        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-stretch">
          <Link
            href="/become-mentor?ref=team"
            data-testid="team-become-mentor"
            className="cta-fill group inline-flex items-center justify-center gap-2.5 h-12 px-6 rounded-full font-bold text-[14px] transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-16px_hsl(354_82%_30%_/_0.55)]"
          >
            {t({ ar: "كُن مرشدًا", en: "Become a mentor" })}
            <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
          </Link>
          <a
            href="mailto:island-haven@nastonas.org?subject=الانضمام%20لفريق%20آيلاند"
            data-testid="team-email"
            className="group inline-flex items-center justify-center gap-2.5 h-12 px-6 rounded-full border border-border-strong bg-surface-2 text-fg-secondary font-semibold text-[14px] hover:border-primary/40 hover:text-foreground transition-colors"
          >
            <Mail className="w-4 h-4" />
            {t({ ar: "راسلنا", en: "Email us" })}
          </a>
        </div>
      </div>
    </Reveal>
  );
}

/* ────────────────────────────── Skeleton ────────────────────────────── */

function SkeletonTeam() {
  return (
    <div className="space-y-12">
      <div className="card-base p-7 sm:p-8 h-40 animate-pulse" />
      {[0, 1].map((s) => (
        <div key={s}>
          <div className="h-7 w-44 rounded-lg bg-surface-2 animate-pulse mb-6" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-[24px] h-52 bg-surface-2 border border-border-strong shadow-soft animate-pulse"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
