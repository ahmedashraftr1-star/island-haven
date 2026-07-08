import type { ReactNode } from "react";
import { Link } from "wouter";
import {
  BookOpen,
  Route as RouteIcon,
  BarChart3,
  Users,
  Globe2,
  Sparkles,
  ExternalLink,
  ArrowLeft,
  FileText,
  Quote,
} from "lucide-react";
import { useContentSection, imageUrl } from "@/hooks/use-content";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";
import { ProjectTOC, type TOCSection } from "@/components/landing/ProjectTOC";
import { ventureIdentity } from "@/lib/ventureIdentity";

/* ── Shared shapes (mirror the /ventures/:id + /milestones API) ── */
export interface CaseStudyMetric { v: string; ar: string; en: string }

export interface CaseStudyVenture {
  id: number;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string | null;
  coverUrl: string | null;
  websiteUrl: string;
  founderName: string;
  founderQuote?: string;
  sector: string;
  stage: string;
  foundedYear: number;
  teamSize: number;
  featured: boolean;
  metrics?: CaseStudyMetric[];
}

export interface CaseStudyMilestone {
  id: number;
  title: string;
  body: string;
  type:
    | "idea"
    | "mvp"
    | "launch"
    | "first_customer"
    | "first_revenue"
    | "funding"
    | "team_grew"
    | "press"
    | "partnership"
    | "other";
  achievedAt: string;
  amount: number | null;
  metricValue: number | null;
  link: string;
}

export interface CaseStudyPitchDeck { title: string; url: string }

/* Evergreen frames — a cover-less venture still wears real imagery, deterministic
   by id so it matches the listing / detail cover. */
const FRAMES = [
  "/photos/IMG_8344.webp", "/photos/IMG_8347.webp", "/photos/IMG_8349.webp",
  "/photos/IMG_8353.webp", "/photos/IMG_8357.webp", "/photos/IMG_8358.webp",
];
const frameFor = (id: number) => FRAMES[Math.abs(id) % FRAMES.length];

/* Honest milestone-type labels (bilingual) — no invented types. */
const MILESTONE_LABELS: Record<CaseStudyMilestone["type"], { ar: string; en: string }> = {
  idea: { ar: "الفكرة", en: "Idea" },
  mvp: { ar: "نموذج أوّليّ", en: "MVP" },
  launch: { ar: "إطلاق", en: "Launch" },
  first_customer: { ar: "أوّل عميل", en: "First customer" },
  first_revenue: { ar: "أوّل إيراد", en: "First revenue" },
  funding: { ar: "تمويل", en: "Funding" },
  team_grew: { ar: "نموّ الفريق", en: "Team grew" },
  press: { ar: "تغطية إعلاميّة", en: "Press" },
  partnership: { ar: "شراكة", en: "Partnership" },
  other: { ar: "حدث", en: "Milestone" },
};

/* ── Metrics honesty (IDENTICAL rule to VenturesShowcase.resolveMetrics):
   real venture.metrics, else a CMS venture_metrics entry keyed by id/name,
   else [] — never an invented figure. ── */
function resolveMetrics(
  v: CaseStudyVenture,
  cms: Record<string, string>,
): CaseStudyMetric[] {
  if (v.metrics?.length) return v.metrics;
  const raw = cms[String(v.id)] ?? cms[v.name];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as CaseStudyMetric[];
    } catch { /* malformed CMS value → show nothing, never invent */ }
  }
  return [];
}

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}

/* ── A section wrapper: small muted eyebrow → heavy heading → limited-measure
   body. Generous vertical rhythm, top hairline divider (except the hero). ── */
function Section({
  id,
  eyebrow,
  heading,
  children,
  divider = true,
}: {
  id: string;
  eyebrow?: ReactNode;
  heading?: ReactNode;
  children: ReactNode;
  divider?: boolean;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28"
      style={{ paddingBlock: "clamp(4rem, 9vh, 8rem)" }}
    >
      {divider && (
        <div
          aria-hidden
          className="mb-[clamp(2.5rem,5vw,4rem)] h-px w-full bg-gradient-to-r from-border-strong/70 via-border-strong/25 to-transparent rtl:bg-gradient-to-l"
        />
      )}
      <Reveal>
        {eyebrow && (
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden className="h-px w-7 bg-primary/60" />
            <span className="eyebrow">{eyebrow}</span>
          </div>
        )}
        {heading && (
          <h2
            className="font-display font-black text-foreground"
            style={{ fontSize: "clamp(1.9rem,3.6vw,3rem)", lineHeight: 1.05, letterSpacing: "-0.03em" }}
          >
            {heading}
          </h2>
        )}
      </Reveal>
      {children}
    </section>
  );
}

