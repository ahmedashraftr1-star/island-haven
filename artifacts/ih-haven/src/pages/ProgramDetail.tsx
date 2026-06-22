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
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
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

const PROGRAM_STATUS_LABELS_EN: Record<ProgramStatus, string> = {
  draft: "Draft",
  open: "Applications open",
  in_progress: "In progress",
  done: "Completed",
};

const PROGRAM_APPLICATION_STATUS_LABELS_EN: Record<
  ProgramApplicationStatus,
  string
> = {
  new: "New",
  reviewing: "Under review",
  accepted: "Accepted",
  rejected: "Rejected",
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

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}

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
  const { lang, t } = useLanguage();
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
      setError(
        e instanceof ApiError
          ? e.message
          : t({ ar: "تعذّر التحميل", en: "Couldn't load" }),
      );
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
      setFormError(
        t({
          ar: "اكتب فكرتك بإيجاز (10 أحرف فأكثر).",
          en: "Describe your idea briefly (10 characters or more).",
        }),
      );
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
      setFormError(
        e instanceof ApiError
          ? e.message
          : t({ ar: "تعذّر إرسال الطلب", en: "Couldn't submit your application" }),
      );
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return (
      <PageShell active="programs">
        <BackLink
          href="/programs"
          label={t({ ar: "عودة للبرامج", en: "Back to programs" })}
        />
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
      <BackLink
        href="/programs"
        label={t({ ar: "كلّ البرامج", en: "All programs" })}
      />
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
              {t({
                ar: PROGRAM_STATUS_LABELS[p.status],
                en: PROGRAM_STATUS_LABELS_EN[p.status],
              })}
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
                  {t({ ar: "ماذا تكسب", en: "What you gain" })}
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
                {splitTags(p.tags).map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full text-[12px] font-medium bg-white/[0.05] text-white/75 border border-white/10">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </GlassCard>

        <div className="space-y-5">
          <GlassCard className="p-6">
            <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-4">
              {t({ ar: "تفاصيل البرنامج", en: "Program details" })}
            </div>
            <ul className="space-y-3 text-[13.5px] text-white/75">
              {p.durationWeeks > 0 && (
                <li className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-primary" />
                  {t({ ar: "المدّة:", en: "Duration:" })} {num(p.durationWeeks, lang)}{" "}
                  {t({
                    ar: "أسبوع",
                    en: p.durationWeeks === 1 ? "week" : "weeks",
                  })}
                </li>
              )}
              {p.seats > 0 && (
                <li className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-primary" />
                  {t({ ar: "المقاعد:", en: "Seats:" })} {num(p.seats, lang)}
                </li>
              )}
              {p.startsAt && (
                <li className="flex items-center gap-3">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  {t({ ar: "يبدأ:", en: "Starts:" })} {fmtDate(p.startsAt, lang)}
                </li>
              )}
              {p.applyDeadline && (
                <li className="flex items-center gap-3">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  {t({ ar: "آخر موعد للتقديم:", en: "Application deadline:" })}{" "}
                  {fmtDate(p.applyDeadline, lang)}
                </li>
              )}
            </ul>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-2">
              {t({ ar: "التقديم على البرنامج", en: "Apply to this program" })}
            </div>
            <AnimatePresence mode="wait">
              {data.hasApplied ? (
                <motion.div key="applied" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-5">
                  <CheckCircle2 className="w-11 h-11 text-emerald-300 mx-auto mb-3" />
                  <div className="text-white font-bold text-[14.5px] mb-1">
                    {t({
                      ar: "قدّمت على هذا البرنامج",
                      en: "You've applied to this program",
                    })}
                  </div>
                  <div className="text-white/55 text-[13px]">
                    {t({ ar: "الحالة:", en: "Status:" })}{" "}
                    {data.myStatus
                      ? t({
                          ar: PROGRAM_APPLICATION_STATUS_LABELS[data.myStatus],
                          en: PROGRAM_APPLICATION_STATUS_LABELS_EN[data.myStatus],
                        })
                      : "—"}
                  </div>
                </motion.div>
              ) : p.status !== "open" ? (
                <motion.div key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/55 text-[13px] text-center py-4">
                  {t({
                    ar: "التقديم على هذا البرنامج مغلق حاليًا.",
                    en: "Applications to this program are currently closed.",
                  })}
                </motion.div>
              ) : !user ? (
                <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-white/65 text-[13.5px] leading-[1.85] mb-4">
                    {t({
                      ar: "سجّل دخولك لتقديم مشروعك على هذا البرنامج.",
                      en: "Sign in to submit your venture to this program.",
                    })}
                  </p>
                  <Link
                    href={`/login?next=/programs/${id}`}
                    className="block text-center w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-[14px] hover:-translate-y-px transition-all"
                  >
                    {t({ ar: "تسجيل الدخول", en: "Sign in" })}
                  </Link>
                </motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={apply} className="space-y-3.5">
                  <Field label={t({ ar: "اسم المشروع (اختياري)", en: "Venture name (optional)" })}>
                    <input
                      value={ventureName}
                      onChange={(e) => setVentureName(e.target.value)}
                      maxLength={200}
                      className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3.5 py-2.5 text-[13.5px] text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
                    />
                  </Field>
                  <Field label={t({ ar: "فكرة المشروع", en: "Your idea" })}>
                    <textarea
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      rows={4}
                      maxLength={4000}
                      className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3.5 py-2.5 text-[13.5px] text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none resize-none"
                    />
                  </Field>
                  <Field label={t({ ar: "لماذا تريد الانضمام؟ (اختياري)", en: "Why do you want to join? (optional)" })}>
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
                    {busy ? "…" : t({ ar: "إرسال طلب التقديم", en: "Submit application" })}
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
