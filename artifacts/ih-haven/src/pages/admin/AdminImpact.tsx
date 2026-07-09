import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { TrendingUp, Briefcase, Banknote, HeartPulse, Users2, Plus, X, Download } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { AdminButton, StatusBadge, EmptyState } from "./ui";
import { downloadCsv } from "./csvDownload";

// Monitoring & Evaluation (Impact) — the outcome layer. Executive KPIs + funnel +
// trend, and a per-venture table to record longitudinal outcome snapshots.

interface Overview {
  funnel: { applications: number; accepted: number; cohorts: number; ventures: number; tracked: number };
  totals: { jobs: number; fundingUsd: number; revenueUsd: number; surviving: number; survivalRate: number };
  trend: { period: string; jobs: number; fundingUsd: number; revenueUsd: number }[];
}
interface VentureRow {
  id: number;
  name: string;
  sector: string;
  stage: string;
  latest: { status: string; jobs: number; fundingUsd: number; revenueUsd: number; period: string; recordedAt: string } | null;
}

const STATUS_TONE: Record<string, "success" | "info" | "brand" | "neutral" | "danger"> = {
  active: "success", scaling: "brand", acquired: "info", dormant: "neutral", closed: "danger",
};
const STATUS_LABEL: Record<string, string> = {
  active: "نشط", scaling: "يتوسّع", acquired: "استُحوذ عليه", dormant: "متوقّف مؤقّتًا", closed: "مغلق",
};
const OUTCOME_STATUSES = ["active", "scaling", "acquired", "dormant", "closed"];

