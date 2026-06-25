import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Star } from "lucide-react";
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

/**
 * ExpertsBand — the mentor roster, told the editorial way: an asymmetric header
 * aligned to the logical start, a live availability index in warm sand, and a
 * roster of people-cards (a real card warranted by faces) on ONE quiet card spec.
 * No gradient heading, no glass badges, no icon-tile CTA — type + portrait carry it.
 */
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
        {/* Editorial header — start-aligned, oversized solid display */}
        <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5rem)] gap-y-6 items-end mb-[clamp(2.5rem,5vw,4rem)]">
          <Reveal as="div" className="lg:col-span-8">
            <div className="eyebrow mb-5">
              {lang === "en" ? "Mentors & Experts" : "الإرشاد والخبرة"}
            </div>
            <h2
              className="font-display font-extrabold text-foreground"
              style={{ fontSize: "clamp(2rem, 4.4vw, 3.6rem)", lineHeight: 1.04, letterSpacing: "-0.028em" }}
            >
              {lang === "en"
                ? "Experts who guide you toward impact."
                : "خبراء يأخذون بيدك نحو الأثر."}
            </h2>
            <p className="t-body mt-5 max-w-xl">
              {lang === "en"
                ? "Book a free one-on-one mentoring session and turn your idea into a scalable project."
                : "احجز جلسة إرشاد فرديّة مَجّانًا، وحوّل فكرتك إلى مشروع قابل للنموّ."}
            </p>
            {rows && available > 0 && (
              <div className="inline-flex items-center gap-2 mt-6 px-3 h-7 rounded-full chip-sand">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sand opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sand" />
                </span>
                <span className="text-[12px] font-semibold tabular-nums">
                  {available} {lang === "en" ? "available now" : "خبير متاح الآن"}
                </span>
              </div>
            )}
          </Reveal>

          <div className="lg:col-span-4 lg:justify-self-end">
            <Link
              href="/experts"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-border-strong bg-surface-2 text-fg-secondary text-[13px] font-semibold hover:border-primary/40 hover:text-foreground transition-colors"
            >
              {lang === "en" ? "All experts" : "كل الخبراء"}
              <ArrowLeft className="w-4 h-4 rotate-180 rtl:rotate-0" />
            </Link>
          </div>
        </div>

        {/* Roster — people-cards, one quiet card spec, portrait-forward */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
          {experts.map((e, i) => {
            if (!e) {
              return <div key={i} className="card-base h-80 animate-pulse" />;
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
                  {/* Portrait */}
                  <div className="relative h-48 bg-surface-3 flex items-center justify-center overflow-hidden">
                    {e.avatarUrl ? (
                      <img
                        src={e.avatarUrl}
                        alt={e.fullName}
                        className="w-full h-full object-cover saturate-[1.03] transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                    ) : (
                      <span className="font-display text-6xl font-black text-fg-faint/40 select-none">
                        {initials}
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />
                    {e.featured && (
                      <div className="absolute top-3 start-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full chip-sand">
                        <Star className="w-3 h-3 fill-sand text-sand" />
                        <span className="text-[10px] font-bold tracking-wide">
                          {lang === "en" ? "FEATURED" : "مميّز"}
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-3 start-3 inline-flex items-center gap-1.5">
                      {e.acceptingSessions ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-2 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-2" />
                          </span>
                          {lang === "en" ? "Open" : "متاح"}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-white/70">
                          {lang === "en" ? "Busy" : "مشغول"}
                        </span>
                      )}
                    </div>
                    {e.yearsExperience > 0 && (
                      <div className="absolute bottom-3 end-3 text-[11px] font-bold text-white/90 tabular-nums">
                        {e.yearsExperience}+ {lang === "en" ? "yrs" : "سنة"}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <h3 className="font-display font-bold text-foreground text-[16px] leading-snug truncate group-hover:text-primary transition-colors">
                        {e.fullName}
                      </h3>
                      {e.ratingCount > 0 && e.ratingAvg != null && (
                        <span className="inline-flex items-center gap-1 shrink-0 text-[12px] font-semibold text-sand tabular-nums mt-0.5">
                          <Star className="w-3.5 h-3.5 fill-sand text-sand" />
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
                      <ArrowLeft className="w-3.5 h-3.5 rotate-180 rtl:rotate-0" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>

        {/* Terminal CTA — quiet text link, no icon tile */}
        <Reveal delay={0.15} className="mt-8 sm:hidden">
          <Link
            href="/experts"
            className="group inline-flex items-center gap-2 text-[14px] font-semibold text-primary"
          >
            {lang === "en" ? "Browse all experts" : "تصفّح كل الخبراء"}
            <ArrowLeft className="w-4 h-4 rotate-180 rtl:rotate-0 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
