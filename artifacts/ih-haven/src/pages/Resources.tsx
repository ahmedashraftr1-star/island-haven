import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
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

const CATEGORY_ICONS: Record<ResourceCategory, typeof BookOpen> = {
  template: FileText,
  guide: BookOpen,
  tool: Wrench,
  perk: Gift,
  recording: PlayCircle,
  legal: Scale,
};

const FILTERS: Array<{ key: "" | ResourceCategory; label: string }> = [
  { key: "", label: "الكلّ" },
  { key: "guide", label: "أدلّة" },
  { key: "template", label: "قوالب" },
  { key: "tool", label: "أدوات" },
  { key: "perk", label: "حوافز" },
  { key: "recording", label: "تسجيلات" },
];

export default function Resources() {
  const [rows, setRows] = useState<ResourceCard[] | null>(null);
  const [gated, setGated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"" | ResourceCategory>("");

  useEffect(() => {
    document.title = "دليل الرّائد — Island Haven";
  }, []);

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
          setError(e instanceof ApiError ? e.message : "تعذّر التحميل"),
      );
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = filter ? rows?.filter((r) => r.category === filter) : rows;

  return (
    <PageShell
      eyebrow="دليل الرّائد · The Playbook"
      title="موارد"
      highlight="الحاضنة"
      subtitle="أدلّة، قوالب، أدوات، وحوافز انتقيناها لتسريع مشروعك — من فكرة على ورقة إلى إطلاق إلى نموّ. المحتوى الموسَّع للمنتسبين فقط."
    >
      {gated && (
        <GlassCard className="p-5 mb-7 flex items-start gap-3 border-amber-400/30 bg-amber-400/[0.04]">
          <Lock className="w-5 h-5 text-amber-300 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="text-white font-bold text-[14px] mb-1">
              معظم الموارد للمنتسبين فقط
            </div>
            <p className="text-white/65 text-[13px] leading-[1.85] mb-3">
              سجّل دخولك أو انتسب للمساحة لتفتح القوالب، الأدلّة، وحوافز الشّركاء.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-primary text-white text-[12.5px] font-semibold"
              >
                تسجيل الدخول
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
              <Link
                href="/apply"
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-white/[0.06] border border-white/15 text-[12.5px] font-semibold hover:bg-white/[0.1]"
              >
                قدّم على الانتساب
              </Link>
            </div>
          </div>
        </GlassCard>
      )}

      {error && (
        <GlassCard className="p-5 text-red-200 text-center">{error}</GlassCard>
      )}

      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors border ${
                isActive
                  ? "bg-primary/20 text-white border-primary/40"
                  : "bg-white/[0.04] text-white/65 border-white/10 hover:text-white hover:bg-white/[0.08]"
              }`}
            >
              {f.label}
            </button>
          );
        })}
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
          title="لا موارد بعد"
          hint={
            gated
              ? "بعد تسجيل دخولك ستظهر أدلّة المنتسبين."
              : "نُجهّز أوّل دفعة من القوالب والأدلّة."
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered?.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
            >
              <ResourceCardView r={r} />
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function ResourceCardView({ r }: { r: ResourceCard }) {
  const Icon = CATEGORY_ICONS[r.category];
  const href = r.externalUrl || r.fileUrl;
  return (
    <a
      href={href || "#"}
      target={href ? "_blank" : undefined}
      rel={href ? "noreferrer" : undefined}
      className="group block h-full"
    >
      <GlassCard className="h-full flex flex-col p-6 hover:border-primary/40 transition-colors">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10.5px] tracking-[0.14em] uppercase font-bold bg-white/[0.05] text-white/55 border border-white/10">
                {RESOURCE_CATEGORY_LABELS[r.category]}
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
          <p className="text-white/60 text-[13px] leading-[1.85] mb-4 line-clamp-3 flex-1">
            {r.summary}
          </p>
        )}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[12.5px] text-white/65 group-hover:text-primary transition-colors font-semibold">
          {r.visibility === "members" ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-200/85">
              <Lock className="w-3 h-3" />
              للمنتسبين
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-200/85">
              <Sparkles className="w-3 h-3" />
              للجميع
            </span>
          )}
          {href && (
            <span className="inline-flex items-center gap-1.5">
              {r.externalUrl ? <ExternalLink className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              فتح
            </span>
          )}
        </div>
      </GlassCard>
    </a>
  );
}
