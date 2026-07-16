import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, X, Upload, Image as ImageIcon } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import {
  BLOG_CATEGORIES,
  BLOG_CATEGORY_LABELS,
  formatArabicDateTime,
  type BlogCategory,
  type BlogStatus,
} from "@/lib/labels";

interface Post {
  id: number;
  slug: string;
  category: BlogCategory;
  status: BlogStatus;
  title: string;
  titleEn: string;
  excerpt: string;
  excerptEn: string;
  body: string;
  bodyEn: string;
  author: string;
  authorEn: string;
  coverUrl: string | null;
  publishedAt: string | null;
}

interface FormState {
  category: BlogCategory;
  status: BlogStatus;
  title: string;
  titleEn: string;
  excerpt: string;
  excerptEn: string;
  body: string;
  bodyEn: string;
  author: string;
  authorEn: string;
  coverUrl: string;
  publishedAt: string;
}

const EMPTY: FormState = {
  category: "startup",
  status: "draft",
  title: "",
  titleEn: "",
  excerpt: "",
  excerptEn: "",
  body: "",
  bodyEn: "",
  author: "",
  authorEn: "",
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

export default function AdminBlog() {
  const [rows, setRows] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Post | "new" | null>(null);

  async function reload() {
    try {
      const r = await api<{ posts: Post[] }>("/admin/blog");
      setRows(r.posts);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function onDelete(id: number) {
    if (!window.confirm("حذف هذا المقال؟")) return;
    try {
      await api(`/admin/blog/${id}`, { method: "DELETE" });
      void reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحذف");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">المدوّنة</h2>
          <p className="text-[13px] text-foreground/65 mt-1">
            مقالاتٌ ورؤًى ثنائيّة اللغة — احفظها كمسوّدة، ثمّ انشرها حين تجهز.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-[hsl(var(--primary-cta))] text-white text-[13px] font-semibold hover:shadow-soft-hover transition-shadow"
          data-testid="button-new-blog"
        >
          <Plus className="w-4 h-4" />
          مقال جديد
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
            لا مقالات بعد.
          </div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/40 text-foreground/65 text-[11.5px] tracking-[0.05em] uppercase">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">العنوان</th>
                <th className="text-right px-4 py-3 font-semibold">الفئة</th>
                <th className="text-right px-4 py-3 font-semibold">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold">النشر</th>
                <th className="text-right px-4 py-3 font-semibold w-1">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-border hover:bg-muted/20"
                  data-testid={`admin-blog-row-${p.id}`}
                >
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {p.title}
                    {p.titleEn && (
                      <div className="text-[11.5px] text-foreground/60 font-normal mt-0.5 line-clamp-1" dir="ltr">
                        {p.titleEn}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground/65">
                    {BLOG_CATEGORY_LABELS[p.category]}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
                        p.status === "published"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {p.status === "published" ? "منشور" : "مسوّدة"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground/65 tabular-nums">
                    {p.publishedAt ? formatArabicDateTime(p.publishedAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(p)}
                        aria-label="تعديل المقال"
                        className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65 hover:text-primary transition-colors"
                        data-testid={`button-edit-blog-${p.id}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(p.id)}
                        aria-label="حذف المقال"
                        className="p-2 rounded-lg hover:bg-rose-500/15 text-foreground/65 hover:text-rose-400 transition-colors"
                        data-testid={`button-delete-blog-${p.id}`}
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
        <BlogEditor
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

function BlogEditor({
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
  const set = (patch: Partial<FormState>) => setForm((s) => ({ ...s, ...patch }));

  useEffect(() => {
    if (!initial) {
      setForm(EMPTY);
      return;
    }
    setForm({
      category: initial.category,
      status: initial.status,
      title: initial.title,
      titleEn: initial.titleEn || "",
      excerpt: initial.excerpt || "",
      excerptEn: initial.excerptEn || "",
      body: initial.body || "",
      bodyEn: initial.bodyEn || "",
      author: initial.author || "",
      authorEn: initial.authorEn || "",
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
      // Only send publishedAt when the editor set one; otherwise the server decides
      // (stamps "now" on publish, leaves null for a draft).
      const body: Record<string, unknown> = { ...form };
      if (form.publishedAt) body.publishedAt = new Date(form.publishedAt).toISOString();
      else delete body.publishedAt;
      const path = initial ? `/admin/blog/${initial.id}` : "/admin/blog";
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
      <div className="bg-card rounded-3xl border border-border w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="text-[16px] font-bold text-foreground">
            {initial ? "تعديل مقال" : "مقال جديد"}
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
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="الفئة" error={issues.category}>
              <select
                value={form.category}
                onChange={(e) => set({ category: e.target.value as BlogCategory })}
                className="w-full bg-transparent outline-none text-[14px]"
                data-testid="select-blog-category"
              >
                {BLOG_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{BLOG_CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </Field>
            <Field label="الحالة" error={issues.status}>
              <select
                value={form.status}
                onChange={(e) => set({ status: e.target.value as BlogStatus })}
                className="w-full bg-transparent outline-none text-[14px]"
                data-testid="select-blog-status"
              >
                <option value="draft">مسوّدة</option>
                <option value="published">منشور</option>
              </select>
            </Field>
            <Field label="تاريخ النشر (اختياري)" error={issues.publishedAt}>
              <input
                type="datetime-local"
                value={form.publishedAt}
                onChange={(e) => set({ publishedAt: e.target.value })}
                className="w-full bg-transparent outline-none text-[14px]"
                data-testid="input-blog-publishedAt"
              />
            </Field>
          </div>

          {/* Bilingual pairs — Arabic then English, side by side. */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="العنوان (عربي)" error={issues.title}>
              <input
                value={form.title}
                onChange={(e) => set({ title: e.target.value })}
                className="w-full bg-transparent outline-none text-[14px]"
                data-testid="input-blog-title"
                maxLength={200}
              />
            </Field>
            <Field label="Title (English)" error={issues.titleEn}>
              <input
                dir="ltr"
                value={form.titleEn}
                onChange={(e) => set({ titleEn: e.target.value })}
                className="w-full bg-transparent outline-none text-[14px]"
                data-testid="input-blog-titleEn"
                maxLength={200}
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="المقتطف (عربي)" error={issues.excerpt}>
              <textarea
                rows={2}
                value={form.excerpt}
                onChange={(e) => set({ excerpt: e.target.value })}
                className="w-full bg-transparent outline-none text-[14px] resize-none leading-[1.7]"
                maxLength={500}
              />
            </Field>
            <Field label="Excerpt (English)" error={issues.excerptEn}>
              <textarea
                dir="ltr"
                rows={2}
                value={form.excerptEn}
                onChange={(e) => set({ excerptEn: e.target.value })}
                className="w-full bg-transparent outline-none text-[14px] resize-none leading-[1.7]"
                maxLength={500}
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="المحتوى (عربي)" error={issues.body}>
              <textarea
                rows={9}
                value={form.body}
                onChange={(e) => set({ body: e.target.value })}
                className="w-full bg-transparent outline-none text-[14px] resize-none leading-[1.85]"
                data-testid="input-blog-body"
                maxLength={20000}
              />
            </Field>
            <Field label="Body (English)" error={issues.bodyEn}>
              <textarea
                dir="ltr"
                rows={9}
                value={form.bodyEn}
                onChange={(e) => set({ bodyEn: e.target.value })}
                className="w-full bg-transparent outline-none text-[14px] resize-none leading-[1.85]"
                data-testid="input-blog-bodyEn"
                maxLength={20000}
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="الكاتب (عربي)" error={issues.author}>
              <input
                value={form.author}
                onChange={(e) => set({ author: e.target.value })}
                className="w-full bg-transparent outline-none text-[14px]"
                maxLength={120}
              />
            </Field>
            <Field label="Author (English)" error={issues.authorEn}>
              <input
                dir="ltr"
                value={form.authorEn}
                onChange={(e) => set({ authorEn: e.target.value })}
                className="w-full bg-transparent outline-none text-[14px]"
                maxLength={120}
              />
            </Field>
          </div>

          <div>
            <label className="block mb-1.5 text-[12px] text-foreground/65 font-semibold">
              صورة الغلاف
            </label>
            <CoverField value={form.coverUrl} onChange={(coverUrl) => set({ coverUrl })} />
            {issues.coverUrl && (
              <div className="text-[11.5px] text-rose-400 mt-1 px-1">{issues.coverUrl}</div>
            )}
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
              data-testid="button-save-blog"
            >
              {submitting ? "جارِ الحفظ…" : initial ? "حفظ التعديلات" : "حفظ"}
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

/** Cover upload — file → POST /api/admin/upload (returns {url}) + a manual URL fallback.
 *  Self-contained (plain HTML) to match this page's style. */
function CoverField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(file: File) {
    setErr(null);
    if (!file.type.startsWith("image/")) return setErr("الرجاء رفع صورة فقط");
    if (file.size > 12 * 1024 * 1024) return setErr("حجم الصورة أكبر من 12 ميغا");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", credentials: "include", body: fd });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.url) throw new Error("no url");
      onChange(data.url);
    } catch {
      setErr("فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="w-20 h-20 rounded-xl bg-muted/40 border border-border overflow-hidden flex items-center justify-center shrink-0">
          {value ? (
            <img loading="lazy" decoding="async" src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-6 h-6 text-foreground/30" />
          )}
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-muted text-foreground/80 text-[12.5px] font-semibold hover:bg-muted/70 disabled:opacity-50"
            data-testid="button-blog-upload"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? "جارِ الرفع…" : "رفع صورة"}
          </button>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="أو ألصق رابط صورة"
            dir="ltr"
            className="w-full h-8 rounded-lg px-2.5 bg-muted/40 border border-border text-[12px] font-mono outline-none focus:bg-muted/60"
          />
        </div>
      </div>
      {err && <div className="text-[11.5px] text-rose-400 px-1">{err}</div>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
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
