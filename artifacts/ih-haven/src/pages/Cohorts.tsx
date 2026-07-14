import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/shell/PageShell";
import { Reveal } from "@/components/landing/Reveal";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { EASE_OUT_EXPO } from "@/lib/motion";
import {
  COHORT_STATUS_LABELS,
  formatArabicDate,
  type CohortStatus,
} from "@/lib/labels";

const COHORT_STATUS_LABELS_EN: Record<CohortStatus, string> = {
  announced: "Announced",
  open: "Applications open",
  in_progress: "In progress",
  demo_day: "Demo Day",
  completed: "Graduated",
};

interface CohortRow {
  id: number;
  programId: number;
  programTitle: string;
  name: string;
  slug: string;
  summary: string;
  coverUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  demoDayAt: string | null;
  status: CohortStatus;
  ventureCount: number;
}

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
// Localised numeral: Arabic-Indic in AR, Western digits in EN.
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}
// "Live" = a cohort the reader can still act on (apply / follow along).
function isLive(s: CohortStatus): boolean {
  return s === "in_progress" || s === "demo_day" || s === "open";
}
function fmtDate(iso: string | null, lang: Lang): string {
  if (!iso) return "";
  return lang === "ar"
    ? formatArabicDate(iso)
    : new Date(iso).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
}
// Compact range for headers: "May — Aug 2026" without restating the year.
function fmtRange(a: string | null, b: string | null, lang: Lang): string {
  if (!a) return "";
  const opts: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" };
  const loc = lang === "ar" ? "ar-EG" : "en-GB";
  const start = new Date(a).toLocaleDateString(loc, { month: "short" });
  const end = b ? new Date(b).toLocaleDateString(loc, opts) : new Date(a).toLocaleDateString(loc, opts);
  return b ? `${start} — ${end}` : end;
}

type T = ReturnType<typeof useLanguage>["t"];

// The three-movement cohort model, shared by the loaded body and the empty
// state so the teaching never drifts between the two surfaces.
function cohortModelSteps(t: T): { title: string; body: string }[] {
  return [
    {
      title: t({ ar: "تنطلق الدّفعة", en: "A cohort opens" }),
      body: t({
        ar: "نَفتح التقديم لمسارٍ محدّد، ونَقبل مجموعةً صغيرة من المؤسّسين معًا — فتبدأ الرّحلة كصفٍّ واحد، لا كأفرادٍ متفرّقين.",
        en: "We open applications for a track and accept a small class of founders together — so the journey starts as one cohort, not as scattered individuals.",
      }),
    },
    {
      title: t({ ar: "نَبني أسبوعًا بأسبوع", en: "We build, week by week" }),
      body: t({
        ar: "إرشادٌ فرديّ، ساعات مكتبيّة، موارد، ومحطّات أسبوعيّة. تَنضج المشاريع جنبًا إلى جنب، فيُصبح تقدّم كلّ مؤسّسٍ وقودًا لمن حوله.",
        en: "1:1 mentorship, office hours, resources and weekly milestones. Ventures mature side by side, so each founder's progress becomes fuel for the rest.",
      }),
    },
    {
      title: t({ ar: "نَختم بـ Demo Day", en: "We close with a Demo Day" }),
      body: t({
        ar: "تَنتهي كلّ دفعة بيوم عرضٍ تَقف فيه المشاريع أمام شبكةٍ من الدّاعمين والمرشدين والشّركاء — لحظة تَتحوّل فيها الرّحلة إلى فرصة.",
        en: "Every cohort ends with a Demo Day where ventures stand before a network of supporters, mentors and partners — the moment the journey turns into opportunity.",
      }),
    },
  ];
}

/** Live status word — a quiet cerulean pulse + the label, no chip, no medallion. */
function StatusLine({ status, lang, t }: { status: CohortStatus; lang: Lang; t: ReturnType<typeof useLanguage>["t"] }) {
  const reduce = useReducedMotion();
  const live = isLive(status);
  const label = t({ ar: COHORT_STATUS_LABELS[status], en: COHORT_STATUS_LABELS_EN[status] });
  if (live) {
    return (
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span aria-hidden className="relative flex h-2 w-2">
          {!reduce && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-sand/60 animate-ping motion-reduce:hidden" />
          )}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-sand" />
        </span>
        <span className="t-caption text-sand font-semibold">{label}</span>
      </span>
    );
  }
  return (
    <span className="t-caption text-fg-secondary whitespace-nowrap">{label}</span>
  );
}

