import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Lock } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Switch } from "@/components/ui/switch";

interface PageRow {
  key: string;
  label: { ar: string; en: string };
  protected: boolean;
  hidden: boolean;
}

export default function AdminPages() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pages"],
    queryFn: () => api<{ pages: PageRow[] }>("/admin/pages"),
  });
  const [hidden, setHidden] = useState<Set<string> | null>(null);
  useEffect(() => {
    if (data?.pages) setHidden(new Set(data.pages.filter((p) => p.hidden).map((p) => p.key)));
  }, [data]);

  const save = useMutation({
    mutationFn: (h: string[]) => api("/admin/pages", { method: "PUT", body: JSON.stringify({ hidden: h }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "pages"] }),
  });

  if (isLoading || !hidden || !data) {
    return <div className="text-center py-16 text-foreground/60 text-sm">جارٍ التحميل…</div>;
  }

  const toggle = (key: string) =>
    setHidden((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  const protectedPages = data.pages.filter((p) => p.protected);
  const managedPages = data.pages.filter((p) => !p.protected);

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-[20px] font-bold text-foreground">إدارة الصفحات</h1>
        <p className="mt-1 text-[13.5px] text-foreground/60 leading-relaxed">
          أظهِر أو أخفِ أي صفحة من الموقع العامّ. الصفحة المخفيّة تختفي من التنقّل تلقائيًّا، ونقر
          رابطها يعرض صفحة أنيقة «غير متاح حاليًّا» (لا خطأ ٤٠٤). الصفحات المحميّة لا يمكن إخفاؤها.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
        {managedPages.map((p) => {
          const isHidden = hidden.has(p.key);
          return (
            <label
              key={p.key}
              className="flex items-center justify-between gap-4 px-4 py-3.5 cursor-pointer"
            >
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-foreground">{p.label.ar}</div>
                <div className="text-[11.5px] text-foreground/45 tabular-nums" dir="ltr">{p.key}</div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <span
                  className={`text-[12px] font-semibold ${isHidden ? "text-rose-400" : "text-emerald-500"}`}
                >
                  {isHidden ? "مخفيّة" : "ظاهرة"}
                </span>
                <Switch checked={!isHidden} onCheckedChange={() => toggle(p.key)} />
              </div>
            </label>
          );
        })}
      </section>

      <div>
        <div className="text-[12px] font-semibold text-foreground/45 mb-2">
          صفحات محميّة (لا تُخفى أبدًا)
        </div>
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 divide-y divide-border/60 overflow-hidden">
          {protectedPages.map((p) => (
            <div key={p.key} className="flex items-center justify-between gap-4 px-4 py-2.5">
              <div className="min-w-0">
                <div className="text-[13.5px] font-medium text-foreground/70">{p.label.ar}</div>
                <div className="text-[11px] text-foreground/40 tabular-nums" dir="ltr">{p.key}</div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-foreground/40">
                <Lock className="w-3.5 h-3.5" /> محميّة
              </span>
            </div>
          ))}
        </div>
      </div>

      {save.isError && (
        <div className="text-[13px] text-rose-400 font-medium">
          {save.error instanceof ApiError ? save.error.message : "تعذّر الحفظ."}
        </div>
      )}

      <div className="flex items-center gap-3 sticky bottom-4 bg-background/80 backdrop-blur rounded-full">
        <button
          type="button"
          disabled={save.isPending}
          onClick={() => save.mutate([...hidden])}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[hsl(var(--primary-cta))] text-white font-semibold text-[13.5px] hover:shadow-soft-hover transition-shadow disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          حفظ التعديلات
        </button>
        {save.isSuccess && !save.isPending && (
          <span className="text-[13px] text-emerald-500 font-medium">تم الحفظ ✓</span>
        )}
      </div>
    </div>
  );
}
