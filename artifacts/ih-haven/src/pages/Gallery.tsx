import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { useContentSection } from "@/hooks/use-content";

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

export default function Gallery() {
  const { lang, t } = useLanguage();
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

  return (
    <PageShell
      eyebrow={c.eyebrow}
      title={c.title}
      subtitle={c.subtitle}
      maxWidth="max-w-7xl"
    >
      {error && (
        <GlassCard className="p-6 text-center text-red-200 mb-6">{error}</GlassCard>
      )}

      {items === null && !error ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl bg-white/[0.035] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : items && items.length === 0 ? (
        <EmptyState title={c.emptyTitle} hint={c.emptyHint} />
      ) : (
        <div
          className="columns-2 sm:columns-3 lg:columns-4 gap-3 [&>*]:mb-3"
          data-testid="gallery-grid"
        >
          {items?.map((it, i) => (
            <motion.button
              key={it.id}
              type="button"
              onClick={() => setActive(it)}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.4, delay: Math.min(i, 12) * 0.02 }}
              className="break-inside-avoid w-full block group rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              data-testid={`gallery-item-${it.id}`}
            >
              <img
                src={it.url}
                alt={it.title}
                loading="lazy"
                className="w-full h-auto block group-hover:scale-[1.03] transition-transform duration-700"
              />
              <div className="px-3 py-2 text-right">
                <div className="text-white/85 text-[12px] font-semibold truncate">
                  {it.title}
                </div>
                {it.author && (
                  <div className="text-white/45 text-[10.5px] truncate">
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
              initial={{ scale: 0.96, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-w-5xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={active.url}
                alt={active.title}
                className="w-full max-h-[80vh] object-contain rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
              />
              <div className="mt-4 flex items-center justify-between gap-4 text-white">
                <div className="min-w-0">
                  <div className="text-[16px] font-bold truncate">{active.title}</div>
                  {active.author && (
                    <div className="text-white/55 text-[12.5px] truncate">
                      {c.byAuthor} {active.author}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {active.workId && (
                    <Link
                      href={`/works/${active.workId}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-primary text-primary-foreground text-[12.5px] font-semibold"
                    >
                      {c.openWork}
                      <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setActive(null)}
                    className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/15 transition-colors"
                    aria-label={t({ ar: "إغلاق", en: "Close" })}
                  >
                    <X className="w-4 h-4" />
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
