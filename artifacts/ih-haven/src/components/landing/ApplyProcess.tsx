import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import { ArrowLeft, CalendarDays, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { formatDate, type CohortStatus } from "@/lib/labels";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * ApplyProcess — "How to join", stated with funded-incubator transparency,
 * now carried by SCALE and SPACE instead of a templated numbered card row.
 *
 * World-class incubators make joining legible: Antler publishes cohort dates,
 * YC states the 3-month model + Demo Day. This section mirrors that — four plain,
 * truthful steps (Apply → Review → Onboard into a cohort → Demo Day), a concrete
 * "next cohort" line pulled from /api/cohorts when available (otherwise a clean
 * evergreen rolling-admissions line), and one prominent Apply CTA.
 *
 * The steps are read as large editorial type on acres of dark space — quiet index
 * numerals as a restrained margin detail, full-bleed photography opening the band,
 * one calm monumental thesis line. No eyebrow, no medallions, no icon tiles, no
 * uniform card grid, no aura blobs.
 */

interface CohortRow {
  id: number;
  name: string;
  slug: string;
  startsAt: string | null;
  demoDayAt: string | null;
  status: CohortStatus;
}

const rise: Variants = {
  // Visible by default (y-only) so content never stays hidden if the scroll
  // reveal fails to fire; the rise still animates as enhancement when it does.
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE_OUT_EXPO } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.04 } },
};

function Dot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full rounded-full bg-accent-2/60 animate-ping" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-2" />
    </span>
  );
}

