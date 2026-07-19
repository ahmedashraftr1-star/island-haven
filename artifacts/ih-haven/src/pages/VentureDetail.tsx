import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { PageShell, BackLink } from "@/components/shell/PageShell";
import { DetailError } from "@/components/shell/DetailError";
import { useLanguage } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { usePageMeta } from "@/hooks/use-meta";
import { VENTURE_STAGE_LABELS, type VentureStage } from "@/lib/labels";
import {
  ProjectCaseStudy,
  type CaseStudyVenture,
  type CaseStudyMilestone,
  type CaseStudyPitchDeck,
} from "@/components/landing/ProjectCaseStudy";

const VENTURE_STAGE_LABELS_EN: Record<VentureStage, string> = {
  idea: "Idea",
  mvp: "MVP",
  launched: "Launched",
  scaling: "Scaling",
};

export default function VentureDetail() {
  const { lang, t } = useLanguage();
  const [, params] = useRoute("/ventures/:id");
  const id = params?.id;
  const [v, setV] = useState<CaseStudyVenture | null>(null);
  const [pitchDeck, setPitchDeck] = useState<CaseStudyPitchDeck | null>(null);
  const [milestones, setMilestones] = useState<CaseStudyMilestone[]>([]);
  // null = no error; otherwise the ApiError.status (0 for a network error). A
  // bumped reloadKey re-runs the fetch (the DetailError retry button).
  const [errStatus, setErrStatus] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setErrStatus(null);
    api<{ venture: CaseStudyVenture; pitchDeck: CaseStudyPitchDeck | null }>(
      `/ventures/${id}`,
    )
      .then((r) => {
        if (cancelled) return;
        setV(r.venture);
        setPitchDeck(r.pitchDeck);
      })
      .catch(
        (e) => !cancelled && setErrStatus(e instanceof ApiError ? e.status : 0),
      );
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api<{ milestones: CaseStudyMilestone[] }>(`/ventures/${id}/milestones`)
      .then((r) => !cancelled && setMilestones(r.milestones))
      .catch(() => !cancelled && setMilestones([]));
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

  if (errStatus !== null && !v) {
    return (
      <PageShell active="ventures">
        <DetailError
          status={errStatus}
          onRetry={reload}
          backHref="/ventures"
          backLabel={t({ ar: "كلّ المشاريع", en: "All ventures" })}
        />
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

  return (
    <PageShell active="ventures">
      <BackLink
        href="/ventures"
        label={t({ ar: "كلّ المشاريع", en: "All ventures" })}
      />

      <ProjectCaseStudy key={v.id} venture={v} milestones={milestones} pitchDeck={pitchDeck} />

      <OtherVentures excludeId={v.id} />
    </PageShell>
  );
}

function OtherVentures({ excludeId }: { excludeId: number }) {
  const { t, lang } = useLanguage();
  const [rows, setRows] = useState<CaseStudyVenture[] | null>(null);
  useEffect(() => {
    api<{ ventures: CaseStudyVenture[] }>("/ventures")
      .then((r) => setRows(r.ventures.filter((x) => x.id !== excludeId).slice(0, 3)))
      .catch(() => setRows([]));
  }, [excludeId]);

  if (!rows || rows.length === 0) return null;

  return (
    <div className="mt-[clamp(3rem,6vw,5rem)]">
      <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-4 rtl:tracking-normal">
        {t({ ar: "مشاريع أخرى", en: "Other ventures" })}
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {rows.map((o, i) => {
          // Localized name (GOLDEN RULE): EN → nameEn or "" (never Arabic); AR → name.
          const oName = (lang === "en" ? o.nameEn : o.name)?.trim() || "";
          return (
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
                  <img loading="lazy" decoding="async" src={o.logoUrl} alt="" className="w-9 h-9 rounded-xl object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center text-fg-secondary font-bold text-sm">
                    {oName.charAt(0)}
                  </div>
                )}
                <div className="font-bold text-foreground text-[13.5px] truncate">{oName}</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-primary/80">
                  {t({
                    ar: VENTURE_STAGE_LABELS[o.stage as VentureStage] ?? o.stage,
                    en: VENTURE_STAGE_LABELS_EN[o.stage as VentureStage] ?? o.stage,
                  })}
                </span>
                <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all" />
              </div>
            </Link>
          </motion.div>
          );
        })}
      </div>
    </div>
  );
}
