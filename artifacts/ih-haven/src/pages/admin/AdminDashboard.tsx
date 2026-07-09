import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  LayoutDashboard,
  ListChecks,
  Inbox,
  FileText,
  BarChart3,
  Bell,
  CalendarCheck,
  GraduationCap,
  Newspaper,
  LogOut,
  ArrowLeft,
  Users,
  Briefcase,
  Settings,
  Sparkles,
  MessageSquare,
  Rocket,
  Lightbulb,
  Quote,
  Handshake,
  UserSquare2,
  Layers,
  BookOpen,
  CalendarRange,
  Flag,
  Map,
  Target,
  Award,
  Gift,
  Armchair,
  ShieldCheck,
  Hash,
} from "lucide-react";
import AdminLogin from "./AdminLogin";
import AdminApplications from "./AdminApplications";
import AdminBookings from "./AdminBookings";
import AdminAttendance from "./AdminAttendance";
import AdminContent from "./AdminContent";
import AdminAnalytics from "./AdminAnalytics";
import AdminOverview from "./AdminOverview";
import AdminTasks from "./AdminTasks";
import AdminCourses from "./AdminCourses";
import AdminDaily from "./AdminDaily";
import AdminUsers from "./AdminUsers";
import AdminWorks from "./AdminWorks";
import AdminSettings from "./AdminSettings";
import AdminPush from "./AdminPush";
import AdminExperts from "./AdminExperts";
import AdminSessions from "./AdminSessions";
import AdminPrograms from "./AdminPrograms";
import AdminVentures from "./AdminVentures";
import AdminOpportunities from "./AdminOpportunities";
import AdminBadges from "./AdminBadges";
import AdminPerks from "./AdminPerks";
import AdminStories from "./AdminStories";
import AdminPartners from "./AdminPartners";
import AdminTeam from "./AdminTeam";
import AdminCohorts from "./AdminCohorts";
import AdminResources from "./AdminResources";
import AdminSlots from "./AdminSlots";
import AdminMilestones from "./AdminMilestones";
import AdminCohortJourney from "./AdminCohortJourney";
import AdminTeamAccounts from "./AdminTeamAccounts";
import AdminInbox from "./AdminInbox";
import AdminTeamChannel from "./AdminTeamChannel";
import { HavenMark } from "@/components/landing/HavenMark";

type Tab =
  | "overview"
  | "tasks"
  | "bookings"
  | "attendance"
  | "applications"
  | "users"
  | "experts"
  | "sessions"
  | "programs"
  | "ventures"
  | "opportunities"
  | "badges"
  | "perks"
  | "milestones"
  | "stories"
  | "partners"
  | "team"
  | "cohorts"
  | "journey"
  | "slots"
  | "resources"
  | "works"
  | "courses"
  | "daily"
  | "content"
  | "analytics"
  | "push"
  | "inbox"
  | "channel"
  | "settings"
  | "staff";

// Each tab → the permission that grants VIEW access. Sub-tabs fold into their
// parent section (journey→cohorts, milestones→ventures, push→broadcast). A
// super-admin (or the ENV admin) sees everything.
const TAB_PERMISSION: Record<Tab, string> = {
  overview: "overview:view",
  tasks: "tasks:view",
  bookings: "bookings:view",
  attendance: "attendance:view",
  applications: "applications:view",
  users: "users:view",
  experts: "experts:view",
  sessions: "sessions:view",
  programs: "programs:view",
  cohorts: "cohorts:view",
  journey: "cohorts:view",
  ventures: "ventures:view",
  opportunities: "opportunities:view",
  perks: "perks:view",
  badges: "badges:view",
  milestones: "ventures:view",
  slots: "slots:view",
  resources: "resources:view",
  stories: "stories:view",
  partners: "partners:view",
  team: "team:view",
  works: "works:view",
  courses: "courses:view",
  daily: "daily:view",
  content: "content:view",
  analytics: "analytics:view",
  push: "broadcast:send",
  inbox: "messages:send",
  channel: "messages:send",
  settings: "settings:view",
  staff: "staff:manage",
};

