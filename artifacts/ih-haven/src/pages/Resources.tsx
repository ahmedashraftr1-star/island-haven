import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Lock,
  Sparkles,
  Star,
} from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import {
  RESOURCE_CATEGORY_LABELS,
  type ResourceCategory,
  type ResourceVisibility,
} from "@/lib/labels";

interface ResourceCard {
  id: number;
  title: string;
  summary: string;
  category: ResourceCategory;
  visibility: ResourceVisibility;
  coverUrl: string | null;
  externalUrl: string;
  fileUrl: string;
  tags: string;
  featured: boolean;
}

// English counterparts to the Arabic-only RESOURCE_CATEGORY_LABELS in @/lib/labels.
const RESOURCE_CATEGORY_LABELS_EN: Record<ResourceCategory, string> = {
  template: "Template",
  guide: "Guide",
  tool: "Tool",
  perk: "Perk",
  recording: "Recording",
  legal: "Legal",
};

const FILTERS: Array<{ key: "" | ResourceCategory; label: { ar: string; en: string } }> = [
  { key: "", label: { ar: "الكلّ", en: "All" } },
  { key: "guide", label: { ar: "أدلّة", en: "Guides" } },
  { key: "template", label: { ar: "قوالب", en: "Templates" } },
  { key: "tool", label: { ar: "أدوات", en: "Tools" } },
  { key: "perk", label: { ar: "حوافز", en: "Perks" } },
  { key: "recording", label: { ar: "تسجيلات", en: "Recordings" } },
];

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
// Localised numeral: Arabic-Indic in AR, Western digits in EN.
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}
// Category label localised by language.
function categoryLabel(category: ResourceCategory, lang: Lang): string {
  return lang === "ar"
    ? RESOURCE_CATEGORY_LABELS[category]
    : RESOURCE_CATEGORY_LABELS_EN[category];
}

export default function Resources() {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<ResourceCard[] | null>(null);
  const [gated, setGated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"" | ResourceCategory>("");
  const reduce = useReducedMotion();

  useEffect(() => {
    document.title =
      lang === "ar" ? "دليل الرّائد — Island Haven" : "Resources — Island Haven";
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    api<{ resources: ResourceCard[]; gated: boolean }>("/resources")
      .then((r) => {
        if (cancelled) return;
        setRows(r.resources);
        setGated(r.gated);
      })
      .catch(
        (e) =>
          !cancelled &&
          setError(
            e instanceof ApiError
              ? e.message
              : lang === "ar"
                ? "تعذّر التحميل"
                : "Couldn't load resources",
          ),
      );
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const base = filter ? (rows ?? []).filter((r) => r.category === filter) : rows ?? [];
  const filtered = [...base].sort((a, b) => Number(b.featured) - Number(a.featured));
  const total = rows?.length ?? 0;

  return (
    <PageShell
      eyebrow={t({ ar: "دليل الرّائد · The Playbook", en: "The Founder's Playbook" })}
      title={t({ ar: "موارد", en: "Incubator" })}
      highlight={t({ ar: "الحاضنة", en: "Resources" })}
      subtitle={t({
        ar: "أدلّة، قوالب، أدوات، وحوافز انتقيناها لتسريع مشروعك — من فكرة على ورقة إلى إطلاق إلى نموّ. المحتوى الموسَّع للمنتسبين فقط.",
        en: "Guides, templates, tools, and perks handpicked to accelerate your venture — from an idea on paper to launch to growth. Extended content is for members only.",
      })}
    >
      {gated && (
        <GlassCard className="p-5 mb-7 flex items-start gap-3.5">
          <span className="grid place-items-center w-10 h-10 rounded-full bg-primary/12 border border-primary/30 shrink-0">
            <Lock className="w-5 h-5 text-primary" />
          </span>
          <div className="flex-1">
            <div className="text-foreground font-bold text-[14px] mb-1">
              {t({ ar: "معظم الموارد للمنتسبين فقط", en: "Most resources are for members only" })}
            </div>
            <p className="text-fg-secondary text-[13px] leading-[1.85] mb-3">
              {t({
                ar: "سجّل دخولك أو انتسب للمساحة لتفتح القوالب، الأدلّة، وحوافز الشّركاء.",
                en: "Log in or join the space to unlock templates, guides, and partner perks.",
              })}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full cta-fill text-[12.5px] font-semibold"
              >
                {t({ ar: "تسجيل الدخول", en: "Log in" })}
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
              <Link
                href="/apply"
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-surface-2 border border-border-strong text-fg-secondary text-[12.5px] font-semibold hover:bg-surface-3 hover:text-foreground transition-colors"
              >
                {t({ ar: "قدّم على الانتساب", en: "Apply to join" })}
              </Link>
            </div>
          </div>
        </GlassCard>
      )}

      {error && (
        <GlassCard className="p-5 text-center text-[13.5px] font-medium text-destructive border-destructive/30">{error}</GlassCard>
      )}

      <div className="flex items-center justify-between gap-3 mb-8 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={isActive ? "true" : "false"}
                className={`px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors border ${
                  isActive
                    ? "cta-fill border-transparent"
                    : "bg-surface-2 text-fg-secondary border-border-strong hover:text-foreground hover:bg-surface-3"
                }`}
              >
                {t(f.label)}
              </button>
            );
          })}
        </div>
        {!!total && (
          <span className="inline-flex items-center px-3.5 h-7 rounded-full text-[12px] font-semibold chip-sand tabular-nums">
            {num(total, lang)} {t({ ar: "موردًا", en: "resources" })}
          </span>
        )}
      </div>

      {rows === null && !error ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-[24px] h-48 bg-surface-2 border border-border-strong shadow-soft animate-pulse"
            />
          ))}
        </div>
      ) : filtered && filtered.length === 0 ? (
        <EmptyState
          title={t({ ar: "لا موارد بعد", en: "No resources yet" })}
          hint={
            gated
              ? t({
                  ar: "بعد تسجيل دخولك ستظهر أدلّة المنتسبين.",
                  en: "Members' guides will appear once you log in.",
                })
              : t({
                  ar: "نُجهّز أوّل دفعة من القوالب والأدلّة.",
                  en: "We're preparing the first batch of templates and guides.",
                })
          }
        />
      ) : (
        <motion.div
          key={filter}
          variants={reduce ? undefined : stagger}
          initial={reduce ? undefined : "hidden"}
          animate={reduce ? undefined : "show"}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filtered.map((r) => (
            <ResourceCardView key={r.id} r={r} reduce={!!reduce} />
          ))}
        </motion.div>
      )}
    </PageShell>
  );
}

