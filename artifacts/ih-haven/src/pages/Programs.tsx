import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { EASE_OUT_EXPO } from "@/lib/motion";
import {
  formatDate,
  splitTags,
  PROGRAM_STATUS_LABELS,
  type ProgramStatus,
} from "@/lib/labels";

export interface ProgramRow {
  id: number;
  title: string;
  summary: string;
  coverUrl: string | null;
  durationWeeks: number;
  seats: number;
  tags: string;
  startsAt: string | null;
  applyDeadline: string | null;
  status: ProgramStatus;
  applicants: number;
}

const PROGRAM_STATUS_LABELS_EN: Record<ProgramStatus, string> = {
  draft: "Draft",
  open: "Applications open",
  in_progress: "In progress",
  done: "Completed",
};

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
// Localised numeral: Arabic-Indic in AR, Western digits in EN.
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}

/* ──────────────────────────────────────────────────────────────────────────
 *  Shared house headline — one monumental calm line on the page body, at most
 *  one crimson word, acres of space. Rises line-by-line on reveal. No eyebrow
 *  rule, no medallion, no aura. Mirrors Statement / Partners / ExpertsBand.
 * ────────────────────────────────────────────────────────────────────────── */
function SectionHead({
  lines,
  lead,
  className = "",
}: {
  lines: React.ReactNode[];
  lead?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <header className={`max-w-4xl ${className}`}>
      <h2
        className="font-display text-foreground"
        style={{ fontSize: "clamp(2.4rem, 6.9vw, 5.6rem)", lineHeight: 1.0, letterSpacing: "-0.045em", fontWeight: 700 }}
      >
        {lines.map((ln, i) => (
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
      {lead && (
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 18 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ duration: 0.85, delay: 0.4, ease: EASE_OUT_EXPO }}
          className="mt-[clamp(1.5rem,3vw,2.5rem)] max-w-2xl text-fg-secondary"
          style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
        >
          {lead}
        </motion.p>
      )}
    </header>
  );
}

export default function Programs() {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<ProgramRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    document.title =
      lang === "ar"
        ? "مسارات الاحتضان — Island Haven"
        : "Incubation Programs — Island Haven";
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    api<{ programs: ProgramRow[] }>("/programs")
      .then((r) => !cancelled && setRows(r.programs))
      .catch(
        (e) =>
          !cancelled &&
          setError(
            e instanceof ApiError
              ? e.message
              : lang === "ar"
                ? "تعذّر التحميل"
                : "Couldn't load programs",
          ),
      );
    return () => {
      cancelled = true;
    };
  }, [lang]);

  // Open-for-application programs first — they're the actionable ones.
  const sorted = [...(rows ?? [])].sort(
    (a, b) => Number(b.status === "open") - Number(a.status === "open"),
  );
  const total = rows?.length ?? 0;
  const openCount = (rows ?? []).filter((p) => p.status === "open").length;
  const isEmpty = rows !== null && rows.length === 0;

  return (
    <PageShell
      active="programs"
      eyebrow={t({ ar: "احتضان · تسريع · نموّ", en: "Incubate · Accelerate · Grow" })}
      title={t({ ar: "مسارات", en: "Incubation" })}
      highlight={t({ ar: "الاحتضان", en: "Programs" })}
      subtitle={t({
        ar: "نأخذ مشروعك من فكرةٍ نيّئة إلى منتجٍ يقف على قدميه — في مسارٍ منظَّم: تقديم، دفعة، إرشاد فرديّ وأدوات حقيقيّة، ثمّ Demo Day أمام شبكة من الدّاعمين. مجّانًا، من قلب غزّة.",
        en: "We take your venture from a raw idea to a product that stands on its own — through a structured track: apply, join a cohort, get 1:1 mentorship and real tooling, then a Demo Day to our network of backers. Free, from the heart of Gaza.",
      })}
    >
      {error && (
        <GlassCard className="p-5 text-primary text-center" testId="programs-error">
          {error}
        </GlassCard>
      )}

      {/* ── The model leads — substantial even when few/no programs are seeded ── */}
      <HowItWorks />
      <ValueLedger />

      {/* ── A breath of full-bleed photography before the program list ── */}
      <CohortPhoto />

      {/* ── API-driven programs — de-carded into editorial hairline rows ── */}
      <section className="mt-[clamp(6rem,13vw,10rem)]">
        <SectionHead
          lines={[
            t({ ar: "اختر", en: "Pick your" }),
            <span key="accent" className="text-primary">{t({ ar: "مسارك.", en: "track." })}</span>,
          ]}
          lead={t({
            ar: "كلّ مسارٍ يحمل مدّته ومقاعده وموعد بدئه وما يقدّمه — اقرأ التفاصيل، ثمّ قدّم.",
            en: "Each track carries its duration, seats, start date and what it offers — read the details, then apply.",
          })}
        />

        {rows === null && !error ? (
          <SkeletonPrograms />
        ) : isEmpty ? (
          <ProgramsEmptyState />
        ) : (
          <>
            {(total > 0 || openCount > 0) && (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 12 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-8%" }}
                transition={{ duration: 0.7, delay: 0.4, ease: EASE_OUT_EXPO }}
                className="mt-[clamp(1.75rem,3vw,2.5rem)] flex flex-wrap items-center gap-x-7 gap-y-2 text-fg-secondary"
                style={{ fontSize: "clamp(1rem,1.5vw,1.15rem)" }}
              >
                <span className="font-display font-semibold tnum text-foreground">
                  {num(total, lang)} {t({ ar: "مسارات", en: "programs" })}
                </span>
                {openCount > 0 && (
                  <span className="font-display font-semibold text-fg-secondary">
                    <span className="tnum text-sand">{num(openCount, lang)}</span>{" "}
                    {t({ ar: "مفتوحة للتقديم", en: "open for applications" })}
                  </span>
                )}
              </motion.div>
            )}

            <ul className="mt-[clamp(2.5rem,5vw,4rem)] border-t border-border-strong/60">
              {sorted.map((p, i) => (
                <ProgramRowItem key={p.id} p={p} i={i} reduce={!!reduce} />
              ))}
            </ul>
          </>
        )}
      </section>

      {/* ── Terminal apply band ── */}
      <ApplyBand />
    </PageShell>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 *  كيف يعمل الاحتضان — the model, told the house way: one monumental line,
 *  the four steps as calm hairline rows (idea → cohort → 1:1 + tooling → Demo
 *  Day), then ONE full-bleed photograph with a slow parallax and a calm line
 *  overlaid. No eyebrow kicker, no numbered ledger as the dominant visual, no
 *  rounded photo card with a gradient text block.
 * ────────────────────────────────────────────────────────────────────────── */
function HowItWorks() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["8%", "-8%"]);

  const steps = [
    {
      title: t({ ar: "تُقدّم", en: "You apply" }),
      body: t({
        ar: "نموذجٌ قصير عن فكرتك وأين أنت منها. لا نطلب خبرةً سابقة — نبحث عن موهبةٍ وإصرار.",
        en: "A short form about your idea and where you stand. No prior track record required — we look for talent and resolve.",
      }),
    },
    {
      title: t({ ar: "تنضمّ إلى دفعة", en: "You join a cohort" }),
      body: t({
        ar: "تبدأ ضمن مجموعةٍ مختارة في رحلةٍ واحدة — تدريبٌ منظّم، مواعيد واضحة، وزملاء يبنون معك.",
        en: "You start inside a selected group on one shared journey — structured training, clear milestones, peers building alongside you.",
      }),
    },
    {
      title: t({ ar: "إرشاد ١:١ وأدوات", en: "1:1 mentorship & tooling" }),
      body: t({
        ar: "مرشدٌ مخصّص، جلسات فرديّة، ومساحة عمل برصيد سحابيّ وحلول دفعٍ دوليّة — كلّ ما يلزم لتبني.",
        en: "A dedicated mentor, one-on-one sessions, and a workspace with cloud credits and international payment rails — everything you need to build.",
      }),
    },
    {
      title: t({ ar: "Demo Day", en: "Demo Day" }),
      body: t({
        ar: "يُختم كلّ مسارٍ بيوم عرضٍ تقدّم فيه ما بنيته أمام مرشدين وداعمين ومستثمرين من شبكتنا.",
        en: "Every track ends in a Demo Day where you present what you built to mentors, backers and investors from our network.",
      }),
    },
  ];

  return (
    <section className="relative">
      <SectionHead
        lines={[
          t({ ar: "من الفكرة", en: "From an idea" }),
          <span key="accent">
            {t({ ar: "إلى ", en: "to " })}
            <span className="text-primary">{t({ ar: "الإطلاق.", en: "launch." })}</span>
          </span>,
        ]}
        lead={t({
          ar: "مسارٌ واحد واضح، لا متاهة. تعرف في كلّ لحظة أين أنت، وما الخطوة التالية، ومن يقف بجانبك — أربع خطوات، لا أكثر.",
          en: "One clear path, not a maze. At every moment you know where you stand, what comes next, and who stands beside you — four steps, no more.",
        })}
      />

      {/* The four steps — calm editorial hairline rows. A large name, the move as
          prose, separated by hairlines. Not a numbered ledger, not icon tiles. */}
      <ul className="mt-[clamp(3rem,6vw,5rem)] border-t border-border-strong/60">
        {steps.map((s, i) => (
          <li key={i}>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 22 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, delay: i * 0.06, ease: EASE_OUT_EXPO }}
              className="grid grid-cols-1 md:grid-cols-[minmax(0,18rem)_1fr] items-baseline gap-x-[clamp(1.5rem,4vw,4rem)] gap-y-2 border-b border-border-strong/60 py-[clamp(1.75rem,3.5vw,2.75rem)] will-change-transform"
            >
              <h3
                className="font-display font-bold text-foreground"
                style={{ fontSize: "clamp(1.4rem,3vw,2.3rem)", letterSpacing: "-0.028em", lineHeight: 1.1 }}
              >
                {s.title}
              </h3>
              <p className="t-body text-[15px] md:text-[16px] max-w-xl">{s.body}</p>
            </motion.div>
          </li>
        ))}
      </ul>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT_EXPO }}
        className="mt-[clamp(2.5rem,5vw,4rem)] flex flex-wrap items-center gap-x-7 gap-y-3"
      >
        <Link
          href="/apply?ref=programs-how"
          data-testid="how-apply"
          className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
        >
          {t({ ar: "ابدأ بالتقديم", en: "Start your application" })}
          <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
        </Link>
        <Link
          href="/book"
          className="group inline-flex items-center gap-2 text-[14px] font-semibold text-foreground/85 hover:text-foreground transition-colors"
        >
          {t({ ar: "احجز جلسة تعريفيّة", en: "Book an intro session" })}
          <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
        </Link>
      </motion.div>

      {/* The place where the first idea gets built — one full-bleed photograph
          with a slow parallax and a calm line overlaid. Shown, not described. */}
      <motion.div
        ref={ref}
        className="relative mt-[clamp(4rem,9vh,7rem)] w-full overflow-hidden rounded-[24px]"
        initial={reduce ? false : { opacity: 0 }}
        whileInView={reduce ? undefined : { opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1, ease: EASE_OUT_EXPO }}
      >
        <div className="relative h-[clamp(20rem,52vh,34rem)]">
          <motion.img
            style={{ y }}
            src="/photos/IMG_8347.webp"
            alt={t({ ar: "مساحة الاحتضان في آيلاند هيفن بغزّة", en: "The incubation space at Island Haven in Gaza" })}
            loading="lazy"
            className="absolute inset-0 h-[116%] -top-[8%] w-full object-cover object-center saturate-[1.04] will-change-transform"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, hsl(225 44% 5% / 0.32) 0%, hsl(225 44% 5% / 0.42) 45%, hsl(225 44% 5% / 0.9) 100%)" }}
          />
          <div className="absolute inset-0 flex items-end">
            <div className="w-full p-[clamp(1.75rem,5vw,3.5rem)]">
              <motion.p
                className="max-w-[22ch] text-white"
                style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.6rem)", lineHeight: 1.18, letterSpacing: "-0.02em", fontWeight: 600 }}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
              >
                {t({ ar: "هنا تُبنى الفكرة الأولى.", en: "Where the first idea gets built." })}
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 *  ما الذي يقدّمه الاحتضان — the value, as calm editorial hairline rows.
 *  Free first. Cloud credits · payments · network · Demo Day. No icon tiles,
 *  no numbered index, no eyebrow kicker — a name, what it gives, a hairline.
 * ────────────────────────────────────────────────────────────────────────── */
