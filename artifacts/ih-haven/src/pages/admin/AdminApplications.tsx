import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Trash2, Mail, Phone, Calendar, Search, Star, CalendarClock, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { downloadCsv } from "./csvDownload";

type ReviewAgg = { avg: number | null; count: number; advance: number };
type Application = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  category: string;
  bio: string;
  status: string;
  notes: string | null;
  interviewAt: string | null;
  review: ReviewAgg;
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  new: "جديد", reviewing: "قيد المراجعة", screening: "فرز", interview: "مقابلة",
  offer: "عرض", waitlist: "قائمة انتظار", accepted: "مقبول", rejected: "مرفوض",
};
const STAGE_OPTIONS = ["new", "reviewing", "screening", "interview", "offer", "waitlist", "accepted", "rejected"];

const STATUS_DOTS: Record<string, string> = {
  new: "bg-primary", reviewing: "bg-amber-500", screening: "bg-sky-500", interview: "bg-violet-500",
  offer: "bg-teal-500", waitlist: "bg-foreground/40", accepted: "bg-emerald-500", rejected: "bg-rose-500",
};

const STATUS_PILL: Record<string, string> = {
  new: "bg-primary-soft text-primary", reviewing: "bg-amber-500/15 text-amber-300",
  screening: "bg-sky-500/15 text-sky-300", interview: "bg-violet-500/15 text-violet-300",
  offer: "bg-teal-500/15 text-teal-300", waitlist: "bg-foreground/10 text-foreground/60",
  accepted: "bg-emerald-500/15 text-emerald-300", rejected: "bg-rose-500/15 text-rose-300",
};

const CATEGORY_LABELS: Record<string, string> = {
  freelancer: "مستقل",
  graduate: "خرّيج",
  student: "طالب",
  other: "أخرى",
};

