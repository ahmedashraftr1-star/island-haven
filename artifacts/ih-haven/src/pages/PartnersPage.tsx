import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ExternalLink, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/shell/PageShell";
import { Reveal } from "@/components/landing/Reveal";
import { Ticker } from "@/components/landing/Ticker";
import { BrandMark } from "@/components/landing/BrandLogos";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * PartnersPage — the ecosystem behind Island Haven, told HONESTLY.
 *
 * We keep the homepage's integrity rule: we never inflate a relationship. The
 * page is organised into three honest tiers —
 *   • Strategic  — the real organisational backers (NasToNas, Gaza Sky Geeks,
 *                  Mercy Corps Ventures). Featured large cards with brand mark.
 *   • Operational— the market & payments doors we OPEN for members (Freelancer,
 *                  Payoneer). A medium grid, framed as "tools we unlock."
 *   • Tech       — the cloud & dev credits we unlock (Replit, AWS Activate,
 *                  Google for Startups). A quiet gliding logo strip.
 *
 * When the backend exposes GET /partners we fold real rows into the Strategic /
 * Operational tiers (by `tier`), rendering their real logos; otherwise the
 * curated, honest fallback below carries the page. No invented partnerships.
 *
 * Palette: warm near-black canvas, warm-white ink, RED for the one accent word +
 * CTA, GOLD (text-sand / chip-sand / eyebrow-sand) for the secondary labels.
 */

type Bi = { ar: string; en: string };

// Backend tiers (see lib/labels PartnerTier) → our display tiers.
type ApiTier = "partner" | "supporter" | "sponsor";
interface ApiPartner {
  id: number;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  description: string | null;
  tier: ApiTier;
}

// ── Curated, honest fallback — the real network from the homepage Partners ──
type Curated = {
  name: string; // matches a BrandMark key when a vector/wordmark exists
  url: string; // hostname, no protocol
  kicker: Bi; // small gold category label
  blurb: Bi;
};

const STRATEGIC: Curated[] = [
  {
    name: "NasToNas",
    url: "nastonas.org",
    kicker: { ar: "الجهة الحاضنة", en: "Our backer" },
    blurb: {
      ar: "المبادرة التي تحتضن آيلاند هيفن وتربطه بأصدقاء غزّة حول العالم — الأساس الذي يقف عليه كلّ ما نبنيه.",
      en: "The initiative that backs Island Haven and connects it to Gaza's friends worldwide — the ground every member stands on.",
    },
  },
  {
    name: "Gaza Sky Geeks",
    url: "gazaskygeeks.com",
    kicker: { ar: "تدريب ومجتمع", en: "Training & community" },
    blurb: {
      ar: "تدريب برمجيّ وتشبيك دوليّ لمجتمع التقنية في غزّة — شريكٌ في صناعة الجيل القادم من المطوّرين.",
      en: "Code training and global networking for Gaza's tech community — a partner in shaping the next generation of builders.",
    },
  },
  {
    name: "Mercy Corps Ventures",
    url: "mercycorps.org/ventures",
    kicker: { ar: "تمويل وأثر", en: "Funding & impact" },
    blurb: {
      ar: "داعمٌ لريادة الأعمال ذات الأثر في الاقتصادات الهشّة — يؤمن أنّ الموهبة الغزّية تستحقّ رأس المال.",
      en: "Backing impact entrepreneurship in fragile economies — believing Gaza's talent deserves real capital.",
    },
  },
];

const OPERATIONAL: Curated[] = [
  {
    name: "Freelancer",
    url: "freelancer.com",
    kicker: { ar: "سوق عمل حرّ", en: "Freelance market" },
    blurb: {
      ar: "أكبر سوق عمل حرّ في العالم — فرص حقيقيّة عابرة للحدود نفتح بابها لأعضائنا.",
      en: "The world's largest freelance marketplace — real cross-border work we open the door to.",
    },
  },
  {
    name: "Payoneer",
    url: "payoneer.com",
    kicker: { ar: "مدفوعات دوليّة", en: "Payments" },
    blurb: {
      ar: "استقبال المدفوعات الدوليّة — يصل المستقلّ الغزّي بعميله في العالم رغم الحصار.",
      en: "International payments — connecting Gaza's freelancers to clients worldwide, despite the blockade.",
    },
  },
];

