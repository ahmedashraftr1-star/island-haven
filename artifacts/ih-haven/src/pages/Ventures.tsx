import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { VENTURE_STAGE_LABELS, type VentureStage } from "@/lib/labels";
import { EASE_OUT_EXPO } from "@/lib/motion";

interface Venture {
  id: number;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string | null;
  coverUrl: string | null;
  websiteUrl: string;
  founderName: string;
  sector: string;
  stage: VentureStage;
  foundedYear: number;
  teamSize: number;
  featured: boolean;
}

// English counterparts to the Arabic-only VENTURE_STAGE_LABELS in @/lib/labels.
const VENTURE_STAGE_LABELS_EN: Record<VentureStage, string> = {
  idea: "Idea",
  mvp: "MVP",
  launched: "Launched",
  scaling: "Scaling",
};

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
// Localised numeral: Arabic-Indic in AR, Western digits in EN.
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}
// Stage label localised by language.
function stageLabel(stage: VentureStage, lang: Lang): string {
  return lang === "ar" ? VENTURE_STAGE_LABELS[stage] : VENTURE_STAGE_LABELS_EN[stage];
}

// A handful of evergreen photographs to give cover-less ventures dignified,
// real imagery instead of a crimson initial-medallion. Deterministic by id so a
// given venture always wears the same frame.
const VENTURE_FRAMES = [
  "/photos/IMG_8344.webp",
  "/photos/IMG_8347.webp",
  "/photos/IMG_8349.webp",
  "/photos/IMG_8353.webp",
  "/photos/IMG_8357.webp",
  "/photos/IMG_8358.webp",
];
function frameFor(id: number): string {
  return VENTURE_FRAMES[Math.abs(id) % VENTURE_FRAMES.length];
}

export default function Ventures() {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<Venture[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    document.title =
      lang === "ar" ? "المشاريع الناشئة — Island Haven" : "Ventures — Island Haven";
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    api<{ ventures: Venture[] }>("/ventures")
      .then((r) => !cancelled && setRows(r.ventures))
      .catch(
        (e) =>
          !cancelled &&
          setError(
            e instanceof ApiError
              ? e.message
              : lang === "ar"
                ? "تعذّر التحميل"
                : "Couldn't load ventures",
          ),
      );
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const featured = (rows ?? []).filter((v) => v.featured);
  const rest = (rows ?? []).filter((v) => !v.featured);
  // The lead venture anchors the asymmetric feature; the next featured ones (if
  // any) join the editorial roster below, so the page never becomes a deck.
  const lead = featured[0] ?? null;
  const roster = [...featured.slice(1), ...rest];
  const total = rows?.length ?? 0;
  const launched = (rows ?? []).filter(
    (v) => v.stage === "launched" || v.stage === "scaling",
  ).length;

  return (
    <PageShell
      active="ventures"
      eyebrow={t({ ar: "صُنِع في آيلاند · Made in Gaza", en: "Made in Island Haven · Made in Gaza" })}
      title={t({ ar: "مشاريع وُلدت في", en: "Ventures built at" })}
      highlight={t({ ar: "آيلاند", en: "Island Haven" })}
      subtitle={t({
        ar: "من فكرة على ورقة، إلى يوم عرضٍ أمام الدّاعمين، إلى منتجٍ يخدم النّاس ويصنع فرص عمل في غزّة — هذه هي المحفظة التي تنمو داخل مساحتنا.",
        en: "From an idea on paper, to a Demo Day in front of our backers, to a product that serves people and creates jobs in Gaza — this is the portfolio growing inside our space.",
      })}
    >
      {error && (
        <GlassCard className="p-5 text-primary text-center font-medium">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <SkeletonVentures />
      ) : rows && rows.length === 0 ? (
        <EmptyPortfolio />
      ) : (
        <>
          {/* Live portfolio reading — quiet tnum figures, cerulean for hard data only */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_EXPO }}
            className="flex flex-wrap items-baseline gap-x-[clamp(2rem,5vw,4rem)] gap-y-4 pb-[clamp(2rem,4vw,3rem)] border-b border-border-strong/60"
          >
            <Figure value={num(total, lang)} label={t({ ar: "في المحفظة", en: "in the portfolio" })} />
            {launched > 0 && (
              <Figure value={num(launched, lang)} label={t({ ar: "في السّوق الآن", en: "live in market" })} />
            )}
            <p className="t-caption text-fg-secondary self-end pb-1.5">
              {t({ ar: "كلّها صُنعت داخل الحاضنة", en: "Every one built inside the incubator" })}
            </p>
          </motion.div>

          {/* The lead venture — one asymmetric, full-bleed feature, not a card */}
          {lead && <LeadVenture v={lead} reduce={!!reduce} />}

          {/* The roster — calm editorial hairline rows, large names, real frames */}
          {roster.length > 0 && (
            <section className="mt-[clamp(4rem,9vw,7rem)]">
              <SectionLine
                lead={t({ ar: "كلّ مشروعٍ", en: "Every venture" })}
                accent={lead ? t({ ar: "آخر.", en: "else." }) : t({ ar: "في المحفظة.", en: "in the portfolio." })}
              />
              <ul className="mt-[clamp(2.5rem,5vw,4rem)] border-t border-border-strong/60">
                {roster.map((v, i) => (
                  <VentureRow key={v.id} v={v} i={i} reduce={!!reduce} />
                ))}
              </ul>
            </section>
          )}

          {/* Terminal CTA — your venture is the next line */}
          <ClosingCTA />
        </>
      )}
    </PageShell>
  );
}

