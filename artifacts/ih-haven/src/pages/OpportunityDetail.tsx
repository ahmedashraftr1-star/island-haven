import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import {
  Briefcase,
  MapPin,
  Clock,
  Coins,
  Building2,
  ExternalLink,
  Mail,
  Sparkles,
} from "lucide-react";
import { PageShell, GlassCard, BackLink } from "@/components/shell/PageShell";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { usePageMeta } from "@/hooks/use-meta";
import {
  OPPORTUNITY_TYPE_LABELS,
  OPPORTUNITY_LOCATION_LABELS,
  type OpportunityType,
  type OpportunityLocation,
  formatArabicDate,
  splitTags,
} from "@/lib/labels";

const OPPORTUNITY_TYPE_LABELS_EN: Record<OpportunityType, string> = {
  job: "Job",
  internship: "Internship",
  freelance: "Freelance",
  gig: "Gig",
  volunteer: "Volunteer",
};

const OPPORTUNITY_LOCATION_LABELS_EN: Record<OpportunityLocation, string> = {
  onsite: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

// Localised date: Arabic-Indic in AR, Western in EN.
function fmtDate(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return "";
  return lang === "ar"
    ? formatArabicDate(iso)
    : new Date(iso).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
}

interface Opportunity {
  id: number;
  title: string;
  organization: string;
  type: OpportunityType;
  locationType: OpportunityLocation;
  city: string;
  description: string;
  skills: string;
  compensation: string;
  applyUrl: string;
  applyEmail: string;
  deadline: string | null;
  featured: boolean;
}

export default function OpportunityDetail() {
  const { lang, t } = useLanguage();
  const [, params] = useRoute("/opportunities/:id");
  const id = params?.id;
  const [o, setO] = useState<Opportunity | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api<{ opportunity: Opportunity }>(`/opportunities/${id}`)
      .then((r) => !cancelled && setO(r.opportunity))
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
    title: o?.title,
    description: o?.organization,
    type: "article",
  });

  if (error && !o) {
    return (
      <PageShell active="opportunities">
        <BackLink
          href="/opportunities"
          label={t({ ar: "عودة للفرص", en: "Back to opportunities" })}
        />
        <GlassCard className="p-8 text-center text-destructive">{error}</GlassCard>
      </PageShell>
    );
  }
  if (!o) {
    return (
      <PageShell active="opportunities">
        <div className="h-80 rounded-[28px] bg-white/[0.035] border border-border-strong animate-pulse" />
      </PageShell>
    );
  }

  const tags = splitTags(o.skills);
  const applyHref = o.applyUrl
    ? o.applyUrl
    : o.applyEmail
      ? `mailto:${o.applyEmail}?subject=${encodeURIComponent(
          t({ ar: "تقديم على: ", en: "Application for: " }) + o.title,
        )}`
      : null;

  return (
    <PageShell active="opportunities">
      <BackLink
        href="/opportunities"
        label={t({ ar: "كلّ الفرص", en: "All opportunities" })}
      />

      <GlassCard className="p-6 sm:p-9">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] tracking-[0.1em] uppercase font-bold bg-primary/15 text-primary border border-primary/30">
            <Briefcase className="w-3.5 h-3.5" />
            {t({
              ar: OPPORTUNITY_TYPE_LABELS[o.type],
              en: OPPORTUNITY_TYPE_LABELS_EN[o.type],
            })}
          </span>
          {o.featured && (
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/15 text-amber-100 border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" />{" "}
              {t({ ar: "فرصة مميّزة", en: "Featured opportunity" })}
            </span>
          )}
        </div>

        <h1
          className="font-bold text-foreground leading-tight mb-2"
          style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)" }}
          data-testid="text-opportunity-title"
        >
          {o.title}
        </h1>
        {o.organization && (
          <p className="text-primary/90 text-[15px] font-medium mb-6">
            {o.organization}
          </p>
        )}

        {/* Facts grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          <Fact
            icon={MapPin}
            label={t({ ar: "مكان العمل", en: "Work location" })}
            value={
              t({
                ar: OPPORTUNITY_LOCATION_LABELS[o.locationType],
                en: OPPORTUNITY_LOCATION_LABELS_EN[o.locationType],
              }) + (o.city ? ` · ${o.city}` : "")
            }
          />
          <Fact
            icon={Briefcase}
            label={t({ ar: "النوع", en: "Type" })}
            value={t({
              ar: OPPORTUNITY_TYPE_LABELS[o.type],
              en: OPPORTUNITY_TYPE_LABELS_EN[o.type],
            })}
          />
          {o.compensation && (
            <Fact
              icon={Coins}
              label={t({ ar: "المقابل", en: "Compensation" })}
              value={o.compensation}
            />
          )}
          {o.deadline && (
            <Fact
              icon={Clock}
              label={t({ ar: "آخر موعد", en: "Deadline" })}
              value={fmtDate(o.deadline, lang)}
            />
          )}
          {o.organization && (
            <Fact
              icon={Building2}
              label={t({ ar: "الجهة", en: "Organization" })}
              value={o.organization}
            />
          )}
        </div>

        {o.description && (
          <div className="text-fg-secondary text-[14.5px] leading-[1.95] whitespace-pre-wrap mb-7">
            {o.description}
          </div>
        )}

        {tags.length > 0 && (
          <div className="mb-8">
            <div className="text-[10.5px] tracking-[0.18em] uppercase text-muted-foreground font-bold mb-2.5">
              {t({ ar: "المهارات المطلوبة", en: "Required skills" })}
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-lg text-[12.5px] bg-surface-2 text-fg-secondary border border-border-strong"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {applyHref ? (
          <a
            href={applyHref}
            target={o.applyUrl ? "_blank" : undefined}
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-primary text-white font-bold text-[15px] hover:-translate-y-px hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] transition-all"
            data-testid="link-apply"
          >
            {t({ ar: "قدّم الآن", en: "Apply now" })}
            {o.applyUrl ? (
              <ExternalLink className="w-4 h-4" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
          </a>
        ) : (
          <div className="inline-flex items-center px-5 py-3 rounded-2xl bg-surface-2 border border-border-strong text-muted-foreground text-[13.5px]">
            {t({
              ar: "للتقديم، تواصل مع فريق آيلاند هيفن.",
              en: "To apply, get in touch with the Island Haven team.",
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
