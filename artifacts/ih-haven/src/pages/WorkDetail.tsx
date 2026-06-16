import { useEffect, useMemo, useState } from "react";
import { usePageMeta } from "@/hooks/use-meta";
import { Link, useLocation, useRoute } from "wouter";
import {
  ExternalLink,
  Pencil,
  Trash2,
  Phone,
  Briefcase,
  Linkedin,
  Github,
  Globe,
  Youtube,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Send,
  Loader2,
} from "lucide-react";
import { PageShell, GlassCard, BackLink } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import { ROLE_LABELS, useAuth, type ExtraLink, type UserRole } from "@/lib/auth";
import { splitTags, formatArabicDate } from "@/lib/labels";

interface DetailResp {
  work: {
    id: number;
    userId: number;
    title: string;
    summary: string;
    description: string;
    coverUrl: string | null;
    galleryUrls: string[] | null;
    videoUrl: string | null;
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
    jobTitle: string;
    portfolioUrl: string;
    linkedinUrl: string;
    behanceUrl: string;
    githubUrl: string;
    otherLinks: ExtraLink[];
    phone: string;
  };
  isOwner: boolean;
  likesCount: number;
  likedByMe: boolean;
  commentsCount: number;
}

interface WorkComment {
  id: number;
  body: string;
  createdAt: string;
  author: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
    role: UserRole;
  };
  canDelete: boolean;
}

/**
 * Parse a YouTube URL into the canonical "embed" URL.
 * Returns null when the URL doesn't look like YouTube — we then render
 * the raw link as a fallback rather than a broken iframe.
 */
function youtubeEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");
    let id = "";
    if (host === "youtu.be") {
      id = u.pathname.slice(1);
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") id = u.searchParams.get("v") || "";
      else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2] || "";
      else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/")[2] || "";
    }
    if (!/^[a-zA-Z0-9_-]{6,20}$/.test(id)) return null;
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
  } catch {
    return null;
  }
}