export function ApplyProcess() {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();
  const [cohort, setCohort] = useState<CohortRow | null>(null);

  const mediaRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: mediaRef,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? ["0%", "0%"] : ["-7%", "7%"],
  );

  useEffect(() => {
    let cancelled = false;
    api<{ cohorts: CohortRow[] }>("/cohorts")
      .then((r) => {
        if (cancelled) return;
        // Prefer an open cohort, else the next announced one with a start date.
        const open = r.cohorts.find((c) => c.status === "open");
        const announced = r.cohorts
          .filter((c) => c.status === "announced" && c.startsAt)
          .sort(
            (a, b) =>
              new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime(),
          )[0];
        setCohort(open ?? announced ?? null);
      })
      .catch(() => {
        // Evergreen fallback — the section still reads cleanly without the API.
        if (!cancelled) setCohort(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Quiet two-digit index — a restrained margin detail, not a numbered ledger.
  const idx = (i: number) =>
    lang === "en" ? String(i + 1).padStart(2, "0") : ["٠١", "٠٢", "٠٣", "٠٤"][i];

  // Four truthful steps. No medallions, no icons, no meta chips — the words carry it.
  const steps: { title: string; body: string }[] = [
    {
      title: t({ ar: "تقدّم بطلبك", en: "Apply" }),
      body: t({
        ar: "نموذج واحد، 15–30 دقيقة. أخبرنا مَن أنت وماذا تبني — والصراحة تُقوّي طلبك.",
        en: "One form, 15–30 minutes. Tell us who you are and what you're building — candor strengthens your case.",
      }),
    },
    {
      title: t({ ar: "المراجعة والمقابلة", en: "Review & interview" }),
      body: t({
        ar: "يقرأ الفريق كلّ طلب، ثمّ مقابلة قصيرة. نردّ خلال أيّام — قُبِلت أو لم تُقبَل، بتغذية راجعة واضحة.",
        en: "The team reads every application, then a short interview. We respond within days — accepted or not, with clear feedback.",
      }),
    },
    {
      title: t({ ar: "الانضمام إلى دفعة", en: "Onboard into a cohort" }),
      body: t({
        ar: "تنضمّ إلى دفعة من المؤسّسين والمستقلّين — مساحة، إرشاد، ورشات، وخارطة طريق واضحة لمشروعك.",
        en: "You join a cohort of founders and freelancers — space, mentorship, workshops and a clear roadmap for your project.",
      }),
    },
    {
      title: t({ ar: "يوم العرض", en: "Demo Day" }),
      body: t({
        ar: "تختم الرحلة بعرض مشروعك أمام شبكتنا من الداعمين والمرشدين والفرص — هنا يبدأ ما بعد آيلاند.",
        en: "Close the journey by presenting to our network of supporters, mentors and opportunities — where life after Island Haven begins.",
      }),
    },
  ];

  // The "next cohort" line: concrete when we have a cohort, evergreen otherwise.
  const cohortLine = cohort ? (
    <>
      {cohort.status === "open" && <Dot />}
      <CalendarDays className="w-3.5 h-3.5 text-accent-2" strokeWidth={2} />
      <span>
        {cohort.status === "open"
          ? t({ ar: "التقديم مفتوح الآن", en: "Applications open now" })
          : t({ ar: "الدفعة القادمة", en: "Next cohort" })}
        {" · "}
        <span className="text-foreground font-semibold">{cohort.name}</span>
        {cohort.startsAt && (
          <>
            {" — "}
            {t({ ar: "تبدأ", en: "starts" })} {formatDate(cohort.startsAt, lang)}
          </>
        )}
      </span>
    </>
  ) : (
    <>
      <Clock className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
      <span>
        {t({
          ar: "التقديم مفتوح على مدار العام — والدفعة القادمة قريبًا.",
          en: "Rolling admissions, all year round — the next cohort is coming soon.",
        })}
      </span>
    </>
  );

  return (
    <section
      id="how-to-join"
      className="relative bg-surface-1 overflow-hidden"
      style={{ paddingBlock: "clamp(5.5rem, 13vh, 11rem)" }}
    >
      {/* ── Monumental thesis — one calm line on acres of space. ── */}
      <div className="container-ih relative">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
          className="max-w-5xl"
        >
          <h2
            className="font-display text-foreground"
            style={{
              fontSize: "clamp(2.6rem, 7.4vw, 5rem)",
              lineHeight: 1.0,
              letterSpacing: "-0.04em",
              fontWeight: 700,
            }}
          >
            {t({ ar: "من طلبٍ واحد،", en: "From one application," })}
            <br />
            <span className="text-primary">
              {t({ ar: "إلى يوم العرض.", en: "to Demo Day." })}
            </span>
          </h2>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.85, delay: 0.45, ease: EASE_OUT_EXPO }}
            className="mt-9 sm:mt-11 max-w-2xl text-fg-secondary"
            style={{ fontSize: "clamp(1.1rem, 1.9vw, 1.45rem)", lineHeight: 1.62 }}
          >
            {t({
              ar: "أربع خطوات واضحة، بلا رسوم وبلا غموض — هكذا تنتقل من فكرة إلى دفعة تُطلِق مشروعك.",
              en: "Four clear steps — no fees, no fog. This is how you go from an idea to a cohort that launches your project.",
            })}
          </motion.p>

          {/* Next-cohort / rolling-intake line — the one real data point, quiet. */}
          <div className="mt-8 inline-flex items-center gap-2.5 text-caption text-fg-secondary tnum">
            {cohortLine}
          </div>
        </motion.div>
      </div>

      {/* ── Full-bleed photography — the journey, shown not decorated. ── */}
      <div
        ref={mediaRef}
        className="relative mt-16 sm:mt-24 h-[44vh] min-h-[320px] max-h-[560px] overflow-hidden"
      >
        <motion.img
          style={{ y: imgY }}
          src={`${import.meta.env.BASE_URL}photos/IMG_8357.webp`}
          alt={t({
            ar: "مؤسّسون يعملون في مساحة آيلاند هيفن",
            en: "Founders at work in the Island Haven space",
          })}
          loading="lazy"
          className="absolute inset-0 h-[114%] w-full object-cover will-change-transform"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/35 to-transparent" />
      </div>

      {/* ── The four steps — large editorial type, generous rhythm, no cards. ── */}
      <div className="container-ih relative">
        <motion.ol
          variants={reduce ? undefined : stagger}
          initial={reduce ? undefined : "hidden"}
          whileInView={reduce ? undefined : "show"}
          viewport={{ once: true, margin: "-8% 0px" }}
          className="mt-[clamp(3.5rem,8vh,7rem)] max-w-4xl"
        >
          {steps.map((s, i) => (
            <motion.li
              key={i}
              variants={reduce ? undefined : rise}
              className="grid grid-cols-[auto_1fr] gap-x-[clamp(1.5rem,5vw,4rem)] items-baseline border-t border-border-strong/70 py-[clamp(2.25rem,5vh,4rem)] first:border-t-0 first:pt-0"
            >
              <span
                className="font-display tabular-nums text-fg-faint leading-none select-none"
                style={{ fontSize: "clamp(0.95rem, 1.3vw, 1.2rem)", letterSpacing: "0.04em" }}
                aria-hidden="true"
              >
                {idx(i)}
              </span>
              <div>
                <h3
                  className="font-display text-foreground"
                  style={{
                    fontSize: "clamp(1.75rem, 3.6vw, 2.85rem)",
                    lineHeight: 1.06,
                    letterSpacing: "-0.03em",
                    fontWeight: 700,
                  }}
                >
                  {s.title}
                </h3>
                <p
                  className="mt-4 sm:mt-5 max-w-2xl text-fg-secondary"
                  style={{ fontSize: "clamp(1.02rem, 1.5vw, 1.2rem)", lineHeight: 1.66 }}
                >
                  {s.body}
                </p>
              </div>
            </motion.li>
          ))}
        </motion.ol>

        {/* ── One prominent Apply CTA — calm, generous. ── */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 18 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          className="mt-[clamp(3rem,7vh,6rem)] flex flex-wrap items-center gap-x-8 gap-y-4"
        >
          <Link
            href="/apply"
            data-testid="apply-process-cta"
            className="group inline-flex items-center justify-center gap-2.5 h-14 px-9 rounded-full cta-fill font-bold text-[14.5px] tracking-wide transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-16px_hsl(354_82%_30%_/_0.55)]"
          >
            {t({ ar: "قدّم طلبك الآن", en: "Apply now" })}
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 rtl:rotate-180" />
          </Link>
          <Link
            href="/process"
            className="inline-flex items-center gap-2 text-caption font-semibold text-fg-secondary hover:text-foreground transition-colors underline-offset-8 hover:underline"
          >
            {t({ ar: "تفاصيل عمليّة القبول", en: "See the full process" })}
          </Link>
          <Link
            href="/cohorts"
            className="inline-flex items-center gap-2 text-caption font-semibold text-fg-secondary hover:text-foreground transition-colors underline-offset-8 hover:underline"
          >
            {t({ ar: "استعرض الدفعات", en: "Browse cohorts" })}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
