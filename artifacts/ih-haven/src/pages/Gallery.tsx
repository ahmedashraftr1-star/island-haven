import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, ArrowLeft } from "lucide-react";
import { PageShell, EmptyState } from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { useContentSection, imageUrl, photoSrcSet } from "@/hooks/use-content";
import { EASE_OUT_EXPO } from "@/lib/motion";

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
 * Remote/cross-origin sources are kept (the <img loading="lazy" decoding="async" onError> below catches the few
 * that get blocked or 404 and swaps in a local archive photo), while
 * `/...` and `/api/...` paths resolve through imageUrl() under BASE_URL.
 */
const resolveSrc = (url: string) => imageUrl(url);

// Editorial composition rhythm — a slow, asymmetric magazine cadence. A few
// monumental frames carry the spread; the rest breathe at one column. No
// uniform thumbnail wall, no card chrome — photography is the subject.
const SPAN = [
  "md:col-span-7 md:row-span-2", // grand opening frame
  "md:col-span-5",
  "md:col-span-5 md:row-span-2", // tall companion
  "md:col-span-7",
  "md:col-span-4",
  "md:col-span-4",
  "md:col-span-4",
  "md:col-span-8 md:row-span-2", // wide cinematic band
  "md:col-span-4",
  "md:col-span-6",
  "md:col-span-6",
  "md:col-span-5 md:row-span-2", // tall close
  "md:col-span-7",
] as const;

export default function Gallery() {
  const { lang, t, dir } = useLanguage();
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

  // Monumental header — one calm line, a single crimson word, acres of space.
  // No eyebrow rule, no icon tile; scale and restraint carry the grandeur.
  const titleLines =
    lang === "ar"
      ? ["لحظاتٌ من", <span key="a" className="text-primary">الهيفن.</span>]
      : ["Moments from", <span key="a" className="text-primary">the Haven.</span>];

  return (
    <PageShell maxWidth="max-w-[1400px]">
      <header className="max-w-4xl">
        <h1
          className="font-display text-foreground"
          style={{
            fontSize: "clamp(2.6rem, 7.4vw, 5.5rem)",
            lineHeight: "var(--lh-display)",
            letterSpacing: "-0.04em",
            fontWeight: 700,
          }}
        >
          {titleLines.map((ln, i) => (
            <motion.span
              key={i}
              className="block will-change-transform"
              initial={reduce ? false : { opacity: 0, y: 30 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: i * 0.1, ease: EASE_OUT_EXPO }}
            >
              {ln}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.32, ease: EASE_OUT_EXPO }}
          className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-2xl text-fg-secondary"
          style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.35rem)", lineHeight: 1.6 }}
        >
          {c.subtitle}
        </motion.p>
      </header>

      {error && (
        <p className="mt-10 text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* Quiet archive line — the frame count is the only real DATA here, so it
          alone earns the cerulean numeral; everything else stays editorial. */}
      {grid && grid.length > 0 && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.46, ease: EASE_OUT_EXPO }}
          className="mt-[clamp(3rem,7vw,5.5rem)] flex items-baseline justify-between gap-6 pb-[clamp(1.25rem,2.5vw,2rem)] border-b border-border-strong"
        >
          <span className="t-caption text-fg-secondary">
            {t({ ar: "أرشيف المساحة", en: "The space archive" })}
          </span>
          <span className="font-display font-black leading-none tnum text-sand" style={{ fontSize: "clamp(1.1rem,2vw,1.6rem)", letterSpacing: "-0.02em" }}>
            {t({
              ar: `${String(grid.length).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d])} لقطة`,
              en: `${grid.length} frame${grid.length === 1 ? "" : "s"}`,
            })}
          </span>
        </motion.div>
      )}

      {items === null && !error ? (
        <div className="mt-[clamp(2.5rem,5vw,4rem)] grid grid-cols-1 md:grid-cols-12 auto-rows-[clamp(150px,22vw,230px)] gap-[clamp(0.75rem,1.4vw,1.5rem)]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`overflow-hidden bg-surface-2 animate-pulse col-span-1 ${SPAN[i % SPAN.length]}`}
            />
          ))}
        </div>
      ) : grid && grid.length === 0 ? (
        <div className="mt-[clamp(2.5rem,5vw,4rem)]">
          <EmptyState title={c.emptyTitle} hint={c.emptyHint} />
        </div>
      ) : (
        <div
          className="mt-[clamp(2.5rem,5vw,4rem)] grid grid-cols-1 md:grid-cols-12 auto-rows-[clamp(150px,22vw,230px)] gap-[clamp(0.75rem,1.4vw,1.5rem)]"
          data-testid="gallery-grid"
        >
          {grid?.map((it, i) => (
            <motion.button
              key={it.id}
              type="button"
              onClick={() => setActive(it)}
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.7,
                delay: Math.min(i, 8) * 0.04,
                ease: EASE_OUT_EXPO,
              }}
              className={`group relative block overflow-hidden text-start bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background col-span-1 ${SPAN[i % SPAN.length]}`}
              data-testid={`gallery-item-${it.id}`}
            >
              <img
                src={resolveSrc(it.url)}
                // Grid tiles are ~1/3 of the viewport, never 1350px wide — let the
                // browser pick the 640/960 variant for our bundled photos.
                srcSet={photoSrcSet(resolveSrc(it.url))}
                sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                alt={it.title}
                loading={i < 4 ? "eager" : "lazy"}
                decoding="async"
                onError={(e) => {
                  const img = e.currentTarget;
                  // Avoid an infinite loop: only swap to a local archive photo
                  // once, the very first time a source fails (ORB / 404 / CORS).
                  if (img.dataset.fb) return;
                  img.dataset.fb = "1";
                  // Drop the srcset too, or it would keep overriding the fallback src.
                  img.removeAttribute("srcset");
                  img.src = localSrc(i);
                }}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] motion-reduce:transform-none"
              />

              {/* Restraint: no per-photo numeral, no card frame. The caption is a
                  quiet line that surfaces only on hover/focus — photography first. */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-[clamp(0.9rem,1.6vw,1.4rem)] pt-12 opacity-0 translate-y-2 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0 motion-reduce:transition-none">
                <div className="text-white text-[13px] sm:text-[14px] font-semibold leading-snug line-clamp-2">
                  {it.title}
                </div>
                {it.author && (
                  <div className="text-white/65 text-[11px] mt-0.5 truncate">
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
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setActive(null)}
            role="dialog"
            aria-modal="true"
            aria-label={active.title}
            dir={dir}
          >
            <motion.div
              initial={reduce ? false : { scale: 0.96, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { scale: 0.96, y: 8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-w-5xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img loading="lazy" decoding="async"
                src={resolveSrc(active.url)}
                alt={active.title}
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.dataset.fb) return;
                  img.dataset.fb = "1";
                  img.src = localSrc(0);
                }}
                className="w-full max-h-[80vh] object-contain shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
              />
              <div className="mt-5 flex items-center justify-between gap-4 text-white">
                <div className="min-w-0 text-start">
                  <div className="font-display text-[18px] sm:text-[22px] font-bold leading-tight truncate" style={{ letterSpacing: "-0.02em" }}>
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
                      <ArrowLeft className="w-3.5 h-3.5 ltr:rotate-180" />
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