function ValueLedger() {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();

  const items = [
    {
      title: t({ ar: "مجّانًا بالكامل", en: "Entirely free" }),
      tag: t({ ar: "بلا رسوم · بلا حصّة", en: "No fees · no equity" }),
      body: t({
        ar: "لا رسوم، ولا حصّة من مشروعك. مدعومٌ من NasToNas حتّى لا تقف التكلفة عائقًا أمام موهبة.",
        en: "No fees, no equity taken. Backed by NasToNas so cost never stands between talent and its chance.",
      }),
    },
    {
      title: t({ ar: "رصيد سحابيّ وبنية تحتيّة", en: "Cloud credits & infrastructure" }),
      tag: t({ ar: "مساحة · إنترنت · كهرباء", en: "Space · internet · power" }),
      body: t({
        ar: "مساحة عمل بإنترنت وكهرباء موثوقَين، ورصيدٌ على المنصّات السحابيّة لتطلق دون قلق التكلفة.",
        en: "A workspace with reliable internet and power, plus credits on cloud platforms so you can ship without worrying about cost.",
      }),
    },
    {
      title: t({ ar: "حلول دفعٍ دوليّة", en: "International payments" }),
      tag: t({ ar: "تحصيلٌ من أيّ مكان", en: "Get paid anywhere" }),
      body: t({
        ar: "نفتح لك قنوات تحصيلٍ عالميّة — لتُقبض على عملك من أيّ مكان، رغم قيود الجغرافيا.",
        en: "We open global payment rails — so you can get paid for your work from anywhere, despite the constraints of geography.",
      }),
    },
    {
      title: t({ ar: "تشبيكٌ وتأثيرٌ عالميّ", en: "Global network & reach" }),
      tag: t({ ar: "عملٌ · تدريب · استثمار", en: "Work · training · investment" }),
      body: t({
        ar: "علاقات عملٍ وتدريبٍ واستثمار، وجهةٌ تنفيذٍ موثوقة تصل موهبتك إلى الاقتصاد الرقميّ العالميّ.",
        en: "Work, training and investment relationships, plus a trusted executor that connects your talent to the global digital economy.",
      }),
    },
    {
      title: t({ ar: "يُختم بـ Demo Day", en: "Ends in a Demo Day" }),
      tag: t({ ar: "تقف أمام شبكتنا", en: "You face our network" }),
      body: t({
        ar: "ليس شهادةً تُعلَّق — بل لحظةٌ تقف فيها أمام شبكتنا وتُري العالم ما بنيته بيديك.",
        en: "Not a certificate to hang — a moment where you stand before our network and show the world what you built.",
      }),
    },
  ];

  return (
    <section className="mt-[clamp(6rem,13vw,10rem)]">
      <SectionHead
        lines={[
          t({ ar: "حاضنةٌ كاملة،", en: "A full incubator," }),
          <span key="accent" className="text-primary">{t({ ar: "خلف كلّ مسار.", en: "behind every track." })}</span>,
        ]}
        lead={t({
          ar: "أيًّا كان المسار الذي تختاره، تأتيك معه هذه الأركان — البنية التحتيّة والتطوير والتشبيك في حزمةٍ واحدة.",
          en: "Whichever track you pick, these pillars come with it — infrastructure, development and global networking in one package.",
        })}
      />

      <ul className="mt-[clamp(3rem,6vw,5rem)] border-t border-border-strong/60">
        {items.map((it, i) => (
          <li key={i}>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 22 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: EASE_OUT_EXPO }}
              className="grid grid-cols-1 md:grid-cols-[minmax(0,20rem)_1fr_auto] items-baseline gap-x-[clamp(1.5rem,4vw,4rem)] gap-y-2 border-b border-border-strong/60 py-[clamp(1.75rem,3.5vw,2.75rem)] will-change-transform"
            >
              <h3
                className="font-display font-bold text-foreground"
                style={{ fontSize: "clamp(1.3rem,2.6vw,2rem)", letterSpacing: "-0.025em", lineHeight: 1.12 }}
              >
                {it.title}
              </h3>
              <p className="t-body text-[15px] md:text-[16px] max-w-xl">{it.body}</p>
              <span className="t-caption text-fg-secondary whitespace-nowrap md:text-end">
                {it.tag}
              </span>
            </motion.div>
          </li>
        ))}
      </ul>

      <p
        className="mt-[clamp(1.5rem,3vw,2.25rem)] text-fg-secondary"
        style={{ fontSize: "clamp(0.95rem,1.4vw,1.1rem)" }}
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        {t({ ar: "كلّ هذا يأتي مع المسار — لا تدفع مقابله، ولا تتنازل عن حصّة.", en: "All of it comes with the track — you pay nothing for it, and give up no equity." })}
      </p>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 *  One full-bleed photograph — a quiet breath between the value ledger and the
 *  program list, breaking the long run of text-only hairline rows. Same slow
 *  parallax pattern as HowItWorks. Direction-agnostic vertical wash so it
 *  mirrors correctly in both LTR and RTL. Shown, not described.
 * ────────────────────────────────────────────────────────────────────────── */
