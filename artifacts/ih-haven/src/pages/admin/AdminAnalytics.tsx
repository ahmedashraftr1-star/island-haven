import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

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
    return <div className="text-center py-12 text-gray-500">جارِ التحميل...</div>;

  const STATUS_LABELS: Record<string, string> = {
    new: "جديد",
    reviewing: "قيد المراجعة",
    accepted: "مقبول",
    rejected: "مرفوض",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="إجمالي الزيارات" value={analytics.total} />
        <Stat label="آخر 24 ساعة" value={analytics.last24h} />
        <Stat
          label="إجمالي الطلبات"
          value={
            appStats?.byStatus.reduce((s, r) => s + r.count, 0) ?? 0
          }
        />
        <Stat
          label="طلبات جديدة"
          value={
            appStats?.byStatus.find((r) => r.status === "new")?.count ?? 0
          }
        />
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="text-lg font-bold mb-4">الزيارات خلال آخر 30 يوماً</h3>
        {analytics.byDay.length === 0 ? (
          <div className="text-gray-500 text-sm py-12 text-center">
            لا توجد بيانات بعد.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.byDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#000" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-bold mb-4">الصفحات الأكثر زيارة</h3>
          {analytics.byPath.length === 0 ? (
            <div className="text-gray-500 text-sm">لا توجد بيانات.</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {analytics.byPath.map((row) => (
                <li
                  key={row.path}
                  className="flex justify-between border-b last:border-0 pb-2"
                >
                  <span dir="ltr" className="font-mono text-xs">
                    {row.path}
                  </span>
                  <span className="font-bold">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-bold mb-4">الطلبات حسب الحالة</h3>
          {!appStats || appStats.byStatus.length === 0 ? (
            <div className="text-gray-500 text-sm">لا توجد بيانات.</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {appStats.byStatus.map((row) => (
                <li
                  key={row.status}
                  className="flex justify-between border-b last:border-0 pb-2"
                >
                  <span>{STATUS_LABELS[row.status] ?? row.status}</span>
                  <span className="font-bold">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}
