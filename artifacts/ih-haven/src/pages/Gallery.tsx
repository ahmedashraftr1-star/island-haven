import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, ArrowLeft, ImageIcon } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { useContentSection, imageUrl } from "@/hooks/use-content";

const FALLBACK = {
  eyebrow: "Gallery",
  title: "معرض الصّور",
  subtitle:
    "مقتطفاتٌ من أعمال المنتسبين، ولحظاتٍ من حياة المساحة. اضغط أيّ صورة لعرضها بحجمها الكامل.",
  emptyTitle: "لا توجد صور بعد",
  emptyHint: "ستظهر هنا تلقائيًّا مع كلّ عمل جديد.",
  byAuthor: "بقلم",
  openWork: "افتح العمل",
};

// English equivalents of the CMS fallback. Admin AR overrides apply only in
// the Arabic view; English readers see these defaults.
const FALLBACK_EN: typeof FALLBACK = {
  eyebrow: "Gallery",
  title: "Gallery",
  subtitle:
    "Highlights from members' work, and moments from life in the space. Tap any image to view it full-size.",
  emptyTitle: "No images yet",
  emptyHint: "They'll appear here automatically with every new work.",
  byAuthor: "By",
  openWork: "Open work",
};

interface Item {
  id: string;
  url: string;
  title: string;
  author?: string;
  authorId?: number;
  workId?: number;
  kind: "work" | "post";
  at: string;
}

// ── Local archive ───────────────────────────────────────────────────────────
// Every photo here is a real /public/photos/*.webp shot inside Island Haven.
// They serve two jobs:
//   1. A deterministic, same-origin FALLBACK whenever a remote image source is
//      blocked (ERR_BLOCKED_BY_ORB), 404s, or is otherwise unreachable.
//   2. A curated, never-empty editorial grid when the platform has no public
//      images yet — so the page is always full and premium, never broken.
const LOCAL_PHOTOS = [
  { file: "IMG_8357.webp", ar: "صباحٌ في المساحة", en: "A morning in the space" },
  { file: "IMG_8347.webp", ar: "تركيزٌ عميق على التصميم", en: "Deep focus on the craft" },
  { file: "IMG_8300.webp", ar: "الجدار الذي يحمل اسمنا", en: "The wall that carries our name" },
  { file: "IMG_8344.webp", ar: "زاوية هادئة للتفكير", en: "A quiet corner to think" },
  { file: "IMG_8313.webp", ar: "ركن العمل المشترك", en: "The shared workbench" },
  { file: "IMG_8358.webp", ar: "تشبيكٌ بين الأرواح", en: "Threads between people" },
  { file: "IMG_8352.webp", ar: "ورشةٌ نتعلّم فيها معاً", en: "A workshop we learn in together" },
  { file: "IMG_8346.webp", ar: "جلسة عملٍ مفتوحة", en: "An open working session" },
  { file: "IMG_8341.webp", ar: "حواراتٌ تُولد منها فرص", en: "Conversations that spark opportunity" },
  { file: "IMG_8349.webp", ar: "أيدٍ تبني الغد", en: "Hands building tomorrow" },
  { file: "IMG_8353.webp", ar: "مساحةٌ تتّسع للتجربة", en: "Room to experiment" },
  { file: "IMG_8356.webp", ar: "ضحكاتٌ بين الأقران", en: "Laughter among peers" },
  { file: "IMG_8345.webp", ar: "في انتظار البدء", en: "Awaiting the start" },
  { file: "IMG_8303.webp", ar: "تفاصيل مكاننا", en: "The texture of our place" },
  { file: "IMG_8304.webp", ar: "أمسيةٌ في الهيفن", en: "An evening at the Haven" },
  { file: "IMG_8307.webp", ar: "حضورٌ مهنيّ", en: "A professional presence" },
  { file: "IMG_8308.webp", ar: "تركيزٌ جماعيّ", en: "A collective focus" },
  { file: "IMG_8314.webp", ar: "وجوهٌ نفخر بها", en: "Faces we're proud of" },
] as const;

const localSrc = (i: number) =>
  imageUrl(`/photos/${LOCAL_PHOTOS[i % LOCAL_PHOTOS.length].file}`);

/**
 * Resolve any stored image string to a safe, loadable URL.
 * Remote/cross-origin sources are kept (the <img onError> below catches the few
 * that get blocked or 404 and swaps in a local archive photo), while
 * `/...` and `/api/...` paths resolve through imageUrl() under BASE_URL.
 */
const resolveSrc = (url: string) => imageUrl(url);

// Editorial bento rhythm — a repeating 12-col pattern of varied spans so the
// grid reads like a magazine spread, not a uniform thumbnail wall.
const BENTO = [
  "col-span-2 row-span-2 sm:col-span-2 lg:col-span-3 lg:row-span-2", // hero
  "col-span-1 lg:col-span-2",
  "col-span-1 lg:col-span-1",
  "col-span-2 lg:col-span-2",
  "col-span-1 lg:col-span-2 lg:row-span-2", // tall
  "col-span-1 lg:col-span-1",
  "col-span-1 lg:col-span-2",
  "col-span-1 lg:col-span-1",
] as const;

