import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Sparkles, Star, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { splitTags } from "@/lib/labels";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";

interface ExpertCard {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  headline: string;
  expertise: string;
  yearsExperience: number;
  acceptingSessions: boolean;
  featured: boolean;
  ratingAvg: number | null;
  ratingCount: number;
}

// Brand-aligned avatar plates — every gradient stays within the warm-red
// primary system, so the dense grid reads as one cohesive palette.
const ACCENT_PLATES = [
  "from-[#dc4454] to-[#3d0e12]",
  "from-[#b32733] to-[#2c0a0d]",
  "from-[#e0656a] to-[#561217]",
  "from-[#a51f2c] to-[#2c0a0d]",
  "from-[#c9363a] to-[#4a1316]",
  "from-[#d04d57] to-[#561217]",
];

export function ExpertsBand() {
  const { lang } = useLanguage();
  const [rows, setRows] = useState<ExpertCard[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ experts: ExpertCard[] }>("/experts")
      .then((r) => { if (!cancelled) setRows(r.experts.slice(0, 6)); })
      .catch(() => { if (!cancelled) setRows([]); });
    return () => { cancelled = true; };
  }, []);

  if (rows !== null && rows.length === 0) return null;

  const experts = rows ?? Array.from({ length: 6 }).map(() => null);
  const available = rows?.filter((e) => e.acceptingSessions).length ?? 0;

  return (
    <section id="experts" className="relative bg-surface-1 section-y">
      <div className="container-ih">
        {/* Header row */}
        <div className="flex items-end justify-between gap-6 mb-[clamp(2rem,4vw,3.5rem)]">
          <Reveal>
            <div className="eyebrow mb-3">
              {lang === "en" ? "Mentors & Experts" : "الإرشاد والخبرة"}
            </div>
            <h2 className="t-h2">
              {lang === "en" ? (
                <>Experts who guide you toward <span className="text-accent-gradient">impact</span></>
              ) : (
                <>خبراء يأخذون بيدك نحو <span className="text-accent-gradient">الأثر</span></>
              )}
            </h2>
            <p className="t-body mt-3 max-w-xl">
              {lang === "en"
                ? "Book a free one-on-one mentoring session and turn your idea into a scalable project."
                : "احجز جلسة إرشاد فرديّة مَجّانًا، وحوّل فكرتك إلى مشروع قابل للنموّ."}
            </p>
            {rows && available > 0 && (
              <div className="inline-flex items-center gap-2 mt-4 px-3 h-7 rounded-full bg-accent-2-soft border border-accent-2/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-2 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-2" />
                </span>
                <span className="text-[12px] text-accent-2 font-semibold tnum">
                  {available} {lang === "en" ? "available now" : "خبير متاح الآن"}
                </span>
              </div>
            )}
          </Reveal>

          <Link
            href="/experts"
            className="hidden sm:inline-flex items-center gap-2 h-11 px-5 rounded-full border border-border-strong bg-surface-2 text-fg-secondary text-[13px] font-semibold hover:border-primary/40 hover:text-foreground transition-colors shrink-0"
          >
            {lang === "en" ? "All experts" : "كل الخبراء"}
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>

        {/* Dense grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
          {experts.map((e, i) => {
            const plate = ACCENT_PLATES[i % ACCENT_PLATES.length];
            if (!e) {
              return <div key={i} className="card-base h-72 animate-pulse" />;
            }
            const tags = splitTags(e.expertise).slice(0, 3);
            const initials = e.fullName.trim().split(" ").slice(0, 2).map((w) => w[0]).join("");
            return (
              <Reveal key={e.id} delay={Math.min(i, 5) * 0.06} className="h-full">
                <Link
                  href={`/experts/${e.id}`}
                  className="card-base card-hover group block h-full overflow-hidden"
                  data-testid={`home-expert-${e.id}`}
                >
                  {/* Avatar plate */}
                  <div className={`relative h-40 bg-gradient-to-br ${plate} flex items-center justify-center`}>
                    {e.avatarUrl ? (
                      <img
                        src={e.avatarUrl}
                        alt={e.fullName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-5xl font-black text-white/30 select-none">
                        {initials}
                      </span>
                    )}
                    {e.featured && (
                      <div className="absolute top-3 start-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 backdrop-blur-sm">
                        <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                        <span className="text-[10px] font-bold tracking-wide text-amber-200">
                          {lang === "en" ? "FEATURED" : "مميّز"}
                        </span>
                      </div>
                    )}
                    <div className={`absolute top-3 end-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-sm border ${e.acceptingSessions ? "bg-accent-2-soft border-accent-2/40" : "bg-black/30 border-white/20"}`}>
                      {e.acceptingSessions ? (
                        <>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-2 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-2" />
                          </span>
                          <span className="text-[10px] font-semibold text-accent-2">
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
                    {e.yearsExperience > 0 && (
                      <div className="absolute bottom-3 start-3 text-[11px] font-bold text-white/85 bg-black/35 backdrop-blur-sm px-2 py-0.5 rounded-full tnum">
                        {e.yearsExperience}+ {lang === "en" ? "yrs" : "سنة"}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <h3 className="t-h3 text-[15.5px] leading-snug truncate">
                        {e.fullName}
                      </h3>
                      {e.ratingCount > 0 && e.ratingAvg != null && (
                        <span className="inline-flex items-center gap-1 shrink-0 text-[12px] font-semibold text-amber-300 tnum mt-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                          {e.ratingAvg.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {e.headline && (
                      <p className="t-caption mb-3 line-clamp-1">{e.headline}</p>
                    )}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-surface-3 text-fg-secondary border border-border"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary group-hover:gap-2.5 transition-all">
                      {lang === "en" ? "View profile" : "الملف الكامل"}
                      <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>

        {/* Terminal CTA */}
        <Reveal delay={0.15} className="mt-6 sm:hidden">
          <Link
            href="/experts"
            className="card-base card-hover group flex items-center justify-center gap-3 h-14 text-center"
          >
            <span className="icon-tile w-9 h-9 rounded-[11px]">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-foreground font-bold text-[14px]">
              {lang === "en" ? "Browse all experts" : "تصفّح كل الخبراء"}
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
