import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ScrollText, Search, ChevronRight, ChevronLeft, User } from "lucide-react";
import { api } from "@/lib/api";

// Read-only audit trail viewer — who did what, when. Filter by actor/action or
// free-text search across every field; paginated. Gated by audit:view.

interface AuditRow {
  id: number;
  actor: string;
  action: string;
  targetType: string;
  targetId: string;
  oldValue: string;
  newValue: string;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  user_status_changed: "تغيير حالة مستخدم",
  user_role_changed: "تغيير دور مستخدم",
  story_status_changed: "مراجعة قصّة نجاح",
  work_status_changed: "مراجعة عمل",
  admin_account_created: "إنشاء حساب فريق",
  admin_account_updated: "تعديل حساب فريق",
  admin_account_deleted: "حذف حساب فريق",
  broadcast_sent: "إرسال إعلان عامّ",
};

const PAGE = 50;

function fmt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminAudit() {
  const [q, setQ] = useState("");
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [offset, setOffset] = useState(0);

  const facetsQ = useQuery({
    queryKey: ["admin-audit-facets"],
    queryFn: () => api<{ actions: string[]; actors: string[] }>("/admin/audit/facets"),
    staleTime: 60_000,
  });

  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (actor) params.set("actor", actor);
  if (action) params.set("action", action);
  params.set("limit", String(PAGE));
  params.set("offset", String(offset));

  const { data, isFetching } = useQuery({
    queryKey: ["admin-audit", q, actor, action, offset],
    queryFn: () => api<{ audit: AuditRow[]; total: number }>(`/admin/audit?${params.toString()}`),
    placeholderData: keepPreviousData,
  });

  const rows = data?.audit ?? [];
  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + PAGE, total);

  const resetTo = (fn: () => void) => {
    fn();
    setOffset(0);
  };

  return (
    <div dir="rtl">
      <div className="mb-5">
        <h2 className="text-[20px] font-bold text-foreground flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-primary" /> سجلّ التدقيق
        </h2>
        <p className="text-[13px] text-foreground/60 mt-1">
          سِجلّ غير قابل للتعديل لكلّ إجراء حسّاس — مَن فعل ماذا ومتى.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-foreground/40" />
          <input
            value={q}
            onChange={(e) => resetTo(() => setQ(e.target.value))}
            placeholder="بحث في السجلّ…"
            data-testid="audit-search"
            className="w-full h-10 pr-9 pl-3 rounded-xl bg-muted/40 border border-border text-[13px] text-foreground outline-none focus:border-primary/50"
          />
        </div>
        <select
          value={action}
          onChange={(e) => resetTo(() => setAction(e.target.value))}
          data-testid="audit-action"
          className="h-10 px-3 rounded-xl bg-muted/40 border border-border text-[13px] text-foreground outline-none focus:border-primary/50"
        >
          <option value="">كلّ الإجراءات</option>
          {(facetsQ.data?.actions ?? []).map((a) => (
            <option key={a} value={a}>{ACTION_LABELS[a] ?? a}</option>
          ))}
        </select>
        <select
          value={actor}
          onChange={(e) => resetTo(() => setActor(e.target.value))}
          data-testid="audit-actor"
          className="h-10 px-3 rounded-xl bg-muted/40 border border-border text-[13px] text-foreground outline-none focus:border-primary/50 max-w-[200px]"
        >
          <option value="">كلّ المنفّذين</option>
          {(facetsQ.data?.actors ?? []).map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-foreground/55 text-[11.5px] border-b border-border">
                <th className="text-right font-semibold px-4 py-3 whitespace-nowrap">الوقت</th>
                <th className="text-right font-semibold px-4 py-3 whitespace-nowrap">المنفِّذ</th>
                <th className="text-right font-semibold px-4 py-3 whitespace-nowrap">الإجراء</th>
                <th className="text-right font-semibold px-4 py-3 whitespace-nowrap">الهدف</th>
                <th className="text-right font-semibold px-4 py-3">التغيير</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-foreground/50 py-14">
                    {isFetching ? "جارِ التحميل…" : "لا سجلّات مطابِقة"}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} data-testid={`audit-row-${r.id}`} className="border-b border-border/60 hover:bg-foreground/[0.02]">
                    <td className="px-4 py-3 text-foreground/70 whitespace-nowrap tabular-nums">{fmt(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-foreground/85">
                        <User className="w-3.5 h-3.5 text-foreground/40" />
                        <span className="truncate max-w-[160px]" dir="ltr">{r.actor}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap">
                        {ACTION_LABELS[r.action] ?? r.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground/70 whitespace-nowrap">
                      {r.targetType}
                      {r.targetId ? <span className="text-foreground/40"> #{r.targetId}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-foreground/60 min-w-[200px]">
                      {r.oldValue || r.newValue ? (
                        <span className="inline-flex items-center gap-1.5 flex-wrap">
                          {r.oldValue && <span className="text-foreground/45 line-through">{r.oldValue}</span>}
                          {r.oldValue && r.newValue && <ChevronLeft className="w-3 h-3 text-foreground/40" />}
                          {r.newValue && <span className="text-foreground/80">{r.newValue}</span>}
                        </span>
                      ) : (
                        <span className="text-foreground/30">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-[12.5px] text-foreground/65">
          <span className="tabular-nums">{from}–{to} من {total}</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={offset === 0}
              onClick={() => setOffset((o) => Math.max(0, o - PAGE))}
              className="grid place-items-center w-8 h-8 rounded-lg bg-foreground/[0.05] hover:bg-foreground/10 disabled:opacity-40 transition-colors"
              aria-label="السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={to >= total}
              onClick={() => setOffset((o) => o + PAGE)}
              className="grid place-items-center w-8 h-8 rounded-lg bg-foreground/[0.05] hover:bg-foreground/10 disabled:opacity-40 transition-colors"
              aria-label="التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