function CohortPhoto() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["8%", "-8%"]);

  return (
    <motion.div
      ref={ref}
      className="relative mt-[clamp(6rem,13vw,10rem)] w-full overflow-hidden rounded-[24px]"
      initial={reduce ? false : { opacity: 0 }}
      whileInView={reduce ? undefined : { opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1, ease: EASE_OUT_EXPO }}
    >
      <div className="relative h-[clamp(20rem,52vh,34rem)]">
        <motion.img
          style={{ y }}
          src="/photos/IMG_8352.webp"
          alt={t({ ar: "منتسبو الدفعة يعملون معًا في آيلاند هيفن بغزّة", en: "Cohort members working together at Island Haven in Gaza" })}
          loading="lazy"
          className="absolute inset-0 h-[116%] -top-[8%] w-full object-cover object-center saturate-[1.04] will-change-transform"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, hsl(225 44% 5% / 0.32) 0%, hsl(225 44% 5% / 0.42) 45%, hsl(225 44% 5% / 0.9) 100%)" }}
        />
        <div className="absolute inset-0 flex items-end">
          <div className="w-full p-[clamp(1.75rem,5vw,3.5rem)]">
            <motion.p
              className="max-w-[24ch] text-white"
              style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.6rem)", lineHeight: 1.18, letterSpacing: "-0.02em", fontWeight: 600 }}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
            >
              {t({ ar: "دفعةٌ واحدة، رحلةٌ واحدة.", en: "One cohort, one journey." })}
            </motion.p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 *  Educational empty state — never a bare "no programs". Holds the monumental
 *  register, tells the true story (the model is live, the first cohort is
 *  forming) and drives the Apply CTA. Keeps the `programs-empty` +
 *  `programs-empty-apply` testids. No aura blob, no numbered slot ledger.
 * ────────────────────────────────────────────────────────────────────────── */
