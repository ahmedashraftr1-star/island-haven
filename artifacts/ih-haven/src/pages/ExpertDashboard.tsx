import { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Save,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  User as UserIcon,
  Plus,
  Trash2,
  Clock,
} from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { useConfirm } from "@/hooks/use-confirm";
import { useAuth } from "@/lib/auth";
import {
  formatArabicDateTime,
  SESSION_STATUS_LABELS,
  SESSION_STATUS_LABELS_EN,
  SESSION_MODE_LABELS,
  SESSION_MODE_LABELS_EN,
  SLOT_STATUS_LABELS,
  type SessionStatus,
  type SessionMode,
  type SlotStatus,
} from "@/lib/labels";

// Localised date-time: Arabic-EG in AR, English-GB in EN.
function formatDateTime(iso: string | null | undefined, lang: Lang): string {
  if (lang === "ar") return formatArabicDateTime(iso);
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// Localised label maps for status/mode (Arabic-only maps live in labels.ts).
function sessionStatusLabel(status: SessionStatus, lang: Lang): string {
  return (lang === "ar" ? SESSION_STATUS_LABELS : SESSION_STATUS_LABELS_EN)[status];
}
function sessionModeLabel(mode: SessionMode, lang: Lang): string {
  return (lang === "ar" ? SESSION_MODE_LABELS : SESSION_MODE_LABELS_EN)[mode];
}
const SLOT_STATUS_LABELS_EN: Record<SlotStatus, string> = {
  available: "Available",
  booked: "Booked",
  cancelled: "Cancelled",
};
function slotStatusLabel(status: SlotStatus, lang: Lang): string {
  return (lang === "ar" ? SLOT_STATUS_LABELS : SLOT_STATUS_LABELS_EN)[status];
}

interface ExpertProfile {
  id: number;
  headline: string;
  expertise: string;
  bio: string;
  yearsExperience: number;
  languages: string;
  sessionMinutes: number;
  availabilityNote: string;
  acceptingSessions: boolean;
  linkedinUrl: string;
  websiteUrl: string;
  status: string;
}

interface SessionRow {
  session: {
    id: number;
    topic: string;
    message: string;
    mode: SessionMode;
    preferredAt: string | null;
    status: SessionStatus;
    expertNote: string;
    createdAt: string;
  };
  menteeName: string;
  menteeAvatar: string | null;
}

export default function ExpertDashboard() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"sessions" | "officehours" | "profile">(
    "sessions",
  );
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [notExpert, setNotExpert] = useState(false);
  // A 404 means "not an expert account" (a real state). Any OTHER failure
  // (500, network, expired session) must surface an error + retry — never get
  // swallowed into a perpetual loading skeleton.
  const [loadError, setLoadError] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const r = await api<{ profile: ExpertProfile }>("/experts/me/profile");
      setProfile(r.profile);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setNotExpert(true);
      else setLoadError(true);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const r = await api<{ sessions: SessionRow[] }>("/experts/me/sessions");
      setSessions(r.sessions);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setNotExpert(true);
      else setLoadError(true);
    }
  }, []);

  const reload = useCallback(() => {
    setLoadError(false);
    void loadProfile();
    void loadSessions();
  }, [loadProfile, loadSessions]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login?next=/expert/dashboard");
      return;
    }
    void loadProfile();
    void loadSessions();
  }, [user, loading, navigate, loadProfile, loadSessions]);

  if (notExpert) {
    return (
      <PageShell
        active="experts"
        eyebrow={t({ ar: "لوحة الخبير", en: "Expert Dashboard" })}
        title={t({ ar: "هذه اللوحة", en: "This dashboard is" })}
        highlight={t({ ar: "للخبراء فقط", en: "for experts only" })}
      >
        <EmptyState
          title={t({ ar: "حسابك ليس حساب خبير", en: "Your account isn't an expert account" })}
          hint={t({
            ar: "إن كنت ترغب بالانضمام كخبير/مرشد في آيلاند، تواصل مع الإدارة.",
            en: "If you'd like to join Island Haven as an expert or mentor, reach out to the team.",
          })}
          action={
            <Link
              href="/experts"
              className="inline-block px-5 py-2.5 rounded-full bg-primary-cta text-white text-[13px] font-semibold"
            >
              {t({ ar: "تصفّح الخبراء", en: "Browse experts" })}
            </Link>
          }
        />
      </PageShell>
    );
  }

  if (loadError) {
    return (
      <PageShell
        active="experts"
        eyebrow={t({ ar: "لوحة الخبير", en: "Expert Dashboard" })}
        title={t({ ar: "تعذّر تحميل", en: "Couldn't load your" })}
        highlight={t({ ar: "اللوحة", en: "dashboard" })}
      >
        <EmptyState
          title={t({ ar: "حدث خطأ أثناء التحميل", en: "Something went wrong while loading" })}
          hint={t({
            ar: "تعذّر جلب بيانات لوحتك. تحقّق من اتصالك وحاول مرّة أخرى.",
            en: "We couldn't fetch your dashboard data. Check your connection and try again.",
          })}
          action={
            <button
              type="button"
              onClick={reload}
              className="inline-block px-5 py-2.5 rounded-full bg-primary-cta text-white text-[13px] font-semibold"
            >
              {t({ ar: "إعادة المحاولة", en: "Try again" })}
            </button>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      active="experts"
      eyebrow={t({
        ar: `أهلًا ${user?.fullName ?? ""}`,
        en: `Welcome, ${user?.fullName ?? ""}`,
      })}
      title={t({ ar: "لوحة", en: "Expert" })}
      highlight={t({ ar: "الخبير", en: "Dashboard" })}
      subtitle={t({
        ar: "أدِر ملفّك الإرشاديّ وتابع طلبات الجلسات الواردة من المجتمع.",
        en: "Manage your mentor profile and keep up with session requests from the community.",
      })}
    >
      <div className="flex items-center gap-2 mb-7">
        {(
          [
            { k: "sessions", label: { ar: "طلبات الجلسات", en: "Session requests" } },
            { k: "officehours", label: { ar: "مواعيدي (Office Hours)", en: "My office hours" } },
            { k: "profile", label: { ar: "ملفّي الإرشاديّ", en: "My mentor profile" } },
          ] as const
        ).map((item) => (
          <button
            key={item.k}
            onClick={() => setTab(item.k)}
            className={`px-4 py-1.5 rounded-full text-[12.5px] font-semibold border transition-colors ${
              tab === item.k
                ? "bg-primary/20 text-foreground border-primary/40"
                : "bg-surface-2 text-fg-secondary border-border-strong hover:text-foreground"
            }`}
          >
            {t(item.label)}
          </button>
        ))}
      </div>

      {tab === "sessions" && (
        <SessionsPanel sessions={sessions} onChanged={loadSessions} />
      )}
      {tab === "officehours" && <OfficeHoursPanel />}
      {tab === "profile" && (
        <ProfilePanel profile={profile} onSaved={setProfile} />
      )}
    </PageShell>
  );
}

// ─── Sessions panel ──────────────────────────────────────────────────────────

function SessionsPanel({
  sessions,
  onChanged,
}: {
  sessions: SessionRow[] | null;
  onChanged: () => Promise<void>;
}) {
  const { lang, t } = useLanguage();
  const [busyId, setBusyId] = useState<number | null>(null);

  async function act(id: number, status: SessionStatus) {
    setBusyId(id);
    try {
      await api(`/experts/me/sessions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await onChanged();
    } finally {
      setBusyId(null);
    }
  }

  if (sessions === null) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-28 rounded-[20px] bg-white/[0.035] border border-border-strong animate-pulse"
          />
        ))}
      </div>
    );
  }
  if (sessions.length === 0) {
    return (
      <EmptyState
        title={t({ ar: "لا توجد طلبات بعد", en: "No requests yet" })}
        hint={t({
          ar: "ستظهر هنا طلبات الجلسات من أعضاء المجتمع.",
          en: "Session requests from community members will appear here.",
        })}
      />
    );
  }

  return (
    <div className="space-y-3.5">
      {sessions.map((row, i) => {
        const s = row.session;
        const pending = s.status === "requested";
        const confirmed = s.status === "confirmed";
        return (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <GlassCard className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {row.menteeAvatar ? (
                    <img loading="lazy" decoding="async"
                      src={row.menteeAvatar}
                      alt={row.menteeName}
                      className="w-10 h-10 rounded-xl object-cover border border-border-strong"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border-strong flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="text-foreground font-semibold text-[14px]">
                      {row.menteeName}
                    </div>
                    <div className="text-muted-foreground text-[11.5px]">
                      {formatDateTime(s.createdAt, lang)}
                    </div>
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </div>

              <div className="text-foreground font-semibold text-[14.5px] mb-1">
                {s.topic}
              </div>
              {s.message && (
                <p className="text-muted-foreground text-[13px] leading-[1.7] mb-3">
                  {s.message}
                </p>
              )}
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-muted-foreground mb-3">
                <span>
                  {t({ ar: "النوع:", en: "Type:" })} {sessionModeLabel(s.mode, lang)}
                </span>
                {s.preferredAt && (
                  <span>
                    {t({ ar: "الوقت المقترح:", en: "Preferred time:" })}{" "}
                    {formatDateTime(s.preferredAt, lang)}
                  </span>
                )}
              </div>

              {(pending || confirmed) && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border-strong">
                  {pending && (
                    <>
                      <button
                        onClick={() => act(s.id, "confirmed")}
                        disabled={busyId === s.id}
                        className="px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-200 border border-emerald-500/30 text-[12.5px] font-semibold hover:bg-emerald-500/25 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                        {t({ ar: "تأكيد", en: "Confirm" })}
                      </button>
                      <button
                        onClick={() => act(s.id, "declined")}
                        disabled={busyId === s.id}
                        className="px-4 py-2 rounded-xl bg-surface-2 text-fg-secondary border border-border-strong text-[12.5px] font-semibold hover:bg-red-500/10 hover:text-destructive hover:border-red-500/30 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />{" "}
                        {t({ ar: "رفض", en: "Decline" })}
                      </button>
                    </>
                  )}
                  {confirmed && (
                    <button
                      onClick={() => act(s.id, "completed")}
                      disabled={busyId === s.id}
                      className="px-4 py-2 rounded-xl bg-primary/15 text-primary border border-primary/30 text-[12.5px] font-semibold hover:bg-primary/25 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />{" "}
                      {t({ ar: "تمّت الجلسة", en: "Mark completed" })}
                    </button>
                  )}
                </div>
              )}
            </GlassCard>
          </motion.div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: SessionStatus }) {
  const { lang } = useLanguage();
  const styles: Record<SessionStatus, string> = {
    requested: "bg-amber-400/10 text-amber-200 border-amber-400/30",
    confirmed: "bg-emerald-500/10 text-emerald-200 border-emerald-500/30",
    completed: "bg-primary/15 text-primary border-primary/30",
    declined: "bg-surface-2 text-muted-foreground border-border-strong",
    cancelled: "bg-surface-2 text-muted-foreground border-border-strong",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.12em] uppercase font-semibold border ${styles[status]}`}
    >
      {sessionStatusLabel(status, lang)}
    </span>
  );
}

// ─── Profile panel ───────────────────────────────────────────────────────────

function ProfilePanel({
  profile,
  onSaved,
}: {
  profile: ExpertProfile | null;
  onSaved: (p: ExpertProfile) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<ExpertProfile | null>(profile);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  if (!form) {
    return (
      <div className="h-96 rounded-[24px] bg-white/[0.035] border border-border-strong animate-pulse" />
    );
  }

  function set<K extends keyof ExpertProfile>(k: K, v: ExpertProfile[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  }

  async function save() {
    if (!form || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ profile: ExpertProfile }>("/experts/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          headline: form.headline,
          expertise: form.expertise,
          bio: form.bio,
          yearsExperience: Number(form.yearsExperience) || 0,
          languages: form.languages,
          sessionMinutes: Number(form.sessionMinutes) || 45,
          availabilityNote: form.availabilityNote,
          acceptingSessions: form.acceptingSessions,
          linkedinUrl: form.linkedinUrl,
          websiteUrl: form.websiteUrl,
        }),
      });
      onSaved(r.profile);
      setFlash(t({ ar: "تمّ حفظ ملفّك.", en: "Your profile has been saved." }));
      setTimeout(() => setFlash(null), 3000);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : t({ ar: "تعذّر الحفظ", en: "Couldn't save" }),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassCard className="p-6 sm:p-8 max-w-2xl">
      {form.status !== "active" && (
        <div className="mb-5 rounded-xl px-4 py-3 bg-amber-400/10 border border-amber-400/30 text-amber-100 text-[12.5px] leading-[1.7]">
          {t({
            ar: "ملفّك قيد المراجعة من الإدارة ولن يظهر للعامّة حتى يُفعَّل.",
            en: "Your profile is under review and won't be public until it's activated.",
          })}
        </div>
      )}
      <div className="space-y-4">
        <DField
          label={t({
            ar: "المسمّى التعريفيّ / الشعار (مثال: مستشار ريادة أعمال)",
            en: "Headline / tagline (e.g. Startup advisor)",
          })}
        >
          <Input value={form.headline} onChange={(v) => set("headline", v)} max={160} />
          <p className="mt-1 text-[11.5px] text-muted-foreground leading-relaxed">
            {t({
              ar: "يظهر هذا النصّ أسفل اسمك على بطاقة الحجز وقائمة الخبراء.",
              en: "This appears under your name on your booking card and in the experts list.",
            })}
          </p>
        </DField>
        <DField
          label={t({
            ar: "مجالات الخبرة (افصل بينها بفاصلة)",
            en: "Areas of expertise (comma-separated)",
          })}
        >
          <Input
            value={form.expertise}
            onChange={(v) => set("expertise", v)}
            max={400}
            placeholder={t({
              ar: "ريادة أعمال، تسويق رقميّ، تصميم منتجات",
              en: "Entrepreneurship, digital marketing, product design",
            })}
          />
        </DField>
        <DField label={t({ ar: "نبذة تعريفيّة", en: "About you" })}>
          <textarea
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            rows={5}
            maxLength={4000}
            className="w-full rounded-xl bg-surface-2 border border-border-strong px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none resize-none"
          />
        </DField>
        <div className="grid grid-cols-2 gap-4">
          <DField label={t({ ar: "سنوات الخبرة", en: "Years of experience" })}>
            <input
              type="number"
              min={0}
              max={80}
              value={form.yearsExperience}
              onChange={(e) => set("yearsExperience", Number(e.target.value))}
              className="w-full rounded-xl bg-surface-2 border border-border-strong px-3.5 py-2.5 text-[13.5px] text-foreground focus:border-primary/50 focus:outline-none"
            />
          </DField>
          <DField label={t({ ar: "مدّة الجلسة (دقيقة)", en: "Session length (minutes)" })}>
            <input
              type="number"
              min={10}
              max={480}
              value={form.sessionMinutes}
              onChange={(e) => set("sessionMinutes", Number(e.target.value))}
              className="w-full rounded-xl bg-surface-2 border border-border-strong px-3.5 py-2.5 text-[13.5px] text-foreground focus:border-primary/50 focus:outline-none"
            />
          </DField>
        </div>
        <DField label={t({ ar: "اللغات (افصل بينها بفاصلة)", en: "Languages (comma-separated)" })}>
          <Input
            value={form.languages}
            onChange={(v) => set("languages", v)}
            max={160}
            placeholder={t({ ar: "العربية، الإنجليزية", en: "Arabic, English" })}
          />
        </DField>
        <DField label={t({ ar: "ملاحظة عن التوفّر (اختياري)", en: "Availability note (optional)" })}>
          <Input
            value={form.availabilityNote}
            onChange={(v) => set("availabilityNote", v)}
            max={300}
            placeholder={t({
              ar: "متاح مساء الأحد والثلاثاء",
              en: "Available Sunday and Tuesday evenings",
            })}
          />
        </DField>
        <div className="grid grid-cols-2 gap-4">
          <DField label={t({ ar: "رابط LinkedIn", en: "LinkedIn URL" })}>
            <Input value={form.linkedinUrl} onChange={(v) => set("linkedinUrl", v)} max={400} placeholder="https://" />
          </DField>
          <DField label={t({ ar: "رابط الموقع", en: "Website URL" })}>
            <Input value={form.websiteUrl} onChange={(v) => set("websiteUrl", v)} max={400} placeholder="https://" />
          </DField>
        </div>

        <label className="flex items-center gap-3 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={form.acceptingSessions}
            onChange={(e) => set("acceptingSessions", e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-[13.5px] text-fg-secondary">
            {t({
              ar: "أستقبل طلبات جلسات إرشاد جديدة",
              en: "I'm accepting new mentorship session requests",
            })}
          </span>
        </label>

        {error && <div className="text-[12.5px] text-destructive">{error}</div>}
        {flash && (
          <div className="text-[12.5px] text-emerald-300 inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> {flash}
          </div>
        )}

        <button
          onClick={save}
          disabled={busy}
          className="w-full py-3.5 rounded-2xl bg-primary-cta text-white font-bold text-[14px] enabled:hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] enabled:hover:-translate-y-px transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
          data-testid="button-save-expert-profile"
        >
          <Save className="w-4 h-4" />
          {busy ? "…" : t({ ar: "حفظ الملف", en: "Save profile" })}
        </button>
      </div>
    </GlassCard>
  );
}

function DField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11.5px] text-muted-foreground font-medium mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  max,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  max?: number;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={max}
      placeholder={placeholder}
      className="w-full rounded-xl bg-surface-2 border border-border-strong px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
    />
  );
}

