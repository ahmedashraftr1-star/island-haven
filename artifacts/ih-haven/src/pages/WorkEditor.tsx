import { useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Image as ImageIcon, Loader2, X } from "lucide-react";
import { PageShell, GlassCard, BackLink } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface FormState {
  title: string;
  summary: string;
  description: string;
  coverUrl: string;
  link: string;
  tags: string;
}

const EMPTY: FormState = {
  title: "",
  summary: "",
  description: "",
  coverUrl: "",
  link: "",
  tags: "",
};

export default function WorkEditor() {
  const [matchEdit, paramsEdit] = useRoute("/works/:id/edit");
  const editing = !!matchEdit;
  const id = paramsEdit?.id;
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    document.title = (editing ? "تعديل عمل" : "إضافة عمل جديد") + " — آيلاند هيفن";
  }, [editing]);

  useEffect(() => {
    if (!loading && !user) navigate("/login?next=/works/new");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!editing || !id) return;
    api<{ work: FormState & { id: number; userId: number } }>(`/works/${id}`)
      .then((r) => {
        const w = (r as unknown as { work: FormState }).work;
        setForm({
          title: w.title || "",
          summary: w.summary || "",
          description: w.description || "",
          coverUrl: w.coverUrl || "",
          link: w.link || "",
          tags: w.tags || "",
        });
      })
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "تعذّر التحميل"),
      );
  }, [editing, id]);

  async function onUpload(file: File) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads/image", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "فشل الرفع");
      }
      setForm((s) => ({ ...s, coverUrl: data.url! }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الرفع");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setIssues({});
    setError(null);
    try {
      const path = editing ? `/works/${id}` : "/works";
      const method = editing ? "PATCH" : "POST";
      const r = await api<{ work: { id: number } }>(path, {
        method,
        body: JSON.stringify(form),
      });
      navigate(`/works/${r.work.id}`);
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

  if (loading || !user) {
    return (
      <PageShell active="works">
        <div className="h-72 rounded-[28px] bg-white/[0.035] border border-white/10 animate-pulse" />
      </PageShell>
    );
  }

  return (
    <PageShell
      active="works"
      eyebrow={editing ? "تحرير" : "إضافة جديدة"}
      title={editing ? "عدّل عملك" : "أضف عملًا جديدًا"}
      subtitle="شارك مشروعك حتى يراه المجتمع — أضف صورة وعنوانًا واصفًا ورابطًا للوصول إليه."
      maxWidth="max-w-3xl"
    >
      <BackLink href={editing && id ? `/works/${id}` : "/works"} label="رجوع" />

      <form onSubmit={onSubmit} noValidate>
        <GlassCard className="p-6 sm:p-8 space-y-6">
          {/* Cover */}
          <Field label="الصورة الرئيسيّة" hint="Cover" error={issues.coverUrl}>
            {form.coverUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/10">
                <img
                  src={form.coverUrl}
                  alt=""
                  className="w-full max-h-72 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setForm((s) => ({ ...s, coverUrl: "" }))}
                  className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/55 backdrop-blur-md text-white flex items-center justify-center hover:bg-red-500/70 transition-colors"
                  data-testid="button-remove-cover"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full h-44 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] text-white/55 hover:text-white hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2"
                data-testid="button-upload-cover"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-[13px]">جارٍ الرفع…</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-[13px] font-semibold">
                      اسحب صورتك هنا أو اضغط للاختيار
                    </span>
                    <span className="text-[11px] text-white/35">
                      حتّى ٥ ميجابايت
                    </span>
                  </>
                )}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onUpload(f);
                e.currentTarget.value = "";
              }}
            />
          </Field>

          <Field label="العنوان" hint="Title" error={issues.title}>
            <input
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              className="w-full bg-transparent outline-none text-white text-[15px] py-1"
              placeholder="مثال: تطبيق متجر إلكتروني لمتجر العائلة"
              data-testid="input-title"
              maxLength={200}
            />
          </Field>

          <Field label="ملخّص" hint="Summary" error={issues.summary}>
            <input
              value={form.summary}
              onChange={(e) =>
                setForm((s) => ({ ...s, summary: e.target.value }))
              }
              className="w-full bg-transparent outline-none text-white text-[14.5px] py-1"
              placeholder="جملة وصفيّة قصيرة"
              data-testid="input-summary"
              maxLength={400}
            />
          </Field>

          <Field
            label="الوصف الكامل"
            hint="Description"
            error={issues.description}
          >
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((s) => ({ ...s, description: e.target.value }))
              }
              rows={6}
              className="w-full bg-transparent outline-none text-white text-[14.5px] leading-[1.85] py-1 resize-none"
              placeholder="ما الذي تنجزه؟ ما الأدوات والتقنيّات؟"
              data-testid="input-description"
              maxLength={8000}
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="رابط العمل" hint="Link" error={issues.link}>
              <input
                dir="ltr"
                value={form.link}
                onChange={(e) =>
                  setForm((s) => ({ ...s, link: e.target.value }))
                }
                className="w-full bg-transparent outline-none text-white text-[14.5px] py-1"
                placeholder="https://…"
                data-testid="input-link"
                maxLength={800}
              />
            </Field>
            <Field
              label="الوسوم"
              hint="Tags"
              error={issues.tags}
              note="افصل بفاصلة"
            >
              <input
                value={form.tags}
                onChange={(e) =>
                  setForm((s) => ({ ...s, tags: e.target.value }))
                }
                className="w-full bg-transparent outline-none text-white text-[14.5px] py-1"
                placeholder="React, تصميم, موبايل"
                data-testid="input-tags"
                maxLength={400}
              />
            </Field>
          </div>

          {error && (
            <div className="rounded-2xl px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-200 text-[13px]">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || uploading}
              className="flex-1 min-w-[180px] py-3.5 rounded-2xl bg-primary text-white font-bold text-[14px] enabled:hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] enabled:hover:-translate-y-px transition-all disabled:opacity-45"
              data-testid="button-save-work"
            >
              {submitting ? "جارٍ الحفظ…" : editing ? "حفظ التعديلات" : "نشر العمل"}
            </button>
            <button
              type="button"
              onClick={() => navigate(editing && id ? `/works/${id}` : "/works")}
              className="px-6 py-3.5 rounded-2xl bg-white/[0.05] border border-white/10 text-white/75 font-semibold text-[14px] hover:bg-white/[0.08] transition-colors"
            >
              إلغاء
            </button>
          </div>
        </GlassCard>
      </form>
    </PageShell>
  );
}

function Field({
  label,
  hint,
  error,
  note,
  children,
}: {
  label: string;
  hint: string;
  error?: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center justify-between mb-2 text-[11.5px]">
        <span className="text-white/75 font-semibold">{label}</span>
        <span className="text-[10px] tracking-[0.16em] uppercase text-white/35">
          {hint}
          {note ? ` · ${note}` : ""}
        </span>
      </label>
      <div
        className={`rounded-2xl px-4 py-3 bg-white/[0.04] border backdrop-blur-md transition-colors focus-within:bg-white/[0.06] ${
          error
            ? "border-red-500/45 focus-within:border-red-500/65"
            : "border-white/10 focus-within:border-primary/45"
        }`}
      >
        {children}
      </div>
      {error && <div className="text-[11.5px] text-red-300 mt-1.5 px-1">{error}</div>}
    </div>
  );
}
