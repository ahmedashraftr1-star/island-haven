import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Users,
  CalendarDays,
  Send,
  Cloud,
  Wallet,
  HandHeart,
  Network,
  Presentation,
  Check,
} from "lucide-react";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { Reveal } from "@/components/landing/Reveal";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
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

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
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
// Two-digit index for the editorial ledger.
function idx(i: number, lang: Lang): string {
  return lang === "ar"
    ? ["٠١", "٠٢", "٠٣", "٠٤", "٠٥"][i] ?? toArabicNum(i + 1)
    : String(i + 1).padStart(2, "0");
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

      {/* ── API-driven program cards ── */}
      <section className="mt-[clamp(3.5rem,7vw,6rem)]">
        <Reveal as="div" className="mb-[clamp(2rem,4vw,3rem)]">
          <div className="flex items-center gap-3 mb-5">
            <span aria-hidden className="h-px w-9 bg-primary/50" />
            <span className="eyebrow">{t({ ar: "الدفعات المفتوحة", en: "Open cohorts" })}</span>
          </div>
          <h2
            className="font-display font-extrabold text-foreground"
            style={{ fontSize: "clamp(1.9rem, 4.2vw, 3.2rem)", lineHeight: 1.05, letterSpacing: "-0.028em" }}
          >
            {t({ ar: "اختر ", en: "Pick your " })}
            <span className="text-primary">{t({ ar: "مسارك.", en: "track." })}</span>
          </h2>
          <p className="t-body mt-5 max-w-xl">
            {t({
              ar: "كلّ مسارٍ يحمل مدّته ومقاعده وموعد بدئه وما يقدّمه — اقرأ التفاصيل، ثمّ قدّم.",
              en: "Each track carries its duration, seats, start date and what it offers — read the details, then apply.",
            })}
          </p>
        </Reveal>

        {rows === null && !error ? (
          <SkeletonPrograms />
        ) : isEmpty ? (
          <ProgramsEmptyState />
        ) : (
          <>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-wrap items-center gap-2.5 mb-9 sm:mb-11"
            >
              <Chip>
                {num(total, lang)} {t({ ar: "مسارات", en: "programs" })}
              </Chip>
              {openCount > 0 && (
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold chip-sand">
                  <Dot />
                  {num(openCount, lang)} {t({ ar: "مفتوحة للتقديم", en: "open for applications" })}
                </span>
              )}
            </motion.div>

            <motion.div
              variants={reduce ? undefined : stagger}
              initial={reduce ? undefined : "hidden"}
              whileInView={reduce ? undefined : "show"}
              viewport={{ once: true, margin: "-8% 0px" }}
              className="grid sm:grid-cols-2 gap-5"
            >
              {sorted.map((p) => (
                <ProgramCard key={p.id} p={p} reduce={!!reduce} />
              ))}
            </motion.div>
          </>
        )}
      </section>

      {/* ── Terminal apply band ── */}
      <ApplyBand />
    </PageShell>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 *  كيف يعمل الاحتضان — the model as a numbered editorial ledger.
 *  Real photo + hairline-divided steps (apply → cohort → 1:1 + tooling → Demo Day).
 * ────────────────────────────────────────────────────────────────────────── */
function HowItWorks() {
  const { t, lang } = useLanguage();

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
      <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5rem)] gap-y-12 items-start">
        {/* Photo + lead — shown, not described */}
        <Reveal as="div" className="lg:col-span-5 lg:sticky lg:top-28">
          <div className="flex items-center gap-3 mb-5">
            <span aria-hidden className="h-px w-9 bg-primary/50" />
            <span className="eyebrow">{t({ ar: "كيف يعمل الاحتضان", en: "How incubation works" })}</span>
          </div>
          <h2
            className="font-display font-extrabold text-foreground"
            style={{ fontSize: "clamp(2rem, 4vw, 3.4rem)", lineHeight: 1.05, letterSpacing: "-0.025em" }}
          >
            {t({ ar: "أربع خطوات من الفكرة إلى ", en: "Four steps from idea to " })}
            <span className="text-primary">{t({ ar: "الإطلاق.", en: "launch." })}</span>
          </h2>
          <p className="t-body mt-5 max-w-md">
            {t({
              ar: "مسارٌ واحد واضح، لا متاهة. تعرف في كلّ لحظة أين أنت، وما الخطوة التالية، ومن يقف بجانبك.",
              en: "One clear path, not a maze. At every moment you know where you stand, what comes next, and who stands beside you.",
            })}
          </p>
          <div className="mt-8 overflow-hidden rounded-[20px] ring-1 ring-white/10 shadow-soft">
            <div className="relative">
              <img
                src="/photos/IMG_8347.webp"
                alt={t({ ar: "مساحة الاحتضان في آيلاند هيفن بغزّة", en: "The incubation space at Island Haven in Gaza" })}
                loading="lazy"
                className="w-full aspect-[5/4] object-cover saturate-[1.03]"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A]/80 via-[#0A0E1A]/5 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <div className="text-[11px] tracking-[0.2em] uppercase text-white/80 font-semibold mb-1.5">
                  {t({ ar: "من داخل المساحة", en: "Inside the space" })}
                </div>
                <div className="font-display font-bold text-white text-[clamp(1.05rem,1.9vw,1.45rem)]">
                  {t({ ar: "حيث تُبنى الفكرة الأولى", en: "Where the first idea gets built" })}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Numbered ledger — hairline-divided, no icon tiles */}
        <div className="lg:col-span-7">
          {steps.map((s, i) => (
            <Reveal
              key={i}
              delay={i * 0.05}
              className="grid grid-cols-[auto_1fr] gap-x-6 sm:gap-x-9 items-baseline border-t border-border-strong py-7 sm:py-9 first:border-t-0 first:pt-0"
            >
              <span className="font-display text-[clamp(1.5rem,2.4vw,2.1rem)] font-bold tnum text-fg-faint leading-none">
                {idx(i, lang)}
              </span>
              <div>
                <h3
                  className="font-display font-bold text-foreground"
                  style={{ fontSize: "clamp(1.3rem, 2.2vw, 1.85rem)", letterSpacing: "-0.018em", lineHeight: 1.15 }}
                >
                  {s.title}
                </h3>
                <p className="t-body mt-2.5 max-w-xl">{s.body}</p>
              </div>
            </Reveal>
          ))}

          <Reveal delay={0.1} className="mt-9 flex flex-wrap items-center gap-4">
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
              className="group inline-flex items-center gap-2 text-[14px] font-semibold text-primary"
            >
              {t({ ar: "احجز جلسة تعريفيّة", en: "Book an intro session" })}
              <ArrowLeft className="w-4 h-4 rotate-180 rtl:rotate-0 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 *  ما الذي يقدّمه الاحتضان — the value, as a quiet two-column index.
 *  Free first. Cloud credits · payments · mentorship · network · Demo Day.
 * ────────────────────────────────────────────────────────────────────────── */
