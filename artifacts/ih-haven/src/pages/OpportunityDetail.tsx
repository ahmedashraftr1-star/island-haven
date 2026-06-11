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
          setError(e instanceof ApiError ? e.message : "تعذّر التحميل"),
      );
    return () => {
      cancelled = true;
    };
  }, [id]);

  usePageMeta({
    title: o?.title,
    description: o?.organization,
    type: "article",
  });

  if (error && !o) {
    return (
      <PageShell active="opportunities">
        <BackLink href="/opportunities" label="عودة للفرص" />
        <GlassCard className="p-8 text-center text-red-200">{error}</GlassCard>
      </PageShell>
    );
  }
  if (!o) {
    return (
      <PageShell active="opportunities">
        <div className="h-80 rounded-[28px] bg-white/[0.035] border border-white/10 animate-pulse" />
      </PageShell>
    );
  }

  const tags = splitTags(o.skills);
  const applyHref = o.applyUrl
    ? o.applyUrl
    : o.applyEmail
      ? `mailto:${o.applyEmail}?subject=${encodeURIComponent("تقديم على: " + o.title)}`
      : null;

  return (
    <PageShell active="opportunities">
      <BackLink href="/opportunities" label="كلّ الفرص" />

      <GlassCard className="p-6 sm:p-9">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] tracking-[0.1em] uppercase font-bold bg-primary/15 text-primary border border-primary/30">
            <Briefcase className="w-3.5 h-3.5" />
            {OPPORTUNITY_TYPE_LABELS[o.type]}
          </span>
          {o.featured && (
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/15 text-amber-100 border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" /> فرصة مميّزة
            </span>
          )}
        </div>

        <h1
          className="font-bold text-white leading-tight mb-2"
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
            label="مكان العمل"
            value={
              OPPORTUNITY_LOCATION_LABELS[o.locationType] +
              (o.city ? ` · ${o.city}` : "")
            }
          />
          <Fact icon={Briefcase} label="النوع" value={OPPORTUNITY_TYPE_LABELS[o.type]} />
          {o.compensation && (
            <Fact icon={Coins} label="المقابل" value={o.compensation} />
          )}
          {o.deadline && (
            <Fact
              icon={Clock}
              label="آخر موعد"
              value={formatArabicDate(o.deadline)}
            />
          )}
          {o.organization && (
            <Fact icon={Building2} label="الجهة" value={o.organization} />
          )}
        </div>

        {o.description && (
          <div className="text-white/75 text-[14.5px] leading-[1.95] whitespace-pre-wrap mb-7">
            {o.description}
          </div>
        )}

        {tags.length > 0 && (
          <div className="mb-8">
            <div className="text-[10.5px] tracking-[0.18em] uppercase text-white/40 font-bold mb-2.5">
              المهارات المطلوبة
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-lg text-[12.5px] bg-white/[0.05] text-white/70 border border-white/[0.08]"
                >
                  {t}
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
            قدّم الآن
            {o.applyUrl ? (
              <ExternalLink className="w-4 h-4" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
          </a>
        ) : (
          <div className="inline-flex items-center px-5 py-3 rounded-2xl bg-white/[0.05] border border-white/10 text-white/55 text-[13.5px]">
            للتقديم، تواصل مع فريق آيلاند هيفن.
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
    <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/[0.08]">
      <Icon className="w-4 h-4 text-primary mb-2" />
      <div className="text-white/40 text-[10.5px] tracking-wide mb-0.5">{label}</div>
      <div className="text-white font-semibold text-[13px] leading-snug">{value}</div>
    </div>
  );
}
