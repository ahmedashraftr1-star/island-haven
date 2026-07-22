import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Sparkles,
  MapPin,
  ExternalLink,
  Layers,
  Users,
} from "lucide-react";
import { PageShell, GlassCard, BackLink } from "@/components/shell/PageShell";
import { DetailError } from "@/components/shell/DetailError";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { usePageMeta } from "@/hooks/use-meta";
import {
  COHORT_STATUS_LABELS,
  COHORT_VENTURE_STATUS_LABELS,
  formatArabicDate,
  type CohortStatus,
  type CohortVentureStatus,
} from "@/lib/labels";

const COHORT_STATUS_LABELS_EN: Record<CohortStatus, string> = {
  announced: "Announced",
  open: "Applications open",
  in_progress: "In progress",
  demo_day: "Demo Day",
  completed: "Completed",
};

const COHORT_VENTURE_STATUS_LABELS_EN: Record<CohortVentureStatus, string> = {
  active: "Active",
  graduated: "Graduated",
  paused: "Paused",
  dropped: "Dropped",
};

// Localised date: Arabic-Indic month/day in AR, Western in EN.
function fmtDate(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return "";
  return lang === "ar"
    ? formatArabicDate(iso)
    : new Date(iso).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
}

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}

interface Cohort {
  id: number;
  name: string;
  slug: string;
  summary: string;
  description: string;
  coverUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  demoDayAt: string | null;
  demoDayLocation: string;
  demoDayUrl: string;
  status: CohortStatus;
}

interface Program {
  id: number;
  title: string;
  summary: string;
}

interface VentureRow {
  membership: {
    status: CohortVentureStatus;
    joinedAt: string;
    notes: string;
  };
  venture: {
    id: number;
    name: string;
    tagline: string;
    description: string;
    logoUrl: string | null;
    websiteUrl: string;
    sector: string;
    stage: string;
    foundedYear: number;
    teamSize: number;
    featured: boolean;
  };
}

