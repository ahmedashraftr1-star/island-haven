import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowLeft, Users, Star, Calendar, Lightbulb, Presentation, Rocket } from "lucide-react";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { VENTURE_STAGE_LABELS, type VentureStage } from "@/lib/labels";

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

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
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
// First two initials for the crimson medallion fallback.
function initialsOf(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("") || "•";
}

const MEDALLION_BG =
  "linear-gradient(140deg, hsl(var(--primary)) 0%, hsl(var(--primary-pressed)) 100%)";

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
          {/* Live portfolio summary — cerulean numerals carry the data */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap items-center gap-2.5 mb-12 sm:mb-14"
          >
            <Chip>
              <span className="tnum font-bold text-sand">{num(total, lang)}</span>{" "}
              {t({ ar: "مشروعًا في المحفظة", en: "ventures in the portfolio" })}
            </Chip>
            {launched > 0 && (
              <Chip>
                <span className="tnum font-bold text-sand">{num(launched, lang)}</span>{" "}
                {t({ ar: "في السّوق الآن", en: "live in market" })}
              </Chip>
            )}
            <Chip>{t({ ar: "صُنعت داخل الحاضنة", en: "Built inside the incubator" })}</Chip>
          </motion.div>

          {/* The journey — idea → Demo Day → market. Evergreen framing band. */}
          <JourneyBand />

          {featured.length > 0 && (
            <section className="mb-14 sm:mb-16">
              <SectionHeader
                index={num(1, lang).padStart(2, lang === "ar" ? "٠" : "0")}
                title={t({ ar: "في الواجهة", en: "In the Spotlight" })}
                blurb={t({
                  ar: "مشاريع تركت أثرًا — قصص بدأت بفكرة وانتهت بمنتج حيّ.",
                  en: "Ventures that left a mark — stories that began with an idea and ended in a living product.",
                })}
              />
              <motion.div
                variants={reduce ? undefined : stagger}
                initial={reduce ? undefined : "hidden"}
                whileInView={reduce ? undefined : "show"}
                viewport={{ once: true, margin: "-8% 0px" }}
                className={`grid gap-5 ${featured.length === 1 ? "" : "lg:grid-cols-2"}`}
              >
                {featured.map((v) => (
                  <SpotlightCard key={v.id} v={v} reduce={!!reduce} />
                ))}
              </motion.div>
            </section>
          )}

          {rest.length > 0 && (
            <section>
              {featured.length > 0 && (
                <SectionHeader
                  index={num(2, lang).padStart(2, lang === "ar" ? "٠" : "0")}
                  title={t({ ar: "كلّ المشاريع", en: "All Ventures" })}
                  blurb={t({
                    ar: "المحفظة الكاملة للمشاريع التي تنمو في آيلاند.",
                    en: "The full portfolio of ventures growing at Island Haven.",
                  })}
                />
              )}
              <motion.div
                variants={reduce ? undefined : stagger}
                initial={reduce ? undefined : "hidden"}
                whileInView={reduce ? undefined : "show"}
                viewport={{ once: true, margin: "-8% 0px" }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr"
              >
                {rest.map((v) => (
                  <VentureCard key={v.id} v={v} reduce={!!reduce} />
                ))}
              </motion.div>
            </section>
          )}

          {/* Terminal CTA — your venture is the next line */}
          <ClosingCTA />
        </>
      )}
    </PageShell>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-medium text-fg-secondary bg-surface-2 border border-border-strong">
      {children}
    </span>
  );
}

function SectionHeader({ index, title, blurb }: { index: string; title: string; blurb: string }) {
  return (
    <div className="relative mb-7 sm:mb-9">
      <span
        aria-hidden
        className="absolute -top-7 sm:-top-9 right-0 select-none font-black leading-none"
        style={{
          fontSize: "clamp(4.5rem, 13vw, 9rem)",
          WebkitTextStroke: "1.25px hsl(var(--primary) / 0.14)",
          color: "transparent",
        }}
      >
        {index}
      </span>
      <div className="relative">
        <h2
          className="text-foreground font-display font-extrabold mb-2"
          style={{ fontSize: "clamp(1.3rem, 3vw, 1.85rem)", letterSpacing: "-0.025em" }}
        >
          {title}
        </h2>
        <p className="text-fg-secondary text-[13.5px] leading-[1.8] max-w-xl">{blurb}</p>
      </div>
    </div>
  );
}

