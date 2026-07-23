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
  MousePointerClick,
  Files,
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
  ClipboardCheck,
  Contact,
  Grid3x3,
  ShieldCheck,
  Hash,
  ScrollText,
  Trash2,
  Mail,
  Search,
  TrendingUp,
} from "lucide-react";
import AdminLogin from "./AdminLogin";
import AdminApplications from "./AdminApplications";
import AdminBookings from "./AdminBookings";
import AdminMembers from "./AdminMembers";
import AdminSeats from "./AdminSeats";
import AdminAttendance from "./AdminAttendance";
import AdminAttendanceHr from "./AdminAttendanceHr";
// Previously-orphaned: fully built + backend-wired, but never reachable in the nav.
import AdminJobs from "./AdminJobs";
import AdminInvestors from "./AdminInvestors";
import AdminNewsletter from "./AdminNewsletter";
import AdminContent from "./AdminContent";
import AdminCta from "./AdminCta";
import AdminPages from "./AdminPages";
import AdminAnalytics from "./AdminAnalytics";
import AdminOverview from "./AdminOverview";
import AdminTasks from "./AdminTasks";
import AdminCourses from "./AdminCourses";
import AdminDaily from "./AdminDaily";
import AdminBlog from "./AdminBlog";
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
import AdminAudit from "./AdminAudit";
import AdminTrash from "./AdminTrash";
import { useConfirm } from "@/hooks/use-confirm";
import AdminContact from "./AdminContact";
import AdminBell from "./AdminBell";
import AdminImpact from "./AdminImpact";
import AdminSecurity from "./AdminSecurity";
import CommandPalette, { type PaletteItem } from "./CommandPalette";
import { HavenMark } from "@/components/landing/HavenMark";

type Tab =
  | "overview"
  | "tasks"
  | "impact"
  | "bookings"
  | "attendance"
  | "attendance-hr"
  | "roster"
  | "seats"
  | "applications"
  | "users"
  | "experts"
  | "sessions"
  | "programs"
  | "ventures"
  | "opportunities"
  | "jobs"
  | "investors"
  | "newsletter"
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
  | "blog"
  | "content"
  | "cta"
  | "pages"
  | "analytics"
  | "push"
  | "inbox"
  | "channel"
  | "contact"
  | "audit"
  | "trash"
  | "settings"
  | "staff";

// Each tab → the permission that grants VIEW access. Sub-tabs fold into their
// parent section (journey→cohorts, milestones→ventures, push→broadcast). A
// super-admin (or the ENV admin) sees everything.
const TAB_PERMISSION: Record<Tab, string> = {
  overview: "overview:view",
  tasks: "tasks:view",
  impact: "impact:view",
  bookings: "bookings:view",
  // roster + seats are super-admin-only (their backend segments are unmapped in
  // the RBAC gate → fail-closed to super). These sentinel permissions are held by
  // no staff role, so only a super-admin sees the tabs — matching the backend.
  roster: "roster:manage",
  seats: "seats:manage",
  attendance: "attendance:view",
  "attendance-hr": "attendance:view",
  applications: "applications:view",
  users: "users:view",
  experts: "experts:view",
  sessions: "sessions:view",
  programs: "programs:view",
  cohorts: "cohorts:view",
  journey: "cohorts:view",
  ventures: "ventures:view",
  opportunities: "opportunities:view",
  jobs: "opportunities:view",
  investors: "partners:view",
  newsletter: "content:view",
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
  blog: "blog:view",
  content: "content:view",
  cta: "content:view",
  pages: "content:view",
  analytics: "analytics:view",
  push: "broadcast:send",
  inbox: "messages:send",
  channel: "messages:send",
  contact: "contact:view",
  audit: "audit:view",
  trash: "audit:view",
  settings: "settings:view",
  staff: "staff:manage",
};

type Group = "main" | "people" | "incubation" | "content" | "comms" | "system";

const GROUP_ORDER: Group[] = ["main", "people", "incubation", "content", "comms", "system"];
const GROUP_LABELS: Record<Group, string> = {
  main: "الرئيسيّة",
  people: "الأعضاء والطلبات",
  incubation: "الاحتضان والإرشاد",
  content: "المحتوى والمجتمع",
  comms: "التواصل",
  system: "النظام",
};

