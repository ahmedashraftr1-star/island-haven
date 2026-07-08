import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import {
  LayoutDashboard,
  Briefcase,
  Bell,
  Calendar,
  User,
  ExternalLink,
  ArrowLeft,
  Copy,
  Check,
  Eye,
  EyeOff,
  Wifi,
  Clock,
  MapPin,
  Mail,
} from "lucide-react";
import { api } from "@/lib/api";
import { ANNOUNCEMENTS, WEEKLY_SCHEDULE, portalFieldsFor } from "@/data/memberPortal";
import type { Announcement, MemberPrivate, ScheduleDay, Work } from "@/types/member";

/* Eastern-Arabic numerals everywhere in the portal. */
const ar = (n: number) => n.toLocaleString("ar-EG");
const splitTags = (s?: string) =>
  (s ?? "").split(/[,،]/).map((t) => t.trim()).filter(Boolean);

type Tab = "overview" | "portfolio" | "announcements" | "schedule" | "profile";

interface ApiUser {
  id: number;
  fullName: string;
  role: string;
  avatarUrl: string | null;
  bio: string;
  jobTitle: string;
  skills: string;
  portfolioUrl: string;
  linkedinUrl: string;
  behanceUrl: string;
  githubUrl: string;
  createdAt: string;
}

function parseMemberId(): number | null {
  const raw = new URLSearchParams(window.location.search).get("member");
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

const NAV: { tab: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { tab: "overview", label: "لوحة التحكّم", icon: LayoutDashboard },
  { tab: "portfolio", label: "معرض أعمالي", icon: Briefcase },
  { tab: "announcements", label: "التعميمات", icon: Bell },
  { tab: "schedule", label: "جدول الدوام", icon: Calendar },
  { tab: "profile", label: "بياناتي", icon: User },
];

export default function DashboardPage() {
  const [memberId] = useState<number | null>(parseMemberId());
  const [member, setMember] = useState<MemberPrivate | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "بوابتي — آيلاند هيفن";
  }, []);

  useEffect(() => {
    if (!memberId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    // X-Member-Auth is a DEV-ONLY signal; real production auth is required before
    // any sensitive field is served from a real api-server route.
    api<{ user: ApiUser; works: Work[] }>(`/users/${memberId}`, {
      headers: { "X-Member-Auth": String(memberId) },
    })
      .then((r) => {
        if (cancelled) return;
        const u = r.user;
        const portal = portalFieldsFor(u.id, u.fullName);
        setMember({
          id: u.id,
          fullName: u.fullName,
          jobTitle: u.jobTitle ?? "",
          bio: u.bio ?? "",
          role: u.role,
          skills: u.skills ?? "",
          avatarUrl: u.avatarUrl,
          githubUrl: u.githubUrl ?? "",
          linkedinUrl: u.linkedinUrl ?? "",
          behanceUrl: u.behanceUrl ?? "",
          portfolioUrl: u.portfolioUrl ?? "",
          worksCount: r.works?.length ?? 0,
          followersCount: 0,
          followingCount: 0,
          createdAt: u.createdAt,
          ...portal,
        });
        setWorks(r.works ?? []);
      })
      .catch(() => !cancelled && setError("تعذّر تحميل البيانات"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  if (!memberId) return <MemberPicker />;
  if (loading) return <DashShell><DashboardSkeleton /></DashShell>;
  if (error || !member)
    return (
      <DashShell>
        <div className="grid min-h-[60vh] place-items-center text-center">
          <div>
            <p className="t-body text-fg-secondary">{error ?? "تعذّر تحميل البيانات"}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="cta-fill mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </DashShell>
    );

  const announceCount = ANNOUNCEMENTS.length;

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-[#080808] text-[#F2EDE6]" style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}>
      {/* Slim top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.08] px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0a0a0a] border border-white/10">
            <span className="font-display font-black text-primary text-[15px]">آ</span>
          </span>
          <span className="font-display font-bold text-[15px]">بوابتي</span>
        </Link>
        <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-fg-secondary hover:text-foreground transition-colors">
          العودة للموقع
          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
        </Link>
      </header>

      <div className="flex flex-1">
        {/* Sidebar — right in RTL (first flex child) */}
        <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-l border-white/[0.08] bg-[#0D0D0D] p-4">
          {/* Member identity */}
          <div className="mb-3 flex items-center justify-end gap-3 border-b border-white/[0.08] px-1 pb-4">
            <div className="min-w-0 text-end">
              <p className="text-[13.5px] font-bold text-foreground truncate">{member.fullName}</p>
              <p className="t-caption text-fg-secondary truncate">
                {member.membershipType} · {member.deskNumber}
              </p>
            </div>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-sand/30 bg-sand/[0.12] font-display font-bold text-sand text-sm">
              {member.fullName.trim().charAt(0)}
            </span>
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = tab === item.tab;
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => setTab(item.tab)}
                  aria-current={active ? "page" : undefined}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary border-e-2 border-primary"
                      : "text-fg-secondary hover:bg-white/[0.04] hover:text-foreground"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                  <span className="flex-1 text-start">{item.label}</span>
                  {item.tab === "announcements" && (
                    <span className="rounded-full bg-primary/15 px-1.5 text-[11px] font-bold text-primary tnum">{ar(announceCount)}</span>
                  )}
                </button>
              );
            })}
            <a
              href={`/u/${member.id}`}
              className="group mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-fg-secondary hover:bg-white/[0.04] hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              <span className="flex-1 text-start">الملف العام</span>
            </a>
          </nav>
          <Link
            href="/"
            className="mt-2 inline-flex items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2.5 text-[13px] text-fg-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            العودة للموقع
          </Link>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 p-4 pb-24 sm:p-6 md:pb-6">
          {tab === "overview" && <Overview member={member} works={works} />}
          {tab === "portfolio" && <Portfolio works={works} />}
          {tab === "announcements" && <Announcements />}
          {tab === "schedule" && <Schedule />}
          {tab === "profile" && <ProfileData member={member} />}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-30 flex border-t border-white/[0.08] bg-[#0D0D0D]">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = tab === item.tab;
          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => setTab(item.tab)}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] ${active ? "text-primary" : "text-fg-faint"}`}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
              {item.label.split(" ")[0]}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ─────────── shared chrome ─────────── */

function DashShell({ children }: { children: ReactNode }) {
  return (
    <div dir="rtl" className="min-h-screen bg-[#080808] text-[#F2EDE6] p-6" style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}>
      {children}
    </div>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[14px] border border-white/[0.08] bg-white/[0.03] ${className}`}>{children}</div>
  );
}

