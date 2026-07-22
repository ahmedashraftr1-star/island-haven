import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Gift, Star, Tag, ExternalLink, Copy, Check } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import {
  PERK_CATEGORY_LABELS,
  type PerkCategory,
} from "@/lib/labels";

interface Perk {
  id: number;
  title: string;
  partnerName: string;
  description: string;
  category: PerkCategory;
  code: string;
  url: string;
  logoUrl: string | null;
  featured: boolean;
}

// English variants of the Arabic-only PERK_CATEGORY_LABELS map in @/lib/labels.
const PERK_CATEGORY_LABELS_EN: Record<PerkCategory, string> = {
  tool: "Tool",
  course: "Course",
  cloud: "Cloud hosting",
  design: "Design",
  finance: "Finance",
  other: "Other",
};

const CATEGORY_FILTERS: ("all" | PerkCategory)[] = [
  "all",
  "tool",
  "course",
  "cloud",
  "design",
  "finance",
  "other",
];

export default function Perks() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Perk[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | PerkCategory>("all");
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    document.title = t({
      ar: "العروض والامتيازات — Island Haven",
      en: "Perks & Benefits — Island Haven",
    });
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    const q = filter === "all" ? "/perks" : `/perks?category=${filter}`;
    api<{ perks: Perk[] }>(q)
      .then((r) => !cancelled && setRows(r.perks))
      .catch(
        (e) =>
          !cancelled &&
          setError(
            t({ ar: "تعذّر التحميل", en: "Couldn't load perks" }),
          ),
      );
    return () => {
      cancelled = true;
    };
  }, [filter]);

  function copyCode(id: number, code: string) {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(id);
      window.setTimeout(() => setCopied((c) => (c === id ? null : c)), 1800);
    });
  }

  // Filter chip labels — Arabic from the shared label map, English inline.
  function filterLabel(key: "all" | PerkCategory): string {
    if (key === "all") return t({ ar: "الكلّ", en: "All" });
    return t({ ar: PERK_CATEGORY_LABELS[key], en: PERK_CATEGORY_LABELS_EN[key] });
  }

  return (
    <PageShell
      active="perks"
      eyebrow={t({ ar: "امتيازات المنتسبين", en: "Member Perks" })}
      title={t({ ar: "العروض", en: "Perks" })}
      highlight={t({ ar: "والامتيازات", en: "& Benefits" })}
      subtitle={t({
        ar: "خصومات وأرصدة وعروض حصريّة من شركائنا — أدوات، كورسات، استضافة، وتصميم — مختارة لتوفّر على مشروعك وتسرّع نموّك.",
        en: "Discounts, credits, and exclusive offers from our partners — tools, courses, hosting, and design — curated to save your venture money and speed up its growth.",
      })}
    >
      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 mb-7">
        {CATEGORY_FILTERS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            aria-pressed={filter === key ? "true" : "false"}
            className={`px-4 h-9 rounded-full text-[13px] font-semibold transition-colors border ${
              filter === key
                ? "bg-primary-cta text-white border-primary"
                : "bg-surface-2 text-fg-secondary border-border-strong hover:border-border-strong"
            }`}
          >
            {filterLabel(key)}
          </button>
        ))}
      </div>

      {error && (
        <GlassCard className="p-5 text-destructive text-center">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <div className="grid sm:grid-cols-2 gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[24px] h-52 bg-white/[0.035] border border-border-strong animate-pulse"
            />
          ))}
        </div>
      ) : rows && rows.length === 0 ? (
        <EmptyState
          title={t({
            ar: "لا عروض ضمن هذا التصنيف حاليًّا",
            en: "No perks in this category right now",
          })}
          hint={t({
            ar: "نضيف عروضًا جديدة باستمرار — تابعنا أو جرّب تصنيفًا آخر.",
            en: "We add new perks all the time — stay tuned or try another category.",
          })}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {rows?.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.04 }}
            >
              <GlassCard
                className="h-full flex flex-col p-5 hover:border-primary/40 transition-colors"
                testId={`perk-card-${p.id}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-primary/15 text-primary border border-primary/30">
                        <Tag className="w-3 h-3" />
                        {t({
                          ar: PERK_CATEGORY_LABELS[p.category],
                          en: PERK_CATEGORY_LABELS_EN[p.category],
                        })}
                      </span>
                      {p.featured && (
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <Link
                      href={`/perks/${p.id}`}
                      className="group inline-block"
                    >
                      <h3 className="text-foreground font-bold text-[16.5px] leading-snug mt-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {p.title}
                      </h3>
                    </Link>
                    {p.partnerName && (
                      <p className="text-muted-foreground text-[12.5px] mt-0.5">
                        {p.partnerName}
                      </p>
                    )}
                  </div>
                  {p.logoUrl && (
                    <img loading="lazy" decoding="async"
                      src={p.logoUrl}
                      alt={p.partnerName}
                      className="w-11 h-11 rounded-xl object-contain bg-surface-2 border border-border-strong p-1 shrink-0"
                    />
                  )}
                </div>

                {p.description && (
                  <p className="text-fg-secondary text-[12.5px] leading-[1.7] line-clamp-2 mb-3">
                    {p.description}
                  </p>
                )}

                {p.code && (
                  <button
                    type="button"
                    onClick={() => copyCode(p.id, p.code)}
                    className="group/code flex items-center justify-between gap-2 mb-3 px-3 h-9 rounded-xl bg-surface-2 border border-dashed border-border-strong hover:border-primary/40 transition-colors"
                    data-testid={`perk-code-${p.id}`}
                  >
                    <span className="font-mono text-[12.5px] tracking-wide text-foreground truncate" dir="ltr">
                      {p.code}
                    </span>
                    {copied === p.id ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 shrink-0">
                        <Check className="w-3.5 h-3.5" /> {t({ ar: "نُسخ", en: "Copied" })}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground group-hover/code:text-primary transition-colors shrink-0">
                        <Copy className="w-3.5 h-3.5" /> {t({ ar: "نسخ", en: "Copy" })}
                      </span>
                    )}
                  </button>
                )}

                <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-border-strong">
                  {p.url ? (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-primary-cta text-white text-[12.5px] font-bold hover:-translate-y-px hover:shadow-[0_14px_30px_-12px_rgba(220,38,55,0.55)] transition-all"
                      data-testid={`perk-claim-${p.id}`}
                    >
                      <Gift className="w-3.5 h-3.5" />
                      {t({ ar: "احصل على العرض", en: "Claim offer" })}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-[12px] text-muted-foreground">
                      {t({
                        ar: "تواصل مع الفريق للحصول على العرض.",
                        en: "Contact the team to claim this offer.",
                      })}
                    </span>
                  )}
                  <Link
                    href={`/perks/${p.id}`}
                    className="group inline-flex items-center gap-1 text-[12px] text-fg-secondary hover:text-primary transition-colors font-semibold shrink-0"
                  >
                    {t({ ar: "التفاصيل", en: "Details" })}
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                  </Link>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
