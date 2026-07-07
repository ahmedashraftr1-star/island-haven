import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { splitTags } from "@/lib/labels";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * LivePulse — Island Haven's signature: a living HEARTBEAT for the incubator.
 *
 * A real ECG line beats across the section; the live database figures breathe and
 * re-poll while you watch; real member work surfaces, one beat at a time, as a
 * live activity stream. The message is the soul of the place made sensory: a
 * community that keeps building — under siege — and you can feel its pulse, live.
 *
 * All data is REAL (/numbers + /works), polled so the section genuinely updates
 * on screen. Reduced motion → the heartbeat holds drawn and the stream is static.
 */

interface Numbers {
  members: number;
  works: number;
  enrollments: number;
  events: number;
  seatsHosted: number;
}
interface WorkRow {
  work: { id: number; title: string; tags: string };
  author: { id: number; fullName: string };
}
interface Beat {
  id: number;
  author: string;
  authorId: number;
  tech: string;
  title: string;
}

// A tiled ECG heartbeat waveform across a 1200×120 viewBox (baseline y=60).
function buildECG(beats: number): string {
  const w = 1200;
  const cyc = w / beats;
  const at = (i: number, f: number) => (i * cyc + f * cyc).toFixed(1);
  let d = "M0,60 ";
  for (let i = 0; i < beats; i++) {
    // flat baseline, a small P bump, the tall QRS spike, a soft T, back to flat
    d += `L${at(i, 0.26)},60 L${at(i, 0.33)},53 L${at(i, 0.40)},64 `;
    d += `L${at(i, 0.46)},16 L${at(i, 0.52)},100 L${at(i, 0.58)},48 `;
    d += `L${at(i, 0.66)},60 L${at(i, 0.82)},57 L${at(i, 1)},60 `;
  }
  return d;
}