export default function Gallery() {
  const { lang, t } = useLanguage();
  const reduce = useReducedMotion();
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Item | null>(null);
  // CMS overrides are authored in Arabic; in English we fall back to the
  // English defaults rather than showing the raw Arabic copy.
  const c = useContentSection(
    "pageGallery",
    lang === "ar" ? FALLBACK : FALLBACK_EN,
  );

  useEffect(() => {
    document.title =
      lang === "ar" ? "معرض الصّور — آيلاند هيفن" : "Gallery — Island Haven";
  }, [lang]);

  useEffect(() => {
    api<{ items: Item[] }>("/gallery")
      .then((r) => setItems(r.items))
      .catch((e) =>
        setError(
          e instanceof ApiError
            ? e.message
            : t({ ar: "تعذّر التحميل", en: "Couldn't load" }),
        ),
      );
  }, [lang]);

  // Esc closes lightbox
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  // Curated, same-origin archive — used verbatim when the platform has no
  // public images yet, so the page is always a full editorial spread.
  const localItems = useMemo<Item[]>(
    () =>
      LOCAL_PHOTOS.map((p, i) => ({
        id: `local-${i}`,
        url: `/photos/${p.file}`,
        title: lang === "ar" ? p.ar : p.en,
        kind: "post" as const,
        at: "",
      })),
    [lang],
  );

  const usingLocal = items !== null && items.length === 0;
  const grid = usingLocal ? localItems : items;

  return (
    <PageShell
      eyebrow={c.eyebrow}
      title={c.title}
      subtitle={c.subtitle}
      maxWidth="max-w-7xl"
    >
      {error && (
        <GlassCard className="p-6 text-center text-destructive mb-6">
          {error}
        </GlassCard>
      )}

      {/* Archive meta strip — gives the spread an editorial frame */}
      {grid && grid.length > 0 && (
        <div className="mb-7 flex items-center justify-between gap-4 flex-wrap">
          <div className="inline-flex items-center gap-2.5 text-[11px] tracking-[0.2em] uppercase text-muted-foreground font-bold rtl:tracking-normal">
            <ImageIcon className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
            {t({ ar: "أرشيف المساحة", en: "The space archive" })}
          </div>
          <div className="font-editorial tnum text-fg-faint text-[13px]">
            {t({
              ar: `${grid.length} لقطة`,
              en: `${grid.length} frame${grid.length === 1 ? "" : "s"}`,
            })}
          </div>
        </div>
      )}

      {items === null && !error ? (
        <div className="grid grid-cols-2 lg:grid-cols-6 auto-rows-[170px] sm:auto-rows-[200px] gap-3.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-[var(--card-radius)] bg-surface-2 border border-border-strong shadow-soft animate-pulse ${BENTO[i % BENTO.length]}`}
            />
          ))}
        </div>
      ) : grid && grid.length === 0 ? (
        <EmptyState title={c.emptyTitle} hint={c.emptyHint} />
      ) : (
        <div
          className="grid grid-cols-2 lg:grid-cols-6 auto-rows-[170px] sm:auto-rows-[200px] gap-3.5"
          data-testid="gallery-grid"
        >
          {grid?.map((it, i) => (
            <motion.button
              key={it.id}
              type="button"
              onClick={() => setActive(it)}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.5,
                delay: Math.min(i, 11) * 0.035,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`card-base card-hover group relative block overflow-hidden text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${BENTO[i % BENTO.length]}`}
              data-testid={`gallery-item-${it.id}`}
            >
              <img
                src={resolveSrc(it.url)}
                alt={it.title}
                loading={i < 4 ? "eager" : "lazy"}
                decoding="async"
                onError={(e) => {
                  const img = e.currentTarget;
                  // Avoid an infinite loop: only swap to a local archive photo
                  // once, the very first time a source fails (ORB / 404 / CORS).
                  if (img.dataset.fb) return;
                  img.dataset.fb = "1";
                  img.src = localSrc(i);
                }}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05] motion-reduce:transform-none"
              />

              {/* Index numeral — quiet editorial signature */}
              <div className="absolute top-2.5 left-2.5 rtl:left-auto rtl:right-2.5">
                <span className="font-editorial tnum text-[11px] text-white/90 bg-foreground/45 backdrop-blur-md px-2 py-0.5 rounded-full leading-none">
                  {lang === "ar"
                    ? String(i + 1).padStart(2, "0").replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d])
                    : String(i + 1).padStart(2, "0")}
                </span>
              </div>

              {/* Caption — readable scrim, dark photo-overlay context keeps white ink */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 via-foreground/25 to-transparent p-3.5 pt-10 text-right rtl:text-right ltr:text-left">
                <div className="text-white text-[12.5px] font-semibold leading-snug line-clamp-2">
                  {it.title}
                </div>
                {it.author && (
                  <div className="text-white/70 text-[10.5px] mt-0.5 truncate">
                    {it.author}
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setActive(null)}
            role="dialog"
            aria-modal="true"
            aria-label={active.title}
          >
            <motion.div
              initial={reduce ? false : { scale: 0.96, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { scale: 0.96, y: 8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-w-5xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={resolveSrc(active.url)}
                alt={active.title}
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.dataset.fb) return;
                  img.dataset.fb = "1";
                  img.src = localSrc(0);
                }}
                className="w-full max-h-[80vh] object-contain rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
              />
              <div className="mt-4 flex items-center justify-between gap-4 text-white">
                <div className="min-w-0 text-right rtl:text-right ltr:text-left">
                  <div className="font-editorial text-[18px] sm:text-[20px] italic leading-tight truncate">
                    {active.title}
                  </div>
                  {active.author && (
                    <div className="text-white/65 text-[12.5px] truncate mt-1">
                      {c.byAuthor} {active.author}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {active.workId && (
                    <Link
                      href={`/works/${active.workId}`}
                      className="cta-fill inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12.5px] font-semibold"
                    >
                      {c.openWork}
                      <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setActive(null)}
                    className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
                    aria-label={t({ ar: "إغلاق", en: "Close" })}
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
