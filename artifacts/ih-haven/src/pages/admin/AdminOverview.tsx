import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Inbox,
  CheckCircle2,
  Clock,
  Eye,
  TrendingUp,
  Users,
  ArrowLeft,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Application = {
  id: number;
  fullName: string;
  email: string;
  category: string;
  status: string;
  createdAt: string;
};

type Analytics = {
  total: number;
  last24h: number;
  byPath: { path: string; count: number }[];
  byDay: { day: string; count: number }[];
};

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

const CATEGORY_LABELS: Record<string, string> = {
  freelancer: "مستقل",
  graduate: "خرّيج",
  student: "طالب",
  other: "أخرى",
};

export default function AdminOverview({
  onJump,
}: {
  onJump: (tab: string) => void;
}) {
  const { data: analytics } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => api<Analytics>("/admin/analytics"),
    refetchInterval: 30_000,
  });

  const { data: appsData } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: () => api<{ applications: Application[] }>("/admin/applications"),
  });

  const apps = appsData?.applications ?? [];
  const newCount = apps.filter((a) => a.status === "new").length;
  const reviewingCount = apps.filter((a) => a.status === "reviewing").length;
  const acceptedCount = apps.filter((a) => a.status === "accepted").length;
  const recent = apps.slice(0, 6);

  const cards = [
    {
      label: "إجمالي الزيارات",
      value: analytics?.total ?? 0,
      hint: `${analytics?.last24h ?? 0} في آخر ٢٤ ساعة`,
      Icon: Eye,
      tone: "primary" as const,
    },
    {
      label: "إجمالي الطلبات",
      value: apps.length,
      hint: `${newCount} طلب جديد بانتظارك`,
      Icon: Inbox,
      tone: "soft" as const,
    },
    {
      label: "قيد المراجعة",
      value: reviewingCount,
      hint: "طلبات تنتظر قراراً",
      Icon: Clock,
      tone: "soft" as const,
    },
    {
      label: "تمّ قبولهم",
      value: acceptedCount,
      hint: "أعضاء جدد في المجتمع",
      Icon: CheckCircle2,
      tone: "soft" as const,
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {cards.map((c, i) => {
          const Icon = c.Icon;
          const primary = c.tone === "primary";
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className={`relative rounded-2xl p-5 lg:p-6 border transition-all duration-300 hover:-translate-y-0.5 ${
                primary
                  ? "bg-primary text-primary-foreground border-primary shadow-soft-hover"
                  : "bg-white border-border shadow-soft hover:shadow-soft-hover"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    primary
                      ? "bg-white/15 text-white"
                      : "bg-primary-soft text-primary"
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={2.2} />
                </div>
                {primary && (
                  <span className="text-[10px] tracking-[0.18em] uppercase font-semibold text-white/70">
                    Live
                  </span>
                )}
              </div>
              <div
                className={`text-3xl lg:text-4xl font-bold tabular-nums tracking-tight ${
                  primary ? "text-white" : "text-foreground"
                }`}
              >
                {c.value.toLocaleString("ar-EG")}
              </div>
              <div
                className={`text-[12.5px] font-medium mt-1 ${
                  primary ? "text-white/80" : "text-foreground/55"
                }`}
              >
                {c.label}
              </div>
              <div
                className={`text-[11.5px] mt-2 ${
                  primary ? "text-white/65" : "text-foreground/45"
                }`}
              >
                {c.hint}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Visits chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-border shadow-soft p-5 lg:p-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-bold text-foreground">
                نبض الزيارات
              </h3>
              <p className="text-[12px] text-foreground/55 mt-0.5">
                آخر ٣٠ يوماً
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-primary font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              مباشر
            </div>
          </div>
          <div className="h-56" dir="ltr">
            {analytics && analytics.byDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.byDay} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(354 70% 52%)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(354 70% 52%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "hsl(354 8% 50%)" }}
                    tickLine={false}
                    axisLine={{ stroke: "hsl(354 12% 90%)" }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(354 8% 50%)" }}
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
                    fill="url(#g)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[13px] text-foreground/45">
                لا توجد بيانات بعد.
              </div>
            )}
          </div>
        </div>

        {/* Funnel */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-border shadow-soft p-5 lg:p-7">
          <h3 className="text-[15px] font-bold text-foreground mb-1">
            مسار الانتساب
          </h3>
          <p className="text-[12px] text-foreground/55 mb-5">
            الطلبات حسب الحالة
          </p>
          {apps.length === 0 ? (
            <div className="text-[13px] text-foreground/45 py-8 text-center">
              لا طلبات بعد.
            </div>
          ) : (
            <div className="space-y-3.5">
              {(["new", "reviewing", "accepted", "rejected"] as const).map((s) => {
                const c = apps.filter((a) => a.status === s).length;
                const pct = apps.length ? (c / apps.length) * 100 : 0;
                return (
                  <div key={s}>
                    <div className="flex items-center justify-between text-[12.5px] mb-1.5">
                      <span className="flex items-center gap-2 text-foreground/75 font-medium">
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[s]}`} />
                        {STATUS_LABELS[s]}
                      </span>
                      <span className="tabular-nums font-bold text-foreground">{c}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className={STATUS_DOTS[s]}
                        style={{ height: "100%" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent applications */}
      <div className="bg-white rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="flex items-center justify-between p-5 lg:p-7 pb-4">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="text-[15px] font-bold text-foreground">آخر الطلبات</h3>
          </div>
          <button
            onClick={() => onJump("applications")}
            className="text-[12.5px] text-primary font-semibold hover:gap-2 inline-flex items-center gap-1 transition-all"
          >
            كلّ الطلبات
            <ArrowLeft className="w-3 h-3 rtl:rotate-180" />
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="px-7 pb-8 text-[13px] text-foreground/45">لا طلبات بعد.</div>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-4 px-5 lg:px-7 py-3.5 hover:bg-muted/40 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold text-[13px] shrink-0">
                  {a.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-foreground truncate">
                    {a.fullName}
                  </div>
                  <div className="text-[12px] text-foreground/55 truncate" dir="ltr">
                    {a.email}
                  </div>
                </div>
                <div className="hidden sm:block text-[11.5px] text-foreground/55">
                  {CATEGORY_LABELS[a.category] ?? a.category}
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-foreground/75">
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[a.status]}`} />
                  {STATUS_LABELS[a.status] ?? a.status}
                </span>
                <div className="hidden md:block text-[11px] text-foreground/45 tabular-nums">
                  {new Date(a.createdAt).toLocaleDateString("ar-EG", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
