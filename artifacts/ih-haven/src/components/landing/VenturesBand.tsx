import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Rocket, Star, User } from "lucide-react";
import { api } from "@/lib/api";
import { imageUrl } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";

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
        setRows(sorted.slice(0, 5));
      })
      .catch(() => !cancelled && setRows([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (rows !== null && rows.length === 0) return null;
  const ventures = rows ?? Array.from({ length: 5 }).map(() => null);

  const stageLabel = (stage: string) =>
    lang === "ar" ? STAGE_AR[stage] ?? stage : STAGE_EN[stage] ?? stage;

  return (
    <section id="ventures-band" className="relative bg-background section-y">
      <div className="container-ih">
        {/* Header */}
        <div className="flex items-end justify-between gap-6 mb-[clamp(2rem,4vw,3.5rem)]">
          <Reveal>
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
              <span className="eyebrow">
                {t({ ar: "صُنع في آيلاند", en: "Built at Island Haven" })}
              </span>
            </div>
            <h2 className="t-h2">
              {t({ ar: "مشاريع ", en: "Ventures from " })}
              <span className="text-accent-gradient">
                {t({ ar: "وُلدت من المساحة", en: "the space" })}
              </span>
            </h2>
          </Reveal>
          <Link
            href="/ventures"
            className="hidden sm:inline-flex items-center gap-2 h-11 px-5 rounded-full border border-border-strong bg-surface-2 text-fg-secondary text-[13px] font-semibold hover:border-primary/40 hover:text-foreground transition-colors shrink-0"
          >
            {t({ ar: "كل المشاريع", en: "All ventures" })}
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>

        {/* Portfolio grid — featured card spans 2 cols, taller cinematic covers */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
          {ventures.map((v, i) => {
            const featured = !!v?.featured && i === 0;
            const spanClass = featured ? "sm:col-span-2" : "";

            if (v === null) {
              return (
                <div
                  key={i}
                  className={`card-base h-72 animate-pulse ${i === 0 ? "sm:col-span-2" : ""}`}
                />
              );
            }

            return (
              <Reveal key={v.id} delay={Math.min(i, 5) * 0.06} className={`h-full ${spanClass}`}>
                <Link
                  href={`/ventures/${v.id}`}
                  className="card-base card-hover group block h-full overflow-hidden"
                  data-testid={`venture-band-${v.id}`}
                >
                  {/* Cover */}
                  <div
                    className={`relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-transparent ${
                      featured ? "aspect-[16/9] sm:aspect-[2.4/1]" : "aspect-[16/10]"
                    }`}
                  >
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
                      <span className="absolute top-3 start-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-400/15 text-amber-300 border border-amber-400/30 backdrop-blur-sm">
                        <Star className="w-3 h-3 fill-amber-300" />
                        {t({ ar: "مميّز", en: "Featured" })}
                      </span>
                    )}
                  </div>
                  {/* Body */}
                  <div className={featured ? "p-6" : "p-5"}>
                    <div className="flex items-center gap-3 mb-2">
                      {v.logoUrl && (
                        <img
                          src={imageUrl(v.logoUrl)}
                          alt=""
                          className="w-9 h-9 rounded-[12px] object-contain bg-white p-1 shrink-0"
                          loading="lazy"
                        />
                      )}
                      <h3 className={`t-h3 truncate ${featured ? "text-[20px]" : "text-[16px]"}`}>
                        {v.name}
                      </h3>
                    </div>
                    {v.tagline && (
                      <p className={`t-body text-[13px] mb-4 ${featured ? "line-clamp-3 max-w-2xl" : "line-clamp-2"}`}>
                        {v.tagline}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
                      {v.founderName ? (
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground truncate">
                          <User className="w-3.5 h-3.5 shrink-0" />
                          {v.founderName}
                        </span>
                      ) : (
                        <span />
                      )}
                      <span className="inline-flex items-center gap-1.5 shrink-0">
                        {v.sector && (
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-surface-3 text-fg-secondary border border-border">
                            {v.sector}
                          </span>
                        )}
                        {v.stage && (
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-accent-2-soft text-accent-2 border border-accent-2/20">
                            {stageLabel(v.stage)}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
