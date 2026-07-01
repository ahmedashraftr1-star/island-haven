import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { CATEGORY_LABELS, type Freelancer } from "@/data/freelancers";

export function FreelancerCard({ f, i }: { f: Freelancer; i: number }) {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();
  const nf = (n: number) =>
    new Intl.NumberFormat(lang === "en" ? "en-US" : "ar-EG").format(n);
  const initials = f.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("");

  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5, delay: Math.min(i, 8) * 0.04, ease: EASE_OUT_EXPO }}
      className="h-full"
    >
      <Link
        href={`/contact?type=hire&ref=${encodeURIComponent(f.name)}`}
        data-testid={`freelancer-card-${f.id}`}
        className={`group flex h-full flex-col rounded-[18px] border border-border-strong bg-surface-2/40 p-5 transition-[transform,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none hover:-translate-y-0.5 hover:border-primary/40 ${
          f.available ? "border-t-2 border-t-sand/60" : "border-t-2 border-t-primary"
        }`}
      >
        {/* Top — avatar + availability */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              aria-hidden
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-border-strong bg-white/[0.04] font-display font-black text-sand-bright"
              style={{ fontSize: "1.05rem", letterSpacing: "0.03em" }}
            >
              {initials}
            </span>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-foreground text-[16px] leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                {f.name}
              </h3>
              <p className="t-caption text-fg-secondary line-clamp-1 mt-0.5">{f.title}</p>
            </div>
          </div>
          {f.available ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 h-6 text-[10.5px] font-semibold text-emerald-300">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {t({ ar: "متاح", en: "Open" })}
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center rounded-full border border-border-strong px-2.5 h-6 text-[10.5px] font-semibold text-fg-faint">
              {t({ ar: "مشغول", en: "Busy" })}
            </span>
          )}
        </div>

        {/* Bio */}
        <p className="t-body text-[13.5px] mt-4 line-clamp-2">{f.bio}</p>

        {/* Skills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {f.skills.slice(0, 4).map((s) => (
            <span
              key={s}
              className="inline-flex items-center rounded-md border border-border-strong px-2 py-0.5 text-[11px] text-fg-secondary"
            >
              {s}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 flex items-center justify-between gap-2 border-t border-border-strong/60">
          <div className="flex items-center gap-3 font-mono text-[11.5px] text-fg-secondary tnum">
            <span className="inline-flex items-center gap-1 text-sand">
              <Star className="h-3 w-3 fill-current" /> {f.rating.toFixed(1)}
            </span>
            <span aria-hidden className="text-fg-faint">·</span>
            <span>{nf(f.completedProjects)} {t({ ar: "مشروع", en: "projects" })}</span>
            <span aria-hidden className="text-fg-faint">·</span>
            <span dir="ltr">${nf(f.hourlyRate)}/{t({ ar: "س", en: "hr" })}</span>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-primary">
            {t({ ar: "وظِّف", en: "Hire" })}
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.li>
  );
}
