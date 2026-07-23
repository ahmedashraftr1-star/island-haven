import { useCallback, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * SeatMap — an interactive plan of the Island Haven hall for /book.
 *
 * The floor (tables, side rooms, the lounge couch) is drawn in one SVG; the 38
 * seats are real <button>s positioned over it, so each is fully keyboard- and
 * screen-reader-native (SVG role="button" can't match a real button's support).
 * A parallel <ul> of seats renders on narrow phones (and is the natural
 * screen-reader path) so the plan degrades to a list without losing anything.
 *
 * Occupancy is honest: `reservedCount` is the REAL taken count for the chosen
 * date+slot (from /bookings/availability, the same figure the homepage board
 * uses); we mark that many seats along a fixed fill order so the picture is
 * stable per count, never a fabricated per-seat claim. The chosen seat is a
 * preference carried with the booking — no schema change, no seq/hash impact.
 */

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toArDigits = (n: number) => String(n).replace(/\d/g, (d) => AR_DIGITS[+d]);

export interface SeatGroup {
  key: string;
  label: { ar: string; en: string };
  /** table rectangles (in the 0..100 × 0..76 plan space) */
  tables: { x: number; y: number; w: number; h: number; rx?: number }[];
  seats: { id: number; x: number; y: number }[];
}

// A 4-seat pod: a table centred at (cx,cy) with two seats above and two below.
function pod(ids: [number, number, number, number], cx: number, cy: number) {
  const tables = [{ x: cx - 8, y: cy - 4.5, w: 16, h: 9, rx: 2 }];
  const seats = [
    { id: ids[0], x: cx - 5.5, y: cy - 9 },
    { id: ids[1], x: cx + 5.5, y: cy - 9 },
    { id: ids[2], x: cx - 5.5, y: cy + 9 },
    { id: ids[3], x: cx + 5.5, y: cy + 9 },
  ];
  return { tables, seats };
}

// ── The hall (plan space 0..100 wide × 0..104 tall) ─────────────────────────
// Top band: the window row (1–8), the meeting table (9–12) and the quiet corner
// (13–14). Two clean pod rows below carry 15–38. The owner's floor diagram is
// the source of truth for exact placement — this mirrors its groups.
const GROUPS: SeatGroup[] = [
  {
    key: "row",
    label: { ar: "صفّ النوافذ", en: "Window row" },
    tables: [{ x: 9, y: 10, w: 32, h: 8, rx: 2 }],
    seats: [
      { id: 1, x: 13, y: 5.5 }, { id: 2, x: 22, y: 5.5 }, { id: 3, x: 31, y: 5.5 }, { id: 4, x: 40, y: 5.5 },
      { id: 5, x: 13, y: 22 }, { id: 6, x: 22, y: 22 }, { id: 7, x: 31, y: 22 }, { id: 8, x: 40, y: 22 },
    ],
  },
  {
    key: "meeting",
    label: { ar: "طاولة الاجتماع", en: "Meeting table" },
    tables: [{ x: 60, y: 9, w: 22, h: 10, rx: 5 }],
    seats: [
      { id: 9, x: 65, y: 5.5 }, { id: 10, x: 77, y: 5.5 },
      { id: 11, x: 65, y: 22 }, { id: 12, x: 77, y: 22 },
    ],
  },
  {
    key: "lounge",
    label: { ar: "الركن الهادئ", en: "Quiet corner" },
    tables: [{ x: 49, y: 9, w: 4, h: 10, rx: 2 }],
    seats: [{ id: 13, x: 51, y: 5.5 }, { id: 14, x: 51, y: 22 }],
  },
  { key: "p1", label: { ar: "بود ١", en: "Pod 1" }, ...pod([15, 16, 17, 18], 20, 46) },
  { key: "p2", label: { ar: "بود ٢", en: "Pod 2" }, ...pod([19, 20, 21, 22], 50, 46) },
  { key: "p3", label: { ar: "بود ٣", en: "Pod 3" }, ...pod([23, 24, 25, 26], 80, 46) },
  { key: "p4", label: { ar: "بود ٤", en: "Pod 4" }, ...pod([27, 28, 29, 30], 20, 76) },
  { key: "p5", label: { ar: "بود ٥", en: "Pod 5" }, ...pod([31, 32, 33, 34], 50, 76) },
  { key: "p6", label: { ar: "بود ٦", en: "Pod 6" }, ...pod([35, 36, 37, 38], 80, 76) },
];

const ALL_SEATS = GROUPS.flatMap((g) => g.seats.map((s) => ({ ...s, group: g.key })));
const SEAT_IDS = ALL_SEATS.map((s) => s.id).sort((a, b) => a - b);
const TOTAL = ALL_SEATS.length; // 38

// A fixed, scattered fill order so a given occupancy count always shades the
// SAME seats (stable, not random) yet looks organic rather than "1..N".
const FILL_ORDER = [
  20, 3, 24, 11, 33, 7, 16, 28, 1, 36, 9, 22, 30, 5, 14, 25, 38, 18, 2, 31,
  12, 27, 6, 34, 19, 10, 23, 37, 4, 15, 29, 8, 21, 35, 13, 26, 32, 17,
];

// Side rooms + the lounge couch — decorative context, never interactive.
const DECOR = {
  rooms: [
    { x: 1, y: 36, w: 7, h: 46, label: { ar: "غرفة", en: "Room" } },
    { x: 92, y: 36, w: 7, h: 46, label: { ar: "غرفة", en: "Room" } },
  ],
  couch: { x: 40, y: 94, w: 20, h: 6, label: { ar: "استراحة", en: "Lounge" } },
};

export function SeatMap({
  reservedCount,
  selected,
  onSelect,
}: {
  reservedCount: number;
  selected: number | null;
  onSelect: (seat: number) => void;
}) {
  const { t, lang, dir } = useLanguage();
  const [focusId, setFocusId] = useState<number>(() => selected ?? SEAT_IDS[0]);
  const btnRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  const reserved = useMemo(() => {
    const n = Math.max(0, Math.min(TOTAL, Math.round(reservedCount)));
    return new Set(FILL_ORDER.slice(0, n));
  }, [reservedCount]);

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
