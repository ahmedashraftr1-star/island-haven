import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useConfirm } from "@/hooks/use-confirm";
import { Modal, Field, SaveBar } from "./adminShared";

const TYPE_LABELS: Record<string, string> = {
  lead: "مستثمر رئيسي",
  angel: "مستثمر ملاك",
  vc: "صندوق رأس مال مخاطر",
  corporate: "شراكة مؤسسية",
  ngo: "منظمة دولية",
  individual: "مانح فردي",
};

interface Row {
  id: number;
  name: string;
  logoUrl: string | null;
  websiteUrl: string;
  description: string;
  type: string;
  investmentFocus: string;
  status: "visible" | "hidden";
  sortOrder: number;
}

const EMPTY: Row = {
  id: 0,
  name: "",
  logoUrl: "",
  websiteUrl: "",
  description: "",
  type: "angel",
  investmentFocus: "",
  status: "visible",
  sortOrder: 0,
};

export default function AdminInvestors() {
  const confirm = useConfirm();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Row>(EMPTY);

  async function reload() {
    try {
      setRows((await api<{ investors: Row[] }>("/admin/investors")).investors);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }

  useEffect(() => { void reload(); }, []);

  function openNew() { setForm({ ...EMPTY }); setEditing("new"); }
  function openEdit(r: Row) { setForm({ ...r }); setEditing(r); }

  async function onSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        logoUrl: form.logoUrl || null,
        sortOrder: Number(form.sortOrder),
      };
      if (editing === "new") {
        await api("/admin/investors", { method: "POST", body: JSON.stringify(payload) });
      } else if (editing) {
        await api(`/admin/investors/${form.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      }
      setEditing(null);
      void reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    if (!(await confirm({ title: "تأكيد الحذف", message: "حذف هذا المستثمر؟", confirmLabel: "حذف", danger: true }))) return;
    await api(`/admin/investors/${id}`, { method: "DELETE" });
    void reload();
  }

  const set = (k: keyof Row) => (v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">المستثمرون والداعمون</h2>
          <p className="text-[13px] text-foreground/65 mt-1">أبرز الجهات الداعمة والمستثمرة في آيلاند هيفن.</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-[hsl(var(--primary-cta))] text-white text-[13px] font-semibold hover:shadow-soft-hover transition-shadow"
        >
          <Plus className="w-4 h-4" /> مستثمر جديد
        </button>
      </div>

      {error && (
        <div className="rounded-2xl px-4 py-3 bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[13px]">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {rows === null ? (
          <div className="p-8 text-center text-foreground/60">جارِ التحميل…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-foreground/65 text-[14px]">لا مستثمرين بعد.</div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/40 text-foreground/65 text-[11.5px] tracking-[0.05em] uppercase">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">الاسم</th>
                <th className="text-right px-4 py-3 font-semibold">النوع</th>
                <th className="text-right px-4 py-3 font-semibold">الحالة</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {row.logoUrl ? (
                        <img loading="lazy" decoding="async" src={row.logoUrl} alt={row.name} className="w-9 h-9 rounded-lg object-cover border border-border flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <span className="text-base font-bold text-foreground/30">{row.name[0]}</span>
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-foreground">{row.name}</div>
                        {row.investmentFocus && <div className="text-[11px] text-foreground/65 truncate max-w-[200px]">{row.investmentFocus}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-medium text-foreground/60">
                      {TYPE_LABELS[row.type] ?? row.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      row.status === "visible"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-muted text-foreground/70"
                    }`}>
                      {row.status === "visible" ? "ظاهر" : "مخفيّ"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button type="button" onClick={() => openEdit(row)} aria-label={`تعديل ${row.name}`} className="p-1.5 rounded-lg text-foreground/55 hover:bg-muted hover:text-foreground transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => onDelete(row.id)} aria-label={`حذف ${row.name}`} className="p-1.5 rounded-lg text-foreground/55 hover:bg-rose-500/10 hover:text-rose-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing !== null && (
        <Modal title={editing === "new" ? "مستثمر جديد" : "تعديل المستثمر"} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <Field label="الاسم *">
              <input className="w-full border border-border rounded-xl px-3 h-10 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.name} onChange={(e) => set("name")(e.target.value)} />
            </Field>
            <Field label="نوع المستثمر">
              <select className="w-full border border-border rounded-xl px-3 h-10 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30 bg-card" value={form.type} onChange={(e) => set("type")(e.target.value)}>
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label="الوصف">
              <textarea rows={3} className="w-full border border-border rounded-xl px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" value={form.description} onChange={(e) => set("description")(e.target.value)} />
            </Field>
            <Field label="مجال الاستثمار (اختياري)">
              <input className="w-full border border-border rounded-xl px-3 h-10 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.investmentFocus} onChange={(e) => set("investmentFocus")(e.target.value)} />
            </Field>
            <Field label="الموقع الإلكتروني (اختياري)">
              <input className="w-full border border-border rounded-xl px-3 h-10 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.websiteUrl} onChange={(e) => set("websiteUrl")(e.target.value)} placeholder="https://" />
            </Field>
            <Field label="رابط الشعار (اختياري)">
              <input className="w-full border border-border rounded-xl px-3 h-10 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.logoUrl ?? ""} onChange={(e) => set("logoUrl")(e.target.value)} placeholder="https://" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="الحالة">
                <select className="w-full border border-border rounded-xl px-3 h-10 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30 bg-card" value={form.status} onChange={(e) => set("status")(e.target.value)}>
                  <option value="visible">ظاهر</option>
                  <option value="hidden">مخفيّ</option>
                </select>
              </Field>
              <Field label="الترتيب">
                <input type="number" min={0} className="w-full border border-border rounded-xl px-3 h-10 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.sortOrder} onChange={(e) => set("sortOrder")(Number(e.target.value))} />
              </Field>
            </div>
          </div>
          <SaveBar submitting={saving} isNew={editing === "new"} onClose={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}
