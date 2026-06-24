import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, Star, Clock, User } from "lucide-react";
import { api } from "@/lib/api";
import { splitTags } from "@/lib/labels";
import { useLanguage } from "@/contexts/LanguageContext";

interface ExpertCard {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  headline: string;
  expertise: string;
  yearsExperience: number;
  acceptingSessions: boolean;
  featured: boolean;
}

// Brand-aligned accent family — every avatar plate stays within the warm-red
// system (--primary 354°). Subtle shifts in hue/depth keep the cards from
// feeling monotone while reading as one cohesive, on-brand palette.
const ACCENT_PALETTES = [
  { from: "from-[#dc4454]", to: "to-[#5e1418]", ring: "ring-primary/30", badge: "bg-primary/15 text-[#ff9aa3]" },
  { from: "from-[#b32733]", to: "to-[#3d0e12]", ring: "ring-primary/30", badge: "bg-primary/15 text-[#ff9aa3]" },
  { from: "from-[#e0656a]", to: "to-[#6b1a1d]", ring: "ring-primary/30", badge: "bg-primary/15 text-[#ffb0b6]" },
  { from: "from-[#a51f2c]", to: "to-[#2c0a0d]", ring: "ring-primary/30", badge: "bg-primary/15 text-[#ff9aa3]" },
  { from: "from-[#c9363a]", to: "to-[#4a1316]", ring: "ring-primary/30", badge: "bg-primary/15 text-[#ffa6ab]" },
  { from: "from-[#d04d57]", to: "to-[#561217]", ring: "ring-primary/30", badge: "bg-primary/15 text-[#ffb0b6]" },
];

