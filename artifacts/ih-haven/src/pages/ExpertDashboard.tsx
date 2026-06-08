import { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Save,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  User as UserIcon,
} from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  formatArabicDateTime,
  SESSION_STATUS_LABELS,
  SESSION_MODE_LABELS,
  type SessionStatus,
  type SessionMode,
} from "@/lib/labels";

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
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"sessions" | "profile">("sessions");
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [notExpert, setNotExpert] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const r = await api<{ profile: ExpertProfile }>("/experts/me/profile");
      setProfile(r.profile);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setNotExpert(true);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const r = await api<{ sessions: SessionRow[] }>("/experts/me/sessions");
      setSessions(r.sessions);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setNotExpert(true);
    }
  }, []);

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
        eyebrow="لوحة الخبير"
        title="هذه اللوحة"
        highlight="للخبراء فقط"
      >
        <EmptyState
          title="حسابك ليس حساب خبير"
          hint="إن كنت ترغب بالانضمام كخبير/مرشد في آيلاند، تواصل مع الإدارة."
          action={
            <Link
              href="/experts"
              className="inline-block px-5 py-2.5 rounded-full bg-primary text-white text-[13px] font-semibold"
            >
              تصفّح الخبراء
            </Link>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      active="experts"
      eyebrow={`أهلًا ${user?.fullName ?? ""}`}
      title="لوحة"
      highlight="الخبير"
      subtitle="أدِر ملفّك الإرشاديّ وتابع طلبات الجلسات الواردة من المجتمع."
    >
      <div className="flex items-center gap-2 mb-7">
        {(
          [
            { k: "sessions", label: "طلبات الجلسات" },
            { k: "profile", label: "ملفّي الإرشاديّ" },
          ] as const
        ).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`px-4 py-1.5 rounded-full text-[12.5px] font-semibold border transition-colors ${
              tab === t.k
                ? "bg-primary/20 text-white border-primary/40"
                : "bg-white/[0.04] text-white/65 border-white/10 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "sessions" ? (
        <SessionsPanel sessions={sessions} onChanged={loadSessions} />
      ) : (
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
            className="h-28 rounded-[20px] bg-white/[0.035] border border-white/10 animate-pulse"
          />
        ))}
      </div>
    );
  }
  if (sessions.length === 0) {
    return (
      <EmptyState
        title="لا توجد طلبات بعد"
        hint="ستظهر هنا طلبات الجلسات من أعضاء المجتمع."
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
                    <img
                      src={row.menteeAvatar}
                      alt={row.menteeName}
                      className="w-10 h-10 rounded-xl object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white/50" />
                    </div>
                  )}
                  <div>
                    <div className="text-white font-semibold text-[14px]">
                      {row.menteeName}
                    </div>
                    <div className="text-white/45 text-[11.5px]">
                      {formatArabicDateTime(s.createdAt)}
                    </div>
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </div>

              <div className="text-white font-semibold text-[14.5px] mb-1">
                {s.topic}
              </div>
              {s.message && (
                <p className="text-white/60 text-[13px] leading-[1.7] mb-3">
                  {s.message}
                </p>
              )}
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-white/55 mb-3">
                <span>النوع: {SESSION_MODE_LABELS[s.mode]}</span>
                {s.preferredAt && (
                  <span>الوقت المقترح: {formatArabicDateTime(s.preferredAt)}</span>
                )}
              </div>

              {(pending || confirmed) && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.06]">
                  {pending && (
                    <>
                      <button
                        onClick={() => act(s.id, "confirmed")}
                        disabled={busyId === s.id}
                        className="px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-200 border border-emerald-500/30 text-[12.5px] font-semibold hover:bg-emerald-500/25 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> تأكيد
                      </button>
                      <button
                        onClick={() => act(s.id, "declined")}
                        disabled={busyId === s.id}
                        className="px-4 py-2 rounded-xl bg-white/[0.05] text-white/70 border border-white/10 text-[12.5px] font-semibold hover:bg-red-500/10 hover:text-red-200 hover:border-red-500/30 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" /> رفض
                      </button>
                    </>
                  )}
                  {confirmed && (
                    <button
                      onClick={() => act(s.id, "completed")}
                      disabled={busyId === s.id}
                      className="px-4 py-2 rounded-xl bg-primary/15 text-primary border border-primary/30 text-[12.5px] font-semibold hover:bg-primary/25 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" /> تمّت الجلسة
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
  const styles: Record<SessionStatus, string> = {
    requested: "bg-amber-400/10 text-amber-200 border-amber-400/30",
    confirmed: "bg-emerald-500/10 text-emerald-200 border-emerald-500/30",
    completed: "bg-primary/15 text-primary border-primary/30",
    declined: "bg-white/[0.05] text-white/50 border-white/10",
    cancelled: "bg-white/[0.05] text-white/50 border-white/10",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.12em] uppercase font-semibold border ${styles[status]}`}
    >
      {SESSION_STATUS_LABELS[status]}
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
  const [form, setForm] = useState<ExpertProfile | null>(profile);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  if (!form) {
    return (
      <div className="h-96 rounded-[24px] bg-white/[0.035] border border-white/10 animate-pulse" />
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
      setFlash("تمّ حفظ ملفّك.");
      setTimeout(() => setFlash(null), 3000);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحفظ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassCard className="p-6 sm:p-8 max-w-2xl">
      {form.status !== "active" && (
        <div className="mb-5 rounded-xl px-4 py-3 bg-amber-400/10 border border-amber-400/30 text-amber-100 text-[12.5px] leading-[1.7]">
          ملفّك قيد المراجعة من الإدارة ولن يظهر للعامّة حتى يُفعَّل.
        </div>
      )}
      <div className="space-y-4">
        <DField label="المسمّى التعريفيّ (مثال: مستشار ريادة أعمال)">
          <Input value={form.headline} onChange={(v) => set("headline", v)} max={160} />
        </DField>
        <DField label="مجالات الخبرة (افصل بينها بفاصلة)">
          <Input
            value={form.expertise}
            onChange={(v) => set("expertise", v)}
            max={400}
            placeholder="ريادة أعمال، تسويق رقميّ، تصميم منتجات"
          />
        </DField>
        <DField label="نبذة تعريفيّة">
          <textarea
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            rows={5}
            maxLength={4000}
            className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3.5 py-2.5 text-[13.5px] text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none resize-none"
          />
        </DField>
        <div className="grid grid-cols-2 gap-4">
          <DField label="سنوات الخبرة">
            <input
              type="number"
              min={0}
              max={80}
              value={form.yearsExperience}
              onChange={(e) => set("yearsExperience", Number(e.target.value))}
              className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3.5 py-2.5 text-[13.5px] text-white focus:border-primary/50 focus:outline-none"
            />
          </DField>
          <DField label="مدّة الجلسة (دقيقة)">
            <input
              type="number"
              min={10}
              max={480}
              value={form.sessionMinutes}
              onChange={(e) => set("sessionMinutes", Number(e.target.value))}
              className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3.5 py-2.5 text-[13.5px] text-white focus:border-primary/50 focus:outline-none"
            />
          </DField>
        </div>
        <DField label="اللغات (افصل بينها بفاصلة)">
          <Input value={form.languages} onChange={(v) => set("languages", v)} max={160} placeholder="العربية، الإنجليزية" />
        </DField>
        <DField label="ملاحظة عن التوفّر (اختياري)">
          <Input
            value={form.availabilityNote}
            onChange={(v) => set("availabilityNote", v)}
            max={300}
            placeholder="متاح مساء الأحد والثلاثاء"
          />
        </DField>
        <div className="grid grid-cols-2 gap-4">
          <DField label="رابط LinkedIn">
            <Input value={form.linkedinUrl} onChange={(v) => set("linkedinUrl", v)} max={400} placeholder="https://" />
          </DField>
          <DField label="رابط الموقع">
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
          <span className="text-[13.5px] text-white/75">
            أستقبل طلبات جلسات إرشاد جديدة
          </span>
        </label>

        {error && <div className="text-[12.5px] text-red-300">{error}</div>}
        {flash && (
          <div className="text-[12.5px] text-emerald-300 inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> {flash}
          </div>
        )}

        <button
          onClick={save}
          disabled={busy}
          className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-[14px] enabled:hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] enabled:hover:-translate-y-px transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
          data-testid="button-save-expert-profile"
        >
          <Save className="w-4 h-4" />
          {busy ? "…" : "حفظ الملف"}
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
      <span className="block text-[11.5px] text-white/50 font-medium mb-1.5">
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
      className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3.5 py-2.5 text-[13.5px] text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
    />
  );
}
