import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { imageUrl } from "@/hooks/use-content";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Armchair,
  UserPlus,
  UserMinus,
  Search,
  X,
  Users,
  Clock,
  CircleUserRound,
  Circle,
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
      <img
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

export default function AdminAttendance() {
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
    queryFn: () => api<Board>("/attendance/board"),
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
    onSuccess: invalidate,
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
          className="inline-flex items-center h-9 px-4 rounded-lg bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const available = board.totalSeats - board.assignedCount;
  const activeSeat =
    picker !== null ? board.seats.find((s) => s.number === picker) ?? null : null;

  return (
    <div className="space-y-6">
      {/* Live header */}
      <div className="bg-card rounded-2xl border border-border shadow-soft p-5 flex items-center gap-x-6 gap-y-3 flex-wrap">
        <div className="flex items-center gap-2 text-[13.5px] font-semibold text-foreground">
          <Armchair className="w-4 h-4 text-primary" strokeWidth={2.2} />
          {board.totalSeats} مقعد
        </div>
        <span className="w-px h-5 bg-border hidden sm:block" aria-hidden />
        <div className="flex items-center gap-2 text-[13px] text-foreground/70">
          <Users className="w-4 h-4 text-foreground/50" strokeWidth={2.2} />
          <span className="font-semibold text-foreground">{board.assignedCount}</span>{" "}
          مشغول
        </div>
        <div className="flex items-center gap-2 text-[13px] text-foreground/70">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden />
          <span className="font-semibold text-primary">{board.presentCount}</span>{" "}
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

      {/* Seat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {board.seats.map((seat, i) => {
          const occ = seat.occupant;
          return (
            <motion.div
              key={seat.number}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.008, 0.25), duration: 0.3 }}
              className={`relative rounded-2xl border p-4 flex flex-col gap-3 transition-colors ${
                occ
                  ? seat.present
                    ? "bg-card border-primary/30 shadow-soft"
                    : "bg-card border-border shadow-soft"
                  : "bg-muted/40 border-dashed border-border"
              }`}
              data-testid={`seat-${seat.number}`}
            >
              {/* seat number + state chip */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wide text-foreground/50 rtl:tracking-normal">
                  مقعد {seat.number}
                </span>
                {occ ? (
                  seat.present ? (
                    <span className="inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[11px] font-semibold bg-primary-soft text-primary">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden />
                      حاضر
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[11px] font-medium bg-muted text-foreground/55">
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-foreground/30"
                        aria-hidden
                      />
                      غائب
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[11px] font-medium bg-transparent text-foreground/45 border border-dashed border-border">
                    متاح
                  </span>
                )}
              </div>

              {occ ? (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar person={occ} size={40} />
                    <div className="min-w-0">
                      <div className="font-bold text-[13.5px] text-foreground truncate">
                        {occ.fullName}
                      </div>
                      {specialtyOf(occ) && (
                        <div className="text-[11.5px] text-foreground/60 truncate">
                          {specialtyOf(occ)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-auto">
                    <span className="inline-flex items-center gap-1 text-[10.5px] text-foreground/45">
                      <CircleUserRound className="w-3 h-3" />
                      {ROLE_LABELS[occ.role] || occ.role}
                    </span>
                    {seat.present && seat.since && (
                      <span
                        className="inline-flex items-center gap-1 text-[10.5px] text-foreground/45"
                        dir="ltr"
                      >
                        <Clock className="w-3 h-3" />
                        {fmtSince(seat.since)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => releaseMut.mutate(seat.number)}
                    disabled={releaseMut.isPending}
                    className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-lg text-[12px] font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40"
                    aria-label={`تفريغ المقعد ${seat.number}`}
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    تفريغ
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1 flex flex-col items-center justify-center gap-1.5 py-2 text-foreground/35">
                    <Circle className="w-7 h-7" strokeWidth={1.4} />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setPicker(seat.number);
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-lg text-[12px] font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    aria-label={`أسنِد عضوًا إلى المقعد ${seat.number}`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    أسنِد عضوًا
                  </button>
                </>
              )}
            </motion.div>
          );
        })}
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
            aria-label={`إسناد عضو إلى المقعد ${picker}`}
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
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
                <div>
                  <h2 className="text-[15px] font-bold text-foreground">
                    إسناد المقعد {picker}
                  </h2>
                  <p className="text-[12px] text-foreground/60 mt-0.5">
                    اختر عضوًا حقيقيًّا من القائمة
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
