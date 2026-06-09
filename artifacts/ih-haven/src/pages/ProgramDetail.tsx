import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Users,
  CalendarDays,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { PageShell, GlassCard, BackLink } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import { usePageMeta } from "@/hooks/use-meta";
import { useAuth } from "@/lib/auth";
import {
  formatArabicDate,
  splitTags,
  PROGRAM_STATUS_LABELS,
  PROGRAM_APPLICATION_STATUS_LABELS,
  type ProgramStatus,
  type ProgramApplicationStatus,
} from "@/lib/labels";

interface ProgramFull {
  id: number;
  title: string;
  summary: string;
  description: string;
  coverUrl: string | null;
  durationWeeks: number;
  seats: number;
  perks: string;
  tags: string;
  startsAt: string | null;
  applyDeadline: string | null;
  status: ProgramStatus;
}

interface Resp {
  program: ProgramFull;
  hasApplied: boolean;
  myStatus: ProgramApplicationStatus | null;
}

export default function ProgramDetail() {
  const [, params] = useRoute("/programs/:id");
  const [, navigate] = useLocation();
  const id = params?.id;
  const { user } = useAuth();
  const [data, setData] = useState<Resp | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [ventureName, setVentureName] = useState("");
  const [idea, setIdea] = useState("");
  const [motivation, setMotivation] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function refresh() {
    if (!id) return;
    try {
      setData(await api<Resp>(`/programs/${id}`));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  usePageMeta({
    title: data?.program?.title,
    description: data?.program?.summary,
    image: data?.program?.coverUrl ?? undefined,
    type: "article",
  });

  async function apply(ev: React.FormEvent) {
    ev.preventDefault();
    if (!user) {
      navigate(`/login?next=/programs/${id}`);
      return;
    }
    if (busy) return;
    if (idea.trim().length < 10) {
      setFormError("اكتب فكرتك بإيجاز (10 أحرف فأكثر).");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await api(`/programs/${id}/apply`, {
        method: "POST",
        body: JSON.stringify({
          ventureName: ventureName.trim(),
          idea: idea.trim(),
          motivation: motivation.trim(),
        }),
      });
      await refresh();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "تعذّر إرسال الطلب");
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return (
      <PageShell active="programs">
        <BackLink href="/programs" label="عودة للبرامج" />
        <GlassCard className="p-8 text-center text-red-200">{error}</GlassCard>
      </PageShell>
    );
  }
  if (!data) {
    return (
      <PageShell active="programs">
        <div className="h-96 rounded-[28px] bg-white/[0.035] border border-white/10 animate-pulse" />
      </PageShell>
    );
  }

  const p = data.program;
  const perks = p.perks
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <PageShell active="programs">
      <BackLink href="/programs" label="كلّ البرامج" />
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        <GlassCard>
          {p.coverUrl ? (
            <div className="aspect-[16/9] overflow-hidden bg-black/30">
              <img src={p.coverUrl} alt={p.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="aspect-[16/9] bg-gradient-to-br from-primary/30 via-primary/8 to-transparent" />
          )}
          <div className="p-6 sm:p-8">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.14em] uppercase font-semibold bg-white/[0.05] text-white/60 border border-white/10 mb-4">
              {PROGRAM_STATUS_LABELS[p.status]}
            </span>
            <h1
              className="font-bold text-white leading-tight mb-3"
              style={{ fontSize: "clamp(1.7rem, 4vw, 2.4rem)" }}
            >
              {p.title}
            </h1>
            {p.summary && (
              <p className="text-white/65 text-[15.5px] leading-[1.85] mb-6">
                {p.summary}
              </p>
            )}
            {p.description && (
              <div className="text-white/75 text-[14.5px] leading-[1.95] whitespace-pre-wrap mb-6">
                {p.description}
              </div>
            )}
            {perks.length > 0 && (
              <div>
                <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-3">
                  ماذا تكسب
                </div>
                <ul className="space-y-2">
                  {perks.map((perk, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-white/75 text-[14px]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300 mt-0.5 shrink-0" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {splitTags(p.tags).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-6">
                {splitTags(p.tags).map((t) => (
                  <span key={t} className="px-3 py-1 rounded-full text-[12px] font-medium bg-white/[0.05] text-white/75 border border-white/10">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </GlassCard>

        <div className="space-y-5">
          <GlassCard className="p-6">
            <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-4">
              تفاصيل البرنامج
            </div>
            <ul className="space-y-3 text-[13.5px] text-white/75">
              {p.durationWeeks > 0 && (
                <li className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-primary" />
                  المدّة: {p.durationWeeks} أسبوع
                </li>
              )}
              {p.seats > 0 && (
                <li className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-primary" />
                  المقاعد: {p.seats}
                </li>
              )}
              {p.startsAt && (
                <li className="flex items-center gap-3">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  يبدأ: {formatArabicDate(p.startsAt)}
                </li>
              )}
              {p.applyDeadline && (
                <li className="flex items-center gap-3">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  آخر موعد للتقديم: {formatArabicDate(p.applyDeadline)}
                </li>
              )}
            </ul>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-2">
              التقديم على البرنامج
            </div>
            <AnimatePresence mode="wait">
              {data.hasApplied ? (
                <motion.div key="applied" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-5">
                  <CheckCircle2 className="w-11 h-11 text-emerald-300 mx-auto mb-3" />
                  <div className="text-white font-bold text-[14.5px] mb-1">
                    قدّمت على هذا البرنامج
                  </div>
                  <div className="text-white/55 text-[13px]">
                    الحالة:{" "}
                    {data.myStatus
                      ? PROGRAM_APPLICATION_STATUS_LABELS[data.myStatus]
                      : "—"}
                  </div>
                </motion.div>
              ) : p.status !== "open" ? (
                <motion.div key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/55 text-[13px] text-center py-4">
                  التقديم على هذا البرنامج مغلق حاليًا.
                </motion.div>
              ) : !user ? (
                <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-white/65 text-[13.5px] leading-[1.85] mb-4">
                    سجّل دخولك لتقديم مشروعك على هذا البرنامج.
                  </p>
                  <Link
                    href={`/login?next=/programs/${id}`}
                    className="block text-center w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-[14px] hover:-translate-y-px transition-all"
                  >
                    تسجيل الدخول
                  </Link>
                </motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={apply} className="space-y-3.5">
                  <Field label="اسم المشروع (اختياري)">
                    <input
                      value={ventureName}
                      onChange={(e) => setVentureName(e.target.value)}
                      maxLength={200}
                      className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3.5 py-2.5 text-[13.5px] text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
                    />
                  </Field>
                  <Field label="فكرة المشروع">
                    <textarea
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      rows={4}
                      maxLength={4000}
                      className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3.5 py-2.5 text-[13.5px] text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none resize-none"
                    />
                  </Field>
                  <Field label="لماذا تريد الانضمام؟ (اختياري)">
                    <textarea
                      value={motivation}
                      onChange={(e) => setMotivation(e.target.value)}
                      rows={3}
                      maxLength={4000}
                      className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3.5 py-2.5 text-[13.5px] text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none resize-none"
                    />
                  </Field>
                  {formError && <div className="text-[12.5px] text-red-300">{formError}</div>}
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-[14px] enabled:hover:-translate-y-px transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    data-testid="button-apply-program"
                  >
                    <Sparkles className="w-4 h-4" />
                    {busy ? "…" : "إرسال طلب التقديم"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </GlassCard>
        </div>
      </div>
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11.5px] text-white/50 font-medium mb-1.5">{label}</span>
      {children}
    </label>
  );
}
