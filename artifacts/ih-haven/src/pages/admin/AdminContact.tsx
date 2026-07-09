import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Inbox, Search, Mail, Check, Archive, Trash2, CornerUpLeft } from "lucide-react";
import { api } from "@/lib/api";

// Admin inbox for public contact-form submissions — triage (new → read →
// handled/archived), search, reply by email. Gated by contact:view/manage.

interface ContactMsg {
  id: number;
  name: string;
  email: string;
  subject: string;
  enquiry: string;
  message: string;
  status: "new" | "read" | "handled" | "archived";
  createdAt: string;
  handledAt: string | null;
}

const ENQUIRY_LABELS: Record<string, string> = {
  general: "استفسار عامّ",
  join: "الانضمام",
  partner: "شراكة",
  mentor: "إرشاد",
  press: "صحافة",
  other: "أخرى",
};

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "", label: "الكلّ" },
  { key: "new", label: "جديدة" },
  { key: "read", label: "مقروءة" },
  { key: "handled", label: "مُعالَجة" },
  { key: "archived", label: "مؤرشفة" },
];

const STATUS_BADGE: Record<string, string> = {
  new: "bg-primary/15 text-primary",
  read: "bg-sky-500/15 text-sky-400",
  handled: "bg-emerald-500/15 text-emerald-400",
  archived: "bg-foreground/10 text-foreground/50",
};
const STATUS_LABEL: Record<string, string> = { new: "جديدة", read: "مقروءة", handled: "مُعالَجة", archived: "مؤرشفة" };

const PAGE = 50;

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminContact() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(0);

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (q.trim()) params.set("q", q.trim());
  params.set("limit", String(PAGE));
  params.set("offset", String(offset));

  const { data, isFetching } = useQuery({
    queryKey: ["admin-contact", status, q, offset],
    queryFn: () =>
      api<{ messages: ContactMsg[]; total: number; counts: Record<string, number> }>(
        `/admin/contact?${params.toString()}`,
      ),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });

  const setStatusMut = useMutation({
    mutationFn: ({ id, next }: { id: number; next: string }) =>
      api(`/admin/contact/${id}`, { method: "PATCH", body: JSON.stringify({ status: next }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-contact"] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => api(`/admin/contact/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-contact"] }),
  });

  const rows = data?.messages ?? [];
  const total = data?.total ?? 0;
  const counts = data?.counts ?? {};

  return (
    <div dir="rtl">
      <div className="mb-5">
        <h2 className="text-[20px] font-bold text-foreground flex items-center gap-2">
          <Inbox className="w-5 h-5 text-primary" /> رسائل التواصل
        </h2>
        <p className="text-[13px] text-foreground/60 mt-1">الرسائل الواردة من نموذج «تواصل معنا» في الموقع.</p>
      </div>

      {/* Status tabs + search */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((s) => {
            const on = status === s.key;
            const n = s.key ? counts[s.key] : undefined;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  setStatus(s.key);
                  setOffset(0);
                }}
                data-testid={`contact-tab-${s.key || "all"}`}
                className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold border transition-colors ${
                  on ? "bg-primary text-primary-foreground border-primary" : "bg-foreground/[0.04] text-foreground/70 border-border hover:text-foreground"
                }`}
              >
                {s.label}
                {n !== undefined && n > 0 && <span className={on ? "text-white/70" : "text-foreground/45"}> · {n}</span>}
              </button>
            );
          })}
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-foreground/40" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOffset(0);
            }}
            placeholder="بحث…"
            data-testid="contact-search"
            className="w-full h-10 pr-9 pl-3 rounded-xl bg-muted/40 border border-border text-[13px] text-foreground outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Messages */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border text-foreground/55 text-[13px] text-center py-16">
          {isFetching ? "جارِ التحميل…" : "لا رسائل."}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((m) => (
            <div key={m.id} data-testid={`contact-msg-${m.id}`} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-bold text-foreground">{m.name}</span>
                    <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[m.status]}`}>{STATUS_LABEL[m.status]}</span>
                    {m.enquiry && <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-foreground/[0.06] text-foreground/60">{ENQUIRY_LABELS[m.enquiry] ?? m.enquiry}</span>}
                  </div>
                  <a href={`mailto:${m.email}`} className="text-[12px] text-foreground/55 hover:text-primary transition-colors" dir="ltr">{m.email}</a>
                </div>
                <span className="text-[11px] text-foreground/45 shrink-0 tabular-nums">{fmt(m.createdAt)}</span>
              </div>
              {m.subject && <div className="mt-2 text-[13px] font-semibold text-foreground/85">{m.subject}</div>}
              <p className="mt-1.5 text-[13px] text-foreground/70 leading-relaxed whitespace-pre-wrap break-words">{m.message}</p>
              <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 flex-wrap">
                <a
                  href={`mailto:${m.email}?subject=${encodeURIComponent("رد: " + (m.subject || "رسالتك إلى آيلاند هيفن"))}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[12px] font-semibold h-8 px-3 transition-colors"
                >
                  <CornerUpLeft className="w-3.5 h-3.5" /> ردّ بالبريد
                </a>
                {m.status !== "read" && m.status !== "handled" && (
                  <button type="button" onClick={() => setStatusMut.mutate({ id: m.id, next: "read" })} className="inline-flex items-center gap-1.5 rounded-lg bg-foreground/[0.05] hover:bg-foreground/10 text-foreground/75 text-[12px] font-semibold h-8 px-3 transition-colors">
                    <Mail className="w-3.5 h-3.5" /> مقروءة
                  </button>
                )}
                {m.status !== "handled" && (
                  <button type="button" onClick={() => setStatusMut.mutate({ id: m.id, next: "handled" })} data-testid={`contact-handle-${m.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[12px] font-semibold h-8 px-3 transition-colors">
                    <Check className="w-3.5 h-3.5" /> تمّت المعالجة
                  </button>
                )}
                {m.status !== "archived" && (
                  <button type="button" onClick={() => setStatusMut.mutate({ id: m.id, next: "archived" })} className="inline-flex items-center gap-1.5 rounded-lg bg-foreground/[0.05] hover:bg-foreground/10 text-foreground/60 text-[12px] font-semibold h-8 px-3 transition-colors">
                    <Archive className="w-3.5 h-3.5" /> أرشفة
                  </button>
                )}
                <button type="button" onClick={() => { if (window.confirm("حذف هذه الرسالة نهائيًّا؟")) deleteMut.mutate(m.id); }} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[12px] font-semibold h-8 px-3 transition-colors ms-auto">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > PAGE && (
        <div className="flex items-center justify-between mt-4 text-[12.5px] text-foreground/65">
          <span className="tabular-nums">{offset + 1}–{Math.min(offset + PAGE, total)} من {total}</span>
          <div className="flex items-center gap-1.5">
            <button type="button" disabled={offset === 0} onClick={() => setOffset((o) => Math.max(0, o - PAGE))} className="rounded-lg bg-foreground/[0.05] hover:bg-foreground/10 disabled:opacity-40 h-8 px-3 font-semibold">السابق</button>
            <button type="button" disabled={offset + PAGE >= total} onClick={() => setOffset((o) => o + PAGE)} className="rounded-lg bg-foreground/[0.05] hover:bg-foreground/10 disabled:opacity-40 h-8 px-3 font-semibold">التالي</button>
          </div>
        </div>
      )}
    </div>
  );
}
