import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import {
  CalendarDays,
  MapPin,
  Video,
  ArrowLeft,
  PartyPopper,
  CheckCircle2,
} from "lucide-react";
import { PageShell, GlassCard, BackLink, EmptyState } from "@/components/shell/PageShell";
import { DetailError } from "@/components/shell/DetailError";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { usePageMeta } from "@/hooks/use-meta";
import {
  VENTURE_STAGE_LABELS,
  formatArabicDateTime,
  type VentureStage,
} from "@/lib/labels";

const VENTURE_STAGE_LABELS_EN: Record<VentureStage, string> = {
  idea: "Idea",
  mvp: "MVP",
  launched: "Launched",
  scaling: "Scaling",
};

// Localised date-time: Arabic-Indic in AR, Western in EN.
function fmtDateTime(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return "";
  return lang === "ar"
    ? formatArabicDateTime(iso)
    : new Date(iso).toLocaleString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}
// Two-digit countdown value (٠٢ / 02).
function pad2(n: number, lang: Lang): string {
  return lang === "ar"
    ? toArabicNum(n).padStart(2, "٠")
    : String(n).padStart(2, "0");
}

interface CohortResp {
  cohort: {
    id: number;
    name: string;
    slug: string;
    summary: string;
    demoDayAt: string | null;
    demoDayLocation: string;
    demoDayUrl: string;
    status: string;
  };
  program: { id: number; title: string };
  ventures: {
    membership: { status: string };
    venture: {
      id: number;
      name: string;
      tagline: string;
      logoUrl: string | null;
      stage: VentureStage;
      sector: string;
    };
  }[];
}

function useCountdown(target: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [target]);
  if (!target) return null;
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return { done: true, d: 0, h: 0, m: 0, s: 0 };
  return {
    done: false,
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff / 3600000) % 24),
    m: Math.floor((diff / 60000) % 60),
    s: Math.floor((diff / 1000) % 60),
  };
}

