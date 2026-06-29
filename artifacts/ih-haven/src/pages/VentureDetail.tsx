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
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { usePageMeta } from "@/hooks/use-meta";
import { VENTURE_STAGE_LABELS, type VentureStage } from "@/lib/labels";
import { ventureIdentity } from "@/lib/ventureIdentity";

const VENTURE_STAGE_LABELS_EN: Record<VentureStage, string> = {
  idea: "Idea",
  mvp: "MVP",
  launched: "Launched",
  scaling: "Scaling",
};

// Evergreen frames so a cover-less venture still wears real imagery (deterministic
// by id — matches the listing page so a venture keeps one consistent frame).
const VENTURE_FRAMES = [
  "/photos/IMG_8344.webp", "/photos/IMG_8347.webp", "/photos/IMG_8349.webp",
  "/photos/IMG_8353.webp", "/photos/IMG_8357.webp", "/photos/IMG_8358.webp",
];
const frameFor = (id: number) => VENTURE_FRAMES[Math.abs(id) % VENTURE_FRAMES.length];

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}

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
  const { lang, t } = useLanguage();
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
    title: v?.name,
    description: v?.tagline,
    image: v?.coverUrl ?? undefined,
    type: "article",
  });

  if (error && !v) {
    return (
      <PageShell active="ventures">
        <BackLink
          href="/ventures"
          label={t({ ar: "عودة للمشاريع", en: "Back to ventures" })}
        />
        <GlassCard className="p-8 text-center text-destructive">{error}</GlassCard>
      </PageShell>
    );
  }
  if (!v) {
    return (
      <PageShell active="ventures">
        <div className="h-96 rounded-[28px] bg-surface-2 border border-border-strong animate-pulse" />
      </PageShell>
    );
  }

  const stageIx = STAGE_STEPS.indexOf(v.stage);
  const vid = ventureIdentity(v.sector, v.id);
  const cover = v.coverUrl || frameFor(v.id);
  const stageText = lang === "ar" ? VENTURE_STAGE_LABELS[v.stage] : VENTURE_STAGE_LABELS_EN[v.stage];

  return (
    <PageShell active="ventures">
      <BackLink
        href="/ventures"
        label={t({ ar: "كلّ المشاريع", en: "All ventures" })}
      />

      <GlassCard className="overflow-hidden">
        {/* Cover band */}
        {/* Cinematic cover hero — sector-tinted, the name at display scale */}
        <div className="relative h-[clamp(17rem,42vh,28rem)]">
          <img
            src={cover}
            alt={v.name}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = frameFor(v.id); }}
            className="absolute inset-0 w-full h-full object-cover object-center saturate-[1.04]"
          />
          {/* sector identity wash — a distinct deep hue (soft-light keeps the photo) */}
          <div aria-hidden className="absolute inset-0 opacity-[0.24] mix-blend-soft-light" style={{ background: vid.gradient }} />
          <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(0deg, hsl(225 44% 5% / 0.96) 6%, hsl(225 44% 5% / 0.5) 46%, transparent 82%)" }} />
          {v.featured && (
            <div className="absolute top-4 end-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-400/15 text-amber-100 border border-amber-400/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" /> {t({ ar: "مشروع مميّز", en: "Featured venture" })}
            </div>
          )}
          {v.logoUrl && (
            <img src={v.logoUrl} alt="" className="absolute top-4 start-4 w-14 h-14 rounded-2xl object-cover ring-1 ring-white/20 bg-surface-1 shadow-xl" />
          )}
          <div className="absolute inset-0 flex items-end">
            <div className="w-full p-[clamp(1.5rem,4vw,3rem)]">
              <div className="mb-3 inline-flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[clamp(0.8rem,1.3vw,1rem)] font-bold uppercase tracking-[0.14em] rtl:tracking-normal">
                <span className="text-primary">{stageText}</span>
                {v.sector && (
                  <span className="inline-flex items-center gap-2" style={{ color: vid.accent }}>
                    <span aria-hidden className="text-white/30">/</span>
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: vid.accent }} />
                    {v.sector}
                  </span>
                )}
              </div>
              <h1
                data-testid="text-venture-name"
                className="font-display text-white"
                style={{ fontSize: "clamp(2rem,5.2vw,4rem)", lineHeight: 1.0, letterSpacing: "-0.035em", fontWeight: 700 }}
              >
                {v.name}
              </h1>
              {v.tagline && (
                <p className="mt-4 max-w-2xl text-white/80" style={{ fontSize: "clamp(1rem,1.6vw,1.3rem)", lineHeight: 1.55 }}>
                  {v.tagline}
                </p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-white/65" style={{ fontSize: "clamp(0.85rem,1.3vw,1rem)" }}>
                {v.founderName && <span className="text-white/85 font-semibold">{v.founderName}</span>}
                {v.teamSize > 0 && (
                  <span className="tnum">{num(v.teamSize, lang)} {t({ ar: "في الفريق", en: "on the team" })}</span>
                )}
                {v.foundedYear > 0 && <span className="tnum">{num(v.foundedYear, lang)}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-9 pb-9 pt-8 relative">

          {/* Stage progress rail */}
          <div className="mb-7">
            <div className="flex items-center gap-1.5">
              {STAGE_STEPS.map((s, i) => (
                <div key={s} className="flex-1">
                  <div
                    className={`h-1.5 rounded-full transition-colors ${
                      i < stageIx ? "bg-primary" : i > stageIx ? "bg-surface-2" : ""
                    }`}
                    style={i === stageIx ? { backgroundColor: vid.accent } : undefined}
                  />
                  <div
                    className={`mt-2 text-[10.5px] font-semibold text-center ${
                      i === stageIx ? "" : "text-muted-foreground"
                    }`}
                    style={i === stageIx ? { color: vid.accent } : undefined}
                  >
                    {t({
                      ar: VENTURE_STAGE_LABELS[s],
                      en: VENTURE_STAGE_LABELS_EN[s],
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {v.description && (
            <div className="text-fg-secondary text-[14.5px] leading-[1.95] whitespace-pre-wrap mb-7">
              {v.description}
            </div>
          )}

          {/* Facts grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
            <Fact
              icon={Layers}
              label={t({ ar: "المرحلة", en: "Stage" })}
              value={t({
                ar: VENTURE_STAGE_LABELS[v.stage],
                en: VENTURE_STAGE_LABELS_EN[v.stage],
              })}
            />
            {v.sector && (
              <Fact
                icon={Building2}
                label={t({ ar: "القطاع", en: "Sector" })}
                value={v.sector}
                accent={vid.accent}
              />
            )}
            {v.foundedYear > 0 && (
              <Fact
                icon={CalendarDays}
                label={t({ ar: "التأسيس", en: "Founded" })}
                value={num(v.foundedYear, lang)}
              />
            )}
            <Fact
              icon={Users}
              label={t({ ar: "الفريق", en: "Team" })}
              value={
                lang === "ar"
                  ? `${num(v.teamSize, lang)} أعضاء`
                  : `${num(v.teamSize, lang)} ${v.teamSize === 1 ? "member" : "members"}`
              }
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {v.websiteUrl && (
              <a
                href={v.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white font-bold text-[14px] hover:-translate-y-px hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] transition-all"
              >
                {t({ ar: "زيارة المشروع", en: "Visit venture" })}
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {pitchDeck && (
              <a
                href={pitchDeck.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-surface-2 border border-border-strong text-foreground font-bold text-[14px] hover:bg-white/[0.1] transition-colors"
              >
                <FileText className="w-4 h-4 text-primary" />
                {t({ ar: "ملفّ العرض (Pitch Deck)", en: "Pitch Deck" })}
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

const MILESTONE_LABELS_EN: Record<Milestone["type"], string> = {
  idea: "Idea",
  mvp: "MVP",
  launch: "Launch",
  first_customer: "First customer",
  first_revenue: "First revenue",
  funding: "Funding",
  team_grew: "Team grew",
  press: "Press",
  partnership: "Partnership",
  other: "Milestone",
};

function MilestoneTimeline({ ventureId }: { ventureId: number }) {
  const { lang, t } = useLanguage();
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
        {t({ ar: "الرّحلة · Timeline", en: "Timeline" })}
      </div>
      <GlassCard className="p-6 sm:p-8">
        <ol className="relative">
          {rows.map((m, i) => {
            const date = new Date(m.achievedAt).toLocaleDateString(
              lang === "ar" ? "ar-EG" : "en-GB",
              {
                year: "numeric",
                month: "long",
              },
            );
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
                    {t({
                      ar: MILESTONE_LABELS[m.type],
                      en: MILESTONE_LABELS_EN[m.type],
                    })}
                  </span>
                  <span className="text-[11.5px] text-fg-faint font-medium">
                    {date}
                  </span>
                </div>
                <h4 className="text-foreground font-bold text-[15px] mb-1 leading-snug">
                  {m.title}
                </h4>
                {m.body && (
                  <p className="text-fg-secondary text-[13.5px] leading-[1.85] whitespace-pre-wrap">
                    {m.body}
                  </p>
                )}
                {(m.amount || m.metricValue || m.link) && (
                  <div className="mt-2 flex items-center gap-3 flex-wrap text-[12px] text-muted-foreground">
                    {m.amount ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-200 border border-emerald-500/30 font-semibold tabular-nums">
                        {"$"}
                        {m.amount.toLocaleString("en-US")}
                      </span>
                    ) : null}
                    {m.metricValue ? (
                      <span className="text-muted-foreground tabular-nums">
                        {t({ ar: "قيمة:", en: "Value:" })}{" "}
                        {m.metricValue.toLocaleString(
                          lang === "ar" ? "ar-EG" : "en-US",
                        )}
                      </span>
                    ) : null}
                    {m.link && (
                      <a
                        href={m.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        {t({ ar: "رابط", en: "Link" })}
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
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl p-4 bg-surface-2 border border-border-strong">
      <Icon className={`w-4 h-4 mb-2 ${accent ? "" : "text-primary"}`} style={accent ? { color: accent } : undefined} />
      <div className="text-muted-foreground text-[10.5px] tracking-wide mb-0.5">{label}</div>
      <div className="text-foreground font-semibold text-[13px] leading-snug" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}

function OtherVentures({ excludeId }: { excludeId: number }) {
  const { t } = useLanguage();
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
        {t({ ar: "مشاريع أخرى", en: "Other ventures" })}
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
              className="group block rounded-2xl p-4 bg-surface-2 border border-border-strong hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-3 mb-1">
                {o.logoUrl ? (
                  <img src={o.logoUrl} alt="" className="w-9 h-9 rounded-xl object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center text-fg-secondary font-bold text-sm">
                    {o.name.charAt(0)}
                  </div>
                )}
                <div className="font-bold text-foreground text-[13.5px] truncate">{o.name}</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-primary/80">
                  {t({
                    ar: VENTURE_STAGE_LABELS[o.stage],
                    en: VENTURE_STAGE_LABELS_EN[o.stage],
                  })}
                </span>
                <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
