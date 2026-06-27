import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { CalendarDays, ArrowLeft, Layers, Users } from "lucide-react";
import { PageShell } from "@/components/shell/PageShell";
import { Reveal } from "@/components/landing/Reveal";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
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
// Compact range for chips/headers: "May — Aug 2026" without restating the year.
function fmtRange(a: string | null, b: string | null, lang: Lang): string {
  if (!a) return "";
  const opts: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" };
  const loc = lang === "ar" ? "ar-EG" : "en-GB";
  const start = new Date(a).toLocaleDateString(loc, { month: "short" });
  const end = b ? new Date(b).toLocaleDateString(loc, opts) : new Date(a).toLocaleDateString(loc, opts);
  return b ? `${start} — ${end}` : end;
}

/** Live pulse used on running/open cohorts (cerulean). */
function Dot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full rounded-full bg-sand/60 animate-ping" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-sand" />
    </span>
  );
}

function StatusChip({ status, lang, t }: { status: CohortStatus; lang: Lang; t: ReturnType<typeof useLanguage>["t"] }) {
  const live = isLive(status);
  const done = status === "completed";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.14em] uppercase font-semibold rtl:tracking-normal ${
        live
          ? "chip-sand"
          : done
            ? "bg-surface-3 text-muted-foreground border border-border"
            : "bg-primary/12 text-primary border border-primary/30"
      }`}
    >
      {live && <Dot />}
      {t({ ar: COHORT_STATUS_LABELS[status], en: COHORT_STATUS_LABELS_EN[status] })}
    </span>
  );
}

export default function Cohorts() {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<CohortRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

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
  // featured highlight; the rest fill the grid.
  const sorted = [...(rows ?? [])].sort(
    (a, b) => Number(isLive(b.status)) - Number(isLive(a.status)),
  );
  const featured = sorted.find((c) => isLive(c.status)) ?? sorted[0] ?? null;
  const grid = featured ? sorted.filter((c) => c.id !== featured.id) : sorted;
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
        <div className="space-y-[clamp(3.5rem,7vw,6rem)]">
          {/* THE MODEL — how a cohort runs, as a numbered editorial ledger */}
          <CohortModel />

          {/* FEATURED — the live (or most recent) cohort, given room */}
          {featured && <FeaturedCohort c={featured} liveCount={liveCount} />}

          {/* THE GRID — every other cohort, on one quiet card spec */}
          {grid.length > 0 && (
            <section>
              <Reveal as="div" className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 mb-[clamp(2rem,4vw,3rem)]">
                <div>
                  <div className="eyebrow mb-4">
                    {t({ ar: "كلّ الدّفعات", en: "Every cohort" })}
                  </div>
                  <h2
                    className="font-display font-extrabold text-foreground"
                    style={{ fontSize: "clamp(1.7rem, 3.4vw, 2.6rem)", lineHeight: 1.06, letterSpacing: "-0.026em" }}
                  >
                    {t({ ar: "الأرشيف ", en: "The cohort " })}
                    <span className="text-primary">{t({ ar: "الكامل", en: "archive" })}</span>
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Chip>
                    <span className="tnum font-semibold text-sand">{num(total, lang)}</span>{" "}
                    {t({ ar: "دفعات", en: "cohorts" })}
                  </Chip>
                  {graduated > 0 && (
                    <Chip>
                      <span className="tnum font-semibold text-sand">{num(graduated, lang)}</span>{" "}
                      {t({ ar: "خُتِمت بـ Demo Day", en: "graduated" })}
                    </Chip>
                  )}
                </div>
              </Reveal>

              <motion.div
                variants={reduce ? undefined : stagger}
                initial={reduce ? undefined : "hidden"}
                whileInView={reduce ? undefined : "show"}
                viewport={{ once: true, margin: "-8% 0px" }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {grid.map((c) => (
                  <CohortCard key={c.id} c={c} reduce={!!reduce} />
                ))}
              </motion.div>
            </section>
          )}

          {/* Always-on apply rail — a cohort is a door, this is the handle */}
          <ApplyRail liveCount={liveCount} />
        </div>
      )}
    </PageShell>
  );
}

/* ── THE MODEL — three movements of a cohort, as a hairline-divided ledger ── */
function CohortModel() {
  const { lang, t } = useLanguage();
  const idx = (i: number) => (lang === "ar" ? ["٠١", "٠٢", "٠٣"][i] : String(i + 1).padStart(2, "0"));

  const steps = [
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

  return (
    <section>
      <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5rem)] gap-y-10 items-start">
        <Reveal as="div" className="lg:col-span-5 lg:sticky lg:top-28">
          <div className="eyebrow mb-5">
            {t({ ar: "كيف تَعمل الدّفعة", en: "How a cohort works" })}
          </div>
          <h2
            className="font-display font-extrabold text-foreground"
            style={{ fontSize: "clamp(1.9rem, 4vw, 3.2rem)", lineHeight: 1.05, letterSpacing: "-0.026em" }}
          >
            {t({ ar: "ثلاث حركات، ", en: "Three movements, " })}
            <span className="text-primary">{t({ ar: "صفٌّ واحد.", en: "one class." })}</span>
          </h2>
          <p className="t-body mt-5 max-w-md">
            {t({
              ar: "النموذج الذي يَجعل دفعةً من غزّة تَبني أسرع: قبولٌ جماعيّ، بناءٌ متزامن، وخطٌّ نهايةٌ واحد يَجمع الجميع.",
              en: "The model that makes a Gaza cohort build faster: a shared start, synchronized building, and one finish line that gathers everyone.",
            })}
          </p>
        </Reveal>

        <div className="lg:col-span-7">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.05}>
              <div className="grid grid-cols-[auto_1fr] gap-x-6 sm:gap-x-9 items-baseline border-t border-border-strong py-7 sm:py-9 first:border-t-0 first:pt-0">
                <span className="font-display text-[clamp(1.5rem,2.4vw,2.1rem)] font-bold tabular-nums text-fg-faint leading-none">
                  {idx(i)}
                </span>
                <div>
                  <h3
                    className="font-display font-bold text-foreground"
                    style={{ fontSize: "clamp(1.25rem, 2.2vw, 1.75rem)", letterSpacing: "-0.018em", lineHeight: 1.15 }}
                  >
                    {s.title}
                  </h3>
                  <p className="t-body mt-2.5 max-w-xl">{s.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FEATURED — the live (or latest) cohort, with photo + meta rail ── */
function FeaturedCohort({ c, liveCount }: { c: CohortRow; liveCount: number }) {
  const { lang, t } = useLanguage();
  const live = isLive(c.status);
  return (
    <section>
      <Reveal as="div" className="flex items-center gap-3 mb-6">
        <span aria-hidden className="h-px w-9 bg-primary/50" />
        <span className="eyebrow">
          {live
            ? liveCount > 1
              ? t({ ar: "دفعة جارية الآن", en: "Live cohort" })
              : t({ ar: "الدّفعة الجارية", en: "The current cohort" })
            : t({ ar: "أحدث دفعة", en: "Latest cohort" })}
        </span>
      </Reveal>

      <Reveal as="div" delay={0.05}>
        <Link
          href={`/cohorts/${c.slug}`}
          className="card-base card-hover group block overflow-hidden"
          data-testid={`cohort-card-${c.id}`}
        >
          <div className="grid md:grid-cols-2">
            {/* Visual — real cover, or a crafted crimson plate (never a faint glyph) */}
            <div className="relative md:order-2 aspect-[16/10] md:aspect-auto md:min-h-[320px] overflow-hidden">
              {c.coverUrl ? (
                <img
                  src={c.coverUrl}
                  alt={c.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover saturate-[1.04] transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "radial-gradient(130% 110% at 70% 0%, hsl(var(--primary) / 0.28) 0%, hsl(var(--surface-3)) 70%)" }}
                >
                  <div
                    className="flex h-[96px] w-[96px] items-center justify-center rounded-2xl text-white ring-2 ring-white/15 shadow-soft transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                    style={{ background: "linear-gradient(140deg, hsl(var(--primary)) 0%, hsl(var(--primary-pressed)) 100%)" }}
                  >
                    <Layers className="w-11 h-11" strokeWidth={1.6} />
                  </div>
                </div>
              )}
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l rtl:md:bg-gradient-to-r from-[#0A0E1A]/70 via-transparent to-transparent" />
            </div>

            {/* Editorial body */}
            <div className="md:order-1 p-7 sm:p-9 flex flex-col">
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <StatusChip status={c.status} lang={lang} t={t} />
                <span className="text-[10.5px] tracking-[0.14em] uppercase text-muted-foreground font-semibold rtl:tracking-normal">
                  · {c.programTitle}
                </span>
              </div>
              <h3
                className="font-display font-extrabold text-foreground"
                style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", lineHeight: 1.08, letterSpacing: "-0.024em" }}
              >
                {c.name}
              </h3>
              {c.summary && (
                <p className="t-body mt-4 max-w-prose line-clamp-3">{c.summary}</p>
              )}

              <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border-strong pt-6">
                {(c.startsAt || c.endsAt) && (
                  <div>
                    <dt className="text-[10.5px] tracking-[0.16em] uppercase text-muted-foreground font-semibold rtl:tracking-normal mb-1.5">
                      {t({ ar: "المدّة", en: "Runs" })}
                    </dt>
                    <dd className="text-[14px] font-semibold text-fg-secondary tnum">
                      {fmtRange(c.startsAt, c.endsAt, lang)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-[10.5px] tracking-[0.16em] uppercase text-muted-foreground font-semibold rtl:tracking-normal mb-1.5">
                    {t({ ar: "المشاريع", en: "Ventures" })}
                  </dt>
                  <dd className="text-[14px] font-semibold text-fg-secondary">
                    <span className="tnum text-sand">{num(c.ventureCount, lang)}</span>{" "}
                    {t({ ar: c.ventureCount === 1 ? "مشروع" : "في الدّفعة", en: "in the class" })}
                  </dd>
                </div>
                {c.demoDayAt && (
                  <div className="col-span-2">
                    <dt className="text-[10.5px] tracking-[0.16em] uppercase text-muted-foreground font-semibold rtl:tracking-normal mb-1.5">
                      {t({ ar: "يوم العرض", en: "Demo Day" })}
                    </dt>
                    <dd className="text-[14px] font-semibold text-sand-bright tnum">
                      {fmtDate(c.demoDayAt, lang)}
                    </dd>
                  </div>
                )}
              </dl>

              <span className="mt-7 inline-flex items-center gap-2 text-[13.5px] font-semibold text-primary self-start group-hover:gap-3 transition-all">
                {t({ ar: "ادخل إلى الدّفعة", en: "Enter the cohort" })}
                <ArrowLeft className="w-4 h-4 rotate-180 rtl:rotate-0 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </Link>
      </Reveal>
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[12.5px] font-medium text-fg-secondary bg-surface-2 border border-border-strong shadow-soft">
      {children}
    </span>
  );
}

/* ── GRID CARD — one quiet card-base spec, status / dates / venture count ── */
function CohortCard({ c, reduce }: { c: CohortRow; reduce: boolean }) {
  const { lang, t } = useLanguage();
  return (
    <motion.div
      variants={reduce ? undefined : rise}
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="h-full"
    >
      <Link
        href={`/cohorts/${c.slug}`}
        className="card-base card-hover group flex flex-col h-full overflow-hidden"
        data-testid={`cohort-card-${c.id}`}
      >
        {c.coverUrl ? (
          <div className="aspect-[16/9] overflow-hidden bg-surface-3">
            <img
              src={c.coverUrl}
              alt={c.name}
              className="w-full h-full object-cover saturate-[1.03] transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
              loading="lazy"
            />
          </div>
        ) : (
          <div
            className="aspect-[16/9] flex items-center justify-center"
            style={{ background: "radial-gradient(130% 120% at 70% 0%, hsl(var(--primary) / 0.22) 0%, hsl(var(--surface-3)) 70%)" }}
          >
            <div
              className="flex h-[60px] w-[60px] items-center justify-center rounded-xl text-white ring-2 ring-white/15 shadow-soft transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
              style={{ background: "linear-gradient(140deg, hsl(var(--primary)) 0%, hsl(var(--primary-pressed)) 100%)" }}
            >
              <Layers className="w-7 h-7" strokeWidth={1.7} />
            </div>
          </div>
        )}

        <div className="relative p-6 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <StatusChip status={c.status} lang={lang} t={t} />
            <span className="text-[10.5px] tracking-[0.14em] uppercase text-muted-foreground font-semibold rtl:tracking-normal truncate">
              · {c.programTitle}
            </span>
          </div>

          <h3 className="font-display font-bold text-foreground text-[18px] leading-snug mb-2 group-hover:text-primary transition-colors">
            {c.name}
          </h3>
          {c.summary && (
            <p className="t-body text-[13.5px] line-clamp-2 mb-4">{c.summary}</p>
          )}

          <div className="mt-auto space-y-1.5 text-[12.5px] text-muted-foreground pt-3 border-t border-border">
            {c.startsAt && (
              <div className="flex items-center gap-2">
                <CalendarDays className="w-3.5 h-3.5 text-sand/80 shrink-0" />
                <span className="tnum">{fmtRange(c.startsAt, c.endsAt, lang)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-sand/80 shrink-0" />
              <span>
                <span className="tnum text-sand">{num(c.ventureCount, lang)}</span>{" "}
                {t({
                  ar: c.ventureCount === 1 ? "مشروع" : "مشاريع في الدّفعة",
                  en: c.ventureCount === 1 ? "venture" : "ventures",
                })}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[12.5px] text-primary font-semibold">
            <span>{t({ ar: "تفاصيل الدّفعة", en: "Cohort details" })}</span>
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── APPLY RAIL — evergreen close; a cohort is a door, here's the handle ── */
function ApplyRail({ liveCount }: { liveCount: number }) {
  const { t } = useLanguage();
  return (
    <Reveal as="section">
      <div className="card-base relative overflow-hidden p-8 sm:p-11">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 brand-aura opacity-40" />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
          <div className="max-w-2xl">
            <h2
              className="font-display font-extrabold text-foreground"
              style={{ fontSize: "clamp(1.6rem, 3.2vw, 2.5rem)", lineHeight: 1.07, letterSpacing: "-0.026em" }}
            >
              {liveCount > 0
                ? t({ ar: "هناك دفعةٌ ", en: "There's a cohort " })
                : t({ ar: "الدفعة القادمة ", en: "The next cohort " })}
              <span className="text-primary">
                {liveCount > 0 ? t({ ar: "تَنتظرك.", en: "waiting." }) : t({ ar: "قد تكون لك.", en: "could be yours." })}
              </span>
            </h2>
            <p className="t-body mt-4">
              {t({
                ar: "الاحتضان مجّانيّ بالكامل، مدعومٌ من NasToNas. قدّم مشروعك، أو احجز جلسة استكشافيّة مع فريقنا قبل أن تقرّر.",
                en: "Incubation is entirely free, backed by NasToNas. Apply with your venture, or book a discovery session with our team before you decide.",
              })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 lg:ms-auto shrink-0">
            <Link
              href="/apply?ref=cohorts"
              data-testid="cohorts-apply"
              className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
            >
              {t({ ar: "قدّم لدفعة", en: "Apply to a cohort" })}
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            </Link>
            <Link
              href="/book?ref=cohorts"
              className="group inline-flex items-center gap-2 text-[14px] font-semibold text-primary"
            >
              {t({ ar: "احجز جلسة", en: "Book a session" })}
              <ArrowLeft className="w-4 h-4 rotate-180 rtl:rotate-0 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ── EMPTY — evergreen, educational: the first cohorts are forming ── */
function EmptyCohorts() {
  const { t } = useLanguage();
  const steps = [
    {
      k: t({ ar: "٠١", en: "01" }),
      title: t({ ar: "نَفتح التقديم", en: "Applications open" }),
      body: t({
        ar: "نَختار مجموعةً صغيرة من المؤسّسين لينطلقوا معًا كأوّل دفعة.",
        en: "We select a small class of founders to start together as the first cohort.",
      }),
    },
    {
      k: t({ ar: "٠٢", en: "02" }),
      title: t({ ar: "نَبني معًا", en: "Build together" }),
      body: t({
        ar: "إرشاد، موارد، ومحطّات أسبوعيّة — رحلةٌ محدّدة بزمن من القبول إلى الإطلاق.",
        en: "Mentorship, resources and weekly milestones — a time-boxed journey from acceptance to launch.",
      }),
    },
    {
      k: t({ ar: "٠٣", en: "03" }),
      title: t({ ar: "Demo Day", en: "Demo Day" }),
      body: t({
        ar: "تَختم الدّفعة بيوم عرضٍ أمام شبكةٍ من الدّاعمين والشّركاء.",
        en: "The cohort closes with a Demo Day before a network of supporters and partners.",
      }),
    },
  ];

  return (
    <section className="relative">
      <div aria-hidden className="ambient-grid absolute inset-0 -z-10" />
      <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5rem)] gap-y-12 items-center">
        <Reveal as="div" className="lg:col-span-7">
          <div className="flex items-center gap-3 mb-5">
            <span aria-hidden className="h-px w-9 bg-primary/50" />
            <span className="eyebrow">{t({ ar: "أوّل دفعة تَتشكّل", en: "The first cohort is forming" })}</span>
          </div>
          <h2
            className="font-display font-extrabold text-foreground"
            style={{ fontSize: "clamp(2rem, 4.4vw, 3.4rem)", lineHeight: 1.05, letterSpacing: "-0.028em" }}
          >
            {t({ ar: "لم تَنطلق أوّل دفعة بعد — ", en: "No cohort has launched yet — " })}
            <span className="text-primary">{t({ ar: "كن في الأولى.", en: "be in the first." })}</span>
          </h2>
          <p className="t-body-lg mt-6 max-w-xl">
            {t({
              ar: "الحاضنة وُلِدت في غزّة في قلب الحرب، وهدفها تأهيل ١٬٠٠٠ موهبة خلال ثلاث سنوات. نُجهّز الآن أوّل دفعةٍ من المؤسّسين — قدّم اليوم لتكون من صفّها الأوّل.",
              en: "Born in Gaza in the heart of the war, the incubator's goal is to ready 1,000 talents within three years. We're forming the very first cohort of founders now — apply today to be in its founding class.",
            })}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/apply?ref=cohorts-empty"
              data-testid="cohorts-empty-apply"
              className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
            >
              {t({ ar: "قدّم للدفعة الأولى", en: "Apply to the first cohort" })}
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            </Link>
            <Link
              href="/programs"
              className="group inline-flex items-center gap-2 text-[14px] font-semibold text-primary"
            >
              {t({ ar: "استكشف البرامج", en: "Explore the programs" })}
              <ArrowLeft className="w-4 h-4 rotate-180 rtl:rotate-0 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        {/* What a cohort will be — the model, taught while empty */}
        <Reveal as="div" delay={0.1} className="lg:col-span-5">
          <div className="card-base p-7 sm:p-8">
            <div className="text-[10.5px] tracking-[0.18em] uppercase text-muted-foreground font-semibold rtl:tracking-normal mb-6">
              {t({ ar: "ما الدّفعة؟", en: "What a cohort is" })}
            </div>
            <ol className="space-y-6">
              {steps.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[auto_1fr] gap-x-5 items-baseline border-t border-border pt-6 first:border-t-0 first:pt-0">
                  <span className="font-display text-[clamp(1.2rem,2vw,1.6rem)] font-bold tabular-nums text-sand leading-none">
                    {s.k}
                  </span>
                  <div>
                    <div className="font-display font-bold text-foreground text-[16px]">{s.title}</div>
                    <p className="t-body text-[13px] mt-1.5">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function SkeletonCohorts() {
  return (
    <div className="space-y-12">
      <div className="grid lg:grid-cols-12 gap-x-12 gap-y-8">
        <div className="lg:col-span-5 space-y-4">
          <div className="h-7 w-44 rounded-lg bg-surface-3 border border-border-strong animate-pulse" />
          <div className="h-16 w-full rounded-lg bg-surface-3 border border-border-strong animate-pulse" />
        </div>
        <div className="lg:col-span-7 space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 w-full rounded-lg bg-surface-3 border border-border-strong animate-pulse" />
          ))}
        </div>
      </div>
      <div className="rounded-[24px] h-72 bg-surface-3 border border-border-strong shadow-soft animate-pulse" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-[24px] h-72 bg-surface-3 border border-border-strong shadow-soft animate-pulse" />
        ))}
      </div>
    </div>
  );
}