function money(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString("en-US")}`;
}

export default function AdminImpact() {
  const qc = useQueryClient();
  const [recordFor, setRecordFor] = useState<VentureRow | null>(null);

  const ovQ = useQuery({ queryKey: ["impact-overview"], queryFn: () => api<Overview>("/admin/impact/overview"), refetchInterval: 60_000 });
  const venQ = useQuery({ queryKey: ["impact-ventures"], queryFn: () => api<{ ventures: VentureRow[] }>("/admin/impact/ventures") });

  const ov = ovQ.data;
  const ventures = venQ.data?.ventures ?? [];

  const kpis = [
    { label: "مشاريع مُتابَعة", value: ov ? String(ov.funnel.tracked) : "—", hint: `من ${ov?.funnel.ventures ?? 0} مشروعًا`, Icon: Users2 },
    { label: "وظائف خُلقت", value: ov ? ov.totals.jobs.toLocaleString("ar-EG") : "—", hint: "إجماليّ الحاليّ", Icon: Briefcase },
    { label: "تمويل حُصِّل", value: ov ? money(ov.totals.fundingUsd) : "—", hint: "تراكميّ", Icon: Banknote },
    { label: "معدّل البقاء", value: ov ? `${ov.totals.survivalRate}%` : "—", hint: `${ov?.totals.surviving ?? 0} مشروع قائم`, Icon: HeartPulse },
  ];

  const funnelSteps = ov
    ? [
        { label: "طلبات", value: ov.funnel.applications },
        { label: "مقبول", value: ov.funnel.accepted },
        { label: "دفعات", value: ov.funnel.cohorts },
        { label: "مشاريع", value: ov.funnel.ventures },
        { label: "مُتابَع", value: ov.funnel.tracked },
      ]
    : [];
  const funnelMax = Math.max(1, ...funnelSteps.map((s) => s.value));

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[20px] font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> الأثر والنتائج
          </h2>
          <p className="text-[13px] text-foreground/60 mt-1">قياس أثر الحاضنة عبر الزمن — الوظائف، التمويل، ومعدّل بقاء المشاريع.</p>
        </div>
        <AdminButton
          variant="secondary"
          icon={<Download className="w-4 h-4" />}
          onClick={() => downloadCsv("/admin/impact/export", "impact-outcomes.csv")}
          data-testid="impact-export"
        >
          تصدير CSV
        </AdminButton>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => {
          const Icon = k.Icon;
          return (
            <div key={k.label} className="rounded-2xl bg-card border border-border p-4 lg:p-5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary grid place-items-center mb-3"><Icon className="w-4.5 h-4.5" /></div>
              <div className="text-[24px] lg:text-[28px] font-bold text-foreground tabular-nums leading-none">{k.value}</div>
              <div className="text-[12.5px] text-foreground/70 font-medium mt-1.5">{k.label}</div>
              <div className="text-[11px] text-foreground/45 mt-0.5">{k.hint}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-12 gap-4">
        {/* Trend */}
        <div className="lg:col-span-7 rounded-2xl bg-card border border-border p-5">
          <h3 className="text-[14px] font-bold text-foreground mb-3">نموّ الأثر عبر الفترات</h3>
          <div className="h-56" dir="ltr">
            {ov && ov.trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ov.trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="impJobs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="period" tick={{ fontSize: 10, fill: "hsl(var(--fg-faint))" }} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--fg-faint))" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, background: "hsl(var(--popover))", border: "1px solid hsl(var(--border-strong))", color: "hsl(var(--foreground))", fontSize: 12 }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area type="monotone" dataKey="jobs" name="وظائف" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#impJobs)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-[13px] text-foreground/50">لا بيانات أثر بعد — سجّل أوّل نتيجة لمشروع.</div>
            )}
          </div>
        </div>

        {/* Funnel */}
        <div className="lg:col-span-5 rounded-2xl bg-card border border-border p-5">
          <h3 className="text-[14px] font-bold text-foreground mb-3">مسار القِمع</h3>
          <div className="space-y-2.5">
            {funnelSteps.map((s, i) => (
              <div key={s.label}>
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="text-foreground/70 font-medium">{s.label}</span>
                  <span className="text-foreground/90 font-bold tabular-nums">{s.value.toLocaleString("ar-EG")}</span>
                </div>
                <div className="h-2 rounded-full bg-foreground/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-[hsl(var(--primary-cta))] transition-all" style={{ width: `${Math.max(4, (s.value / funnelMax) * 100)}%`, opacity: 1 - i * 0.13 }} />
                </div>
              </div>
            ))}
            {funnelSteps.length === 0 && <div className="text-[13px] text-foreground/50 py-6 text-center">جارِ التحميل…</div>}
          </div>
        </div>
      </div>

      {/* Ventures table */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-foreground">المشاريع — أحدث نتيجة</h3>
        </div>
        {ventures.length === 0 ? (
          <div className="p-5"><EmptyState icon={<TrendingUp className="w-5 h-5" />} title="لا مشاريع بعد" description="أضِف مشاريع من قسم «المشاريع الناشئة» ثمّ سجّل نتائجها هنا." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-foreground/55 text-[11px] border-b border-border">
                  <th className="text-right font-semibold px-4 py-3">المشروع</th>
                  <th className="text-right font-semibold px-4 py-3 whitespace-nowrap">الحالة</th>
                  <th className="text-right font-semibold px-4 py-3 whitespace-nowrap">وظائف</th>
                  <th className="text-right font-semibold px-4 py-3 whitespace-nowrap">تمويل</th>
                  <th className="text-right font-semibold px-4 py-3 whitespace-nowrap">آخر فترة</th>
                  <th className="px-4 py-3"><span className="sr-only">إجراءات</span></th>
                </tr>
              </thead>
              <tbody>
                {ventures.map((v) => (
                  <tr key={v.id} data-testid={`impact-venture-${v.id}`} className="border-b border-border/60 hover:bg-foreground/[0.02]">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{v.name}</div>
                      {v.sector && <div className="text-[11px] text-foreground/45">{v.sector}</div>}
                    </td>
                    <td className="px-4 py-3">{v.latest ? <StatusBadge tone={STATUS_TONE[v.latest.status] ?? "neutral"}>{STATUS_LABEL[v.latest.status] ?? v.latest.status}</StatusBadge> : <span className="text-foreground/30">—</span>}</td>
                    <td className="px-4 py-3 tabular-nums text-foreground/80">{v.latest ? v.latest.jobs : "—"}</td>
                    <td className="px-4 py-3 tabular-nums text-foreground/80">{v.latest ? money(v.latest.fundingUsd) : "—"}</td>
                    <td className="px-4 py-3 text-foreground/60 whitespace-nowrap">{v.latest?.period ?? "—"}</td>
                    <td className="px-4 py-3 text-left">
                      <AdminButton size="sm" variant="secondary" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setRecordFor(v)} data-testid={`impact-record-${v.id}`}>تسجيل نتيجة</AdminButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {recordFor && (
        <RecordModal
          venture={recordFor}
          onClose={() => setRecordFor(null)}
          onSaved={() => {
            setRecordFor(null);
            qc.invalidateQueries({ queryKey: ["impact-overview"] });
            qc.invalidateQueries({ queryKey: ["impact-ventures"] });
          }}
        />
      )}
    </div>
  );
}

function RecordModal({ venture, onClose, onSaved }: { venture: VentureRow; onClose: () => void; onSaved: () => void }) {
  const [period, setPeriod] = useState("");
  const [status, setStatus] = useState(venture.latest?.status ?? "active");
  const [jobs, setJobs] = useState(String(venture.latest?.jobs ?? ""));
  const [funding, setFunding] = useState(String(venture.latest?.fundingUsd ?? ""));
  const [revenue, setRevenue] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () =>
      api(`/admin/impact/ventures/${venture.id}/outcomes`, {
        method: "POST",
        body: JSON.stringify({
          period: period.trim(),
          status,
          jobs: jobs ? Number(jobs) : 0,
          fundingUsd: funding ? Number(funding) : 0,
          revenueUsd: revenue ? Number(revenue) : 0,
          note: note.trim() || undefined,
        }),
      }),
    onSuccess: onSaved,
    onError: (e) => setError(e instanceof ApiError ? e.message : "تعذّر الحفظ"),
  });

  const inp = "w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground text-[13.5px] outline-none focus:border-primary/50";
  const canSave = period.trim().length >= 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div dir="rtl" className="w-full max-w-md rounded-2xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-bold text-foreground">تسجيل نتيجة — {venture.name}</h3>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="grid place-items-center w-8 h-8 rounded-lg hover:bg-foreground/10 text-foreground/60"><X className="w-4 h-4" /></button>
        </div>
        {error && <div className="mb-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[12.5px] px-3 py-2">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <label className="block col-span-2"><span className="text-[12px] font-semibold text-foreground/70">الفترة</span>
            <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="مثال: 2026-Q2" className={`mt-1 ${inp}`} data-testid="outcome-period" /></label>
          <label className="block col-span-2"><span className="text-[12px] font-semibold text-foreground/70">الحالة</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="الحالة" className={`mt-1 ${inp}`}>
              {OUTCOME_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select></label>
          <label className="block"><span className="text-[12px] font-semibold text-foreground/70">وظائف</span>
            <input type="number" min={0} value={jobs} onChange={(e) => setJobs(e.target.value)} className={`mt-1 ${inp}`} data-testid="outcome-jobs" /></label>
          <label className="block"><span className="text-[12px] font-semibold text-foreground/70">تمويل ($)</span>
            <input type="number" min={0} value={funding} onChange={(e) => setFunding(e.target.value)} className={`mt-1 ${inp}`} /></label>
          <label className="block col-span-2"><span className="text-[12px] font-semibold text-foreground/70">إيراد الفترة ($)</span>
            <input type="number" min={0} value={revenue} onChange={(e) => setRevenue(e.target.value)} className={`mt-1 ${inp}`} /></label>
          <label className="block col-span-2"><span className="text-[12px] font-semibold text-foreground/70">ملاحظة (اختياريّ)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={`mt-1 ${inp} h-auto py-2 resize-none`} /></label>
        </div>
        <div className="flex items-center justify-end gap-2 mt-4">
          <AdminButton variant="secondary" onClick={onClose}>إلغاء</AdminButton>
          <AdminButton onClick={() => mut.mutate()} disabled={!canSave} loading={mut.isPending} icon={<Plus className="w-4 h-4" />} data-testid="outcome-save">حفظ النتيجة</AdminButton>
        </div>
      </div>
    </div>
  );
}