export default function AdminApplications() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: () => api<{ applications: Application[] }>("/admin/applications"),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: number; status?: string; notes?: string; interviewAt?: string | null }) =>
      api(`/admin/applications/${vars.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: vars.status, notes: vars.notes, interviewAt: vars.interviewAt }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-applications"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      api(`/admin/applications/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-applications"] }),
  });

  if (isLoading)
    return <div className="text-center py-16 text-foreground/60 text-sm">جارِ التحميل...</div>;

  const apps = data?.applications ?? [];
  const filtered = apps
    .filter((a) => filter === "all" || a.status === filter)
    .filter((a) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        a.fullName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.phone.includes(q)
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
      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/55" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم، البريد، أو الهاتف..."
            className="pr-10 h-10 rounded-xl bg-card border-border"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44 h-10 rounded-xl bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الطلبات ({apps.length})</SelectItem>
            <SelectItem value="new">جديد</SelectItem>
            <SelectItem value="reviewing">قيد المراجعة</SelectItem>
            <SelectItem value="accepted">مقبول</SelectItem>
            <SelectItem value="rejected">مرفوض</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-[12px] text-foreground/65 font-medium">
          {filtered.length} نتيجة
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => downloadCsv("/admin/applications/export", "applications.csv")}
          data-testid="applications-export"
          className="h-10 rounded-xl gap-1.5 text-foreground/70"
        >
          <Download className="w-4 h-4" /> تصدير CSV
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-foreground/60 bg-card rounded-2xl border border-border">
          لا توجد طلبات تطابق البحث.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app, i) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.35 }}
              className="bg-card rounded-2xl border border-border shadow-soft hover:shadow-soft-hover hover:border-primary/25 transition-all overflow-hidden"
              data-testid={`application-${app.id}`}
            >
              <div className="p-5 flex items-start gap-4 flex-wrap lg:flex-nowrap">
                <div className="w-11 h-11 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold text-[14px] shrink-0">
                  {app.fullName.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-bold text-[15px] text-foreground">
                      {app.fullName}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full text-[11px] font-semibold ${STATUS_PILL[app.status]}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[app.status]}`} />
                      {STATUS_LABELS[app.status] || app.status}
                    </span>
                    <span className="inline-flex items-center px-2.5 h-6 rounded-full text-[11px] font-medium bg-muted text-foreground/70">
                      {CATEGORY_LABELS[app.category] || app.category}
                    </span>
                    {app.review.count > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 h-6 rounded-full text-[11px] font-bold bg-amber-500/12 text-amber-300" title={`${app.review.count} تقييم`}>
                        <Star className="w-3 h-3 fill-current" />
                        {app.review.avg?.toFixed(1)}
                        <span className="text-amber-300/60 font-medium">· {app.review.count}</span>
                      </span>
                    )}
                    {app.interviewAt && (
                      <span className="inline-flex items-center gap-1 px-2.5 h-6 rounded-full text-[11px] font-medium bg-violet-500/12 text-violet-300">
                        <CalendarClock className="w-3 h-3" />
                        {new Date(app.interviewAt).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-x-5 gap-y-1.5 flex-wrap text-[12.5px] text-foreground/60">
                    <span className="inline-flex items-center gap-1.5" dir="ltr">
                      <Mail className="w-3.5 h-3.5" />
                      {app.email}
                    </span>
                    <span className="inline-flex items-center gap-1.5" dir="ltr">
                      <Phone className="w-3.5 h-3.5" />
                      {app.phone}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(app.createdAt).toLocaleDateString("ar-EG", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Select
                    value={app.status}
                    onValueChange={(v) => updateMut.mutate({ id: app.id, status: v })}
                  >
                    <SelectTrigger className="w-36 h-9 rounded-lg bg-card border-border text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGE_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggle(app.id)}
                    className="h-9 px-3 rounded-lg"
                    aria-label={expanded.has(app.id) ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                    aria-expanded={expanded.has(app.id)}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${expanded.has(app.id) ? "rotate-180" : ""}`}
                    />
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {expanded.has(app.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-2 border-t border-border space-y-4">
                      <div>
                        <div className="text-[10px] tracking-[0.14em] uppercase text-foreground/60 font-semibold mb-1.5">
                          نبذة عن المتقدّم
                        </div>
                        <p className="text-[14px] text-foreground/85 whitespace-pre-wrap leading-relaxed">
                          {app.bio || "—"}
                        </p>
                      </div>
                      <div>
                        <div className="text-[10px] tracking-[0.14em] uppercase text-foreground/60 font-semibold mb-1.5">
                          ملاحظات داخليّة
                        </div>
                        <Textarea
                          defaultValue={app.notes ?? ""}
                          rows={2}
                          placeholder="اكتب ملاحظاتك هنا — لا يراها المتقدّم..."
                          className="rounded-xl border-border bg-muted/40 focus-visible:ring-primary/30"
                          onBlur={(e) => {
                            if (e.target.value !== (app.notes ?? "")) {
                              updateMut.mutate({ id: app.id, notes: e.target.value });
                            }
                          }}
                        />
                      </div>

                      {/* Interview scheduling */}
                      <div>
                        <div className="text-[10px] tracking-[0.14em] uppercase text-foreground/60 font-semibold mb-1.5">
                          موعد المقابلة
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="datetime-local"
                            aria-label="موعد المقابلة"
                            defaultValue={app.interviewAt ? new Date(app.interviewAt).toISOString().slice(0, 16) : ""}
                            data-testid={`interview-${app.id}`}
                            className="h-9 px-3 rounded-lg bg-muted/40 border border-border text-[13px] text-foreground outline-none focus:border-primary/50"
                            onChange={(e) => updateMut.mutate({ id: app.id, interviewAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                          />
                          {app.interviewAt && (
                            <Button type="button" variant="ghost" size="sm" className="text-foreground/60 h-9" onClick={() => updateMut.mutate({ id: app.id, interviewAt: null })}>إلغاء الموعد</Button>
                          )}
                        </div>
                      </div>

                      {/* Review & scoring */}
                      <ReviewPanel appId={app.id} />

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 gap-1.5"
                          onClick={() => {
                            if (confirm("حذف هذا الطلب نهائياً؟")) deleteMut.mutate(app.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف الطلب
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

// ── Review & scoring panel (evidence-based selection) ─────────────────────────
interface Review { id: number; reviewerId: number; reviewerName: string; score: number; recommendation: string; notes: string; updatedAt: string }
const REC_LABEL: Record<string, string> = { advance: "تقديم", hold: "تعليق", reject: "رفض" };
const REC_TONE: Record<string, string> = { advance: "text-emerald-400", hold: "text-amber-400", reject: "text-rose-400" };

function ReviewPanel({ appId }: { appId: number }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["app-reviews", appId],
    queryFn: () => api<{ reviews: Review[]; mine: Review | null; avg: number | null; count: number }>(`/admin/applications/${appId}/reviews`),
  });
  const mine = data?.mine;
  const [score, setScore] = useState<number>(0);
  const [rec, setRec] = useState<string>("advance");
  const [notes, setNotes] = useState<string>("");
  const [dirty, setDirty] = useState(false);

  // Seed the form from my existing review once it loads (unless I'm mid-edit).
  useEffect(() => {
    if (mine && !dirty) {
      setScore(mine.score);
      setRec(mine.recommendation);
      setNotes(mine.notes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mine?.id]);

  const [saveError, setSaveError] = useState<string | null>(null);
  const saveMut = useMutation({
    mutationFn: () => api(`/admin/applications/${appId}/reviews`, { method: "POST", body: JSON.stringify({ score, recommendation: rec, notes: notes.trim() || undefined }) }),
    onSuccess: () => {
      setDirty(false);
      setSaveError(null);
      qc.invalidateQueries({ queryKey: ["app-reviews", appId] });
      qc.invalidateQueries({ queryKey: ["admin-applications"] });
    },
    onError: (e) => setSaveError(e instanceof ApiError ? e.message : "تعذّر حفظ التقييم"),
  });
  const busy = saveMut.isPending;

  const others = (data?.reviews ?? []).filter((r) => r.id !== mine?.id);

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] tracking-[0.14em] uppercase text-foreground/60 font-semibold">تقييم المتقدّم</div>
        {data && data.count > 0 && (
          <span className="text-[12px] text-foreground/70">المعدّل <strong className="text-amber-300">{data.avg?.toFixed(1)}</strong> · {data.count} تقييم</span>
        )}
      </div>

      {/* My score */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" disabled={busy} onClick={() => { setScore(n); setDirty(true); }} aria-label={`${n} نجوم`} data-testid={`score-${appId}-${n}`} className="p-0.5 disabled:opacity-60">
              <Star className={`w-5 h-5 transition-colors ${n <= score ? "text-amber-400 fill-current" : "text-foreground/25"}`} />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-card rounded-lg p-1 border border-border">
          {["advance", "hold", "reject"].map((r) => (
            <button key={r} type="button" disabled={busy} onClick={() => { setRec(r); setDirty(true); }} className={`px-2.5 h-7 rounded-md text-[12px] font-semibold transition-colors disabled:opacity-60 ${rec === r ? `bg-muted ${REC_TONE[r]}` : "text-foreground/50 hover:text-foreground/80"}`}>
              {REC_LABEL[r]}
            </button>
          ))}
        </div>
      </div>
      <Textarea
        value={notes}
        disabled={busy}
        onChange={(e) => { setNotes(e.target.value); setDirty(true); }}
        rows={2}
        placeholder="سبب تقييمك (يراه فريق التقييم فقط)… بدون رمزَي < و >"
        className="rounded-xl border-border bg-card focus-visible:ring-primary/30 text-[13px]"
      />
      {saveError && <div className="text-[12px] text-rose-400">{saveError}</div>}
      <div className="flex justify-end">
        <Button type="button" size="sm" disabled={score === 0 || busy} onClick={() => saveMut.mutate()} data-testid={`save-review-${appId}`} className="bg-[hsl(var(--primary-cta))] text-white hover:opacity-90 h-8">
          {busy ? "جارِ الحفظ…" : mine ? "تحديث تقييمي" : "حفظ التقييم"}
        </Button>
      </div>

      {/* Team's reviews */}
      {others.length > 0 && (
        <div className="pt-3 border-t border-border space-y-2">
          <div className="text-[10px] tracking-[0.14em] uppercase text-foreground/45 font-semibold">تقييمات الفريق</div>
          {others.map((r) => (
            <div key={r.id} className="flex items-start gap-2 text-[12.5px]">
              <span className="font-semibold text-foreground/80 shrink-0">{r.reviewerName}</span>
              <span className="inline-flex items-center gap-0.5 text-amber-300 shrink-0"><Star className="w-3 h-3 fill-current" />{r.score}</span>
              <span className={`shrink-0 font-semibold ${REC_TONE[r.recommendation]}`}>{REC_LABEL[r.recommendation]}</span>
              {r.notes && <span className="text-foreground/55 break-words">— {r.notes}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
