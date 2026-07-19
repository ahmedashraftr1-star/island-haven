import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Globe, Linkedin, Mail } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { PageShell, EmptyState } from "@/components/shell/PageShell";
import { Reveal } from "@/components/landing/Reveal";
import { SpotlightOverlay } from "@/components/ui/SpotlightCard";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { EASE_OUT_EXPO } from "@/lib/motion";

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
  ar: string;
  en: string;
  blurb: { ar: string; en: string };
  variant: "lead" | "compact";
}[] = [
  {
    key: "leadership",
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
            lang === "ar"
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
          {/* Founding narrative — the "why", told the monumental editorial way.
              One calm line, the two real figures as inline cerulean data, acres
              of space. No eyebrow rule, no card panel, no ping dot. */}
          <FoundingNarrative total={total} teams={sections.length} />

          {/* Mission — one monumental editorial statement between the narrative
              and the photograph, so the page never opens on a void. */}
          <div className="py-16 sm:py-20 max-w-3xl mx-auto text-center">
            <p className="eyebrow eyebrow-sand font-mono mb-6">{t({ ar: "رسالتنا", en: "Our mission" })}</p>
            <blockquote
              className="font-display text-foreground leading-relaxed"
              style={{ fontSize: "clamp(1.4rem,3vw,2rem)", letterSpacing: "-0.01em" }}
            >
              {t({
                ar: "نحن لا نبني مبنًى — نبني نظامًا يجعل كلّ موهبة في غزّة قادرة على المنافسة العالميّة بنفس الأدوات الّتي يملكها أيّ مطوّر في برلين أو سنغافورة.",
                en: "We're not building a space — we're building a system that lets every talent in Gaza compete globally with the same tools a developer in Berlin or Singapore has.",
              })}
            </blockquote>
            <p className="t-caption text-fg-secondary mt-6">
              {t({ ar: "— فريق التأسيس، آيلاند هيفن ٢٠٢٤", en: "— The founding team, Island Haven 2024" })}
            </p>
          </div>

          {/* One monumental full-bleed photograph with a slow scroll parallax —
              the page's single large-photography moment, mirroring Statement. */}
          <PhotoBand />

          {sections.map((g) => (
            <TeamSection key={g.key} group={g} members={grouped[g.key]} />
          ))}
        </>
      )}

      {/* Warm dual-path closing — only when a real roster exists; the empty
          state already supplies its own dual-path mentor CTA. */}
      <JoinBand show={hasTeam} />
    </PageShell>
  );
}

/* ───────────────────────── Founding narrative ───────────────────────── */