/* ── 1 · HERO ── */
function Hero({ v }: { v: CaseStudyVenture }) {
  const { t } = useLanguage();
  const vid = ventureIdentity(v.sector, v.id);
  const cover = imageUrl(v.coverUrl) || frameFor(v.id);
  return (
    <section id="cs-hero" className="scroll-mt-28" style={{ paddingBlock: "clamp(2rem, 5vh, 4rem)" }}>
      <Reveal>
        <div className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground rtl:tracking-normal">
          {t({ ar: "دراسة حالة", en: "Case study" })}
          {v.sector && (
            <>
              <span aria-hidden className="mx-2 text-white/25">·</span>
              <span style={{ color: vid.accent }}>{v.sector}</span>
            </>
          )}
        </div>
        <h1
          data-testid="text-venture-name"
          className="font-display font-black text-foreground"
          style={{ fontSize: "clamp(3rem,6vw,6rem)", lineHeight: 1.05, letterSpacing: "-0.04em" }}
        >
          {v.name}
        </h1>
        {v.tagline && (
          <p
            className="mt-5 max-w-2xl text-fg-secondary"
            style={{ fontSize: "clamp(1.05rem,1.7vw,1.4rem)", lineHeight: 1.5 }}
          >
            {v.tagline}
          </p>
        )}
      </Reveal>

      <Reveal delay={0.08}>
        <div className="relative mt-[clamp(2.5rem,5vw,4rem)]">
          {/* quiet gradient backdrop behind the framed cover */}
          <div
            aria-hidden
            className="absolute -inset-x-4 -inset-y-6 -z-10 rounded-[36px] opacity-70 blur-2xl"
            style={{ background: vid.gradient }}
          />
          <div className="relative overflow-hidden rounded-[28px] ring-1 ring-white/12 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.85)]">
            <div className="relative aspect-[16/9] bg-[#070707]">
              <img
                src={cover}
                alt={v.name}
                loading="eager"
                decoding="async"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = frameFor(v.id); }}
                className="absolute inset-0 h-full w-full object-cover object-center saturate-[1.04]"
              />
              <div aria-hidden className="absolute inset-0 opacity-[0.16] mix-blend-soft-light" style={{ background: vid.gradient }} />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ── 2 · OVERVIEW ── */
function Overview({ v }: { v: CaseStudyVenture }) {
  const { t } = useLanguage();
  return (
    <Section
      id="cs-overview"
      eyebrow={t({ ar: "نبذة", en: "Overview" })}
      heading={t({ ar: "عن المشروع", en: "About the venture" })}
    >
      <Reveal delay={0.06}>
        <p
          className="mt-6 whitespace-pre-wrap t-body"
          style={{ maxWidth: "65ch", lineHeight: 1.7 }}
        >
          {v.description}
        </p>
      </Reveal>
    </Section>
  );
}