function ValueLedger() {
  const { t, lang } = useLanguage();

  const items = [
    {
      Icon: HandHeart,
      title: t({ ar: "مجّانًا بالكامل", en: "Entirely free" }),
      body: t({
        ar: "لا رسوم، ولا حصّة من مشروعك. مدعومٌ من NasToNas حتّى لا تقف التكلفة عائقًا أمام موهبة.",
        en: "No fees, no equity taken. Backed by NasToNas so cost never stands between talent and its chance.",
      }),
    },
    {
      Icon: Cloud,
      title: t({ ar: "رصيد سحابيّ وبنية تحتيّة", en: "Cloud credits & infrastructure" }),
      body: t({
        ar: "مساحة عمل بإنترنت وكهرباء موثوقَين، ورصيدٌ على المنصّات السحابيّة لتطلق دون قلق التكلفة.",
        en: "A workspace with reliable internet and power, plus credits on cloud platforms so you can ship without worrying about cost.",
      }),
    },
    {
      Icon: Wallet,
      title: t({ ar: "حلول دفعٍ دوليّة", en: "International payments" }),
      body: t({
        ar: "نفتح لك قنوات تحصيلٍ عالميّة — لتُقبض على عملك من أيّ مكان، رغم قيود الجغرافيا.",
        en: "We open global payment rails — so you can get paid for your work from anywhere, despite the constraints of geography.",
      }),
    },
    {
      Icon: Network,
      title: t({ ar: "تشبيكٌ وتأثيرٌ عالميّ", en: "Global network & reach" }),
      body: t({
        ar: "علاقات عملٍ وتدريبٍ واستثمار، وجهةٌ تنفيذٍ موثوقة تصل موهبتك إلى الاقتصاد الرقميّ العالميّ.",
        en: "Work, training and investment relationships, plus a trusted executor that connects your talent to the global digital economy.",
      }),
    },
    {
      Icon: Presentation,
      title: t({ ar: "يُختم بـ Demo Day", en: "Ends in a Demo Day" }),
      body: t({
        ar: "ليس شهادةً تُعلَّق — بل لحظةٌ تقف فيها أمام شبكتنا وتُري العالم ما بنيته بيديك.",
        en: "Not a certificate to hang — a moment where you stand before our network and show the world what you built.",
      }),
    },
  ];

  return (
    <section className="mt-[clamp(3.5rem,7vw,6rem)]">
      <Reveal as="div" className="mb-[clamp(2rem,4vw,3rem)] max-w-2xl">
        <div className="flex items-center gap-3 mb-5">
          <span aria-hidden className="h-px w-9 bg-primary/50" />
          <span className="eyebrow">{t({ ar: "ما الذي يقدّمه", en: "What you get" })}</span>
        </div>
        <h2
          className="font-display font-extrabold text-foreground"
          style={{ fontSize: "clamp(1.9rem, 4.2vw, 3.2rem)", lineHeight: 1.05, letterSpacing: "-0.028em" }}
        >
          {t({ ar: "حاضنةٌ كاملة — ", en: "A full incubator — " })}
          <span className="text-primary">{t({ ar: "خلف كلّ مسار.", en: "behind every track." })}</span>
        </h2>
        <p className="t-body mt-5">
          {t({
            ar: "أيًّا كان المسار الذي تختاره، تأتيك معه هذه الأركان الخمسة — البنية التحتيّة والتطوير والتشبيك في حزمةٍ واحدة.",
            en: "Whichever track you pick, these five pillars come with it — infrastructure, development and global networking in one package.",
          })}
        </p>
      </Reveal>

      <div className="grid sm:grid-cols-2 border-t border-border-strong">
        {items.map(({ Icon, title, body }, i) => (
          <Reveal
            key={i}
            delay={(i % 2) * 0.05}
            className={`group grid grid-cols-[auto_1fr] gap-x-5 items-start border-b border-border-strong py-7 sm:py-8 ${
              i % 2 === 1 ? "sm:border-s sm:ps-8" : "sm:pe-8"
            }`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-primary-soft text-primary ring-1 ring-primary/20 transition-colors group-hover:bg-primary/15">
              <Icon className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-baseline gap-2.5">
                <span className="font-display tnum text-fg-faint text-[14px] font-bold leading-none">
                  {idx(i, lang)}
                </span>
                <h3
                  className="font-display font-bold text-foreground"
                  style={{ fontSize: "clamp(1.15rem, 1.8vw, 1.45rem)", letterSpacing: "-0.015em", lineHeight: 1.2 }}
                >
                  {title}
                </h3>
              </div>
              <p className="t-body mt-2.5">{body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 *  Educational empty state — never a bare "no programs". Explains the model
 *  is live (cohorts forming) and drives the Apply CTA. Keeps testids.
 * ────────────────────────────────────────────────────────────────────────── */
function ProgramsEmptyState() {
  const { t, lang } = useLanguage();

  const promises = [
    t({ ar: "مساحة عمل ورصيد سحابيّ", en: "Workspace & cloud credits" }),
    t({ ar: "إرشاد فرديّ ١:١", en: "1:1 mentorship" }),
    t({ ar: "حلول دفعٍ دوليّة", en: "International payments" }),
    t({ ar: "Demo Day أمام شبكتنا", en: "Demo Day to our network" }),
  ];

  return (
    <Reveal as="div" className="relative">
      <div data-testid="programs-empty" className="card-base p-7 sm:p-10 lg:p-12 overflow-hidden">
        <div aria-hidden className="ambient-grid absolute inset-0 -z-10" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[60%] brand-aura opacity-40" />

        <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,4vw,4rem)] gap-y-10 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 h-7 rounded-full chip-sand mb-6">
              <Dot />
              <span className="text-[12px] font-semibold">
                {t({ ar: "الدفعة الأولى تتشكّل", en: "First cohort forming" })}
              </span>
            </div>
            <h3
              className="font-display font-extrabold text-foreground"
              style={{ fontSize: "clamp(1.7rem, 3.6vw, 2.7rem)", lineHeight: 1.06, letterSpacing: "-0.026em" }}
            >
              {t({ ar: "لم تُفتح دفعةٌ بعد — ", en: "No cohort is open yet — " })}
              <span className="text-primary">{t({ ar: "لكنّ الباب مفتوح.", en: "but the door is." })}</span>
            </h3>
            <p className="t-body-lg mt-5 max-w-xl">
              {t({
                ar: "المسار جاهز: تقديم، ثمّ دفعة، فإرشاد فرديّ وأدوات، يُختم بـ Demo Day. قدّم الآن لتكون من الدفعة الأولى — نراجع الطلبات أوّلًا بأوّل، ونتواصل معك حين تُفتح.",
                en: "The track is ready: apply, then join a cohort, then 1:1 mentorship and tooling, ending in a Demo Day. Apply now to be in the first cohort — we review on a rolling basis and reach out the moment it opens.",
              })}
            </p>

            <ul className="mt-7 grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {promises.map((p, i) => (
                <li key={i} className="flex items-center gap-2.5 text-[14px] text-fg-secondary">
                  <Check className="w-4 h-4 text-sand shrink-0" />
                  {p}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap items-center gap-4">
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
                className="group inline-flex items-center gap-2 text-[14px] font-semibold text-primary"
              >
                {t({ ar: "تحدّث معنا أوّلًا", en: "Talk to us first" })}
                <ArrowLeft className="w-4 h-4 rotate-180 rtl:rotate-0 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Quiet ledger of cohort slots awaiting their first names */}
          <div className="lg:col-span-5">
            <div className="rounded-[18px] border border-border-strong bg-surface-1/60 p-6 sm:p-7">
              <div className="eyebrow eyebrow-sand mb-5">
                {t({ ar: "الدفعة ٠١", en: "Cohort 01" })}
              </div>
              <ul>
                {[0, 1, 2].map((i) => (
                  <li
                    key={i}
                    className="flex items-center gap-4 border-t border-border py-5 first:border-t-0 first:pt-0"
                  >
                    <span className="font-display tnum text-sand leading-none text-[1.5rem] font-bold">
                      {idx(i, lang)}
                    </span>
                    <span className="font-display text-foreground/25 text-[clamp(1.1rem,1.8vw,1.5rem)] leading-none font-bold">
                      {t({ ar: "قيد التكوين", en: "in the making" })}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="t-caption mt-6 pt-5 border-t border-border-strong">
                {t({ ar: "أسماءٌ حقيقيّة — قريبًا جدًّا.", en: "Real names — very soon." })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 *  Terminal apply band — closes the page with the mission + Apply/Mentor CTAs.
 * ────────────────────────────────────────────────────────────────────────── */
function ApplyBand() {
  const { t } = useLanguage();
  return (
    <Reveal as="div" className="mt-[clamp(3.5rem,7vw,6rem)]">
      <div className="relative overflow-hidden rounded-[24px] border border-border-strong bg-surface-2 shadow-soft">
        <div aria-hidden className="pointer-events-none absolute inset-0 brand-aura opacity-50" />
        <div className="relative p-8 sm:p-12 lg:p-14 max-w-3xl">
          <h2
            className="font-display font-extrabold text-foreground"
            style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", lineHeight: 1.05, letterSpacing: "-0.028em" }}
          >
            {t({ ar: "الموهبة لا تحدّها ", en: "Talent isn't bound by " })}
            <span className="text-primary">{t({ ar: "الجغرافيا.", en: "geography." })}</span>
          </h2>
          <p className="t-body-lg mt-5">
            {t({
              ar: "هدفنا: ١٬٠٠٠ موهبة غزّيّة في ثلاث سنوات تصل إلى الاقتصاد الرقميّ العالميّ. مقعدك في المسار التالي.",
              en: "Our goal: 1,000 Gazan talents reaching the global digital economy within three years. Your seat is in the next track.",
            })}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/apply?ref=programs-band"
              data-testid="programs-band-apply"
              className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
            >
              <Send className="w-4 h-4" />
              {t({ ar: "انتسب الآن", en: "Apply now" })}
            </Link>
            <Link
              href="/become-mentor?ref=programs-band"
              className="group inline-flex items-center gap-2 h-12 px-6 rounded-full border border-border-strong bg-surface-1 text-fg-secondary text-[14px] font-semibold hover:border-primary/40 hover:text-foreground transition-colors"
            >
              {t({ ar: "سجّل كمرشد", en: "Become a mentor" })}
              <ArrowLeft className="w-4 h-4 rotate-180 rtl:rotate-0 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[12.5px] font-medium text-fg-secondary bg-surface-2 border border-border-strong shadow-soft">
      {children}
    </span>
  );
}

function Dot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full rounded-full bg-sand/60 animate-ping" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-sand" />
    </span>
  );
}

function ProgramCard({ p, reduce }: { p: ProgramRow; reduce: boolean }) {
  const { lang, t } = useLanguage();
  const open = p.status === "open";
  const statusLabel =
    lang === "ar" ? PROGRAM_STATUS_LABELS[p.status] : PROGRAM_STATUS_LABELS_EN[p.status];
  return (
    <motion.div
      variants={reduce ? undefined : rise}
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="h-full"
    >
      <Link
        href={`/programs/${p.id}`}
        className="group block h-full"
        data-testid={`program-card-${p.id}`}
      >
        <GlassCard
          className={`group h-full flex flex-col overflow-hidden transition-colors ${
            open ? "border-sand/40 hover:border-sand/60" : "hover:border-primary/40"
          }`}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background:
                "radial-gradient(130% 80% at 80% 0%, hsl(354 80% 55% / 0.1), transparent 60%)",
            }}
          />
          {p.coverUrl ? (
            <div className="aspect-[16/9] overflow-hidden bg-surface-3">
              <img
                src={p.coverUrl}
                alt={p.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                loading="lazy"
              />
            </div>
          ) : (
            <div
              className="aspect-[16/9] relative flex items-end p-5"
              style={{ background: "linear-gradient(140deg, hsl(var(--primary)) 0%, hsl(var(--primary-pressed)) 100%)" }}
            >
              <span className="font-display font-black text-white/90 text-[clamp(1.4rem,3vw,2rem)] leading-none ring-2 ring-white/15 rounded-2xl px-4 py-2.5 bg-white/5">
                {p.title.trim().split(" ").slice(0, 2).map((w) => w[0]).join("")}
              </span>
            </div>
          )}
          <div className="relative p-6 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.14em] uppercase font-semibold ${
                  open
                    ? "chip-sand"
                    : "bg-surface-3 text-muted-foreground border border-border"
                }`}
              >
                {open && <Dot />}
                {statusLabel}
              </span>
            </div>
            <h3 className="text-foreground font-display font-bold text-[18px] leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {p.title}
            </h3>
            {p.summary && (
              <p className="text-fg-secondary text-[13px] leading-[1.7] line-clamp-3 mb-4">
                {p.summary}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {splitTags(p.tags)
                .slice(0, 3)
                .map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surface-3 text-fg-secondary border border-border"
                  >
                    {tag}
                  </span>
                ))}
            </div>
            <div className="mt-auto grid grid-cols-2 gap-2 text-[12px] text-muted-foreground pt-3 border-t border-border">
              {p.durationWeeks > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sand" />
                  {num(p.durationWeeks, lang)} {t({ ar: "أسبوع", en: "weeks" })}
                </span>
              )}
              {p.seats > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sand" />
                  {num(p.seats, lang)} {t({ ar: "مقعد", en: "seats" })}
                </span>
              )}
              {p.startsAt && (
                <span className="inline-flex items-center gap-1.5 col-span-2">
                  <CalendarDays className="w-3.5 h-3.5 text-sand" />
                  {t({ ar: "يبدأ:", en: "Starts:" })} {formatDate(p.startsAt, lang)}
                </span>
              )}
              {p.applyDeadline && (
                <span className="inline-flex items-center gap-1.5 col-span-2 text-primary/90">
                  <CalendarDays className="w-3.5 h-3.5 text-primary/80" />
                  {t({ ar: "آخر موعد للتقديم:", en: "Apply by:" })} {formatDate(p.applyDeadline, lang)}
                </span>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between text-[12.5px] text-primary transition-colors font-semibold">
              <span>{open ? t({ ar: "قدّم الآن", en: "Apply now" }) : t({ ar: "التفاصيل", en: "Details" })}</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 ltr:rotate-180" />
            </div>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}

function SkeletonPrograms() {
  return (
    <div className="space-y-8">
      <div className="flex gap-2.5">
        {[0, 1].map((i) => (
          <div key={i} className="h-8 w-32 rounded-full bg-surface-3 border border-border-strong animate-pulse" />
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-[24px] h-72 bg-surface-3 border border-border-strong shadow-soft animate-pulse" />
        ))}
      </div>
    </div>
  );
}
