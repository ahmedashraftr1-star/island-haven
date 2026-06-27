import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  Star,
  Globe,
  Linkedin,
  Clock,
  Award,
  Languages as LanguagesIcon,
  CheckCircle2,
  Users,
  CalendarDays,
} from "lucide-react";
import { PageShell, GlassCard, BackLink } from "@/components/shell/PageShell";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { usePageMeta } from "@/hooks/use-meta";
import { useAuth } from "@/lib/auth";
import {
  splitTags,
  SESSION_MODE_LABELS,
  SESSION_MODE_LABELS_EN,
  type SessionMode,
} from "@/lib/labels";
import type { ExpertCard } from "./Experts";

// Bilingual team labels keyed by group, resolved via t() at the call site.
const TEAM_LABELS: Record<string, { ar: string; en: string }> = {
  leadership: { ar: "فريق القيادة", en: "Leadership team" },
  mentors: { ar: "فريق الإرشاد التقنيّ والمنتج", en: "Tech & Product Mentors" },
  advisors: { ar: "فريق الاستشارات والأعمال", en: "Business Advisors" },
};

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
// Localised numeral: Arabic-Indic in AR, Western digits in EN.
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}
function sessionModeLabel(mode: SessionMode, lang: Lang): string {
  return (lang === "ar" ? SESSION_MODE_LABELS : SESSION_MODE_LABELS_EN)[mode];
}

