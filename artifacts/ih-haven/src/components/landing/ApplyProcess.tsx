import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  FileText,
  Search,
  Rocket,
  Trophy,
  ArrowLeft,
  CalendarDays,
  Clock,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { formatDate, type CohortStatus } from "@/lib/labels";

/**
 * ApplyProcess — "How to join", stated with funded-incubator transparency.
 *
 * World-class incubators make joining legible: Antler publishes cohort dates,
 * YC states the 3-month model + Demo Day. This section mirrors that — four plain
 * steps (Apply → Review → Onboard into a cohort → Demo Day), a concrete "next
 * cohort" line pulled from /api/cohorts when available (otherwise a clean
 * evergreen rolling-admissions line), and one prominent Apply CTA.
 *
 * Dark cinematic, .font-display headline, fully bilingual, motion presets shared
 * with the rest of the landing surface.
 */

interface CohortRow {
  id: number;
  name: string;
  slug: string;
  startsAt: string | null;
  demoDayAt: string | null;
  status: CohortStatus;
}

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const rise: Variants = {
  // Visible by default (y-only) so content never stays hidden if the scroll
  // reveal fails to fire; the rise still animates as enhancement when it does.
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

// A live/open/announced cohort is one applicants can still join or is upcoming.
function isUpcoming(s: CohortStatus): boolean {
  return s === "open" || s === "announced";
}

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

  const steps = [
    {
      no: "01",
      icon: FileText,
      title: t({ ar: "تقدّم بطلبك", en: "Apply" }),
      en: "Apply",
      body: t({
        ar: "نموذج واحد، 15–30 دقيقة. أخبرنا مَن أنت وماذا تبني — والصراحة تُقوّي طلبك.",
        en: "One form, 15–30 minutes. Tell us who you are and what you're building — candor strengthens your case.",
      }),
      meta: t({ ar: "15–30 دقيقة", en: "15–30 min" }),
    },
    {
      no: "02",
      icon: Search,
      title: t({ ar: "المراجعة والمقابلة", en: "Review & interview" }),
      en: "Review",
      body: t({
        ar: "يقرأ الفريق كلّ طلب، ثمّ مقابلة قصيرة. نردّ خلال أيّام — قُبِلت أو لم تُقبَل، بتغذية راجعة واضحة.",
        en: "The team reads every application, then a short interview. We respond within days — accepted or not, with clear feedback.",
      }),
      meta: t({ ar: "خلال أيّام", en: "Within days" }),
    },
    {
      no: "03",
      icon: Rocket,
      title: t({ ar: "الانضمام إلى دفعة", en: "Onboard into a cohort" }),
      en: "Onboard",
      body: t({
        ar: "تنضمّ إلى دفعة من المؤسّسين والمستقلّين — مساحة، إرشاد، ورشات، وخارطة طريق واضحة لمشروعك.",
        en: "You join a cohort of founders and freelancers — space, mentorship, workshops and a clear roadmap for your project.",
      }),
      meta: t({ ar: "3–6 أشهر", en: "3–6 months" }),
    },
    {
      no: "04",
      icon: Trophy,
      title: t({ ar: "يوم العرض", en: "Demo Day" }),
      en: "Demo Day",
      body: t({
        ar: "تختم الرحلة بعرض مشروعك أمام شبكتنا من الداعمين والمرشدين والفرص — هنا يبدأ ما بعد آيلاند.",
        en: "Close the journey by presenting to our network of supporters, mentors and opportunities — where life after Island Haven begins.",
      }),
      meta: t({ ar: "أمام الشبكة", en: "To the network" }),
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
      className="relative bg-surface-1 section-y overflow-hidden"
    >
      <div className="relative container-ih">
        {/* Header */}
        <div className="max-w-3xl mb-[clamp(2rem,4vw,3.5rem)]">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-10 bg-primary/40" />
            <span className="eyebrow">
              {t({ ar: "كيف تنضمّ", en: "How to join" })}
            </span>
          </div>
          <h2 className="t-h1">
            {t({ ar: "من طلب واحد ", en: "From one application " })}
            <span className="text-accent-gradient">
              {t({ ar: "إلى يوم العرض", en: "to Demo Day" })}
            </span>
          </h2>
          <p className="t-body-lg mt-6 max-w-2xl">
            {t({
              ar: "أربع خطوات واضحة، بلا رسوم وبلا غموض — هكذا تنتقل من فكرة إلى دفعة تُطلِق مشروعك.",
              en: "Four clear steps — no fees, no fog. This is how you go from an idea to a cohort that launches your project.",
            })}
          </p>

          {/* Next-cohort / rolling-intake line */}
          <div className="mt-7 inline-flex items-center gap-2.5 rounded-full px-4 py-2 bg-surface-2 border border-border-strong text-caption text-fg-secondary tnum">
            {cohortLine}
          </div>
        </div>

        {/* Steps */}
        <motion.ol
          variants={reduce ? undefined : stagger}
          initial={reduce ? undefined : "hidden"}
          whileInView={reduce ? undefined : "show"}
          viewport={{ once: true, margin: "-10% 0px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isLast = i === steps.length - 1;
            return (
              <motion.li
                key={s.no}
                variants={reduce ? undefined : rise}
                className="relative h-full"
              >
                {/* Connector arrow between steps (desktop, LTR + RTL aware) */}
                {!isLast && (
                  <div className="hidden lg:flex absolute top-12 -end-[14px] z-10 items-center justify-center text-fg-faint">
                    <ArrowLeft className="w-5 h-5 rtl:rotate-0 ltr:rotate-180" strokeWidth={2} />
                  </div>
                )}
                <div className="group card-base card-hover flex flex-col h-full p-7 lg:p-8">
                  <div className="flex items-center justify-between mb-5">
                    <div className="icon-tile">
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <span
                      dir="ltr"
                      className="font-display text-[34px] leading-none font-extrabold text-foreground/10 group-hover:text-primary/30 transition-colors tnum"
                    >
                      {s.no}
                    </span>
                  </div>
                  <div className="eyebrow mb-2">
                    {s.en}
                  </div>
                  <h3 className="t-h3 mb-2">
                    {s.title}
                  </h3>
                  <p className="t-body flex-1 text-[14px]">
                    {s.body}
                  </p>
                  <div className="mt-5 inline-flex items-center gap-1.5 text-caption font-semibold text-muted-foreground tnum">
                    <Clock className="w-3.5 h-3.5" />
                    {s.meta}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </motion.ol>

        {/* CTA row */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6 }}
          className="mt-12 lg:mt-16 flex flex-wrap items-center gap-x-7 gap-y-4"
        >
          <Link
            href="/apply"
            data-testid="apply-process-cta"
            className="group inline-flex items-center justify-center gap-2.5 h-14 px-9 rounded-full bg-primary text-primary-foreground font-bold text-[14.5px] tracking-wide transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-16px_hsl(354_82%_30%_/_0.55)]"
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
