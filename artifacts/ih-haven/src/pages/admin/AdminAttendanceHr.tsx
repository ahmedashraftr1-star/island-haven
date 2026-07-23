import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { AdminButton, StatusBadge, EmptyState } from "./ui";
import {
  Clock,
  LogIn,
  LogOut,
  CalendarDays,
  Check,
  X,
  UserCheck,
  UserX,
  ShieldQuestion,
  Users,
  Briefcase,
} from "lucide-react";

// ── types (mirror routes/attendanceHr.ts) ────────────────────────────────────
type ReportStatus =
  | "present" | "here-now" | "leave" | "absent" | "excused" | "holiday" | "none";

interface ReportRow {
  actor: "member" | "staff";
  id: number;
  name: string;
  role: string;
  status: ReportStatus;
  note: string;
  checkIn: string | null;
  checkOut: string | null;
  hours: number | null;
}
interface DayReport {
  day: string;
  staff: ReportRow[];
  members: ReportRow[];
  totals: {
    staff: { total: number; present: number; absent: number; leave: number };
    members: { total: number; present: number; absent: number; leave: number };
  };
}
interface MyAttendance {
  present: boolean;
  since: string | null;
  week: string;
  days: { day: string; date: string; checkin: string | null; checkout: string | null; hours: number | null; status: string }[];
  monthlySummary: { present: number; absent: number; holiday: number; totalHours: number };
  leave: LeaveRow[];
  isRoot?: boolean;
}
interface LeaveRow {
  id: number;
  actorKind: "member" | "staff";
  actorId: number;
  actorName?: string;
  kind: string;
  kindLabel: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  decisionNote: string;
  createdAt: string | null;
}

const STATUS_META: Record<ReportStatus, { label: string; tone: "success" | "warning" | "info" | "neutral" | "danger" | "brand" }> = {
  "here-now": { label: "في الحاضنة الآن", tone: "success" },
  present: { label: "حاضر", tone: "success" },
  leave: { label: "إجازة", tone: "info" },
  absent: { label: "غائب", tone: "danger" },
  excused: { label: "معذور", tone: "warning" },
  holiday: { label: "عطلة", tone: "neutral" },
  none: { label: "لا سجلّ", tone: "neutral" },
};

