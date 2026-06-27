import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { I18N } from "@/lib/i18n";

interface Investor {
  id: number;
  name: string;
  logoUrl: string | null;
  websiteUrl: string;
  description: string;
  type: string;
  investmentFocus: string;
  status: string;
  sortOrder: number;
}

const TYPE_LABELS_AR: Record<string, string> = {
  lead: "مستثمر رئيسي", angel: "مستثمر ملاك", vc: "صندوق رأس مال مخاطر",
  corporate: "شراكة مؤسسية", ngo: "منظمة دولية", individual: "مانح فردي",
};
const TYPE_LABELS_EN: Record<string, string> = {
  lead: "Lead Investor", angel: "Angel Investor", vc: "Venture Capital",
  corporate: "Corporate Partner", ngo: "International NGO", individual: "Individual Donor",
};

const TYPE_COLORS: Record<string, string> = {
  lead: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  angel: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  vc: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  corporate: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  ngo: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  individual: "bg-surface-2 text-muted-foreground border-border-strong",
};

export default function Investors() {
  const { lang, t } = useLanguage();
  const p = I18N.pages.investors;
  const { data, isLoading } = useQuery({
    queryKey: ["investors"],
    queryFn: () => api<{ investors: Investor[] }>("/investors"),
    staleTime: 60_000,
  });

  const investors = data?.investors ?? [];

  return (
    <PageShell
      eyebrow={t(p.eyebrow)}
      title={t(p.title)}
      highlight={t(p.highlight)}
      subtitle={t(p.subtitle)}
    >
      <div className="space-y-16">
        {/* Why Invest — start-aligned numbered hairline ledger */}
        <section>
          <div className="mb-8 sm:mb-10">
            <div className="eyebrow eyebrow-sand mb-2">{lang === "en" ? "Why Invest" : "لماذا تستثمر"}</div>
            <h2
              className="font-display font-extrabold text-foreground"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.1rem)", lineHeight: 1.08, letterSpacing: "-0.025em" }}
            >
              {lang === "en" ? "Why Invest in Island Haven?" : "لماذا تستثمر في آيلاند؟"}
            </h2>
          </div>
          <div className="border-t border-border-strong">
            {p.whyItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08 }}
                className="grid grid-cols-[auto_1fr] gap-x-5 sm:gap-x-7 items-baseline border-b border-border py-5"
              >
                <span className="font-display text-[15px] font-bold tnum text-sand leading-none">
                  {lang === "en" ? String(i + 1).padStart(2, "0") : ["٠١", "٠٢", "٠٣", "٠٤"][i]}
                </span>
                <div>
                  <h3 className="text-[15px] font-bold text-foreground">{t(item.title)}</h3>
                  <p className="t-body mt-1.5 max-w-lg">{t(item.desc)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Current Investors */}
        <section>
          <div className="mb-6">
            <div className="text-[11px] font-bold text-primary/60 tracking-widest uppercase mb-1">Our Backers</div>
            <h2 className="text-[20px] font-bold text-foreground">مستثمرونا وداعمونا</h2>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-36 rounded-2xl bg-surface-2 animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && investors.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border-strong p-12 text-center">
              <p className="text-fg-secondary text-[14px] font-semibold">يُعلَن عنهم قريباً.</p>
            </div>
          )}

          {!isLoading && investors.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {investors.map((inv, i) => (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <GlassCard className="p-5 h-full flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      {inv.logoUrl ? (
                        <img src={inv.logoUrl} alt={inv.name} className="w-12 h-12 rounded-xl object-cover border border-border-strong flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0 border border-border-strong">
                          <span className="text-xl font-bold text-muted-foreground">{inv.name[0]}</span>
                        </div>
                      )}
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${TYPE_COLORS[inv.type] ?? "bg-surface-2 text-muted-foreground border-border-strong"}`}>
                        {(lang === "en" ? TYPE_LABELS_EN : TYPE_LABELS_AR)[inv.type] ?? inv.type}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-[15px] font-bold text-foreground">{inv.name}</h3>
                      {inv.investmentFocus && (
                        <p className="text-[12px] text-muted-foreground mt-0.5">{inv.investmentFocus}</p>
                      )}
                    </div>

                    {inv.description && (
                      <p className="text-[13px] text-muted-foreground leading-relaxed flex-1">
                        {inv.description}
                      </p>
                    )}

                    {inv.websiteUrl && (
                      <a
                        href={inv.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[12px] text-primary/60 hover:text-primary transition-colors mt-auto"
                      >
                        زيارة الموقع <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Investment CTA — start-aligned flat band */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="surface-2 rounded-[28px] p-8 sm:p-11"
          >
            <h3
              className="font-display font-extrabold text-foreground"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.1rem)", lineHeight: 1.08, letterSpacing: "-0.025em" }}
            >
              {t(p.investTitle)}
            </h3>
            <p className="t-body mt-4 max-w-xl">
              {t(p.investBody)}
            </p>
            <div className="mt-8 flex items-center gap-3 flex-wrap">
              <a
                href="mailto:island-haven@nastonas.org"
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full cta-fill font-bold text-[14px] transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-16px_hsl(354_82%_30%_/_0.55)]"
              >
                <Mail className="w-4 h-4" />
                {t(p.contactBtn)}
              </a>
              <a
                href="https://wa.me/972567536815"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-border-strong text-fg-secondary font-medium text-[14px] hover:border-foreground/30 hover:text-foreground transition-all"
              >
                WhatsApp
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              </a>
            </div>
          </motion.div>
        </section>
      </div>
    </PageShell>
  );
}
