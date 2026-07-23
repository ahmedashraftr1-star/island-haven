import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { GROUPS, ALL_SEATS, SEAT_IDS, DECOR, TOTAL_SEATS, toArDigits } from "./hall-plan";

/**
 * SeatMapPreview — a READ-ONLY snapshot of the real hall floor plan for the
 * homepage. It reuses the exact geometry the interactive `SeatMap` books against
 * (`./hall-plan`), so what a visitor previews here is precisely the hall they'll
 * book on /book — no drift, no second "abstract" seat picture to contradict it.
 *
 * It is intentionally NOT interactive: one static SVG, no buttons, no focus, no
 * fetch. The seats simply render available (glass) or taken (terracotta). Because
 * the homepage only knows a live COUNT of taken seats (not which ones), we fill
 * `takenCount` seats along the fixed seat order — a stable, honest picture of
 * "N taken", never a fabricated per-seat claim (the same rule the booking map and
 * the old availability board followed). The whole plan is a single labelled
 * `role="img"` announcing the honest taken/free counts; the reserved fixed
 * aspect-ratio box means it can never shift layout while the count loads (CLS 0).
 */
export function SeatMapPreview({
  takenCount,
  blockedSeats,
  className,
}: {
  /** REAL count of taken seats from the live board (clamped to capacity). */
  takenCount: number;
  /** Admin-blocked seats (disabled/maintenance/reserved) — shown distinct + out
   *  of the pool, so the preview matches /book. */
  blockedSeats?: number[];
  className?: string;
}) {
  const { t, lang } = useLanguage();

  const blocked = useMemo(() => new Set(blockedSeats ?? []), [blockedSeats]);
  const blockedCount = blocked.size;
  // Taken is clamped to the seats NOT already blocked (blocked leave the pool).
  const taken = Math.max(0, Math.min(TOTAL_SEATS - blockedCount, Math.trunc(takenCount) || 0));
  const free = TOTAL_SEATS - taken - blockedCount;
  const fmt = (n: number) => (lang === "ar" ? toArDigits(n) : String(n));

  // Fill the first `taken` seats (skipping blocked ones, in seat order) as taken —
  // a stable per-count picture, not a claim about which specific seats are occupied.
  const takenSet = useMemo(() => {
    const s = new Set<number>();
    for (const id of SEAT_IDS) {
      if (s.size >= taken) break;
      if (!blocked.has(id)) s.add(id);
    }
    return s;
  }, [taken, blocked]);

  return (
    <div
      className={className}
      style={{ aspectRatio: "100 / 104" }}
      role="img"
      aria-label={t({
        ar: `مخطّط القاعة: ${fmt(TOTAL_SEATS)} مقعدًا، ${fmt(taken)} مشغول و${fmt(free)} متاح${blockedCount ? ` و${fmt(blockedCount)} غير متاح` : ""}`,
        en: `Hall floor plan: ${fmt(TOTAL_SEATS)} seats, ${fmt(taken)} taken and ${fmt(free)} available${blockedCount ? `, ${fmt(blockedCount)} unavailable` : ""}`,
      })}
    >
      <svg
        viewBox="0 0 100 104"
        className="h-full w-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Side rooms + lounge couch — decorative context. */}
        {DECOR.rooms.map((r, i) => (
          <rect
            key={`room-${i}`}
            x={r.x} y={r.y} width={r.w} height={r.h} rx="1.5"
            fill="hsl(0 0% 100% / 0.02)"
            stroke="hsl(0 0% 100% / 0.12)"
            strokeWidth="0.25"
            strokeDasharray="1.5 1"
          />
        ))}
        <rect
          x={DECOR.couch.x} y={DECOR.couch.y} width={DECOR.couch.w} height={DECOR.couch.h} rx="2.5"
          fill="hsl(0 0% 100% / 0.04)"
          stroke="hsl(0 0% 100% / 0.14)"
          strokeWidth="0.25"
        />
        {/* Tables. */}
        {GROUPS.flatMap((g) =>
          g.tables.map((tb, i) => (
            <rect
              key={`${g.key}-t${i}`}
              x={tb.x} y={tb.y} width={tb.w} height={tb.h} rx={tb.rx ?? 2}
              fill="hsl(24 30% 20% / 0.35)"
              stroke="hsl(38 40% 60% / 0.22)"
              strokeWidth="0.25"
            />
          )),
        )}
        {/* Seats — blocked (faint, out of pool) · taken (terracotta) · available (glass). */}
        {ALL_SEATS.map((s) => {
          const isBlocked = blocked.has(s.id);
          const isTaken = !isBlocked && takenSet.has(s.id);
          const fill = isBlocked ? "hsl(0 0% 100% / 0.02)" : isTaken ? "hsl(var(--primary) / 0.9)" : "hsl(0 0% 100% / 0.05)";
          const stroke = isBlocked ? "hsl(0 0% 100% / 0.12)" : isTaken ? "hsl(var(--primary))" : "hsl(0 0% 100% / 0.28)";
          return (
            <rect
              key={s.id}
              x={s.x - 2.75}
              y={s.y - 2.65}
              width="5.5"
              height="5.3"
              rx="1.2"
              fill={fill}
              stroke={stroke}
              strokeWidth="0.3"
              strokeDasharray={isBlocked ? "1 1" : undefined}
            />
          );
        })}
      </svg>
    </div>
  );
}