// A single live reading — a large tnum figure in cerulean (hard data) and a calm
// label. Replaces the pill-chip cluster; no boxes, no borders.
function Figure({ value, label }: { value: string; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-2.5">
      <span
        className="font-display font-bold tnum text-sand leading-none"
        style={{ fontSize: "clamp(2rem,4vw,3.25rem)", letterSpacing: "-0.03em" }}
      >
        {value}
      </span>
      <span className="text-fg-secondary" style={{ fontSize: "clamp(0.95rem,1.4vw,1.1rem)" }}>
        {label}
      </span>
    </span>
  );
}

// A monumental section line — one calm headline, at most one crimson word, the
// house bar. No eyebrow kicker, no oversized stroke numeral.
function SectionLine({ lead, accent }: { lead: string; accent: string }) {
  const reduce = useReducedMotion();
  return (
    <h2
      className="font-display text-foreground"
      style={{ fontSize: "clamp(2.4rem, 6.4vw, 4.5rem)", lineHeight: 1.0, letterSpacing: "-0.04em", fontWeight: 700 }}
    >
      {[lead, <span key="a" className="text-primary">{accent}</span>].map((ln, i) => (
        <motion.span
          key={i}
          className="block will-change-transform"
          initial={reduce ? false : { opacity: 0, y: 26 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: i * 0.09, ease: EASE_OUT_EXPO }}
        >
          {ln}
        </motion.span>
      ))}
    </h2>
  );
}

/**
 * LeadVenture — the spotlight, told the Apple way: a large full-bleed cover with
 * a slow parallax, a calm crimson stage line, the name at display scale, and a
 * quiet "full story" action. No featured-star chip, no medallion, no glass deck.
 */
