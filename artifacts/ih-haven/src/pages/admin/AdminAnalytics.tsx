import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Eye, Activity, FileText, Inbox } from "lucide-react";

type Analytics = {
  total: number;
  last24h: number;
  byPath: { path: string; count: number }[];
  byDay: { day: string; count: number }[];
};

export default function AdminAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => api<Analytics>("/admin/analytics"),
    refetchInterval: 30_000,
  });

  const { data: appStats } = useQuery({
    queryKey: ["admin-app-stats"],
    queryFn: () =>
      api<{ byStatus: { status: string; count: number }[] }>(
        "/admin/applications/stats",
      ),
  });

  if (isLoading || !analytics)
    return (
      <div className="text-center py-16 text-foreground/60 text-sm">
        جارِ التحميل...
      </div>
    );

  const STATUS_LABELS: Record<string, string> = {
    new: "جديد",
    reviewing: "قيد المراجعة",
    accepted: "مقبول",
    rejected: "مرفوض",
  };

  const STATUS_DOTS: Record<string, string> = {
    new: "bg-primary",
    reviewing: "bg-amber-500",
    accepted: "bg-emerald-500",
    rejected: "bg-rose-500",
  };

  const totalApps = appStats?.byStatus.reduce((s, r) => s + r.count, 0) ?? 0;
  const newApps = appStats?.byStatus.find((r) => r.status === "new")?.count ?? 0;

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Stat label="إجمالي الزيارات" value={analytics.total} Icon={Eye} />
        <Stat label="آخر ٢٤ ساعة" value={analytics.last24h} Icon={Activity} />
        <Stat label="إجمالي الطلبات" value={totalApps} Icon={FileText} />
        <Stat label="طلبات جديدة" value={newApps} Icon={Inbox} highlight />
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-soft p-5 lg:p-7">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[15px] font-bold text-foreground">
              الزيارات خلال آخر ٣٠ يوماً
            </h3>
            <p className="text-[12px] text-foreground/65 mt-0.5">يتحدّث كل ٣٠ ث</p>
          </div>
        </div>
        {analytics.byDay.length === 0 ? (
          <div className="text-foreground/60 text-[13px] py-16 text-center">
            لا توجد بيانات بعد.
          </div>
        ) : (
          <div className="h-72" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.byDay} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(354 70% 52%)" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="hsl(354 70% 52%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "hsl(354 8% 50%)" }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(354 12% 90%)" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(354 8% 50%)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid hsl(354 12% 90%)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(354 70% 52%)"
                  strokeWidth={2.5}
                  fill="url(#ag)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-card rounded-2xl border border-border shadow-soft p-5 lg:p-7">
          <h3 className="text-[15px] font-bold text-foreground mb-4">
            الصفحات الأكثر زيارة
          </h3>
          {analytics.byPath.length === 0 ? (
            <div className="text-foreground/60 text-[13px]">لا توجد بيانات.</div>
          ) : (
            <ul className="space-y-2.5">
              {analytics.byPath.slice(0, 10).map((row) => {
                const max = analytics.byPath[0].count || 1;
                const pct = (row.count / max) * 100;
                return (
                  <li key={row.path} className="space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <span dir="ltr" className="font-mono text-[12px] text-foreground/75 truncate">
                        {row.path}
                      </span>
                      <span className="font-bold text-foreground tabular-nums text-[13px]">
                        {row.count}
                      </span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${pct}%`, transition: "width 0.6s ease" }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-soft p-5 lg:p-7">
          <h3 className="text-[15px] font-bold text-foreground mb-4">
            الطلبات حسب الحالة
          </h3>
          {!appStats || appStats.byStatus.length === 0 ? (
            <div className="text-foreground/60 text-[13px]">لا توجد بيانات.</div>
          ) : (
            <ul className="space-y-3">
              {appStats.byStatus.map((row) => (
                <li
                  key={row.status}
                  className="flex items-center justify-between border-b border-border last:border-0 pb-3 last:pb-0"
                >
                  <span className="flex items-center gap-2.5 text-[13.5px] text-foreground/80 font-medium">
                    <span className={`w-2 h-2 rounded-full ${STATUS_DOTS[row.status]}`} />
                    {STATUS_LABELS[row.status] ?? row.status}
                  </span>
                  <span className="font-bold text-foreground tabular-nums">
                    {row.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  Icon,
  highlight,
}: {
  label: string;
  value: number;
  Icon: typeof Eye;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 border transition-all hover:-translate-y-0.5 ${
        highlight
          ? "bg-[hsl(var(--primary-cta))] text-white border-primary shadow-soft-hover"
          : "bg-card border-border shadow-soft hover:shadow-soft-hover"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3.5 ${
          highlight ? "bg-white/15 text-white" : "bg-primary-soft text-primary"
        }`}
      >
        <Icon className="w-4.5 h-4.5" strokeWidth={2.2} />
      </div>
      <div
        className={`text-[12px] font-medium mb-1 ${
          highlight ? "text-white/80" : "text-foreground/55"
        }`}
      >
        {label}
      </div>
      <div
        className={`text-3xl font-bold tabular-nums tracking-tight ${
          highlight ? "text-white" : "text-foreground"
        }`}
      >
        {value.toLocaleString("ar-EG")}
      </div>
    </div>
  );
}
