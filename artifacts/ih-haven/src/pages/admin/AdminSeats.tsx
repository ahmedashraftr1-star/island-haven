import { useEffect, useMemo, useState } from "react";
import { Armchair, Ban, Wrench, Lock, CheckCircle2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Modal } from "./adminShared";
import { SEAT_IDS, TOTAL_SEATS } from "@/components/booking/hall-plan";

// Admin seat control — take a physical hall seat (1–38) out of the booking pool
// (disabled / maintenance / reserved) or return it. Shares the exact hall-plan
// geometry with /book + the homepage preview, so a change here reflects on both
// via the public /bookings/availability + /seat-status the server merges overrides
// into. Also shows each seat's upcoming reserved date+slot schedule (no personal
// data — the AdminBookings tab holds the full booking records).

type OverrideState = "disabled" | "maintenance" | "reserved";
interface Override { seatNumber: number; state: OverrideState; note: string }
interface TakenSeat { visitDate: string; timeSlot: string; seat: number }

const STATE_META: Record<OverrideState, { label: string; Icon: typeof Ban; cls: string }> = {
  disabled: { label: "معطّل", Icon: Ban, cls: "bg-rose-500/20 text-rose-300 border-rose-500/40" },
  maintenance: { label: "صيانة", Icon: Wrench, cls: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  reserved: { label: "محجوز يدويًا", Icon: Lock, cls: "bg-violet-500/20 text-violet-300 border-violet-500/40" },
};
const SLOT_LABEL: Record<string, string> = { morning: "صباحًا", midday: "ظهرًا", afternoon: "بعد الظهر", fullday: "يوم كامل" };

export default function AdminSeats() {
  const [overrides, setOverrides] = useState<Map<number, Override>>(new Map());
  const [taken, setTaken] = useState<TakenSeat[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<number | null>(null);

  async function reload() {
    try {
      const [ov, av] = await Promise.all([
        api<{ overrides: Override[] }>("/admin/seat-overrides"),
        api<{ takenSeats: TakenSeat[] }>("/bookings/availability"),
      ]);
      setOverrides(new Map(ov.overrides.map((o) => [o.seatNumber, o])));
      setTaken(av.takenSeats ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError && (e.status === 401 || e.status === 403) ? "تحتاج صلاحيّة إداريّة." : "تعذّر التحميل.");
    } finally {
      setLoaded(true);
    }
  }
  useEffect(() => { void reload(); }, []);

  const bookingsBySeat = useMemo(() => {
    const m = new Map<number, TakenSeat[]>();
    for (const t of taken) {
      if (t.seat == null) continue;
      (m.get(t.seat) ?? m.set(t.seat, []).get(t.seat)!).push(t);
    }
    return m;
  }, [taken]);

  const blockedCount = overrides.size;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">خريطة المقاعد</h2>
          <p className="text-[13px] text-foreground/65 mt-1">
            <span className="font-bold text-foreground tnum">{TOTAL_SEATS}</span> مقعدًا · {blockedCount} خارج الخدمة.
            التغيير ينعكس فورًا على صفحة الحجز والمعاينة في الرئيسيّة.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-foreground/70">
          <Legend swatch="bg-emerald-500/20 border-emerald-500/40" label="متاح" />
          {(Object.keys(STATE_META) as OverrideState[]).map((s) => <Legend key={s} swatch={STATE_META[s].cls} label={STATE_META[s].label} />)}
        </div>
      </div>

      {error && <div className="rounded-2xl px-4 py-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[13px]">{error}</div>}

      {!loaded ? (
        <div className="h-64 rounded-2xl bg-muted/30 animate-pulse" aria-hidden />
      ) : (
        <div className="rounded-2xl bg-card border border-border p-4 sm:p-6">
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2.5" role="group" aria-label="مقاعد القاعة">
            {SEAT_IDS.map((id) => {
              const ov = overrides.get(id);
              const bookings = bookingsBySeat.get(id)?.length ?? 0;
              const meta = ov ? STATE_META[ov.state] : null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setEditing(id)}
                  aria-label={`مقعد ${id}${ov ? ` — ${meta!.label}` : " — متاح"}${bookings ? ` — ${bookings} حجز` : ""}`}
                  className={`relative aspect-square rounded-xl border text-[13px] font-bold tnum flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${meta ? meta.cls : "bg-emerald-500/10 text-emerald-200/90 border-emerald-500/25 hover:bg-emerald-500/20"}`}
                >
                  {id}
                  {bookings > 0 && (
                    <span className="absolute -top-1.5 -left-1.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center tnum" title={`${bookings} حجز قادم`}>{bookings}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {editing != null && (
        <SeatEditor
          seat={editing}
          current={overrides.get(editing) ?? null}
          bookings={bookingsBySeat.get(editing) ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); void reload(); }}
        />
      )}
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className={`inline-block w-3 h-3 rounded border ${swatch}`} aria-hidden />{label}</span>;
}

function SeatEditor({ seat, current, bookings, onClose, onSaved }: {
  seat: number; current: Override | null; bookings: TakenSeat[]; onClose: () => void; onSaved: () => void;
}) {
  const [state, setState] = useState<"available" | OverrideState>(current?.state ?? "available");
  const [note, setNote] = useState(current?.note ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSubmitting(true);
    setError(null);
    try {
      if (state === "available") {
        if (current) await api(`/admin/seat-overrides/${seat}`, { method: "DELETE" });
      } else {
        await api("/admin/seat-overrides", { method: "POST", body: JSON.stringify({ seatNumber: seat, state, note }) });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحفظ.");
      setSubmitting(false);
    }
  }

  const options: Array<{ v: "available" | OverrideState; label: string; Icon: typeof Ban }> = [
    { v: "available", label: "متاح للحجز", Icon: CheckCircle2 },
    { v: "disabled", label: "معطّل", Icon: Ban },
    { v: "maintenance", label: "صيانة", Icon: Wrench },
    { v: "reserved", label: "محجوز يدويًا", Icon: Lock },
  ];

  const upcoming = [...bookings].sort((a, b) => a.visitDate.localeCompare(b.visitDate)).slice(0, 8);

  return (
    <Modal title={`مقعد رقم ${seat}`} onClose={onClose}>
      <div className="p-6 space-y-5">
        {error && <div className="rounded-xl px-3 py-2 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[12.5px]">{error}</div>}

        <div>
          <div className="text-[12px] font-semibold text-foreground/65 mb-2">حالة المقعد</div>
          <div className="grid grid-cols-2 gap-2">
            {options.map((o) => (
              <button key={o.v} type="button" onClick={() => setState(o.v)}
                className={`flex items-center gap-2 px-3 h-11 rounded-xl border text-[13px] font-semibold transition-colors ${state === o.v ? "bg-[hsl(var(--primary-cta))] text-white border-transparent" : "bg-muted/40 text-foreground/75 border-border hover:bg-muted/60"}`}>
                <o.Icon className="w-4 h-4" aria-hidden /> {o.label}
              </button>
            ))}
          </div>
        </div>

        {state !== "available" && (
          <div>
            <label className="block mb-1.5 text-[12px] text-foreground/65 font-semibold">ملاحظة (اختياريّة)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="سبب التعطيل/الحجز…" className="w-full rounded-xl px-3 py-2.5 bg-muted/40 border border-border outline-none text-[14px]" />
          </div>
        )}

        <div>
          <div className="text-[12px] font-semibold text-foreground/65 mb-2 flex items-center gap-1.5"><Armchair className="w-3.5 h-3.5" aria-hidden /> الحجوزات القادمة على هذا المقعد</div>
          {upcoming.length === 0 ? (
            <p className="text-[13px] text-foreground/60">لا حجوزات قادمة.</p>
          ) : (
            <ul className="space-y-1.5">
              {upcoming.map((b, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg px-3 py-2 bg-muted/30 text-[12.5px] text-foreground/75">
                  <span className="font-mono tnum">{b.visitDate}</span>
                  <span>{SLOT_LABEL[b.timeSlot] ?? b.timeSlot}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={save} disabled={submitting} className="flex-1 h-11 rounded-full bg-[hsl(var(--primary-cta))] text-white font-semibold text-[13.5px] disabled:opacity-50">
            {submitting ? "جارِ الحفظ…" : "حفظ"}
          </button>
          <button type="button" onClick={onClose} className="px-6 h-11 rounded-full bg-muted text-foreground/75 font-semibold text-[13.5px] hover:bg-muted/70 transition-colors">إلغاء</button>
        </div>
      </div>
    </Modal>
  );
}
