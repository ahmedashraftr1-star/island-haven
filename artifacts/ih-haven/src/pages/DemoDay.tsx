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
import { api, ApiError } from "@/lib/api";
import { usePageMeta } from "@/hooks/use-meta";
import {
  VENTURE_STAGE_LABELS,
  formatArabicDateTime,
  type VentureStage,
} from "@/lib/labels";

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
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
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
  const [, params] = useRoute("/cohorts/:slug/demo-day");
  const slug = params?.slug;
  const [data, setData] = useState<CohortResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    api<CohortResp>(`/cohorts/${slug}`)
      .then((r) => !cancelled && setData(r))
      .catch(
        (e) =>
          !cancelled &&
          setError(e instanceof ApiError ? e.message : "تعذّر التحميل"),
      );
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const cd = useCountdown(data?.cohort.demoDayAt ?? null);

  usePageMeta({
    title: data?.cohort.name ? `Demo Day — ${data.cohort.name}` : "Demo Day",
    description: data?.cohort.summary,
    type: "article",
  });

  if (error && !data) {
    return (
      <PageShell active="cohorts">
        <BackLink href="/cohorts" label="عودة للدفعات" />
        <GlassCard className="p-8 text-center text-red-200">{error}</GlassCard>
      </PageShell>
    );
  }
  if (!data) {
    return (
      <PageShell active="cohorts">
        <div className="h-96 rounded-[28px] bg-white/[0.035] border border-white/10 animate-pulse" />
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
              className="font-bold text-white leading-tight mb-3"
              style={{ fontSize: "clamp(1.9rem, 5vw, 3rem)" }}
            >
              يوم العرض — {c.name}
            </h1>
            {c.summary && (
              <p className="text-white/60 text-[14.5px] leading-[1.85] max-w-2xl mx-auto">
                {c.summary}
              </p>
            )}

            {/* Countdown */}
            {cd && !cd.done && (
              <div className="flex items-center justify-center gap-2.5 sm:gap-4 mt-8">
                {[
                  { v: cd.d, l: "يوم" },
                  { v: cd.h, l: "ساعة" },
                  { v: cd.m, l: "دقيقة" },
                  { v: cd.s, l: "ثانية" },
                ].map((u, i) => (
                  <div
                    key={i}
                    className="min-w-[64px] rounded-2xl bg-white/[0.05] border border-white/10 px-3 py-3"
                  >
                    <div className="text-white font-bold text-[26px] sm:text-[32px] tabular-nums leading-none">
                      {String(u.v).padStart(2, "0")}
                    </div>
                    <div className="text-white/45 text-[10.5px] mt-1">{u.l}</div>
                  </div>
                ))}
              </div>
            )}
            {cd?.done && (
              <div className="mt-7 text-primary font-bold text-[15px]">
                انطلق العرض! 🎉
              </div>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-[13px] text-white/65">
              {c.demoDayAt && (
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  {formatArabicDateTime(c.demoDayAt)}
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
                  <Video className="w-4 h-4" /> بثّ مباشر
                </a>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Participating ventures */}
      <div className="mb-8">
        <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-4">
          المشاريع العارِضة ({showcased.length})
        </div>
        {showcased.length === 0 ? (
          <EmptyState title="ستُعلن المشاريع قريبًا" hint="تابعنا لمعرفة فرق هذه الدفعة." />
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
                    className="group block h-full rounded-2xl p-5 bg-white/[0.04] border border-white/[0.08] hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {v.logoUrl ? (
                        <img
                          src={v.logoUrl}
                          alt=""
                          className="w-11 h-11 rounded-xl object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-white font-bold">
                          {v.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-white font-bold text-[15px] truncate">
                          {v.name}
                        </div>
                        <div className="text-primary/80 text-[11px]">
                          {VENTURE_STAGE_LABELS[v.stage]}
                          {v.sector ? ` · ${v.sector}` : ""}
                        </div>
                      </div>
                    </div>
                    {v.tagline && (
                      <p className="text-white/55 text-[12.5px] leading-[1.7] line-clamp-2">
                        {v.tagline}
                      </p>
                    )}
                    <div className="mt-3 inline-flex items-center gap-1 text-white/45 group-hover:text-primary transition-colors text-[12px] font-semibold">
                      التفاصيل
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
      setError(e instanceof ApiError ? e.message : "تعذّر الإرسال");
    } finally {
      setSubmitting(false);
    }
  }

  const inp =
    "w-full rounded-xl bg-white/[0.05] border border-white/10 px-3.5 py-2.5 text-[13.5px] text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none";

  return (
    <GlassCard className="p-6 sm:p-8">
      {done ? (
        <div className="text-center py-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <div className="text-white font-bold text-[17px] mb-1">
            سُجِّل حضورك! 🎉
          </div>
          <div className="text-white/55 text-[13.5px]">
            نراك في يوم العرض. ستصلك التفاصيل قريبًا.
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-white font-bold text-[18px] mb-1">
            احجز مقعدك في يوم العرض
          </h2>
          <p className="text-white/55 text-[13px] mb-5">
            انضمّ إلينا لتشهد إطلاق مشاريع الدفعة أمام المجتمع والمستثمرين.
          </p>
          <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="الاسم الكامل"
              required
              maxLength={120}
              className={inp}
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكترونيّ"
              type="email"
              dir="ltr"
              required
              maxLength={160}
              className={inp}
            />
            <label className="block">
              <span className="block mb-1.5 text-[12px] text-white/55 font-semibold">
                عدد الحضور
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
              <span className="block mb-1.5 text-[12px] text-white/55 font-semibold">
                ملاحظة (اختياري)
              </span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={600}
                className={inp}
              />
            </label>
            {error && (
              <div className="sm:col-span-2 text-red-300 text-[12.5px]">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="sm:col-span-2 h-12 rounded-full bg-primary text-white font-bold text-[14px] disabled:opacity-50 hover:-translate-y-px transition-transform"
            >
              {submitting ? "جارِ الإرسال…" : "أكّد حضوري"}
            </button>
          </form>
        </>
      )}
    </GlassCard>
  );
}
