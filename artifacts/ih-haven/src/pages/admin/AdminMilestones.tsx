import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import {
  VENTURE_MILESTONE_TYPE_LABELS,
  type VentureMilestoneType,
} from "@/lib/labels";
import { Modal, Field, SaveBar } from "./adminShared";

interface Row {
  id: number;
  ventureId: number;
  title: string;
  body: string;
  type: VentureMilestoneType;
  achievedAt: string;
  amount: number | null;
  metricValue: number | null;
  link: string;
  sortOrder: number;
}

interface VentureLite {
  id: number;
  name: string;
}

// datetime-local <-> ISO helpers (interpret the picker value as local time).
function isoToLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours(),
  )}:${p(d.getMinutes())}`;
}

export default function AdminMilestones() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [ventures, setVentures] = useState<VentureLite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | "new" | null>(null);

  const ventureName = (id: number) =>
    ventures.find((v) => v.id === id)?.name ?? `#${id}`;

  async function reload() {
    try {
      const [m, v] = await Promise.all([
        api<{ milestones: Row[] }>("/admin/milestones"),
        api<{ ventures: VentureLite[] }>("/admin/ventures"),
      ]);
      setRows(m.milestones);
      setVentures(v.ventures);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }
  useEffect(() => {
    void reload();
  }, []);

  async function onDelete(id: number) {
    if (!window.confirm("حذف هذه المحطّة؟")) return;
    await api(`/admin/milestones/${id}`, { method: "DELETE" });
    void reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">
            محطّات المشاريع (Milestones)
          </h2>
          <p className="text-[13px] text-foreground/65 mt-1">
            الخطّ الزمنيّ لإنجازات كلّ مشروع — يظهر في صفحة المشروع.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          disabled={ventures.length === 0}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-[hsl(var(--primary-cta))] text-white text-[13px] font-semibold hover:shadow-soft-hover transition-shadow disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> محطّة جديدة
        </button>
      </div>
      {error && (
        <div className="rounded-2xl px-4 py-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[13px]">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {rows === null ? (
          <div className="p-8 text-center text-foreground/60">جارِ التحميل…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-foreground/65 text-[14px]">
            لا محطّات بعد — أضف أوّل محطّة لمشروع.
          </div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/40 text-foreground/65 text-[11.5px] tracking-[0.05em] uppercase">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">المشروع</th>
                <th className="text-right px-4 py-3 font-semibold">المحطّة</th>
                <th className="text-right px-4 py-3 font-semibold">النوع</th>
                <th className="text-right px-4 py-3 font-semibold">التاريخ</th>
                <th className="text-right px-4 py-3 font-semibold w-1">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-border hover:bg-muted/20"
                >
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {ventureName(r.ventureId)}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">{r.title}</td>
                  <td className="px-4 py-3 text-foreground/65">
                    {VENTURE_MILESTONE_TYPE_LABELS[r.type]}
                  </td>
                  <td className="px-4 py-3 text-foreground/65 tabular-nums">
                    {new Date(r.achievedAt).toLocaleDateString("ar-EG")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="تعديل المحطّة"
                        onClick={() => setEditing(r)}
                        className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65 hover:text-primary transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="حذف المحطّة"
                        onClick={() => onDelete(r.id)}
                        className="p-2 rounded-lg hover:bg-rose-500/15 text-foreground/65 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <MilestoneEditor
          initial={editing}
          ventures={ventures}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void reload();
          }}
        />
      )}
    </div>
  );
}

function MilestoneEditor({
  initial,
  ventures,
  onClose,
  onSaved,
}: {
  initial: Row | "new";
  ventures: VentureLite[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = initial === "new";
  const [ventureId, setVentureId] = useState<number>(
    isNew ? (ventures[0]?.id ?? 0) : initial.ventureId,
  );
  const [title, setTitle] = useState(isNew ? "" : initial.title);
  const [body, setBody] = useState(isNew ? "" : initial.body);
  const [type, setType] = useState<VentureMilestoneType>(
    isNew ? "other" : initial.type,
  );
  const [achievedAt, setAchievedAt] = useState(
    isNew ? isoToLocal(new Date().toISOString()) : isoToLocal(initial.achievedAt),
  );
  const [amount, setAmount] = useState(
    isNew || initial.amount === null ? "" : String(initial.amount),
  );
  const [metricValue, setMetricValue] = useState(
    isNew || initial.metricValue === null ? "" : String(initial.metricValue),
  );
  const [link, setLink] = useState(isNew ? "" : initial.link);
  const [sortOrder, setSortOrder] = useState(isNew ? 0 : initial.sortOrder);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const body_ = {
        ventureId,
        title,
        body,
        type,
        achievedAt: new Date(achievedAt).toISOString(),
        amount: amount.trim() === "" ? null : Number(amount),
        metricValue: metricValue.trim() === "" ? null : Number(metricValue),
        link,
        sortOrder,
      };
      await api(
        isNew ? "/admin/milestones" : `/admin/milestones/${initial.id}`,
        { method: isNew ? "POST" : "PATCH", body: JSON.stringify(body_) },
      );
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحفظ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={isNew ? "محطّة جديدة" : "تعديل المحطّة"} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="المشروع">
            <select
              value={ventureId}
              onChange={(e) => setVentureId(Number(e.target.value))}
              className="inp"
            >
              {ventures.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="النّوع">
            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value as VentureMilestoneType)
              }
              className="inp"
            >
              {(
                Object.keys(
                  VENTURE_MILESTONE_TYPE_LABELS,
                ) as VentureMilestoneType[]
              ).map((k) => (
                <option key={k} value={k}>
                  {VENTURE_MILESTONE_TYPE_LABELS[k]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="العنوان">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="inp"
            maxLength={200}
          />
        </Field>
        <Field label="الوصف (اختياري)">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="inp resize-none"
            rows={3}
            maxLength={4000}
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="تاريخ الإنجاز">
            <input
              type="datetime-local"
              value={achievedAt}
              onChange={(e) => setAchievedAt(e.target.value)}
              className="inp"
            />
          </Field>
          <Field label="الترتيب">
            <input
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              className="inp tabular-nums"
            />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="المبلغ (اختياري — للتمويل)">
            <input
              dir="ltr"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="inp tabular-nums"
              placeholder="$"
            />
          </Field>
          <Field label="قيمة مؤشّر (اختياري)">
            <input
              dir="ltr"
              type="number"
              min={0}
              value={metricValue}
              onChange={(e) => setMetricValue(e.target.value)}
              className="inp tabular-nums"
              placeholder="مثل عدد المستخدمين"
            />
          </Field>
        </div>
        <Field label="رابط (اختياري)">
          <input
            dir="ltr"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="inp"
            maxLength={800}
            placeholder="https://"
          />
        </Field>
        {error && (
          <div className="rounded-xl px-4 py-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[13px]">
            {error}
          </div>
        )}
        <SaveBar submitting={submitting} isNew={isNew} onClose={onClose} />
      </form>
    </Modal>
  );
}
