import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Rocket } from "lucide-react";
import { api } from "@/lib/api";
import { imageUrl } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";

interface Venture {
  id: number;
  name: string;
  tagline: string;
  logoUrl: string | null;
  coverUrl: string | null;
  founderName: string;
  sector: string;
  stage: string;
  featured: boolean;
}

const STAGE_EN: Record<string, string> = {
  idea: "Idea",
  mvp: "MVP",
  launched: "Launched",
  scaling: "Scaling",
  growth: "Growth",
};
const STAGE_AR: Record<string, string> = {
  idea: "فكرة",
  mvp: "نموذج أوّليّ",
  launched: "انطلق",
  scaling: "توسّع",
  growth: "نموّ",
};

/**
 * VenturesBand — homepage portfolio band. Mirrors how world-class incubators
 * (Antler, YC) lead with their companies: real ventures built inside the
 * space, each with founder + sector + stage. Substance, not decoration.
 */
export function VenturesBand() {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<Venture[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ ventures: Venture[] }>("/ventures")
      .then((r) => {
        if (cancelled) return;
        const sorted = [...r.ventures].sort(
          (a, b) => Number(b.featured) - Number(a.featured),
        );
        setRows(sorted.slice(0, 6));
      })
      .catch(() => !cancelled && setRows([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (rows !== null && rows.length === 0) return null;
  const ventures = rows ?? Array.from({ length: 3 }).map(() => null);

  return (
    <section id="ventures-band" className="relative bg-background py-20 lg:py-28 border-t border-border">
      <div className="container mx-auto px-6 lg:px-12 max-w-[1500px]">
        {/* Header */}
        <div className="flex items-end justify-between gap-6 mb-10 lg:mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <Rocket className="w-4 h-4 text-primary" />
              <span className="text-[11px] tracking-[0.2em] uppercase text-primary font-bold">
                {t({ ar: "صُنع في آيلاند", en: "Built at Island Haven" })}
              </span>
            </div>
            <h2
              className="font-display font-extrabold text-foreground"
              style={{ fontSize: "clamp(1.9rem, 4.4vw, 3.2rem)", letterSpacing: "-0.03em" }}
            >
              {t({ ar: "مشاريع ", en: "Ventures from " })}
              <span className="text-accent-gradient">
                {t({ ar: "وُلدت من المساحة", en: "the space" })}
              </span>
            </h2>
          </div>
          <Link
            href="/ventures"
            className="hidden sm:inline-flex items-center gap-2 h-11 px-5 rounded-full border border-border bg-card text-foreground/80 text-[13px] font-semibold hover:border-primary/40 hover:text-foreground transition-colors shrink-0"
          >
            {t({ ar: "كل المشاريع", en: "All ventures" })}
            <ArrowLeft className="w-4 h-4 rtl:rotate-180 ltr:rotate-180" />
          </Link>
        </div>

        {/* Portfolio grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ventures.map((v, i) =>
            v === null ? (
              <div
                key={i}
                className="h-64 rounded-3xl bg-card border border-border animate-pulse"
              />
            ) : (
              <motion.div
                key={v.id}
                initial={{ y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: Math.min(i, 5) * 0.06 }}
              >
                <Link
                  href={`/ventures/${v.id}`}
                  className="group block h-full rounded-3xl bg-card border border-border overflow-hidden hover:border-primary/40 hover:-translate-y-1 transition-all duration-500 shadow-soft hover:shadow-soft-hover"
                  data-testid={`venture-band-${v.id}`}
                >
                  {/* Cover */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
                    {v.coverUrl ? (
                      <img
                        src={imageUrl(v.coverUrl)}
                        alt={v.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Rocket className="w-8 h-8 text-primary/30" />
                      </div>
                    )}
                    {v.featured && (
                      <span className="absolute top-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-400/15 text-amber-300 border border-amber-400/30 start-3">
                        {t({ ar: "مميّز", en: "Featured" })}
                      </span>
                    )}
                  </div>
                  {/* Body */}
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                      {v.logoUrl && (
                        <img
                          src={imageUrl(v.logoUrl)}
                          alt=""
                          className="w-9 h-9 rounded-xl object-contain bg-white p-1 shrink-0"
                          loading="lazy"
                        />
                      )}
                      <h3 className="text-foreground font-bold text-[16px] leading-snug truncate">
                        {v.name}
                      </h3>
                    </div>
                    {v.tagline && (
                      <p className="text-foreground/65 text-[13px] leading-relaxed line-clamp-2 mb-4">
                        {v.tagline}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/70">
                      {v.founderName && (
                        <span className="text-[12px] text-foreground/60 truncate">
                          {v.founderName}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 shrink-0">
                        {v.sector && (
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-white/[0.04] text-foreground/65 border border-border">
                            {v.sector}
                          </span>
                        )}
                        {v.stage && (
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-primary/10 text-primary border border-primary/20">
                            {lang === "ar" ? STAGE_AR[v.stage] ?? v.stage : STAGE_EN[v.stage] ?? v.stage}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