export default function WorkDetail() {
  const [, params] = useRoute("/works/:id");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const id = params?.id;
  const [data, setData] = useState<DetailResp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);

  // Likes
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [liking, setLiking] = useState(false);

  // Comments
  const [comments, setComments] = useState<WorkComment[]>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api<DetailResp>(`/works/${id}`)
      .then((d) => {
        setData(d);
        setLiked(d.likedByMe);
        setLikesCount(d.likesCount);
        setCommentsCount(d.commentsCount);
      })
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "تعذّر التحميل"),
      );
    api<{ comments: WorkComment[] }>(`/works/${id}/comments`)
      .then((r) => setComments(r.comments))
      .catch(() => {
        /* comments are non-critical; ignore load errors */
      });
  }, [id]);

  async function toggleLike() {
    if (!id || liking) return;
    if (!user) {
      navigate(`/login?next=/works/${id}`);
      return;
    }
    setLiking(true);
    // optimistic
    const prevLiked = liked;
    const prevCount = likesCount;
    setLiked(!prevLiked);
    setLikesCount(prevCount + (prevLiked ? -1 : 1));
    try {
      const r = await api<{ liked: boolean; likesCount: number }>(
        `/works/${id}/like`,
        { method: "POST" },
      );
      setLiked(r.liked);
      setLikesCount(r.likesCount);
    } catch {
      setLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setLiking(false);
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!id || posting) return;
    const body = commentText.trim();
    if (!body) return;
    setPosting(true);
    setCommentError(null);
    try {
      const r = await api<{ comment: WorkComment }>(`/works/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setComments((cs) => [r.comment, ...cs]);
      setCommentsCount((c) => c + 1);
      setCommentText("");
    } catch (err) {
      setCommentError(err instanceof ApiError ? err.message : "تعذّر النشر");
    } finally {
      setPosting(false);
    }
  }

  async function deleteComment(commentId: number) {
    if (!id) return;
    const prev = comments;
    const prevCount = commentsCount;
    setComments((cs) => cs.filter((c) => c.id !== commentId));
    setCommentsCount((c) => Math.max(0, c - 1));
    try {
      await api(`/works/${id}/comments/${commentId}`, { method: "DELETE" });
    } catch {
      setComments(prev);
      setCommentsCount(prevCount);
    }
  }

  usePageMeta({
    title: data?.work.title,
    description: data?.work.summary || undefined,
    image: data?.work.coverUrl || undefined,
    type: "article",
  });

  const allImages = useMemo(() => {
    if (!data) return [];
    const xs: string[] = [];
    if (data.work.coverUrl) xs.push(data.work.coverUrl);
    if (Array.isArray(data.work.galleryUrls)) xs.push(...data.work.galleryUrls);
    return xs;
  }, [data]);

  // Esc + arrows for lightbox
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      else if (e.key === "ArrowLeft")
        setLightbox((i) =>
          i === null ? null : Math.min(allImages.length - 1, i + 1),
        );
      else if (e.key === "ArrowRight")
        setLightbox((i) => (i === null ? null : Math.max(0, i - 1)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, allImages.length]);

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
  const gallery = Array.isArray(data.work.galleryUrls) ? data.work.galleryUrls : [];
  const embed = youtubeEmbedUrl(data.work.videoUrl);

  const authorLinks: Array<{ label: string; url: string; Icon: React.ComponentType<{ className?: string }> }> = [];
  if (data.author.linkedinUrl)
    authorLinks.push({ label: "LinkedIn", url: data.author.linkedinUrl, Icon: Linkedin });
  if (data.author.githubUrl)
    authorLinks.push({ label: "GitHub", url: data.author.githubUrl, Icon: Github });
  if (data.author.portfolioUrl)
    authorLinks.push({ label: "الموقع", url: data.author.portfolioUrl, Icon: Globe });

  return (
    <PageShell active="works">
      <BackLink href="/works" label="كلّ الأعمال" />
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        <div className="space-y-6">
        <GlassCard>
          {data.work.coverUrl ? (
            <button
              type="button"
              onClick={() => setLightbox(0)}
              className="block w-full aspect-[16/10] overflow-hidden bg-black/30 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <img
                src={data.work.coverUrl}
                alt={data.work.title}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
              />
            </button>
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

            {/* Engagement: like toggle + jump-to-comments */}
            <div className="flex items-center gap-3 mb-6">
              <button
                type="button"
                onClick={toggleLike}
                disabled={liking}
                aria-pressed={liked}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[13px] font-bold transition-all ${
                  liked
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-white/[0.06] border-white/15 text-white/75 hover:bg-white/[0.1]"
                }`}
                data-testid="button-like-work"
              >
                <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                <span className="tabular-nums">{likesCount}</span>
                <span className="sr-only">إعجاب</span>
              </button>
              <a
                href="#comments"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/15 text-white/75 text-[13px] font-semibold hover:bg-white/[0.1] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="tabular-nums">{commentsCount}</span>
                <span className="sr-only">تعليق</span>
              </a>
            </div>

            {data.work.description && (
              <div className="text-white/75 text-[14.5px] leading-[1.95] whitespace-pre-wrap">
                {data.work.description}
              </div>
            )}

            {/* Embedded video */}
            {embed && (
              <div className="mt-7">
                <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-3 flex items-center gap-2">
                  <Youtube className="w-4 h-4" /> فيديو
                </div>
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video">
                  <iframe
                    src={embed}
                    title={data.work.title}
                    loading="lazy"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="w-full h-full"
                    data-testid="video-embed"
                  />
                </div>
              </div>
            )}
            {!embed && data.work.videoUrl && (
              <a
                href={data.work.videoUrl}
                target="_blank"
                rel="noreferrer"
                dir="ltr"
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/15 text-white text-[12.5px] font-semibold hover:bg-white/[0.1] transition-colors"
              >
                <Youtube className="w-3.5 h-3.5" /> {data.work.videoUrl}
              </a>
            )}

            {/* Gallery thumbs */}
            {gallery.length > 0 && (
              <div className="mt-7">
                <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-3">
                  معرض الصّور — {gallery.length}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {gallery.map((url, i) => (
                    <button
                      key={`${url}-${i}`}
                      type="button"
                      onClick={() => setLightbox(data.work.coverUrl ? i + 1 : i)}
                      className="aspect-square rounded-xl overflow-hidden border border-white/10 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                      data-testid={`work-gallery-${i}`}
                    >
                      <img
                        src={url}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500"
                      />
                    </button>
                  ))}
                </div>
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

        {/* Comments */}
        <div id="comments">
          <GlassCard className="p-6 sm:p-8">
            <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-5 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> التعليقات — {commentsCount}
            </div>

            {user ? (
              <form onSubmit={submitComment} className="mb-6">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  aria-label="تعليقك"
                  placeholder="شاركنا رأيك في هذا العمل…"
                  className="w-full rounded-2xl bg-white/[0.05] border border-white/15 text-white text-[14px] leading-[1.8] p-4 resize-y focus:outline-none focus:border-primary/50 placeholder:text-white/35"
                  data-testid="input-comment"
                />
                {commentError && (
                  <p className="text-red-300 text-[12.5px] mt-2">{commentError}</p>
                )}
                <div className="flex justify-end mt-3">
                  <button
                    type="submit"
                    disabled={posting || !commentText.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-bold text-[13px] disabled:opacity-50 hover:-translate-y-px transition-all"
                    data-testid="button-submit-comment"
                  >
                    {posting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    نشر
                  </button>
                </div>
              </form>
            ) : (
              <Link
                href="/login"
                className="block mb-6 text-center py-3 rounded-2xl bg-white/[0.05] border border-white/12 text-white/70 text-[13px] font-semibold hover:bg-white/[0.08] transition-colors"
              >
                سجّل الدخول للمشاركة بتعليق
              </Link>
            )}

            {comments.length === 0 ? (
              <p className="text-white/45 text-[13.5px] text-center py-6">
                لا توجد تعليقات بعد — كن أول من يعلّق.
              </p>
            ) : (
              <div className="space-y-4">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3" data-testid={`comment-${c.id}`}>
                    <Link href={`/u/${c.author.id}`} className="shrink-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/30 overflow-hidden flex items-center justify-center text-[13px] font-bold text-white">
                        {c.author.avatarUrl ? (
                          <img
                            src={c.author.avatarUrl}
                            alt={c.author.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (c.author.fullName || "·").slice(0, 1)
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/u/${c.author.id}`}
                          className="text-white font-semibold text-[13px] hover:text-primary transition-colors truncate"
                        >
                          {c.author.fullName}
                        </Link>
                        <span className="text-white/35 text-[11px]">
                          {formatArabicDate(c.createdAt)}
                        </span>
                        {c.canDelete && (
                          <button
                            type="button"
                            onClick={() => deleteComment(c.id)}
                            className="ms-auto text-white/35 hover:text-red-300 transition-colors"
                            aria-label="حذف التعليق"
                            data-testid={`delete-comment-${c.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-white/75 text-[13.5px] leading-[1.85] mt-1 whitespace-pre-wrap break-words">
                        {c.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
        </div>

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
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/40 overflow-hidden flex items-center justify-center text-[15px] font-bold text-white shrink-0">
                {data.author.avatarUrl ? (
                  <img
                    src={data.author.avatarUrl}
                    alt={data.author.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (data.author.fullName || "·").slice(0, 1)
                )}
              </div>
              <div className="leading-tight min-w-0">
                <div className="text-white font-semibold text-[14px] truncate">
                  {data.author.fullName}
                </div>
                <div className="text-primary text-[10.5px] tracking-[0.18em] uppercase font-bold mt-0.5">
                  {ROLE_LABELS[data.author.role]}
                </div>
              </div>
            </Link>
            {data.author.jobTitle && (
              <div className="mt-3 flex items-center gap-1.5 text-white/65 text-[12.5px]">
                <Briefcase className="w-3 h-3 shrink-0" />
                <span className="truncate">{data.author.jobTitle}</span>
              </div>
            )}
            {data.author.bio && (
              <p className="text-white/65 text-[13px] leading-[1.85] mt-4 line-clamp-4">
                {data.author.bio}
              </p>
            )}
            {authorLinks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {authorLinks.map(({ label, url, Icon }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/75 text-[11.5px] font-semibold hover:bg-white/[0.1] transition-colors"
                  >
                    <Icon className="w-3 h-3" /> {label}
                  </a>
                ))}
              </div>
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

      {lightbox !== null && allImages[lightbox] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <img
            src={allImages[lightbox]}
            alt=""
            className="max-w-[92vw] max-h-[88vh] object-contain rounded-2xl shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)]"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/15 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
          {allImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((i) =>
                    i === null ? 0 : Math.min(allImages.length - 1, i + 1),
                  );
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/15 transition-colors"
                aria-label="السابق"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((i) => (i === null ? 0 : Math.max(0, i - 1)));
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/15 transition-colors"
                aria-label="التالي"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white text-[12px] tabular-nums">
                {lightbox + 1} / {allImages.length}
              </div>
            </>
          )}
        </div>
      )}
    </PageShell>
  );
}