export function ExpertsBand() {
  const { lang } = useLanguage();
  const [rows, setRows] = useState<ExpertCard[] | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api<{ experts: ExpertCard[] }>("/experts")
      .then((r) => { if (!cancelled) setRows(r.experts.slice(0, 6)); })
      .catch(() => { if (!cancelled) setRows([]); });
    return () => { cancelled = true; };
  }, []);

  if (rows !== null && rows.length === 0) return null;

  const checkScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 20);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 20);
  };

  const scroll = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -380 : 380, behavior: "smooth" });
  };

  const experts = rows ?? Array.from({ length: 4 }).map(() => null);
  const available = rows?.filter((e) => e.acceptingSessions).length ?? 0;

  return (
    <section id="experts" className="relative bg-[#050810] py-20 lg:py-28 overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/[0.06] blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] rounded-full bg-[#1a6cff]/[0.05] blur-[100px]" />
      </div>

      <div className="relative container mx-auto px-6 lg:px-12 max-w-[1500px]">
        {/* Header row */}
        <div className="flex items-end justify-between gap-6 mb-10 lg:mb-14">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold">
                {lang === "en" ? "Mentors & Experts" : "الإرشاد والخبرة"}
              </span>
            </div>
            <h2
              className="font-bold text-white leading-[1.05]"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)", letterSpacing: "-0.03em" }}
            >
              {lang === "en" ? (
                <>Experts who guide you toward <span className="text-primary">impact</span></>
              ) : (
                <>خبراء يأخذون بيدك نحو <span className="text-primary">الأثر</span></>
              )}
            </h2>
            <p className="text-white/65 text-[14.5px] leading-[1.75] mt-3 max-w-xl">
              {lang === "en"
                ? "Book a free one-on-one mentoring session and turn your idea into a scalable project."
                : "احجز جلسة إرشاد فرديّة مَجّانًا، وحوّل فكرتك إلى مشروع قابل للنموّ."}
            </p>
            {rows && available > 0 && (
              <div className="flex items-center gap-2 mt-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-[13px] text-emerald-300/80 font-medium">
                  {available} {lang === "en" ? "experts available now" : "خبير يستقبل جلسات الآن"}
                </span>
              </div>
            )}
          </div>

          {/* Scroll arrows */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => scroll("right")}
              disabled={!canScrollLeft}
              aria-label={lang === "en" ? "Previous experts" : "الخبراء السابقون"}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 disabled:opacity-25 transition-all"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("left")}
              disabled={!canScrollRight}
              aria-label={lang === "en" ? "Next experts" : "الخبراء التاليون"}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 disabled:opacity-25 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal scroll track */}
        <div
          ref={trackRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto pb-4 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {experts.map((e, i) => {
            const palette = ACCENT_PALETTES[i % ACCENT_PALETTES.length];
            if (!e) {
              return (
                <div
                  key={i}
                  className="flex-none w-72 h-80 rounded-[28px] bg-white/[0.03] border border-white/[0.06] animate-pulse"
                  style={{ scrollSnapAlign: "start" }}
                />
              );
            }
            const tags = splitTags(e.expertise).slice(0, 3);
            const initials = e.fullName.trim().split(" ").slice(0, 2).map((w) => w[0]).join("");
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.55, delay: i * 0.06 }}
                style={{ scrollSnapAlign: "start" }}
                className="flex-none w-72"
              >
                <Link
                  href={`/experts/${e.id}`}
                  className="group relative block h-full rounded-[28px] overflow-hidden border border-white/[0.08] hover:border-white/20 transition-all hover:-translate-y-1 hover:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)]"
                  data-testid={`home-expert-${e.id}`}
                >
                  {/* Card top — gradient avatar area */}
                  <div className={`relative h-44 bg-gradient-to-br ${palette.from} ${palette.to} flex items-center justify-center`}>
                    {e.avatarUrl ? (
                      <img
                        src={e.avatarUrl}
                        alt={e.fullName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span
                        className="text-5xl font-black text-white/30 select-none"
                        style={{ letterSpacing: "-0.04em" }}
                      >
                        {initials}
                      </span>
                    )}
                    {/* Featured badge */}
                    {e.featured && (
                      <div className="absolute top-3 start-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 backdrop-blur-sm">
                        <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                        <span className="text-[10px] font-bold tracking-wide text-amber-200">
                          {lang === "en" ? "FEATURED" : "مميّز"}
                        </span>
                      </div>
                    )}
                    {/* Availability */}
                    <div className={`absolute top-3 end-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-sm border ${e.acceptingSessions ? "bg-emerald-500/20 border-emerald-500/30" : "bg-white/10 border-white/20"}`}>
                      {e.acceptingSessions ? (
                        <>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-200">
                            {lang === "en" ? "Open" : "متاح"}
                          </span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-2.5 h-2.5 text-white/65" />
                          <span className="text-[10px] font-medium text-white/65">
                            {lang === "en" ? "Busy" : "مشغول"}
                          </span>
                        </>
                      )}
                    </div>
                    {/* Years exp overlay */}
                    <div className="absolute bottom-3 start-3">
                      <div className="text-[11px] font-bold text-white/80 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
                        {e.yearsExperience > 0 ? `${e.yearsExperience}+ ${lang === "en" ? "yrs" : "سنة"}` : ""}
                      </div>
                    </div>
                  </div>

                  {/* Card bottom — info */}
                  <div className="p-5 bg-[#0d1020]">
                    <h3 className="text-white font-bold text-[15.5px] leading-snug mb-0.5">
                      {e.fullName}
                    </h3>
                    {e.headline && (
                      <p className="text-white/60 text-[12px] leading-snug mb-3 line-clamp-1">
                        {e.headline}
                      </p>
                    )}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium ${palette.badge} border border-white/5`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[11px] text-white/55 group-hover:text-white transition-colors font-medium">
                        {lang === "en" ? "View profile →" : "← الملف الكامل"}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}

          {/* Terminal CTA card */}
          <div className="flex-none w-64" style={{ scrollSnapAlign: "start" }}>
            <Link
              href="/experts"
              className="group flex flex-col items-center justify-center h-full min-h-[22rem] rounded-[28px] border border-dashed border-white/15 hover:border-primary/40 bg-white/[0.02] hover:bg-primary/[0.04] transition-all text-center px-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <p className="text-white font-bold text-[15px] mb-1">
                {lang === "en" ? "All Experts" : "كل الخبراء"}
              </p>
              <p className="text-white/60 text-[12.5px] leading-relaxed">
                {lang === "en" ? "Browse & book a free session" : "تصفّح واحجز جلستك مجّانًا"}
              </p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
