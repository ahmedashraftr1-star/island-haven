import { useCallback, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { GROUPS, ALL_SEATS, SEAT_IDS, DECOR, toArDigits, TOTAL_SEATS as TOTAL } from "./hall-plan";

/**
 * SeatMap — an interactive plan of the Island Haven hall for /book.
 *
 * The hall geometry lives in `./hall-plan` (the ONE source of truth, shared with
 * the read-only homepage `SeatMapPreview` so the two can never drift). The floor
 * (tables, side rooms, the lounge couch) is drawn in one SVG; the 38 seats are
 * real <button>s positioned over it, so each is fully keyboard- and
 * screen-reader-native (SVG role="button" can't match a real button's support).
 * A parallel <ul> of seats renders on narrow phones (and is the natural
 * screen-reader path) so the plan degrades to a list without losing anything.
 *
 * Occupancy is honest: `takenSeats` are the REAL reserved seat numbers for the
 * chosen date+slot (from /bookings/availability, the same figure the homepage
 * board uses) — never a fabricated per-seat claim. The chosen seat is a
 * preference carried with the booking — no schema change, no seq/hash impact.
 */

export function SeatMap({
  takenSeats,
  selected,
  onSelect,
}: {
  /** REAL reserved seat numbers for the chosen date+slot (from the API). */
  takenSeats: number[];
  selected: number | null;
  onSelect: (seat: number) => void;
}) {
  const { t, lang, dir } = useLanguage();
  const [focusId, setFocusId] = useState<number>(() => selected ?? SEAT_IDS[0]);
  const btnRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  const reserved = useMemo(() => new Set(takenSeats), [takenSeats]);

  const seatLabel = useCallback(
    (id: number, state: "available" | "reserved" | "selected") => {
      const num = lang === "ar" ? toArDigits(id) : String(id);
      const stateWord =
        state === "selected"
          ? { ar: "مختار", en: "selected" }
          : state === "reserved"
            ? { ar: "محجوز", en: "reserved" }
            : { ar: "متاح", en: "available" };
      return lang === "ar" ? `مقعد ${num} — ${stateWord.ar}` : `Seat ${num} — ${stateWord.en}`;
    },
    [lang],
  );

  const stateOf = (id: number): "available" | "reserved" | "selected" =>
    selected === id ? "selected" : reserved.has(id) ? "reserved" : "available";

  const moveFocus = useCallback(
    (from: number, delta: number) => {
      const idx = SEAT_IDS.indexOf(from);
      const next = SEAT_IDS[(idx + delta + SEAT_IDS.length) % SEAT_IDS.length];
      setFocusId(next);
      btnRefs.current[next]?.focus();
    },
    [],
  );

  const onKey = (e: React.KeyboardEvent, id: number) => {
    // In RTL, ArrowRight moves toward earlier seats (visually leftward numbering).
    const rtl = dir === "rtl";
    if (e.key === "ArrowRight") { e.preventDefault(); moveFocus(id, rtl ? -1 : 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); moveFocus(id, rtl ? 1 : -1); }
    else if (e.key === "ArrowDown") { e.preventDefault(); moveFocus(id, 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); moveFocus(id, -1); }
    else if (e.key === "Home") { e.preventDefault(); setFocusId(SEAT_IDS[0]); btnRefs.current[SEAT_IDS[0]]?.focus(); }
    else if (e.key === "End") { e.preventDefault(); const last = SEAT_IDS[SEAT_IDS.length - 1]; setFocusId(last); btnRefs.current[last]?.focus(); }
  };

  const pick = (id: number) => {
    if (reserved.has(id)) return;
    onSelect(id);
    setFocusId(id);
  };

  const freeCount = TOTAL - reserved.size;

  return (
    <div>
      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px] text-fg-secondary">
        <Legend swatch="bg-white/[0.06] ring-1 ring-inset ring-white/25" label={t({ ar: "متاح", en: "Available" })} />
        <Legend swatch="bg-[#DDBD7E] ring-1 ring-inset ring-[#DDBD7E]" label={t({ ar: "مختار", en: "Selected" })} />
        <Legend swatch="bg-primary/25 ring-1 ring-inset ring-primary/40" label={t({ ar: "محجوز", en: "Reserved" })} />
        <span className="ms-auto font-mono tabular-nums text-fg-faint">
          {t({ ar: `${toArDigits(freeCount)} من ${toArDigits(TOTAL)} متاح`, en: `${freeCount} of ${TOTAL} free` })}
        </span>
      </div>

      {/* ── SVG floor plan + button seats (sm and up) ── */}
      <div
        className="relative hidden w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] sm:block"
        style={{ aspectRatio: "100 / 104" }}
        role="group"
        aria-label={t({ ar: "خريطة مقاعد القاعة", en: "Hall seat map" })}
      >
        <svg viewBox="0 0 100 104" className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="none">
          {DECOR.rooms.map((r, i) => (
            <g key={`room-${i}`}>
              <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="1.5" fill="hsl(0 0% 100% / 0.02)" stroke="hsl(0 0% 100% / 0.12)" strokeWidth="0.25" strokeDasharray="1.5 1" />
            </g>
          ))}
          <rect x={DECOR.couch.x} y={DECOR.couch.y} width={DECOR.couch.w} height={DECOR.couch.h} rx="2.5" fill="hsl(0 0% 100% / 0.04)" stroke="hsl(0 0% 100% / 0.14)" strokeWidth="0.25" />
          {GROUPS.flatMap((g) =>
            g.tables.map((tb, i) => (
              <rect key={`${g.key}-t${i}`} x={tb.x} y={tb.y} width={tb.w} height={tb.h} rx={tb.rx ?? 2} fill="hsl(24 30% 20% / 0.35)" stroke="hsl(38 40% 60% / 0.22)" strokeWidth="0.25" />
            )),
          )}
        </svg>
        {/* decorative labels (aria-hidden container above) */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {DECOR.rooms.map((r, i) => (
            <span key={i} className="absolute -translate-x-1/2 -translate-y-1/2 font-mono text-[9px] uppercase tracking-wide text-white/30"
              style={{ left: `${r.x + r.w / 2}%`, top: `${r.y + r.h / 2}%` }}>{t(r.label)}</span>
          ))}
          <span className="absolute -translate-x-1/2 -translate-y-1/2 font-mono text-[9px] uppercase tracking-wide text-white/30"
            style={{ left: `${DECOR.couch.x + DECOR.couch.w / 2}%`, top: `${DECOR.couch.y + DECOR.couch.h / 2}%` }}>{t(DECOR.couch.label)}</span>
        </div>

        {ALL_SEATS.map((s) => {
          const st = stateOf(s.id);
          const isReserved = st === "reserved";
          const isSelected = st === "selected";
          return (
            <button
              key={s.id}
              ref={(el) => { btnRefs.current[s.id] = el; }}
              type="button"
              onClick={() => pick(s.id)}
              onKeyDown={(e) => onKey(e, s.id)}
              onFocus={() => setFocusId(s.id)}
              tabIndex={focusId === s.id ? 0 : -1}
              aria-label={seatLabel(s.id, st)}
              aria-pressed={isSelected}
              aria-disabled={isReserved || undefined}
              data-seat={s.id}
              className={[
                "absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-md font-mono tabular-nums transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DDBD7E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0f]",
                "h-[5.5%] min-h-[26px] w-[5.5%] min-w-[26px] text-[10px]",
                isSelected
                  ? "bg-[#DDBD7E] font-bold text-[#1a1206] shadow-[0_2px_10px_-2px_rgba(221,189,126,0.7)]"
                  : isReserved
                    ? "cursor-not-allowed bg-primary/20 text-white/40 ring-1 ring-inset ring-primary/40"
                    : "bg-white/[0.06] text-white/80 ring-1 ring-inset ring-white/25 hover:bg-white/[0.14] hover:ring-white/50 motion-safe:hover:scale-110",
              ].join(" ")}
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
            >
              {lang === "ar" ? toArDigits(s.id) : s.id}
            </button>
          );
        })}
      </div>

      {/* ── List fallback (phones / the natural screen-reader path) ── */}
      <div className="sm:hidden">
        <p className="mb-2 text-[12px] text-fg-secondary">{t({ ar: "اختر مقعدك:", en: "Choose your seat:" })}</p>
        <ul className="grid grid-cols-5 gap-2" aria-label={t({ ar: "قائمة المقاعد", en: "Seat list" })}>
          {SEAT_IDS.map((id) => {
            const st = stateOf(id);
            const isReserved = st === "reserved";
            const isSelected = st === "selected";
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => pick(id)}
                  aria-label={seatLabel(id, st)}
                  aria-pressed={isSelected}
                  aria-disabled={isReserved || undefined}
                  className={[
                    "flex h-11 w-full items-center justify-center rounded-lg font-mono tabular-nums text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DDBD7E]",
                    isSelected
                      ? "bg-[#DDBD7E] font-bold text-[#1a1206]"
                      : isReserved
                        ? "cursor-not-allowed bg-primary/15 text-white/35 ring-1 ring-inset ring-primary/30"
                        : "bg-white/[0.06] text-white/85 ring-1 ring-inset ring-white/20 active:bg-white/15",
                  ].join(" ")}
                >
                  {lang === "ar" ? toArDigits(id) : id}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Live status for screen readers */}
      <p className="sr-only" role="status" aria-live="polite">
        {selected
          ? t({ ar: `اخترت المقعد ${toArDigits(selected)}`, en: `Seat ${selected} selected` })
          : t({ ar: "لم تختر مقعدًا بعد", en: "No seat selected yet" })}
      </p>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={`inline-block h-3 w-3 rounded ${swatch}`} />
      {label}
    </span>
  );
}