/* ── 3 · THE JOURNEY (milestone spine) ── */
function Journey({ v, milestones }: { v: CaseStudyVenture; milestones: CaseStudyMilestone[] }) {
  const { t, lang } = useLanguage();
  return (
    <Section
      id="cs-journey"
      eyebrow={t({ ar: "الرحلة", en: "The journey" })}
      heading={t({ ar: "كيف وصلنا إلى هنا", en: "How we got here" })}
    >
      <ol className="relative mt-[clamp(2.5rem,5vw,4rem)]">
        {/* Vertical terracotta rail on the logical-START side (RIGHT in RTL). */}
        <span
          aria-hidden
          className="absolute inset-block-0 start-[7px] w-px bg-gradient-to-b from-primary/50 via-primary/25 to-transparent"
        />
        {milestones.map((m, i) => {
          const date = new Date(m.achievedAt).toLocaleDateString(
            lang === "ar" ? "ar-EG" : "en-GB",
            { year: "numeric", month: "long" },
          );
          const chips = Boolean(m.amount || m.metricValue || m.link);
          return (
            <li key={m.id} className="relative ps-9 pb-[clamp(2rem,4vw,3rem)] last:pb-0">
              <Reveal delay={Math.min(i * 0.05, 0.3)}>
                <span
                  aria-hidden
                  className="absolute top-1.5 start-[2px] h-3 w-3 rounded-full bg-primary ring-[3px] ring-background shadow-[0_0_0_2px_hsl(var(--primary)/0.35)]"
                />
                <div className="mb-2 flex flex-wrap items-center gap-2.5">
                  <span className="rounded-full border border-primary/30 bg-primary/[0.12] px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary rtl:tracking-normal">
                    {t(MILESTONE_LABELS[m.type])}
                  </span>
                  <span className="text-[11.5px] font-medium text-muted-foreground tnum">{date}</span>
                </div>
                <h3 className="font-display font-bold text-foreground" style={{ fontSize: "clamp(1.15rem,1.8vw,1.5rem)", lineHeight: 1.25 }}>
                  {m.title}
                </h3>
                {m.body && (
                  <p className="mt-2 whitespace-pre-wrap t-body" style={{ maxWidth: "62ch", lineHeight: 1.7 }}>
                    {m.body}
                  </p>
                )}
                {chips && (
                  <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[12px]">
                    {m.amount ? (
                      <span className="rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-0.5 font-semibold tnum text-sand-bright">
                        ${m.amount.toLocaleString("en-US")}
                      </span>
                    ) : null}
                    {m.metricValue ? (
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 tnum text-fg-secondary">
                        {t({ ar: "قيمة", en: "Value" })}: {m.metricValue.toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
                      </span>
                    ) : null}
                    {m.link && (
                      <a
                        href={m.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                      >
                        {t({ ar: "رابط", en: "Link" })}
                        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                      </a>
                    )}
                  </div>
                )}
              </Reveal>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

/* ── 4 · BY THE NUMBERS (gold-figure ledger) ── */
function ByTheNumbers({ metrics }: { metrics: CaseStudyMetric[] }) {
  const { t, lang } = useLanguage();
  return (
    <Section
      id="cs-numbers"
      eyebrow={t({ ar: "الأرقام", en: "By the numbers" })}
      heading={t({ ar: "أرقام حقيقيّة", en: "Real figures" })}
    >
      <Reveal delay={0.06}>
        <dl className="mt-[clamp(2rem,4vw,3rem)] max-w-2xl divide-y divide-white/[0.07] border-y border-white/[0.07]">
          {metrics.map((m, i) => (
            <div key={i} className="flex items-baseline justify-between gap-6 py-5">
              <dt className="t-body" style={{ marginBottom: 0 }}>
                {lang === "ar" ? m.ar : m.en}
              </dt>
              <dd className="font-display font-black tnum text-sand-bright" style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)", lineHeight: 1 }}>
                {m.v}
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </Section>
  );
}

/* ── 5 · FOUNDER'S VOICE (an editorial pull-quote — renders ONLY when a real
   founderQuote is stored; never invented, never a placeholder) ── */
function FounderVoice({ v }: { v: CaseStudyVenture }) {
  const { t } = useLanguage();
  const quote = v.founderQuote?.trim() ?? "";
  const initial = v.founderName.trim().charAt(0);
  return (
    <Section
      id="cs-founder-voice"
      eyebrow={t({ ar: "صوت المؤسّس", en: "Founder's voice" })}
      heading={t({ ar: "بكلماته", en: "In their words" })}
    >
      <Reveal delay={0.06}>
        <figure className="mt-[clamp(2rem,4vw,3rem)] max-w-3xl rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-[clamp(1.75rem,4vw,3rem)] shadow-[0_40px_120px_-60px_rgba(0,0,0,0.85)]">
          <Quote
            aria-hidden
            className="h-9 w-9 text-primary rtl:-scale-x-100"
            strokeWidth={1.5}
          />
          <blockquote
            className="mt-4 whitespace-pre-wrap font-display font-medium text-foreground"
            style={{ fontSize: "clamp(1.4rem,2.8vw,2.15rem)", lineHeight: 1.35, letterSpacing: "-0.01em" }}
          >
            {quote}
          </blockquote>
          {v.founderName && (
            <figcaption className="mt-7 flex items-center gap-3.5">
              <span
                aria-hidden
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/[0.12] font-display font-black text-primary"
                style={{ fontSize: "1.05rem" }}
              >
                {initial}
              </span>
              <span className="min-w-0">
                <span className="block font-display font-bold text-foreground" style={{ fontSize: "clamp(1rem,1.5vw,1.2rem)" }}>
                  {v.founderName}
                </span>
                <span className="block text-[11.5px] uppercase tracking-[0.16em] text-muted-foreground rtl:tracking-normal">
                  {t({ ar: "المؤسِّس", en: "Founder" })}
                </span>
              </span>
            </figcaption>
          )}
        </figure>
      </Reveal>
    </Section>
  );
}

/* ── 6 · THE TEAM (real facts only, no invented quote) ── */
function Team({ v }: { v: CaseStudyVenture }) {
  const { t, lang } = useLanguage();
  const facts: { label: { ar: string; en: string }; value: string }[] = [];
  if (v.founderName) facts.push({ label: { ar: "المؤسِّس", en: "Founder" }, value: v.founderName });
  if (v.teamSize > 1) {
    facts.push({
      label: { ar: "حجم الفريق", en: "Team size" },
      value: lang === "ar" ? `${num(v.teamSize, lang)} أعضاء` : `${num(v.teamSize, lang)} members`,
    });
  }
  if (v.foundedYear > 0) facts.push({ label: { ar: "سنة التأسيس", en: "Founded" }, value: num(v.foundedYear, lang) });
  if (v.sector) facts.push({ label: { ar: "القطاع", en: "Sector" }, value: v.sector });

  return (
    <Section
      id="cs-team"
      eyebrow={t({ ar: "الفريق", en: "The team" })}
      heading={t({ ar: "من يبني هذا", en: "Who's building this" })}
    >
      <Reveal delay={0.06}>
        <dl className="mt-[clamp(2rem,4vw,3rem)] grid max-w-2xl grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-2">
          {facts.map((f, i) => (
            <div key={i}>
              <dt className="mb-1.5 text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground rtl:tracking-normal">
                {t(f.label)}
              </dt>
              <dd className="font-display font-bold text-foreground" style={{ fontSize: "clamp(1.05rem,1.6vw,1.3rem)" }}>
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
        {v.websiteUrl && (
          <a
            href={v.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 text-[14px] font-bold text-primary hover:underline"
          >
            {t({ ar: "زيارة المشروع", en: "Visit the venture" })}
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </Reveal>
    </Section>
  );
}

/* ── 7 · FROM GAZA TO THE WORLD (closing, always) ── */
function GazaToWorld({
  v,
  pitchDeck,
}: {
  v: CaseStudyVenture;
  pitchDeck: CaseStudyPitchDeck | null;
}) {
  const { t } = useLanguage();
  return (
    <Section
      id="cs-gaza"
      eyebrow={t({ ar: "من غزّة، إلى العالم", en: "From Gaza to the world" })}
      heading={t({ ar: "مواهب من غزّة تصل إلى الأسواق العالميّة", en: "Talent from Gaza reaching global markets" })}
    >
      <Reveal delay={0.06}>
        <p className="mt-6 t-body" style={{ maxWidth: "65ch", lineHeight: 1.7 }}>
          {t({
            ar: "كلّ مشروع هنا يبدأ داخل مساحتنا في غزّة، بأيدٍ محلّيّة وطموحٍ عالميّ. نحن نحتضن الفرق، نقف معها من الفكرة حتى الإطلاق، ونساعدها على الوصول إلى مستخدمين وداعمين خارج الحدود.",
            en: "Every venture here begins inside our space in Gaza — built by local hands with global ambition. We incubate the teams, stand with them from idea to launch, and help them reach users and backers beyond the border.",
          })}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {v.websiteUrl && (
            <a
              href={v.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-fill inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-bold transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              {t({ ar: "زيارة المشروع", en: "Visit the venture" })}
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {pitchDeck && (
            <a
              href={pitchDeck.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface-2 px-6 py-3 text-[14px] font-bold text-foreground transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <FileText className="h-4 w-4 text-primary" />
              {t({ ar: "ملفّ العرض", en: "Pitch deck" })}
            </a>
          )}
          <Link
            href="/apply"
            className="group inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface-2 px-6 py-3 text-[14px] font-bold text-foreground transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            {t({ ar: "قدّم مشروعك", en: "Apply" })}
            <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
          </Link>
        </div>
      </Reveal>
    </Section>
  );
}

/**
 * ProjectCaseStudy — the editorial narrative for one venture. It composes an
 * ordered list of sections, INCLUDING a section only when its real data exists
 * (no fabricated prose, quotes, or figures). The resolved section list also
 * drives the sticky ProjectTOC, so the index and the page stay in lockstep.
 *
 * Layout: on lg+ a two-column grid places the TOC first in DOM, landing it on
 * the logical-START side (RIGHT in RTL, LEFT in LTR), with the case-study body
 * beside it. Below lg the TOC hides.
 */
/* ── Timeline integrity guard (§ data-honesty): a venture's journey must NEVER
   render a duplicated or conflicting milestone (two "idea born" dates, the same
   award told twice, etc.). Sort ascending, then keep the FIRST (earliest)
   occurrence and drop any later row that repeats an earlier one by normalized
   TITLE or by (type on the same calendar day). Distinct same-type events on
   different days are preserved. In dev, dropped conflicts are surfaced via
   console.warn rather than silently shipped. ── */
function dedupeMilestones(list: CaseStudyMilestone[]): CaseStudyMilestone[] {
  const sorted = [...list].sort(
    (a, b) => new Date(a.achievedAt).getTime() - new Date(b.achievedAt).getTime(),
  );
  const seen = new Set<string>();
  const out: CaseStudyMilestone[] = [];
  const dropped: CaseStudyMilestone[] = [];
  for (const m of sorted) {
    const titleKey = "t:" + (m.title ?? "").trim().replace(/\s+/g, " ").toLowerCase();
    const typeDayKey = "d:" + m.type + "|" + (m.achievedAt ?? "").slice(0, 10);
    if ((titleKey !== "t:" && seen.has(titleKey)) || seen.has(typeDayKey)) {
      dropped.push(m);
      continue;
    }
    seen.add(titleKey);
    seen.add(typeDayKey);
    out.push(m);
  }
  if (dropped.length && import.meta.env?.DEV) {
    console.warn(
      `[ProjectCaseStudy] dropped ${dropped.length} duplicate/conflicting milestone(s) from the timeline:`,
      dropped.map((d) => `${d.type} · ${(d.achievedAt ?? "").slice(0, 10)} · ${d.title}`),
    );
  }
  return out;
}

export function ProjectCaseStudy({
  venture,
  milestones,
  pitchDeck,
}: {
  venture: CaseStudyVenture;
  milestones: CaseStudyMilestone[];
  pitchDeck: CaseStudyPitchDeck | null;
}) {
  const { t } = useLanguage();
  const metricsCms = useContentSection("venture_metrics", {} as Record<string, string>);
  const metrics = resolveMetrics(venture, metricsCms);

  // Never ship a duplicated/conflicting timeline (belt-and-suspenders even after
  // the data is cleaned at the source).
  const journeyMilestones = dedupeMilestones(milestones);
  const hasOverview = venture.description.trim() !== "";
  const hasJourney = journeyMilestones.length > 0;
  const hasNumbers = metrics.length > 0;
  const hasFounderVoice = Boolean(venture.founderQuote?.trim());
  const hasTeam = Boolean(venture.founderName) || venture.teamSize > 1 || venture.foundedYear > 0;

  // Build the TOC dynamically — only real sections, in narrative order.
  const sections: TOCSection[] = [
    { id: "cs-hero", icon: Sparkles, label: { ar: "نظرة عامّة", en: "Overview" } },
  ];
  if (hasOverview) sections.push({ id: "cs-overview", icon: BookOpen, label: { ar: "نبذة", en: "About" } });
  if (hasJourney) sections.push({ id: "cs-journey", icon: RouteIcon, label: { ar: "الرحلة", en: "The journey" } });
  if (hasNumbers) sections.push({ id: "cs-numbers", icon: BarChart3, label: { ar: "الأرقام", en: "By the numbers" } });
  if (hasFounderVoice) sections.push({ id: "cs-founder-voice", icon: Quote, label: { ar: "صوت المؤسّس", en: "Founder's voice" } });
  if (hasTeam) sections.push({ id: "cs-team", icon: Users, label: { ar: "الفريق", en: "The team" } });
  sections.push({ id: "cs-gaza", icon: Globe2, label: { ar: "من غزّة، إلى العالم", en: "From Gaza to the world" } });

  return (
    <div
      data-testid="case-study"
      className="grid grid-cols-1 gap-x-[clamp(2rem,4vw,4rem)] lg:grid-cols-[15rem_minmax(0,1fr)]"
    >
      {/* TOC first in DOM → lands in the logical-START column = RIGHT in RTL
          (Arabic), LEFT in LTR (English). Hidden below lg. */}
      <aside className="hidden lg:block">
        <ProjectTOC sections={sections} />
      </aside>

      <article className="min-w-0">
        <Hero v={venture} />
        {hasOverview && <Overview v={venture} />}
        {hasJourney && <Journey v={venture} milestones={journeyMilestones} />}
        {hasNumbers && <ByTheNumbers metrics={metrics} />}
        {hasFounderVoice && <FounderVoice v={venture} />}
        {hasTeam && <Team v={venture} />}
        <GazaToWorld v={venture} pitchDeck={pitchDeck} />
      </article>

      {/* SR-only landmark so the whole study is announced even without the TOC. */}
      <span className="sr-only">{t({ ar: "نهاية دراسة الحالة", en: "End of case study" })}</span>
    </div>
  );
}

export default ProjectCaseStudy;
