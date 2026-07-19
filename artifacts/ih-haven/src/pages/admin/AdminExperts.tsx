import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, X, Star, CalendarCheck, Upload, ImageIcon, CheckCircle2, XCircle, Clock, Mail } from "lucide-react";
import { api, ApiError, errorText } from "@/lib/api";

interface Row {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  headline: string;
  expertise: string;
  status: "pending" | "active" | "hidden";
  featured: boolean;
  sortOrder: number;
  acceptingSessions: boolean;
  createdAt: string;
  approvedAt: string | null;
  passwordSetAt: string | null;
  lastLoginAt: string | null;
  sessionsCount: number;
  ref: string | null;
}

const STATUS_LABELS: Record<Row["status"], string> = {
  pending: "بانتظار التفعيل",
  active: "مُفعَّل",
  hidden: "مخفيّ",
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function isNeverLoggedIn(r: Row): boolean {
  if (r.lastLoginAt !== null) return false;
  if (!r.approvedAt) return false;
  return Date.now() - new Date(r.approvedAt).getTime() <= SEVEN_DAYS_MS;
}

type Tab = "active" | "pending" | "hidden";

export default function AdminExperts() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [tab, setTab] = useState<Tab>("active");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [resendLoading, setResendLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  async function reload() {
    try {
      const r = await api<{ experts: Row[] }>("/admin/experts");
      setRows(r.experts);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function onDelete(id: number) {
    if (!window.confirm("إزالة هذا الخبير؟ سيُحوَّل حسابه إلى عضو عاديّ.")) return;
    try {
      await api(`/admin/experts/${id}`, { method: "DELETE" });
      void reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحذف");
    }
  }

  async function setStatus(id: number, status: Row["status"]) {
    setActionLoading(id);
    try {
      await api(`/admin/experts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      void reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر تحديث الحالة");
    } finally {
      setActionLoading(null);
    }
  }

  async function resendSetupLink(id: number) {
    setResendLoading(id);
    setToast(null);
    try {
      await api(`/admin/experts/${id}/resend-setup-link`, { method: "POST" });
      setToast({ kind: "ok", msg: "تمّ إرسال رابط الدخول بنجاح ✓" });
      setTimeout(() => setToast(null), 4000);
    } catch (e) {
      setToast({ kind: "err", msg: e instanceof ApiError ? e.message : "تعذّر الإرسال" });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setResendLoading(null);
    }
  }

  const filtered = rows?.filter((r) => r.status === tab) ?? null;
  const pendingCount = rows?.filter((r) => r.status === "pending").length ?? 0;
  const neverLoggedInCount = rows?.filter((r) => r.status === "active" && isNeverLoggedIn(r)).length ?? 0;

  const TAB_CONFIG: { id: Tab; label: string; badge?: number; badgeColor?: string }[] = [
    { id: "active", label: "المُفعَّلون", badge: neverLoggedInCount, badgeColor: "bg-rose-500" },
    { id: "pending", label: "الطلبات المعلّقة", badge: pendingCount },
    { id: "hidden", label: "المخفيّون" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">
            الخبراء والمرشدون
          </h2>
          <p className="text-[13px] text-foreground/65 mt-1">
            أنشئ حسابات الخبراء وأدِر ملفّاتهم وظهورهم في دليل الإرشاد.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-[hsl(var(--primary-cta))] text-white text-[13px] font-semibold hover:shadow-soft-hover transition-shadow"
          data-testid="button-new-expert"
        >
          <Plus className="w-4 h-4" />
          خبير جديد
        </button>
      </div>

      {error && (
        <div className="rounded-2xl px-4 py-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[13px]">
          {error}
        </div>
      )}

      {toast && (
        <div
          className={`rounded-2xl px-4 py-3 text-[13px] border ${
            toast.kind === "ok"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/15 border-rose-500/30 text-rose-300"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TAB_CONFIG.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full ${t.badgeColor ?? "bg-amber-500"} text-white text-[10px] font-bold px-1`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {filtered === null ? (
          <div className="p-8 text-center text-foreground/60">جارِ التحميل…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-foreground/65 text-[14px]">
            {tab === "pending"
              ? "لا توجد طلبات معلّقة حاليًا."
              : tab === "hidden"
              ? "لا يوجد خبراء مخفيّون."
              : "لم يُضَف أيّ خبير بعد."}
          </div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/40 text-foreground/65 text-[11.5px] tracking-[0.05em] uppercase">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">الخبير</th>
                <th className="text-right px-4 py-3 font-semibold">التخصّص</th>
                {tab !== "pending" && (
                  <th className="text-right px-4 py-3 font-semibold">الجلسات</th>
                )}
                <th className="text-right px-4 py-3 font-semibold">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold w-1">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-border hover:bg-muted/20"
                  data-testid={`admin-expert-row-${r.id}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-semibold text-foreground flex-wrap">
                      {r.featured && (
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      )}
                      {r.fullName}
                      {isNeverLoggedIn(r) && (
                        <button
                          type="button"
                          onClick={() => setEditing(r)}
                          title="لم يُسجَّل الدخول منذ الموافقة — انقر للتفاصيل"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10.5px] font-semibold hover:bg-rose-500/25 transition-colors"
                        >
                          لم يسجّل الدخول بعد
                        </button>
                      )}
                    </div>
                    <div className="text-[11.5px] text-foreground/60 font-normal mt-0.5">
                      {r.email}
                    </div>
                    {tab === "pending" && (
                      <div className="text-[11px] text-foreground/35 mt-0.5">
                        تقدّم بطلبه {new Date(r.createdAt).toLocaleDateString("ar-EG")}
                      </div>
                    )}
                    {tab === "pending" && r.ref && (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10.5px] font-semibold" title="مصدر الإحالة">
                          المصدر: {r.ref}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground/65">
                    {r.headline || r.expertise || "—"}
                  </td>
                  {tab !== "pending" && (
                    <td className="px-4 py-3 text-foreground/65 tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <CalendarCheck className="w-3.5 h-3.5 text-foreground/60" />
                        {r.sessionsCount}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        r.status === "active"
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : r.status === "pending"
                          ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                          : "bg-muted text-foreground/70 border border-border"
                      }`}
                    >
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {tab === "pending" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setStatus(r.id, "active")}
                            disabled={actionLoading === r.id}
                            title="قبول الطلب وتفعيل الحساب"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 disabled:opacity-50 transition-colors"
                            data-testid={`button-approve-expert-${r.id}`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            قبول
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatus(r.id, "hidden")}
                            disabled={actionLoading === r.id}
                            title="رفض الطلب"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 disabled:opacity-50 transition-colors"
                            data-testid={`button-reject-expert-${r.id}`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            رفض
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(r)}
                            aria-label="تعديل الخبير"
                            className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65 hover:text-primary transition-colors"
                            data-testid={`button-edit-expert-${r.id}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          {tab === "hidden" && (
                            <button
                              type="button"
                              onClick={() => setStatus(r.id, "active")}
                              disabled={actionLoading === r.id}
                              title="تفعيل الخبير"
                              aria-label="تفعيل الخبير"
                              className="p-2 rounded-lg hover:bg-emerald-500/15 text-foreground/65 hover:text-emerald-400 disabled:opacity-50 transition-colors"
                              data-testid={`button-activate-expert-${r.id}`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {tab === "active" && (
                            <button
                              type="button"
                              onClick={() => setStatus(r.id, "hidden")}
                              disabled={actionLoading === r.id}
                              title="إخفاء الخبير"
                              aria-label="إخفاء الخبير"
                              className="p-2 rounded-lg hover:bg-amber-400/15 text-foreground/65 hover:text-amber-400 disabled:opacity-50 transition-colors"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {tab === "active" && !r.passwordSetAt && (
                            <button
                              type="button"
                              onClick={() => resendSetupLink(r.id)}
                              disabled={resendLoading === r.id}
                              title="إعادة إرسال رابط الدخول"
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 disabled:opacity-50 transition-colors"
                              data-testid={`button-resend-link-${r.id}`}
                            >
                              <Mail className="w-3.5 h-3.5" />
                              {resendLoading === r.id ? "…" : "إعادة إرسال رابط الدخول"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditing(r)}
                            aria-label="تعديل الخبير"
                            className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65 hover:text-primary transition-colors"
                            data-testid={`button-edit-expert-${r.id}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(r.id)}
                            aria-label="حذف الخبير"
                            className="p-2 rounded-lg hover:bg-rose-500/15 text-foreground/65 hover:text-rose-400 transition-colors"
                            data-testid={`button-delete-expert-${r.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <ExpertEditor
          initialId={editing === "new" ? null : editing.id}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void reload();
          }}
        />
      )}
    </div>
  );
}

interface FormState {
  fullName: string;
  email: string;
  password: string;
  avatarUrl: string;
  ref: string | null;
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
  status: "pending" | "active" | "hidden";
  featured: boolean;
  sortOrder: number;
}

const EMPTY: FormState = {
  fullName: "",
  email: "",
  password: "",
  avatarUrl: "",
  ref: null,
  headline: "",
  expertise: "",
  bio: "",
  yearsExperience: 0,
  languages: "",
  sessionMinutes: 45,
  availabilityNote: "",
  acceptingSessions: true,
  linkedinUrl: "",
  websiteUrl: "",
  status: "active",
  featured: false,
  sortOrder: 0,
};

function ExpertEditor({
  initialId,
  onClose,
  onSaved,
}: {
  initialId: number | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = initialId === null;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isNew) {
      setForm(EMPTY);
      return;
    }
    api<{
      expert: {
        profile: Omit<FormState, "fullName" | "email" | "password" | "avatarUrl"> & { ref?: string | null };
        fullName: string;
        email: string;
        avatarUrl: string | null;
      };
    }>(`/admin/experts/${initialId}`).then((r) => {
      const p = r.expert.profile;
      setForm({
        fullName: r.expert.fullName,
        email: r.expert.email,
        password: "",
        avatarUrl: r.expert.avatarUrl || "",
        ref: p.ref ?? null,
        headline: p.headline || "",
        expertise: p.expertise || "",
        bio: p.bio || "",
        yearsExperience: p.yearsExperience || 0,
        languages: p.languages || "",
        sessionMinutes: p.sessionMinutes || 45,
        availabilityNote: p.availabilityNote || "",
        acceptingSessions: p.acceptingSessions,
        linkedinUrl: p.linkedinUrl || "",
        websiteUrl: p.websiteUrl || "",
        status: p.status,
        featured: p.featured,
        sortOrder: p.sortOrder || 0,
      });
    });
  }, [initialId, isNew]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setIssues({});
    try {
      const profile = {
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
        status: form.status,
        featured: form.featured,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (isNew) {
        await api("/admin/experts", {
          method: "POST",
          body: JSON.stringify({
            fullName: form.fullName,
            email: form.email,
            password: form.password,
            avatarUrl: form.avatarUrl || null,
            profile,
          }),
        });
      } else {
        await api(`/admin/experts/${initialId}`, {
          method: "PATCH",
          body: JSON.stringify({ ...profile, avatarUrl: form.avatarUrl || null }),
        });
      }
      onSaved();
    } catch (e) {
      if (e instanceof ApiError && e.data && typeof e.data === "object") {
        const d = e.data as {
          error?: string;
          details?: Array<{ field: string; message: string }>;
        };
        setError(e.message || "تعذّر الحفظ");
        if (Array.isArray(d.details)) {
          const m: Record<string, string> = {};
          for (const i of d.details) m[i.field] = i.message;
          setIssues(m);
        }
      } else {
        setError("تعذّر الاتّصال بالخادم");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-6">
      <div className="bg-card rounded-3xl border border-border w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="text-[16px] font-bold text-foreground">
            {isNew ? "خبير جديد" : "تعديل الخبير"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} noValidate className="p-6 space-y-4">
          {isNew && (
            <div className="rounded-xl bg-primary-soft/40 border border-primary/15 p-4 space-y-4">
              <div className="text-[12px] font-bold text-primary">
                بيانات حساب الدخول
              </div>
              <Field label="الاسم الكامل" error={issues.fullName}>
                <input
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, fullName: e.target.value }))
                  }
                  className="w-full bg-transparent outline-none text-[14px]"
                  data-testid="input-expert-name"
                  maxLength={120}
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="البريد الإلكترونيّ" error={issues.email}>
                  <input
                    dir="ltr"
                    value={form.email}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, email: e.target.value }))
                    }
                    className="w-full bg-transparent outline-none text-[14px]"
                    data-testid="input-expert-email"
                    maxLength={160}
                  />
                </Field>
                <Field label="كلمة السرّ" error={issues.password}>
                  <input
                    dir="ltr"
                    type="text"
                    value={form.password}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, password: e.target.value }))
                    }
                    className="w-full bg-transparent outline-none text-[14px]"
                    placeholder="8 أحرف فأكثر"
                    maxLength={200}
                  />
                </Field>
              </div>
            </div>
          )}

          {!isNew && form.ref && (
            <div className="rounded-xl border border-sky-500/30 bg-sky-500/15 px-4 py-3 flex items-center gap-2">
              <span className="text-[12px] font-semibold text-sky-300/80">مصدر الطلب</span>
              <span className="text-[13px] font-semibold text-sky-300 dir-ltr" dir="ltr">{form.ref}</span>
            </div>
          )}

          <Field label="المسمّى التعريفيّ" error={issues.headline}>
            <input
              value={form.headline}
              onChange={(e) =>
                setForm((s) => ({ ...s, headline: e.target.value }))
              }
              className="w-full bg-transparent outline-none text-[14px]"
              placeholder="مستشار ريادة أعمال"
              maxLength={160}
            />
          </Field>
          <Field label="مجالات الخبرة (مفصولة بفاصلة)" error={issues.expertise}>
            <input
              value={form.expertise}
              onChange={(e) =>
                setForm((s) => ({ ...s, expertise: e.target.value }))
              }
              className="w-full bg-transparent outline-none text-[14px]"
              placeholder="ريادة أعمال، تسويق، تصميم"
              maxLength={400}
            />
          </Field>
          <Field label="نبذة تعريفيّة" error={issues.bio}>
            <textarea
              rows={4}
              value={form.bio}
              onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value }))}
              className="w-full bg-transparent outline-none text-[14px] resize-none leading-[1.85]"
              maxLength={4000}
            />
          </Field>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="سنوات الخبرة" error={issues.yearsExperience}>
              <input
                type="number"
                min={0}
                max={80}
                value={form.yearsExperience}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    yearsExperience: Number(e.target.value) || 0,
                  }))
                }
                className="w-full bg-transparent outline-none text-[14px] tabular-nums"
              />
            </Field>
            <Field label="مدّة الجلسة (دقيقة)" error={issues.sessionMinutes}>
              <input
                type="number"
                min={10}
                max={480}
                value={form.sessionMinutes}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    sessionMinutes: Number(e.target.value) || 45,
                  }))
                }
                className="w-full bg-transparent outline-none text-[14px] tabular-nums"
              />
            </Field>
            <Field label="الترتيب" error={issues.sortOrder}>
              <input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    sortOrder: Number(e.target.value) || 0,
                  }))
                }
                className="w-full bg-transparent outline-none text-[14px] tabular-nums"
              />
            </Field>
          </div>
          <Field label="اللغات (مفصولة بفاصلة)" error={issues.languages}>
            <input
              value={form.languages}
              onChange={(e) =>
                setForm((s) => ({ ...s, languages: e.target.value }))
              }
              className="w-full bg-transparent outline-none text-[14px]"
              placeholder="العربية، الإنجليزية"
              maxLength={160}
            />
          </Field>
          <Field label="ملاحظة التوفّر" error={issues.availabilityNote}>
            <input
              value={form.availabilityNote}
              onChange={(e) =>
                setForm((s) => ({ ...s, availabilityNote: e.target.value }))
              }
              className="w-full bg-transparent outline-none text-[14px]"
              maxLength={300}
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="رابط LinkedIn" error={issues.linkedinUrl}>
              <input
                dir="ltr"
                value={form.linkedinUrl}
                onChange={(e) =>
                  setForm((s) => ({ ...s, linkedinUrl: e.target.value }))
                }
                className="w-full bg-transparent outline-none text-[13.5px]"
                placeholder="https://"
                maxLength={400}
              />
            </Field>
            <Field label="رابط الموقع" error={issues.websiteUrl}>
              <input
                dir="ltr"
                value={form.websiteUrl}
                onChange={(e) =>
                  setForm((s) => ({ ...s, websiteUrl: e.target.value }))
                }
                className="w-full bg-transparent outline-none text-[13.5px]"
                placeholder="https://"
                maxLength={400}
              />
            </Field>
          </div>
          <div>
            <label className="block mb-1.5 text-[12px] text-foreground/65 font-semibold">
              الصورة الشخصيّة (اختياري)
            </label>
            <AvatarUploader
              value={form.avatarUrl}
              name={form.fullName || "؟"}
              onChange={(url) => setForm((s) => ({ ...s, avatarUrl: url }))}
            />
            {issues.avatarUrl && (
              <div className="text-[11.5px] text-rose-400 mt-1 px-1">
                {issues.avatarUrl}
              </div>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="الحالة" error={issues.status}>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    status: e.target.value as FormState["status"],
                  }))
                }
                className="w-full bg-transparent outline-none text-[14px]"
              >
                <option value="active">مُفعَّل</option>
                <option value="pending">بانتظار التفعيل</option>
                <option value="hidden">مخفيّ</option>
              </select>
            </Field>
            <div className="flex flex-col justify-end gap-2.5 pb-1">
              <label className="flex items-center gap-2.5 cursor-pointer text-[13px] text-foreground/75">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, featured: e.target.checked }))
                  }
                  className="w-4 h-4 accent-primary"
                />
                خبير مميّز (يظهر أوّلًا)
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer text-[13px] text-foreground/75">
                <input
                  type="checkbox"
                  checked={form.acceptingSessions}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      acceptingSessions: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 accent-primary"
                />
                يستقبل جلسات
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[13px]">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-11 rounded-full bg-[hsl(var(--primary-cta))] text-white font-semibold text-[13.5px] enabled:hover:shadow-soft-hover transition-shadow disabled:opacity-50"
              data-testid="button-save-expert"
            >
              {submitting ? "جارِ الحفظ…" : isNew ? "إنشاء الخبير" : "حفظ التعديلات"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 h-11 rounded-full bg-muted text-foreground/75 font-semibold text-[13.5px] hover:bg-muted/70 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AvatarUploader({
  value,
  name,
  onChange,
}: {
  value: string;
  name: string;
  onChange: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const initials = name.trim().charAt(0) || "؟";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(errorText(j) || "فشل الرفع");
      }
      const j = await res.json() as { url: string };
      onChange(j.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "فشل الرفع");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden text-[18px] font-bold text-primary shrink-0">
        {value ? (
          <img loading="lazy" decoding="async" src={value} alt={name} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-[12px] font-semibold text-foreground/75 hover:bg-muted/70 disabled:opacity-50 transition-colors"
          >
            {uploading ? (
              <span className="w-3 h-3 rounded-full border border-t-primary animate-spin" />
            ) : (
              <Upload className="w-3 h-3" />
            )}
            {uploading ? "جارِ الرفع…" : "رفع صورة"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-1.5 rounded-lg hover:bg-rose-500/15 text-foreground/60 hover:text-rose-400 transition-colors"
              title="إزالة الصورة"
              aria-label="إزالة الصورة"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        {value && !uploading && (
          <div className="flex items-center gap-1 text-[11px] text-foreground/60">
            <ImageIcon className="w-3 h-3" />
            <span className="truncate max-w-[200px]">{value}</span>
          </div>
        )}
        {uploadError && (
          <p className="text-[11px] text-rose-400">{uploadError}</p>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block mb-1 text-[12px] text-foreground/65 font-semibold">
        {label}
      </label>
      <div
        className={`rounded-xl border px-3 py-2.5 bg-muted/20 transition-colors focus-within:border-primary/50 ${
          error ? "border-rose-400" : "border-border"
        }`}
      >
        {children}
      </div>
      {error && (
        <p className="text-[11.5px] text-rose-400 mt-1 px-0.5">{error}</p>
      )}
    </div>
  );
}