export default function ExpertDetail() {
  const { lang, t } = useLanguage();
  const [, params] = useRoute("/experts/:id");
  const [, navigate] = useLocation();
  const id = params?.id;
  const { user } = useAuth();
  const reduce = useReducedMotion();

  const [expert, setExpert] = useState<ExpertCard | null>(null);
  const [teamGroup, setTeamGroup] = useState<string | null>(null);
  const [rating, setRating] = useState<{ average: number | null; count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // session-request form
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<SessionMode>("online");
  const [preferredAt, setPreferredAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api<{ expert: ExpertCard }>(`/experts/${id}`)
      .then((r) => {
        if (!cancelled) setExpert(r.expert);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(
          e instanceof ApiError
            ? e.message
            : t({ ar: "تعذّر التحميل", en: "Couldn't load" }),
        );
      });
    api<{ average: number | null; count: number }>(`/experts/${id}/rating`)
      .then((r) => {
        if (!cancelled) setRating(r);
      })
      .catch(() => {
        /* rating is non-critical */
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Derive which team this expert belongs to (by name) for a contextual chip.
  useEffect(() => {
    if (!expert) return;
    let cancelled = false;
    api<{ team: { fullName: string; group: string }[] }>("/team")
      .then((r) => {
        if (cancelled) return;
        const m = r.team.find(
          (member) => member.fullName.trim() === expert.fullName.trim(),
        );
        setTeamGroup(m && TEAM_LABELS[m.group] ? m.group : null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [expert]);

  usePageMeta({
    title: expert?.fullName,
    description: expert?.headline,
    image: expert?.avatarUrl ?? undefined,
    type: "profile",
  });

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!user) {
      navigate(`/login?next=/experts/${id}`);
      return;
    }
    if (busy) return;
    if (topic.trim().length < 3) {
      setFormError(
        t({
          ar: "اكتب موضوع الجلسة (3 أحرف فأكثر).",
          en: "Add a session topic (3 characters or more).",
        }),
      );
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await api(`/experts/${id}/sessions`, {
        method: "POST",
        body: JSON.stringify({
          topic: topic.trim(),
          message: message.trim(),
          mode,
          preferredAt: preferredAt
            ? new Date(preferredAt).toISOString()
            : null,
        }),
      });
      setDone(true);
      setTopic("");
      setMessage("");
      setPreferredAt("");
    } catch (e) {
      setFormError(
        e instanceof ApiError
          ? e.message
          : t({ ar: "تعذّر إرسال الطلب", en: "Couldn't send your request" }),
      );
    } finally {
      setBusy(false);
    }
  }

  if (error && !expert) {
    return (
      <PageShell active="experts">
        <BackLink
          href="/experts"
          label={t({ ar: "عودة للخبراء", en: "Back to experts" })}
        />
        <GlassCard className="p-8 text-center text-destructive">{error}</GlassCard>
      </PageShell>
    );
  }
  if (!expert) {
    return (
      <PageShell active="experts">
        <BackLink
          href="/experts"
          label={t({ ar: "كلّ الخبراء", en: "All experts" })}
        />
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
          <div className="h-[420px] rounded-[28px] bg-white/[0.035] border border-border-strong animate-pulse" />
          <div className="h-[420px] rounded-[28px] bg-white/[0.035] border border-border-strong animate-pulse" />
        </div>
      </PageShell>
    );
  }

  const areas = splitTags(expert.expertise);
  const langs = splitTags(expert.languages);
  const initials = expert.fullName.trim().charAt(0) || "؟";

  const enter = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const, delay },
        };

  return (
    <PageShell active="experts">
      <BackLink
        href="/experts"
        label={t({ ar: "كلّ الخبراء", en: "All experts" })}
      />

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
        {/* ── Profile — cinematic editorial header ── */}
        <motion.div {...enter(0)}>
          <GlassCard className="p-7 sm:p-9">
            {/* Ambient brand glow + faint initial watermark */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -left-20 w-80 h-80 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, hsl(354 80% 55% / 0.14), transparent 70%)",
              }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-10 -left-4 select-none font-black leading-none"
              style={{
                fontSize: "12rem",
                color: "transparent",
                WebkitTextStroke: "1.5px rgba(255,255,255,0.035)",
              }}
            >
              {initials}
            </span>

            <div className="relative">
              {expert.featured && (
                <div className="inline-flex items-center gap-1.5 mb-5 px-2.5 py-0.5 rounded-full text-[10px] tracking-[0.16em] uppercase font-bold bg-amber-400/10 text-amber-200 border border-amber-400/30">
                  <Star className="w-3 h-3 fill-amber-300 text-amber-300" />{" "}
                  {t({ ar: "خبير مميّز", en: "Featured" })}
                </div>
              )}

              <div className="flex items-start gap-5 mb-6">
                <div className="relative shrink-0">
                  <div
                    aria-hidden
                    className="absolute inset-0 rounded-3xl blur-xl"
                    style={{ background: "hsl(354 80% 55% / 0.25)" }}
                  />
                  {expert.avatarUrl ? (
                    <img
                      src={expert.avatarUrl}
                      alt={expert.fullName}
                      className="relative w-28 h-28 rounded-3xl object-cover border border-border-strong"
                    />
                  ) : (
                    <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-primary/40 to-primary/[0.06] border border-border-strong flex items-center justify-center text-[2.6rem] font-bold text-foreground">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="min-w-0 pt-1">
                  <h1
                    className="font-bold text-foreground leading-[1.1] mb-1.5"
                    style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.1rem)", letterSpacing: "-0.02em" }}
                    data-testid="text-expert-name"
                  >
                    {expert.fullName}
                  </h1>
                  {expert.headline && (
                    <p className="text-primary/90 text-[14px] font-medium leading-snug">
                      {expert.headline}
                    </p>
                  )}
                  {teamGroup && TEAM_LABELS[teamGroup] && (
                    <span className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-primary bg-primary/10 border border-primary/25">
                      <Users className="w-3 h-3" /> {t(TEAM_LABELS[teamGroup])}
                    </span>
                  )}
                  {rating && rating.count > 0 && (
                    <div
                      className="flex items-center gap-1.5 mt-2.5"
                      title={t({
                        ar: `${rating.average?.toFixed(1)} من 5 — ${num(rating.count, lang)} تقييم`,
                        en: `${rating.average?.toFixed(1)} out of 5 — ${rating.count} reviews`,
                      })}
                      data-testid="expert-rating"
                    >
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`w-3.5 h-3.5 ${
                              n <= Math.round(rating.average ?? 0)
                                ? "fill-amber-300 text-amber-300"
                                : "text-fg-faint"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-foreground text-[12.5px] font-bold tabular-nums">
                        {rating.average?.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground text-[11.5px]">
                        {t({
                          ar: `(${num(rating.count, lang)} تقييم)`,
                          en: `(${rating.count} reviews)`,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {expert.bio && (
                <div className="text-fg-secondary text-[14.5px] leading-[1.95] whitespace-pre-wrap mb-6">
                  {expert.bio}
                </div>
              )}

              {areas.length > 0 && (
                <div className="mb-6">
                  <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-3">
                    {t({ ar: "مجالات الخبرة", en: "Areas of expertise" })}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {areas.map((a) => (
                      <span
                        key={a}
                        className="px-3 py-1 rounded-full text-[12px] font-medium bg-surface-2 text-fg-secondary border border-border-strong"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2.5">
                {expert.yearsExperience > 0 && (
                  <Stat icon={<Award className="w-4 h-4 text-primary" />}>
                    {t({
                      ar: `${num(expert.yearsExperience, lang)}+ سنة خبرة`,
                      en: `${expert.yearsExperience}+ years experience`,
                    })}
                  </Stat>
                )}
                {langs.length > 0 && (
                  <Stat icon={<LanguagesIcon className="w-4 h-4 text-primary" />}>
                    {langs.join(lang === "ar" ? "، " : ", ")}
                  </Stat>
                )}
                <Stat icon={<Clock className="w-4 h-4 text-primary" />}>
                  {t({
                    ar: `جلسة ~${num(expert.sessionMinutes, lang)} دقيقة`,
                    en: `~${expert.sessionMinutes} min session`,
                  })}
                </Stat>
              </div>

              {(expert.linkedinUrl || expert.websiteUrl) && (
                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-border-strong">
                  {expert.linkedinUrl && (
                    <a
                      href={expert.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-[12.5px] text-fg-secondary hover:text-primary transition-colors"
                    >
                      <Linkedin className="w-4 h-4" /> LinkedIn
                    </a>
                  )}
                  {expert.websiteUrl && (
                    <a
                      href={expert.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-[12.5px] text-fg-secondary hover:text-primary transition-colors"
                    >
                      <Globe className="w-4 h-4" /> {t({ ar: "الموقع", en: "Website" })}
                    </a>
                  )}
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* ── Booking — sticky rail ── */}
        <motion.div {...enter(0.1)} className="lg:sticky lg:top-6 space-y-5">
          <OfficeHoursPicker
            expertId={Number(id)}
            expertName={expert.fullName}
            reduce={!!reduce}
          />

          <GlassCard className="p-6">
            <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-2">
              {t({ ar: "احجز جلسة إرشاد", en: "Request a mentorship session" })}
            </div>
            {expert.availabilityNote && (
              <p className="text-muted-foreground text-[12.5px] leading-[1.7] mb-4">
                {expert.availabilityNote}
              </p>
            )}

            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-6"
                >
                  <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                  <div className="text-foreground font-bold text-[15px] mb-1">
                    {t({ ar: "تمّ إرسال طلبك", en: "Your request was sent" })}
                  </div>
                  <p className="text-muted-foreground text-[13px] leading-[1.7]">
                    {t({
                      ar: "سيراجع الخبير طلبك ويؤكّد موعد الجلسة. تابع حالتها من صفحة ملفّك.",
                      en: "The expert will review your request and confirm a time. Track its status from your profile page.",
                    })}
                  </p>
                  <Link
                    href="/profile"
                    className="inline-block mt-4 text-[12.5px] text-primary font-semibold hover:underline"
                  >
                    {t({ ar: "عرض جلساتي", en: "View my sessions" })}
                  </Link>
                </motion.div>
              ) : !expert.acceptingSessions ? (
                <motion.div
                  key="closed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-muted-foreground text-[13px] text-center py-4 leading-[1.8]"
                >
                  {t({
                    ar: "هذا الخبير لا يستقبل طلبات جلسات حاليًا. تابعه لاحقًا.",
                    en: "This expert isn't accepting session requests right now. Check back later.",
                  })}
                </motion.div>
              ) : !user ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-fg-secondary text-[13.5px] leading-[1.85] mb-4">
                    {t({
                      ar: `سجّل دخولك لحجز جلسة إرشاد مَجّانيّة مع ${expert.fullName}.`,
                      en: `Sign in to book a free mentorship session with ${expert.fullName}.`,
                    })}
                  </p>
                  <Link
                    href={`/login?next=/experts/${id}`}
                    className="block text-center w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-[14px] hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] hover:-translate-y-px transition-all"
                  >
                    {t({ ar: "تسجيل الدخول للحجز", en: "Sign in to book" })}
                  </Link>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={submit}
                  className="space-y-3.5"
                >
                  <Field label={t({ ar: "موضوع الجلسة", en: "Session topic" })}>
                    <input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      maxLength={200}
                      placeholder={t({
                        ar: "مثال: مراجعة نموذج عمل مشروعي",
                        en: "e.g. Review my startup's business model",
                      })}
                      className="w-full rounded-xl bg-surface-2 border border-border-strong px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                      data-testid="input-session-topic"
                    />
                  </Field>
                  <Field
                    label={t({
                      ar: "نبذة عمّا تحتاجه (اختياري)",
                      en: "A bit about what you need (optional)",
                    })}
                  >
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={2000}
                      rows={3}
                      className="w-full rounded-xl bg-surface-2 border border-border-strong px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none resize-none"
                      data-testid="input-session-message"
                    />
                  </Field>
                  <Field label={t({ ar: "نوع الجلسة", en: "Session type" })}>
                    <div className="flex gap-2">
                      {(["online", "onsite"] as SessionMode[]).map((m) => (
                        <button
                          type="button"
                          key={m}
                          onClick={() => setMode(m)}
                          className={`flex-1 py-2.5 rounded-xl text-[12.5px] font-semibold border transition-colors ${
                            mode === m
                              ? "bg-primary/20 text-foreground border-primary/40"
                              : "bg-surface-2 text-muted-foreground border-border-strong hover:text-foreground"
                          }`}
                        >
                          {sessionModeLabel(m, lang)}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label={t({ ar: "الوقت المفضّل (اختياري)", en: "Preferred time (optional)" })}>
                    <input
                      type="datetime-local"
                      value={preferredAt}
                      onChange={(e) => setPreferredAt(e.target.value)}
                      className="w-full rounded-xl bg-surface-2 border border-border-strong px-3.5 py-2.5 text-[13.5px] text-foreground focus:border-primary/50 focus:outline-none [color-scheme:dark]"
                      data-testid="input-session-time"
                    />
                  </Field>

                  {formError && (
                    <div className="text-[12.5px] text-destructive">{formError}</div>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-[14px] enabled:hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] enabled:hover:-translate-y-px transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    data-testid="button-request-session"
                  >
                    <Sparkles className="w-4 h-4" />
                    {busy ? "…" : t({ ar: "إرسال طلب الجلسة", en: "Send session request" })}
                  </button>
                  <p className="text-muted-foreground text-[11.5px] text-center leading-[1.6]">
                    {t({
                      ar: "مَجّاني تمامًا — الخبير يؤكّد الموعد بعد المراجعة.",
                      en: "Completely free — the expert confirms the time after reviewing.",
                    })}
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>
      </div>
    </PageShell>
  );
}

function Stat({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2 border border-border-strong text-[12.5px] text-fg-secondary">
      {icon}
      {children}
    </span>
  );
}

interface Slot {
  id: number;
  expertId: number;
  startAt: string;
  endAt: string;
  mode: "online" | "onsite";
  location: string;
  status: "available" | "booked" | "cancelled";
  note: string;
}

function OfficeHoursPicker({
  expertId,
  expertName,
  reduce,
}: {
  expertId: number;
  expertName: string;
  reduce: boolean;
}) {
  const { lang, t } = useLanguage();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [picked, setPicked] = useState<Slot | null>(null);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    try {
      const r = await api<{ slots: Slot[] }>(`/experts/${expertId}/slots`);
      setSlots(r.slots);
    } catch {
      setSlots([]);
    }
  }

  useEffect(() => {
    void reload();
  }, [expertId]);

  async function book() {
    if (!user) {
      navigate(`/login?next=/experts/${expertId}`);
      return;
    }
    if (!picked) return;
    if (topic.trim().length < 3) {
      setError(
        t({
          ar: "اكتب موضوع الجلسة (3 أحرف فأكثر).",
          en: "Add a session topic (3 characters or more).",
        }),
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api(`/slots/${picked.id}/book`, {
        method: "POST",
        body: JSON.stringify({ topic: topic.trim(), message: message.trim() }),
      });
      setDone(true);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : t({ ar: "تعذّر الحجز", en: "Couldn't book" }),
      );
      void reload();
    } finally {
      setBusy(false);
    }
  }

  if (slots === null) {
    return (
      <GlassCard className="p-6">
        <div className="h-24 bg-surface-2 rounded-2xl animate-pulse" />
      </GlassCard>
    );
  }
  if (slots.length === 0) return null;

  // Group available slots by calendar day for a calendar-like picker.
  const days: { key: string; label: string; slots: Slot[] }[] = [];
  for (const s of slots) {
    const d = new Date(s.startAt);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(
      lang === "ar" ? "ar-EG-u-ca-gregory" : "en-GB",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
      },
    );
    let day = days.find((x) => x.key === key);
    if (!day) {
      day = { key, label, slots: [] };
      days.push(day);
    }
    day.slots.push(s);
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <CalendarDays className="w-4 h-4 text-primary" />
        <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold">
          {t({ ar: "مواعيد متاحة · Office Hours", en: "Office Hours · Open Slots" })}
        </div>
      </div>
      <p className="text-muted-foreground text-[12.5px] mb-4">
        {t({
          ar: `احجز فورًا فترةً مفتوحة من تقويم ${expertName}.`,
          en: `Instantly book an open slot from ${expertName}'s calendar.`,
        })}
      </p>

      {done ? (
        <div className="text-center py-6">
          <CheckCircle2 className="w-11 h-11 text-emerald-300 mx-auto mb-3" />
          <div className="text-foreground font-bold text-[14.5px] mb-1">
            {t({ ar: "تمّ الحجز ✓", en: "Booked ✓" })}
          </div>
          <p className="text-muted-foreground text-[12.5px] leading-[1.85]">
            {t({
              ar: "ستصلك رسالة بريدية بتفاصيل الجلسة.",
              en: "You'll get an email with the session details.",
            })}
          </p>
          <Link
            href="/profile"
            className="inline-block mt-3 text-[12.5px] text-primary font-semibold hover:underline"
          >
            {t({ ar: "عرض جلساتي", en: "View my sessions" })}
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-4 max-h-[320px] overflow-y-auto pr-1">
            {days.map((day) => (
              <div key={day.key}>
                <div className="text-[12px] font-semibold text-foreground mb-2">
                  {day.label}
                </div>
                <div className="flex flex-wrap gap-2">
                  {day.slots.map((s) => {
                    const start = new Date(s.startAt);
                    const timeLabel = start.toLocaleTimeString(
                      lang === "ar" ? "ar-EG" : "en-GB",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    );
                    const isPicked = picked?.id === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setPicked(s)}
                        className={`group rounded-xl px-3.5 py-2 border transition-all tabular-nums ${
                          isPicked
                            ? "bg-primary/20 border-primary/50 text-foreground shadow-[0_10px_24px_-12px_rgba(220,38,55,0.6)]"
                            : "bg-surface-2 border-border-strong text-foreground hover:bg-surface-2 hover:border-border-strong"
                        } ${reduce ? "" : "hover:-translate-y-0.5"}`}
                        aria-pressed={isPicked ? "true" : "false"}
                      >
                        <span className="block text-[13px] font-semibold">{timeLabel}</span>
                        <span className="block text-[10px] text-muted-foreground">
                          {sessionModeLabel(s.mode, lang)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {picked && (
              <motion.div
                key="confirm"
                initial={reduce ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={reduce ? undefined : { opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pt-3 border-t border-border-strong">
                  <label className="block">
                    <span className="block text-[11.5px] text-muted-foreground mb-1.5">
                      {t({ ar: "موضوع الجلسة", en: "Session topic" })}
                    </span>
                    <input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      maxLength={200}
                      placeholder={t({
                        ar: "ماذا تريد أن نناقش؟",
                        en: "What would you like to discuss?",
                      })}
                      className="w-full rounded-xl bg-surface-2 border border-border-strong px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-[11.5px] text-muted-foreground mb-1.5">
                      {t({ ar: "تفاصيل إضافيّة (اختياري)", en: "Extra details (optional)" })}
                    </span>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      className="w-full rounded-xl bg-surface-2 border border-border-strong px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none resize-none"
                    />
                  </label>
                  {error && (
                    <div className="text-[12.5px] text-destructive">{error}</div>
                  )}
                  <button
                    type="button"
                    onClick={book}
                    disabled={busy}
                    className="w-full py-3 rounded-2xl bg-primary text-white font-bold text-[14px] enabled:hover:-translate-y-px transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {busy ? "…" : t({ ar: "تأكيد الحجز", en: "Confirm booking" })}
                  </button>
                  <p className="text-muted-foreground text-[11px] text-center">
                    {t({
                      ar: "مَجّاني — يَصلك إيميل التأكيد فورًا.",
                      en: "Free — a confirmation email arrives instantly.",
                    })}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </GlassCard>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11.5px] text-muted-foreground font-medium mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