const TABS: { id: Tab; label: string; Icon: typeof Inbox }[] = [
  { id: "overview", label: "نظرة عامّة", Icon: LayoutDashboard },
  { id: "tasks", label: "المهام والتواصل", Icon: ListChecks },
  { id: "bookings", label: "حجوزات المقاعد", Icon: CalendarCheck },
  { id: "attendance", label: "الحضور والانصراف", Icon: Armchair },
  { id: "applications", label: "الطلبات", Icon: Inbox },
  { id: "users", label: "المستخدمون", Icon: Users },
  { id: "experts", label: "الخبراء", Icon: Sparkles },
  { id: "sessions", label: "جلسات الإرشاد", Icon: MessageSquare },
  { id: "programs", label: "برامج الاحتضان", Icon: Rocket },
  { id: "cohorts", label: "الدّفعات", Icon: Layers },
  { id: "journey", label: "رحلة الدفعة", Icon: Map },
  { id: "ventures", label: "المشاريع الناشئة", Icon: Lightbulb },
  { id: "opportunities", label: "الفرص والوظائف", Icon: Target },
  { id: "perks", label: "العروض والامتيازات", Icon: Gift },
  { id: "badges", label: "الشّارات", Icon: Award },
  { id: "milestones", label: "محطّات المشاريع", Icon: Flag },
  { id: "slots", label: "مواعيد الخبراء", Icon: CalendarRange },
  { id: "resources", label: "دليل الرّائد", Icon: BookOpen },
  { id: "stories", label: "قصص النجاح", Icon: Quote },
  { id: "partners", label: "الشركاء", Icon: Handshake },
  { id: "team", label: "فريق آيلاند", Icon: UserSquare2 },
  { id: "works", label: "الأعمال", Icon: Briefcase },
  { id: "courses", label: "الكورسات والورشات", Icon: GraduationCap },
  { id: "daily", label: "اليوميّات", Icon: Newspaper },
  { id: "content", label: "تحرير المحتوى", Icon: FileText },
  { id: "analytics", label: "الإحصائيات", Icon: BarChart3 },
  { id: "push", label: "الإشعارات", Icon: Bell },
  { id: "inbox", label: "صندوق الرسائل", Icon: MessageSquare },
  { id: "channel", label: "قناة الفريق", Icon: Hash },
  { id: "staff", label: "الفريق والصلاحيّات", Icon: ShieldCheck },
  { id: "settings", label: "الإعدادات", Icon: Settings },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [settingsDirty, setSettingsDirty] = useState(false);

  function navigateTo(id: Tab) {
    if (tab === "settings" && settingsDirty && id !== "settings") {
      if (!window.confirm("لديك تغييرات غير محفوظة في الإعدادات. هل تريد المغادرة؟")) return;
    }
    setTab(id);
  }

  const { data, isLoading } = useQuery({
    queryKey: ["admin-me"],
    queryFn: () =>
      api<{
        authenticated: boolean;
        admin?: {
          id: number;
          email: string;
          fullName: string;
          role: string;
          isSuper: boolean;
          permissions: string[];
        };
      }>("/admin/me"),
    staleTime: 5_000,
  });

  // Resolved permission set for the signed-in admin. The ENV bootstrap and any
  // super_admin bypass every check; everyone else is scoped to their grants.
  const isSuper = !!data?.admin?.isSuper;
  const permsSet = useMemo(
    () => new Set(data?.admin?.permissions ?? []),
    [data?.admin?.permissions],
  );
  const can = (perm: string) => isSuper || permsSet.has(perm);
  const visibleTabs = useMemo(
    () => TABS.filter((t) => isSuper || permsSet.has(TAB_PERMISSION[t.id])),
    [isSuper, permsSet],
  );

  const { data: pendingData } = useQuery({
    queryKey: ["admin-pending"],
    queryFn: () =>
      api<{
        pending: {
          applications: number;
          programApplications: number;
          sessions: number;
          bookings: number;
        };
      }>("/admin/pending-counts"),
    enabled: !!data?.authenticated,
    refetchInterval: 60_000,
  });

  const pendingFor = (id: Tab): number => {
    const p = pendingData?.pending;
    if (!p) return 0;
    if (id === "applications") return p.applications;
    if (id === "programs") return p.programApplications;
    if (id === "sessions") return p.sessions;
    if (id === "bookings") return p.bookings;
    return 0;
  };

  useEffect(() => {
    document.title = "لوحة الإدارة — آيلاند هيفن";
  }, []);

  // If the signed-in admin can't see the active tab (scoped staff account, or a
  // tab their role doesn't grant), fall back to their first permitted tab.
  useEffect(() => {
    if (
      data?.authenticated &&
      visibleTabs.length > 0 &&
      !visibleTabs.some((t) => t.id === tab)
    ) {
      setTab(visibleTabs[0].id);
    }
  }, [data?.authenticated, visibleTabs, tab]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground/60 text-sm">جارِ التحميل...</div>
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
      <aside className="hidden lg:flex w-[240px] shrink-0 border-l border-border bg-card flex-col h-screen sticky top-0">
        <div className="px-6 pt-7 pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <HavenMark size={36} className="text-primary" delay={0} />
            <div className="leading-tight">
              <div className="text-[14px] font-bold text-foreground tracking-tight">
                Island Haven
              </div>
              <div className="text-[10.5px] text-foreground/65 font-medium">
                لوحة الإدارة
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {visibleTabs.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => navigateTo(id)}
                data-testid={`tab-${id}`}
                className={`w-full flex items-center gap-3 px-3.5 h-10 rounded-xl text-[13.5px] font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-foreground/70 hover:bg-foreground/[0.04] hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={2.2} />
                {label}
                {pendingFor(id) > 0 && (
                  <span
                    className={`ms-auto min-w-[18px] h-[18px] px-1 rounded-full text-[10.5px] font-bold flex items-center justify-center ${
                      active ? "bg-white/25 text-white" : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {pendingFor(id)}
                  </span>
                )}
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
            type="button"
            onClick={logout}
            data-testid="button-logout"
            className="w-full flex items-center gap-3 px-3.5 h-10 rounded-xl text-[13px] font-medium text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-all"
          >
            <LogOut className="w-4 h-4" strokeWidth={2.2} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HavenMark size={28} className="text-primary" delay={0} />
            <div className="text-[13px] font-bold text-foreground">
              لوحة الإدارة
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-[12px] text-rose-400 font-semibold hover:text-rose-300 transition-colors"
          >
            خروج
          </button>
        </div>
        <div className="overflow-x-auto px-3 pb-2 flex gap-1">
          {visibleTabs.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => navigateTo(id)}
                className={`shrink-0 flex items-center gap-2 px-3.5 h-9 rounded-full text-[12.5px] font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground/70"
                }`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
                {label}
                {pendingFor(id) > 0 && (
                  <span
                    className={`min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      active ? "bg-white/25 text-white" : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {pendingFor(id)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-[110px] lg:pt-0">
        <header className="hidden lg:flex items-center justify-between px-8 lg:px-10 h-16 border-b border-border bg-card/70 backdrop-blur-xl sticky top-0 z-20">
          <div>
            <h1 className="text-[18px] font-bold text-foreground tracking-tight">
              {TABS.find((t) => t.id === tab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-foreground/65">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            متّصل بالخادم
          </div>
        </header>

        <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">
          {!can(TAB_PERMISSION[tab]) ? (
            <div className="text-center py-24 text-foreground/60 text-sm">
              لا تملك صلاحية الوصول إلى هذا القسم.
            </div>
          ) : (
          <>
          {tab === "overview" && <AdminOverview onJump={(t) => setTab(t as Tab)} />}
          {tab === "tasks" && <AdminTasks />}
          {tab === "bookings" && <AdminBookings />}
          {tab === "attendance" && <AdminAttendance />}
          {tab === "applications" && <AdminApplications />}
          {tab === "users" && <AdminUsers />}
          {tab === "experts" && <AdminExperts />}
          {tab === "sessions" && <AdminSessions />}
          {tab === "programs" && <AdminPrograms />}
          {tab === "ventures" && <AdminVentures />}
          {tab === "opportunities" && <AdminOpportunities />}
          {tab === "perks" && <AdminPerks />}
          {tab === "badges" && <AdminBadges />}
          {tab === "milestones" && <AdminMilestones />}
          {tab === "journey" && <AdminCohortJourney />}
          {tab === "stories" && <AdminStories />}
          {tab === "partners" && <AdminPartners />}
          {tab === "team" && <AdminTeam />}
          {tab === "cohorts" && <AdminCohorts />}
          {tab === "slots" && <AdminSlots />}
          {tab === "resources" && <AdminResources />}
          {tab === "works" && <AdminWorks />}
          {tab === "courses" && <AdminCourses />}
          {tab === "daily" && <AdminDaily />}
          {tab === "content" && <AdminContent />}
          {tab === "analytics" && <AdminAnalytics />}
          {tab === "push" && <AdminPush />}
          {tab === "inbox" && <AdminInbox />}
          {tab === "channel" && <AdminTeamChannel />}
          {tab === "staff" && <AdminTeamAccounts />}
          {tab === "settings" && <AdminSettings onDirtyChange={setSettingsDirty} />}
          </>
          )}
        </div>
      </div>
    </div>
  );
}
