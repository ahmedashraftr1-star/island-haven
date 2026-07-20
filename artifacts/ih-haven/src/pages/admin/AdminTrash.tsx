import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Trash2, Inbox, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useConfirm } from "@/hooks/use-confirm";

type TrashSummary = { entity: string; label: { ar: string; en: string }; count: number };
type TrashItem = { id: number; name: string | null; deletedAt: string };

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });

export default function AdminTrash() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [selected, setSelected] = useState<string | null>(null);

  const { data: summary } = useQuery({
    queryKey: ["admin", "trash"],
    queryFn: () => api<{ entities: TrashSummary[] }>("/admin/trash"),
  });
  const entities = summary?.entities ?? [];
  const active = selected ?? entities[0]?.entity ?? null;

  const { data: list, isLoading } = useQuery({
    queryKey: ["admin", "trash", active],
    queryFn: () => api<{ items: TrashItem[]; label: { ar: string; en: string } }>(`/admin/trash/${active}`),
    enabled: !!active,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "trash"] });
    if (active) qc.invalidateQueries({ queryKey: ["admin", active] });
  };

  const restore = useMutation({
    mutationFn: (id: number) => api(`/admin/trash/${active}/${id}/restore`, { method: "POST" }),
    onSuccess: invalidate,
  });

  async function onRestore(item: TrashItem) {
    const ok = await confirm({
      title: "استعادة العنصر",
      message: `سيعود «${item.name || "بلا عنوان"}» إلى مكانه.`,
      confirmLabel: "استعادة",
    });
    if (ok) restore.mutate(item.id);
  }

  async function onPurge(item: TrashItem) {
    const ok = await confirm({
      title: "حذف نهائيّ",
      message: `سيُحذف «${item.name || "بلا عنوان"}» نهائيًّا بلا أي إمكانيّة استرجاع.`,
      danger: true,
      doubleConfirm: true,
      confirmLabel: "حذف نهائيّ",
    });
    if (!ok) return;
    try {
      await api(`/admin/trash/${active}/${item.id}/purge`, { method: "DELETE" });
      invalidate();
    } catch (e) {
      // Permanent delete is gated OFF server-side (403) until the owner enables it.
      await confirm({
        title: "الحذف النهائيّ معطَّل",
        message: e instanceof ApiError ? e.message : "بانتظار تفعيل صريح من المالك — لا يمكن فقدان بيانات.",
        confirmLabel: "حسنًا",
        cancelLabel: "",
      });
    }
  }

  const items = list?.items ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[20px] font-bold text-foreground">المحذوفات</h1>
        <p className="mt-1 text-[13.5px] text-foreground/60">
          كل ما حُذف يُحفَظ هنا ويمكن استعادته. الحذف النهائيّ معطَّل حتى تفعيل المالك.
        </p>
      </header>

      {/* Entity tabs with counts */}
      <div className="flex flex-wrap gap-2">
        {entities.map((e) => (
          <button
            key={e.entity}
            type="button"
            onClick={() => setSelected(e.entity)}
            className={
              "inline-flex items-center gap-2 rounded-full px-4 min-h-[40px] text-[13px] font-semibold transition-colors border " +
              (active === e.entity
                ? "bg-primary text-white border-primary"
                : "bg-card text-foreground/70 border-border hover:text-foreground")
            }
          >
            {e.label.ar}
            <span
              className={
                "inline-flex min-w-5 h-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums " +
                (active === e.entity ? "bg-white/25" : "bg-foreground/10 text-foreground/70")
              }
            >
              {e.count}
            </span>
          </button>
        ))}
      </div>

      {/* Items */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-foreground/50 py-10 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> جارٍ التحميل…
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border">
          <Inbox className="w-10 h-10 mx-auto text-foreground/25 mb-3" aria-hidden />
          <div className="text-[15px] font-semibold text-foreground/70">السلّة فارغة</div>
          <div className="mt-1 text-[13px] text-foreground/50">لا عناصر محذوفة في هذا القسم.</div>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
            >
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-foreground truncate">{item.name || "بلا عنوان"}</div>
                <div className="mt-0.5 text-[12px] text-foreground/50">
                  حُذف في <span dir="ltr" className="tabular-nums">{fmtDate(item.deletedAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onRestore(item)}
                  disabled={restore.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 min-h-[40px] text-[13px] font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden /> استعادة
                </button>
                <button
                  type="button"
                  onClick={() => onPurge(item)}
                  aria-label="حذف نهائيّ"
                  title="حذف نهائيّ (معطَّل)"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 text-destructive px-3 min-h-[40px] text-[13px] font-semibold transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden /> حذف نهائيّ
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
