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
import { api, ApiError } from "@/lib/api";
import {
  COHORT_STATUS_LABELS,
  COHORT_VENTURE_STATUS_LABELS,
  formatArabicDate,
  type CohortStatus,
  type CohortVentureStatus,
} from "@/lib/labels";

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
  const [, params] = useRoute("/cohorts/:slug");
  const slug = params?.slug;
  const [data, setData] = useState<{
    cohort: Cohort;
    program: Program;
    ventures: VentureRow[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    api<{ cohort: Cohort; program: Program; ventures: VentureRow[] }>(
      `/cohorts/${slug}`,
    )
      .then((r) => !cancelled && setData(r))
      .catch(
        (e) =>
          !cancelled &&
          setError(e instanceof ApiError ? e.message : "تعذّر التحميل"),
      );
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (data?.cohort?.name) {
      document.title = `${data.cohort.name} — دفعات آيلاند`;
    }
  }, [data?.cohort?.name]);

  if (error && !data) {
    return (
      <PageShell>
        <BackLink href="/cohorts" label="عودة للدّفعات" />
        <GlassCard className="p-8 text-center text-red-200">{error}</GlassCard>
      </PageShell>
    );
  }
  if (!data) {
    return (
      <PageShell>
        <div className="h-96 rounded-[28px] bg-white/[0.035] border border-white/10 animate-pulse" />
      </PageShell>
    );
  }

  const c = data.cohort;
  const isLive = c.status === "in_progress" || c.status === "demo_day";

  return (
    <PageShell>
      <BackLink href="/cohorts" label="كلّ الدّفعات" />

      <GlassCard className="overflow-hidden">
        <div className="relative h-48 sm:h-64">
          {c.coverUrl ? (
            <img
              src={c.coverUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent flex items-center justify-center">
              <Layers className="w-20 h-20 text-primary/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A] via-[#0A0E1A]/40 to-transparent" />
          <div className="absolute bottom-4 left-4 sm:left-6 right-4 sm:right-6">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.14em] uppercase font-bold border backdrop-blur-md ${
                  isLive
                    ? "bg-emerald-500/20 text-emerald-100 border-emerald-500/40"
                    : c.status === "completed"
                      ? "bg-white/10 text-white/65 border-white/15"
                      : "bg-primary/20 text-white border-primary/40"
                }`}
              >
                {COHORT_STATUS_LABELS[c.status]}
              </span>
              <Link
                href={`/programs/${data.program.id}`}
                className="text-[11px] tracking-[0.14em] uppercase text-white/75 font-semibold hover:text-primary transition-colors"
              >
                · {data.program.title}
              </Link>
            </div>
            <h1
              className="font-bold text-white leading-tight"
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
            <div className="text-white/75 text-[14.5px] leading-[1.95] whitespace-pre-wrap mb-6">
              {c.description}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {c.startsAt && (
              <Fact icon={CalendarDays} label="البداية" value={formatArabicDate(c.startsAt)} />
            )}
            {c.endsAt && (
              <Fact icon={CalendarDays} label="النهاية" value={formatArabicDate(c.endsAt)} />
            )}
            {c.demoDayAt && (
              <Fact icon={Sparkles} label="يوم العرض" value={formatArabicDate(c.demoDayAt)} />
            )}
            <Fact icon={Users} label="عدد المشاريع" value={String(data.ventures.length)} />
          </div>

          {c.demoDayUrl && (
            <a
              href={c.demoDayUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 mt-6 px-5 py-3 rounded-2xl bg-primary text-white font-bold text-[14px] hover:-translate-y-px transition-transform"
            >
              <Sparkles className="w-4 h-4" />
              صفحة يوم العرض
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {c.demoDayLocation && !c.demoDayUrl && (
            <div className="mt-6 inline-flex items-center gap-2 text-[13.5px] text-white/70">
              <MapPin className="w-4 h-4 text-primary" />
              {c.demoDayLocation}
            </div>
          )}
        </div>
      </GlassCard>

      <div className="mt-10">
        <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-4">
          مشاريع الدّفعة
        </div>
        {data.ventures.length === 0 ? (
          <GlassCard className="p-8 text-center text-white/55">
            لم يلتحق أيّ مشروع بالدّفعة بعد.
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
    </PageShell>
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
    <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/[0.08]">
      <Icon className="w-4 h-4 text-primary mb-2" />
      <div className="text-white/40 text-[10.5px] tracking-wide mb-0.5">{label}</div>
      <div className="text-white font-semibold text-[13px] leading-snug">{value}</div>
    </div>
  );
}

function VentureMini({ row }: { row: VentureRow }) {
  const v = row.venture;
  return (
    <Link
      href={`/ventures/${v.id}`}
      className="group block h-full"
    >
      <GlassCard className="h-full flex flex-col p-5 hover:border-primary/40 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          {v.logoUrl ? (
            <img src={v.logoUrl} alt="" className="w-11 h-11 rounded-xl object-cover" />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/70 font-bold">
              {v.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-white font-bold text-[15px] truncate">{v.name}</div>
            <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/60 border border-white/10">
              {COHORT_VENTURE_STATUS_LABELS[row.membership.status]}
            </span>
          </div>
        </div>
        {v.tagline && (
          <p className="text-white/55 text-[12.5px] leading-[1.7] line-clamp-2 mb-3 flex-1">
            {v.tagline}
          </p>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-[11.5px] text-white/45">
          {v.sector && <span>{v.sector}</span>}
          <ArrowLeft className="w-3.5 h-3.5 group-hover:text-primary group-hover:-translate-x-1 transition-all rtl:rotate-180" />
        </div>
      </GlassCard>
    </Link>
  );
}