function ResourceCardView({ r, reduce }: { r: ResourceCard; reduce: boolean }) {
  const { lang, t } = useLanguage();
  const href = r.externalUrl || r.fileUrl;
  return (
    <motion.div
      variants={reduce ? undefined : rise}
      whileHover={reduce ? undefined : { y: -5 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="h-full"
    >
      <a
        href={href || "#"}
        target={href ? "_blank" : undefined}
        rel={href ? "noreferrer" : undefined}
        className="group block h-full"
      >
        <GlassCard
          className={`card-hover group h-full flex flex-col p-6 transition-colors ${
            r.featured ? "border-primary/30 hover:border-primary/50" : "hover:border-primary/40"
          }`}
        >
          <div className="relative mb-3">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10.5px] tracking-[0.14em] uppercase font-bold bg-surface-3 text-fg-secondary border border-border">
                {categoryLabel(r.category, lang)}
              </span>
              {r.featured && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-primary/12 text-primary border border-primary/30">
                  <Star className="w-3 h-3 fill-primary text-primary" />
                  {t({ ar: "مميّز", en: "Featured" })}
                </span>
              )}
            </div>
            <h3 className="text-foreground font-bold text-[15.5px] leading-snug">
              {r.title}
            </h3>
          </div>
          {r.summary && (
            <p className="relative text-fg-secondary text-[13px] leading-[1.85] mb-4 line-clamp-3 flex-1">
              {r.summary}
            </p>
          )}
          <div className="relative pt-3 border-t border-border flex items-center justify-between text-[12.5px] text-muted-foreground group-hover:text-primary transition-colors font-semibold">
            {r.visibility === "members" ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                <Lock className="w-3 h-3" />
                {t({ ar: "للمنتسبين", en: "Members" })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sand">
                <Sparkles className="w-3 h-3" />
                {t({ ar: "للجميع", en: "Everyone" })}
              </span>
            )}
            {href && (
              <span className="inline-flex items-center gap-1.5">
                {r.externalUrl ? <ExternalLink className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                {t({ ar: "فتح", en: "Open" })}
              </span>
            )}
          </div>
        </GlassCard>
      </a>
    </motion.div>
  );
}