export default function Cohorts() {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<CohortRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title =
      lang === "ar" ? "دفعات الحاضنة — Island Haven" : "Cohorts — Island Haven";
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    api<{ cohorts: CohortRow[] }>("/cohorts")
      .then((r) => !cancelled && setRows(r.cohorts))
      .catch(
        (e) =>
          !cancelled &&
          setError(
            e instanceof ApiError
              ? e.message
              : lang === "ar"
                ? "تعذّر التحميل"
                : "Couldn't load",
          ),
      );
    return () => {
      cancelled = true;
    };
  }, [lang]);

  // Live cohorts first, then most-recent. The very first live one becomes the
  // featured highlight; the rest become the editorial roster of rows.
  const sorted = [...(rows ?? [])].sort(
    (a, b) => Number(isLive(b.status)) - Number(isLive(a.status)),
  );
  const featured = sorted.find((c) => isLive(c.status)) ?? sorted[0] ?? null;
  const rest = featured ? sorted.filter((c) => c.id !== featured.id) : sorted;
  const total = rows?.length ?? 0;
  const liveCount = (rows ?? []).filter((c) => isLive(c.status)).length;
  const graduated = (rows ?? []).filter((c) => c.status === "completed").length;

  return (
    <PageShell
      eyebrow={t({ ar: "دَفعات الاحتضان · Cohorts", en: "Incubator Cohorts" })}
      title={t({ ar: "كلّ دفعة", en: "Founders who" })}
      highlight={t({ ar: "رحلة", en: "build together" })}
      subtitle={t({
        ar: "لا نَحتضن الأفكار فُرادى — بل نَجمعها في دَفعات. كلّ دَفعة صفٌّ من المؤسّسين يَمشون معًا من القبول إلى البناء إلى يوم العرض (Demo Day)، يَتعلّمون من بعضهم بقدر ما يَتعلّمون منّا.",
        en: "We don't incubate ideas one by one — we move them in cohorts. Each cohort is a class of founders walking together from acceptance to building to Demo Day, learning from one another as much as from us.",
      })}
    >
      {error && (
        <div className="card-base p-5 text-primary text-center" role="alert">
          {error}
        </div>
      )}

      {rows === null && !error ? (
        <SkeletonCohorts />
      ) : rows && rows.length === 0 ? (
        <EmptyCohorts />
      ) : (
        <div className="space-y-[clamp(5rem,11vw,9rem)]">
          {/* THE MODEL — three movements, told as calm editorial hairline rows */}
          <CohortModel />

          {/* FEATURED — the live (or most recent) cohort, as a grand full-bleed block */}
          {featured && <FeaturedCohort c={featured} liveCount={liveCount} />}

          {/* THE ROSTER — every other cohort as a calm editorial hairline row */}
          {rest.length > 0 && (
            <CohortRoster rows={rest} total={total} graduated={graduated} />
          )}

          {/* Always-on apply close — a cohort is a door, this is the handle */}
          <ApplyRail liveCount={liveCount} />
        </div>
      )}
    </PageShell>
  );
}

/* ── THE MODEL — one monumental line, three movements as calm hairline rows. ──
   No eyebrow kicker, no dominant 01/02/03 numerals, no sticky card — scale and
   space carry it the house way. ── */