function timeOf(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function AdminAttendanceHr() {
  const qc = useQueryClient();
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [leaveFilter, setLeaveFilter] = useState<"pending" | "all">("pending");

  // ── my own (staff) attendance ──
  const { data: mine } = useQuery({
    queryKey: ["my-attendance"],
    queryFn: () => api<MyAttendance>("/admin/my-attendance"),
    refetchInterval: 60_000,
  });
  const checkMut = useMutation({
    mutationFn: (dir: "in" | "out") =>
      api<{ present: boolean }>(`/admin/my-attendance/check-${dir}`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-attendance"] });
      qc.invalidateQueries({ queryKey: ["attendance-report"] });
    },
  });

  // ── day report ──
  const { data: report, isLoading } = useQuery({
    queryKey: ["attendance-report", day],
    queryFn: () => api<DayReport>(`/admin/attendance/report?day=${day}`),
    refetchInterval: 30_000,
  });
  const markMut = useMutation({
    mutationFn: (v: { actorKind: string; actorId: number; status: string }) =>
      api<{ ok: true }>("/admin/attendance/mark", {
        method: "POST",
        body: JSON.stringify({ ...v, day }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance-report", day] }),
  });

  // ── leave queue ──
  const { data: leaveData } = useQuery({
    queryKey: ["leave-queue", leaveFilter],
    queryFn: () => api<{ requests: LeaveRow[] }>(`/admin/attendance/leave?status=${leaveFilter}`),
    refetchInterval: 30_000,
  });
  const decideMut = useMutation({
    mutationFn: (v: { id: number; decision: "approved" | "rejected" }) =>
      api<{ ok: true }>(`/admin/attendance/leave/${v.id}/decide`, {
        method: "POST",
        body: JSON.stringify({ decision: v.decision, decisionNote: "" }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave-queue"] });
      qc.invalidateQueries({ queryKey: ["attendance-report"] });
    },
  });

  const isRootAdmin = mine?.isRoot === true; // env super-admin has no staff record

  return (
    <div className="space-y-8">
      {/* ── My attendance (staff self check-in) ── */}
      <section className="rounded-2xl border border-border-strong/60 bg-surface-2 p-5">
        <div className="mb-4 flex items-center gap-2 text-[13px] font-bold text-foreground/70">
          <Clock className="h-4 w-4 text-primary" /> حضوري اليوم
        </div>
        {isRootAdmin ? (
          <p className="text-[13px] text-fg-secondary">
            حساب المدير الجذر لا يسجّل حضورًا. سجّل الدخول بحسابٍ موظّفٍ حقيقيّ لتسجيل حضورك.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <StatusBadge tone={mine?.present ? "success" : "neutral"}>
              {mine?.present ? `حاضر منذ ${timeOf(mine.since)}` : "غير مسجَّل الآن"}
            </StatusBadge>
            {mine?.present ? (
              <AdminButton variant="secondary" icon={<LogOut className="h-4 w-4" />} loading={checkMut.isPending} onClick={() => checkMut.mutate("out")}>
                تسجيل الانصراف
              </AdminButton>
            ) : (
              <AdminButton icon={<LogIn className="h-4 w-4" />} loading={checkMut.isPending} onClick={() => checkMut.mutate("in")}>
                تسجيل الحضور
              </AdminButton>
            )}
            {mine && (
              <span className="text-[12px] text-fg-secondary">
                هذا الشهر: حاضر {mine.monthlySummary.present} · إجازة {mine.monthlySummary.holiday} · {mine.monthlySummary.totalHours} ساعة
              </span>
            )}
          </div>
        )}
      </section>

      {/* ── Day report ── */}
      <section className="rounded-2xl border border-border-strong/60 bg-surface-2 p-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[13px] font-bold text-foreground/70">
            <CalendarDays className="h-4 w-4 text-primary" /> تقرير اليوم
          </div>
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="rounded-lg border border-border-strong/60 bg-background px-3 py-1.5 text-[13px] text-foreground"
          />
        </div>
        {/* Honesty: this tracks the attendance of registered ACCOUNTS (staff +
            member logins), which is a different population from the public talent
            community (see the «سجل المواهب» tab for that real 61-person count). */}
        <p className="mb-4 text-[12px] text-foreground/50">
          يتتبّع حضور الحسابات المسجَّلة (موظّفون وأعضاء) — وهو غير مجتمع المواهب العامّ الظاهر في تبويب «سجل المواهب».
        </p>

        {report && (
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={<Briefcase className="h-4 w-4" />} label="موظّفون حاضرون" value={`${report.totals.staff.present}/${report.totals.staff.total}`} />
            <Stat icon={<Users className="h-4 w-4" />} label="أعضاء حاضرون" value={`${report.totals.members.present}/${report.totals.members.total}`} />
            <Stat icon={<UserX className="h-4 w-4" />} label="غياب" value={String(report.totals.staff.absent + report.totals.members.absent)} tone="danger" />
            <Stat icon={<CalendarDays className="h-4 w-4" />} label="إجازات" value={String(report.totals.staff.leave + report.totals.members.leave)} tone="info" />
          </div>
        )}

        {isLoading ? (
          <p className="text-[13px] text-fg-secondary">جارٍ التحميل…</p>
        ) : (
          <div className="space-y-6">
            <RosterTable title="الموظّفون" icon={<Briefcase className="h-4 w-4" />} rows={report?.staff ?? []} onMark={(actorId, status) => markMut.mutate({ actorKind: "staff", actorId, status })} pending={markMut.isPending} />
            <RosterTable title="الأعضاء (حسابات نشطة)" icon={<Users className="h-4 w-4" />} rows={report?.members ?? []} onMark={(actorId, status) => markMut.mutate({ actorKind: "member", actorId, status })} pending={markMut.isPending} />
          </div>
        )}
      </section>

      {/* ── Leave queue ── */}
      <section className="rounded-2xl border border-border-strong/60 bg-surface-2 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[13px] font-bold text-foreground/70">
            <ShieldQuestion className="h-4 w-4 text-primary" /> طلبات الإجازة
          </div>
          <div className="flex gap-1 rounded-lg border border-border-strong/60 p-0.5">
            {(["pending", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setLeaveFilter(f)}
                className={`rounded-md px-3 py-1 text-[12px] font-semibold transition-colors ${leaveFilter === f ? "bg-primary-cta text-primary-foreground" : "text-fg-secondary hover:text-foreground"}`}
              >
                {f === "pending" ? "قيد المراجعة" : "الكلّ"}
              </button>
            ))}
          </div>
        </div>

        {!leaveData?.requests.length ? (
          <EmptyState title="لا طلبات" description={leaveFilter === "pending" ? "لا توجد طلبات قيد المراجعة." : "لا توجد طلبات إجازة بعد."} />
        ) : (
          <ul className="space-y-2">
            {leaveData.requests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border-strong/50 bg-background/40 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[13px] font-bold text-foreground">
                    {r.actorName ?? "—"}
                    <StatusBadge tone={r.actorKind === "staff" ? "brand" : "neutral"}>{r.actorKind === "staff" ? "موظّف" : "منتسب"}</StatusBadge>
                    <StatusBadge tone="info">{r.kindLabel}</StatusBadge>
                  </div>
                  <div className="mt-1 text-[12px] text-fg-secondary">
                    {r.startDate} → {r.endDate}
                    {r.reason ? ` · ${r.reason}` : ""}
                  </div>
                </div>
                {r.status === "pending" ? (
                  <div className="flex gap-2">
                    <AdminButton size="sm" icon={<Check className="h-3.5 w-3.5" />} loading={decideMut.isPending} onClick={() => decideMut.mutate({ id: r.id, decision: "approved" })}>
                      اعتماد
                    </AdminButton>
                    <AdminButton size="sm" variant="secondary" icon={<X className="h-3.5 w-3.5" />} loading={decideMut.isPending} onClick={() => decideMut.mutate({ id: r.id, decision: "rejected" })}>
                      رفض
                    </AdminButton>
                  </div>
                ) : (
                  <StatusBadge tone={r.status === "approved" ? "success" : r.status === "rejected" ? "danger" : "neutral"}>
                    {r.status === "approved" ? "معتمدة" : r.status === "rejected" ? "مرفوضة" : "ملغاة"}
                  </StatusBadge>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, label, value, tone = "neutral" }: { icon: React.ReactNode; label: string; value: string; tone?: "neutral" | "danger" | "info" }) {
  const color = tone === "danger" ? "text-rose-400" : tone === "info" ? "text-sky-400" : "text-sand-bright";
  return (
    <div className="rounded-xl border border-border-strong/50 bg-background/40 p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-fg-secondary">
        {icon} {label}
      </div>
      <div className={`mt-1 font-display text-2xl font-black tnum ${color}`}>{value}</div>
    </div>
  );
}

function RosterTable({ title, icon, rows, onMark, pending }: {
  title: string;
  icon: React.ReactNode;
  rows: ReportRow[];
  onMark: (actorId: number, status: string) => void;
  pending: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-fg-secondary">
        {icon} {title} <span className="text-fg-faint">({rows.length})</span>
      </div>
      {rows.length === 0 ? (
        <p className="py-3 text-[13px] text-fg-secondary">لا أحد.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-[13px]">
            <tbody>
              {rows.map((r) => {
                const meta = STATUS_META[r.status];
                return (
                  <tr key={`${r.actor}-${r.id}`} className="border-b border-border-strong/30">
                    <td className="py-2.5 pe-3 font-semibold text-foreground">{r.name}</td>
                    <td className="py-2.5 pe-3">
                      <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                      {r.note ? <span className="ms-2 text-[11px] text-fg-faint">{r.note}</span> : null}
                    </td>
                    <td className="py-2.5 pe-3 text-fg-secondary tnum">
                      {r.checkIn ? `${timeOf(r.checkIn)}${r.checkOut ? " — " + timeOf(r.checkOut) : ""}` : "—"}
                      {r.hours != null ? ` · ${r.hours}س` : ""}
                    </td>
                    <td className="py-2.5">
                      <div className="flex justify-end gap-1">
                        <MarkBtn title="حاضر" tone="success" icon={<UserCheck className="h-3.5 w-3.5" />} onClick={() => onMark(r.id, "present")} disabled={pending} />
                        <MarkBtn title="غائب" tone="danger" icon={<UserX className="h-3.5 w-3.5" />} onClick={() => onMark(r.id, "absent")} disabled={pending} />
                        <MarkBtn title="معذور" tone="warning" icon={<ShieldQuestion className="h-3.5 w-3.5" />} onClick={() => onMark(r.id, "excused")} disabled={pending} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminAttendanceHr;

function MarkBtn({ title, tone, icon, onClick, disabled }: { title: string; tone: "success" | "danger" | "warning"; icon: React.ReactNode; onClick: () => void; disabled: boolean }) {
  const ring = tone === "success" ? "hover:bg-emerald-500/15 hover:text-emerald-400" : tone === "danger" ? "hover:bg-rose-500/15 hover:text-rose-400" : "hover:bg-amber-500/15 hover:text-amber-400";
  return (
    <button
      type="button"
      title={`تعليم: ${title}`}
      aria-label={`تعليم ${title}`}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border border-border-strong/50 p-1.5 text-fg-secondary transition-colors disabled:opacity-40 ${ring}`}
    >
      {icon}
    </button>
  );
}
