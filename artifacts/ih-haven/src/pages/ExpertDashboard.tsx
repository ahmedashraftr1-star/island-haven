import { useEffect, useState, useCallback, useRef } from "react";
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
  Camera,
  X,
} from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  formatArabicDateTime,
  SESSION_STATUS_LABELS,
  SESSION_MODE_LABELS,
  SLOT_STATUS_LABELS,
  type SessionStatus,
  type SessionMode,
  type SlotStatus,
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
  avatarUrl: string | null;
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
  const [tab, setTab] = useState<"sessions" | "officehours" | "profile">(
    "sessions",
  );
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
            { k: "officehours", label: "مواعيدي (Office Hours)" },
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
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [confirmAvatarOpen, setConfirmAvatarOpen] = useState(false);
  const [confirmRemoveAvatarOpen, setConfirmRemoveAvatarOpen] = useState(false);
  const [avatarRemoving, setAvatarRemoving] = useState(false);

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

  async function doAvatarUpload(file: File) {
    setAvatarError(null);
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/uploads/image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!uploadRes.ok) {
        const d = await uploadRes.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error || "تعذّر رفع الصورة");
      }
      const { url } = (await uploadRes.json()) as { url: string };
      const patchRes = await fetch("/api/experts/me/avatar", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });
      if (!patchRes.ok) {
        throw new Error("تعذّر حفظ الصورة");
      }
      setForm((f) => (f ? { ...f, avatarUrl: url } : f));
      onSaved({ ...form!, avatarUrl: url });
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "تعذّر رفع الصورة");
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function doAvatarRemove() {
    setAvatarError(null);
    setAvatarRemoving(true);
    try {
      const patchRes = await fetch("/api/experts/me/avatar", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: null }),
      });
      if (!patchRes.ok) {
        throw new Error("تعذّر حذف الصورة");
      }
      setForm((f) => (f ? { ...f, avatarUrl: null } : f));
      onSaved({ ...form!, avatarUrl: null });
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "تعذّر حذف الصورة");
    } finally {
      setAvatarRemoving(false);
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || avatarUploading) return;
    if (form?.avatarUrl) {
      setPendingAvatarFile(file);
      setConfirmAvatarOpen(true);
    } else {
      doAvatarUpload(file);
    }
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
      onSaved({ ...r.profile, avatarUrl: form.avatarUrl });
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

      {/* ─── Avatar upload ─── */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative shrink-0">
          {form.avatarUrl ? (
            <img
              src={form.avatarUrl}
              alt="صورتك الشخصية"
              className="w-20 h-20 rounded-2xl object-cover border border-white/15"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-white/30" />
            </div>
          )}
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading || avatarRemoving}
            className="absolute -bottom-2 -left-2 w-7 h-7 rounded-full bg-primary border-2 border-[#0A0E1A] flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
            title="تغيير الصورة"
          >
            {avatarUploading ? (
              <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5 text-white" />
            )}
          </button>
          {form.avatarUrl && (
            <button
              type="button"
              onClick={() => setConfirmRemoveAvatarOpen(true)}
              disabled={avatarUploading || avatarRemoving}
              className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[#1a1f35] border border-white/15 flex items-center justify-center hover:bg-red-500/20 hover:border-red-400/40 transition-colors disabled:opacity-50"
              title="حذف الصورة"
            >
              {avatarRemoving ? (
                <span className="w-2.5 h-2.5 border border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <X className="w-3 h-3 text-white/60" />
              )}
            </button>
          )}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p className="text-white/80 text-[13px] font-semibold">الصورة الشخصية</p>
          <p className="text-white/40 text-[11.5px] mt-0.5">JPG · PNG · WEBP — حتى 5 ميغابايت</p>
          {avatarError && (
            <p className="text-red-300 text-[11.5px] mt-1">{avatarError}</p>
          )}
        </div>
      </div>

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

      <AlertDialog open={confirmAvatarOpen} onOpenChange={setConfirmAvatarOpen}>
        <AlertDialogContent
          dir="rtl"
          className="bg-[#0f1424] border border-white/10 text-white rounded-2xl max-w-sm"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-[15px] font-bold">
              استبدال الصورة الشخصية؟
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/55 text-[13px]">
              سيُستبدل صورتك الحالية بالصورة الجديدة. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-1">
            <AlertDialogCancel
              onClick={() => {
                setPendingAvatarFile(null);
                if (avatarInputRef.current) avatarInputRef.current.value = "";
              }}
              className="flex-1 rounded-xl border-white/15 bg-white/[0.06] text-white hover:bg-white/10 hover:text-white"
            >
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingAvatarFile) doAvatarUpload(pendingAvatarFile);
                setPendingAvatarFile(null);
              }}
              className="flex-1 rounded-xl bg-primary text-white hover:bg-primary/90"
            >
              استبدال
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmRemoveAvatarOpen} onOpenChange={setConfirmRemoveAvatarOpen}>
        <AlertDialogContent
          dir="rtl"
          className="bg-[#0f1424] border border-white/10 text-white rounded-2xl max-w-sm"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-[15px] font-bold">
              حذف الصورة الشخصية؟
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/55 text-[13px]">
              ستُحذف صورتك الحالية وتُستبدل بالأيقونة الافتراضية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-1">
            <AlertDialogCancel
              className="flex-1 rounded-xl border-white/15 bg-white/[0.06] text-white hover:bg-white/10 hover:text-white"
            >
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => doAvatarRemove()}
              className="flex-1 rounded-xl bg-red-600 text-white hover:bg-red-500"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  cancelled: "bg-white/[0.05] text-white/45 border-white/10",
};

