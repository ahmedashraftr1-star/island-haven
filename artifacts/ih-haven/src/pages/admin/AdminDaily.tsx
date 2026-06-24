import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import {
  DAILY_TYPE_LABELS,
  formatArabicDateTime,
  type DailyType,
} from "@/lib/labels";

interface Post {
  id: number;
  type: DailyType;
  title: string;
  body: string;
  coverUrl: string | null;
  publishedAt: string;
}

interface FormState {
  type: DailyType;
  title: string;
  body: string;
  coverUrl: string;
  publishedAt: string;
}

const EMPTY: FormState = {
  type: "tip",
  title: "",
  body: "",
  coverUrl: "",
  publishedAt: "",
};

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminDaily() {
  const [rows, setRows] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Post | "new" | null>(null);

  async function reload() {
    try {
      const r = await api<{ posts: Post[] }>("/admin/daily");
      setRows(r.posts);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function onDelete(id: number) {
    if (!window.confirm("حذف هذا المنشور؟")) return;
    try {
      await api(`/admin/daily/${id}`, { method: "DELETE" });
      void reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحذف");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">اليوميّات</h2>
          <p className="text-[13px] text-foreground/65 mt-1">
            نَصائح وأخبار وقصص — انشر منشورًا جديدًا كلّ يوم.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:shadow-soft-hover transition-shadow"
          data-testid="button-new-daily"
        >
          <Plus className="w-4 h-4" />
          إضافة منشور
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
            لا منشورات بعد.
          </div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/40 text-foreground/65 text-[11.5px] tracking-[0.05em] uppercase">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">العنوان</th>
                <th className="text-right px-4 py-3 font-semibold">النوع</th>
                <th className="text-right px-4 py-3 font-semibold">النشر</th>
                <th className="text-right px-4 py-3 font-semibold w-1">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-border hover:bg-muted/20"
                  data-testid={`admin-daily-row-${p.id}`}
                >
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {p.title}
                    {p.body && (
                      <div className="text-[11.5px] text-foreground/60 font-normal mt-0.5 line-clamp-1">
                        {p.body}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground/65">
                    {DAILY_TYPE_LABELS[p.type]}
                  </td>
                  <td className="px-4 py-3 text-foreground/65 tabular-nums">
                    {formatArabicDateTime(p.publishedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(p)}
                        aria-label="تعديل المنشور"
                        className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65 hover:text-primary transition-colors"
                        data-testid={`button-edit-daily-${p.id}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(p.id)}
                        aria-label="حذف المنشور"
                        className="p-2 rounded-lg hover:bg-rose-500/15 text-foreground/65 hover:text-rose-400 transition-colors"
                        data-testid={`button-delete-daily-${p.id}`}
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
        <DailyEditor
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

function DailyEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: Post | null;
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
    setForm({
      type: initial.type,
      title: initial.title,
      body: initial.body || "",
      coverUrl: initial.coverUrl || "",
      publishedAt: toLocalInput(initial.publishedAt),
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
        publishedAt: form.publishedAt
          ? new Date(form.publishedAt).toISOString()
          : new Date().toISOString(),
      };
      const path = initial ? `/admin/daily/${initial.id}` : "/admin/daily";
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
            {initial ? "تعديل منشور" : "منشور جديد"}
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
                  setForm((s) => ({ ...s, type: e.target.value as DailyType }))
                }
                className="w-full bg-transparent outline-none text-[14px]"
                data-testid="select-daily-type"
              >
                <option value="tip">نصيحة</option>
                <option value="news">خبر</option>
                <option value="quote">اقتباس</option>
                <option value="story">قصّة</option>
              </select>
            </Field>
            <Field label="تاريخ النشر" error={issues.publishedAt}>
              <input
                type="datetime-local"
                value={form.publishedAt}
                onChange={(e) =>
                  setForm((s) => ({ ...s, publishedAt: e.target.value }))
                }
                className="w-full bg-transparent outline-none text-[14px]"
                data-testid="input-daily-publishedAt"
              />
            </Field>
          </div>
          <Field label="العنوان" error={issues.title}>
            <input
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              className="w-full bg-transparent outline-none text-[14px]"
              data-testid="input-daily-title"
              maxLength={250}
            />
          </Field>
          <Field label="النصّ" error={issues.body}>
            <textarea
              rows={8}
              value={form.body}
              onChange={(e) => setForm((s) => ({ ...s, body: e.target.value }))}
              className="w-full bg-transparent outline-none text-[14px] resize-none leading-[1.85]"
              data-testid="input-daily-body"
              maxLength={8000}
            />
          </Field>
          <Field label="رابط صورة (اختياري)" error={issues.coverUrl}>
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
              className="flex-1 h-11 rounded-full bg-primary text-primary-foreground font-semibold text-[13.5px] enabled:hover:shadow-soft-hover transition-shadow disabled:opacity-50"
              data-testid="button-save-daily"
            >
              {submitting ? "جارِ الحفظ…" : initial ? "حفظ التعديلات" : "نشر"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 h-11 rounded-full bg-muted text-foreground/75 font-semibold text-[13.5px] hover:bg-muted/70"
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