function LeadVenture({ v, reduce }: { v: Venture; reduce: boolean }) {
  const { lang, t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-7%", "7%"]);
  const cover = v.coverUrl || frameFor(v.id);

  return (
    <section ref={ref} className="mt-[clamp(3.5rem,8vw,6rem)]">
      <Link
        href={`/ventures/${v.id}`}
        data-testid={`venture-card-${v.id}`}
        className="group block"
        aria-label={v.name}
      >
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          whileInView={reduce ? undefined : { opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1, ease: EASE_OUT_EXPO }}
          className="relative w-full overflow-hidden rounded-[clamp(20px,2.5vw,32px)] ring-1 ring-white/10"
        >
          <div className="relative h-[clamp(22rem,62vh,40rem)]">
            <motion.img
              src={cover}
              alt={v.name}
              loading="lazy"
              style={{ y }}
              className="absolute inset-0 h-[114%] w-full object-cover object-center saturate-[1.04] will-change-transform transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(0deg, hsl(225 44% 5% / 0.95) 4%, hsl(225 44% 5% / 0.55) 42%, transparent 80%)",
              }}
            />
            <div className="absolute inset-0 flex items-end">
              <div className="w-full p-[clamp(1.5rem,4vw,3.5rem)]">
                {/* Stage · sector — crimson stage, the one accent */}
                <motion.p
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_EXPO }}
                  className="mb-3 inline-flex items-center gap-2 text-[clamp(0.85rem,1.4vw,1.05rem)] font-semibold"
                >
                  <span className="text-primary">{stageLabel(v.stage, lang)}</span>
                  {v.sector ? <span className="text-white/55">· {v.sector}</span> : null}
                </motion.p>

                <motion.h3
                  initial={reduce ? false : { opacity: 0, y: 22 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.8, delay: 0.16, ease: EASE_OUT_EXPO }}
                  className="font-display text-white max-w-[18ch]"
                  style={{ fontSize: "clamp(2.2rem,5.4vw,4.25rem)", lineHeight: 1.0, letterSpacing: "-0.035em", fontWeight: 700 }}
                >
                  {v.name}
                </motion.h3>

                {v.tagline && (
                  <motion.p
                    initial={reduce ? false : { opacity: 0, y: 16 }}
                    whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.8, delay: 0.26, ease: EASE_OUT_EXPO }}
                    className="mt-4 max-w-2xl text-white/75"
                    style={{ fontSize: "clamp(1rem,1.8vw,1.4rem)", lineHeight: 1.55 }}
                  >
                    {v.tagline}
                  </motion.p>
                )}

                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.75, delay: 0.36, ease: EASE_OUT_EXPO }}
                  className="mt-[clamp(1.5rem,3vw,2.25rem)] flex flex-wrap items-center gap-x-7 gap-y-3"
                >
                  {v.founderName && (
                    <span className="text-white/80 font-semibold" style={{ fontSize: "clamp(0.9rem,1.4vw,1.05rem)" }}>
                      {v.founderName}
                    </span>
                  )}
                  {v.teamSize > 0 && (
                    <span className="text-white/55 tnum" style={{ fontSize: "clamp(0.9rem,1.4vw,1.05rem)" }}>
                      {num(v.teamSize, lang)} {t({ ar: "في الفريق", en: "on the team" })}
                    </span>
                  )}
                  {v.foundedYear ? (
                    <span className="text-white/55 tnum" style={{ fontSize: "clamp(0.9rem,1.4vw,1.05rem)" }}>
                      {num(v.foundedYear, lang)}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-2 text-white group-hover:text-primary transition-colors font-bold" style={{ fontSize: "clamp(0.9rem,1.4vw,1.05rem)" }}>
                    {t({ ar: "القصّة الكاملة", en: "Full story" })}
                    <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                  </span>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </section>
  );
}

/**
 * VentureRow — one portfolio entry as a calm editorial hairline row: a real
 * frame (cover or evergreen photograph, never a medallion), a large display
 * name, the tagline as prose, and a quiet stage/action at the logical end. The
 * /ventures/:id link and venture-card-* testid are preserved.
 */
function VentureRow({ v, i, reduce }: { v: Venture; i: number; reduce: boolean }) {
  const { lang, t } = useLanguage();
  const cover = v.coverUrl || frameFor(v.id);
  return (
    <li>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.7, delay: Math.min(i, 6) * 0.06, ease: EASE_OUT_EXPO }}
        className="will-change-transform"
      >
        <Link
          href={`/ventures/${v.id}`}
          data-testid={`venture-card-${v.id}`}
          className="group grid grid-cols-[auto_minmax(0,1fr)] md:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-[clamp(1.25rem,2.5vw,2.5rem)] gap-y-2 py-[clamp(1.5rem,3vw,2.5rem)] border-b border-border-strong/60 transition-colors hover:border-border-strong"
        >
          {/* A dignified landscape frame — real imagery, no initial-medallion */}
          <div className="relative h-[clamp(4rem,8vw,6rem)] w-[clamp(6rem,12vw,9rem)] shrink-0 overflow-hidden rounded-[14px] ring-1 ring-white/10 bg-surface-3">
            <img
              src={cover}
              alt={v.name}
              loading="lazy"
              className="h-full w-full object-cover saturate-[1.03] transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
            />
          </div>

          <div className="min-w-0">
            <h3
              className="font-display font-bold text-foreground group-hover:text-primary transition-colors"
              style={{ fontSize: "clamp(1.4rem,3.2vw,2.4rem)", letterSpacing: "-0.03em", lineHeight: 1.08 }}
            >
              {v.name}
            </h3>
            <p className="mt-2 inline-flex flex-wrap items-baseline gap-x-2.5 text-[14px] md:text-[15px]">
              <span className="text-primary font-semibold">{stageLabel(v.stage, lang)}</span>
              {v.sector ? <span className="text-fg-secondary">· {v.sector}</span> : null}
              {v.founderName ? (
                <span className="text-fg-secondary">· {v.founderName}</span>
              ) : null}
            </p>
            {v.tagline && (
              <p className="t-body text-[15px] md:text-[16px] mt-2.5 line-clamp-2 max-w-2xl">
                {v.tagline}
              </p>
            )}
          </div>

          {/* Quiet action + year, start-aligned to the logical end */}
          <div className="hidden md:flex items-center gap-x-6 whitespace-nowrap justify-self-end">
            {v.foundedYear ? (
              <span className="t-caption text-fg-secondary tnum">{num(v.foundedYear, lang)}</span>
            ) : null}
            <span className="inline-flex items-center gap-2 t-caption text-fg-secondary group-hover:text-foreground transition-colors">
              {t({ ar: "القصّة", en: "Story" })}
              <ArrowLeft className="w-4 h-4 text-fg-faint rtl:rotate-180 transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:text-primary group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      </motion.div>
    </li>
  );
}