function ProgramsEmptyState() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  const promises = [
    t({ ar: "مساحة عمل ورصيد سحابيّ", en: "Workspace & cloud credits" }),
    t({ ar: "إرشاد فرديّ ١:١", en: "1:1 mentorship" }),
    t({ ar: "حلول دفعٍ دوليّة", en: "International payments" }),
    t({ ar: "Demo Day أمام شبكتنا", en: "Demo Day to our network" }),
  ];

  return (
    <div data-testid="programs-empty" className="mt-[clamp(2.5rem,5vw,4rem)]">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
        className="inline-flex items-center gap-2.5 text-fg-secondary mb-[clamp(1.5rem,3vw,2.25rem)]"
      >
        <span aria-hidden className="inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="font-display font-semibold" style={{ fontSize: "clamp(1rem,1.4vw,1.15rem)" }}>
          {t({ ar: "الدفعة الأولى تتشكّل", en: "First cohort forming" })}
        </span>
      </motion.div>

      <motion.h3
        className="font-display text-foreground max-w-[18ch]"
        style={{ fontSize: "clamp(2rem, 5.4vw, 4rem)", lineHeight: 1.02, letterSpacing: "-0.04em", fontWeight: 700 }}
      >
        {[
          t({ ar: "لم تُفتح دفعةٌ بعد —", en: "No cohort is open yet —" }),
          <span key="accent" className="text-primary">{t({ ar: "لكنّ الباب مفتوح.", en: "but the door is." })}</span>,
        ].map((ln, i) => (
          <motion.span
            key={i}
            className="block will-change-transform"
            initial={reduce ? false : { opacity: 0, y: 28 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.85, delay: i * 0.09, ease: EASE_OUT_EXPO }}
          >
            {ln}
          </motion.span>
        ))}
      </motion.h3>

      <motion.p
        initial={reduce ? false : { opacity: 0, y: 18 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.85, delay: 0.36, ease: EASE_OUT_EXPO }}
        className="mt-[clamp(1.5rem,3vw,2.5rem)] max-w-2xl text-fg-secondary"
        style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
      >
        {t({
          ar: "المسار جاهز: تقديم، ثمّ دفعة، فإرشاد فرديّ وأدوات، يُختم بـ Demo Day. قدّم الآن لتكون من الدفعة الأولى — نراجع الطلبات أوّلًا بأوّل، ونتواصل معك حين تُفتح.",
          en: "The track is ready: apply, then join a cohort, then 1:1 mentorship and tooling, ending in a Demo Day. Apply now to be in the first cohort — we review on a rolling basis and reach out the moment it opens.",
        })}
      </motion.p>

      {/* What the first cohort gets — a quiet editorial list, hairline-led. */}
      <ul className="mt-[clamp(2.5rem,5vw,4rem)] border-t border-border-strong/60 max-w-2xl">
        {promises.map((p, i) => (
          <li key={i}>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: EASE_OUT_EXPO }}
              className="border-b border-border-strong/60 py-[clamp(1rem,2vw,1.5rem)]"
            >
              <span
                className="font-display font-semibold text-foreground"
                style={{ fontSize: "clamp(1.1rem,1.9vw,1.45rem)", letterSpacing: "-0.018em" }}
              >
                {p}
              </span>
            </motion.div>
          </li>
        ))}
      </ul>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT_EXPO }}
        className="mt-[clamp(2.5rem,5vw,4rem)] flex flex-wrap items-center gap-x-7 gap-y-3"
      >
        <Link
          href="/apply?ref=programs-empty"
          data-testid="programs-empty-apply"
          className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
        >
          {t({ ar: "قدّم للدفعة الأولى", en: "Apply to the first cohort" })}
          <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
        </Link>
        <Link
          href="/book"
          className="group inline-flex items-center gap-2 text-[14px] font-semibold text-foreground/85 hover:text-foreground transition-colors"
        >
          {t({ ar: "تحدّث معنا أوّلًا", en: "Talk to us first" })}
          <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 *  Terminal apply band — closes the page with the mission, as one calm
 *  monumental line on a full-bleed photograph. No aura blob, no card.
 * ────────────────────────────────────────────────────────────────────────── */