function CohortModel() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  const steps = cohortModelSteps(t);

  return (
    <section>
      <header className="max-w-4xl">
        <h2
          className="font-display text-foreground"
          style={{ fontSize: "clamp(1.9rem, 4.6vw, 3.5rem)", lineHeight: 1.04, letterSpacing: "-0.04em", fontWeight: 700 }}
        >
          {[
            t({ ar: "ثلاث حركات،", en: "Three movements," }),
            t({ ar: "صفٌّ واحد.", en: "one class." }),
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
          transition={{ duration: 0.85, delay: 0.4, ease: EASE_OUT_EXPO }}
          className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-2xl text-fg-secondary"
          style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
        >
          {t({
            ar: "النموذج الذي يَجعل دفعةً من غزّة تَبني أسرع: قبولٌ جماعيّ، بناءٌ متزامن، وخطُّ نهايةٍ واحد يَجمع الجميع.",
            en: "The model that makes a Gaza cohort build faster: a shared start, synchronized building, and one finish line that gathers everyone.",
          })}
        </motion.p>
      </header>

      <ul className="mt-[clamp(3rem,6vw,5rem)] border-t border-border-strong/60">
        {steps.map((s, i) => (
          <li key={s.title}>
            <Reveal delay={Math.min(i, 6) * 0.06}>
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,18rem)_1fr] items-baseline gap-x-[clamp(1.5rem,3vw,3rem)] gap-y-2 py-[clamp(1.75rem,3.5vw,2.75rem)] border-b border-border-strong/60">
                <h3
                  className="font-display font-bold text-foreground"
                  style={{ fontSize: "clamp(1.4rem,2.8vw,2.1rem)", letterSpacing: "-0.025em", lineHeight: 1.1 }}
                >
                  {s.title}
                </h3>
                <p className="t-body text-[15px] md:text-[16px] max-w-2xl">{s.body}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── FEATURED — the live (or latest) cohort, as a grand full-bleed editorial
   block: large photography with parallax, a monumental name overlaid, real DATA
   in a calm cerulean meta rail. No card-base deck, no Layers medallion. ── */
// Curated house photograph behind a cover-less cohort — real /photos full-bleed,
// so the featured block carries photographic weight even without an uploaded cover.
const FEATURED_FALLBACK_PHOTO = "/photos/IMG_8352.webp";

function FeaturedCohort({ c, liveCount }: { c: CohortRow; liveCount: number }) {
  const { lang, t } = useLanguage();
  const reduce = useReducedMotion();
  const live = isLive(c.status);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-8%", "8%"]);
  const coverSrc = c.coverUrl ?? FEATURED_FALLBACK_PHOTO;

  const label = live
    ? liveCount > 1
      ? t({ ar: "دفعة جارية الآن", en: "Live cohort" })
      : t({ ar: "الدّفعة الجارية", en: "The current cohort" })
    : t({ ar: "أحدث دفعة", en: "Latest cohort" });

  // Real DATA only, rendered in cerulean: dates, venture count, Demo Day.
  const meta: { k: string; v: React.ReactNode }[] = [];
  if (c.startsAt || c.endsAt) {
    meta.push({
      k: t({ ar: "المدّة", en: "Runs" }),
      v: <span className="tnum text-sand">{fmtRange(c.startsAt, c.endsAt, lang)}</span>,
    });
  }
  meta.push({
    k: t({ ar: "المشاريع", en: "Ventures" }),
    v: (
      <span>
        <span className="tnum text-sand">{num(c.ventureCount, lang)}</span>{" "}
        <span className="text-fg-secondary">{t({ ar: c.ventureCount === 1 ? "مشروع" : "مشاريع", en: "in the class" })}</span>
      </span>
    ),
  });
  if (c.demoDayAt) {
    meta.push({
      k: t({ ar: "يوم العرض", en: "Demo Day" }),
      v: <span className="tnum text-sand-bright">{fmtDate(c.demoDayAt, lang)}</span>,
    });
  }

  return (
    <section>
      <Reveal as="p" className="t-caption text-fg-secondary mb-[clamp(1.25rem,2.5vw,2rem)]">
        {label}
      </Reveal>

      <motion.div
        ref={ref}
        initial={reduce ? false : { opacity: 0 }}
        whileInView={reduce ? undefined : { opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1, ease: EASE_OUT_EXPO }}
      >
        <Link
          href={`/cohorts/${c.slug}`}
          className="group block"
          data-testid={`cohort-card-${c.id}`}
        >
          {/* Full-bleed visual — real cover with parallax, or a curated house
              photograph when a cohort has no cover yet (never a gradient plate). */}
          <div className="relative overflow-hidden rounded-[clamp(1rem,2vw,1.5rem)] ring-1 ring-white/10">
            <div className="relative h-[clamp(20rem,54vh,38rem)]">
              <motion.img
                src={coverSrc}
                alt={c.coverUrl ? c.name : ""}
                aria-hidden={c.coverUrl ? undefined : true}
                loading="lazy"
                style={{ y }}
                className="absolute inset-0 h-[116%] w-full object-cover object-center saturate-[1.04] will-change-transform transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              />
              {/* Reading scrim — keeps the overlaid name legible on any photo. */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{ background: "linear-gradient(0deg, hsl(0 0% 3% / 0.94) 0%, hsl(0 0% 3% / 0.45) 42%, transparent 78%)" }}
              />

              <div className="absolute inset-0 flex items-end">
                <div className="w-full p-[clamp(1.5rem,4vw,3.5rem)]">
                  <div className="flex items-center gap-3 mb-4">
                    <StatusLine status={c.status} lang={lang} t={t} />
                    <span aria-hidden className="h-3 w-px bg-white/25" />
                    <span className="t-caption text-white/65 truncate">{c.programTitle}</span>
                  </div>

                  <motion.h3
                    className="font-display font-bold text-white max-w-[18ch]"
                    style={{ fontSize: "clamp(1.9rem,5vw,3.75rem)", lineHeight: 1.04, letterSpacing: "-0.03em" }}
                    initial={reduce ? false : { opacity: 0, y: 22 }}
                    whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
                  >
                    {c.name}
                  </motion.h3>

                  {c.summary && (
                    <p className="mt-4 max-w-2xl text-white/70 line-clamp-2" style={{ fontSize: "clamp(1rem,1.6vw,1.2rem)", lineHeight: 1.55 }}>
                      {c.summary}
                    </p>
                  )}

                  <span className="mt-6 inline-flex items-center gap-2 text-white font-semibold" style={{ fontSize: "clamp(0.95rem,1.4vw,1.1rem)" }}>
                    {t({ ar: "ادخل إلى الدّفعة", en: "Enter the cohort" })}
                    <ArrowLeft className="w-4 h-4 rotate-180 rtl:rotate-0 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Real DATA, as a calm meta rail beneath the block — cerulean for figures. */}
          {meta.length > 0 && (
            <dl className="mt-[clamp(1.5rem,3vw,2.25rem)] flex flex-wrap gap-x-[clamp(2.5rem,6vw,5rem)] gap-y-5">
              {meta.map((m) => (
                <div key={m.k}>
                  <dt className="t-caption text-fg-secondary mb-1.5">{m.k}</dt>
                  <dd className="font-display font-semibold" style={{ fontSize: "clamp(1.05rem,1.7vw,1.35rem)", letterSpacing: "-0.01em" }}>
                    {m.v}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Link>
      </motion.div>
    </section>
  );
}

/* ── THE ROSTER — every other cohort as a calm editorial hairline row:
   name / program · dates / venture count / status — separated by hairlines,
   never a deck of identical cards. Keeps the cohort-card-* testid + route. ── */
function CohortRoster({
  rows,
  total,
  graduated,
}: {
  rows: CohortRow[];
  total: number;
  graduated: number;
}) {
  const { lang, t } = useLanguage();
  const reduce = useReducedMotion();

  return (
    <section>
      <Reveal as="div" className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pb-[clamp(1.25rem,2.5vw,2rem)] border-b border-border-strong">
        <h2
          className="font-display font-bold text-foreground"
          style={{ fontSize: "clamp(1.9rem,4.4vw,3.25rem)", lineHeight: 1.04, letterSpacing: "-0.03em" }}
        >
          {t({ ar: "الأرشيف ", en: "The cohort " })}
          <span className="text-primary">{t({ ar: "الكامل", en: "archive" })}</span>
        </h2>
        <div className="flex flex-wrap items-baseline gap-x-7 gap-y-2">
          <span className="t-caption text-fg-secondary">
            <span className="tnum font-semibold text-sand">{num(total, lang)}</span>{" "}
            {t({ ar: "دفعات", en: "cohorts" })}
          </span>
          {graduated > 0 && (
            <span className="t-caption text-fg-secondary">
              <span className="tnum font-semibold text-sand">{num(graduated, lang)}</span>{" "}
              {t({ ar: "خُتِمت بـ Demo Day", en: "graduated" })}
            </span>
          )}
        </div>
      </Reveal>

      <ul>
        {rows.map((c, i) => (
          <li key={c.id}>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, delay: Math.min(i, 6) * 0.06, ease: EASE_OUT_EXPO }}
              className="will-change-transform"
            >
              <Link
                href={`/cohorts/${c.slug}`}
                data-testid={`cohort-card-${c.id}`}
                className="group grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-[clamp(1.5rem,3vw,3rem)] gap-y-3 py-[clamp(1.75rem,3.5vw,2.75rem)] border-b border-border-strong/60 transition-colors hover:border-border-strong"
              >
                <div className="min-w-0">
                  <h3
                    className="font-display font-bold text-foreground group-hover:text-primary transition-colors"
                    style={{ fontSize: "clamp(1.4rem,3vw,2.3rem)", letterSpacing: "-0.03em", lineHeight: 1.1 }}
                  >
                    {c.name}
                  </h3>
                  <p className="t-body text-[14.5px] md:text-[15.5px] mt-2 text-fg-secondary">
                    {c.programTitle}
                    {c.startsAt && (
                      <>
                        <span aria-hidden className="mx-2 text-fg-faint">·</span>
                        <span className="tnum">{fmtRange(c.startsAt, c.endsAt, lang)}</span>
                      </>
                    )}
                    <span aria-hidden className="mx-2 text-fg-faint">·</span>
                    <span className="tnum text-sand">{num(c.ventureCount, lang)}</span>{" "}
                    {t({
                      ar: c.ventureCount === 1 ? "مشروع" : "مشاريع",
                      en: c.ventureCount === 1 ? "venture" : "ventures",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-x-[clamp(1.25rem,2.5vw,2rem)] whitespace-nowrap justify-self-start md:justify-self-end">
                  <StatusLine status={c.status} lang={lang} t={t} />
                  <ArrowLeft className="w-4 h-4 text-fg-faint ltr:rotate-180 transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:text-primary rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
                </div>
              </Link>
            </motion.div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── APPLY RAIL — evergreen close, a calm monumental line (no aura blob, no
   card). A cohort is a door, here's the handle. ── */
function ApplyRail({ liveCount }: { liveCount: number }) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  return (
    <section>
      <motion.h2
        className="font-display text-foreground max-w-[16ch]"
        style={{ fontSize: "clamp(2.2rem,5.4vw,4.25rem)", lineHeight: 1.02, letterSpacing: "-0.04em", fontWeight: 700 }}
        initial={reduce ? false : { opacity: 0, y: 26 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
      >
        {liveCount > 0
          ? t({ ar: "هناك دفعةٌ ", en: "There's a cohort " })
          : t({ ar: "الدفعة القادمة ", en: "The next cohort " })}
        <span className="text-primary">
          {liveCount > 0 ? t({ ar: "تَنتظرك.", en: "waiting." }) : t({ ar: "قد تكون لك.", en: "could be yours." })}
        </span>
      </motion.h2>

      <Reveal as="p" delay={0.08} className="mt-[clamp(1.5rem,3vw,2.25rem)] max-w-2xl text-fg-secondary" >
        <span style={{ fontSize: "clamp(1.05rem,1.8vw,1.4rem)", lineHeight: 1.6 }}>
          {t({
            ar: "الاحتضان مجّانيّ بالكامل، مدعومٌ من NasToNas. قدّم مشروعك، أو احجز جلسة استكشافيّة مع فريقنا قبل أن تقرّر.",
            en: "Incubation is entirely free, backed by NasToNas. Apply with your venture, or book a discovery session with our team before you decide.",
          })}
        </span>
      </Reveal>

      <Reveal delay={0.14} className="mt-[clamp(2rem,4vw,3rem)] flex flex-wrap items-center gap-x-7 gap-y-4">
        <Link
          href="/apply?ref=cohorts"
          data-testid="cohorts-apply"
          className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
        >
          {t({ ar: "قدّم لدفعة", en: "Apply to a cohort" })}
          <ArrowLeft className="w-4 h-4 ltr:rotate-180 transition-transform rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
        </Link>
        <Link
          href="/book?ref=cohorts"
          className="group inline-flex items-center gap-2 text-[14px] font-semibold text-foreground/85 hover:text-foreground transition-colors"
        >
          {t({ ar: "احجز جلسة", en: "Book a session" })}
          <ArrowLeft className="w-4 h-4 rotate-180 rtl:rotate-0 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
        </Link>
      </Reveal>
    </section>
  );
}

/* ── EMPTY — evergreen, educational: the first cohorts are forming. Monumental
   line + the model taught as calm hairline rows (no 01/02/03 card ledger,
   no ambient-grid blob). Keeps the cohorts-empty-apply testid. ── */
function EmptyCohorts() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const steps = cohortModelSteps(t);

  return (
    <section>
      <header className="max-w-4xl">
        <h2
          className="font-display text-foreground"
          style={{ fontSize: "clamp(2.6rem, 7.4vw, 5.25rem)", lineHeight: "var(--lh-display)", letterSpacing: "-0.04em", fontWeight: 700 }}
        >
          {[
            t({ ar: "لم تَنطلق", en: "No cohort has" }),
            t({ ar: "أوّل دفعة بعد —", en: "launched yet —" }),
            <span key="accent" className="text-primary">{t({ ar: "كن في الأولى.", en: "be in the first." })}</span>,
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
          transition={{ duration: 0.85, delay: 0.4, ease: EASE_OUT_EXPO }}
          className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-2xl text-fg-secondary"
          style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
        >
          {t({
            ar: "الحاضنة وُلِدت في غزّة في قلب الحرب، وهدفها تأهيل ١٬٠٠٠ موهبة خلال ثلاث سنوات. نُجهّز الآن أوّل دفعةٍ من المؤسّسين — قدّم اليوم لتكون من صفّها الأوّل.",
            en: "Born in Gaza in the heart of the war, the incubator's goal is to ready 1,000 talents within three years. We're forming the very first cohort of founders now — apply today to be in its founding class.",
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
            href="/apply?ref=cohorts-empty"
            data-testid="cohorts-empty-apply"
            className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
          >
            {t({ ar: "قدّم للدفعة الأولى", en: "Apply to the first cohort" })}
            <ArrowLeft className="w-4 h-4 ltr:rotate-180 transition-transform rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
          </Link>
          <Link
            href="/programs"
            className="group inline-flex items-center gap-2 text-[14px] font-semibold text-foreground/85 hover:text-foreground transition-colors"
          >
            {t({ ar: "استكشف البرامج", en: "Explore the programs" })}
            <ArrowLeft className="w-4 h-4 rotate-180 rtl:rotate-0 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </header>

      {/* What a cohort will be — the model, taught while empty, as hairline rows. */}
      <ul className="mt-[clamp(3.5rem,7vw,6rem)] border-t border-border-strong/60">
        {steps.map((s, i) => (
          <li key={s.title}>
            <Reveal delay={Math.min(i, 6) * 0.06}>
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,18rem)_1fr] items-baseline gap-x-[clamp(1.5rem,3vw,3rem)] gap-y-2 py-[clamp(1.5rem,3vw,2.5rem)] border-b border-border-strong/60">
                <h3
                  className="font-display font-bold text-foreground"
                  style={{ fontSize: "clamp(1.3rem,2.6vw,1.9rem)", letterSpacing: "-0.025em", lineHeight: 1.1 }}
                >
                  {s.title}
                </h3>
                <p className="t-body text-[15px] md:text-[16px] max-w-2xl">{s.body}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── SKELETON — mirrors the loaded body (model line → tall featured block →
   hairline roster rows) so content does not reflow when data arrives. ── */
function SkeletonCohorts() {
  return (
    <div className="space-y-[clamp(5rem,11vw,9rem)]">
      {/* Model line + a few hairline rows */}
      <div>
        <div className="h-12 w-3/4 max-w-xl rounded-lg bg-surface-3 border border-border-strong animate-pulse" />
        <div className="mt-[clamp(3rem,6vw,5rem)] border-t border-border-strong/60">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 w-full border-b border-border-strong/60 flex items-center">
              <div className="h-8 w-1/2 rounded bg-surface-3 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Featured — tall full-bleed block at the real loaded height (not 16/9) */}
      <div>
        <div className="h-4 w-32 rounded bg-surface-3 animate-pulse mb-[clamp(1.25rem,2.5vw,2rem)]" />
        <div className="h-[clamp(20rem,54vh,38rem)] w-full rounded-[clamp(1rem,2vw,1.5rem)] bg-surface-3 border border-border-strong shadow-soft animate-pulse" />
      </div>

      {/* Roster — hairline rows under a section line */}
      <div>
        <div className="h-10 w-2/3 max-w-md rounded bg-surface-3 border border-border-strong animate-pulse pb-[clamp(1.25rem,2.5vw,2rem)]" />
        <div className="mt-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 w-full border-b border-border-strong/60 flex items-center">
              <div className="h-8 w-2/5 rounded bg-surface-3 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