const inputCls =
  "w-full rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2.5 text-[13.5px] text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none";

function OfficeHoursPanel() {
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
      if (!startAt || !endAt) throw new Error("اختر وقت البداية والنهاية");
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
            : "تعذّر الإضافة",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("حذف هذا الموعد؟")) return;
    try {
      await api(`/experts/me/slots/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحذف");
    }
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-white font-bold text-[15px]">أضِف موعدًا متاحًا</h3>
        </div>
        <form onSubmit={add} className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="block mb-1.5 text-[12px] text-white/55 font-semibold">
              من
            </span>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => onStartChange(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="block mb-1.5 text-[12px] text-white/55 font-semibold">
              إلى
            </span>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="block mb-1.5 text-[12px] text-white/55 font-semibold">
              النّوع
            </span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as SessionMode)}
              className={inputCls}
            >
              <option value="online">{SESSION_MODE_LABELS.online}</option>
              <option value="onsite">{SESSION_MODE_LABELS.onsite}</option>
            </select>
          </label>
          {mode === "onsite" && (
            <label className="block">
              <span className="block mb-1.5 text-[12px] text-white/55 font-semibold">
                المكان
              </span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={400}
                placeholder="آيلاند هيفن — غزّة"
                className={inputCls}
              />
            </label>
          )}
          <label className="block sm:col-span-2">
            <span className="block mb-1.5 text-[12px] text-white/55 font-semibold">
              ملاحظة (اختياري)
            </span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              className={inputCls}
            />
          </label>
          {error && (
            <div className="sm:col-span-2 text-red-300 text-[12.5px]">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="sm:col-span-2 inline-flex items-center justify-center gap-2 h-11 rounded-full bg-primary text-white font-semibold text-[13.5px] disabled:opacity-50 hover:-translate-y-px transition-transform"
          >
            <Plus className="w-4 h-4" />
            {submitting ? "جارِ الإضافة…" : "إضافة الموعد"}
          </button>
        </form>
      </GlassCard>

      <div>
        <h3 className="text-white font-bold text-[15px] mb-3">مواعيدي</h3>
        {slots === null ? (
          <div className="text-white/45 text-[13px] py-8 text-center">
            جارِ التحميل…
          </div>
        ) : slots.length === 0 ? (
          <EmptyState
            title="لا مواعيد بعد"
            hint="أضف أوّل موعد متاح ليحجزه المنتسبون."
          />
        ) : (
          <div className="space-y-2.5">
            {slots.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 bg-white/[0.04] border border-white/[0.07]"
              >
                <div className="min-w-0">
                  <div className="text-white text-[13.5px] font-semibold">
                    {formatArabicDateTime(s.startAt)}
                  </div>
                  <div className="text-white/45 text-[11.5px] truncate">
                    {SESSION_MODE_LABELS[s.mode]}
                    {s.location ? ` · ${s.location}` : ""}
                    {s.note ? ` · ${s.note}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] tracking-[0.1em] uppercase font-semibold border ${SLOT_BADGE[s.status]}`}
                  >
                    {SLOT_STATUS_LABELS[s.status]}
                  </span>
                  {s.status !== "booked" && (
                    <button
                      onClick={() => remove(s.id)}
                      className="text-white/35 hover:text-red-300 transition-colors"
                      title="حذف"
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