/**
 * EmptyPortfolio — educational, not a bare "coming soon". The portfolio is
 * forming now; we hold the monumental dark register, tell the true story
 * (idea → Demo Day → market) as one calm line, anchor it with a real full-bleed
 * photograph of the space, and put the apply CTA front and centre. The
 * ventures-empty-* testids and educational framing are preserved.
 */
function EmptyPortfolio() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  return (
    <div className="relative">
      <motion.h2
        className="font-display text-foreground max-w-[16ch]"
        style={{ fontSize: "clamp(2.4rem, 7vw, 5rem)", lineHeight: 1.0, letterSpacing: "-0.045em", fontWeight: 700 }}
      >
        {[
          t({ ar: "أوّل دفعةٍ", en: "The first cohort" }),
          <span key="a" className="text-primary">{t({ ar: "تَبني الآن.", en: "is building now." })}</span>,
        ].map((ln, i) => (
          <motion.span
            key={i}
            className="block will-change-transform"
            initial={reduce ? false : { opacity: 0, y: 28 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, delay: i * 0.09, ease: EASE_OUT_EXPO }}
          >
            {ln}
          </motion.span>
        ))}
      </motion.h2>

      <motion.p
        initial={reduce ? false : { opacity: 0, y: 18 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.85, delay: 0.4, ease: EASE_OUT_EXPO }}
        className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-2xl text-fg-secondary"
        style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
      >
        {t({
          ar: "هنا، قريبًا، تظهر أسماء المشاريع التي وُلدت في آيلاند — تبدأ بفكرة، تمرّ بيوم عرضٍ أمام الدّاعمين، وتصل إلى السّوق. الدفعة الأولى تكتب سطورها الأولى اليوم، ومقعدك في الصفحة التالية.",
          en: "This is where the names of ventures born at Island Haven will live — they start as an idea, pass through a Demo Day, and reach the market. The first cohort is writing its opening lines today, and your seat is on the next page.",
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
          href="/apply"
          data-testid="ventures-empty-apply"
          className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
        >
          {t({ ar: "قدّم للدفعة الأولى", en: "Apply to the first cohort" })}
          <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
        </Link>
        <Link
          href="/programs"
          data-testid="ventures-empty-programs"
          className="group inline-flex items-center gap-2 text-[14px] font-semibold text-foreground/85 hover:text-foreground transition-colors"
        >
          {t({ ar: "كيف يعمل الاحتضان", en: "How incubation works" })}
          <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
        </Link>
      </motion.div>

      {/* The space, full-bleed — a real photograph carries the wait, one calm line */}
      <motion.div
        className="relative mt-[clamp(4rem,9vh,7rem)] w-full overflow-hidden rounded-[clamp(20px,2.5vw,32px)] ring-1 ring-white/10"
        initial={reduce ? false : { opacity: 0 }}
        whileInView={reduce ? undefined : { opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1, ease: EASE_OUT_EXPO }}
      >
        <div className="relative h-[clamp(20rem,52vh,34rem)]">
          <img
            src="/photos/IMG_8347.webp"
            alt={t({ ar: "منتسبون يبنون مشاريعهم في آيلاند هيفن بغزّة", en: "Members building their ventures at Island Haven in Gaza" })}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center saturate-[1.04]"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "linear-gradient(90deg, hsl(225 44% 5% / 0.92) 0%, hsl(225 44% 5% / 0.5) 45%, transparent 80%)" }}
          />
          <div className="absolute inset-0 flex items-end">
            <div className="w-full p-[clamp(1.5rem,4vw,3.5rem)]">
              <motion.p
                className="max-w-[22ch] text-white"
                style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.6rem)", lineHeight: 1.18, letterSpacing: "-0.02em", fontWeight: 600 }}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
              >
                {t({ ar: "من فكرة، إلى يوم عرض، إلى السّوق.", en: "From idea, to Demo Day, to market." })}
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Terminal CTA — a calm confident line, your venture is the next in the list. No
// aura blob, no glass deck, no icon tile.
function ClosingCTA() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  return (
    <section className="mt-[clamp(5rem,11vw,9rem)] border-t border-border-strong/60 pt-[clamp(3rem,6vw,5rem)]">
      <motion.h2
        className="font-display text-foreground max-w-[18ch]"
        style={{ fontSize: "clamp(2.2rem, 6vw, 4.25rem)", lineHeight: 1.0, letterSpacing: "-0.04em", fontWeight: 700 }}
      >
        {[
          t({ ar: "مشروعك القادم", en: "Your venture is the" }),
          <span key="a" className="text-primary">{t({ ar: "في هذه المحفظة.", en: "next in this portfolio." })}</span>,
        ].map((ln, i) => (
          <motion.span
            key={i}
            className="block will-change-transform"
            initial={reduce ? false : { opacity: 0, y: 26 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, delay: i * 0.09, ease: EASE_OUT_EXPO }}
          >
            {ln}
          </motion.span>
        ))}
      </motion.h2>

      <motion.p
        initial={reduce ? false : { opacity: 0, y: 16 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.8, delay: 0.36, ease: EASE_OUT_EXPO }}
        className="mt-[clamp(1.5rem,3vw,2.5rem)] max-w-2xl text-fg-secondary"
        style={{ fontSize: "clamp(1.05rem,1.8vw,1.35rem)", lineHeight: 1.6 }}
      >
        {t({
          ar: "احتضانٌ مجّانيّ، إرشاد، وDemo Day — كلّ ما يلزم لتأخذ فكرتك من الورقة إلى السّوق، من قلب غزّة إلى العالم.",
          en: "Free incubation, mentorship and a Demo Day — everything you need to take your idea from paper to market, from the heart of Gaza to the world.",
        })}
      </motion.p>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 14 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.75, delay: 0.46, ease: EASE_OUT_EXPO }}
        className="mt-[clamp(2rem,4vw,3rem)] flex flex-wrap items-center gap-x-7 gap-y-4"
      >
        <Link
          href="/apply"
          data-testid="ventures-cta-apply"
          className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
        >
          {t({ ar: "ابدأ مشروعك", en: "Start your venture" })}
          <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
        </Link>
        <Link
          href="/programs"
          data-testid="ventures-cta-programs"
          className="group inline-flex items-center gap-2 text-[14px] font-semibold text-foreground/85 hover:text-foreground transition-colors"
        >
          {t({ ar: "البرامج والدفعات", en: "Programs & cohorts" })}
          <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </section>
  );
}

// Skeleton — mirrors the new editorial rhythm: a live-reading row, one large
// feature block, then hairline rows. No card-deck grid.
function SkeletonVentures() {
  return (
    <div>
      <div className="flex gap-8 pb-8 border-b border-border-strong/60">
        {[0, 1].map((i) => (
          <div key={i} className="h-12 w-40 rounded-lg bg-surface-2 animate-pulse" />
        ))}
      </div>
      <div className="mt-[clamp(3.5rem,8vw,6rem)] h-[clamp(22rem,62vh,40rem)] rounded-[clamp(20px,2.5vw,32px)] bg-surface-2 border border-border-strong animate-pulse" />
      <ul className="mt-[clamp(4rem,9vw,7rem)] border-t border-border-strong/60">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="flex items-center gap-6 border-b border-border-strong/60 py-[clamp(1.5rem,3vw,2.5rem)]">
            <div className="h-[clamp(4rem,8vw,6rem)] w-[clamp(6rem,12vw,9rem)] shrink-0 rounded-[14px] bg-surface-2 animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-2/3 rounded bg-surface-2 animate-pulse" />
              <div className="h-4 w-1/3 rounded bg-surface-2 animate-pulse" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
