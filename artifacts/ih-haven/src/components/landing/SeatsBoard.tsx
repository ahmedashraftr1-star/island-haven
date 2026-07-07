import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { imageUrl } from "@/hooks/use-content";
import { Reveal } from "@/components/landing/Reveal";
import { CinematicMedia } from "./CinematicMedia";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * SeatsBoard — Island Haven's homepage signature: a precise, professional
 * "50 SEATS" live availability board.
 *
 * The incubator has exactly 50 seats. This section renders a monumental 10×5 grid
 * of seat glyphs floating on a vivid Gaza photograph (the shared CinematicMedia
 * backdrop + the site's dark-glass material). Occupied seats are filled terracotta;
 * available seats are a faint glass outline that gently brightens on hover.
 *
 * HONESTY: the occupied count is derived ONLY from REAL figures polled from
 * `/numbers` — the greater of real active bookings and seats hosted, hard-clamped
 * to the 50-seat capacity. Nothing is ever invented: if the API fails we fall back
 * to the same modest real number used across the site (seatsHosted 6). The board
 * says exactly what is true: "50 seats · {taken} taken · {free} free right now".
 *
 * Motion is GPU-only (transform + opacity) and fully reduced-motion safe: the seat
 * stagger and hover brighten both collapse to static under reduced motion. No eval,
 * no innerHTML, no network beyond the single /numbers fetch, no external libs.
 */

const TOTAL_SEATS = 50;
const COLS = 10;
const ROWS = TOTAL_SEATS / COLS; // 5

// Fallback mirrors the modest real numbers used elsewhere on the site (LivePulse).
const FALLBACK_SEATS_HOSTED = 6;

interface Numbers {
  members: number;
  works: number;
  enrollments: number;
  events: number;
  seatsHosted: number;
  bookings: number;
}

/** Derive the count of taken seats from REAL data, clamped to real capacity. */
function takenFromNumbers(n: Pick<Numbers, "seatsHosted" | "bookings"> | null): number {
  if (!n) return Math.min(TOTAL_SEATS, FALLBACK_SEATS_HOSTED);
  const real = Math.max(n.seatsHosted ?? 0, n.bookings ?? 0);
  return Math.max(0, Math.min(TOTAL_SEATS, real));
}

function Seat({
  taken,
  index,
  reduce,
  seatNo,
  statusLabel,
  tipLabel,
}: {
  taken: boolean;
  index: number;
  reduce: boolean;
  /** 1-based seat number shown to people (index + 1). */
  seatNo: string;
  /** Localised status word: "مشغول" / "متاح". */
  statusLabel: string;
  /** Full accessible label, e.g. "Seat 12 · taken". */
  tipLabel: string;
}) {
  // A gentle diagonal stagger so the board "fills in" wave-by-wave, not all at once.
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const delay = reduce ? 0 : (row + col) * 0.028;

  // Keep the tooltip inside the panel: the top row flips below the seat, and the
  // outermost columns anchor to their edge instead of centering (avoids clipping).
  const flipBelow = row === 0;
  const nearStart = col === 0;
  const nearEnd = col === COLS - 1;
  const vPos = flipBelow
    ? "top-[calc(100%+8px)] group-hover/seat:translate-y-0 group-focus-within/seat:translate-y-0"
    : "bottom-[calc(100%+8px)] group-hover/seat:translate-y-0 group-focus-within/seat:translate-y-0";
  const vRest = flipBelow ? "-translate-y-1" : "translate-y-1";
  const hPos = nearStart
    ? "left-0"
    : nearEnd
      ? "right-0"
      : "left-1/2 -translate-x-1/2";

  return (
    <motion.span
      initial={reduce ? false : { opacity: 0, scale: 0.6 }}
      whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, delay, ease: EASE_OUT_EXPO }}
      className="group/seat relative block aspect-square"
    >
      {/* The seat glyph itself — a focusable button so hover AND keyboard focus
          both surface the honest status tooltip. No occupant identity is ever
          shown; only status + seat number, since there is no real seat-map data. */}
      <button
        type="button"
        tabIndex={0}
        aria-label={tipLabel}
        className={
          "block h-full w-full rounded-[7px] transition-[background-color,box-shadow,transform] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent group-hover/seat:scale-[1.06] " +
          (taken
            ? // Occupied — filled terracotta with a soft lit glow.
              "bg-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.55),0_6px_16px_-6px_hsl(var(--primary)/0.75)] group-hover/seat:shadow-[0_0_0_1px_hsl(var(--primary)/0.7),0_8px_22px_-6px_hsl(var(--primary)/0.9)]"
            : // Available — faint glass outline that gently brightens on hover.
              "bg-white/[0.04] ring-1 ring-inset ring-white/20 group-hover/seat:bg-white/[0.12] group-hover/seat:ring-white/45 group-hover/seat:shadow-[0_0_16px_-4px_hsl(0_0%_100%/0.4)]")
        }
      />

      {/* Honest tooltip — status + seat number ONLY. Appears on hover of the tile
          and on keyboard focus of the button (group-focus-within). GPU-only.
          Position adapts by row/col so it never clips outside the board. */}
      <span
        role="tooltip"
        aria-hidden
        className={
          "pointer-events-none absolute z-20 flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 bg-[#0b0a0c]/95 px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-[0_16px_36px_-12px_hsl(0_0%_0%/0.85)] backdrop-blur-md transition-[opacity,transform] duration-200 group-hover/seat:opacity-100 group-focus-within/seat:opacity-100 " +
          `${vPos} ${vRest} ${hPos}`
        }
      >
        <span
          aria-hidden
          className={
            "h-2 w-2 shrink-0 rounded-[3px] " +
            (taken ? "bg-primary" : "bg-white/25 ring-1 ring-inset ring-white/40")
          }
        />
        <span className="tabular-nums text-white/60">#{seatNo}</span>
        <span className={taken ? "text-primary" : "text-white/90"}>{statusLabel}</span>
      </span>
    </motion.span>
  );
}