export default function CohortDetail() {
  const { lang, t } = useLanguage();
  const [, params] = useRoute("/cohorts/:slug");
  const slug = params?.slug;
  const [data, setData] = useState<{
    cohort: Cohort;
    program: Program;
    ventures: VentureRow[];
  } | null>(null);
  // null = no error; otherwise the ApiError.status (0 for a network error).
  const [errStatus, setErrStatus] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setErrStatus(null);
    api<{ cohort: Cohort; program: Program; ventures: VentureRow[] }>(
      `/cohorts/${slug}`,
    )
      .then((r) => !cancelled && setData(r))
      .catch((e) => !cancelled && setErrStatus(e instanceof ApiError ? e.status : 0));
    return () => {
      cancelled = true;
    };
  }, [slug, lang, reloadKey]);

  usePageMeta({
    title: data?.cohort?.name,
    description: data?.cohort?.summary,
    image: data?.cohort?.coverUrl ?? undefined,
    type: "article",
  });

  if (errStatus !== null && !data) {
    return (
      <PageShell>
        <DetailError
          status={errStatus}
          onRetry={reload}
          backHref="/cohorts"
          backLabel={t({ ar: "عودة للدّفعات", en: "Back to cohorts" })}
        />
      </PageShell>
    );
  }
  if (!data) {
    return (
      <PageShell>
        <div className="h-96 rounded-[28px] bg-white/[0.035] border border-border-strong animate-pulse" />
      </PageShell>
    );
  }

  const c = data.cohort;
  const isLive = c.status === "in_progress" || c.status === "demo_day";

  return (
    <PageShell>
      <BackLink
        href="/cohorts"
        label={t({ ar: "كلّ الدّفعات", en: "All cohorts" })}
      />

      <GlassCard className="overflow-hidden">
        <div className="relative h-48 sm:h-64">
          {c.coverUrl ? (
            <img loading="lazy" decoding="async"
              src={c.coverUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent flex items-center justify-center">
              <Layers className="w-20 h-20 text-primary/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
          <div className="absolute bottom-4 left-4 sm:left-6 right-4 sm:right-6">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.14em] uppercase font-bold border backdrop-blur-md ${
                  isLive
                    ? "bg-emerald-500/20 text-emerald-100 border-emerald-500/40"
                    : c.status === "completed"
                      ? "bg-surface-2 text-fg-secondary border-border-strong"
                      : "bg-primary/20 text-foreground border-primary/40"
                }`}
              >
                {t({
                  ar: COHORT_STATUS_LABELS[c.status],
                  en: COHORT_STATUS_LABELS_EN[c.status],
                })}
              </span>
              <Link
                href={`/programs/${data.program.id}`}
                className="text-[11px] tracking-[0.14em] uppercase text-fg-secondary font-semibold hover:text-primary transition-colors"
              >
                · {data.program.title}
              </Link>
            </div>
            <h1
              className="font-bold text-foreground leading-tight"
              style={{ fontSize: "clamp(1.7rem, 4vw, 2.5rem)" }}
            >
              {c.name}
            </h1>
          </div>
        </div>

        <div className="px-6 sm:px-9 py-7">
          {c.summary && (
            <p className="text-primary/90 text-[15.5px] font-medium leading-[1.75] mb-5">
              {c.summary}
            </p>
          )}
          {c.description && (
            <div className="text-fg-secondary text-[14.5px] leading-[1.95] whitespace-pre-wrap mb-6">
              {c.description}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {c.startsAt && (
              <Fact
                icon={CalendarDays}
                label={t({ ar: "البداية", en: "Starts" })}
                value={fmtDate(c.startsAt, lang)}
              />
            )}
            {c.endsAt && (
              <Fact
                icon={CalendarDays}
                label={t({ ar: "النهاية", en: "Ends" })}
                value={fmtDate(c.endsAt, lang)}
              />
            )}
            {c.demoDayAt && (
              <Fact
                icon={Sparkles}
                label={t({ ar: "يوم العرض", en: "Demo Day" })}
                value={fmtDate(c.demoDayAt, lang)}
              />
            )}
            <Fact
              icon={Users}
              label={t({ ar: "عدد المشاريع", en: "Ventures" })}
              value={num(data.ventures.length, lang)}
            />
          </div>

          {c.demoDayAt && (
            <Link
              href={`/cohorts/${c.slug}/demo-day`}
              className="inline-flex items-center gap-2 mt-6 me-3 px-5 py-3 rounded-2xl bg-primary-cta text-white font-bold text-[14px] hover:-translate-y-px transition-transform"
            >
              <Sparkles className="w-4 h-4" />
              {t({ ar: "صفحة يوم العرض", en: "Demo Day page" })}
            </Link>
          )}

          {c.demoDayUrl && (
            <a
              href={c.demoDayUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 mt-6 px-5 py-3 rounded-2xl bg-surface-2 border border-border-strong text-foreground font-bold text-[14px] hover:bg-white/[0.1] transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-primary" />
              {t({ ar: "البثّ المباشر", en: "Live stream" })}
            </a>
          )}

          {c.demoDayLocation && !c.demoDayUrl && (
            <div className="mt-6 inline-flex items-center gap-2 text-[13.5px] text-fg-secondary">
              <MapPin className="w-4 h-4 text-primary" />
              {c.demoDayLocation}
            </div>
          )}
        </div>
      </GlassCard>

      <div className="mt-10">
        <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-4">
          {t({ ar: "مشاريع الدّفعة", en: "Cohort ventures" })}
        </div>
        {data.ventures.length === 0 ? (
          <GlassCard className="p-8 text-center text-muted-foreground">
            {t({
              ar: "لم يلتحق أيّ مشروع بالدّفعة بعد.",
              en: "No venture has joined this cohort yet.",
            })}
          </GlassCard>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.ventures.map((row, i) => (
              <motion.div
                key={row.venture.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
              >
                <VentureMini row={row} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <CohortJourney slug={c.slug} />
    </PageShell>
  );
}

// ─── Cohort journey: weekly curriculum + progress updates ─────────────────────

interface Week {
  id: number;
  weekNumber: number;
  title: string;
  theme: string;
}
interface Update {
  id: number;
  title: string;
  body: string;
  weekNumber: number | null;
  postedAt: string;
}

function CohortJourney({ slug }: { slug: string }) {
  const { lang, t } = useLanguage();
  const [weeks, setWeeks] = useState<Week[] | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);

  useEffect(() => {
    api<{ weeks: Week[]; updates: Update[] }>(`/cohorts/${slug}/journey`)
      .then((r) => {
        setWeeks(r.weeks);
        setUpdates(r.updates);
      })
      .catch(() => setWeeks([]));
  }, [slug]);

  if (!weeks || (weeks.length === 0 && updates.length === 0)) return null;

  return (
    <div className="mt-10">
      <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-5">
        {t({ ar: "رحلة الدفعة", en: "Cohort journey" })}
      </div>

      {weeks.length > 0 && (
        <div className="relative mb-8">
          <div className="absolute top-0 bottom-0 right-[7px] w-px bg-surface-2" />
          <div className="space-y-4">
            {weeks.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.04 }}
                className="relative ps-7"
              >
                <span className="absolute right-0 top-1.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-[#0a0a0a]" />
                <div className="rounded-2xl p-4 bg-surface-2 border border-border-strong">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                      {t({ ar: "الأسبوع", en: "Week" })} {num(w.weekNumber, lang)}
                    </span>
                    <h3 className="text-foreground font-bold text-[14.5px]">{w.title}</h3>
                  </div>
                  {w.theme && (
                    <p className="text-muted-foreground text-[12.5px] leading-[1.7]">
                      {w.theme}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {updates.length > 0 && (
        <div>
          <h3 className="text-foreground font-bold text-[15px] mb-3">
            {t({ ar: "آخر التحديثات", en: "Latest updates" })}
          </h3>
          <div className="space-y-2.5">
            {updates.map((u) => (
              <div
                key={u.id}
                className="rounded-2xl px-4 py-3 bg-surface-2 border border-border-strong"
              >
                <div className="flex items-center gap-2 mb-1">
                  {u.weekNumber !== null && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-2 text-muted-foreground">
                      {t({ ar: "أسبوع", en: "Week" })} {num(u.weekNumber, lang)}
                    </span>
                  )}
                  <span className="text-foreground font-semibold text-[13.5px]">
                    {u.title}
                  </span>
                  <span className="text-muted-foreground text-[11px] ms-auto">
                    {fmtDate(u.postedAt, lang)}
                  </span>
                </div>
                {u.body && (
                  <p className="text-muted-foreground text-[12.5px] leading-[1.75]">
                    {u.body}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl p-4 bg-surface-2 border border-border-strong">
      <Icon className="w-4 h-4 text-primary mb-2" />
      <div className="text-muted-foreground text-[10.5px] tracking-wide mb-0.5">{label}</div>
      <div className="text-foreground font-semibold text-[13px] leading-snug">{value}</div>
    </div>
  );
}

function VentureMini({ row }: { row: VentureRow }) {
  const { t } = useLanguage();
  const v = row.venture;
  return (
    <Link
      href={`/ventures/${v.id}`}
      className="group block h-full"
    >
      <GlassCard className="h-full flex flex-col p-5 hover:border-primary/40 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          {v.logoUrl ? (
            <img loading="lazy" decoding="async" src={v.logoUrl} alt="" className="w-11 h-11 rounded-xl object-cover" />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-surface-2 border border-border-strong flex items-center justify-center text-fg-secondary font-bold">
              {v.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-foreground font-bold text-[15px] truncate">{v.name}</div>
            <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-surface-2 text-muted-foreground border border-border-strong">
              {t({
                ar: COHORT_VENTURE_STATUS_LABELS[row.membership.status],
                en: COHORT_VENTURE_STATUS_LABELS_EN[row.membership.status],
              })}
            </span>
          </div>
        </div>
        {v.tagline && (
          <p className="text-muted-foreground text-[12.5px] leading-[1.7] line-clamp-2 mb-3 flex-1">
            {v.tagline}
          </p>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-border-strong text-[11.5px] text-fg-faint">
          {v.sector && <span>{v.sector}</span>}
          <ArrowLeft className="w-3.5 h-3.5 group-hover:text-primary group-hover:-translate-x-1 transition-all rtl:rotate-180" />
        </div>
      </GlassCard>
    </Link>
  );
}
