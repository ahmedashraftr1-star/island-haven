import { useEffect, useState } from "react";
import { Trash2, Download } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useConfirm } from "@/hooks/use-confirm";

interface Row {
  id: number;
  email: string;
  name: string;
  status: "active" | "unsubscribed";
  subscribedAt: string;
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminNewsletter() {
  const confirm = useConfirm();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    try {
      setRows((await api<{ subscribers: Row[] }>("/admin/newsletter")).subscribers);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }

  useEffect(() => { void reload(); }, []);

  async function onDelete(id: number) {
    if (!(await confirm({ title: "تأكيد الحذف", message: "حذف هذا المشترك؟", confirmLabel: "حذف", danger: true }))) return;
    await api(`/admin/newsletter/${id}`, { method: "DELETE" });
    void reload();
  }

  function exportCsv() {
    if (!rows) return;
    const active = rows.filter((r) => r.status === "active");
    const csv = ["الاسم,البريد الإلكتروني,تاريخ الاشتراك", ...active.map((r) => `${r.name},${r.email},${fmt(r.subscribedAt)}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "newsletter-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const active = rows?.filter((r) => r.status === "active") ?? [];
  const total = rows?.length ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">النشرة الإخبارية</h2>
          <p className="text-[13px] text-foreground/65 mt-1">
            {rows !== null ? `${active.length} مشترك نشط من أصل ${total}` : "جارِ التحميل…"}
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!rows || active.length === 0}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-full border border-border text-foreground/70 text-[13px] font-medium hover:bg-muted transition-colors disabled:opacity-40"
        >
          <Download className="w-4 h-4" /> تصدير CSV
        </button>
      </div>

      {/* Summary cards */}
      {rows !== null && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-card border border-border p-5">
            <div className="text-[28px] font-black text-foreground">{active.length}</div>
            <div className="text-[12px] text-foreground/60 mt-1">مشترك نشط</div>
          </div>
          <div className="rounded-2xl bg-card border border-border p-5">
            <div className="text-[28px] font-black text-foreground">{rows.filter(r => r.status === "unsubscribed").length}</div>
            <div className="text-[12px] text-foreground/60 mt-1">ألغى الاشتراك</div>
          </div>
          <div className="rounded-2xl bg-card border border-border p-5">
            <div className="text-[28px] font-black text-foreground">{total}</div>
            <div className="text-[12px] text-foreground/60 mt-1">إجمالي السجلات</div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl px-4 py-3 bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[13px]">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {rows === null ? (
          <div className="p-8 text-center text-foreground/60">جارِ التحميل…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-foreground/65 text-[14px]">لا مشتركين بعد.</div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/40 text-foreground/65 text-[11.5px] tracking-[0.05em] uppercase">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">البريد الإلكتروني</th>
                <th className="text-right px-4 py-3 font-semibold">الاسم</th>
                <th className="text-right px-4 py-3 font-semibold">تاريخ الاشتراك</th>
                <th className="text-right px-4 py-3 font-semibold">الحالة</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{row.email}</td>
                  <td className="px-4 py-3 text-foreground/60">{row.name || "—"}</td>
                  <td className="px-4 py-3 text-foreground/60">{fmt(row.subscribedAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      row.status === "active"
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : "bg-muted text-foreground/70 border-border"
                    }`}>
                      {row.status === "active" ? "نشط" : "ألغى الاشتراك"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      aria-label="حذف المشترك"
                      onClick={() => onDelete(row.id)}
                      className="p-1.5 rounded-lg text-foreground/55 hover:bg-rose-500/15 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
