import { useMemo } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowLeft, CalendarDays, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Btn } from "@/components/ui/Btn";
import { useCohorts } from "@/hooks/use-public-data";
import { imageUrl } from "@/hooks/use-content";
import { formatDate, type CohortStatus } from "@/lib/labels";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { CinematicMedia } from "./CinematicMedia";

/**
 * ApplyProcess — "How to join", stated with funded-incubator transparency,
 * rendered as an Apple-caliber DARK cinematic band.
 *
 * A full-bleed CinematicMedia header carries the monumental thesis (eyebrow +
 * headline + the one real data point: next cohort) on the journey photograph.
 * Below it, on deep near-black, the four truthful steps are read as clean
 * editorial rows: a big ghost step numeral, a display title, a quiet body, and
 * hairline dividers — roomy, aligned, de-densified. One prominent Apply CTA.
 *
 * World-class incubators make joining legible: Antler publishes cohort dates,
 * YC states the 3-month model + Demo Day. This mirrors that — four plain steps
 * (Apply → Review → Onboard into a cohort → Demo Day), a concrete "next cohort"
 * line from /api/cohorts when available (else a clean evergreen line), one CTA.
 */

interface CohortRow {
  id: number;
  name: string;
  nameEn: string;
  slug: string;
  startsAt: string | null;
  demoDayAt: string | null;
  status: CohortStatus;
}

const rise: Variants = {
  // y-only hidden (no opacity) so content is never stuck hidden if the scroll
  // reveal fails to fire; the rise still animates as enhancement when it does.
  hidden: { y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE_OUT_EXPO } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.04 } },
};

function Dot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full rounded-full bg-primary/60 animate-ping" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
    </span>
  );
}

