import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  LayoutDashboard,
  Inbox,
  FileText,
  BarChart3,
  CalendarCheck,
  GraduationCap,
  Newspaper,
  LogOut,
  ArrowLeft,
  Users,
  Briefcase,
  Settings,
} from "lucide-react";
import AdminLogin from "./AdminLogin";
import AdminApplications from "./AdminApplications";
import AdminBookings from "./AdminBookings";
import AdminContent from "./AdminContent";
import AdminAnalytics from "./AdminAnalytics";
import AdminOverview from "./AdminOverview";
import AdminCourses from "./AdminCourses";
import AdminDaily from "./AdminDaily";
import AdminUsers from "./AdminUsers";
import AdminWorks from "./AdminWorks";
import AdminSettings from "./AdminSettings";
import { HavenMark } from "@/components/landing/HavenMark";

type Tab =
  | "overview"
  | "bookings"
  | "applications"
  | "users"
  | "works"
  | "courses"
  | "daily"
  | "content"
  | "analytics"
  | "settings";

const TABS: { id: Tab; label: string; Icon: typeof Inbox }[] = [
  { id: "overview", label: "نظرة عامّة", Icon: LayoutDashboard },
  { id: "bookings", label: "حجوزات المقاعد", Icon: CalendarCheck },
  { id: "applications", label: "الطلبات", Icon: Inbox },
  { id: "users", label: "المستخدمون", Icon: Users },
  { id: "works", label: "الأعمال", Icon: Briefcase },
  { id: "courses", label: "الكورسات والورشات", Icon: GraduationCap },
  { id: "daily", label: "اليوميّات", Icon: Newspaper },
  { id: "content", label: "تحرير المحتوى", Icon: FileText },
  { id: "analytics", label: "الإحصائيات", Icon: BarChart3 },
  { id: "settings", label: "الإعدادات", Icon: Settings },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-me"],
    queryFn: () => api<{ authenticated: boolean }>("/admin/me"),
    staleTime: 5_000,
  });

  useEffect(() => {
    document.title = "لوحة الإدارة — آيلاند هيفن";
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground/45 text-sm">جارِ التحميل...</div>
      </div>
    );
  }

  if (!data?.authenticated) return <AdminLogin />;

  async function logout() {
    await api("/admin/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <div dir="rtl" className="min-h-screen bg-muted/40 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-[240px] shrink-0 border-l border-border bg-white flex-col h-screen sticky top-0">
        <div className="px-6 pt-7 pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <HavenMark size={36} className="text-primary" delay={0} />
            <div className="leading-tight">
              <div className="text-[14px] font-bold text-foreground tracking-tight">
                Island Haven
              </div>
              <div className="text-[10.5px] text-foreground/55 font-medium">
                لوحة الإدارة
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                data-testid={`tab-${id}`}
                className={`w-full flex items-center gap-3 px-3.5 h-10 rounded-xl text-[13.5px] font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-foreground/70 hover:bg-foreground/[0.04] hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={2.2} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 pb-5 space-y-1 border-t border-border pt-4">
          <a
            href={import.meta.env.BASE_URL}
            className="flex items-center gap-3 px-3.5 h-10 rounded-xl text-[13px] font-medium text-foreground/70 hover:bg-foreground/[0.04] hover:text-foreground transition-all"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" strokeWidth={2.2} />
            العودة إلى الموقع
          </a>
          <button
            onClick={logout}
            data-testid="button-logout"
            className="w-full flex items-center gap-3 px-3.5 h-10 rounded-xl text-[13px] font-medium text-rose-600 hover:bg-rose-50 transition-all"
          >
            <LogOut className="w-4 h-4" strokeWidth={2.2} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 bg-white/90 backdrop-blur-xl border-b border-border">
        <div className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HavenMark size={28} className="text-primary" delay={0} />
            <div className="text-[13px] font-bold text-foreground">
              لوحة الإدارة
            </div>
          </div>
          <button
            onClick={logout}
            className="text-[12px] text-rose-600 font-semibold"
          >
            خروج
          </button>
        </div>
        <div className="overflow-x-auto px-3 pb-2 flex gap-1">
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`shrink-0 flex items-center gap-2 px-3.5 h-9 rounded-full text-[12.5px] font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground/70"
                }`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 min-w-0 pt-[110px] lg:pt-0">
        <header className="hidden lg:flex items-center justify-between px-8 lg:px-10 h-16 border-b border-border bg-white/70 backdrop-blur-xl sticky top-0 z-20">
          <div>
            <h1 className="text-[18px] font-bold text-foreground tracking-tight">
              {TABS.find((t) => t.id === tab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-foreground/55">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            متّصل بالخادم
          </div>
        </header>

        <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">
          {tab === "overview" && <AdminOverview onJump={(t) => setTab(t as Tab)} />}
          {tab === "bookings" && <AdminBookings />}
          {tab === "applications" && <AdminApplications />}
          {tab === "users" && <AdminUsers />}
          {tab === "works" && <AdminWorks />}
          {tab === "courses" && <AdminCourses />}
          {tab === "daily" && <AdminDaily />}
          {tab === "content" && <AdminContent />}
          {tab === "analytics" && <AdminAnalytics />}
          {tab === "settings" && <AdminSettings />}
        </div>
      </main>
    </div>
  );
}