/**
 * JourneyBand — the evergreen "how a venture is born here" framing: idea →
 * Demo Day → market, told as an editorial numbered ledger (no icon-tile grid).
 * Crimson step numerals, hairline dividers, one cerulean accent on the arc.
 */
function JourneyBand() {
  const { lang, t } = useLanguage();
  const steps = [
    {
      icon: Lightbulb,
      kicker: t({ ar: "المرحلة ٠١", en: "Stage 01" }),
      title: t({ ar: "فكرة + احتضان", en: "Idea & incubation" }),
      body: t({
        ar: "مقعد ثابت، إرشاد من خبراء، ومسار احتضان منظّم يحوّل الفكرة إلى نموذجٍ قابل للبناء.",
        en: "A reliable seat, expert mentorship and a structured incubation track that turns the idea into something buildable.",
      }),
    },
    {
      icon: Presentation,
      kicker: t({ ar: "المرحلة ٠٢", en: "Stage 02" }),
      title: t({ ar: "Demo Day", en: "Demo Day" }),
      body: t({
        ar: "كلّ برنامج يُختَم بيوم عرضٍ أمام شبكةٍ من الدّاعمين والمستثمرين والمتعاونين.",
        en: "Every program culminates in a Demo Day in front of a network of backers, investors and collaborators.",
      }),
    },
    {
      icon: Rocket,
      kicker: t({ ar: "المرحلة ٠٣", en: "Stage 03" }),
      title: t({ ar: "إطلاق في السّوق", en: "Launch to market" }),
      body: t({
        ar: "منتجٌ حيّ يخدم النّاس، يصنع فرص عمل، ويأخذ موهبة غزّيّة إلى الاقتصاد الرّقميّ العالميّ.",
        en: "A living product that serves people, creates jobs, and carries Gazan talent into the global digital economy.",
      }),
    },
  ];

  return (
    <section className="mb-14 sm:mb-16">
      <div className="flex items-center gap-3 mb-6">
        <span aria-hidden className="h-px w-9 bg-primary/50" />
        <span className="eyebrow">{t({ ar: "كيف يُولد المشروع", en: "How a venture is born" })}</span>
      </div>
      <h2
        className="font-display font-extrabold text-foreground mb-8 sm:mb-10"
        style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.3rem)", lineHeight: 1.08, letterSpacing: "-0.026em" }}
      >
        {t({ ar: "من فكرة، إلى يوم عرض، إلى ", en: "From idea, to Demo Day, to " })}
        <span className="text-sand-bright">{t({ ar: "السّوق.", en: "market." })}</span>
      </h2>
      <div className="grid sm:grid-cols-3 border-t border-border-strong">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="relative border-b border-border-strong sm:border-b-0 sm:[&:not(:first-child)]:border-s py-7 sm:py-8 sm:px-6 first:ps-0"
            >
              <div className="flex items-center gap-3 mb-4">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-[10.5px] tracking-[0.18em] uppercase text-primary font-bold rtl:tracking-normal">
                  {s.kicker}
                </span>
              </div>
              <h3 className="font-display font-bold text-foreground text-[17px] mb-2 leading-snug">
                {s.title}
              </h3>
              <p className="text-fg-secondary text-[13px] leading-[1.75] max-w-xs">{s.body}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function SpotlightCard({ v, reduce }: { v: Venture; reduce: boolean }) {
  const { lang, t } = useLanguage();
  return (
    <motion.div
      variants={reduce ? undefined : rise}
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 340, damping: 30 }}
      className="h-full"
    >
      <Link
        href={`/ventures/${v.id}`}
        className="group block h-full"
        data-testid={`venture-card-${v.id}`}
      >
        <GlassCard className="group relative h-full overflow-hidden group-hover:border-primary/40 transition-colors">
          <div className="relative aspect-[16/10] sm:aspect-[16/8] overflow-hidden bg-black/30">
            {v.coverUrl ? (
              <img
                src={v.coverUrl}
                alt={v.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: "radial-gradient(130% 120% at 50% 0%, hsl(var(--primary) / 0.28) 0%, hsl(var(--surface-3)) 70%)" }}
              >
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-[26px] text-white font-display font-black text-[34px] ring-2 ring-white/15 shadow-soft select-none transition-transform duration-700 group-hover:scale-105"
                  style={{ background: MEDALLION_BG }}
                >
                  {initialsOf(v.name)}
                </div>
              </div>
            )}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, #0A0E1A 6%, rgba(10,14,26,0.55) 42%, transparent 78%)",
              }}
            />
            <div className="absolute top-4 end-4 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] tracking-[0.16em] uppercase font-bold bg-white/15 text-foreground border border-border-strong backdrop-blur-sm">
              <Star className="w-3 h-3 fill-white text-foreground" />{" "}
              {t({ ar: "مشروع مميّز", en: "Featured" })}
            </div>

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
              <div className="flex items-center gap-3 mb-3">
                {v.logoUrl ? (
                  <img src={v.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-border-strong" />
                ) : (
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-display font-black text-lg ring-2 ring-white/15 shadow-soft"
                    style={{ background: MEDALLION_BG }}
                  >
                    {initialsOf(v.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-foreground font-display font-bold text-[20px] leading-tight truncate">{v.name}</h3>
                  <span className="inline-flex items-center gap-2 text-[12px] font-semibold">
                    <span className="text-primary">{stageLabel(v.stage, lang)}</span>
                    {v.sector ? <span className="text-fg-secondary">· {v.sector}</span> : null}
                  </span>
                </div>
              </div>
              {v.tagline && (
                <p className="text-foreground text-[14px] leading-[1.7] mb-3 max-w-xl">{v.tagline}</p>
              )}
              <div className="flex items-center justify-between text-[12.5px] text-fg-secondary">
                <span className="inline-flex items-center gap-3">
                  {v.founderName && (
                    <span className="font-semibold text-foreground truncate max-w-[10rem]">{v.founderName}</span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sand" />
                    <span className="tnum">{num(v.teamSize, lang)}</span> {t({ ar: "في الفريق", en: "on the team" })}
                  </span>
                  {v.foundedYear ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sand" />
                      <span className="tnum">{num(v.foundedYear, lang)}</span>
                    </span>
                  ) : null}
                </span>
                <span className="inline-flex items-center gap-1 text-foreground group-hover:text-primary transition-colors font-bold">
                  {t({ ar: "القصّة الكاملة", en: "Full story" })}
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 ltr:rotate-180" />
                </span>
              </div>
            </div>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}

function VentureCard({ v, reduce }: { v: Venture; reduce: boolean }) {
  const { lang, t } = useLanguage();
  return (
    <motion.div
      variants={reduce ? undefined : rise}
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="h-full"
    >
      <Link
        href={`/ventures/${v.id}`}
        className="card-base card-hover group flex flex-col h-full overflow-hidden"
        data-testid={`venture-card-${v.id}`}
      >
        {v.coverUrl ? (
          <div className="aspect-[16/9] overflow-hidden bg-surface-3">
            <img
              src={v.coverUrl}
              alt={v.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
              loading="lazy"
            />
          </div>
        ) : (
          <div
            className="aspect-[16/9] flex items-center justify-center"
            style={{ background: "radial-gradient(130% 120% at 50% 0%, hsl(var(--primary) / 0.22) 0%, hsl(var(--surface-3)) 70%)" }}
          >
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-white font-display font-black text-[22px] ring-2 ring-white/15 shadow-soft select-none transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
              style={{ background: MEDALLION_BG }}
            >
              {initialsOf(v.name)}
            </div>
          </div>
        )}
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-2.5">
            {v.logoUrl ? (
              <img src={v.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-border" />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-display font-black ring-2 ring-white/15 shadow-soft"
                style={{ background: MEDALLION_BG }}
              >
                {initialsOf(v.name)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-foreground font-display font-bold text-[16px] truncate group-hover:text-primary transition-colors">{v.name}</h3>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
                <span className="text-primary">{stageLabel(v.stage, lang)}</span>
                {v.sector ? <span className="text-fg-secondary">· {v.sector}</span> : null}
              </span>
            </div>
          </div>
          {v.tagline && (
            <p className="text-foreground/90 text-[13px] leading-[1.7] mb-2">{v.tagline}</p>
          )}
          {v.description && (
            <p className="text-fg-secondary text-[12.5px] leading-[1.7] line-clamp-3 mb-4">{v.description}</p>
          )}
          <div className="mt-auto flex items-center justify-between text-[12px] text-muted-foreground pt-3 border-t border-border">
            <span className="inline-flex items-center gap-1.5">
              {v.founderName ? (
                <span className="text-fg-secondary font-semibold truncate max-w-[8rem]">{v.founderName}</span>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5 text-sand" />
                  <span className="tnum">{num(v.teamSize, lang)}</span> {t({ ar: "في الفريق", en: "team" })}
                </>
              )}
              {v.foundedYear ? <span className="tnum"> · {num(v.foundedYear, lang)}</span> : ""}
            </span>
            <span className="inline-flex items-center gap-1 text-fg-secondary group-hover:text-primary transition-colors font-semibold">
              {t({ ar: "التفاصيل", en: "Details" })}
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 ltr:rotate-180" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/**
 * EmptyPortfolio — educational, not a bare "coming soon". The portfolio is
 * forming now; we hold the dark editorial register, explain the path
 * (idea → Demo Day → market), and put the apply CTA front and centre. A quiet
 * ledger of three serif-numbered "in the making" slots awaits its first names.
 */
function EmptyPortfolio() {
  const { lang, t } = useLanguage();
  return (
    <div className="relative">
      <div className="ambient-grid absolute inset-0 -z-10 opacity-60" aria-hidden />

      {/* The journey framing stays — it's evergreen and educational */}
      <JourneyBand />

      <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,4rem)] gap-y-10 items-center">
        <div className="lg:col-span-7">
          <div className="flex items-center gap-3 mb-5">
            <span aria-hidden className="h-px w-9 bg-primary/50" />
            <span className="eyebrow">{t({ ar: "المحفظة قيد التكوين", en: "The portfolio is forming" })}</span>
          </div>
          <h2
            className="font-display font-extrabold text-foreground"
            style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", lineHeight: 1.06, letterSpacing: "-0.028em" }}
          >
            {t({ ar: "أوّل دفعة ", en: "The first cohort is " })}
            <span className="text-primary">{t({ ar: "تَبني الآن.", en: "building now." })}</span>
          </h2>
          <p className="mt-5 text-fg-secondary text-[15px] leading-[1.85] max-w-xl">
            {t({
              ar: "هنا، قريبًا، تظهر أسماء المشاريع التي وُلدت في آيلاند — مشاريع تبدأ بفكرة، تمرّ بيوم عرضٍ أمام الدّاعمين، وتصل إلى السّوق. الدفعة الأولى تكتب سطورها الأولى اليوم، ومقعدك في الصفحة التالية.",
              en: "This is where the names of ventures born at Island Haven will live — ventures that start as an idea, pass through a Demo Day, and reach the market. The first cohort is writing its opening lines today, and your seat is on the next page.",
            })}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/apply"
              data-testid="ventures-empty-apply"
              className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] shadow-soft transition-transform duration-200 hover:-translate-y-0.5"
            >
              {t({ ar: "قدّم للدفعة الأولى", en: "Apply to the first cohort" })}
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 ltr:rotate-180" />
            </Link>
            <Link
              href="/programs"
              data-testid="ventures-empty-programs"
              className="group inline-flex items-center gap-2 text-[14px] font-semibold text-primary"
            >
              {t({ ar: "كيف يعمل الاحتضان", en: "How incubation works" })}
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 ltr:rotate-180" />
            </Link>
          </div>
        </div>

        {/* Quiet placeholder ledger — three slots awaiting their first names */}
        <div className="lg:col-span-5">
          <GlassCard className="p-7 lg:p-8">
            <div className="eyebrow eyebrow-sand mb-5">
              {t({ ar: "الدفعة الأولى", en: "Cohort 01" })}
            </div>
            <ul>
              {[0, 1, 2].map((i) => (
                <li
                  key={i}
                  className="flex items-center gap-4 border-t border-border py-5 first:border-t-0 first:pt-0"
                >
                  <span className="tnum text-sand leading-none font-display font-extrabold text-[1.5rem]">
                    {lang === "en" ? `0${i + 1}` : ["٠١", "٠٢", "٠٣"][i]}
                  </span>
                  <span className="font-display font-bold text-foreground/25 text-[clamp(1.1rem,2vw,1.5rem)] leading-none">
                    {t({ ar: "قيد البناء", en: "in the making" })}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground text-[12.5px] mt-6 pt-5 border-t border-border-strong">
              {t({ ar: "أسماء حقيقيّة — قريبًا جدًّا.", en: "Real names — very soon." })}
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function ClosingCTA() {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="mt-16 sm:mt-20"
    >
      <GlassCard className="relative p-7 sm:p-10 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-16 inset-x-0 h-[150%] brand-aura opacity-60" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-xl">
            <div className="eyebrow mb-4">{t({ ar: "السّطر التالي", en: "The next line" })}</div>
            <h2
              className="font-display font-extrabold text-foreground"
              style={{ fontSize: "clamp(1.5rem, 3.2vw, 2.2rem)", lineHeight: 1.08, letterSpacing: "-0.026em" }}
            >
              {t({ ar: "مشروعك القادم ", en: "Your venture is the " })}
              <span className="text-primary">{t({ ar: "في هذه المحفظة.", en: "next in this portfolio." })}</span>
            </h2>
            <p className="mt-4 text-fg-secondary text-[14px] leading-[1.8]">
              {t({
                ar: "احتضانٌ مجّانيّ، إرشاد، وDemo Day — كلّ ما يلزم لتأخذ فكرتك من الورقة إلى السّوق، من قلب غزّة إلى العالم.",
                en: "Free incubation, mentorship and a Demo Day — everything you need to take your idea from paper to market, from the heart of Gaza to the world.",
              })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/apply"
              data-testid="ventures-cta-apply"
              className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] shadow-soft transition-transform duration-200 hover:-translate-y-0.5"
            >
              {t({ ar: "ابدأ مشروعك", en: "Start your venture" })}
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 ltr:rotate-180" />
            </Link>
            <Link
              href="/programs"
              data-testid="ventures-cta-programs"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-border-strong bg-surface-2 text-fg-secondary text-[13px] font-semibold hover:border-primary/40 hover:text-foreground transition-colors"
            >
              {t({ ar: "البرامج والدفعات", en: "Programs & cohorts" })}
              <ArrowLeft className="w-4 h-4 ltr:rotate-180" />
            </Link>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function SkeletonVentures() {
  return (
    <div className="space-y-12">
      <div className="flex gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-8 w-36 rounded-full bg-surface-2 border border-border-strong animate-pulse" />
        ))}
      </div>
      <div className="grid sm:grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-surface-2 border border-border-strong animate-pulse" />
        ))}
      </div>
      <div className="h-7 w-40 rounded-lg bg-surface-2 animate-pulse" />
      <div className="grid lg:grid-cols-2 gap-5">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-[24px] h-72 bg-surface-2 border border-border-strong shadow-soft animate-pulse" />
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-[24px] h-72 bg-surface-2 border border-border-strong shadow-soft animate-pulse" />
        ))}
      </div>
    </div>
  );
}
