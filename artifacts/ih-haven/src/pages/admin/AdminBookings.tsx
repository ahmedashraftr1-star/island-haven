import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Search,
  Users,
  Clock,
  UserCheck,
} from "lucide-react";

type Booking = {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  visitDate: string;
  timeSlot: string;
  purpose: string;
  attendees: number;
  notes: string | null;
  expertId: number | null;
  slotId: number | null;
  expertName: string | null;
  slotStartAt: string | null;
  slotEndAt: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "جديد",
  confirmed: "مؤكَّد",
  completed: "مُنجَز",
  cancelled: "مُلغى",
};

const STATUS_PILL: Record<string, string> = {
  pending: "bg-primary-soft text-primary",
  confirmed: "bg-emerald-500/15 text-emerald-300",
  completed: "bg-sky-500/15 text-sky-300",
  cancelled: "bg-rose-500/15 text-rose-300",
};

const SLOT_LABELS: Record<string, string> = {
  morning: "صباحًا",
  midday: "ظهرًا",
  afternoon: "بعد الظهر",
  fullday: "اليوم الكامل",
};

const PURPOSE_LABELS: Record<string, string> = {
  work: "عمل",
  study: "دراسة",
  meeting: "اجتماع",
  event: "فعّاليّة",
  tour: "زيارة",
  other: "أخرى",
};

function fmtDate(iso: string) {
  return new Date(iso + (iso.includes("T") ? "" : "T00:00:00")).toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtSlotTime(startAt: string, endAt: string) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  return `${fmt(startAt)} – ${fmt(endAt)}`;
}

export default function AdminBookings() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => api<{ bookings: Booking[] }>("/admin/bookings"),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: number; status?: string; adminNotes?: string }) =>
      api(`/admin/bookings/${vars.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: vars.status, adminNotes: vars.adminNotes }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-bookings"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      api(`/admin/bookings/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-bookings"] }),
  });

  if (isLoading)
    return <div className="text-center py-16 text-foreground/45 text-sm">جارِ التحميل...</div>;

  const list = data?.bookings ?? [];
  const filtered = list
    .filter((b) => filter === "all" || b.status === filter)
    .filter((b) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        b.fullName.toLowerCase().includes(q) ||
        b.phone.includes(q) ||
        (b.email || "").toLowerCase().includes(q)
      );
    });

  function toggle(id: number) {
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم، الهاتف، أو البريد..."
            className="pr-10 h-10 rounded-xl bg-card border-border"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44 h-10 rounded-xl bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحجوزات ({list.length})</SelectItem>
            <SelectItem value="pending">جديد</SelectItem>
            <SelectItem value="confirmed">مؤكَّد</SelectItem>
            <SelectItem value="completed">مُنجَز</SelectItem>
            <SelectItem value="cancelled">مُلغى</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-[12px] text-foreground/55 font-medium">
          {filtered.length} نتيجة
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-foreground/45 bg-card rounded-2xl border border-border">
          لا توجد حجوزات تطابق البحث.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.35 }}
              className="bg-card rounded-2xl border border-border shadow-soft hover:shadow-soft-hover hover:border-primary/25 transition-all overflow-hidden"
              data-testid={`booking-${b.id}`}
            >
              <div className="p-5 flex items-start gap-4 flex-wrap lg:flex-nowrap">
                <div className="w-11 h-11 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold text-[14px] shrink-0">
                  {b.fullName.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-bold text-[15px] text-foreground">{b.fullName}</h3>
                    <span
                      className={`inline-flex items-center px-2.5 h-6 rounded-full text-[11px] font-semibold ${STATUS_PILL[b.status]}`}
                    >
                      {STATUS_LABELS[b.status] || b.status}
                    </span>
                    <span className="inline-flex items-center px-2.5 h-6 rounded-full text-[11px] font-medium bg-muted text-foreground/70">
                      {PURPOSE_LABELS[b.purpose] || b.purpose}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 h-6 rounded-full text-[11px] font-medium bg-muted text-foreground/70">
                      <Users className="w-3 h-3" />
                      {b.attendees}
                    </span>
                  </div>
                  <div className="flex items-center gap-x-5 gap-y-1.5 flex-wrap text-[12.5px] text-foreground/60">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {fmtDate(b.visitDate)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {SLOT_LABELS[b.timeSlot] || b.timeSlot}
                    </span>
                    <span className="inline-flex items-center gap-1.5" dir="ltr">
                      <Phone className="w-3.5 h-3.5" />
                      {b.phone}
                    </span>
                    {b.email && (
                      <span className="inline-flex items-center gap-1.5" dir="ltr">
                        <Mail className="w-3.5 h-3.5" />
                        {b.email}
                      </span>
                    )}
                    {b.expertName && (
                      <span className="inline-flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" />
                        {b.expertName}
                      </span>
                    )}
                    {b.slotStartAt && b.slotEndAt && (
                      <span className="inline-flex items-center gap-1.5 text-emerald-300 font-medium" dir="ltr">
                        <Clock className="w-3.5 h-3.5" />
                        {fmtSlotTime(b.slotStartAt, b.slotEndAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Select
                    value={b.status}
                    onValueChange={(v) => updateMut.mutate({ id: b.id, status: v })}
                  >
                    <SelectTrigger className="w-36 h-9 rounded-lg bg-card border-border text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">جديد</SelectItem>
                      <SelectItem value="confirmed">مؤكَّد</SelectItem>
                      <SelectItem value="completed">مُنجَز</SelectItem>
                      <SelectItem value="cancelled">مُلغى</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggle(b.id)}
                    className="h-9 px-3 rounded-lg"
                    aria-label={expanded.has(b.id) ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                    aria-expanded={expanded.has(b.id)}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${expanded.has(b.id) ? "rotate-180" : ""}`}
                    />
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {expanded.has(b.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-2 border-t border-border space-y-4">
                      {b.notes && (
                        <div>
                          <div className="text-[10px] tracking-[0.14em] uppercase text-foreground/45 font-semibold mb-1.5">
                            ملاحظات الزائر
                          </div>
                          <p className="text-[14px] text-foreground/85 whitespace-pre-wrap leading-relaxed">
                            {b.notes}
                          </p>
                        </div>
                      )}
                      <div>
                        <div className="text-[10px] tracking-[0.14em] uppercase text-foreground/45 font-semibold mb-1.5">
                          ملاحظات داخليّة
                        </div>
                        <Textarea
                          // key forces remount when server data changes so the
                          // displayed value never goes stale after refetch.
                          key={`notes-${b.id}-${b.adminNotes ?? ""}`}
                          defaultValue={b.adminNotes ?? ""}
                          rows={2}
                          placeholder="ملاحظات لا يراها الزائر..."
                          className="rounded-xl border-border bg-muted/40 focus-visible:ring-primary/30"
                          onBlur={(e) => {
                            if (e.target.value !== (b.adminNotes ?? "")) {
                              updateMut.mutate({ id: b.id, adminNotes: e.target.value });
                            }
                          }}
                        />
                      </div>
                      <div className="text-[11px] text-foreground/45">
                        وصل الحجز:{" "}
                        {new Date(b.createdAt).toLocaleString("ar-EG")}
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 gap-1.5"
                          onClick={() => {
                            if (confirm("حذف هذا الحجز نهائياً؟")) deleteMut.mutate(b.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف الحجز
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
