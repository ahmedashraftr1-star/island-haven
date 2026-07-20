import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { imageUrl } from "@/hooks/use-content";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Armchair,
  UserMinus,
  Search,
  X,
  Users,
  Clock,
  CircleUserRound,
} from "lucide-react";

type Occupant = {
  id: number;
  fullName: string;
  jobTitle: string;
  skills: string;
  avatarUrl: string | null;
  role: string;
};

type Seat = {
  number: number;
  present: boolean;
  since: string | null;
  occupant: Occupant | null;
};

type Board = {
  totalSeats: number;
  presentCount: number;
  assignedCount: number;
  seats: Seat[];
};

type Member = {
  id: number;
  fullName: string;
  jobTitle: string;
  skills: string;
  avatarUrl: string | null;
  role: string;
  seatNumber: number | null;
};

const ROLE_LABELS: Record<string, string> = {
  freelancer: "مستقلّ",
  graduate: "خرّيج",
  student: "طالب",
  admin: "مشرف",
  other: "عضو",
};

// ─── Floor-plan seat map ──────────────────────────────────────────────────────
// The physical incubator floor holds 38 seats. `col`/`row` are 1-indexed cells
// on a FIXED spatial grid: the map is a diagram of the real room, so it renders
// LTR-locked and never mirrors with the page's RTL — the "right column" (1–8)
// stays on the right. To move a seat, edit only its { col, row } below.
const SEAT_COLS = 14;
const SEAT_ROWS = 8;
const SEAT_LAYOUT: ReadonlyArray<{ n: number; col: number; row: number }> = [
  // Right column (1–8)
  { n: 1, col: 14, row: 1 }, { n: 2, col: 14, row: 2 }, { n: 3, col: 14, row: 3 }, { n: 4, col: 14, row: 4 },
  { n: 5, col: 14, row: 5 }, { n: 6, col: 14, row: 6 }, { n: 7, col: 14, row: 7 }, { n: 8, col: 14, row: 8 },
  // Mid-right vertical pairs (9–14): 11·12 / 10·13 / 9·14
  { n: 12, col: 11, row: 2 }, { n: 11, col: 12, row: 2 },
  { n: 13, col: 11, row: 4 }, { n: 10, col: 12, row: 4 },
  { n: 14, col: 11, row: 6 }, { n: 9, col: 12, row: 6 },
  // Top row (15–18)
  { n: 18, col: 5, row: 1 }, { n: 17, col: 6, row: 1 }, { n: 16, col: 7, row: 1 }, { n: 15, col: 8, row: 1 },
  // Central block — upper (19–24)
  { n: 19, col: 4, row: 3 }, { n: 20, col: 5, row: 3 }, { n: 21, col: 6, row: 3 },
  { n: 22, col: 7, row: 3 }, { n: 23, col: 8, row: 3 }, { n: 24, col: 9, row: 3 },
  // Central block — lower (25–30)
  { n: 30, col: 4, row: 4 }, { n: 29, col: 5, row: 4 }, { n: 28, col: 6, row: 4 },
  { n: 27, col: 7, row: 4 }, { n: 26, col: 8, row: 4 }, { n: 25, col: 9, row: 4 },
  // Bottom-left (31–34)
  { n: 31, col: 2, row: 6 }, { n: 32, col: 3, row: 6 }, { n: 33, col: 4, row: 6 }, { n: 34, col: 5, row: 6 },
  // Bottom-left (35–38)
  { n: 38, col: 2, row: 7 }, { n: 37, col: 3, row: 7 }, { n: 36, col: 4, row: 7 }, { n: 35, col: 5, row: 7 },
];

type SeatState = "available" | "reserved" | "occupied";
const STATE_LABELS: Record<SeatState, string> = {
  available: "متاح",
  reserved: "محجوز",
  occupied: "مشغول الآن",
};
// Clear, on-brand, WCAG-safe: dashed-empty / soft-brand held / solid-brand present.
const SEAT_STYLES: Record<SeatState, string> = {
  available:
    "bg-muted/40 border border-dashed border-border text-foreground/45 hover:border-primary/50 hover:text-foreground/75",
  reserved:
    "bg-primary-soft border border-primary/40 text-primary hover:bg-primary-soft/80",
  occupied:
    "bg-primary border border-primary text-white shadow-soft hover:bg-primary/90",
};
function seatState(seat: Seat | undefined): SeatState {
  if (!seat || !seat.occupant) return "available";
  return seat.present ? "occupied" : "reserved";
}

