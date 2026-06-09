import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Users,
  CalendarDays,
  Layers,
  Building2,
  ArrowLeft,
  Sparkles,
  FileText,
} from "lucide-react";
import { PageShell, GlassCard, BackLink } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import { usePageMeta } from "@/hooks/use-meta";
import { VENTURE_STAGE_LABELS, type VentureStage } from "@/lib/labels";

interface Venture {
  id: number;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string | null;
  coverUrl: string | null;
  websiteUrl: string;
  founderName: string;
  sector: string;
  stage: VentureStage;
  foundedYear: number;
  teamSize: number;
  featured: boolean;
}

const STAGE_STEPS: VentureStage[] = ["idea", "mvp", "launched", "scaling"];

export default function VentureDetail() {
  const [, params] = useRoute("/ventures/:id");
  const id = params?.id;
  const [v, setV] = useState<Venture | null>(null);
  const [pitchDeck, setPitchDeck] = useState<{ title: string; url: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api<{ venture: Venture; pitchDeck: { title: string; url: string } | null }>(
      `/ventures/${id}`,
    )
      .then((r) => {
        if (cancelled) return;
        setV(r.venture);
        setPitchDeck(r.pitchDeck);
      })
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
    title: v?.name,
    description: v?.tagline,
    image: v?.coverUrl ?? undefined,
    type: "article",
  });

  if (error && !v) {
    return (
      <PageShell active="ventures">
        <BackLink href="/ventures" label="عودة للمشاريع" />
        <GlassCard className="p-8 text-center text-red-200">{error}</GlassCard>
      </PageShell>
    );
  }
  if (!v) {
    return (
      <PageShell active="ventures">
        <div className="h-96 rounded-[28px] bg-white/[0.035] border border-white/10 animate-pulse" />
      </PageShell>
    );
  }

  const stageIx = STAGE_STEPS.indexOf(v.stage);

  return (
    <PageShell active="ventures">
      <BackLink href="/ventures" label="كلّ المشاريع" />

      <GlassCard className="overflow-hidden">
        {/* Cover band */}
        <div className="relative h-48 sm:h-64">
          {v.coverUrl ? (
            <img src={v.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A] via-[#0A0E1A]/40 to-transparent" />
          {v.featured && (
            <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-400/15 text-amber-100 border border-amber-400/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" /> مشروع مميّز
            </div>
          )}
        </div>

        <div className="px-6 sm:px-9 pb-9 -mt-12 relative">
          <div className="flex items-end gap-4 mb-6">
            {v.logoUrl ? (
              <img
                src={v.logoUrl}
                alt={v.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[#0A0E1A] shadow-xl bg-[#0A0E1A]"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/50 border-2 border-[#0A0E1A] shadow-xl flex items-center justify-center text-3xl font-bold text-white">
                {v.name.charAt(0)}
              </div>
            )}
            <div className="pb-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.14em] uppercase font-bold bg-primary/15 text-primary border border-primary/30 mb-1.5">
                {VENTURE_STAGE_LABELS[v.stage]}
              </span>
              <h1
                className="font-bold text-white leading-tight"
                style={{ fontSize: "clamp(1.6rem, 4vw, 2.3rem)" }}
                data-testid="text-venture-name"
              >
                {v.name}
              </h1>
            </div>
          </div>

          {v.tagline && (
            <p className="text-primary/90 text-[15px] font-medium leading-[1.7] mb-5">
              {v.tagline}
            </p>
          )}

          {/* Stage progress rail */}
          <div className="mb-7">
            <div className="flex items-center gap-1.5">
              {STAGE_STEPS.map((s, i) => (
                <div key={s} className="flex-1">
                  <div
                    className={`h-1.5 rounded-full transition-colors ${
                      i <= stageIx ? "bg-primary" : "bg-white/10"
                    }`}
                  />
                  <div
                    className={`mt-2 text-[10.5px] font-semibold text-center ${
                      i === stageIx ? "text-primary" : "text-white/40"
                    }`}
                  >
                    {VENTURE_STAGE_LABELS[s]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {v.description && (
            <div className="text-white/75 text-[14.5px] leading-[1.95] whitespace-pre-wrap mb-7">
              {v.description}
            </div>
          )}

          {/* Facts grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
            <Fact icon={Layers} label="المرحلة" value={VENTURE_STAGE_LABELS[v.stage]} />
            {v.sector && <Fact icon={Building2} label="القطاع" value={v.sector} />}
            {v.foundedYear > 0 && (
              <Fact icon={CalendarDays} label="التأسيس" value={String(v.foundedYear)} />
            )}
            <Fact icon={Users} label="الفريق" value={`${v.teamSize} أعضاء`} />
          </div>

          {v.founderName && (
            <div className="text-[13px] text-white/55 mb-6">
              <span className="text-white/40">المؤسِّس: </span>
              <span className="text-white/85 font-semibold">{v.founderName}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {v.websiteUrl && (
              <a
                href={v.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white font-bold text-[14px] hover:-translate-y-px hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] transition-all"
              >
                زيارة المشروع
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {pitchDeck && (
              <a
                href={pitchDeck.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.06] border border-white/15 text-white font-bold text-[14px] hover:bg-white/[0.1] transition-colors"
              >
                <FileText className="w-4 h-4 text-primary" />
                ملفّ العرض (Pitch Deck)
              </a>
            )}
          </div>
        </div>
      </GlassCard>

      <MilestoneTimeline ventureId={v.id} />

      <OtherVentures excludeId={v.id} />
    </PageShell>
  );
}

interface Milestone {
  id: number;
  title: string;
  body: string;
  type:
    | "idea"
    | "mvp"
    | "launch"
    | "first_customer"
    | "first_revenue"
    | "funding"
    | "team_grew"
    | "press"
    | "partnership"
    | "other";
  achievedAt: string;
  amount: number | null;
  metricValue: number | null;
  link: string;
}

const MILESTONE_LABELS: Record<Milestone["type"], string> = {
  idea: "الفكرة",
  mvp: "MVP",
  launch: "إطلاق",
  first_customer: "أوّل عميل",
  first_revenue: "أوّل إيراد",
  funding: "تمويل",
  team_grew: "نموّ الفريق",
  press: "تغطية إعلاميّة",
  partnership: "شراكة",
  other: "حدث",
};

function MilestoneTimeline({ ventureId }: { ventureId: number }) {
  const [rows, setRows] = useState<Milestone[] | null>(null);
  useEffect(() => {
    api<{ milestones: Milestone[] }>(`/ventures/${ventureId}/milestones`)
      .then((r) => setRows(r.milestones))
      .catch(() => setRows([]));
  }, [ventureId]);

  if (!rows || rows.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-5">
        الرّحلة · Timeline
      </div>
      <GlassCard className="p-6 sm:p-8">
        <ol className="relative">
          {rows.map((m, i) => {
            const date = new Date(m.achievedAt).toLocaleDateString("ar-EG", {
              year: "numeric",
              month: "long",
            });
            return (
              <li key={m.id} className="relative ps-8 pb-7 last:pb-0">
                {i < rows.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute top-3 right-[10px] w-px h-full bg-gradient-to-b from-primary/40 to-white/[0.06]"
                  />
                )}
                <span
                  aria-hidden
                  className="absolute top-1 right-[5px] w-3 h-3 rounded-full bg-primary border-2 border-[#0A0E1A] shadow-[0_0_0_2px_rgba(220,68,84,0.4)]"
                />
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10.5px] tracking-[0.14em] uppercase font-bold bg-primary/15 text-primary border border-primary/30">
                    {MILESTONE_LABELS[m.type]}
                  </span>
                  <span className="text-[11.5px] text-white/45 font-medium">
                    {date}
                  </span>
                </div>
                <h4 className="text-white font-bold text-[15px] mb-1 leading-snug">
                  {m.title}
                </h4>
                {m.body && (
                  <p className="text-white/65 text-[13.5px] leading-[1.85] whitespace-pre-wrap">
                    {m.body}
                  </p>
                )}
                {(m.amount || m.metricValue || m.link) && (
                  <div className="mt-2 flex items-center gap-3 flex-wrap text-[12px] text-white/55">
                    {m.amount ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-200 border border-emerald-500/30 font-semibold tabular-nums">
                        {"$"}
                        {m.amount.toLocaleString("en-US")}
                      </span>
                    ) : null}
                    {m.metricValue ? (
                      <span className="text-white/60 tabular-nums">
                        قيمة: {m.metricValue.toLocaleString("ar-EG")}
                      </span>
                    ) : null}
                    {m.link && (
                      <a
                        href={m.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        رابط
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </GlassCard>
    </div>
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

function OtherVentures({ excludeId }: { excludeId: number }) {
  const [rows, setRows] = useState<Venture[] | null>(null);
  useEffect(() => {
    api<{ ventures: Venture[] }>("/ventures")
      .then((r) => setRows(r.ventures.filter((x) => x.id !== excludeId).slice(0, 3)))
      .catch(() => setRows([]));
  }, [excludeId]);

  if (!rows || rows.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-4">
        مشاريع أخرى
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {rows.map((o, i) => (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={`/ventures/${o.id}`}
              className="group block rounded-2xl p-4 bg-white/[0.04] border border-white/[0.08] hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-3 mb-1">
                {o.logoUrl ? (
                  <img src={o.logoUrl} alt="" className="w-9 h-9 rounded-xl object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-white/70 font-bold text-sm">
                    {o.name.charAt(0)}
                  </div>
                )}
                <div className="font-bold text-white text-[13.5px] truncate">{o.name}</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-primary/80">{VENTURE_STAGE_LABELS[o.stage]}</span>
                <ArrowLeft className="w-3.5 h-3.5 text-white/40 group-hover:text-primary group-hover:-translate-x-1 transition-all" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
