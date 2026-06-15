import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

interface Partner {
  id: number;
  name: string;
  logoUrl: string | null;
  websiteUrl: string;
  description: string;
  tier: string;
}

export function Partners() {
  const { lang } = useLanguage();
  const [rows, setRows] = useState<Partner[] | null>(null);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    api<{ partners: Partner[] }>("/partners")
      .then((r) => !cancelled && setRows(r.partners))
      .catch(() => !cancelled && setRows([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (rows === null || rows.length === 0) return null;

  function handleImgError(id: number) {
    setImgErrors((prev) => new Set(prev).add(id));
  }

  return (
    <section id="partners" className="relative bg-background py-20 lg:py-28 overflow-hidden">
      {/* subtle background glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 100%, rgba(220,38,55,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative container mx-auto px-6 lg:px-12 max-w-[1300px]">
        {/* Section header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2.5 px-4 h-8 rounded-full bg-primary/10 text-primary text-[11px] tracking-[0.22em] font-bold uppercase mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {lang === "en" ? "Collaboration" : "تعاون"}
          </div>
          <h2
            className="font-bold tracking-tight text-foreground leading-tight"
            style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)" }}
          >
            {lang === "en" ? (
              <>
                Building together with{" "}
                <span className="text-accent-gradient">our partners</span>
              </>
            ) : (
              <>
                نبني معًا بثقة{" "}
                <span className="text-accent-gradient">شركائنا</span>
              </>
            )}
          </h2>
          <p className="mt-3 text-foreground/55 text-[14px] max-w-xl mx-auto leading-[1.75]">
            {lang === "en"
              ? "Strategic alliances that strengthen the incubator's programs and amplify its impact."
              : "تحالفات استراتيجية تُقوّي برامج الحاضنة وتُضاعف أثرها."}
          </p>
        </div>

        {/* Partner cards */}
        <div className="flex flex-wrap items-stretch justify-center gap-5 sm:gap-6">
          {rows.map((p, i) => {
            const showLogo = p.logoUrl && !imgErrors.has(p.id);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                {p.websiteUrl ? (
                  <a
                    href={p.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex flex-col items-center gap-4 px-7 py-6 rounded-3xl border border-border bg-muted/20 hover:border-primary/35 hover:bg-muted/40 hover:shadow-[0_12px_40px_-12px_rgba(220,38,55,0.15)] transition-all duration-300 min-w-[180px] max-w-[240px] text-center"
                  >
                    <PartnerLogo p={p} showLogo={showLogo} onError={() => handleImgError(p.id)} />
                    <div className="flex-1">
                      <div className="font-bold text-foreground text-[15px] leading-tight mb-1 group-hover:text-primary transition-colors">
                        {p.name}
                      </div>
                      {p.description && (
                        <div
                          className={`text-foreground/55 text-[12px] leading-[1.65] ${lang === "en" ? "text-left" : "text-right"}`}
                        >
                          {p.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-foreground/35 group-hover:text-primary/70 transition-colors">
                      <ExternalLink className="w-3 h-3" />
                      <span dir="ltr">{new URL(p.websiteUrl).hostname}</span>
                    </div>
                  </a>
                ) : (
                  <div className="flex flex-col items-center gap-4 px-7 py-6 rounded-3xl border border-border bg-muted/20 min-w-[180px] max-w-[240px] text-center">
                    <PartnerLogo p={p} showLogo={showLogo} onError={() => handleImgError(p.id)} />
                    <div className="font-bold text-foreground text-[15px]">{p.name}</div>
                    {p.description && (
                      <div className="text-foreground/55 text-[12px] leading-[1.65]">
                        {p.description}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-14 text-center"
        >
          <p className="text-foreground/45 text-[13px] mb-3">
            {lang === "en"
              ? "Want to collaborate with Island Haven?"
              : "تريد التعاون مع آيلاند هيفن؟"}
          </p>
          <a
            href="mailto:hello@islandhaven.ps"
            className="inline-flex items-center gap-2 px-5 h-10 rounded-full border border-border text-[13px] text-foreground/70 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
          >
            {lang === "en" ? "Get in touch" : "تواصل معنا"}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function PartnerLogo({
  p,
  showLogo,
  onError,
}: {
  p: Partner;
  showLogo: boolean;
  onError: () => void;
}) {
  if (showLogo) {
    return (
      <img
        src={p.logoUrl!}
        alt={p.name}
        onError={onError}
        className="w-14 h-14 rounded-2xl object-contain bg-white p-1.5 shadow-sm group-hover:shadow-md transition-shadow"
        loading="lazy"
      />
    );
  }
  return (
    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-[22px]">
      {p.name.charAt(0)}
    </div>
  );
}
