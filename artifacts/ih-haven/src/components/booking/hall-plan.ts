/**
 * hall-plan — the ONE source of truth for the Island Haven hall geometry.
 *
 * Both the interactive booking map (`SeatMap`, on /book) and the read-only
 * homepage preview (`SeatMapPreview`) import this, so the two can NEVER drift:
 * the shape a visitor previews on the homepage is exactly the shape they book.
 * The owner's floor diagram is the source of truth for placement — this mirrors
 * its groups: a window row (1–8), a meeting table (9–12), a quiet corner
 * (13–14), and six 4-seat pods (15–38). Plan space is 0..100 wide × 0..104 tall.
 */

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
export const toArDigits = (n: number) => String(n).replace(/\d/g, (d) => AR_DIGITS[+d]);

export interface SeatGroup {
  key: string;
  label: { ar: string; en: string };
  /** table rectangles (in the 0..100 × 0..104 plan space) */
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

export const GROUPS: SeatGroup[] = [
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

export const ALL_SEATS = GROUPS.flatMap((g) => g.seats.map((s) => ({ ...s, group: g.key })));
export const SEAT_IDS = ALL_SEATS.map((s) => s.id).sort((a, b) => a - b);
export const TOTAL_SEATS = ALL_SEATS.length; // 38

// Side rooms + the lounge couch — decorative context, never interactive.
export const DECOR = {
  rooms: [
    { x: 1, y: 36, w: 7, h: 46, label: { ar: "غرفة", en: "Room" } },
    { x: 92, y: 36, w: 7, h: 46, label: { ar: "غرفة", en: "Room" } },
  ],
  couch: { x: 40, y: 94, w: 20, h: 6, label: { ar: "استراحة", en: "Lounge" } },
};