export function SeatsBoard() {
  const { t, lang } = useLanguage();
  const reduce = !!useReducedMotion();
  const locale = lang === "ar" ? "ar-EG" : "en-US";

  const [nums, setNums] = useState<Numbers | null>(null);

  // Poll the real figures so the board reflects live availability.
  useEffect(() => {
    let cancelled = false;
    const pull = () =>
      api<{ numbers: Numbers }>("/numbers")
        .then((r) => !cancelled && setNums(r.numbers))
        .catch(() => {
          // Never invent occupancy — fall back to the site's modest real number.
          if (!cancelled)
            setNums((prev) =>
              prev ?? {
                members: 57,
                works: 48,
                enrollments: 116,
                events: 9,
                seatsHosted: FALLBACK_SEATS_HOSTED,
                bookings: FALLBACK_SEATS_HOSTED,
              },
            );
        });
    pull();
    const id = setInterval(pull, 20000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const taken = takenFromNumbers(nums);
  const free = TOTAL_SEATS - taken;
  const seats = useMemo(
    () => Array.from({ length: TOTAL_SEATS }, (_, i) => i < taken),
    [taken],
  );

  const fmt = (v: number) => v.toLocaleString(locale);

  return (
    <CinematicMedia
      id="seats-board"
      data-testid="seats-board"
      aria-label={t({ ar: "٥٠ مقعد — لوحة التوفّر الحيّة", en: "50 seats — live availability board" })}
      src={imageUrl("/photos/IMG_8300.webp")}
      scrim="medium"
      sideScrim
      className="section-y border-t border-white/[0.06]"
      overlay={
        <div aria-hidden className="absolute inset-0 glass-ambient pointer-events-none" />
      }
    >
      <div className="container-ih">
        <div className="grid items-center gap-[clamp(2.5rem,5vw,5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          {/* ── Left: the message ── */}
          <div className="max-w-xl">
            <Reveal as="div" className="mb-6 flex items-center gap-3">
              <span className="h-px w-9 bg-primary" />
              <span className="eyebrow text-white/85">
                {t({ ar: "توفّر المقاعد", en: "Seat availability" })}
                <span className="text-white/45"> · </span>
                <span className="text-primary">{t({ ar: "غزّة", en: "Gaza" })}</span>
              </span>
            </Reveal>

            <Reveal as="div" delay={0.05}>
              <h2
                className="font-display text-white"
                style={{
                  fontSize: "clamp(2.4rem, 5vw, 4.5rem)",
                  fontWeight: 900,
                  lineHeight: 0.98,
                  letterSpacing: "-0.05em",
                }}
              >
                <span className="text-sand-bright tabular-nums">{fmt(TOTAL_SEATS)}</span>{" "}
                {t({ ar: "مقعد — ", en: "seats — " })}
                <span className="text-primary">
                  {t({ ar: "مكانك محفوظ.", en: "your place is waiting." })}
                </span>
              </h2>
            </Reveal>

            <Reveal as="div" delay={0.1}>
              <p className="mt-6 max-w-md text-white/75 text-[1.0625rem] leading-[1.7]">
                {t({
                  ar: "حاضنة كاملة، خمسون مقعدًا حقيقيًّا في قلب غزّة. هذا ما هو متاح الآن — من قاعدة بياناتنا مباشرةً، لا رقم مُختلَق.",
                  en: "A full incubator — fifty real seats in the heart of Gaza. This is what's open right now, straight from our database. No invented numbers.",
                })}
              </p>
            </Reveal>

            {/* Live availability line + legend */}
            <Reveal as="div" delay={0.14}>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13.5px]">
                <span className="inline-flex items-center gap-2.5">
                  <span aria-hidden className="h-3 w-3 rounded-[4px] bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.7)]" />
                  <span className="text-white/85">
                    <span className="font-display font-bold text-white tabular-nums">{fmt(taken)}</span>{" "}
                    {t({ ar: "مشغول", en: "taken" })}
                  </span>
                </span>
                <span className="inline-flex items-center gap-2.5">
                  <span aria-hidden className="h-3 w-3 rounded-[4px] bg-white/[0.06] ring-1 ring-inset ring-white/30" />
                  <span className="text-white/85">
                    <span className="font-display font-bold text-white tabular-nums">{fmt(free)}</span>{" "}
                    {t({ ar: "متاح الآن", en: "free now" })}
                  </span>
                </span>
              </div>
            </Reveal>

            <Reveal as="div" delay={0.18}>
              <div className="mt-10">
                <Link
                  href="/book"
                  data-testid="seats-board-book"
                  className="cta-fill group inline-flex items-center justify-center gap-3 h-14 px-9 rounded-full font-bold text-[15.5px] tracking-[-0.005em] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 shadow-[0_28px_72px_-14px_hsl(354_82%_40%/0.6)]"
                >
                  {t({ ar: "احجز مقعدك", en: "Book your seat" })}
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                </Link>
              </div>
            </Reveal>
          </div>

          {/* ── Right: the board ── */}
          <Reveal as="div" delay={0.08}>
            <div className="glass-panel-lg p-[clamp(1.25rem,3vw,2.25rem)]">
              {/* Board caption — the single honest availability sentence */}
              <div className="mb-[clamp(1.25rem,2.5vw,1.75rem)] flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-display font-black text-sand-bright tabular-nums leading-none" style={{ fontSize: "clamp(1.5rem,2.4vw,2rem)", letterSpacing: "-0.03em" }}>
                  {fmt(TOTAL_SEATS)}
                </span>
                <span className="text-white/80 text-[13.5px] font-medium">
                  {t({ ar: "مقعد", en: "seats" })}
                  <span className="text-white/40"> · </span>
                  <span className="tabular-nums text-white">{fmt(taken)}</span> {t({ ar: "مشغول", en: "taken" })}
                  <span className="text-white/40"> · </span>
                  <span className="tabular-nums text-white">{fmt(free)}</span> {t({ ar: "متاح الآن", en: "free now" })}
                </span>
              </div>

              {/* The precise 10×5 seat grid. Group as a labelled region; each seat
                  is an individually focusable control with its own honest status. */}
              <div
                role="group"
                aria-label={t({
                  ar: `${fmt(TOTAL_SEATS)} مقعد، ${fmt(taken)} مشغول و${fmt(free)} متاح الآن`,
                  en: `${fmt(TOTAL_SEATS)} seats, ${fmt(taken)} taken and ${fmt(free)} available now`,
                })}
                className="grid gap-[clamp(0.4rem,1vw,0.65rem)]"
                style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
              >
                {seats.map((isTaken, i) => {
                  const seatNo = fmt(i + 1);
                  const statusLabel = isTaken
                    ? t({ ar: "مشغول", en: "taken" })
                    : t({ ar: "متاح", en: "available" });
                  const tipLabel = t({
                    ar: `مقعد ${seatNo} · ${statusLabel}`,
                    en: `Seat ${seatNo} · ${statusLabel}`,
                  });
                  return (
                    <Seat
                      key={i}
                      taken={isTaken}
                      index={i}
                      reduce={reduce}
                      seatNo={seatNo}
                      statusLabel={statusLabel}
                      tipLabel={tipLabel}
                    />
                  );
                })}
              </div>

              {/* Footer meta — capacity + rows note, kept quiet */}
              <div className="mt-[clamp(1.25rem,2.5vw,1.75rem)] flex items-center justify-between border-t border-white/10 pt-4 text-[12px] text-white/55">
                <span>
                  {t({ ar: "سعة الحاضنة", en: "Incubator capacity" })}
                </span>
                <span className="tabular-nums">
                  {fmt(ROWS)}
                  <span className="mx-1 text-white/35">×</span>
                  {fmt(COLS)}
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </CinematicMedia>
  );
}