function LegendChip({ state, label }: { state: SeatState; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-foreground/70">
      <span
        className={`w-4 h-4 rounded-md ${SEAT_STYLES[state]}`}
        aria-hidden
      />
      {label}
    </span>
  );
}

/** The specialty line: prefer jobTitle, else the first comma-split skill. */
function specialtyOf(p: { jobTitle: string; skills: string }): string {
  const title = (p.jobTitle || "").trim();
  if (title) return title;
  const first = (p.skills || "").split(",")[0]?.trim();
  return first || "";
}

function fmtSince(iso: string): string {
  return new Date(iso).toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function Avatar({
  person,
  size,
}: {
  person: { fullName: string; avatarUrl: string | null };
  size: number;
}) {
  const src = imageUrl(person.avatarUrl);
  const dim = { width: size, height: size };
  if (src) {
    return (
      <img loading="lazy" decoding="async"
        src={src}
        alt=""
        style={dim}
        className="rounded-full object-cover border border-border shrink-0"
      />
    );
  }
  return (
    <div
      style={dim}
      className="rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold shrink-0"
    >
      {person.fullName.trim().charAt(0) || "؟"}
    </div>
  );
}

export default function SeatMap() {
  const qc = useQueryClient();
  const [picker, setPicker] = useState<number | null>(null); // seat number the picker is open for
  const [query, setQuery] = useState("");

  const {
    data: board,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-attendance-board"],
    queryFn: () => api<Board>("/admin/attendance/board"),
    refetchInterval: 30_000,
  });

  const { data: membersData } = useQuery({
    queryKey: ["admin-attendance-members"],
    queryFn: () => api<{ members: Member[] }>("/admin/attendance/members"),
    enabled: picker !== null,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-attendance-board"] });
    qc.invalidateQueries({ queryKey: ["admin-attendance-members"] });
  };

  const assignMut = useMutation({
    mutationFn: (vars: { seatNumber: number; userId: number }) =>
      api<{ ok: true }>("/admin/attendance/assign", {
        method: "POST",
        body: JSON.stringify(vars),
      }),
    onSuccess: () => {
      invalidate();
      setPicker(null);
      setQuery("");
    },
  });

  const releaseMut = useMutation({
    mutationFn: (seatNumber: number) =>
      api<{ ok: true }>("/admin/attendance/release", {
        method: "POST",
        body: JSON.stringify({ seatNumber }),
      }),
    onSuccess: () => {
      invalidate();
      setPicker(null);
    },
  });

  const members = membersData?.members ?? [];
  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        (m.jobTitle || "").toLowerCase().includes(q) ||
        (m.skills || "").toLowerCase().includes(q),
    );
  }, [members, query]);

  if (isLoading) {
    return (
      <div className="text-center py-16 text-foreground/60 text-sm">
        جارِ التحميل...
      </div>
    );
  }

  if (isError || !board) {
    return (
      <div className="text-center py-16 bg-card rounded-2xl border border-border">
        <div className="text-rose-400 text-sm font-medium mb-3">
          {error instanceof ApiError ? error.message : "تعذّر تحميل لوحة الحضور."}
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center h-9 px-4 rounded-lg bg-[hsl(var(--primary-cta))] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const activeSeat =
    picker !== null ? board.seats.find((s) => s.number === picker) ?? null : null;
  const seatByNumber = new Map(board.seats.map((s) => [s.number, s]));
  // Defensive: the floor is 38 seats, but if any seat beyond the mapped layout
  // is occupied we still surface it (never hide a real assignment).
  const overflowSeats = board.seats.filter((s) => s.number > 38 && s.occupant);

  // Counts follow the MAP (not a hardcoded total): the seats actually rendered =
  // the floor-plan layout + any occupied overflow. Change SEAT_LAYOUT and these
  // numbers track it automatically.
  const totalSeats = SEAT_LAYOUT.length + overflowSeats.length;
  const assignedCount =
    SEAT_LAYOUT.filter(({ n }) => seatByNumber.get(n)?.occupant).length + overflowSeats.length;
  const presentCount =
    SEAT_LAYOUT.filter(({ n }) => seatByNumber.get(n)?.present).length +
    overflowSeats.filter((s) => s.present).length;
  const available = totalSeats - assignedCount;

  return (
    <div className="space-y-6">
      {/* Live header */}
      <div className="bg-card rounded-2xl border border-border shadow-soft p-5 flex items-center gap-x-6 gap-y-3 flex-wrap">
        <div className="flex items-center gap-2 text-[13.5px] font-semibold text-foreground">
          <Armchair className="w-4 h-4 text-primary" strokeWidth={2.2} />
          {totalSeats} مقعد
        </div>
        <span className="w-px h-5 bg-border hidden sm:block" aria-hidden />
        <div className="flex items-center gap-2 text-[13px] text-foreground/70">
          <Users className="w-4 h-4 text-foreground/50" strokeWidth={2.2} />
          <span className="font-semibold text-foreground">{assignedCount}</span>{" "}
          مشغول
        </div>
        <div className="flex items-center gap-2 text-[13px] text-foreground/70">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden />
          <span className="font-semibold text-primary">{presentCount}</span>{" "}
          حاضر الآن
        </div>
        <div className="flex items-center gap-2 text-[13px] text-foreground/70">
          <span
            className="w-2 h-2 rounded-full border border-foreground/30"
            aria-hidden
          />
          <span className="font-semibold text-foreground">{available}</span> متاح
        </div>
      </div>

      {/* Floor-plan seat map — a diagram of the real 38-seat room */}
      <div className="bg-card rounded-2xl border border-border shadow-soft p-4 sm:p-6">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-5 text-[12px]">
          <LegendChip state="available" label="متاح" />
          <LegendChip state="reserved" label="محجوز" />
          <LegendChip state="occupied" label="مشغول الآن" />
          <span className="text-foreground/40 text-[11.5px] ms-auto hidden sm:block">
            اضغط أي مقعد للإسناد أو التفريغ
          </span>
        </div>

        {/* Scrollable spatial diagram — LTR-locked so it mirrors the real room */}
        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <div
            dir="ltr"
            className="grid gap-1.5 w-max mx-auto"
            style={{
              gridTemplateColumns: `repeat(${SEAT_COLS}, 46px)`,
              gridTemplateRows: `repeat(${SEAT_ROWS}, 46px)`,
            }}
          >
            {SEAT_LAYOUT.map(({ n, col, row }) => {
              const seat = seatByNumber.get(n);
              const st = seatState(seat);
              const occ = seat?.occupant ?? null;
              const label = `مقعد رقم ${n} — ${STATE_LABELS[st]}${occ ? ` — ${occ.fullName}` : ""}`;
              return (
                <button
                  key={n}
                  type="button"
                  data-testid={`seat-${n}`}
                  onClick={() => {
                    setQuery("");
                    setPicker(n);
                  }}
                  title={label}
                  aria-label={label}
                  style={{ gridColumn: col, gridRow: row }}
                  className={`relative rounded-xl text-[12.5px] font-bold tabular-nums flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${SEAT_STYLES[st]}`}
                >
                  {n}
                  {st === "occupied" && (
                    <span className="absolute top-1 end-1 w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse" aria-hidden />
                  )}
                  {st === "reserved" && (
                    <span className="absolute top-1 end-1 w-1.5 h-1.5 rounded-full bg-primary/70" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Defensive overflow: any occupied seat beyond the 38-seat floor plan */}
        {overflowSeats.length > 0 && (
          <div className="mt-5 pt-4 border-t border-border">
            <div className="text-[11.5px] text-foreground/50 mb-2">مقاعد إضافيّة مشغولة</div>
            <div className="flex flex-wrap gap-1.5" dir="ltr">
              {overflowSeats.map((seat) => {
                const st = seatState(seat);
                const label = `مقعد رقم ${seat.number} — ${STATE_LABELS[st]}${seat.occupant ? ` — ${seat.occupant.fullName}` : ""}`;
                return (
                  <button
                    key={seat.number}
                    type="button"
                    data-testid={`seat-${seat.number}`}
                    onClick={() => {
                      setQuery("");
                      setPicker(seat.number);
                    }}
                    title={label}
                    aria-label={label}
                    className={`w-[46px] h-[46px] rounded-xl text-[12.5px] font-bold tabular-nums flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${SEAT_STYLES[st]}`}
                  >
                    {seat.number}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Member picker */}
      <AnimatePresence>
        {picker !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-6"
            onClick={() => setPicker(null)}
            role="dialog"
            aria-modal="true"
            aria-label={
              activeSeat?.occupant
                ? `تفاصيل المقعد ${picker}`
                : `إسناد عضو إلى المقعد ${picker}`
            }
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-card w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-border shadow-soft-hover max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
                <div>
                  <h2 className="text-[15px] font-bold text-foreground">
                    {activeSeat?.occupant ? `المقعد ${picker}` : `إسناد المقعد ${picker}`}
                  </h2>
                  <p className="text-[12px] text-foreground/60 mt-0.5">
                    {activeSeat?.occupant
                      ? activeSeat.present
                        ? "مشغول الآن"
                        : "محجوز — غير حاضر"
                      : "اختر عضوًا حقيقيًّا من القائمة"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPicker(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground/55 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {activeSeat?.occupant ? (
                /* ── Occupied / reserved seat: occupant details + release ── */
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar person={activeSeat.occupant} size={48} />
                    <div className="min-w-0">
                      <div className="font-bold text-[14.5px] text-foreground truncate">
                        {activeSeat.occupant.fullName}
                      </div>
                      {specialtyOf(activeSeat.occupant) && (
                        <div className="text-[12px] text-foreground/60 truncate">
                          {specialtyOf(activeSeat.occupant)}
                        </div>
                      )}
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 h-6 rounded-full text-[11px] font-medium bg-muted text-foreground/60">
                          <CircleUserRound className="w-3 h-3" />
                          {ROLE_LABELS[activeSeat.occupant.role] || activeSeat.occupant.role}
                        </span>
                        {activeSeat.present && activeSeat.since && (
                          <span
                            className="inline-flex items-center gap-1 px-2 h-6 rounded-full text-[11px] font-medium bg-primary-soft text-primary"
                            dir="ltr"
                          >
                            <Clock className="w-3 h-3" />
                            {fmtSince(activeSeat.since)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {releaseMut.isError && (
                    <div className="text-[12px] text-rose-400 font-medium">
                      {releaseMut.error instanceof ApiError
                        ? releaseMut.error.message
                        : "تعذّر التفريغ."}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => releaseMut.mutate(picker)}
                    disabled={releaseMut.isPending}
                    className="w-full inline-flex items-center justify-center gap-1.5 h-11 rounded-xl text-[13px] font-semibold text-rose-400 border border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-300 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40"
                    aria-label={`تفريغ المقعد ${picker}`}
                  >
                    <UserMinus className="w-4 h-4" />
                    تفريغ المقعد
                  </button>
                </div>
              ) : (
                /* ── Empty seat: search + assign a real member ── */
                <>
                  <div className="px-5 py-3 border-b border-border">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/55" />
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="ابحث بالاسم أو التخصّص..."
                        className="pr-10 h-10 rounded-xl bg-muted/40 border-border"
                        autoFocus
                      />
                    </div>
                  </div>

                  {assignMut.isError && (
                    <div className="mx-5 mt-3 text-[12px] text-rose-400 font-medium">
                      {assignMut.error instanceof ApiError
                        ? assignMut.error.message
                        : "تعذّر الإسناد."}
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                    {filteredMembers.length === 0 ? (
                      <div className="text-center py-12 text-foreground/55 text-[13px]">
                        {members.length === 0
                          ? "لا يوجد أعضاء بعد."
                          : "لا يوجد عضو يطابق البحث."}
                      </div>
                    ) : (
                      filteredMembers.map((m) => {
                        const heldElsewhere =
                          m.seatNumber !== null && m.seatNumber !== picker;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            disabled={assignMut.isPending}
                            onClick={() =>
                              activeSeat &&
                              assignMut.mutate({
                                seatNumber: activeSeat.number,
                                userId: m.id,
                              })
                            }
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right hover:bg-muted/60 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                          >
                            <Avatar person={m} size={38} />
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-[13.5px] text-foreground truncate">
                                {m.fullName}
                              </div>
                              {specialtyOf(m) && (
                                <div className="text-[11.5px] text-foreground/60 truncate">
                                  {specialtyOf(m)}
                                </div>
                              )}
                            </div>
                            {heldElsewhere && (
                              <span className="shrink-0 inline-flex items-center gap-1 px-2 h-6 rounded-full text-[10.5px] font-medium bg-muted text-foreground/55">
                                <Armchair className="w-3 h-3" />
                                مقعد {m.seatNumber}
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
