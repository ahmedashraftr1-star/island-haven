import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Star,
  Globe,
  Linkedin,
  Clock,
  Award,
  Languages as LanguagesIcon,
  CheckCircle2,
  User,
} from "lucide-react";
import { PageShell, GlassCard, BackLink } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import { usePageMeta } from "@/hooks/use-meta";
import { useAuth } from "@/lib/auth";
import { splitTags, SESSION_MODE_LABELS, SESSION_MODE_LABELS_EN, type SessionMode } from "@/lib/labels";
import type { ExpertCard } from "./Experts";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ExpertDetail() {
  const { lang } = useLanguage();
  const [, params] = useRoute("/experts/:id");
  const [, navigate] = useLocation();
  const id = params?.id;
  const { user } = useAuth();

  const [expert, setExpert] = useState<ExpertCard | null>(null);
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
        setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

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
      setFormError("اكتب موضوع الجلسة (3 أحرف فأكثر).");
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
      setFormError(e instanceof ApiError ? e.message : "تعذّر إرسال الطلب");
    } finally {
      setBusy(false);
    }
  }

  if (error && !expert) {
    return (
      <PageShell active="experts">
        <BackLink href="/experts" label={lang === "en" ? "Back to experts" : "عودة للخبراء"} />
        <GlassCard className="p-8 text-center text-red-200">{error}</GlassCard>
      </PageShell>
    );
  }
  if (!expert) {
    return (
      <PageShell active="experts">
        <div className="h-96 rounded-[28px] bg-white/[0.035] border border-white/10 animate-pulse" />
      </PageShell>
    );
  }

  const areas = splitTags(expert.expertise);
  const langs = splitTags(expert.languages);

  return (
    <PageShell active="experts">
      <BackLink href="/experts" label={lang === "en" ? "All experts" : "كلّ الخبراء"} />

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        {/* Profile */}
        <GlassCard className="p-6 sm:p-8">
          {expert.featured && (
            <div className="inline-flex items-center gap-1.5 mb-5 px-2.5 py-0.5 rounded-full text-[10px] tracking-[0.16em] uppercase font-bold bg-amber-400/10 text-amber-200 border border-amber-400/30">
              <Star className="w-3 h-3 fill-amber-300 text-amber-300" /> {lang === "en" ? "Featured expert" : "خبير مميّز"}
            </div>
          )}
          <div className="flex items-start gap-5 mb-6">
            {expert.avatarUrl ? (
              <img
                src={expert.avatarUrl}
                alt={expert.fullName}
                className="w-24 h-24 rounded-3xl object-cover border border-white/10"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/30 to-primary/5 border border-white/10 flex items-center justify-center">
                <User className="w-10 h-10 text-white/50" />
              </div>
            )}
            <div className="min-w-0 pt-1">
              <h1
                className="font-bold text-white leading-tight mb-1"
                style={{ fontSize: "clamp(1.5rem, 3.5vw, 2rem)" }}
                data-testid="text-expert-name"
              >
                {expert.fullName}
              </h1>
              {expert.headline && (
                <p className="text-primary/90 text-[14px] font-medium leading-snug">
                  {expert.headline}
                </p>
              )}
            </div>
          </div>

          {expert.bio && (
            <div className="text-white/75 text-[14.5px] leading-[1.95] whitespace-pre-wrap mb-6">
              {expert.bio}
            </div>
          )}

          {areas.length > 0 && (
            <div className="mb-6">
              <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-3">
                {lang === "en" ? "Areas of expertise" : "مجالات الخبرة"}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {areas.map((a) => (
                  <span
                    key={a}
                    className="px-3 py-1 rounded-full text-[12px] font-medium bg-white/[0.05] text-white/75 border border-white/10"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-[13px] text-white/70">
            {expert.yearsExperience > 0 && (
              <span className="inline-flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                {expert.yearsExperience}+ {lang === "en" ? "years experience" : "سنة خبرة"}
              </span>
            )}
            {langs.length > 0 && (
              <span className="inline-flex items-center gap-2">
                <LanguagesIcon className="w-4 h-4 text-primary" />
                {langs.join("، ")}
              </span>
            )}
            <span className="inline-flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              {lang === "en" ? `~${expert.sessionMinutes} min session` : `جلسة ~${expert.sessionMinutes} دقيقة`}
            </span>
          </div>

          {(expert.linkedinUrl || expert.websiteUrl) && (
            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-white/[0.06]">
              {expert.linkedinUrl && (
                <a
                  href={expert.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-[12.5px] text-white/65 hover:text-primary transition-colors"
                >
                  <Linkedin className="w-4 h-4" /> LinkedIn
                </a>
              )}
              {expert.websiteUrl && (
                <a
                  href={expert.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-[12.5px] text-white/65 hover:text-primary transition-colors"
                >
                  <Globe className="w-4 h-4" /> {lang === "en" ? "Website" : "الموقع"}
                </a>
              )}
            </div>
          )}
        </GlassCard>

        {/* Booking */}
        <div className="space-y-5">
          <OfficeHoursPicker expertId={Number(id)} expertName={expert.fullName} />

          <GlassCard className="p-6">
            <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-2">
              {lang === "en" ? "Book a mentorship session" : "احجز جلسة إرشاد"}
            </div>
            {expert.availabilityNote && (
              <p className="text-white/55 text-[12.5px] leading-[1.7] mb-4">
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
                  <div className="text-white font-bold text-[15px] mb-1">
                    {lang === "en" ? "Request sent" : "تمّ إرسال طلبك"}
                  </div>
                  <p className="text-white/55 text-[13px] leading-[1.7]">
                    {lang === "en"
                      ? "The expert will review your request and confirm a session time. Track it from your profile."
                      : "سيراجع الخبير طلبك ويؤكّد موعد الجلسة. تابع حالتها من صفحة ملفّك."}
                  </p>
                  <Link
                    href="/profile"
                    className="inline-block mt-4 text-[12.5px] text-primary font-semibold hover:underline"
                  >
                    {lang === "en" ? "View my sessions" : "عرض جلساتي"}
                  </Link>
                </motion.div>
              ) : !expert.acceptingSessions ? (
                <motion.div
                  key="closed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-white/55 text-[13px] text-center py-4 leading-[1.8]"
                >
                  {lang === "en" ? "This expert is not accepting session requests at this time. Check back later." : "هذا الخبير لا يستقبل طلبات جلسات حاليًا. تابعه لاحقًا."}
                </motion.div>
              ) : !user ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-white/65 text-[13.5px] leading-[1.85] mb-4">
                    {lang === "en"
                      ? `Sign in to book a free mentorship session with ${expert.fullName}.`
                      : `سجّل دخولك لحجز جلسة إرشاد مَجّانيّة مع ${expert.fullName}.`}
                  </p>
                  <Link
                    href={`/login?next=/experts/${id}`}
                    className="block text-center w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-[14px] hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] hover:-translate-y-px transition-all"
                  >
                    {lang === "en" ? "Sign in to book" : "تسجيل الدخول للحجز"}
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
                  <Field label={lang === "en" ? "Session topic" : "موضوع الجلسة"}>
                    <input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      maxLength={200}
                      placeholder={lang === "en" ? "E.g. Review my business model" : "مثال: مراجعة نموذج عمل مشروعي"}
                      className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3.5 py-2.5 text-[13.5px] text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
                      data-testid="input-session-topic"
                    />
                  </Field>
                  <Field label={lang === "en" ? "What you need (optional)" : "نبذة عمّا تحتاجه (اختياري)"}>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={2000}
                      rows={3}
                      className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3.5 py-2.5 text-[13.5px] text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none resize-none"
                      data-testid="input-session-message"
                    />
                  </Field>
                  <Field label={lang === "en" ? "Session type" : "نوع الجلسة"}>
                    <div className="flex gap-2">
                      {(["online", "onsite"] as SessionMode[]).map((m) => (
                        <button
                          type="button"
                          key={m}
                          onClick={() => setMode(m)}
                          className={`flex-1 py-2.5 rounded-xl text-[12.5px] font-semibold border transition-colors ${
                            mode === m
                              ? "bg-primary/20 text-white border-primary/40"
                              : "bg-white/[0.04] text-white/60 border-white/10 hover:text-white"
                          }`}
                        >
                          {(lang === "en" ? SESSION_MODE_LABELS_EN : SESSION_MODE_LABELS)[m]}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label={lang === "en" ? "Preferred time (optional)" : "الوقت المفضّل (اختياري)"}>
                    <input
                      type="datetime-local"
                      value={preferredAt}
                      onChange={(e) => setPreferredAt(e.target.value)}
                      className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3.5 py-2.5 text-[13.5px] text-white focus:border-primary/50 focus:outline-none [color-scheme:dark]"
                      data-testid="input-session-time"
                    />
                  </Field>

                  {formError && (
                    <div className="text-[12.5px] text-red-300">{formError}</div>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-[14px] enabled:hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] enabled:hover:-translate-y-px transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    data-testid="button-request-session"
                  >
                    <Sparkles className="w-4 h-4" />
                    {busy ? "…" : (lang === "en" ? "Send session request" : "إرسال طلب الجلسة")}
                  </button>
                  <p className="text-white/40 text-[11.5px] text-center leading-[1.6]">
                    {lang === "en" ? "Completely free — the expert confirms after review." : "مَجّاني تمامًا — الخبير يؤكّد الموعد بعد المراجعة."}
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </GlassCard>
        </div>
      </div>
    </PageShell>
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
}: {
  expertId: number;
  expertName: string;
}) {
  const { lang } = useLanguage();
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
      setError("اكتب موضوع الجلسة (3 أحرف فأكثر).");
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
      setError(e instanceof ApiError ? e.message : "تعذّر الحجز");
      void reload();
    } finally {
      setBusy(false);
    }
  }

  if (slots === null) {
    return (
      <GlassCard className="p-6">
        <div className="h-24 bg-white/[0.04] rounded-2xl animate-pulse" />
      </GlassCard>
    );
  }
  if (slots.length === 0) return null;

  return (
    <GlassCard className="p-6">
      <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-1">
        {lang === "en" ? "Available slots · Office Hours" : "مواعيد متاحة · Office Hours"}
      </div>
      <p className="text-white/55 text-[12.5px] mb-4">
        {lang === "en" ? `Book an open slot from ${expertName}'s calendar right away.` : `احجز فورًا فترةً مفتوحة من تقويم ${expertName}.`}
      </p>

      {done ? (
        <div className="text-center py-6">
          <CheckCircle2 className="w-11 h-11 text-emerald-300 mx-auto mb-3" />
          <div className="text-white font-bold text-[14.5px] mb-1">{lang === "en" ? "Booked ✓" : "تمّ الحجز ✓"}</div>
          <p className="text-white/55 text-[12.5px] leading-[1.85]">
            {lang === "en" ? "You'll receive an email with session details." : "ستصلك رسالة بريدية بتفاصيل الجلسة."}
          </p>
          <Link
            href="/profile"
            className="inline-block mt-3 text-[12.5px] text-primary font-semibold hover:underline"
          >
            {lang === "en" ? "View my sessions" : "عرض جلساتي"}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2 mb-4 max-h-[260px] overflow-y-auto pr-1">
            {slots.map((s) => {
              const start = new Date(s.startAt);
              const end = new Date(s.endAt);
              const dateLabel = start.toLocaleDateString("ar-EG", {
                weekday: "short",
                day: "numeric",
                month: "long",
              });
              const timeLabel = `${start.toLocaleTimeString("ar-EG", {
                hour: "2-digit",
                minute: "2-digit",
              })} – ${end.toLocaleTimeString("ar-EG", {
                hour: "2-digit",
                minute: "2-digit",
              })}`;
              const isPicked = picked?.id === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setPicked(s)}
                  className={`w-full text-right rounded-xl px-3.5 py-2.5 border transition-colors ${
                    isPicked
                      ? "bg-primary/15 border-primary/45 text-white"
                      : "bg-white/[0.04] border-white/10 text-white/80 hover:bg-white/[0.08]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13.5px] font-semibold">{dateLabel}</span>
                    <span className="text-[11px] text-white/55">
                      {s.mode === "online" ? (lang === "en" ? "Online" : "عن بُعد") : (lang === "en" ? "On-site" : "في المساحة")}
                    </span>
                  </div>
                  <div className="text-[12px] text-white/55 tabular-nums">
                    {timeLabel}
                  </div>
                </button>
              );
            })}
          </div>

          {picked && (
            <div className="space-y-3 pt-3 border-t border-white/[0.06]">
              <label className="block">
                <span className="block text-[11.5px] text-white/55 mb-1.5">
                  {lang === "en" ? "Session topic" : "موضوع الجلسة"}
                </span>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  maxLength={200}
                  placeholder={lang === "en" ? "What would you like to discuss?" : "ماذا تريد أن نناقش؟"}
                  className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3.5 py-2.5 text-[13.5px] text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="block text-[11.5px] text-white/55 mb-1.5">
                  {lang === "en" ? "Additional details (optional)" : "تفاصيل إضافيّة (اختياري)"}
                </span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3.5 py-2.5 text-[13.5px] text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none resize-none"
                />
              </label>
              {error && (
                <div className="text-[12.5px] text-red-300">{error}</div>
              )}
              <button
                type="button"
                onClick={book}
                disabled={busy}
                className="w-full py-3 rounded-2xl bg-primary text-white font-bold text-[14px] enabled:hover:-translate-y-px transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {busy ? "…" : (lang === "en" ? "Confirm booking" : "تأكيد الحجز")}
              </button>
              <p className="text-white/40 text-[11px] text-center">
                {lang === "en" ? "Free — confirmation email sent instantly." : "مَجّاني — يَصلك إيميل التأكيد فورًا."}
              </p>
            </div>
          )}
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
      <span className="block text-[11.5px] text-white/50 font-medium mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