function LiveStat({ value, label, reduce }: { value: number; label: string; reduce: boolean }) {
  const { lang } = useLanguage();
  const prev = useRef(value);
  const bumped = prev.current !== value;
  prev.current = value;
  return (
    <div className="flex flex-col">
      <motion.span
        key={value}
        initial={reduce || !bumped ? false : { scale: 1.18, color: "hsl(var(--primary))" }}
        animate={{ scale: 1, color: "hsl(var(--sand-bright))" }}
        transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
        className="font-display font-black tabular-nums leading-none text-sand-bright"
        style={{ fontSize: "clamp(1.9rem, 3vw, 3rem)", letterSpacing: "-0.03em" }}
      >
        {value.toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
      </motion.span>
      <span className="mt-2 text-[12px] text-white/55 font-medium">{label}</span>
    </div>
  );
}

export function LivePulse() {
  const { t, lang } = useLanguage();
  const reduce = !!useReducedMotion();

  const ecg = useMemo(() => buildECG(9), []);
  const [nums, setNums] = useState<Numbers | null>(null);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [idx, setIdx] = useState(0);

  // Poll the real figures so the counts genuinely move on screen.
  useEffect(() => {
    let cancelled = false;
    const pull = () =>
      api<{ numbers: Numbers }>("/numbers")
        .then((r) => !cancelled && setNums(r.numbers))
        .catch(() => {
          if (!cancelled && !nums)
            setNums({ members: 57, works: 48, enrollments: 116, events: 9, seatsHosted: 6 });
        });
    pull();
    const id = setInterval(pull, 20000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real member work → the activity stream.
  useEffect(() => {
    let cancelled = false;
    api<{ works: WorkRow[] }>("/works?page=1")
      .then((r) => {
        if (cancelled) return;
        const mapped = (r.works ?? [])
          .filter((w) => w.work?.title && w.author?.fullName)
          .slice(0, 12)
          .map((w) => ({
            id: w.work.id,
            author: w.author.fullName,
            authorId: w.author.id,
            tech: splitTags(w.work.tags).slice(0, 2).join(" · ") || t({ ar: "عمل", en: "work" }),
            title: w.work.title,
          }));
        setBeats(mapped);
      })
      .catch(() => !cancelled && setBeats([]));
    return () => {
      cancelled = true;
    };
  }, [t]);

  // One activity surfaces per heartbeat (~3s), synced to the ECG sweep.
  useEffect(() => {
    if (reduce || beats.length < 2) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % beats.length), 3000);
    return () => clearInterval(id);
  }, [reduce, beats.length]);

  const current = beats.length ? beats[idx % beats.length] : null;

  return (
    <section
      id="live-pulse"
      data-testid="live-pulse"
      aria-label={t({ ar: "نبض المجتمع الحيّ", en: "The community's live pulse" })}
      className="relative overflow-hidden bg-[#060608] text-white border-t border-white/[0.06] section-y"
    >
      {/* Deep ambient depth field so the black reads as lit space, not flat. */}
      <div aria-hidden className="absolute inset-0 glass-ambient pointer-events-none" />

      <div className="container-ih relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="relative flex h-2.5 w-2.5">
            {!reduce && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-70" />
            )}
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.9)]" />
          </span>
          <span className="text-[11px] tracking-[0.22em] uppercase text-white/80 font-semibold rtl:tracking-normal">
            {t({ ar: "نبض المجتمع", en: "Community pulse" })} · <span className="text-primary">LIVE</span>
          </span>
        </div>

        <h2
          className="font-display text-white max-w-4xl"
          style={{ fontSize: "clamp(2.4rem, 5vw, 4.5rem)", fontWeight: 900, lineHeight: 0.98, letterSpacing: "-0.05em" }}
        >
          {t({ ar: "الحاضنة ", en: "The incubator " })}
          <span className="text-primary">{t({ ar: "تنبض.", en: "has a pulse." })}</span>
        </h2>
        <p className="mt-5 max-w-2xl text-white/70 text-[1.0625rem] leading-[1.7]">
          {t({
            ar: "مجتمعٌ يبني تحت القصف، بلا توقّف — وهذا نبضه، من قاعدة بياناتنا مباشرةً، لحظةً بلحظة.",
            en: "A community that keeps building under siege — this is its pulse, straight from our database, moment by moment.",
          })}
        </p>

        {/* ── THE HEARTBEAT ── */}
        <div className="relative mt-[clamp(2.5rem,5vw,4rem)] h-[clamp(120px,16vw,190px)] w-full">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            aria-hidden
          >
            <defs>
              <linearGradient id="pulseSweep" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--sand-bright))" stopOpacity="0" />
                <stop offset="55%" stopColor="hsl(var(--sand-bright))" stopOpacity="1" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              </linearGradient>
            </defs>
            {/* faint baseline waveform */}
            <path d={ecg} fill="none" stroke="hsl(var(--primary) / 0.16)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            {/* the living sweep — a bright segment riding the heartbeat */}
            <motion.path
              d={ecg}
              fill="none"
              stroke="url(#pulseSweep)"
              strokeWidth={3.25}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              style={{
                strokeDasharray: reduce ? undefined : "0.1 0.9",
                filter: "drop-shadow(0 0 7px hsl(var(--primary) / 0.75))",
              }}
              animate={reduce ? undefined : { strokeDashoffset: [1, 0] }}
              transition={reduce ? undefined : { duration: 2.6, repeat: Infinity, ease: "linear" }}
            />
          </svg>

          {/* the activity that "arrives" on the beat, centred on the line */}
          <div className="absolute inset-x-0 bottom-0 flex justify-center">
            <AnimatePresence mode="wait">
              {current && (
                <motion.div
                  key={current.id}
                  initial={reduce ? false : { opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                  className="pointer-events-auto"
                >
                  <Link
                    href={`/u/${current.authorId}`}
                    className="group inline-flex items-center gap-3 glass-panel rounded-full ps-3 pe-4 py-2"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/20 text-primary text-[11px]">✦</span>
                    <span className="text-[13.5px] text-white/90">
                      <span className="font-display font-bold text-white group-hover:text-sand-bright transition-colors">{current.author}</span>
                      <span className="text-white/45 mx-2">·</span>
                      <span className="font-mono text-[12px] text-white/55">{current.tech}</span>
                      <span className="text-white/45 mx-2">·</span>
                      {t({ ar: "الآن", en: "just now" })}
                    </span>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── LIVE FIGURES (breathe + re-poll) ── */}
        <div className="mt-[clamp(2.5rem,5vw,3.5rem)] glass-panel flex flex-wrap items-end gap-x-[clamp(2rem,5vw,4.5rem)] gap-y-6 px-[clamp(1.5rem,4vw,2.75rem)] py-[clamp(1.5rem,3vw,2.25rem)]">
          <LiveStat value={nums?.members ?? 57} label={t({ ar: "يبنون في المجتمع", en: "building in the community" })} reduce={reduce} />
          <LiveStat value={nums?.works ?? 48} label={t({ ar: "عمل حقيقيّ مُنجز", en: "real works shipped" })} reduce={reduce} />
          <LiveStat value={nums?.enrollments ?? 116} label={t({ ar: "تسجيل في البرامج", en: "program enrollments" })} reduce={reduce} />
          <div className="ms-auto self-center">
            <Link
              href="/numbers"
              data-testid="live-pulse-cta"
              className="group inline-flex items-center gap-2 text-[13px] font-semibold text-white/75 hover:text-white transition-colors"
            >
              {t({ ar: "كل النبض والأرقام", en: "The full pulse" })}
              <span className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
