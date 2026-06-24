import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import {
  PERK_CATEGORY_LABELS,
  type PerkCategory,
} from "@/lib/labels";
import { Modal, Field, SaveBar } from "./adminShared";

type Status = "draft" | "published" | "expired";

interface Row {
  id: number;
  title: string;
  partnerName: string;
  description: string;
  category: PerkCategory;
  code: string;
  url: string;
  logoUrl: string | null;
  featured: boolean;
  status: Status;
  sortOrder: number;
}

const EMPTY: Row = {
  id: 0,
  title: "",
  partnerName: "",
  description: "",
  category: "tool",
  code: "",
  url: "",
  logoUrl: null,
  featured: false,
  status: "draft",
  sortOrder: 0,
};

const STATUS_LABELS: Record<Status, string> = {
  draft: "مسوّدة",
  published: "منشور",
  expired: "منتهٍ",
};

export default function AdminPerks() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | "new" | null>(null);

  async function reload() {
    try {
      setRows((await api<{ perks: Row[] }>("/admin/perks")).perks);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }
  useEffect(() => {
    void reload();
  }, []);

  async function onDelete(id: number) {
    if (!window.confirm("حذف هذا العرض؟")) return;
    await api(`/admin/perks/${id}`, { method: "DELETE" });
    void reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">
            العروض والامتيازات
          </h2>
          <p className="text-[13px] text-foreground/65 mt-1">
            خصومات وأرصدة وعروض حصريّة من الشركاء — امتيازات المنتسبين.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:shadow-soft-hover transition-shadow"
        >
          <Plus className="w-4 h-4" /> عرض جديد
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
            لا عروض بعد.
          </div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/40 text-foreground/65 text-[11.5px] tracking-[0.05em] uppercase">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">العرض</th>
                <th className="text-right px-4 py-3 font-semibold">التصنيف</th>
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
                    {r.partnerName && (
                      <div className="text-[11.5px] text-foreground/60 mt-0.5">
                        {r.partnerName}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground/65">
                    {PERK_CATEGORY_LABELS[r.category]}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        r.status === "published"
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : "bg-muted text-foreground/70 border border-border"
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
                        aria-label="تعديل العرض"
                        className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65 hover:text-primary transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(r.id)}
                        aria-label="حذف العرض"
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
        <PerkEditor
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

function PerkEditor({
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
      await api(isNew ? "/admin/perks" : `/admin/perks/${initial.id}`, {
        method: isNew ? "POST" : "PATCH",
        body: JSON.stringify({ ...body, logoUrl: body.logoUrl || null }),
      });
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحفظ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={isNew ? "عرض جديد" : "تعديل العرض"} onClose={onClose}>
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
          <Field label="اسم الشريك">
            <input
              value={form.partnerName}
              onChange={(e) =>
                setForm((s) => ({ ...s, partnerName: e.target.value }))
              }
              className="inp"
              maxLength={200}
            />
          </Field>
          <Field label="التصنيف">
            <select
              value={form.category}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  category: e.target.value as PerkCategory,
                }))
              }
              className="inp"
            >
              {(Object.keys(PERK_CATEGORY_LABELS) as PerkCategory[]).map((k) => (
                <option key={k} value={k}>
                  {PERK_CATEGORY_LABELS[k]}
                </option>
              ))}
            </select>
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
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="رمز العرض (اختياري)">
            <input
              dir="ltr"
              value={form.code}
              onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
              className="inp"
              maxLength={80}
              placeholder="ISLAND20"
            />
          </Field>
          <Field label="رابط العرض">
            <input
              dir="ltr"
              value={form.url}
              onChange={(e) => setForm((s) => ({ ...s, url: e.target.value }))}
              className="inp"
              maxLength={400}
              placeholder="https://"
            />
          </Field>
        </div>
        <Field label="رابط الشّعار (اختياري)">
          <input
            dir="ltr"
            value={form.logoUrl ?? ""}
            onChange={(e) =>
              setForm((s) => ({ ...s, logoUrl: e.target.value || null }))
            }
            className="inp"
            maxLength={400}
            placeholder="https://"
          />
        </Field>
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
              <option value="expired">منتهٍ</option>
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
          عرض مميّز
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
