import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

interface Partner {
  id: number;
  name: string;
  logoUrl: string | null;
  websiteUrl: string;
  description: string;
}

export function Partners() {
  const [rows, setRows] = useState<Partner[] | null>(null);

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

  return (
    <section id="partners" className="relative bg-background py-20 lg:py-24">
      <div className="container mx-auto px-6 lg:px-12 max-w-[1300px]">
        <div className="text-center mb-12">
          <div className="text-[11px] tracking-[0.22em] uppercase text-foreground/45 font-bold mb-3">
            شركاؤنا وداعمونا
          </div>
          <h2 className="text-foreground font-bold text-[clamp(1.4rem,3vw,2rem)] tracking-tight">
            بثقة <span className="text-accent-gradient">شركائنا</span> نكبر
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 sm:gap-x-14">
          {rows.map((p, i) => {
            const inner = p.logoUrl ? (
              <img
                src={p.logoUrl}
                alt={p.name}
                title={p.name}
                className="h-10 sm:h-12 w-auto object-contain opacity-70 hover:opacity-100 grayscale hover:grayscale-0 transition-all"
                loading="lazy"
              />
            ) : (
              <span className="text-foreground/55 hover:text-foreground font-bold text-[15px] transition-colors">
                {p.name}
              </span>
            );
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
              >
                {p.websiteUrl ? (
                  <a href={p.websiteUrl} target="_blank" rel="noreferrer">
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