function SectionTitle({ children, count }: { children: ReactNode; count?: number }) {
  return (
    <h2 className="font-display font-bold text-foreground text-[clamp(1.4rem,3vw,2rem)] mb-6 flex items-center gap-3" style={{ letterSpacing: "-0.02em" }}>
      {children}
      {count != null && <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[13px] font-mono text-fg-secondary tnum">{ar(count)}</span>}
    </h2>
  );
}

/* ─────────── B-1 Overview ─────────── */

function Overview({ member, works }: { member: MemberPrivate; works: Work[] }) {
  return (
    <div>
      <h1 className="font-display font-bold text-[clamp(1.6rem,3.6vw,2.4rem)] leading-tight" style={{ letterSpacing: "-0.02em" }}>
        أهلًا، {member.fullName}
      </h1>
      <p className="t-caption text-fg-secondary mt-1.5">
        عضويّتك نشطة · {member.membershipType} · مكتب {member.deskNumber}
      </p>

      {/* Row 1 — 4 stat cards */}
      <div className="mt-7 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard value={ar(member.remainingDays)} label="أيّام متبقّية" hint="في عضويّتك الحاليّة" gold />
        <StatCard
          value={ar(member.totalHoursThisMonth)}
          label="ساعات هذا الشهر"
          progress={{ value: member.totalHoursThisMonth, max: 160 }}
        />
        <StatCard value={`${ar(member.attendanceThisMonth)}/${ar(30)}`} label="أيّام الحضور" />
        <StatCard value={ar(member.worksCount)} label="الأعمال المنشورة" />
      </div>

      {/* Row 2 — announcements preview + access info */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-5">
          <h3 className="font-display font-bold text-[16px] mb-4">آخر التعميمات</h3>
          <div className="space-y-3">
            {[...ANNOUNCEMENTS].sort(sortAnnouncements).slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-start gap-3 border-b border-white/[0.06] pb-3 last:border-0 last:pb-0">
                <TypeBadge type={a.type} />
                <div className="min-w-0">
                  <p className="font-medium text-[14px] line-clamp-1">{a.title}</p>
                  <p className="t-caption text-fg-secondary line-clamp-1 mt-0.5">{a.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-bold text-[16px] mb-4">معلومات الوصول</h3>
          <ul className="space-y-3.5 text-[13.5px]">
            <InfoRow icon={Clock} label="ساعات الوصول" value={member.accessHours} />
            <WifiRow password={member.wifiPassword} />
            <InfoRow icon={MapPin} label="رقم المكتب" value={member.deskNumber} />
            <CopyRow icon={Mail} label="البريد" value={member.email} />
          </ul>
        </Card>
      </div>

      {/* Row 3 — quick links */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickLink label="رفع عمل جديد" soon />
        <QuickLink label="تحرير ملفّي العام" href={`/u/${member.id}`} />
        <QuickLink label="تواصل مع الإدارة" href="/contact" />
      </div>

      {/* Row 4 — recent activity */}
      <Card className="mt-5 p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-fg-secondary mb-4">آخر نشاط</p>
        <div>
          {[
            { text: `حضرت الحاضنة ${ar(13)} ساعة أمس`, time: "أمس" },
            { text: `عمل «${works[0]?.title ?? "مشروعك"}» مرئيّ للجميع`, time: "منذ ٣ أيّام" },
            { text: "انضممت إلى المجتمع", time: "يونيو ٢٠٢٦" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 py-3 border-b border-white/[0.06] last:border-0"
            >
              <span className="font-mono text-[11.5px] text-fg-secondary">{item.time}</span>
              <span className="text-[13.5px] text-foreground text-end">{item.text}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  value,
  label,
  hint,
  gold,
  progress,
}: {
  value: string;
  label: string;
  hint?: string;
  gold?: boolean;
  progress?: { value: number; max: number };
}) {
  const pct = progress ? Math.min((progress.value / progress.max) * 100, 100) : 0;
  return (
    <Card className={`p-4 sm:p-5 ${gold ? "border-t-2 border-t-sand" : ""}`}>
      <div
        className={`font-mono font-black tnum leading-none ${gold ? "text-sand-bright" : "text-foreground"}`}
        style={{ fontSize: gold ? "clamp(2.4rem,5vw,3.1rem)" : "clamp(1.9rem,4vw,2.5rem)" }}
      >
        {value}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-wider rtl:tracking-normal text-fg-secondary mt-3">{label}</div>
      {progress ? (
        <div className="mt-3">
          <div className="h-1 w-full overflow-hidden rounded-full bg-border-strong">
            <div
              className="h-full rounded-full bg-sand transition-[width] duration-700 ease-out motion-reduce:transition-none"
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={progress.value}
              aria-valuemax={progress.max}
              aria-label={`${ar(progress.value)} ساعة من أصل ${ar(progress.max)}`}
            />
          </div>
          <p className="mt-1.5 font-mono text-[11px] text-fg-faint">
            {ar(Math.max(progress.max - progress.value, 0))} ساعة متبقّية
          </p>
        </div>
      ) : (
        hint && <div className="text-[11px] text-fg-faint mt-0.5">{hint}</div>
      )}
    </Card>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 text-fg-secondary">
        <Icon className="h-4 w-4 text-fg-faint" /> {label}
      </span>
      <span className="font-medium tnum" dir="ltr">{value}</span>
    </li>
  );
}

function CopyRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 text-fg-secondary">
        <Icon className="h-4 w-4 text-fg-faint" /> {label}
      </span>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }}
        aria-label={`نسخ ${label}`}
        className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors"
      >
        <span dir="ltr" className="truncate max-w-[140px]">{value}</span>
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-fg-faint" />}
      </button>
    </li>
  );
}

function WifiRow({ password }: { password: string }) {
  const [show, setShow] = useState(false);
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 text-fg-secondary">
        <Wifi className="h-4 w-4 text-fg-faint" /> شبكة Wi-Fi
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="font-medium" dir="ltr">IH-Members</span>
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          className="inline-flex items-center gap-1 font-mono text-[12px] text-fg-faint hover:text-foreground transition-colors"
        >
          <span dir="ltr">{show ? password : "••••••••"}</span>
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </span>
    </li>
  );
}

function QuickLink({ label, href, soon }: { label: string; href?: string; soon?: boolean }) {
  const inner = (
    <span className="flex items-center justify-between gap-2">
      <span className="font-medium text-[14px]">{label}</span>
      {soon ? (
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10.5px] text-fg-faint">قريبًا</span>
      ) : (
        <ArrowLeft className="h-4 w-4 text-fg-faint rtl:rotate-180" />
      )}
    </span>
  );
  const cls = "block rounded-[12px] border border-white/[0.08] bg-white/[0.03] p-4 transition-colors hover:border-primary/40";
  if (soon || !href)
    return (
      <div className={`${cls} cursor-default opacity-70`} aria-disabled="true">
        {inner}
      </div>
    );
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

/* ─────────── B-2 Portfolio ─────────── */

function Portfolio({ works }: { works: Work[] }) {
  return (
    <div>
      <SectionTitle count={works.length}>معرض أعمالي</SectionTitle>
      {works.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {works.map((w) => (
            <WorkCard key={w.id} w={w} />
          ))}
          <button
            type="button"
            className="grid min-h-[12rem] place-items-center rounded-[14px] border border-dashed border-white/[0.12] text-fg-faint transition-colors hover:border-sand/50 hover:text-sand"
            aria-label="أضف عملًا جديدًا (قريبًا)"
          >
            <span className="text-center">
              <Briefcase className="mx-auto h-7 w-7 text-sand/70" />
              <span className="mt-3 block text-[14px] font-medium">أضف عملًا جديدًا</span>
              <span className="mt-1 block text-[11px]">قريبًا</span>
            </span>
          </button>
        </div>
      ) : (
        <EmptyWorks />
      )}
    </div>
  );
}

function WorkCard({ w }: { w: Work }) {
  const featured = w.status === "featured";
  return (
    <a
      href={w.link || `/works/${w.id}`}
      target={w.link ? "_blank" : undefined}
      rel={w.link ? "noreferrer" : undefined}
      className={`group flex flex-col overflow-hidden rounded-[14px] border bg-white/[0.03] transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-primary/40 ${
        featured ? "border-sand/50 border-t-2 border-t-sand" : "border-white/[0.08]"
      }`}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-white/[0.03]">
        {w.coverUrl ? (
          <img src={w.coverUrl} alt={w.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1200ms] motion-reduce:transition-none group-hover:scale-[1.05]" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-white/[0.04] to-transparent">
            <Briefcase className="h-8 w-8 text-fg-faint" />
          </div>
        )}
        {featured && (
          <span className="absolute top-3 end-3 rounded-full bg-[#0a0a0a]/70 backdrop-blur-md px-2.5 h-6 inline-flex items-center text-[10.5px] font-semibold text-sand">مميّز</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {splitTags(w.tags).length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {splitTags(w.tags).slice(0, 3).map((tg) => (
              <span key={tg} className="rounded border border-white/[0.08] px-2 py-0.5 text-[10.5px] text-fg-secondary">{tg}</span>
            ))}
          </div>
        )}
        <h3 className="font-display font-bold text-[15px] leading-tight line-clamp-1 group-hover:text-primary transition-colors">{w.title}</h3>
        {w.summary && <p className="t-caption text-fg-secondary mt-1.5 line-clamp-2">{w.summary}</p>}
      </div>
    </a>
  );
}

function EmptyWorks() {
  return (
    <div className="grid place-items-center rounded-[14px] border border-dashed border-white/[0.12] py-16 text-center">
      <div>
        <Briefcase className="mx-auto h-8 w-8 text-fg-faint" />
        <p className="mt-4 t-body text-fg-secondary">لم تُضِف أعمالًا بعد.</p>
      </div>
    </div>
  );
}

/* ─────────── B-3 Announcements ─────────── */

function sortAnnouncements(a: Announcement, b: Announcement) {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  return b.date.localeCompare(a.date);
}

function TypeBadge({ type }: { type: Announcement["type"] }) {
  const map: Record<Announcement["type"], { label: string; cls: string }> = {
    urgent: { label: "عاجل", cls: "bg-primary/15 text-primary" },
    event: { label: "فعاليّة", cls: "bg-sand/15 text-sand" },
    info: { label: "معلومة", cls: "bg-white/[0.06] text-fg-secondary" },
  };
  const m = map[type];
  return <span className={`shrink-0 rounded-full px-2.5 h-6 inline-flex items-center text-[10.5px] font-semibold ${m.cls}`}>{m.label}</span>;
}

function Announcements() {
  const list = [...ANNOUNCEMENTS].sort(sortAnnouncements);
  return (
    <div>
      <SectionTitle count={list.length}>التعميمات</SectionTitle>
      <div className="space-y-3">
        {list.map((a) => (
          <div
            key={a.id}
            className={`rounded-[14px] border bg-white/[0.03] p-5 ${
              a.pinned ? "border-white/[0.08] border-e-2 border-e-primary bg-primary/[0.04]" : "border-white/[0.08]"
            } ${a.type === "urgent" ? "ring-1 ring-primary/25" : ""}`}
          >
            <div className="flex items-center gap-3 mb-2.5">
              <TypeBadge type={a.type} />
              <span className="t-caption text-fg-faint tnum" dir="ltr">{a.date}</span>
              {a.pinned && <span className="ms-auto inline-flex items-center gap-1 text-[11px] text-primary">مثبّت</span>}
            </div>
            <h3 className="font-display font-bold text-[17px]">{a.title}</h3>
            <p className="t-body text-[14px] text-fg-secondary mt-1.5">{a.body}</p>
            <p className="t-caption text-fg-faint mt-3">{a.author}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────── B-4 Schedule ─────────── */

const STATUS_STYLE: Record<ScheduleDay["status"], string> = {
  حاضر: "text-emerald-400",
  غائب: "text-primary",
  إجازة: "text-fg-secondary",
  "في الحاضنة الآن": "text-sand",
};

function Schedule() {
  const s = WEEKLY_SCHEDULE;
  return (
    <div>
      <SectionTitle>جدول الدوام</SectionTitle>
      <p className="t-caption text-fg-secondary -mt-3 mb-5">{s.week}</p>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[13.5px]">
            <thead>
              <tr className="border-b border-white/[0.08] text-fg-faint">
                {["اليوم", "التاريخ", "الدخول", "الخروج", "الساعات", "الحالة"].map((h) => (
                  <th key={h} className="px-4 py-3 text-start font-mono text-[11px] uppercase tracking-wider font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.days.map((d) => {
                const current = d.status === "في الحاضنة الآن";
                return (
                  <tr key={d.day} className={`border-b border-white/[0.05] last:border-0 ${current ? "bg-sand/[0.06]" : ""}`}>
                    <td className="px-4 py-3 font-medium">{d.day}</td>
                    <td className="px-4 py-3 tnum text-fg-secondary">{d.date}</td>
                    <td className="px-4 py-3 tnum" dir="ltr">{d.checkin ?? "—"}</td>
                    <td className="px-4 py-3 tnum" dir="ltr">{d.checkout ?? "—"}</td>
                    <td className="px-4 py-3 tnum text-fg-secondary">{d.hours != null ? ar(d.hours) : "—"}</td>
                    <td className={`px-4 py-3 font-semibold ${STATUS_STYLE[d.status]}`}>
                      <span className="inline-flex items-center gap-1.5">
                        {current && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sand motion-safe:animate-pulse" />}
                        {d.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Chip label="حاضر" value={`${ar(s.monthlySummary.present)} يوم`} />
        <Chip label="غائب" value={`${ar(s.monthlySummary.absent)} يوم`} />
        <Chip label="إجازة" value={`${ar(s.monthlySummary.holiday)} أيّام`} />
        <Chip label="الإجماليّ" value={`${ar(s.monthlySummary.totalHours)} ساعة`} />
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <Card className="px-4 py-3 text-center">
      <div className="font-mono font-bold text-foreground text-[15px]">{value}</div>
      <div className="t-caption text-fg-faint mt-0.5">{label}</div>
    </Card>
  );
}

/* ─────────── B-5 Profile Data ─────────── */

function ProfileData({ member }: { member: MemberPrivate }) {
  const skills = splitTags(member.skills);
  const initial = member.fullName.trim().charAt(0);
  const links: { label: string; value: string }[] = [
    { label: "البريد الإلكترونيّ", value: member.email },
    { label: "الهاتف", value: member.phone },
    ...(member.githubUrl ? [{ label: "GitHub", value: member.githubUrl }] : []),
    ...(member.linkedinUrl ? [{ label: "LinkedIn", value: member.linkedinUrl }] : []),
    ...(member.behanceUrl ? [{ label: "Behance", value: member.behanceUrl }] : []),
    ...(member.portfolioUrl ? [{ label: "محفظة الأعمال", value: member.portfolioUrl }] : []),
  ];
  const membership: { label: string; value: string }[] = [
    { label: "تاريخ الانتساب", value: member.memberSince },
    { label: "نوع العضويّة", value: member.membershipType },
    { label: "رقم المكتب", value: member.deskNumber },
    { label: "ساعات الوصول", value: member.accessHours },
  ];

  return (
    <div>
      <SectionTitle>بياناتي</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        {/* Right (first in RTL): identity */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            {member.avatarUrl ? (
              <img src={member.avatarUrl} alt={member.fullName} className="h-16 w-16 rounded-full object-cover ring-1 ring-sand/30" />
            ) : (
              <span className="grid h-16 w-16 place-items-center rounded-full border border-white/[0.08] bg-white/[0.03] font-display font-black text-sand-bright text-2xl">{initial}</span>
            )}
            <div className="min-w-0">
              <h3 className="font-display font-bold text-[18px] leading-tight">{member.fullName}</h3>
              {member.jobTitle && <p className="t-caption text-sand mt-0.5">{member.jobTitle}</p>}
            </div>
          </div>
          {member.bio && <p className="t-body text-[14px] mt-4">{member.bio}</p>}
          {skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span key={s} className="rounded border border-white/[0.08] px-2 py-0.5 text-[11px] text-fg-secondary">{s}</span>
              ))}
            </div>
          )}
        </Card>

        {/* Left: contact + membership tables */}
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-display font-bold text-[15px] mb-4">معلومات التواصل</h3>
            <ul className="space-y-3 text-[13.5px]">
              {links.map((l) => (
                <li key={l.label} className="flex items-center justify-between gap-3">
                  <span className="text-fg-secondary">{l.label}</span>
                  <span className="font-medium truncate max-w-[200px]" dir="ltr">{l.value}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-6">
            <h3 className="font-display font-bold text-[15px] mb-4">معلومات العضويّة</h3>
            <ul className="space-y-3 text-[13.5px]">
              {membership.map((l) => (
                <li key={l.label} className="flex items-center justify-between gap-3">
                  <span className="text-fg-secondary">{l.label}</span>
                  <span className="font-medium tnum" dir="ltr">{l.value}</span>
                </li>
              ))}
              <li className="flex items-center justify-between gap-3">
                <span className="text-fg-secondary">كلمة مرور Wi-Fi</span>
                <WifiInline password={member.wifiPassword} />
              </li>
            </ul>
            <p className="t-caption text-fg-faint mt-5 pt-4 border-t border-white/[0.06]">
              لتعديل بياناتك تواصل مع الإدارة عبر island-haven@nastonas.org
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function WifiInline({ password }: { password: string }) {
  const [show, setShow] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setShow((v) => !v)}
      aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
      className="inline-flex items-center gap-1.5 font-mono text-[12px] font-medium hover:text-primary transition-colors"
    >
      <span dir="ltr">{show ? password : "••••••••"}</span>
      {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
    </button>
  );
}

/* ─────────── states ─────────── */

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-1/3 rounded bg-white/[0.05]" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-[14px] bg-white/[0.04]" />
        ))}
      </div>
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-4">
        <div className="h-48 rounded-[14px] bg-white/[0.04]" />
        <div className="h-48 rounded-[14px] bg-white/[0.04]" />
      </div>
    </div>
  );
}

function MemberPicker() {
  const [val, setVal] = useState("88");
  return (
    <div dir="rtl" className="grid min-h-screen place-items-center bg-[#080808] text-[#F2EDE6] p-6" style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}>
      <div className="w-full max-w-sm text-center">
        <span className="grid mx-auto h-12 w-12 place-items-center rounded-xl bg-[#0a0a0a] border border-white/10">
          <span className="font-display font-black text-primary text-xl">آ</span>
        </span>
        <h1 className="font-display font-bold text-2xl mt-5">بوابة المنتسبين</h1>
        <p className="t-caption text-fg-secondary mt-2">أدخل رقم المنتسب للدخول (وضع التطوير).</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const id = Number(val);
            if (Number.isFinite(id) && id > 0) window.location.search = `?member=${id}`;
          }}
          className="mt-6 flex gap-2"
        >
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            inputMode="numeric"
            aria-label="رقم المنتسب"
            placeholder="٨٨"
            className="flex-1 rounded-lg border border-white/[0.12] bg-white/[0.03] px-4 py-3 text-center text-foreground tnum focus:border-primary focus:outline-none"
          />
          <button type="submit" className="cta-fill rounded-lg px-5 py-3 text-[14px] font-semibold">دخول</button>
        </form>
        <Link href="/" className="inline-flex items-center gap-1.5 mt-6 text-[13px] text-fg-secondary hover:text-foreground transition-colors">
          العودة للموقع
          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}