function FoundingNarrative({ total, teams }: { total: number; teams: number }) {
  const { lang, t } = useLanguage();
  const reduce = useReducedMotion();

  const ledger = [
    { v: total, label: t({ ar: "عضوًا في الفريق", en: "team members" }) },
    { v: teams, label: t({ ar: "فِرَق متخصِّصة", en: "specialised teams" }) },
  ];

  return (
    <section className="mb-[clamp(4.5rem,9vw,8rem)]">
      <header className="max-w-4xl">
        <h2
          className="font-display text-foreground"
          style={{ fontSize: "clamp(2.4rem, 6.4vw, 5rem)", lineHeight: 1.0, letterSpacing: "-0.04em", fontWeight: 700 }}
        >
          {[
            t({ ar: "فريقٌ صغير،", en: "A small team," }),
            <span key="accent">
              {t({ ar: "هدفٌ ", en: "a vast " })}
              <span className="text-primary">{t({ ar: "كبير.", en: "goal." })}</span>
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
          transition={{ duration: 0.85, delay: 0.36, ease: EASE_OUT_EXPO }}
          className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-2xl text-fg-secondary"
          style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
        >
          {t({
            ar: "نَسعى لتمكين ألف موهبة غزّاويّة خلال ثلاث سنوات للدّخول إلى الاقتصاد الرّقميّ العالميّ — عبر ثلاثة محاور: البنية والحلول، التطوير والابتكار، والشّبكات والأثر العالميّ. كلّ هذا مجّانًا، بدعمٍ من «من النّاس إلى النّاس».",
            en: "We aim to empower a thousand Gazan talents over three years to enter the global digital economy — across three axes: infrastructure & solutions, development & innovation, and global networking & impact. All of it free, backed by NasToNas.",
          })}
        </motion.p>
      </header>

      {/* The two real figures, told as calm inline data — cerulean for the
          numerals only, separated by a hairline. No card panel, no medallions. */}
      <Reveal
        delay={0.1}
        className="mt-[clamp(2.5rem,5vw,4rem)] flex flex-wrap items-end gap-x-[clamp(2.5rem,6vw,5rem)] gap-y-6"
      >
        {ledger.map((row, i) => (
          <div key={i} className="flex items-baseline gap-3">
            <span
              className="font-display font-black tnum text-sand-bright leading-none"
              style={{ fontSize: "clamp(2.6rem, 5.5vw, 4rem)", letterSpacing: "-0.045em" }}
            >
              {num(row.v, lang)}
            </span>
            <span className="t-caption text-fg-secondary max-w-[9rem]">{row.label}</span>
          </div>
        ))}
        <span aria-hidden className="hidden sm:block h-9 w-px bg-border-strong/60 self-center" />
        <span className="t-caption text-fg-secondary">
          {t({ ar: "بدعمٍ من · من النّاس إلى النّاس", en: "Backed by · NasToNas" })}
        </span>
      </Reveal>
    </section>
  );
}

/* ──────────────────────── Full-bleed photo band ──────────────────────── */

/**
 * One monumental, calm photograph that spans the full viewport width with a
 * slow scroll parallax — the page's single large-photography moment. Mirrors
 * Statement.tsx (useScroll + useTransform, clamped flat under reduced-motion).
 * Breaks out of the PageShell container via the standard left-1/2/-mx-[50vw]
 * full-bleed escape; the shell's overflow-hidden absorbs the extra width.
 */
function PhotoBand() {
  const reduce = useReducedMotion();
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-8%", "8%"]);

  return (
    <section
      ref={ref}
      className="relative left-1/2 right-1/2 -mx-[50vw] w-screen mb-[clamp(4.5rem,9vw,8rem)] overflow-hidden"
    >
      <div className="relative h-[clamp(22rem,52vw,40rem)] overflow-hidden bg-surface-1">
        <motion.img
          src="/photos/IMG_8352.webp"
          alt={t({ ar: "الفريق في مساحة آيلاند بغزّة", en: "The team inside the Island Haven space in Gaza" })}
          loading="lazy"
          style={{ y }}
          className="absolute inset-0 h-[116%] w-full -top-[8%] object-cover will-change-transform"
        />
        {/* Quiet legibility wash — not glassmorphism, just a grounding gradient. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/10"
        />
        <div className="absolute inset-x-0 bottom-0 px-5 sm:px-8 lg:px-14 pb-[clamp(1.75rem,4vw,3rem)]">
          <div className="mx-auto max-w-6xl">
            <p
              className="font-display font-semibold text-foreground max-w-xl"
              style={{ fontSize: "clamp(1.05rem,2vw,1.6rem)", letterSpacing: "-0.02em", lineHeight: 1.25 }}
            >
              {t({
                ar: "من قلب غزّة — حيث تُبنى المساحة، والمجتمع، والطّريق نحو العالم.",
                en: "From the heart of Gaza — where the space, the community and the path outward are built.",
              })}
            </p>
          </div>
        </div>
      </div>
    </section>
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
  const { t } = useLanguage();

  return (
    <section className="relative mb-[clamp(4rem,8vw,7rem)]">
      {/* Calm monumental section line — a name and an honest one-line note. No
          giant outline numeral, no uppercase kicker, no pill chip, no count
          badge (FoundingNarrative already states the total). */}
      <Reveal className="max-w-2xl pb-[clamp(1.25rem,2.5vw,2rem)] border-b border-border-strong">
        <h2
          className="font-display font-bold text-foreground"
          style={{ fontSize: "clamp(1.7rem, 3.6vw, 2.9rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}
        >
          {t({ ar: group.ar, en: group.en })}
        </h2>
        <p className="t-body text-[15px] md:text-[16px] mt-2.5 max-w-xl">{t(group.blurb)}</p>
      </Reveal>

      {/* The roster — a premium card grid: an avatar (a real face where one
          exists, else an elegant gold-initials panel), the name, the role, a
          short bio, and quiet links. */}
      <ul className="mt-[clamp(2rem,4vw,3rem)] grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {members.map((m, i) => (
          <TeamCard key={m.id} m={m} i={i} />
        ))}
      </ul>
    </section>
  );
}

/* ────────────────────────────── Row ────────────────────────────── */

function TeamCard({ m, i }: { m: TeamMember; i: number }) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const initial = m.fullName.trim().charAt(0);
  const hasLinks = m.linkedinUrl || m.websiteUrl || m.email;

  return (
    <li className="h-full">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: Math.min(i, 6) * 0.05, ease: EASE_OUT_EXPO }}
        className="group relative spectral-edge flex h-full flex-col overflow-hidden rounded-[18px] border border-border-strong bg-surface-2/50 transition-[transform,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none hover:-translate-y-0.5 hover:border-primary/40 will-change-transform"
      >
        <SpotlightOverlay />
        {/* Avatar panel — a real face where one exists, else a neutral panel with
            a single gold initial (not a circular medallion, not a brown wash). */}
        <div className="relative h-[clamp(8.5rem,18vw,10.5rem)] w-full overflow-hidden bg-white/[0.03]">
          {m.avatarUrl ? (
            <img
              src={m.avatarUrl}
              alt={m.fullName}
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
                {initial}
              </span>
            </div>
          )}
          {m.featured && (
            <span className="absolute top-3 end-3 inline-flex items-center rounded-full bg-[#0a0a0a]/70 backdrop-blur-md px-2.5 h-6 text-[10.5px] font-semibold text-sand">
              {t({ ar: "مؤسِّس", en: "Founding" })}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-5">
          <h3
            title={m.fullName}
            className="font-display font-bold text-foreground text-[18px] leading-tight line-clamp-1 group-hover:text-primary transition-colors"
          >
            {m.fullName}
          </h3>
          {m.role && <p className="t-caption text-fg-secondary mt-1 line-clamp-1">{m.role}</p>}
          {m.bio && <p className="t-body text-[14px] mt-3 line-clamp-3">{m.bio}</p>}

          {hasLinks && (
            <div className="mt-auto pt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              {m.linkedinUrl && (
                <a
                  href={m.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`LinkedIn — ${m.fullName}`}
                  className="inline-flex items-center gap-1.5 t-caption text-fg-secondary hover:text-primary transition-colors"
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
                  className="inline-flex items-center gap-1.5 t-caption text-fg-secondary hover:text-primary transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" /> {t({ ar: "الموقع", en: "Website" })}
                </a>
              )}
              {m.email && (
                <a
                  href={`mailto:${m.email}`}
                  aria-label={t({ ar: `راسل ${m.fullName}`, en: `Email ${m.fullName}` })}
                  className="inline-flex items-center gap-1.5 t-caption text-fg-secondary hover:text-primary transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </li>
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
  const reduce = useReducedMotion();
  if (!show) return null;
  return (
    <section className="mt-[clamp(4rem,8vw,7rem)] pt-[clamp(3rem,6vw,5rem)] border-t border-border-strong">
      <div className="max-w-4xl">
        <h2
          className="font-display text-foreground"
          style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)", lineHeight: 1.02, letterSpacing: "-0.04em", fontWeight: 700 }}
        >
          {[
            t({ ar: "هذا الفريق", en: "This team" }),
            <span key="accent" className="text-primary">{t({ ar: "يكبر بك.", en: "grows with you." })}</span>,
          ].map((ln, i) => (
            <motion.span
              key={i}
              className="block will-change-transform"
              initial={reduce ? false : { opacity: 0, y: 28 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, delay: i * 0.09, ease: EASE_OUT_EXPO }}
            >
              {ln}
            </motion.span>
          ))}
        </h2>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ duration: 0.8, delay: 0.32, ease: EASE_OUT_EXPO }}
          className="mt-[clamp(1.5rem,3vw,2.25rem)] max-w-2xl text-fg-secondary"
          style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
        >
          {t({
            ar: "نَبحث دائمًا عن مرشدين وخبراء قطاع ومتطوّعين يؤمنون بريادة الأعمال في غزّة. ساعتك، أو خبرتك، أو شبكتك — كلٌّ منها يفتح بابًا أمام موهبة تنتظر.",
            en: "We're always looking for mentors, industry experts and volunteers who believe in entrepreneurship in Gaza. An hour, an expertise, a network — each one opens a door for talent that's waiting.",
          })}
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ duration: 0.75, delay: 0.44, ease: EASE_OUT_EXPO }}
          className="mt-[clamp(2rem,4vw,3rem)] flex flex-wrap items-center gap-x-7 gap-y-4"
        >
          <Link
            href="/become-mentor?ref=team"
            data-testid="team-become-mentor"
            className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-16px_hsl(354_82%_30%_/_0.55)]"
          >
            {t({ ar: "كُن مرشدًا", en: "Become a mentor" })}
            <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
          </Link>
          <a
            href="mailto:island-haven@nastonas.org?subject=الانضمام%20لفريق%20آيلاند"
            data-testid="team-email"
            className="group inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            style={{ fontSize: "clamp(1rem,1.6vw,1.2rem)", fontWeight: 600 }}
          >
            <Mail className="w-4 h-4" />
            {t({ ar: "راسلنا", en: "Email us" })}
          </a>
        </motion.div>
      </div>
    </section>
  );
}

/* ────────────────────────────── Skeleton ────────────────────────────── */

function SkeletonTeam() {
  return (
    <div className="space-y-12">
      <div className="space-y-5">
        <div className="h-12 w-3/4 max-w-xl rounded-lg bg-surface-2 animate-pulse" />
        <div className="h-5 w-1/2 max-w-md rounded bg-surface-2 animate-pulse" />
      </div>
      {[0, 1].map((s) => (
        <div key={s} className="space-y-6">
          <div className="h-8 w-44 rounded-lg bg-surface-2 animate-pulse pb-6 border-b border-border-strong/60" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-5 py-6 border-b border-border-strong/60">
              <div className="h-14 w-14 rounded-full bg-surface-2 animate-pulse shrink-0" />
              <div className="h-7 w-48 max-w-[60%] rounded bg-surface-2 animate-pulse" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
