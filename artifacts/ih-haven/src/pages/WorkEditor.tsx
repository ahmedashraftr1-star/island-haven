import { useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Image as ImageIcon, Loader2, X, Plus, Youtube } from "lucide-react";
import { PageShell, GlassCard, BackLink } from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface FormState {
  title: string;
  summary: string;
  description: string;
  coverUrl: string;
  galleryUrls: string[];
  videoUrl: string;
  link: string;
  tags: string;
}

const EMPTY: FormState = {
  title: "",
  summary: "",
  description: "",
  coverUrl: "",
  galleryUrls: [],
  videoUrl: "",
  link: "",
  tags: "",
};

const MAX_GALLERY = 12;

export default function WorkEditor() {
  const [matchEdit, paramsEdit] = useRoute("/works/:id/edit");
  const editing = !!matchEdit;
  const id = paramsEdit?.id;
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const { lang, t } = useLanguage();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"cover" | "gallery" | null>(null);
  const coverFileRef = useRef<HTMLInputElement | null>(null);
  const galleryFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    document.title =
      lang === "ar"
        ? (editing ? "تعديل عمل" : "إضافة عمل جديد") + " — آيلاند هيفن"
        : (editing ? "Edit Work" : "Add New Work") + " — Island Haven";
  }, [editing, lang]);

  useEffect(() => {
    if (!loading && !user) navigate("/login?next=/works/new");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!editing || !id) return;
    api<{
      work: {
        title: string;
        summary: string;
        description: string;
        coverUrl: string | null;
        galleryUrls: string[] | null;
        videoUrl: string | null;
        link: string;
        tags: string;
      };
    }>(`/works/${id}`)
      .then((r) => {
        const w = r.work;
        setForm({
          title: w.title || "",
          summary: w.summary || "",
          description: w.description || "",
          coverUrl: w.coverUrl || "",
          galleryUrls: Array.isArray(w.galleryUrls) ? w.galleryUrls : [],
          videoUrl: w.videoUrl || "",
          link: w.link || "",
          tags: w.tags || "",
        });
      })
      .catch((e) =>
        setError(
          e instanceof ApiError
            ? e.message
            : t({ ar: "تعذّر التحميل", en: "Couldn't load this work" }),
        ),
      );
  }, [editing, id]);

  async function uploadOne(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploads/image", {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !data.url)
      throw new Error(data.error || t({ ar: "فشل الرفع", en: "Upload failed" }));
    return data.url;
  }

  async function onUploadCover(file: File) {
    if (!file) return;
    setUploading("cover");
    setError(null);
    try {
      const url = await uploadOne(file);
      setForm((s) => ({ ...s, coverUrl: url }));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t({ ar: "فشل الرفع", en: "Upload failed" }),
      );
    } finally {
      setUploading(null);
    }
  }

  async function onUploadGallery(files: FileList) {
    if (!files.length) return;
    setUploading("gallery");
    setError(null);
    try {
      const slots = MAX_GALLERY - form.galleryUrls.length;
      const picks = Array.from(files).slice(0, Math.max(0, slots));
      // Sequential upload — simpler and friendlier to the upload endpoint.
      const urls: string[] = [];
      for (const f of picks) {
        const u = await uploadOne(f);
        urls.push(u);
      }
      setForm((s) => ({ ...s, galleryUrls: [...s.galleryUrls, ...urls] }));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t({ ar: "فشل الرفع", en: "Upload failed" }),
      );
    } finally {
      setUploading(null);
    }
  }

  function removeGalleryAt(idx: number) {
    setForm((s) => ({
      ...s,
      galleryUrls: s.galleryUrls.filter((_, i) => i !== idx),
    }));
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
        setError(d.error || t({ ar: "تعذّر الحفظ", en: "Couldn't save" }));
        if (Array.isArray(d.details)) {
          const m: Record<string, string> = {};
          for (const i of d.details) m[i.field] = i.message;
          setIssues(m);
        }
      } else {
        setError(
          t({ ar: "تعذّر الاتّصال بالخادم", en: "Couldn't reach the server" }),
        );
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

  const remaining = MAX_GALLERY - form.galleryUrls.length;

  return (
    <PageShell
      active="works"
      eyebrow={
        editing
          ? t({ ar: "تحرير", en: "Editing" })
          : t({ ar: "إضافة جديدة", en: "New Entry" })
      }
      title={
        editing
          ? t({ ar: "عدّل عملك", en: "Edit your work" })
          : t({ ar: "أضف عملًا جديدًا", en: "Add a new work" })
      }
      subtitle={t({
        ar: "شارك مشروعك حتى يراه المجتمع — أضف صورة وعنوانًا واصفًا، معرضًا اختياريًّا للصّور، ورابطًا أو فيديو.",
        en: "Share your project with the community — add a cover, a clear title, an optional image gallery, and a link or video.",
      })}
      maxWidth="max-w-3xl"
    >
      <BackLink
        href={editing && id ? `/works/${id}` : "/works"}
        label={t({ ar: "رجوع", en: "Back" })}
      />

      <form onSubmit={onSubmit} noValidate>
        <GlassCard className="p-6 sm:p-8 space-y-6">
          {/* Cover */}
          <Field
            label={t({ ar: "الصورة الرئيسيّة", en: "Cover image" })}
            hint="Cover"
            error={issues.coverUrl}
          >
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
                onClick={() => coverFileRef.current?.click()}
                disabled={uploading !== null}
                className="w-full h-44 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] text-white/55 hover:text-white hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2"
                data-testid="button-upload-cover"
              >
                {uploading === "cover" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-[13px]">
                      {t({ ar: "جارٍ الرفع…", en: "Uploading…" })}
                    </span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-[13px] font-semibold">
                      {t({
                        ar: "اسحب صورتك هنا أو اضغط للاختيار",
                        en: "Drag an image here or click to choose",
                      })}
                    </span>
                    <span className="text-[11px] text-white/55">
                      {t({ ar: "حتّى ٥ ميجابايت", en: "Up to 5 MB" })}
                    </span>
                  </>
                )}
              </button>
            )}
            <input
              ref={coverFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onUploadCover(f);
                e.currentTarget.value = "";
              }}
            />
          </Field>

          {/* Gallery */}
          <Field
            label={t({ ar: "معرض صور إضافيّ", en: "Extra image gallery" })}
            hint="Gallery"
            note={t({
              ar: `اختياريّ · حتّى ${MAX_GALLERY} صور`,
              en: `Optional · up to ${MAX_GALLERY} images`,
            })}
            error={issues.galleryUrls}
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {form.galleryUrls.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGalleryAt(i)}
                    className="absolute top-1 left-1 w-7 h-7 rounded-full bg-black/65 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                    data-testid={`button-remove-gallery-${i}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {remaining > 0 && (
                <button
                  type="button"
                  onClick={() => galleryFileRef.current?.click()}
                  disabled={uploading !== null}
                  className="aspect-square rounded-xl border border-dashed border-white/20 bg-white/[0.03] text-white/45 hover:text-white hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-1"
                  data-testid="button-upload-gallery"
                >
                  {uploading === "gallery" ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span className="text-[10.5px] font-semibold">
                        {t({ ar: "إضافة", en: "Add" })}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              ref={galleryFileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length)
                  void onUploadGallery(e.target.files);
                e.currentTarget.value = "";
              }}
            />
          </Field>

          <Field
            label={t({ ar: "العنوان", en: "Title" })}
            hint="Title"
            error={issues.title}
          >
            <input
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              className="w-full bg-transparent outline-none text-white text-[15px] py-1"
              placeholder={t({
                ar: "مثال: تطبيق متجر إلكتروني لمتجر العائلة",
                en: "e.g. An online store app for the family shop",
              })}
              data-testid="input-title"
              maxLength={200}
            />
          </Field>

          <Field
            label={t({ ar: "ملخّص", en: "Summary" })}
            hint="Summary"
            error={issues.summary}
          >
            <input
              value={form.summary}
              onChange={(e) =>
                setForm((s) => ({ ...s, summary: e.target.value }))
              }
              className="w-full bg-transparent outline-none text-white text-[14.5px] py-1"
              placeholder={t({
                ar: "جملة وصفيّة قصيرة",
                en: "A short descriptive sentence",
              })}
              data-testid="input-summary"
              maxLength={400}
            />
          </Field>

          <Field
            label={t({ ar: "الوصف الكامل", en: "Full description" })}
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
              placeholder={t({
                ar: "ما الذي تنجزه؟ ما الأدوات والتقنيّات؟",
                en: "What does it do? Which tools and technologies?",
              })}
              data-testid="input-description"
              maxLength={8000}
            />
          </Field>

          <Field
            label={t({ ar: "فيديو يوتيوب", en: "YouTube video" })}
            hint="YouTube"
            note={t({ ar: "اختياريّ", en: "Optional" })}
            error={issues.videoUrl}
          >
            <div className="flex items-center gap-2">
              <Youtube className="w-4 h-4 text-primary shrink-0" />
              <input
                dir="ltr"
                value={form.videoUrl}
                onChange={(e) =>
                  setForm((s) => ({ ...s, videoUrl: e.target.value }))
                }
                className="w-full bg-transparent outline-none text-white text-[14.5px] py-1"
                placeholder="https://www.youtube.com/watch?v=…"
                data-testid="input-video-url"
                maxLength={800}
              />
            </div>
          </Field>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field
              label={t({ ar: "رابط العمل", en: "Work link" })}
              hint="Link"
              error={issues.link}
            >
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
              label={t({ ar: "الوسوم", en: "Tags" })}
              hint="Tags"
              error={issues.tags}
              note={t({ ar: "افصل بفاصلة", en: "Separate with commas" })}
            >
              <input
                value={form.tags}
                onChange={(e) =>
                  setForm((s) => ({ ...s, tags: e.target.value }))
                }
                className="w-full bg-transparent outline-none text-white text-[14.5px] py-1"
                placeholder={t({
                  ar: "React, تصميم, موبايل",
                  en: "React, Design, Mobile",
                })}
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
              disabled={submitting || uploading !== null}
              className="flex-1 min-w-[180px] py-3.5 rounded-2xl bg-primary text-white font-bold text-[14px] enabled:hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] enabled:hover:-translate-y-px transition-all disabled:opacity-45"
              data-testid="button-save-work"
            >
              {submitting
                ? t({ ar: "جارٍ الحفظ…", en: "Saving…" })
                : editing
                  ? t({ ar: "حفظ التعديلات", en: "Save changes" })
                  : t({ ar: "نشر العمل", en: "Publish work" })}
            </button>
            <button
              type="button"
              onClick={() => navigate(editing && id ? `/works/${id}` : "/works")}
              className="px-6 py-3.5 rounded-2xl bg-white/[0.05] border border-white/10 text-white/75 font-semibold text-[14px] hover:bg-white/[0.08] transition-colors"
            >
              {t({ ar: "إلغاء", en: "Cancel" })}
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
        <span className="text-[10px] tracking-[0.16em] uppercase text-white/55">
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
