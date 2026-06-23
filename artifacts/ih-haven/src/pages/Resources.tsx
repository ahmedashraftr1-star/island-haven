import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  Gift,
  Lock,
  PlayCircle,
  Scale,
  Sparkles,
  Star,
  Wrench,
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

const CATEGORY_ICONS: Record<ResourceCategory, typeof BookOpen> = {
  template: FileText,
  guide: BookOpen,
  tool: Wrench,
  perk: Gift,
  recording: PlayCircle,
  legal: Scale,
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
        <GlassCard className="p-5 mb-7 flex items-start gap-3 border-amber-400/30 bg-amber-400/[0.04]">
          <Lock className="w-5 h-5 text-amber-300 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="text-white font-bold text-[14px] mb-1">
              {t({ ar: "معظم الموارد للمنتسبين فقط", en: "Most resources are for members only" })}
            </div>
            <p className="text-white/65 text-[13px] leading-[1.85] mb-3">
              {t({
                ar: "سجّل دخولك أو انتسب للمساحة لتفتح القوالب، الأدلّة، وحوافز الشّركاء.",
                en: "Log in or join the space to unlock templates, guides, and partner perks.",
              })}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-primary text-white text-[12.5px] font-semibold"
              >
                {t({ ar: "تسجيل الدخول", en: "Log in" })}
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
              <Link
                href="/apply"
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-white/[0.06] border border-white/15 text-[12.5px] font-semibold hover:bg-white/[0.1]"
              >
                {t({ ar: "قدّم على الانتساب", en: "Apply to join" })}
              </Link>
            </div>
          </div>
        </GlassCard>
      )}

      {error && (
        <GlassCard className="p-5 text-red-200 text-center">{error}</GlassCard>
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
                    ? "bg-primary/20 text-white border-primary/40"
                    : "bg-white/[0.04] text-white/65 border-white/10 hover:text-white hover:bg-white/[0.08]"
                }`}
              >
                {t(f.label)}
              </button>
            );
          })}
        </div>
        {!!total && (
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[12.5px] font-medium text-white/70 bg-white/[0.04] border border-white/10">
            {num(total, lang)} {t({ ar: "موردًا", en: "resources" })}
          </span>
        )}
      </div>

      {rows === null && !error ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-[24px] h-48 bg-white/[0.035] border border-white/10 animate-pulse"
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
  const Icon = CATEGORY_ICONS[r.category];
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
          className={`group h-full flex flex-col p-6 transition-colors ${
            r.featured ? "border-amber-400/25 hover:border-amber-300/45" : "hover:border-primary/40"
          }`}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: "radial-gradient(130% 80% at 80% 0%, hsl(354 80% 55% / 0.09), transparent 60%)" }}
          />
          <div className="relative flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 transition-transform duration-300 group-hover:scale-110">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10.5px] tracking-[0.14em] uppercase font-bold bg-white/[0.05] text-white/55 border border-white/10">
                  {categoryLabel(r.category, lang)}
                </span>
                {r.featured && (
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                )}
              </div>
              <h3 className="text-white font-bold text-[15.5px] leading-snug">
                {r.title}
              </h3>
            </div>
          </div>
          {r.summary && (
            <p className="relative text-white/60 text-[13px] leading-[1.85] mb-4 line-clamp-3 flex-1">
              {r.summary}
            </p>
          )}
          <div className="relative pt-3 border-t border-white/[0.06] flex items-center justify-between text-[12.5px] text-white/65 group-hover:text-primary transition-colors font-semibold">
            {r.visibility === "members" ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-200/85">
                <Lock className="w-3 h-3" />
                {t({ ar: "للمنتسبين", en: "Members" })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-200/85">
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