// ─── Office Hours panel (expert manages their own availability slots) ──────────

interface Slot {
  id: number;
  startAt: string;
  endAt: string;
  mode: SessionMode;
  location: string;
  status: SlotStatus;
  note: string;
}

const SLOT_BADGE: Record<SlotStatus, string> = {
  available: "bg-emerald-500/10 text-emerald-200 border-emerald-500/30",
  booked: "bg-primary/15 text-primary border-primary/30",
  cancelled: "bg-surface-2 text-fg-faint border-border-strong",
};

const inputCls =
  "w-full rounded-xl bg-surface-2 border border-border-strong px-3 py-2.5 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none";

function OfficeHoursPanel() {
  const { lang, t } = useLanguage();
  const confirm = useConfirm();
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [mode, setMode] = useState<SessionMode>("online");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api<{ slots: Slot[] }>("/experts/me/slots");
      setSlots(r.slots);
    } catch {
      setSlots([]);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  // When the expert picks a start, default the end to +60 min for convenience.
  function onStartChange(v: string) {
    setStartAt(v);
    if (v && !endAt) {
      const d = new Date(v);
      d.setMinutes(d.getMinutes() + 60);
      const p = (n: number) => String(n).padStart(2, "0");
      setEndAt(
        `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`,
      );
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      if (!startAt || !endAt)
        throw new Error(
          t({ ar: "اختر وقت البداية والنهاية", en: "Pick a start and end time" }),
        );
      await api("/experts/me/slots", {
        method: "POST",
        body: JSON.stringify({
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          mode,
          location: mode === "onsite" ? location : "",
          note,
        }),
      });
      setStartAt("");
      setEndAt("");
      setLocation("");
      setNote("");
      await load();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : t({ ar: "تعذّر الإضافة", en: "Couldn't add" }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: number) {
    const ok = await confirm({
      title: t({ ar: "تأكيد الحذف", en: "Confirm deletion" }),
      message: t({ ar: "حذف هذا الموعد؟", en: "Delete this slot?" }),
      confirmLabel: t({ ar: "حذف", en: "Delete" }),
      cancelLabel: t({ ar: "إلغاء", en: "Cancel" }),
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/experts/me/slots/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : t({ ar: "تعذّر الحذف", en: "Couldn't delete" }),
      );
    }
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-foreground font-bold text-[15px]">
            {t({ ar: "أضِف موعدًا متاحًا", en: "Add an available slot" })}
          </h3>
        </div>
        <form onSubmit={add} className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="block mb-1.5 text-[12px] text-muted-foreground font-semibold">
              {t({ ar: "من", en: "From" })}
            </span>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => onStartChange(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="block mb-1.5 text-[12px] text-muted-foreground font-semibold">
              {t({ ar: "إلى", en: "To" })}
            </span>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="block mb-1.5 text-[12px] text-muted-foreground font-semibold">
              {t({ ar: "النّوع", en: "Type" })}
            </span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as SessionMode)}
              className={inputCls}
            >
              <option value="online">{sessionModeLabel("online", lang)}</option>
              <option value="onsite">{sessionModeLabel("onsite", lang)}</option>
            </select>
          </label>
          {mode === "onsite" && (
            <label className="block">
              <span className="block mb-1.5 text-[12px] text-muted-foreground font-semibold">
                {t({ ar: "المكان", en: "Location" })}
              </span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={400}
                placeholder={t({ ar: "آيلاند هيفن — غزّة", en: "Island Haven — Gaza" })}
                className={inputCls}
              />
            </label>
          )}
          <label className="block sm:col-span-2">
            <span className="block mb-1.5 text-[12px] text-muted-foreground font-semibold">
              {t({ ar: "ملاحظة (اختياري)", en: "Note (optional)" })}
            </span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              className={inputCls}
            />
          </label>
          {error && (
            <div className="sm:col-span-2 text-destructive text-[12.5px]">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="sm:col-span-2 inline-flex items-center justify-center gap-2 h-11 rounded-full bg-primary-cta text-white font-semibold text-[13.5px] disabled:opacity-50 hover:-translate-y-px transition-transform"
          >
            <Plus className="w-4 h-4" />
            {submitting
              ? t({ ar: "جارِ الإضافة…", en: "Adding…" })
              : t({ ar: "إضافة الموعد", en: "Add slot" })}
          </button>
        </form>
      </GlassCard>

      <div>
        <h3 className="text-foreground font-bold text-[15px] mb-3">
          {t({ ar: "مواعيدي", en: "My slots" })}
        </h3>
        {slots === null ? (
          <div className="text-fg-secondary text-[13px] py-8 text-center">
            {t({ ar: "جارِ التحميل…", en: "Loading…" })}
          </div>
        ) : slots.length === 0 ? (
          <EmptyState
            title={t({ ar: "لا مواعيد بعد", en: "No slots yet" })}
            hint={t({
              ar: "أضف أوّل موعد متاح ليحجزه المنتسبون.",
              en: "Add your first available slot for members to book.",
            })}
          />
        ) : (
          <div className="space-y-2.5">
            {slots.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 bg-surface-2 border border-border-strong"
              >
                <div className="min-w-0">
                  <div className="text-foreground text-[13.5px] font-semibold">
                    {formatDateTime(s.startAt, lang)}
                  </div>
                  <div className="text-muted-foreground text-[11.5px] truncate">
                    {sessionModeLabel(s.mode, lang)}
                    {s.location ? ` · ${s.location}` : ""}
                    {s.note ? ` · ${s.note}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] tracking-[0.1em] uppercase font-semibold border ${SLOT_BADGE[s.status]}`}
                  >
                    {slotStatusLabel(s.status, lang)}
                  </span>
                  {s.status !== "booked" && (
                    <button
                      onClick={() => remove(s.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title={t({ ar: "حذف", en: "Delete" })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
