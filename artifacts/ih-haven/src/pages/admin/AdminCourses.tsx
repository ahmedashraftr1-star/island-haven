import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Users } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import {
  COURSE_TYPE_LABELS,
  COURSE_STATUS_LABELS,
  formatArabicDateTime,
  type CourseType,
  type CourseStatus,
} from "@/lib/labels";

interface Row {
  id: number;
  type: CourseType;
  title: string;
  instructor: string;
  startsAt: string | null;
  capacity: number;
  status: CourseStatus;
  enrolled: number;
}

interface FormState {
  type: CourseType;
  title: string;
  summary: string;
  description: string;
  instructor: string;
  coverUrl: string;
  location: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  status: CourseStatus;
}

const EMPTY: FormState = {
  type: "course",
  title: "",
  summary: "",
  description: "",
  instructor: "",
  coverUrl: "",
  location: "",
  startsAt: "",
  endsAt: "",
  capacity: 0,
  status: "draft",
};

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminCourses() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | "new" | null>(null);

  async function reload() {
    try {
      const r = await api<{ courses: Row[] }>("/admin/courses");
      setRows(r.courses);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function onDelete(id: number) {
    if (!window.confirm("هل تريد حذف هذه الفعاليّة وكلّ تسجيلاتها؟")) return;
    try {
      await api(`/admin/courses/${id}`, { method: "DELETE" });
      void reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحذف");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">
            الكورسات والورشات
          </h2>
          <p className="text-[13px] text-foreground/65 mt-1">
            أنشئ وأدِر فعاليّات آيلاند هيفن — وراقب التسجيلات.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-[hsl(var(--primary-cta))] text-white text-[13px] font-semibold hover:shadow-soft-hover transition-shadow"
          data-testid="button-new-course"
        >
          <Plus className="w-4 h-4" />
          إضافة جديد
        </button>
      </div>

      {error && (
        <div className="rounded-2xl px-4 py-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[13px]">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {rows === null ? (
          <div className="p-8 text-center text-foreground/60">جارِ التحميل…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-foreground/65 text-[14px]">
            لم تُضَف أيّ فعاليّة بعد.
          </div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/40 text-foreground/65 text-[11.5px] tracking-[0.05em] uppercase">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">العنوان</th>
                <th className="text-right px-4 py-3 font-semibold">النوع</th>
                <th className="text-right px-4 py-3 font-semibold">يبدأ</th>
                <th className="text-right px-4 py-3 font-semibold">المسجَّلون</th>
                <th className="text-right px-4 py-3 font-semibold">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold w-1">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-border hover:bg-muted/20"
                  data-testid={`admin-course-row-${r.id}`}
                >
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {r.title}
                    {r.instructor && (
                      <div className="text-[11.5px] text-foreground/60 font-normal mt-0.5">
                        {r.instructor}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground/65">
                    {COURSE_TYPE_LABELS[r.type]}
                  </td>
                  <td className="px-4 py-3 text-foreground/65 tabular-nums">
                    {r.startsAt ? formatArabicDateTime(r.startsAt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-foreground/65 tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-foreground/60" />
                      {r.enrolled}
                      {r.capacity > 0 ? ` / ${r.capacity}` : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        r.status === "open"
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : r.status === "draft"
                          ? "bg-muted text-foreground/70 border border-border"
                          : "bg-foreground/[0.04] text-foreground/65 border border-border"
                      }`}
                    >
                      {COURSE_STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(r)}
                        aria-label="تعديل الكورس"
                        className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65 hover:text-primary transition-colors"
                        data-testid={`button-edit-course-${r.id}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(r.id)}
                        aria-label="حذف الكورس"
                        className="p-2 rounded-lg hover:bg-rose-500/15 text-foreground/65 hover:text-rose-400 transition-colors"
                        data-testid={`button-delete-course-${r.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <CourseEditor
          initial={editing === "new" ? null : editing}
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

function CourseEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: Row | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initial) {
      setForm(EMPTY);
      return;
    }
    // Fetch full record for description/etc.
    api<{ course: FormState & { startsAt: string | null; endsAt: string | null } }>(
      `/admin/courses/${initial.id}`,
    ).then((r) => {
      const c = r.course;
      setForm({
        type: c.type,
        title: c.title,
        summary: c.summary || "",
        description: c.description || "",
        instructor: c.instructor || "",
        coverUrl: c.coverUrl || "",
        location: c.location || "",
        startsAt: toLocalInput(c.startsAt),
        endsAt: toLocalInput(c.endsAt),
        capacity: c.capacity || 0,
        status: c.status,
      });
    });
  }, [initial]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setIssues({});
    try {
      const body = {
        ...form,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        capacity: Number(form.capacity) || 0,
      };
      const path = initial ? `/admin/courses/${initial.id}` : "/admin/courses";
      const method = initial ? "PATCH" : "POST";
      await api(path, { method, body: JSON.stringify(body) });
      onSaved();
    } catch (e) {
      if (e instanceof ApiError && e.data && typeof e.data === "object") {
        const d = e.data as {
          error?: string;
          details?: Array<{ field: string; message: string }>;
        };
        setError(d.error || "تعذّر الحفظ");
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
            {initial ? "تعديل فعاليّة" : "إضافة فعاليّة"}
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
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="النوع" error={issues.type}>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((s) => ({ ...s, type: e.target.value as CourseType }))
                }
                className="w-full bg-transparent outline-none text-[14px]"
                data-testid="select-course-type"
              >
                <option value="course">كورس</option>
                <option value="workshop">ورشة</option>
              </select>
            </Field>
            <Field label="الحالة" error={issues.status}>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    status: e.target.value as CourseStatus,
                  }))
                }
                className="w-full bg-transparent outline-none text-[14px]"
                data-testid="select-course-status"
              >
                <option value="draft">مسوّدة</option>
                <option value="open">تسجيل مفتوح</option>
                <option value="closed">مكتمل العدد</option>
                <option value="done">منتهٍ</option>
              </select>
            </Field>
          </div>
          <Field label="العنوان" error={issues.title}>
            <input
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              className="w-full bg-transparent outline-none text-[14px]"
              data-testid="input-course-title"
              maxLength={200}
            />
          </Field>
          <Field label="ملخّص" error={issues.summary}>
            <input
              value={form.summary}
              onChange={(e) =>
                setForm((s) => ({ ...s, summary: e.target.value }))
              }
              className="w-full bg-transparent outline-none text-[14px]"
              maxLength={400}
            />
          </Field>
          <Field label="الوصف الكامل" error={issues.description}>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) =>
                setForm((s) => ({ ...s, description: e.target.value }))
              }
              className="w-full bg-transparent outline-none text-[14px] resize-none leading-[1.85]"
              maxLength={8000}
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="المُدرِّب" error={issues.instructor}>
              <input
                value={form.instructor}
                onChange={(e) =>
                  setForm((s) => ({ ...s, instructor: e.target.value }))
                }
                className="w-full bg-transparent outline-none text-[14px]"
                maxLength={200}
              />
            </Field>
            <Field label="المكان" error={issues.location}>
              <input
                value={form.location}
                onChange={(e) =>
                  setForm((s) => ({ ...s, location: e.target.value }))
                }
                className="w-full bg-transparent outline-none text-[14px]"
                placeholder="آيلاند هيفن — غزّة"
                maxLength={200}
              />
            </Field>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="يبدأ" error={issues.startsAt}>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) =>
                  setForm((s) => ({ ...s, startsAt: e.target.value }))
                }
                className="w-full bg-transparent outline-none text-[14px]"
                data-testid="input-course-startsAt"
              />
            </Field>
            <Field label="ينتهي" error={issues.endsAt}>
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) =>
                  setForm((s) => ({ ...s, endsAt: e.target.value }))
                }
                className="w-full bg-transparent outline-none text-[14px]"
              />
            </Field>
            <Field label="السعة (٠ = غير محدود)" error={issues.capacity}>
              <input
                type="number"
                min={0}
                value={form.capacity}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    capacity: Number(e.target.value) || 0,
                  }))
                }
                className="w-full bg-transparent outline-none text-[14px] tabular-nums"
                data-testid="input-course-capacity"
              />
            </Field>
          </div>
          <Field label="رابط صورة الغلاف (اختياري)" error={issues.coverUrl}>
            <input
              dir="ltr"
              value={form.coverUrl}
              onChange={(e) =>
                setForm((s) => ({ ...s, coverUrl: e.target.value }))
              }
              className="w-full bg-transparent outline-none text-[13.5px]"
              placeholder="/api/storage/objects/…"
              maxLength={1000}
            />
          </Field>

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
              data-testid="button-save-course"
            >
              {submitting ? "جارِ الحفظ…" : initial ? "حفظ التعديلات" : "إنشاء"}
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
      <label className="block mb-1.5 text-[12px] text-foreground/65 font-semibold">
        {label}
      </label>
      <div
        className={`rounded-xl px-3 py-2.5 bg-muted/40 border focus-within:bg-muted/60 transition-colors ${
          error ? "border-rose-500/50" : "border-border"
        }`}
      >
        {children}
      </div>
      {error && (
        <div className="text-[11.5px] text-rose-400 mt-1 px-1">{error}</div>
      )}
    </div>
  );
}