export function ApplyProcess() {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();
  const { data } = useCohorts<CohortRow>();

  // The one real data point: prefer an open cohort, else the next announced one
  // with a start date. Undefined data (loading / error) → null → the section
  // reads cleanly with the evergreen line. Never invents a cohort or a date.
  const cohort = useMemo<CohortRow | null>(() => {
    if (!data) return null;
    const open = data.cohorts.find((c) => c.status === "open");
    const announced = data.cohorts
      .filter((c) => c.status === "announced" && c.startsAt)
      .sort(
        (a, b) =>
          new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime(),
      )[0];
    return open ?? announced ?? null;
  }, [data]);

  // Quiet two-digit index — a restrained margin detail, not a numbered ledger.
  const idx = (i: number) =>
    lang === "en" ? String(i + 1).padStart(2, "0") : ["٠١", "٠٢", "٠٣", "٠٤"][i];

  // Four truthful steps. No medallions, no icons, no meta chips — the words carry it.
  const steps: { title: string; body: string }[] = [
    {
      title: t({ ar: "تقدّم بطلبك", en: "Apply" }),
      body: t({
        ar: "نموذج واحد، ١٥–٣٠ دقيقة. أخبرنا مَن أنت وماذا تبني — والصراحة تُقوّي طلبك.",
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

  // The cohort's display name in the ACTIVE locale only. Per the i18n golden
  // rule we never fall back across languages: if the localized name is missing
  // (e.g. an Arabic-only operational cohort viewed in EN) we simply hide the
  // name + its separator rather than leak the other language.
  const cohortName = (lang === "en" ? cohort?.nameEn : cohort?.name)?.trim() || "";

  // The "next cohort" line: concrete when we have a cohort, evergreen otherwise.
  const cohortLine = cohort ? (
    <>
      {cohort.status === "open" && <Dot />}
      <CalendarDays className="w-3.5 h-3.5 text-sand-bright" strokeWidth={2} />
      <span>
        {cohort.status === "open"
          ? t({ ar: "التقديم مفتوح الآن", en: "Applications open now" })
          : t({ ar: "الدفعة القادمة", en: "Next cohort" })}
        {cohortName && (
          <>
            {" · "}
            <span className="text-white font-semibold">{cohortName}</span>
          </>
        )}
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
      <Clock className="w-3.5 h-3.5 text-sand-bright" strokeWidth={2} />
      <span>
        {t({
          ar: "التقديم مفتوح على مدار العام — والدفعة القادمة قريبًا.",
          en: "Rolling admissions, all year round — the next cohort is coming soon.",
        })}
      </span>
    </>
  );

  return (
    <section id="how-to-join" className="relative bg-[#060608] text-white">
      {/* ── Cinematic header — monumental thesis on the journey photograph. ── */}
      <CinematicMedia
        as="div"
        src={imageUrl("/photos/IMG_8357.webp")}
        alt={t({
          ar: "مؤسّسون يعملون في مساحة آيلاند هيفن",
          en: "Founders at work in the Island Haven space",
        })}
        scrim="heavy"
        sideScrim
        aria-label={t({ ar: "كيف تنضمّ", en: "How to join" })}
        className="min-h-[40vh] flex items-center"
      >
        <div className="container-ih w-full py-[clamp(2.5rem,7vh,4.5rem)]">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 30 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
            className="max-w-5xl"
          >
            {/* Eyebrow — hairline + tracked label. */}
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-10 bg-sand-bright/70" />
              <span className="text-[11px] tracking-[0.22em] uppercase text-sand-bright font-semibold rtl:tracking-normal">
                {t({ ar: "كيف تنضمّ", en: "How to join" })}
              </span>
            </div>

            <h2
              className="font-display text-white"
              style={{
                fontSize: "clamp(2.4rem, 5vw, 4.5rem)",
                fontWeight: 900,
                lineHeight: 0.98,
                letterSpacing: "-0.05em",
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
              transition={{ duration: 0.85, delay: 0.35, ease: EASE_OUT_EXPO }}
              className="mt-8 sm:mt-10 max-w-2xl text-white/75"
              style={{ fontSize: "clamp(1.1rem, 1.9vw, 1.45rem)", lineHeight: 1.6 }}
            >
              {t({
                ar: "أربع خطوات واضحة، بلا رسوم وبلا غموض — هكذا تنتقل من فكرة إلى دفعة تُطلِق مشروعك.",
                en: "Four clear steps — no fees, no fog. This is how you go from an idea to a cohort that launches your project.",
              })}
            </motion.p>

            {/* Next-cohort / rolling-intake line — the one real data point, quiet. */}
            <div className="mt-8 inline-flex items-center gap-2.5 text-[13px] sm:text-sm text-white/70 tnum">
              {cohortLine}
            </div>
          </motion.div>
        </div>
      </CinematicMedia>

      {/* ── The four steps — ONE connected vertical journey floated on a vivid
          community photograph. A terracotta spine links four nodes down a single
          glass panel: قدّم → المراجعة → الدفعة → يوم العرض, read as one path. ── */}
      <CinematicMedia
        as="div"
        src={imageUrl("/photos/IMG_8347.webp")}
        alt={t({
          ar: "مجتمع آيلاند هيفن في مساحة العمل المشتركة",
          en: "The Island Haven community in the shared workspace",
        })}
        scrim="medium"
        sideScrim={false}
        className="section-y"
        overlay={
          <div aria-hidden className="glass-ambient pointer-events-none absolute inset-0" />
        }
      >
        <div className="container-ih relative">
          <motion.ol
            variants={reduce ? undefined : stagger}
            initial={reduce ? undefined : "hidden"}
            whileInView={reduce ? undefined : "show"}
            viewport={{ once: true, margin: "-8% 0px" }}
            className="glass-panel-lg relative p-[clamp(1.5rem,3.5vw,2.75rem)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-[clamp(1.5rem,3vw,2.5rem)] gap-y-9"
          >
            {steps.map((s, i) => (
              <motion.li
                key={i}
                variants={reduce ? undefined : rise}
                className="relative flex flex-col"
              >
                {/* Node: dot + quiet index, read left→right (RTL right→left) as one path. */}
                <div className="flex items-center gap-3">
                  <span className="relative z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary shadow-[0_0_0_5px_hsl(24_14%_5%/0.85)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                  </span>
                  <span
                    className="font-display font-black tabular-nums leading-none text-primary/85 select-none"
                    style={{ fontSize: "clamp(1.5rem, 2.4vw, 2rem)", letterSpacing: "-0.03em" }}
                    aria-hidden="true"
                  >
                    {idx(i)}
                  </span>
                </div>
                <h3
                  className="mt-4 font-display text-white"
                  style={{ fontSize: "clamp(1.4rem, 2vw, 1.85rem)", lineHeight: 1.08, letterSpacing: "-0.03em", fontWeight: 800 }}
                >
                  {s.title}
                </h3>
                <p
                  className="mt-2.5 text-white/75"
                  style={{ fontSize: "clamp(0.98rem, 1.15vw, 1.08rem)", lineHeight: 1.55 }}
                >
                  {s.body}
                </p>
              </motion.li>
            ))}
          </motion.ol>

          {/* ── One prominent Apply CTA — calm, generous. ── */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="mt-[clamp(2.5rem,6vh,4rem)] max-w-4xl flex flex-wrap items-center gap-x-8 gap-y-4"
          >
            <Btn asChild variant="primary" size="lg" className="group px-9 hover:shadow-[0_20px_48px_-16px_hsl(354_82%_30%_/_0.55)]">
              <Link href="/apply" data-testid="apply-process-cta">
                {t({ ar: "قدّم طلبك الآن", en: "Apply now" })}
                <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              </Link>
            </Btn>
            <Link
              href="/process"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors underline-offset-8 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060608] rounded-sm"
            >
              {t({ ar: "تفاصيل عمليّة القبول", en: "See the full process" })}
            </Link>
            <Link
              href="/cohorts"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors underline-offset-8 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060608] rounded-sm"
            >
              {t({ ar: "استعرض الدفعات", en: "Browse cohorts" })}
            </Link>
          </motion.div>
        </div>
      </CinematicMedia>
    </section>
  );
}