const TABS: { id: Tab; label: string; Icon: typeof Inbox; group: Group }[] = [
  { id: "overview", label: "نظرة عامّة", Icon: LayoutDashboard, group: "main" },
  { id: "impact", label: "الأثر والنتائج", Icon: TrendingUp, group: "main" },
  { id: "tasks", label: "المهام والتواصل", Icon: ListChecks, group: "main" },
  { id: "applications", label: "الطلبات", Icon: Inbox, group: "people" },
  { id: "users", label: "المستخدمون", Icon: Users, group: "people" },
  { id: "roster", label: "سجل المواهب", Icon: Contact, group: "people" },
  { id: "bookings", label: "حجوزات المقاعد", Icon: CalendarCheck, group: "people" },
  { id: "seats", label: "خريطة المقاعد", Icon: Grid3x3, group: "people" },
  { id: "attendance", label: "الحضور والانصراف", Icon: Armchair, group: "people" },
  { id: "attendance-hr", label: "الحضور والإجازات", Icon: ClipboardCheck, group: "people" },
  { id: "experts", label: "الخبراء", Icon: Sparkles, group: "incubation" },
  { id: "sessions", label: "جلسات الإرشاد", Icon: MessageSquare, group: "incubation" },
  { id: "slots", label: "مواعيد الخبراء", Icon: CalendarRange, group: "incubation" },
  { id: "programs", label: "برامج الاحتضان", Icon: Rocket, group: "incubation" },
  { id: "cohorts", label: "الدّفعات", Icon: Layers, group: "incubation" },
  { id: "journey", label: "رحلة الدفعة", Icon: Map, group: "incubation" },
  { id: "ventures", label: "المشاريع الناشئة", Icon: Lightbulb, group: "incubation" },
  { id: "milestones", label: "محطّات المشاريع", Icon: Flag, group: "incubation" },
  { id: "opportunities", label: "الفرص والوظائف", Icon: Target, group: "incubation" },
  { id: "jobs", label: "لوحة الوظائف", Icon: Briefcase, group: "incubation" },
  { id: "perks", label: "العروض والامتيازات", Icon: Gift, group: "incubation" },
  { id: "badges", label: "الشّارات", Icon: Award, group: "incubation" },
  { id: "content", label: "تحرير المحتوى", Icon: FileText, group: "content" },
  { id: "cta", label: "أزرار الرئيسيّة", Icon: MousePointerClick, group: "content" },
  { id: "pages", label: "إدارة الصفحات", Icon: Files, group: "content" },
  { id: "stories", label: "قصص النجاح", Icon: Quote, group: "content" },
  { id: "works", label: "الأعمال", Icon: Briefcase, group: "content" },
  { id: "courses", label: "الكورسات والورشات", Icon: GraduationCap, group: "content" },
  { id: "daily", label: "اليوميّات", Icon: Newspaper, group: "content" },
  { id: "blog", label: "المدوّنة", Icon: BookOpen, group: "content" },
  { id: "resources", label: "دليل الرّائد", Icon: BookOpen, group: "content" },
  { id: "partners", label: "الشركاء", Icon: Handshake, group: "content" },
  { id: "investors", label: "المستثمرون", Icon: TrendingUp, group: "content" },
  { id: "team", label: "فريق آيلاند", Icon: UserSquare2, group: "content" },
  { id: "push", label: "الإشعارات", Icon: Bell, group: "comms" },
  { id: "newsletter", label: "النشرة البريديّة", Icon: Newspaper, group: "comms" },
  { id: "contact", label: "رسائل التواصل", Icon: Mail, group: "comms" },
  { id: "inbox", label: "صندوق الرسائل", Icon: MessageSquare, group: "comms" },
  { id: "channel", label: "قناة الفريق", Icon: Hash, group: "comms" },
  { id: "analytics", label: "الإحصائيات", Icon: BarChart3, group: "system" },
  { id: "audit", label: "سجلّ التدقيق", Icon: ScrollText, group: "system" },
  { id: "trash", label: "المحذوفات", Icon: Trash2, group: "system" },
  { id: "staff", label: "الفريق والصلاحيّات", Icon: ShieldCheck, group: "system" },
  { id: "settings", label: "الإعدادات", Icon: Settings, group: "system" },
];

