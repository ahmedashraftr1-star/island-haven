import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { ExternalLink, Pencil, Trash2, Phone } from "lucide-react";
import { PageShell, GlassCard, BackLink } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import { ROLE_LABELS, type UserRole } from "@/lib/auth";
import { splitTags, formatArabicDate } from "@/lib/labels";

interface DetailResp {
  work: {
    id: number;
    userId: number;
    title: string;
    summary: string;
    description: string;
    coverUrl: string | null;
    link: string;
    tags: string;
    createdAt: string;
  };
  author: {
    id: number;
    fullName: string;
    role: UserRole;
    avatarUrl: string | null;
    bio: string;
    portfolioUrl: string;
    phone: string;
  };
  isOwner: boolean;
}

export default function WorkDetail() {
  const [, params] = useRoute("/works/:id");
  const [, navigate] = useLocation();
  const id = params?.id;
  const [data, setData] = useState<DetailResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api<DetailResp>(`/works/${id}`)
      .then(setData)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "تعذّر التحميل"),
      );
  }, [id]);

  useEffect(() => {
    if (data?.work?.title) {
      document.title = `${data.work.title} — آيلاند هيفن`;
    }
  }, [data?.work?.title]);

  async function onDelete() {
    if (!id) return;
    if (!window.confirm("هل تريد حذف هذا العمل نهائيًا؟")) return;
    try {
      await api(`/works/${id}`, { method: "DELETE" });
      navigate("/works");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحذف");
    }
  }

  if (error && !data) {
    return (
      <PageShell active="works">
        <BackLink href="/works" label="عودة للمعرض" />
        <GlassCard className="p-8 text-center text-red-200">{error}</GlassCard>
      </PageShell>
    );
  }
  if (!data) {
    return (
      <PageShell active="works">
        <div className="h-96 rounded-[28px] bg-white/[0.035] border border-white/10 animate-pulse" />
      </PageShell>
    );
  }

  const tags = splitTags(data.work.tags);

  return (
    <PageShell active="works">
      <BackLink href="/works" label="كلّ الأعمال" />
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        <GlassCard>
          {data.work.coverUrl ? (
            <div className="aspect-[16/10] overflow-hidden bg-black/30">
              <img
                src={data.work.coverUrl}
                alt={data.work.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[16/10] bg-gradient-to-br from-primary/30 to-transparent" />
          )}
          <div className="p-6 sm:p-8">
            <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-3">
              {formatArabicDate(data.work.createdAt)}
            </div>
            <h1
              className="font-bold text-white leading-tight mb-3"
              style={{ fontSize: "clamp(1.7rem, 4vw, 2.4rem)" }}
              data-testid="text-work-title"
            >
              {data.work.title}
            </h1>
            {data.work.summary && (
              <p className="text-white/65 text-[15.5px] leading-[1.85] mb-5">
                {data.work.summary}
              </p>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11.5px] font-semibold border border-primary/30"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            {data.work.description && (
              <div className="text-white/75 text-[14.5px] leading-[1.95] whitespace-pre-wrap">
                {data.work.description}
              </div>
            )}
            {data.work.link && (
              <a
                href={data.work.link}
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-bold text-[13px] hover:shadow-[0_14px_30px_-10px_rgba(220,38,55,0.55)] hover:-translate-y-px transition-all"
                data-testid="link-external-work"
                dir="ltr"
              >
                <ExternalLink className="w-4 h-4" />
                {data.work.link}
              </a>
            )}
          </div>
        </GlassCard>

        <div className="space-y-5">
          <GlassCard className="p-6">
            <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-4">
              صاحب العمل
            </div>
            <Link
              href={`/u/${data.author.id}`}
              className="flex items-center gap-3 hover:opacity-90 transition-opacity"
              data-testid="link-author"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/40 flex items-center justify-center text-[15px] font-bold text-white">
                {(data.author.fullName || "·").slice(0, 1)}
              </div>
              <div className="leading-tight">
                <div className="text-white font-semibold text-[14px]">
                  {data.author.fullName}
                </div>
                <div className="text-primary text-[10.5px] tracking-[0.18em] uppercase font-bold mt-0.5">
                  {ROLE_LABELS[data.author.role]}
                </div>
              </div>
            </Link>
            {data.author.bio && (
              <p className="text-white/65 text-[13px] leading-[1.85] mt-4">
                {data.author.bio}
              </p>
            )}
            {data.author.phone && (
              <a
                href={`https://wa.me/${data.author.phone.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-[13px] font-semibold hover:bg-emerald-500/15 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> تواصل واتساب
              </a>
            )}
          </GlassCard>

          {data.isOwner && (
            <GlassCard className="p-6 space-y-2.5">
              <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-2">
                إدارة
              </div>
              <Link
                href={`/works/${data.work.id}/edit`}
                className="flex items-center gap-2 w-full py-2.5 px-4 rounded-2xl bg-white/[0.06] border border-white/15 text-white font-semibold text-[13px] hover:bg-white/[0.1] transition-colors"
                data-testid="button-edit-work"
              >
                <Pencil className="w-3.5 h-3.5" /> تعديل
              </Link>
              <button
                onClick={onDelete}
                className="flex items-center gap-2 w-full py-2.5 px-4 rounded-2xl bg-white/[0.04] border border-white/10 text-white/65 font-semibold text-[13px] hover:bg-red-500/15 hover:text-red-200 hover:border-red-500/30 transition-colors"
                data-testid="button-delete-work"
              >
                <Trash2 className="w-3.5 h-3.5" /> حذف
              </button>
            </GlassCard>
          )}
        </div>
      </div>
    </PageShell>
  );
}
