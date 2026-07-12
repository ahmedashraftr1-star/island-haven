import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import {
  Gift,
  Tag,
  Building2,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  Ticket,
} from "lucide-react";
import { PageShell, GlassCard, BackLink } from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { usePageMeta } from "@/hooks/use-meta";
import {
  PERK_CATEGORY_LABELS,
  type PerkCategory,
} from "@/lib/labels";

const PERK_CATEGORY_LABELS_EN: Record<PerkCategory, string> = {
  tool: "Tool",
  course: "Course",
  cloud: "Cloud hosting",
  design: "Design",
  finance: "Finance",
  other: "Other",
};

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

export default function PerkDetail() {
  const { lang, t } = useLanguage();
  const [, params] = useRoute("/perks/:id");
  const id = params?.id;
  const [p, setP] = useState<Perk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api<{ perk: Perk }>(`/perks/${id}`)
      .then((r) => !cancelled && setP(r.perk))
      .catch(
        (e) =>
          !cancelled &&
          setError(
            e instanceof ApiError
              ? e.message
              : lang === "ar"
                ? "تعذّر التحميل"
                : "Couldn't load",
          ),
      );
    return () => {
      cancelled = true;
    };
  }, [id, lang]);

  usePageMeta({
    title: p?.title,
    description: p?.partnerName,
    type: "article",
  });

  if (error && !p) {
    return (
      <PageShell active="perks">
        <BackLink
          href="/perks"
          label={t({ ar: "عودة للعروض", en: "Back to perks" })}
        />
        <GlassCard className="p-8 text-center text-destructive">{error}</GlassCard>
      </PageShell>
    );
  }
  if (!p) {
    return (
      <PageShell active="perks">
        <div className="h-80 rounded-[28px] bg-white/[0.035] border border-border-strong animate-pulse" />
      </PageShell>
    );
  }

  function copyCode() {
    if (!p?.code) return;
    navigator.clipboard?.writeText(p.code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <PageShell active="perks">
      <BackLink
        href="/perks"
        label={t({ ar: "كلّ العروض", en: "All perks" })}
      />

      <GlassCard className="p-6 sm:p-9">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] tracking-[0.1em] uppercase font-bold bg-primary/15 text-primary border border-primary/30">
              <Tag className="w-3.5 h-3.5" />
              {t({
                ar: PERK_CATEGORY_LABELS[p.category],
                en: PERK_CATEGORY_LABELS_EN[p.category],
              })}
            </span>
            {p.featured && (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/15 text-amber-100 border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5" />{" "}
                {t({ ar: "عرض مميّز", en: "Featured perk" })}
              </span>
            )}
          </div>
          {p.logoUrl && (
            <img loading="lazy" decoding="async"
              src={p.logoUrl}
              alt={p.partnerName}
              className="w-16 h-16 rounded-2xl object-contain bg-surface-2 border border-border-strong p-1.5 shrink-0"
            />
          )}
        </div>

        <h1
          className="font-bold text-foreground leading-tight mb-2"
          style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)" }}
          data-testid="text-perk-title"
        >
          {p.title}
        </h1>
        {p.partnerName && (
          <p className="text-primary/90 text-[15px] font-medium mb-6">
            {p.partnerName}
          </p>
        )}

        {/* Facts grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          <Fact
            icon={Tag}
            label={t({ ar: "التصنيف", en: "Category" })}
            value={t({
              ar: PERK_CATEGORY_LABELS[p.category],
              en: PERK_CATEGORY_LABELS_EN[p.category],
            })}
          />
          {p.partnerName && (
            <Fact
              icon={Building2}
              label={t({ ar: "الشريك", en: "Partner" })}
              value={p.partnerName}
            />
          )}
        </div>

        {p.description && (
          <div className="text-fg-secondary text-[14.5px] leading-[1.95] whitespace-pre-wrap mb-7">
            {p.description}
          </div>
        )}

        {p.code && (
          <div className="mb-7">
            <div className="text-[10.5px] tracking-[0.18em] uppercase text-muted-foreground font-bold mb-2.5">
              {t({ ar: "رمز العرض", en: "Promo code" })}
            </div>
            <button
              type="button"
              onClick={copyCode}
              className="group/code flex items-center justify-between gap-3 w-full sm:max-w-sm px-4 h-12 rounded-2xl bg-surface-2 border border-dashed border-border-strong hover:border-primary/45 transition-colors"
              data-testid="button-copy-code"
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <Ticket className="w-4 h-4 text-primary shrink-0" />
                <span className="font-mono text-[14px] tracking-wide text-foreground truncate" dir="ltr">
                  {p.code}
                </span>
              </span>
              {copied ? (
                <span className="inline-flex items-center gap-1 text-[12px] text-emerald-300 shrink-0">
                  <Check className="w-4 h-4" /> {t({ ar: "نُسخ", en: "Copied" })}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground group-hover/code:text-primary transition-colors shrink-0">
                  <Copy className="w-4 h-4" /> {t({ ar: "نسخ", en: "Copy" })}
                </span>
              )}
            </button>
          </div>
        )}

        {p.url ? (
          <a
            href={p.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-primary text-white font-bold text-[15px] hover:-translate-y-px hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] transition-all"
            data-testid="link-claim"
          >
            <Gift className="w-4 h-4" />
            {t({ ar: "احصل على العرض", en: "Claim perk" })}
            <ExternalLink className="w-4 h-4" />
          </a>
        ) : (
          <div className="inline-flex items-center px-5 py-3 rounded-2xl bg-surface-2 border border-border-strong text-muted-foreground text-[13.5px]">
            {t({
              ar: "للحصول على هذا العرض، تواصل مع فريق آيلاند هيفن.",
              en: "To claim this perk, get in touch with the Island Haven team.",
            })}
          </div>
        )}
      </GlassCard>
    </PageShell>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl p-4 bg-surface-2 border border-border-strong">
      <Icon className="w-4 h-4 text-primary mb-2" />
      <div className="text-muted-foreground text-[10.5px] tracking-wide mb-0.5">{label}</div>
      <div className="text-foreground font-semibold text-[13px] leading-snug">{value}</div>
    </div>
  );
}