export default function AdminDashboard() {
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>("overview");
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [openTaskId, setOpenTaskId] = useState<number | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);

  // ⌘K / Ctrl+K opens the command palette from anywhere in the dashboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // A staff notification deep-links to a section (and sometimes a specific task).
  function handleNotifNavigate(link: string) {
    if (link.startsWith("tasks:")) {
      const id = Number(link.slice("tasks:".length));
      setTab("tasks");
      if (Number.isFinite(id)) setOpenTaskId(id);
    } else if (link === "channel" || link === "inbox") {
      setTab(link);
    }
  }

  async function navigateTo(id: Tab): Promise<boolean> {
    if (tab === "settings" && settingsDirty && id !== "settings") {
      const ok = await confirm({
        title: "تغييرات غير محفوظة",
        message: "لديك تغييرات غير محفوظة في الإعدادات. هل تريد المغادرة دون حفظها؟",
        confirmLabel: "المغادرة دون حفظ",
        danger: true,
      });
      if (!ok) return false;
    }
    setTab(id);
    return true;
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

  // Live unread signals on the comms tabs (team channel + member inbox).
  const canMessages = isSuper || permsSet.has("messages:send");
  const teamUnreadQ = useQuery({
    queryKey: ["admin-team-unread"],
    queryFn: () => api<{ count: number }>("/admin/messages/team/unread"),
    enabled: !!data?.authenticated && canMessages,
    refetchInterval: 30_000,
  });
  const inboxUnreadQ = useQuery({
    queryKey: ["admin-inbox-unread"],
    queryFn: () => api<{ threads: number; messages: number }>("/admin/messages/unread"),
    enabled: !!data?.authenticated && canMessages,
    refetchInterval: 30_000,
  });
  const badgeFor = (id: Tab): number => {
    if (id === "channel") return teamUnreadQ.data?.count ?? 0;
    if (id === "inbox") return inboxUnreadQ.data?.threads ?? 0;
    return pendingFor(id);
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

        <div className="px-3 pt-4">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            data-testid="palette-trigger"
            className="w-full flex items-center gap-2.5 px-3 h-9 rounded-xl bg-foreground/[0.04] hover:bg-foreground/[0.07] text-foreground/55 hover:text-foreground/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-[12.5px]">بحث سريع…</span>
            <kbd className="ms-auto text-[10px] font-mono border border-border rounded px-1.5 py-0.5 text-foreground/45">⌘K</kbd>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {GROUP_ORDER.map((group) => {
            const groupTabs = visibleTabs.filter((t) => t.group === group);
            if (groupTabs.length === 0) return null;
            return (
              <div key={group} className="space-y-1">
                <div className="px-3.5 pb-1 text-[10px] font-bold tracking-wide uppercase text-foreground/35">
                  {GROUP_LABELS[group]}
                </div>
                {groupTabs.map(({ id, label, Icon }) => {
                  const active = tab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => navigateTo(id)}
                      data-testid={`tab-${id}`}
                      className={`w-full flex items-center gap-3 px-3.5 h-9 rounded-xl text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                        active
                          ? "bg-[hsl(var(--primary-cta))] text-white shadow-soft"
                          : "text-foreground/70 hover:bg-foreground/[0.04] hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={2.2} />
                      {label}
                      {badgeFor(id) > 0 && (
                        <span
                          className={`ms-auto min-w-[18px] h-[18px] px-1 rounded-full text-[10.5px] font-bold flex items-center justify-center ${
                            active ? "bg-white/25 text-white" : "bg-[hsl(var(--primary-cta))] text-white"
                          }`}
                        >
                          {badgeFor(id)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="px-3 pb-5 space-y-1 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setSecurityOpen(true)}
            data-testid="open-security"
            className="w-full flex items-center gap-3 px-3.5 h-10 rounded-xl text-[13px] font-medium text-foreground/70 hover:bg-foreground/[0.04] hover:text-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <ShieldCheck className="w-4 h-4" strokeWidth={2.2} />
            الأمان (2FA)
          </button>
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
                    ? "bg-[hsl(var(--primary-cta))] text-white"
                    : "bg-muted text-foreground/70"
                }`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
                {label}
                {badgeFor(id) > 0 && (
                  <span
                    className={`min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      active ? "bg-white/25 text-white" : "bg-[hsl(var(--primary-cta))] text-white"
                    }`}
                  >
                    {badgeFor(id)}
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
          <div className="flex items-center gap-4">
            <AdminBell onNavigate={handleNotifNavigate} />
            <div className="flex items-center gap-2 text-[12px] text-foreground/65">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              متّصل بالخادم
            </div>
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
          {tab === "impact" && <AdminImpact />}
          {tab === "tasks" && <AdminTasks openTaskId={openTaskId} onOpenConsumed={() => setOpenTaskId(null)} />}
          {tab === "roster" && <AdminMembers />}
          {tab === "bookings" && <AdminBookings />}
          {tab === "seats" && <AdminSeats />}
          {tab === "attendance" && <AdminAttendance />}
          {tab === "attendance-hr" && <AdminAttendanceHr />}
          {tab === "jobs" && <AdminJobs />}
          {tab === "investors" && <AdminInvestors />}
          {tab === "newsletter" && <AdminNewsletter />}
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
          {tab === "blog" && <AdminBlog />}
          {tab === "content" && <AdminContent />}
          {tab === "cta" && <AdminCta />}
          {tab === "pages" && <AdminPages />}
          {tab === "analytics" && <AdminAnalytics />}
          {tab === "push" && <AdminPush />}
          {tab === "inbox" && <AdminInbox />}
          {tab === "channel" && <AdminTeamChannel />}
          {tab === "contact" && <AdminContact />}
          {tab === "audit" && <AdminAudit />}
          {tab === "trash" && <AdminTrash />}
          {tab === "staff" && <AdminTeamAccounts />}
          {tab === "settings" && <AdminSettings onDirtyChange={setSettingsDirty} />}
          </>
          )}
        </div>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={visibleTabs.map(
          (t): PaletteItem => ({ id: t.id, label: t.label, group: GROUP_LABELS[t.group], Icon: t.Icon }),
        )}
        onSelect={(id) => { void navigateTo(id as Tab); }}
      />
      {securityOpen && <AdminSecurity onClose={() => setSecurityOpen(false)} />}
    </div>
  );
}
