import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { PageShell, GlassCard, BackLink } from "@/components/shell/PageShell";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { usePageMeta } from "@/hooks/use-meta";
import { useAuth } from "@/lib/auth";
import { Reveal } from "@/components/landing/Reveal";
import { EASE_OUT_EXPO } from "@/lib/motion";
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

// Evergreen frames so a cover-less program still wears real imagery
// (deterministic by id — a program keeps one consistent frame).
const PROGRAM_FRAMES = [
  "/photos/IMG_8341.webp",
  "/photos/IMG_8347.webp",
  "/photos/IMG_8352.webp",
  "/photos/IMG_8344.webp",
  "/photos/IMG_8357.webp",
  "/photos/IMG_8349.webp",
];
const frameFor = (id: number) =>
  PROGRAM_FRAMES[Math.abs(id) % PROGRAM_FRAMES.length];

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
        <GlassCard className="p-8 text-center text-destructive">{error}</GlassCard>
      </PageShell>
    );
  }
  if (!data) {
    return (
      <PageShell active="programs">
        <div className="h-[clamp(22rem,55vh,34rem)] rounded-[28px] bg-white/[0.035] border border-border-strong animate-pulse" />
      </PageShell>
    );
  }

  const p = data.program;
  const perks = p.perks
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const tags = splitTags(p.tags);
  const open = p.status === "open";
  const statusLabel = t({
    ar: PROGRAM_STATUS_LABELS[p.status],
    en: PROGRAM_STATUS_LABELS_EN[p.status],
  });

  // Hard data only — cerulean (sand) is reserved for these real figures.
  const facts: { label: string; value: string }[] = [];
  if (p.durationWeeks > 0)
    facts.push({
      label: t({ ar: "المدّة", en: "Duration" }),
      value: `${num(p.durationWeeks, lang)} ${t({
        ar: "أسبوع",
        en: p.durationWeeks === 1 ? "week" : "weeks",
      })}`,
    });
  if (p.seats > 0)
    facts.push({
      label: t({ ar: "المقاعد", en: "Seats" }),
      value: num(p.seats, lang),
    });
  if (p.startsAt)
    facts.push({
      label: t({ ar: "يبدأ", en: "Starts" }),
      value: fmtDate(p.startsAt, lang),
    });
  if (p.applyDeadline)
    facts.push({
      label: t({ ar: "آخر موعد", en: "Deadline" }),
      value: fmtDate(p.applyDeadline, lang),
    });

  return (
    <PageShell active="programs">
      <BackLink
        href="/programs"
        label={t({ ar: "كلّ البرامج", en: "All programs" })}
      />

      {/* ── HERO — cinematic full-bleed cover, monumental title, hard facts ── */}
      <ProgramHero
        program={p}
        statusLabel={statusLabel}
        open={open}
        facts={facts}
      />

      <div className="mt-[clamp(2.5rem,6vw,4.5rem)] grid gap-[clamp(2.5rem,5vw,4rem)] lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start">
        {/* ── EDITORIAL BODY ── */}
        <div>
          {p.summary && (
            <Reveal>
              <p
                className="font-display text-foreground max-w-2xl"
                style={{
                  fontSize: "clamp(1.35rem, 2.6vw, 2rem)",
                  lineHeight: 1.32,
                  letterSpacing: "-0.02em",
                  fontWeight: 600,
                }}
              >
                {p.summary}
              </p>
            </Reveal>
          )}

          {p.description && (
            <Reveal delay={0.06}>
              <div className="mt-[clamp(2rem,4vw,3rem)] t-body text-[15px] md:text-[17px] max-w-2xl whitespace-pre-wrap">
                {p.description}
              </div>
            </Reveal>
          )}

          {perks.length > 0 && (
            <section className="mt-[clamp(3rem,6vw,5rem)]">
              <Reveal>
                <h2
                  className="font-display font-bold text-foreground"
                  style={{
                    fontSize: "clamp(1.8rem, 3.6vw, 2.8rem)",
                    lineHeight: 1.08,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {t({ ar: "ماذا ", en: "What you'll " })}
                  <span className="text-primary">
                    {t({ ar: "ستكسب.", en: "gain." })}
                  </span>
                </h2>
              </Reveal>

              <ul className="mt-[clamp(2rem,4vw,3rem)] border-t border-border-strong/60">
                {perks.map((perk, i) => (
                  <li key={i}>
                    <Reveal delay={Math.min(i, 6) * 0.05}>
                      <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-[clamp(1rem,2.5vw,1.75rem)] py-[clamp(1.1rem,2.4vw,1.75rem)] border-b border-border-strong/60">
                        <span
                          aria-hidden
                          className="font-display font-black text-sand tnum leading-none translate-y-[0.1em]"
                          style={{
                            fontSize: "clamp(0.85rem, 1.4vw, 1.05rem)",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {num(i + 1, lang).padStart(2, lang === "ar" ? "٠" : "0")}
                        </span>
                        <p className="t-body text-[15px] md:text-[17px] text-foreground/90">
                          {perk}
                        </p>
                      </div>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tags.length > 0 && (
            <Reveal delay={0.04}>
              <div className="mt-[clamp(2.5rem,5vw,3.5rem)]">
                <div className="eyebrow eyebrow-sand mb-4">
                  {t({ ar: "المجالات", en: "Focus areas" })}
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="chip-sand inline-flex items-center rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          )}
        </div>

        {/* ── APPLY PANEL — sticky aside; form LOGIC preserved verbatim ── */}
        <div className="lg:sticky lg:top-[clamp(6rem,14vh,9rem)]">
          <GlassCard className="p-[clamp(1.5rem,3vw,2.25rem)]">
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <h3
                className="font-display font-bold text-foreground"
                style={{
                  fontSize: "clamp(1.35rem, 2.2vw, 1.7rem)",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.12,
                }}
              >
                {t({ ar: "التقديم على البرنامج", en: "Apply to this program" })}
              </h3>
            </div>
            <p className="t-caption text-fg-secondary mb-5">
              {open
                ? t({
                    ar: "احكِ لنا فكرتك — نقرأ كلّ طلب بعناية.",
                    en: "Tell us your idea — we read every application with care.",
                  })
                : t({
                    ar: "تابع هذا البرنامج لمعرفة موعد فتح التقديم.",
                    en: "Follow this program to know when applications open.",
                  })}
            </p>

            <AnimatePresence mode="wait">
              {data.hasApplied ? (
                <motion.div key="applied" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-5">
                  <CheckCircle2 className="w-11 h-11 text-emerald-300 mx-auto mb-3" />
                  <div className="text-foreground font-bold text-[14.5px] mb-1">
                    {t({
                      ar: "قدّمت على هذا البرنامج",
                      en: "You've applied to this program",
                    })}
                  </div>
                  <div className="text-muted-foreground text-[13px]">
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
                <motion.div key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground text-[13px] text-center py-4">
                  {t({
                    ar: "التقديم على هذا البرنامج مغلق حاليًا.",
                    en: "Applications to this program are currently closed.",
                  })}
                </motion.div>
              ) : !user ? (
                <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-fg-secondary text-[13.5px] leading-[1.85] mb-4">
                    {t({
                      ar: "سجّل دخولك لتقديم مشروعك على هذا البرنامج.",
                      en: "Sign in to submit your venture to this program.",
                    })}
                  </p>
                  <Link
                    href={`/login?next=/programs/${id}`}
                    className="cta-fill block text-center w-full py-3.5 rounded-2xl font-bold text-[14px] hover:-translate-y-px transition-all"
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
                      className="w-full rounded-xl bg-surface-2 border border-border-strong px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                    />
                  </Field>
                  <Field label={t({ ar: "فكرة المشروع", en: "Your idea" })}>
                    <textarea
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      rows={4}
                      maxLength={4000}
                      className="w-full rounded-xl bg-surface-2 border border-border-strong px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none resize-none"
                    />
                  </Field>
                  <Field label={t({ ar: "لماذا تريد الانضمام؟ (اختياري)", en: "Why do you want to join? (optional)" })}>
                    <textarea
                      value={motivation}
                      onChange={(e) => setMotivation(e.target.value)}
                      rows={3}
                      maxLength={4000}
                      className="w-full rounded-xl bg-surface-2 border border-border-strong px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none resize-none"
                    />
                  </Field>
                  {formError && <div className="text-[12.5px] text-destructive">{formError}</div>}
                  <button
                    type="submit"
                    disabled={busy}
                    className="cta-fill w-full py-3.5 rounded-2xl font-bold text-[14px] enabled:hover:-translate-y-px transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    data-testid="button-apply-program"
                  >
                    {busy ? "…" : t({ ar: "إرسال طلب التقديم", en: "Submit application" })}
                    {!busy && (
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    )}
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

/* ──────────────────────────────────────────────────────────────────────────
 *  HERO — a cinematic full-bleed cover (real coverUrl, or a deterministic
 *  evergreen frame), a deep scrim + brand-aura, the title at display scale,
 *  the status as a quiet uppercase line, and the hard facts (duration / seats /
 *  start / deadline) as cerulean inline figures beneath. Slow parallax on the
 *  photograph, guarded by reduced-motion.
 * ────────────────────────────────────────────────────────────────────────── */
function ProgramHero({
  program: p,
  statusLabel,
  open,
  facts,
}: {
  program: ProgramFull;
  statusLabel: string;
  open: boolean;
  facts: { label: string; value: string }[];
}) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const photoY = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? ["0%", "0%"] : ["0%", "12%"],
  );

  const cover = p.coverUrl || frameFor(p.id);

  return (
    <motion.div
      ref={ref}
      initial={reduce ? false : { opacity: 0 }}
      animate={reduce ? undefined : { opacity: 1 }}
      transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
      className="relative overflow-hidden rounded-[clamp(20px,2.5vw,32px)] ring-1 ring-white/10"
    >
      <div className="relative h-[clamp(24rem,62vh,40rem)]">
        <motion.img
          src={cover}
          alt={p.title}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = frameFor(p.id);
          }}
          style={{ y: photoY }}
          className="absolute inset-0 h-[118%] -top-[9%] w-full object-cover object-center saturate-[1.04] will-change-transform"
        />
        {/* brand cerulean/crimson bloom — atmosphere on the navy scrim */}
        <div aria-hidden className="absolute inset-0 brand-aura opacity-70" />
        {/* deep navy scrim — keeps the title legible, the photo present */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(0deg, hsl(0 0% 4% / 0.97) 5%, hsl(0 0% 4% / 0.55) 46%, hsl(0 0% 4% / 0.12) 82%)",
          }}
        />

        <div className="absolute inset-0 flex items-end">
          <div className="w-full p-[clamp(1.5rem,4.5vw,3.5rem)]">
            {/* status — quiet uppercase line; a live dot when open */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_EXPO }}
              className="mb-4 inline-flex items-center gap-2.5 text-[clamp(0.72rem,1.2vw,0.85rem)] font-bold uppercase tracking-[0.16em] rtl:tracking-normal text-white/80"
            >
              {open && (
                <span
                  aria-hidden
                  className="inline-flex h-1.5 w-1.5 rounded-full bg-primary"
                />
              )}
              <span className={open ? "text-primary" : "text-white/75"}>
                {statusLabel}
              </span>
            </motion.div>

            <motion.h1
              className="font-display text-white max-w-[18ch]"
              style={{
                fontSize: "clamp(2.1rem, 5.6vw, 4.4rem)",
                lineHeight: 1.0,
                letterSpacing: "-0.038em",
                fontWeight: 700,
              }}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.16, ease: EASE_OUT_EXPO }}
            >
              {p.title}
            </motion.h1>

            {/* hard facts — cerulean figures over a hairline, reserved for data */}
            {facts.length > 0 && (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 18 }}
                animate={reduce ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.28, ease: EASE_OUT_EXPO }}
                className="mt-[clamp(1.75rem,3.5vw,2.75rem)] flex flex-wrap items-end gap-x-[clamp(1.75rem,4vw,3.5rem)] gap-y-5 border-t border-white/15 pt-[clamp(1.25rem,2.5vw,1.75rem)]"
              >
                {facts.map((f) => (
                  <div key={f.label}>
                    <div className="text-[clamp(0.62rem,1vw,0.7rem)] font-semibold uppercase tracking-[0.16em] rtl:tracking-normal text-white/55">
                      {f.label}
                    </div>
                    <div
                      className="mt-1.5 font-display font-bold text-sand-bright tnum"
                      style={{
                        fontSize: "clamp(1.05rem, 2vw, 1.55rem)",
                        letterSpacing: "-0.015em",
                        lineHeight: 1.05,
                      }}
                    >
                      {f.value}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            <span className="sr-only">
              {t({ ar: "تفاصيل البرنامج", en: "Program details" })}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11.5px] text-muted-foreground font-medium mb-1.5">{label}</span>
      {children}
    </label>
  );
}
