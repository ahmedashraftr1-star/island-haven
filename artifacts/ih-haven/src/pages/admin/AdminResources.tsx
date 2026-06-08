import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import {
  RESOURCE_CATEGORY_LABELS,
  RESOURCE_VISIBILITY_LABELS,
  type ResourceCategory,
  type ResourceVisibility,
} from "@/lib/labels";
import { Modal, Field, SaveBar } from "./adminShared";

interface Row {
  id: number;
  title: string;
  summary: string;
  body: string;
  category: ResourceCategory;
  visibility: ResourceVisibility;
  coverUrl: string | null;
  externalUrl: string;
  fileUrl: string;
  tags: string;
  featured: boolean;
  sortOrder: number;
}

const EMPTY: Omit<Row, "id"> = {
  title: "",
  summary: "",
  body: "",
  category: "guide",
  visibility: "members",
  coverUrl: "",
  externalUrl: "",
  fileUrl: "",
  tags: "",
  featured: false,
  sortOrder: 0,
};

export default function AdminResources() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | "new" | null>(null);

  async function reload() {
    try {
      setRows((await api<{ resources: Row[] }>("/admin/resources")).resources);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }
  useEffect(() => {
    void reload();
  }, []);

  async function onDelete(id: number) {
    if (!window.confirm("حذف هذا المورد؟")) return;
    await api(`/admin/resources/${id}`, { method: "DELETE" });
    void reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">دليل الرّائد</h2>
          <p className="text-[13px] text-foreground/55 mt-1">
            أدلّة، قوالب، أدوات، وحوافز شركاء — مع تحكّم بالظهور (عام / للمنتسبين / للإدارة).
          </p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:shadow-soft-hover transition-shadow"
        >
          <Plus className="w-4 h-4" /> مورد جديد
        </button>
      </div>
      {error && (
        <div className="rounded-2xl px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 text-[13px]">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-white border border-border overflow-hidden">
        {rows === null ? (
          <div className="p-8 text-center text-foreground/45">جارِ التحميل…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-foreground/55 text-[14px]">
            لا موارد بعد.
          </div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/40 text-foreground/55 text-[11.5px] tracking-[0.05em] uppercase">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">المورد</th>
                <th className="text-right px-4 py-3 font-semibold">التصنيف</th>
                <th className="text-right px-4 py-3 font-semibold">الظهور</th>
                <th className="text-right px-4 py-3 font-semibold w-1">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{r.title}</span>
                      {r.featured && (
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      )}
                    </div>
                    {r.summary && (
                      <div className="text-foreground/55 text-[12px] line-clamp-1 max-w-md">
                        {r.summary}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground/65">
                    {RESOURCE_CATEGORY_LABELS[r.category]}
                  </td>
                  <td className="px-4 py-3 text-foreground/65">
                    {RESOURCE_VISIBILITY_LABELS[r.visibility]}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditing(r)}
                        className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65 hover:text-primary"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(r.id)}
                        className="p-2 rounded-lg hover:bg-rose-50 text-foreground/65 hover:text-rose-600"
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
        <ResourceEditor
          initial={editing === "new" ? { ...EMPTY, id: 0 } : editing}
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

function ResourceEditor({
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
        isNew ? "/admin/resources" : `/admin/resources/${initial.id}`,
        {
          method: isNew ? "POST" : "PATCH",
          body: JSON.stringify(body),
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
    <Modal title={isNew ? "مورد جديد" : "تعديل المورد"} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="p-6 space-y-4">
        <Field label="العنوان">
          <input
            value={form.title}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
            className="inp"
            maxLength={200}
          />
        </Field>
        <Field label="ملخّص قصير">
          <input
            value={form.summary}
            onChange={(e) =>
              setForm((s) => ({ ...s, summary: e.target.value }))
            }
            className="inp"
            maxLength={400}
          />
        </Field>
        <Field label="الوصف الكامل (يدعم سطورًا متعدّدة)">
          <textarea
            value={form.body}
            onChange={(e) => setForm((s) => ({ ...s, body: e.target.value }))}
            className="inp min-h-[120px]"
            maxLength={20000}
            rows={5}
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="رابط خارجي (URL)">
            <input
              dir="ltr"
              value={form.externalUrl}
              onChange={(e) =>
                setForm((s) => ({ ...s, externalUrl: e.target.value }))
              }
              className="inp"
              maxLength={800}
              placeholder="https://"
            />
          </Field>
          <Field label="رابط ملفّ (file URL)">
            <input
              dir="ltr"
              value={form.fileUrl}
              onChange={(e) =>
                setForm((s) => ({ ...s, fileUrl: e.target.value }))
              }
              className="inp"
              maxLength={800}
              placeholder="/api/storage/..."
            />
          </Field>
        </div>
        <Field label="رابط الغلاف (cover)">
          <input
            dir="ltr"
            value={form.coverUrl ?? ""}
            onChange={(e) =>
              setForm((s) => ({ ...s, coverUrl: e.target.value }))
            }
            className="inp"
            maxLength={800}
          />
        </Field>
        <Field label="وسوم (مفصولة بفاصلة)">
          <input
            value={form.tags}
            onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))}
            className="inp"
            maxLength={400}
            placeholder="pitch-deck, fundraising, ..."
          />
        </Field>
        <div className="grid sm:grid-cols-4 gap-4">
          <Field label="التصنيف">
            <select
              value={form.category}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  category: e.target.value as ResourceCategory,
                }))
              }
              className="inp"
            >
              {(Object.keys(RESOURCE_CATEGORY_LABELS) as ResourceCategory[]).map(
                (k) => (
                  <option key={k} value={k}>
                    {RESOURCE_CATEGORY_LABELS[k]}
                  </option>
                ),
              )}
            </select>
          </Field>
          <Field label="الظهور">
            <select
              value={form.visibility}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  visibility: e.target.value as ResourceVisibility,
                }))
              }
              className="inp"
            >
              {(
                Object.keys(RESOURCE_VISIBILITY_LABELS) as ResourceVisibility[]
              ).map((k) => (
                <option key={k} value={k}>
                  {RESOURCE_VISIBILITY_LABELS[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="الترتيب">
            <input
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  sortOrder: Number(e.target.value) || 0,
                }))
              }
              className="inp tabular-nums"
            />
          </Field>
          <Field label="مميَّز">
            <label className="inline-flex items-center gap-2 h-10 px-3 rounded-xl border border-border bg-white cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) =>
                  setForm((s) => ({ ...s, featured: e.target.checked }))
                }
              />
              <span className="text-[13px] text-foreground/75">يظهر بشارة</span>
            </label>
          </Field>
        </div>
        {error && (
          <div className="rounded-xl px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 text-[13px]">
            {error}
          </div>
        )}
        <SaveBar submitting={submitting} isNew={isNew} onClose={onClose} />
      </form>
    </Modal>
  );
}