// Tech tier — credits & cloud we UNLOCK, shown as a quiet logo strip. Honestly a
// door we open, never a partnership.
const TECH: { name: string; url: string; label: Bi }[] = [
  { name: "Replit", url: "replit.com", label: { ar: "بيئة تطوير سحابيّة", en: "Cloud dev environment" } },
  { name: "AWS Activate", url: "aws.amazon.com/activate", label: { ar: "أرصدة سحابيّة", en: "Cloud credits" } },
  { name: "Google for Startups", url: "startup.google.com", label: { ar: "إرشاد وأرصدة", en: "Mentorship & credits" } },
];

const testid = (name: string) => `partner-${name.toLowerCase().replace(/\s+/g, "-")}`;

export default function PartnersPage() {
  const { lang, t } = useLanguage();
  const reduce = useReducedMotion();

  // Optional live roster — folded into the curated tiers when present. Failure or
  // emptiness silently falls back to the curated network (the page never breaks).
  const { data } = useQuery({
    queryKey: ["partners"],
    queryFn: () => api<{ partners: ApiPartner[] }>("/partners"),
    staleTime: 60_000,
    retry: false,
  });
  const apiPartners = data?.partners ?? [];

  // Map live rows into a Curated-shaped card so the same renderer serves both.
  const liveToCard = (p: ApiPartner): Curated & { logoUrl?: string | null } => ({
    name: p.name,
    url: (p.websiteUrl ?? "").replace(/^https?:\/\//, ""),
    kicker:
      p.tier === "sponsor"
        ? { ar: "راعٍ", en: "Sponsor" }
        : p.tier === "supporter"
          ? { ar: "داعم", en: "Supporter" }
          : { ar: "شريك", en: "Partner" },
    blurb: { ar: p.description ?? "", en: p.description ?? "" },
    logoUrl: p.logoUrl,
  });

  const liveSponsorsPartners = apiPartners
    .filter((p) => p.tier === "sponsor" || p.tier === "partner")
    .map(liveToCard);
  const liveSupporters = apiPartners.filter((p) => p.tier === "supporter").map(liveToCard);

  // Live data, when it exists, leads; otherwise the curated network carries it.
  const strategicCards = liveSponsorsPartners.length > 0 ? liveSponsorsPartners : STRATEGIC;
  const operationalCards = liveSupporters.length > 0 ? liveSupporters : OPERATIONAL;

  const why: { n: string; nAr: string; title: Bi; desc: Bi }[] = [
    {
      n: "01",
      nAr: "٠١",
      title: { ar: "موهبةٌ جاهزة، تنتظر الباب", en: "Talent that's ready, waiting for a door" },
      desc: {
        ar: "مئات الرّوّاد والمطوّرين في غزّة بمهاراتٍ عالميّة — كلّ ما ينقصهم وصولٌ موثوق إلى الأدوات والأسواق والشّبكات.",
        en: "Hundreds of Gaza founders and builders with world-class skills — all they lack is reliable access to tools, markets and networks.",
      },
    },
    {
      n: "02",
      nAr: "٠٢",
      title: { ar: "أثرٌ يُقاس، لا وعودٌ تُقال", en: "Impact you can measure, not promises" },
      desc: {
        ar: "نربط كلّ شراكة بنتائج ملموسة — أعضاء فُعّلوا، مشاريع أُطلقت، عقود عملٍ أُبرمت. تعرف بالضبط أين يذهب دعمك.",
        en: "We tie every partnership to concrete outcomes — members activated, ventures launched, contracts won. You see exactly where your support lands.",
      },
    },
    {
      n: "03",
      nAr: "٠٣",
      title: { ar: "بنيةٌ شفّافة، تثق بها", en: "A transparent structure you can trust" },
      desc: {
        ar: "نفصل بصدق بين من يدعمنا فعلًا وبين الأدوات التي نفتح بابها — لا شعارات مبالَغ بها، فقط قيمةٌ حقيقيّة.",
        en: "We honestly separate who truly backs us from the tools we merely unlock — no overstated logos, only real value.",
      },
    },
  ];

  return (
    <PageShell
      active="partners"
      eyebrow={t({ ar: "الشركاء · PARTNERS", en: "Partners · PARTNERS" })}
      title={t({ ar: "من يقف", en: "Who stands" })}
      highlight={t({ ar: "خلفنا", en: "with us" })}
      subtitle={t({
        ar: "المؤسّسات والمنصّات التي تجعل آيلاند هيفن ممكنًا — مرويّةً بصدق، بلا مبالغة.",
        en: "The institutions and platforms that make Island Haven possible — told honestly, with no inflation.",
      })}
      heroAside={
        <div className="rounded-[18px] border border-border-strong bg-surface-2/40 p-7 sm:p-8">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary rtl:tracking-normal">
            {t({ ar: "شبكة الشركاء", en: "Partner network" })}
          </p>
          <p className="t-body text-[15px] mt-4 leading-relaxed">
            {t({
              ar: "مؤسّسات وشركات ومنظّمات دوليّة تقف خلف موهبة غزّة — بالدّعم والشبكة والفرص الحقيقيّة.",
              en: "Institutions, companies and global organisations backing Gaza's talent — with support, network and real opportunity.",
            })}
          </p>
          <div className="mt-5 border-t border-border-strong pt-4 space-y-3">
            {[
              { num: t({ ar: "٤", en: "4" }), label: t({ ar: "جهات داعمة رسميّة", en: "official backers" }) },
              { num: t({ ar: "+٥", en: "5+" }), label: t({ ar: "منصّات وأدوات مفتوحة", en: "open platforms & tools" }) },
              { num: t({ ar: "١٠٠٪", en: "100%" }), label: t({ ar: "مجّانيّ للمنتسب", en: "free for members" }) },
            ].map((r) => (
              <div key={r.label} className="flex items-start justify-between gap-3">
                <span className="text-[13px] text-fg-secondary leading-snug">{r.label}</span>
                <span className="font-mono font-bold text-sand tnum text-xl shrink-0">{r.num}</span>
              </div>
            ))}
          </div>
          <div aria-hidden className="my-6 h-px w-full bg-border-strong" />
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
            <span className="text-[14px] font-semibold text-foreground">
              {t({ ar: "مفتوحون لشراكات جديدة", en: "Open to new partnerships" })}
            </span>
          </div>
          <Link
            href="/contact"
            className="cta-fill mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold"
          >
            {t({ ar: "كُن شريكًا", en: "Become a partner" })}
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
      }
    >
      <div className="space-y-[clamp(5rem,11vw,9rem)]">
        {/* ── WHY PARTNER — a monumental statement over a numbered hairline ledger ── */}
        <section>
          <header className="max-w-4xl">
            <div className="eyebrow eyebrow-sand mb-5">
              {t({ ar: "لماذا الشراكة", en: "Why partner" })}
            </div>
            <motion.h2
              className="font-display font-bold text-foreground"
              style={{ fontSize: "clamp(2.1rem, 5vw, 3.6rem)", lineHeight: 1.04, letterSpacing: "-0.035em" }}
              initial={reduce ? false : { opacity: 0, y: 22 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
            >
              {t({ ar: "أن تشاركنا يعني أن ", en: "Partnering with us means " })}
              <span className="text-primary">
                {t({ ar: "تفتح بابًا.", en: "opening a door." })}
              </span>
            </motion.h2>
            <p className="t-body text-[15px] md:text-[16.5px] mt-5 max-w-2xl">
              {t({
                ar: "لا نطلب رعايةً رمزيّة — نطلب جسرًا حقيقيًّا يصل موهبة غزّة بالاقتصاد الرقميّ العالميّ. هذه ثلاثة أسبابٍ تجعل الجسر يستحقّ البناء.",
                en: "We don't ask for symbolic sponsorship — we ask for a real bridge connecting Gaza's talent to the global digital economy. Here are three reasons it's worth building.",
              })}
            </p>
          </header>

          <ol className="mt-[clamp(2.75rem,6vw,4.5rem)] border-t border-border-strong/60">
            {why.map((item, i) => (
              <li key={item.n}>
                <Reveal delay={Math.min(i, 4) * 0.06}>
                  <div className="grid grid-cols-[auto_1fr] gap-x-[clamp(1.5rem,4vw,3rem)] items-baseline border-b border-border-strong/60 py-[clamp(1.75rem,3.5vw,3rem)]">
                    <span
                      className="font-display font-black text-sand tnum leading-none"
                      style={{ fontSize: "clamp(1.6rem, 3vw, 2.5rem)", letterSpacing: "-0.02em" }}
                    >
                      {lang === "en" ? item.n : item.nAr}
                    </span>
                    <div>
                      <h3
                        className="font-display font-bold text-foreground"
                        style={{ fontSize: "clamp(1.25rem, 2.2vw, 1.8rem)", letterSpacing: "-0.02em", lineHeight: 1.16 }}
                      >
                        {t(item.title)}
                      </h3>
                      <p className="t-body text-[15px] md:text-[16.5px] mt-3 max-w-2xl">{t(item.desc)}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        {/* ── STRATEGIC — the real backers, featured large cards with brand marks ── */}
        <section>
          <TierHeading
            eyebrow={t({ ar: "الطبقة الأولى", en: "Tier one" })}
            title={t({ ar: "شركاء استراتيجيّون", en: "Strategic partners" })}
            note={t({
              ar: "جهاتٌ تدعمنا وتشاركنا فعلًا — علاقاتٌ مؤسّسيّة حقيقيّة.",
              en: "Organisations that genuinely back and partner with us — real institutional relationships.",
            })}
          />
          <div className="mt-[clamp(2rem,4vw,3rem)] grid gap-4 md:grid-cols-3">
            {strategicCards.map((c, i) => (
              <Reveal key={c.name} delay={Math.min(i, 6) * 0.06} className="h-full">
                <a
                  href={c.url ? `https://${c.url}` : undefined}
                  target={c.url ? "_blank" : undefined}
                  rel={c.url ? "noreferrer" : undefined}
                  data-testid={testid(c.name)}
                  className="card-base card-hover group flex h-full flex-col p-6 sm:p-7"
                >
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <span className="grid place-items-center h-14 w-14 rounded-[16px] bg-sand-soft text-sand-bright shrink-0 ring-1 ring-sand/20 transition-colors group-hover:bg-sand/15 overflow-hidden">
                      {"logoUrl" in c && (c as { logoUrl?: string | null }).logoUrl ? (
                        <img
                          src={(c as { logoUrl?: string | null }).logoUrl as string}
                          alt={c.name}
                          loading="lazy" decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <BrandMark name={c.name} variant="lg" />
                      )}
                    </span>
                    {c.url && (
                      <ExternalLink className="w-4 h-4 text-fg-faint group-hover:text-primary transition-colors shrink-0" />
                    )}
                  </div>
                  <span className="eyebrow eyebrow-sand mb-3">{t(c.kicker)}</span>
                  <h3
                    className="font-display font-bold text-foreground group-hover:text-primary transition-colors"
                    style={{ fontSize: "clamp(1.25rem,2vw,1.6rem)", letterSpacing: "-0.022em", lineHeight: 1.14 }}
                  >
                    {c.name}
                  </h3>
                  {t(c.blurb) && (
                    <p className="t-body text-[14.5px] md:text-[15.5px] mt-3 flex-1">{t(c.blurb)}</p>
                  )}
                </a>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── OPERATIONAL — the market & payments doors we open, a medium grid ── */}
        <section>
          <TierHeading
            eyebrow={t({ ar: "الطبقة الثانية", en: "Tier two" })}
            title={t({ ar: "شركاء دعم", en: "Operational partners" })}
            note={t({
              ar: "منصّاتٌ نفتح بابها لأعضائنا — وصولٌ حقيقيّ للأسواق والمدفوعات، لا شراكاتٌ مبالَغ بها.",
              en: "Platforms we open the door to for members — real market & payment access, not overstated partnerships.",
            })}
            aside={t({ ar: "تُفعَّل للأعضاء", en: "unlocked for members" })}
          />
          <div className="mt-[clamp(2rem,4vw,3rem)] grid gap-4 sm:grid-cols-2">
            {operationalCards.map((c, i) => (
              <Reveal key={c.name} delay={Math.min(i, 6) * 0.05} className="h-full">
                <a
                  href={c.url ? `https://${c.url}` : undefined}
                  target={c.url ? "_blank" : undefined}
                  rel={c.url ? "noreferrer" : undefined}
                  data-testid={testid(c.name)}
                  className="card-base card-hover group flex h-full items-start gap-5 p-6 sm:p-7"
                >
                  <span className="grid place-items-center h-12 w-12 rounded-[14px] bg-sand-soft text-sand-bright shrink-0 ring-1 ring-sand/20 transition-colors group-hover:bg-sand/15 overflow-hidden">
                    {"logoUrl" in c && (c as { logoUrl?: string | null }).logoUrl ? (
                      <img
                        src={(c as { logoUrl?: string | null }).logoUrl as string}
                        alt={c.name}
                        loading="lazy" decoding="async"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <BrandMark name={c.name} variant="lg" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3
                        className="font-display font-bold text-foreground group-hover:text-primary transition-colors leading-tight"
                        style={{ fontSize: "1.0625rem", letterSpacing: "-0.02em" }}
                      >
                        {c.name}
                      </h3>
                      {c.url && (
                        <ExternalLink className="w-3.5 h-3.5 text-fg-faint group-hover:text-primary transition-colors shrink-0" />
                      )}
                    </div>
                    {t(c.blurb) && (
                      <p className="t-body text-[14px] md:text-[15px] mt-2.5">{t(c.blurb)}</p>
                    )}
                    <span className="mt-4 inline-flex items-center self-start chip-sand rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide">
                      {t(c.kicker)}
                    </span>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── TECH — a quiet gliding logo strip of credits we unlock ── */}
        <section>
          <TierHeading
            eyebrow={t({ ar: "الطبقة الثالثة", en: "Tier three" })}
            title={t({ ar: "شركاء تقنيّون", en: "Tech partners" })}
            note={t({
              ar: "أرصدةٌ سحابيّة وأدوات تطوير نفتح بابها — أرصدةٌ بآلاف الدّولارات، مجّانًا لأعضائنا.",
              en: "Cloud credits and dev tools we unlock — thousands of dollars in credits, free for our members.",
            })}
          />
          <Reveal delay={0.06} className="mt-[clamp(2rem,4vw,3rem)]">
            <Ticker
              speedSeconds={46}
              gapClass="gap-x-4"
              ariaLabel={t({ ar: "أدوات تقنيّة نفتح بابها", en: "Tech tools we unlock" })}
              items={TECH.map((tch) => (
                <a
                  key={tch.name}
                  href={`https://${tch.url}`}
                  target="_blank"
                  rel="noreferrer"
                  data-testid={testid(tch.name)}
                  className="group inline-flex items-center gap-3 rounded-full border border-border-strong bg-surface-2 ps-2.5 pe-5 py-2.5 transition-colors hover:border-foreground/30"
                >
                  <span className="grid place-items-center h-8 w-8 rounded-full bg-sand-soft text-sand-bright shrink-0">
                    <BrandMark name={tch.name} variant="sm" />
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-[13.5px] font-semibold text-foreground whitespace-nowrap">
                      {tch.name}
                    </span>
                    <span className="t-caption text-fg-secondary whitespace-nowrap">{t(tch.label)}</span>
                  </span>
                </a>
              ))}
            />
          </Reveal>
          <p className="mt-[clamp(1.25rem,2.5vw,2rem)] t-caption text-fg-faint max-w-2xl">
            {t({
              ar: "هذه أدواتٌ وأرصدةٌ نفتح بابها لأعضائنا — لا تمثّل شراكاتٍ مؤسّسيّة، وتُعرض بشعاراتها الأصليّة دون تحريف.",
              en: "These are tools and credits we open the door to for members — they do not represent institutional partnerships, and are shown with their true marks, undistorted.",
            })}
          </p>
        </section>

        {/* ── BECOME A PARTNER — a calm full-bleed band, mailto preserved ── */}
        <section>
          <Reveal>
            <div className="relative overflow-hidden rounded-[clamp(1.75rem,3vw,2.25rem)] border border-border-strong/70 surface-2 px-[clamp(1.75rem,5vw,4rem)] py-[clamp(2.75rem,6vw,4.5rem)]">
              <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-1/3 h-[150%] brand-aura opacity-60" />
              <div className="relative max-w-2xl">
                <div className="eyebrow eyebrow-sand mb-5">
                  {t({ ar: "كن شريكًا", en: "Become a partner" })}
                </div>
                <h3
                  className="font-display font-bold text-foreground"
                  style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", lineHeight: 1.06, letterSpacing: "-0.032em" }}
                >
                  {t({ ar: "ابنِ الجسر ", en: "Build the bridge " })}
                  <span className="text-primary">{t({ ar: "معنا.", en: "with us." })}</span>
                </h3>
                <p className="t-body text-[15px] md:text-[17px] mt-5 max-w-xl">
                  {t({
                    ar: "سواء كنت مؤسّسة، شركة، أو منصّة تريد أن تفتح بابًا لموهبة غزّة — لنتحدّث. نردّ خلال ٢٤ ساعة.",
                    en: "Whether you're an institution, a company, or a platform that wants to open a door for Gaza's talent — let's talk. We reply within 24 hours.",
                  })}
                </p>
                <div className="mt-[clamp(2rem,4vw,2.75rem)] flex items-center gap-3 flex-wrap">
                  <a
                    href="mailto:island-haven@nastonas.org?subject=Partnership%20with%20Island%20Haven"
                    data-testid="partners-become-cta"
                    className="group inline-flex items-center gap-2.5 h-12 px-7 rounded-full cta-fill font-bold text-[14px] transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-16px_hsl(354_82%_30%_/_0.55)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  >
                    <Mail className="w-4 h-4" />
                    {t({ ar: "تواصل لتصبح شريكًا", en: "Get in touch" })}
                  </a>
                  <a
                    href="https://wa.me/972567536815"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 h-12 px-7 rounded-full border border-border-strong text-fg-secondary font-medium text-[14px] hover:border-foreground/30 hover:text-foreground transition-colors"
                  >
                    WhatsApp
                    <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1 motion-reduce:transition-none" />
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </PageShell>
  );
}

/* Calm tier heading — a gold eyebrow, a name, and one honest line. An optional
   gold aside figure sits at the end for the "unlocked" register. No medallion. */
function TierHeading({
  eyebrow,
  title,
  note,
  aside,
}: {
  eyebrow: string;
  title: string;
  note: string;
  aside?: string;
}) {
  return (
    <Reveal className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 pb-[clamp(1.25rem,2.5vw,2rem)] border-b border-border-strong">
      <div className="max-w-2xl">
        <div className="eyebrow eyebrow-sand mb-3">{eyebrow}</div>
        <h2
          className="font-display font-bold text-foreground"
          style={{ fontSize: "clamp(1.6rem,3.2vw,2.4rem)", letterSpacing: "-0.028em", lineHeight: 1.08 }}
        >
          {title}
        </h2>
        <p className="t-body text-[15px] mt-3 max-w-xl">{note}</p>
      </div>
      {aside && (
        <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-sand rtl:tracking-normal whitespace-nowrap">
          {aside}
        </span>
      )}
    </Reveal>
  );
}
