import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import {
  OPPORTUNITY_TYPE_LABELS,
  OPPORTUNITY_LOCATION_LABELS,
  type OpportunityType,
  type OpportunityLocation,
} from "@/lib/labels";
import { Modal, Field, SaveBar } from "./adminShared";

type Status = "draft" | "published" | "closed";

interface Row {
  id: number;
  title: string;
  organization: string;
  type: OpportunityType;
  locationType: OpportunityLocation;
  city: string;
  description: string;
  skills: string;
  compensation: string;
  applyUrl: string;
  applyEmail: string;
  deadline: string | null;
  featured: boolean;
  status: Status;
  sortOrder: number;
}

const EMPTY: Row = {
  id: 0,
  title: "",
  organization: "",
  type: "job",
  locationType: "onsite",
  city: "",
  description: "",
  skills: "",
  compensation: "",
  applyUrl: "",
  applyEmail: "",
  deadline: null,
  featured: false,
  status: "draft",
  sortOrder: 0,
};

const STATUS_LABELS: Record<Status, string> = {
  draft: "مسوّدة",
  published: "منشور",
  closed: "مغلق",
};

export default function AdminOpportunities() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | "new" | null>(null);

  async function reload() {
    try {
      setRows(
        (await api<{ opportunities: Row[] }>("/admin/opportunities"))
          .opportunities,
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }
  useEffect(() => {
    void reload();
  }, []);

  async function onDelete(id: number) {
    if (!window.confirm("حذف هذه الفرصة؟")) return;
    await api(`/admin/opportunities/${id}`, { method: "DELETE" });
    void reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">الفرص والوظائف</h2>
          <p className="text-[13px] text-foreground/55 mt-1">
            وظائف وفرص من الشركاء والمشاريع — جسر المنتسبين لسوق العمل.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:shadow-soft-hover transition-shadow"
        >
          <Plus className="w-4 h-4" /> فرصة جديدة
        </button>
      </div>
      {error && (
        <div className="rounded-2xl px-4 py-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[13px]">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {rows === null ? (
          <div className="p-8 text-center text-foreground/45">جارِ التحميل…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-foreground/55 text-[14px]">
            لا فرص بعد.
          </div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/40 text-foreground/55 text-[11.5px] tracking-[0.05em] uppercase">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">الفرصة</th>
                <th className="text-right px-4 py-3 font-semibold">النوع</th>
                <th className="text-right px-4 py-3 font-semibold">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold w-1">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      {r.featured && (
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      )}
                      {r.title}
                    </div>
                    {r.organization && (
                      <div className="text-[11.5px] text-foreground/45 mt-0.5">
                        {r.organization}
                        {r.city ? ` · ${r.city}` : ""}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground/65">
                    {OPPORTUNITY_TYPE_LABELS[r.type]}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        r.status === "published"
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : "bg-muted text-foreground/55 border border-border"
                      }`}
                    >
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(r)}
                        aria-label="تعديل الفرصة"
                        className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65 hover:text-primary"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(r.id)}
                        aria-label="حذف الفرصة"
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
        <OpportunityEditor
          initial={editing === "new" ? { ...EMPTY } : editing}
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

function OpportunityEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: Row;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = initial.id === 0;
  const [form, setForm] = useState<Row>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const { id: _id, ...body } = form;
      void _id;
      await api(
        isNew ? "/admin/opportunities" : `/admin/opportunities/${initial.id}`,
        {
          method: isNew ? "POST" : "PATCH",
          body: JSON.stringify({ ...body, deadline: body.deadline || null }),
        },
      );
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحفظ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={isNew ? "فرصة جديدة" : "تعديل الفرصة"} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="p-6 space-y-4">
        <Field label="العنوان">
          <input
            value={form.title}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
            className="inp"
            maxLength={200}
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="الجهة / الشركة">
            <input
              value={form.organization}
              onChange={(e) =>
                setForm((s) => ({ ...s, organization: e.target.value }))
              }
              className="inp"
              maxLength={200}
            />
          </Field>
          <Field label="المدينة">
            <input
              value={form.city}
              onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
              className="inp"
              maxLength={120}
            />
          </Field>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="النوع">
            <select
              value={form.type}
              onChange={(e) =>
                setForm((s) => ({ ...s, type: e.target.value as OpportunityType }))
              }
              className="inp"
            >
              {(Object.keys(OPPORTUNITY_TYPE_LABELS) as OpportunityType[]).map(
                (k) => (
                  <option key={k} value={k}>
                    {OPPORTUNITY_TYPE_LABELS[k]}
                  </option>
                ),
              )}
            </select>
          </Field>
          <Field label="مكان العمل">
            <select
              value={form.locationType}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  locationType: e.target.value as OpportunityLocation,
                }))
              }
              className="inp"
            >
              {(
                Object.keys(OPPORTUNITY_LOCATION_LABELS) as OpportunityLocation[]
              ).map((k) => (
                <option key={k} value={k}>
                  {OPPORTUNITY_LOCATION_LABELS[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="آخر موعد (اختياري)">
            <input
              type="date"
              value={form.deadline ?? ""}
              onChange={(e) =>
                setForm((s) => ({ ...s, deadline: e.target.value || null }))
              }
              className="inp"
            />
          </Field>
        </div>
        <Field label="الوصف">
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) =>
              setForm((s) => ({ ...s, description: e.target.value }))
            }
            className="inp resize-none leading-[1.85]"
            maxLength={6000}
          />
        </Field>
        <Field label="المهارات (افصل بفاصلة)">
          <input
            value={form.skills}
            onChange={(e) => setForm((s) => ({ ...s, skills: e.target.value }))}
            className="inp"
            maxLength={500}
            placeholder="React، تصميم، تسويق…"
          />
        </Field>
        <Field label="المقابل (اختياري)">
          <input
            value={form.compensation}
            onChange={(e) =>
              setForm((s) => ({ ...s, compensation: e.target.value }))
            }
            className="inp"
            maxLength={160}
            placeholder="مثال: حسب الخبرة / غير مدفوع / 500$ شهريًّا"
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="رابط التقديم">
            <input
              dir="ltr"
              value={form.applyUrl}
              onChange={(e) =>
                setForm((s) => ({ ...s, applyUrl: e.target.value }))
              }
              className="inp"
              maxLength={400}
              placeholder="https://"
            />
          </Field>
          <Field label="أو بريد التقديم">
            <input
              dir="ltr"
              value={form.applyEmail}
              onChange={(e) =>
                setForm((s) => ({ ...s, applyEmail: e.target.value }))
              }
              className="inp"
              maxLength={160}
              placeholder="jobs@example.com"
            />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="الحالة">
            <select
              value={form.status}
              onChange={(e) =>
                setForm((s) => ({ ...s, status: e.target.value as Status }))
              }
              className="inp"
            >
              <option value="draft">مسوّدة</option>
              <option value="published">منشور</option>
              <option value="closed">مغلق</option>
            </select>
          </Field>
          <Field label="الترتيب">
            <input
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) =>
                setForm((s) => ({ ...s, sortOrder: Number(e.target.value) || 0 }))
              }
              className="inp tabular-nums"
            />
          </Field>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer text-[13px] text-foreground/75">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) =>
              setForm((s) => ({ ...s, featured: e.target.checked }))
            }
            className="w-4 h-4 accent-primary"
          />
          فرصة مميّزة
        </label>
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
