import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";

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
    <section id="partners" className="relative bg-background section-y-compact">
      <div className="container-ih">
        {/* Section header — compact, single tight line */}
        <Reveal as="header" className="max-w-2xl mb-[clamp(2rem,4vw,3.5rem)]">
          <div className="eyebrow mb-4">
            {lang === "en" ? "Collaboration" : "تعاون"}
          </div>
          <h2 className="t-h2">
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
          <p className="t-body mt-3 max-w-xl">
            {lang === "en"
              ? "Strategic alliances that strengthen the incubator's programs and amplify its impact."
              : "تحالفات استراتيجية تُقوّي برامج الحاضنة وتُضاعف أثرها."}
          </p>
        </Reveal>

        {/* Quiet monochrome partner row — grayscale, lifts to full color on hover */}
        <div className="flex flex-wrap items-stretch gap-3">
          {rows.map((p, i) => {
            const showLogo = !!p.logoUrl && !imgErrors.has(p.id);
            const inner = (
              <>
                <PartnerLogo p={p} showLogo={showLogo} onError={() => handleImgError(p.id)} />
                <div className="min-w-0">
                  <div className="font-bold text-foreground text-[14px] leading-tight truncate group-hover:text-primary transition-colors">
                    {p.name}
                  </div>
                  {p.websiteUrl && (
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground group-hover:text-fg-secondary transition-colors">
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span dir="ltr" className="truncate">{new URL(p.websiteUrl).hostname}</span>
                    </div>
                  )}
                </div>
              </>
            );
            return (
              <Reveal
                key={p.id}
                delay={i * 0.05}
                distance={16}
                className="grow basis-[220px] max-w-[300px]"
              >
                {p.websiteUrl ? (
                  <a
                    href={p.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="card-base card-hover group flex items-center gap-3.5 px-4 py-3.5 h-full"
                  >
                    {inner}
                  </a>
                ) : (
                  <div className="card-base group flex items-center gap-3.5 px-4 py-3.5 h-full">
                    {inner}
                  </div>
                )}
              </Reveal>
            );
          })}
        </div>

        {/* CTA — compact inline */}
        <Reveal delay={0.15} className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="t-caption">
            {lang === "en"
              ? "Want to collaborate with Island Haven?"
              : "تريد التعاون مع آيلاند هيفن؟"}
          </p>
          <a
            href="mailto:hello@islandhaven.ps"
            className="inline-flex items-center gap-2 px-4 h-9 rounded-full border border-border-strong text-[12.5px] font-semibold text-fg-secondary hover:border-primary/50 hover:text-primary transition-colors"
          >
            {lang === "en" ? "Get in touch" : "تواصل معنا"}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </Reveal>
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
        className="w-11 h-11 rounded-[12px] object-contain bg-white p-1.5 shrink-0 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
        loading="lazy"
      />
    );
  }
  return (
    <div className="icon-tile text-[18px] font-bold shrink-0">
      {p.name.charAt(0)}
    </div>
  );
}