export default function DemoDay() {
  const { lang, t } = useLanguage();
  const [, params] = useRoute("/cohorts/:slug/demo-day");
  const slug = params?.slug;
  const [data, setData] = useState<CohortResp | null>(null);
  // null = no error; otherwise the ApiError.status (0 for a network error).
  const [errStatus, setErrStatus] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setErrStatus(null);
    api<CohortResp>(`/cohorts/${slug}`)
      .then((r) => !cancelled && setData(r))
      .catch((e) => !cancelled && setErrStatus(e instanceof ApiError ? e.status : 0));
    return () => {
      cancelled = true;
    };
  }, [slug, lang, reloadKey]);

  const cd = useCountdown(data?.cohort.demoDayAt ?? null);

  usePageMeta({
    title: data?.cohort.name ? `Demo Day — ${data.cohort.name}` : "Demo Day",
    description: data?.cohort.summary,
    type: "article",
  });

  if (errStatus !== null && !data) {
    return (
      <PageShell active="cohorts">
        <DetailError
          status={errStatus}
          onRetry={reload}
          backHref="/cohorts"
          backLabel={t({ ar: "عودة للدفعات", en: "Back to cohorts" })}
        />
      </PageShell>
    );
  }
  if (!data) {
    return (
      <PageShell active="cohorts">
        <div className="h-96 rounded-[28px] bg-white/[0.035] border border-border-strong animate-pulse" />
      </PageShell>
    );
  }

  const c = data.cohort;
  const showcased = data.ventures.filter(
    (v) => v.membership.status === "active" || v.membership.status === "graduated",
  );

  return (
    <PageShell active="cohorts">
      <BackLink href={`/cohorts/${c.slug}`} label={c.name} />

      {/* Hero */}
      <GlassCard className="overflow-hidden mb-8">
        <div className="relative px-6 sm:px-10 py-10 sm:py-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/15 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-bold tracking-[0.18em] uppercase bg-primary/15 text-primary border border-primary/30 mb-4">
              <PartyPopper className="w-3.5 h-3.5" /> Demo Day
            </div>
            <h1
              className="font-bold text-foreground leading-tight mb-3"
              style={{ fontSize: "clamp(1.9rem, 5vw, 3rem)" }}
            >
              {t({ ar: "يوم العرض", en: "Demo Day" })} — {c.name}
            </h1>
            {c.summary && (
              <p className="text-muted-foreground text-[14.5px] leading-[1.85] max-w-2xl mx-auto">
                {c.summary}
              </p>
            )}

            {/* Countdown */}
            {cd && !cd.done && (
              <div className="flex items-center justify-center gap-2.5 sm:gap-4 mt-8">
                {[
                  { v: cd.d, l: t({ ar: "يوم", en: "days" }) },
                  { v: cd.h, l: t({ ar: "ساعة", en: "hrs" }) },
                  { v: cd.m, l: t({ ar: "دقيقة", en: "min" }) },
                  { v: cd.s, l: t({ ar: "ثانية", en: "sec" }) },
                ].map((u, i) => (
                  <div
                    key={i}
                    className="min-w-[64px] rounded-2xl bg-surface-2 border border-border-strong px-3 py-3"
                  >
                    <div className="text-foreground font-bold text-[26px] sm:text-[32px] tabular-nums leading-none">
                      {pad2(u.v, lang)}
                    </div>
                    <div className="text-muted-foreground text-[10.5px] mt-1">{u.l}</div>
                  </div>
                ))}
              </div>
            )}
            {cd?.done && (
              <div className="mt-7 text-primary font-bold text-[15px]">
                {t({ ar: "انطلق العرض! 🎉", en: "Demo Day is live! 🎉" })}
              </div>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-[13px] text-fg-secondary">
              {c.demoDayAt && (
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  {fmtDateTime(c.demoDayAt, lang)}
                </span>
              )}
              {c.demoDayLocation && (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {c.demoDayLocation}
                </span>
              )}
              {c.demoDayUrl && (
                <a
                  href={c.demoDayUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline font-semibold"
                >
                  <Video className="w-4 h-4" />{" "}
                  {t({ ar: "بثّ مباشر", en: "Live stream" })}
                </a>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Participating ventures */}
      <div className="mb-8">
        <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-4">
          {t({ ar: "المشاريع العارِضة", en: "Showcasing ventures" })} (
          {num(showcased.length, lang)})
        </div>
        {showcased.length === 0 ? (
          <EmptyState
            title={t({
              ar: "ستُعلن المشاريع قريبًا",
              en: "Ventures announced soon",
            })}
            hint={t({
              ar: "تابعنا لمعرفة فرق هذه الدفعة.",
              en: "Stay tuned to meet this cohort's teams.",
            })}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {showcased.map((row, i) => {
              const v = row.venture;
              return (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    href={`/ventures/${v.id}`}
                    className="group block h-full rounded-2xl p-5 bg-surface-2 border border-border-strong hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {v.logoUrl ? (
                        <img loading="lazy" decoding="async"
                          src={v.logoUrl}
                          alt=""
                          className="w-11 h-11 rounded-xl object-cover border border-border-strong"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-foreground font-bold">
                          {v.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-foreground font-bold text-[15px] truncate">
                          {v.name}
                        </div>
                        <div className="text-primary/80 text-[11px]">
                          {t({
                            ar: VENTURE_STAGE_LABELS[v.stage],
                            en: VENTURE_STAGE_LABELS_EN[v.stage],
                          })}
                          {v.sector ? ` · ${v.sector}` : ""}
                        </div>
                      </div>
                    </div>
                    {v.tagline && (
                      <p className="text-muted-foreground text-[12.5px] leading-[1.7] line-clamp-2">
                        {v.tagline}
                      </p>
                    )}
                    <div className="mt-3 inline-flex items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors text-[12px] font-semibold">
                      {t({ ar: "التفاصيل", en: "Details" })}
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* RSVP */}
      <RsvpForm slug={c.slug} />
    </PageShell>
  );
}

function RsvpForm({ slug }: { slug: string }) {
  const { t } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [attendees, setAttendees] = useState(1);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await api(`/cohorts/${slug}/rsvp`, {
        method: "POST",
        body: JSON.stringify({ fullName, email, attendees, note }),
      });
      setDone(true);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : t({ ar: "تعذّر الإرسال", en: "Couldn't submit" }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inp =
    "w-full rounded-xl bg-surface-2 border border-border-strong px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none";

  return (
    <GlassCard className="p-6 sm:p-8">
      {done ? (
        <div className="text-center py-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <div className="text-foreground font-bold text-[17px] mb-1">
            {t({ ar: "سُجِّل حضورك! 🎉", en: "You're on the list! 🎉" })}
          </div>
          <div className="text-muted-foreground text-[13.5px]">
            {t({
              ar: "نراك في يوم العرض. ستصلك التفاصيل قريبًا.",
              en: "See you at Demo Day. We'll send the details soon.",
            })}
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-foreground font-bold text-[18px] mb-1">
            {t({ ar: "احجز مقعدك في يوم العرض", en: "Reserve your Demo Day seat" })}
          </h2>
          <p className="text-muted-foreground text-[13px] mb-5">
            {t({
              ar: "انضمّ إلينا لتشهد إطلاق مشاريع الدفعة أمام المجتمع والمستثمرين.",
              en: "Join us to watch the cohort's ventures launch before the community and investors.",
            })}
          </p>
          <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t({ ar: "الاسم الكامل", en: "Full name" })}
              aria-label={t({ ar: "الاسم الكامل", en: "Full name" })}
              required
              maxLength={120}
              className={inp}
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t({ ar: "البريد الإلكترونيّ", en: "Email address" })}
              aria-label={t({ ar: "البريد الإلكترونيّ", en: "Email address" })}
              type="email"
              dir="ltr"
              required
              maxLength={160}
              className={inp}
            />
            <label className="block">
              <span className="block mb-1.5 text-[12px] text-muted-foreground font-semibold">
                {t({ ar: "عدد الحضور", en: "Number of attendees" })}
              </span>
              <input
                type="number"
                min={1}
                max={10}
                value={attendees}
                onChange={(e) => setAttendees(Number(e.target.value) || 1)}
                className={`${inp} tabular-nums`}
              />
            </label>
            <label className="block">
              <span className="block mb-1.5 text-[12px] text-muted-foreground font-semibold">
                {t({ ar: "ملاحظة (اختياري)", en: "Note (optional)" })}
              </span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={600}
                className={inp}
              />
            </label>
            {error && (
              <div role="alert" className="sm:col-span-2 text-destructive text-[12.5px]">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="sm:col-span-2 h-12 rounded-full bg-primary text-white font-bold text-[14px] disabled:opacity-50 hover:-translate-y-px transition-transform"
            >
              {submitting
                ? t({ ar: "جارِ الإرسال…", en: "Submitting…" })
                : t({ ar: "أكّد حضوري", en: "Confirm my RSVP" })}
            </button>
          </form>
        </>
      )}
    </GlassCard>
  );
}
