import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, X, ExternalLink, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { api } from "@/lib/api";
import { credit } from "@/lib/credit";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { I18N } from "@/lib/i18n";

interface Story {
  id: number;
  personName: string;
  role: string;
  quote: string;
  story: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  ventureName: string;
  featured: boolean;
  status: string;
  sortOrder: number;
}

function StoryModal({ story, onClose }: { story: Story; onClose: () => void }) {
  const { t } = useLanguage();
  // Esc closes the modal (parity with the gallery lightbox).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={story.personName}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl bg-[#0f1424] border border-border-strong shadow-2xl"
        >
          {story.coverUrl ? (
            <div className="relative h-40 overflow-hidden rounded-t-3xl">
              <img loading="lazy" decoding="async" src={story.coverUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0f1424]" />
            </div>
          ) : (
            <div className="h-24 rounded-t-3xl bg-gradient-to-br from-primary/30 to-primary/5" />
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label={t({ ar: "إغلاق", en: "Close" })}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-fg-secondary hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>

          <div className="px-7 pb-8 -mt-8 relative">
            <div className="flex items-end gap-4 mb-5">
              {story.avatarUrl ? (
                <img loading="lazy" decoding="async"
                  src={story.avatarUrl}
                  alt={story.personName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-border-strong shadow-lg flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border-2 border-border-strong flex-shrink-0">
                  <span className="text-2xl font-bold text-primary">{story.personName[0]}</span>
                </div>
              )}
              <div>
                <div className="text-[18px] font-bold text-foreground leading-tight">{story.personName}</div>
                <div className="text-[13px] text-muted-foreground mt-0.5">
                  {credit(story.personName, story.role, story.ventureName)}
                </div>
              </div>
            </div>

            {story.quote && (
              <div className="relative mb-5">
                <Quote className="w-6 h-6 text-primary/40 mb-2" />
                <p className="text-[17px] text-foreground leading-relaxed font-medium italic">
                  "{story.quote}"
                </p>
              </div>
            )}

            {story.story && (
              <p className="text-[14px] text-muted-foreground leading-relaxed whitespace-pre-line">
                {story.story}
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function StoryCard({ story, featured, index }: { story: Story; featured: boolean; index: number }) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.5 }}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-label={
          lang === "en"
            ? `Read ${story.personName}'s story`
            : `اقرأ قصة ${story.personName}`
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={`rounded-[24px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${featured ? "md:col-span-2" : ""}`}
      >
        <GlassCard
          className="group cursor-pointer hover:border-primary/30 transition-all duration-300 overflow-hidden flex flex-col h-full"
          onClick={() => setOpen(true)}
        >
          {story.coverUrl && (
            <div className="relative h-44 overflow-hidden">
              <img loading="lazy" decoding="async" src={story.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#15171F]" />
              {story.featured && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/90 backdrop-blur text-[11px] font-bold text-foreground">
                  <Star className="w-3 h-3 fill-current" aria-hidden="true" /> {lang === "en" ? "Featured" : "مميّز"}
                </div>
              )}
            </div>
          )}

          <div className="p-5 flex-1 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              {story.avatarUrl ? (
                <img loading="lazy" decoding="async" src={story.avatarUrl} alt={story.personName} className="w-11 h-11 rounded-xl object-cover border border-border-strong flex-shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary">{story.personName[0]}</span>
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[15px] font-bold text-foreground leading-tight">{story.personName}</div>
                <div className="text-[12px] text-muted-foreground mt-0.5 truncate">
                  {credit(story.personName, story.role, story.ventureName)}
                </div>
              </div>
            </div>

            {story.quote && (
              <p className="text-[13.5px] text-fg-secondary leading-relaxed line-clamp-3 flex-1">
                "{story.quote}"
              </p>
            )}

            <div className="flex items-center gap-1.5 text-primary text-[12px] font-semibold group-hover:gap-2.5 transition-all">
              {lang === "en" ? "Read the full story" : "اقرأ القصة كاملة"} <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
          </div>
        </GlassCard>
      </motion.div>
      {open && <StoryModal story={story} onClose={() => setOpen(false)} />}
    </>
  );
}

export default function Stories() {
  const { lang, t } = useLanguage();
  const p = I18N.pages.stories;
  const { data, isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: () => api<{ stories: Story[] }>("/stories"),
    staleTime: 60_000,
  });

  const stories = data?.stories ?? [];

  return (
    <PageShell
      eyebrow={t(p.eyebrow)}
      title={t(p.title)}
      highlight={t(p.highlight)}
      subtitle={t(p.subtitle)}
    >
      <div className="space-y-12">
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-surface-2 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && stories.length === 0 && (
          <div className="text-center py-24">
            <Quote className="w-12 h-12 text-foreground/10 mx-auto mb-4" />
            <p className="text-fg-secondary text-[15px] font-semibold">{lang === "en" ? "No stories published yet." : "لا قصص منشورة بعد."}</p>
          </div>
        )}

        {!isLoading && stories.length > 0 && (
          <>
            {/* Featured */}
            {stories.some(s => s.featured) && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <Star className="w-4 h-4 text-amber-400 fill-current" />
                  <span className="text-[13px] font-semibold text-muted-foreground tracking-widest uppercase">{lang === "en" ? "Featured Stories" : "قصص مميّزة"}</span>
                </div>
                {/* The lead card is double-width — but only when that still TILES.
                    It occupies 2 of the 3 columns, so the block fills exactly
                    (n - 1) + 2 = n + 1 cells; unless that is a multiple of 3 the
                    second row starts under a half-empty first one and the whole
                    block reads as crooked. With today's 4 featured stories it did
                    exactly that. When the set doesn't tile, every card is equal
                    width and the grid is square again. */}
                {(() => {
                  const feat = stories.filter((s) => s.featured);
                  const leadFitsGrid = (feat.length + 1) % 3 === 0;
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {feat.map((s, i) => (
                        <StoryCard key={s.id} story={s} featured={i === 0 && leadFitsGrid} index={i} />
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* All stories */}
            <div>
              {stories.some(s => s.featured) && (
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px flex-1 bg-surface-2" />
                  <span className="text-[13px] font-semibold text-muted-foreground tracking-widest uppercase">{lang === "en" ? "All Stories" : "كل القصص"}</span>
                  <div className="h-px flex-1 bg-surface-2" />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {(stories.some(s => s.featured) ? stories.filter(s => !s.featured) : stories).map((s, i) => (
                  <StoryCard key={s.id} story={s} featured={false} index={i} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* CTA */}
        <div className="text-center py-8">
          <p className="text-fg-secondary text-[14px] mb-4">هل تريد أن تكون القصّة التالية؟</p>
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-white font-semibold text-[14px] hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            قدّم على الحاضنة ←
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