function ApplyBand() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["8%", "-8%"]);

  return (
    <motion.div
      ref={ref}
      className="relative mt-[clamp(6rem,13vw,10rem)] w-full overflow-hidden rounded-[24px]"
      initial={reduce ? false : { opacity: 0 }}
      whileInView={reduce ? undefined : { opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1, ease: EASE_OUT_EXPO }}
    >
      <div className="relative min-h-[clamp(24rem,58vh,38rem)] flex items-end">
        <motion.img
          style={{ y }}
          src="/photos/IMG_8341.webp"
          alt={t({ ar: "منتسبون يبنون في آيلاند هيفن بغزّة", en: "Members building at Island Haven in Gaza" })}
          loading="lazy"
          className="absolute inset-0 h-[116%] -top-[8%] w-full object-cover object-center saturate-[1.04] will-change-transform"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, hsl(225 44% 5% / 0.4) 0%, hsl(225 44% 5% / 0.6) 40%, hsl(225 44% 5% / 0.94) 100%)" }}
        />
        <div className="relative w-full p-[clamp(1.75rem,6vw,4rem)] max-w-3xl">
          <h2
            className="font-display text-white"
            style={{ fontSize: "clamp(2.2rem, 6vw, 4.25rem)", lineHeight: 1.0, letterSpacing: "-0.04em", fontWeight: 700 }}
          >
            {[
              t({ ar: "ألف موهبة. ثلاث سنوات.", en: "1,000 talents. Three years." }),
              <span key="accent">
                {t({ ar: "طريقٌ واحد ", en: "One path " })}
                <span className="text-primary">{t({ ar: "للخروج.", en: "out." })}</span>
              </span>,
            ].map((ln, i) => (
              <motion.span
                key={i}
                className="block will-change-transform"
                initial={reduce ? false : { opacity: 0, y: 28 }}
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
            transition={{ duration: 0.85, delay: 0.4, ease: EASE_OUT_EXPO }}
            className="mt-[clamp(1.5rem,3vw,2.25rem)] max-w-2xl text-white/70"
            style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
          >
            {t({
              ar: "هذا هدفنا: أن نصل بموهبة غزّة إلى الاقتصاد الرقميّ العالميّ. مقعدك في المسار التالي.",
              en: "That's our goal: to carry Gaza's talent into the global digital economy. Your seat is in the next track.",
            })}
          </motion.p>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.8, delay: 0.5, ease: EASE_OUT_EXPO }}
            className="mt-[clamp(2rem,4vw,3rem)] flex flex-wrap items-center gap-x-7 gap-y-3"
          >
            <Link
              href="/apply?ref=programs-band"
              data-testid="programs-band-apply"
              className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
            >
              {t({ ar: "انتسب الآن", en: "Apply now" })}
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            </Link>
            <Link
              href="/become-mentor?ref=programs-band"
              className="group inline-flex items-center gap-2 text-[14px] font-semibold text-white/85 hover:text-white transition-colors"
            >
              {t({ ar: "سجّل كمرشد", en: "Become a mentor" })}
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 *  One program — a calm editorial hairline row (no card, no medallion-initials
 *  fallback, no gradient hover aura, no icon-tile meta). A dignified cover
 *  thumbnail where one exists, a large title, the summary as prose, the real
 *  data (duration · seats · dates) as quiet inline figures. Keeps the
 *  `program-card-{id}` testid + the /programs/:id route.
 * ────────────────────────────────────────────────────────────────────────── */
function ProgramRowItem({ p, i, reduce }: { p: ProgramRow; i: number; reduce: boolean }) {
  const { lang, t } = useLanguage();
  const open = p.status === "open";
  const statusLabel =
    lang === "ar" ? PROGRAM_STATUS_LABELS[p.status] : PROGRAM_STATUS_LABELS_EN[p.status];
  const tags = splitTags(p.tags).slice(0, 3);

  // Real DATA only — cerulean (sand) is reserved for these hard figures.
  const facts: string[] = [];
  if (p.durationWeeks > 0)
    facts.push(`${num(p.durationWeeks, lang)} ${t({ ar: "أسبوع", en: "weeks" })}`);
  if (p.seats > 0)
    facts.push(`${num(p.seats, lang)} ${t({ ar: "مقعد", en: "seats" })}`);
  if (p.startsAt)
    facts.push(`${t({ ar: "يبدأ", en: "Starts" })} ${formatDate(p.startsAt, lang)}`);

  return (
    <li>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 22 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, delay: Math.min(i, 6) * 0.06, ease: EASE_OUT_EXPO }}
        className="will-change-transform"
      >
        <Link
          href={`/programs/${p.id}`}
          data-testid={`program-card-${p.id}`}
          className={`group grid items-center gap-x-[clamp(1.25rem,3vw,2.75rem)] gap-y-3 border-b border-border-strong/60 py-[clamp(1.75rem,3.5vw,3rem)] transition-colors hover:border-border-strong ${
            p.coverUrl
              ? "grid-cols-[auto_1fr] md:grid-cols-[clamp(7rem,12vw,11rem)_minmax(0,1fr)_auto]"
              : "grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto]"
          }`}
        >
          {/* Dignified cover where one exists — full-bleed framed thumbnail, no
              medallion-initials fallback. Without a cover the title simply leads:
              the column collapses naturally in both mobile and desktop grids. */}
          {p.coverUrl && (
            <div className="relative h-[clamp(4.5rem,9vw,7rem)] w-[clamp(6rem,12vw,11rem)] shrink-0 overflow-hidden rounded-[14px] ring-1 ring-white/10 bg-surface-3">
              <img
                src={p.coverUrl}
                alt={p.title}
                loading="lazy"
                className="h-full w-full object-cover saturate-[1.03] transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
              />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-2">
              {open ? (
                <span className="inline-flex items-center gap-1.5 t-caption text-fg-secondary">
                  <span aria-hidden className="inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="font-semibold">{statusLabel}</span>
                </span>
              ) : (
                <span className="t-caption text-fg-secondary">{statusLabel}</span>
              )}
              {tags.length > 0 && (
                <>
                  <span aria-hidden className="text-fg-faint">·</span>
                  <span className="t-caption text-fg-secondary truncate">
                    {tags.join(lang === "en" ? " · " : " • ")}
                  </span>
                </>
              )}
            </div>
            <h3
              className="font-display font-bold text-foreground group-hover:text-primary transition-colors"
              style={{ fontSize: "clamp(1.4rem,3vw,2.3rem)", letterSpacing: "-0.028em", lineHeight: 1.1 }}
            >
              {p.title}
            </h3>
            {p.summary && (
              <p className="t-body text-[15px] md:text-[16px] mt-2 max-w-xl line-clamp-2">
                {p.summary}
              </p>
            )}
            {(facts.length > 0 || p.applyDeadline) && (
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
                {facts.map((f) => (
                  <span key={f} className="t-caption text-sand tnum">{f}</span>
                ))}
                {p.applyDeadline && (
                  <span className="t-caption text-sand tnum">
                    {t({ ar: "آخر موعد", en: "Apply by" })} {formatDate(p.applyDeadline, lang)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Quiet action, start-aligned to the logical end. */}
          <span className="hidden md:inline-flex items-center gap-2 t-caption text-fg-secondary whitespace-nowrap justify-self-end group-hover:text-foreground transition-colors">
            {open ? t({ ar: "قدّم الآن", en: "Apply now" }) : t({ ar: "التفاصيل", en: "Details" })}
            <ArrowLeft className="w-4 h-4 text-fg-faint rtl:rotate-180 transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:text-primary group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
          </span>
        </Link>
      </motion.div>
    </li>
  );
}

/* Skeleton — quiet hairline rows that match the de-carded program list. */
function SkeletonPrograms() {
  return (
    <div className="mt-[clamp(2.5rem,5vw,4rem)] border-t border-border-strong/60">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-5 border-b border-border-strong/60 py-[clamp(1.75rem,3.5vw,3rem)]">
          <div className="h-[clamp(4.5rem,9vw,7rem)] w-[clamp(6rem,12vw,11rem)] rounded-[14px] bg-surface-3 animate-pulse shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-3 w-28 rounded bg-surface-3 animate-pulse" />
            <div className="h-7 w-2/3 max-w-md rounded bg-surface-3 animate-pulse" />
            <div className="h-4 w-full max-w-lg rounded bg-surface-3 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
