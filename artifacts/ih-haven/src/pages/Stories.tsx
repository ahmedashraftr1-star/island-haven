import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, X, ExternalLink, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { api } from "@/lib/api";
import { Link } from "wouter";

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
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl bg-[#0f1424] border border-white/10 shadow-2xl"
        >
          {story.coverUrl ? (
            <div className="relative h-40 overflow-hidden rounded-t-3xl">
              <img src={story.coverUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0f1424]" />
            </div>
          ) : (
            <div className="h-24 rounded-t-3xl bg-gradient-to-br from-primary/30 to-primary/5" />
          )}

          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="px-7 pb-8 -mt-8 relative">
            <div className="flex items-end gap-4 mb-5">
              {story.avatarUrl ? (
                <img
                  src={story.avatarUrl}
                  alt={story.personName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/10 shadow-lg flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border-2 border-white/10 flex-shrink-0">
                  <span className="text-2xl font-bold text-primary">{story.personName[0]}</span>
                </div>
              )}
              <div>
                <div className="text-[18px] font-bold text-white leading-tight">{story.personName}</div>
                <div className="text-[13px] text-white/55 mt-0.5">{story.role} · {story.ventureName}</div>
              </div>
            </div>

            {story.quote && (
              <div className="relative mb-5">
                <Quote className="w-6 h-6 text-primary/40 mb-2" />
                <p className="text-[17px] text-white/85 leading-relaxed font-medium italic">
                  "{story.quote}"
                </p>
              </div>
            )}

            {story.story && (
              <p className="text-[14px] text-white/60 leading-relaxed whitespace-pre-line">
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
  const [open, setOpen] = useState(false);
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.5 }}
      >
        <GlassCard
          className={`group cursor-pointer hover:border-primary/30 transition-all duration-300 overflow-hidden flex flex-col ${featured ? "md:col-span-2" : ""}`}
          onClick={() => setOpen(true)}
        >
          {story.coverUrl && (
            <div className="relative h-44 overflow-hidden">
              <img src={story.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#15171F]" />
              {story.featured && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/90 backdrop-blur text-[11px] font-bold text-white">
                  <Star className="w-3 h-3 fill-current" /> مميّز
                </div>
              )}
            </div>
          )}

          <div className="p-5 flex-1 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              {story.avatarUrl ? (
                <img src={story.avatarUrl} alt={story.personName} className="w-11 h-11 rounded-xl object-cover border border-white/10 flex-shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary">{story.personName[0]}</span>
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[15px] font-bold text-white leading-tight">{story.personName}</div>
                <div className="text-[12px] text-white/45 mt-0.5 truncate">{story.role} · {story.ventureName}</div>
              </div>
            </div>

            {story.quote && (
              <p className="text-[13.5px] text-white/65 leading-relaxed line-clamp-3 flex-1">
                "{story.quote}"
              </p>
            )}

            <div className="flex items-center gap-1.5 text-primary text-[12px] font-semibold group-hover:gap-2.5 transition-all">
              اقرأ القصة كاملة <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </div>
        </GlassCard>
      </motion.div>
      {open && <StoryModal story={story} onClose={() => setOpen(false)} />}
    </>
  );
}

export default function Stories() {
  const { data, isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: () => api<{ stories: Story[] }>("/stories"),
    staleTime: 60_000,
  });

  const stories = data?.stories ?? [];

  return (
    <PageShell
      eyebrow="Success Stories"
      title="قصص النجاح"
      highlight="النجاح"
      subtitle="أشخاص من قلب غزة بنوا مشاريعهم من الصفر — هذه قصصهم."
    >
      <div className="space-y-12">
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && stories.length === 0 && (
          <div className="text-center py-24">
            <Quote className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40 text-[15px]">لا قصص منشورة بعد.</p>
          </div>
        )}

        {!isLoading && stories.length > 0 && (
          <>
            {/* Featured */}
            {stories.some(s => s.featured) && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <Star className="w-4 h-4 text-amber-400 fill-current" />
                  <span className="text-[13px] font-semibold text-white/50 tracking-widest uppercase">قصص مميّزة</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {stories.filter(s => s.featured).map((s, i) => (
                    <StoryCard key={s.id} story={s} featured={i === 0} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* All stories */}
            <div>
              {stories.some(s => s.featured) && (
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[13px] font-semibold text-white/40 tracking-widest uppercase">كل القصص</span>
                  <div className="h-px flex-1 bg-white/10" />
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
          <p className="text-white/40 text-[14px] mb-4">هل تريد أن تكون القصّة التالية؟</p>
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
