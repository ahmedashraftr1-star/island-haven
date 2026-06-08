import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { PARTNER_TIER_LABELS, type PartnerTier } from "@/lib/labels";
import { Modal, Field, SaveBar } from "./adminShared";

interface Row {
  id: number;
  name: string;
  logoUrl: string | null;
  websiteUrl: string;
  description: string;
  tier: PartnerTier;
  status: "visible" | "hidden";
  sortOrder: number;
}

const EMPTY: Row = {
  id: 0,
  name: "",
  logoUrl: "",
  websiteUrl: "",
  description: "",
  tier: "partner",
  status: "visible",
  sortOrder: 0,
};

export default function AdminPartners() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | "new" | null>(null);

  async function reload() {
    try {
      setRows((await api<{ partners: Row[] }>("/admin/partners")).partners);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }
  useEffect(() => {
    void reload();
  }, []);

  async function onDelete(id: number) {
    if (!window.confirm("حذف هذا الشريك؟")) return;
    await api(`/admin/partners/${id}`, { method: "DELETE" });
    void reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">الشركاء والداعمون</h2>
          <p className="text-[13px] text-foreground/55 mt-1">شعارات الشركاء التي تظهر في الصفحة الرئيسيّة.</p>
        </div>
        <button onClick={() => setEditing("new")} className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:shadow-soft-hover transition-shadow">
          <Plus className="w-4 h-4" /> شريك جديد
        </button>
      </div>
      {error && <div className="rounded-2xl px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 text-[13px]">{error}</div>}

      <div className="rounded-2xl bg-white border border-border overflow-hidden">
        {rows === null ? (
          <div className="p-8 text-center text-foreground/45">جارِ التحميل…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-foreground/55 text-[14px]">لا شركاء بعد.</div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/40 text-foreground/55 text-[11.5px] tracking-[0.05em] uppercase">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">الشريك</th>
                <th className="text-right px-4 py-3 font-semibold">النوع</th>
                <th className="text-right px-4 py-3 font-semibold">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold w-1">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.logoUrl && <img src={r.logoUrl} alt="" className="h-7 w-auto object-contain" />}
                      <span className="font-semibold text-foreground">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground/65">{PARTNER_TIER_LABELS[r.tier]}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${r.status === "visible" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-muted text-foreground/55 border border-border"}`}>
                      {r.status === "visible" ? "ظاهر" : "مخفيّ"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditing(r)} className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65 hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => onDelete(r.id)} className="p-2 rounded-lg hover:bg-rose-50 text-foreground/65 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <PartnerEditor
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

function PartnerEditor({ initial, onClose, onSaved }: { initial: Row; onClose: () => void; onSaved: () => void }) {
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
      await api(isNew ? "/admin/partners" : `/admin/partners/${initial.id}`, {
        method: isNew ? "POST" : "PATCH",
        body: JSON.stringify(body),
      });
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحفظ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={isNew ? "شريك جديد" : "تعديل الشريك"} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="p-6 space-y-4">
        <Field label="الاسم"><input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} className="inp" maxLength={200} /></Field>
        <Field label="رابط الشّعار (logo)"><input dir="ltr" value={form.logoUrl ?? ""} onChange={(e) => setForm((s) => ({ ...s, logoUrl: e.target.value }))} className="inp" maxLength={800} placeholder="/api/storage/…" /></Field>
        <Field label="رابط الموقع"><input dir="ltr" value={form.websiteUrl} onChange={(e) => setForm((s) => ({ ...s, websiteUrl: e.target.value }))} className="inp" maxLength={400} placeholder="https://" /></Field>
        <Field label="وصف قصير (اختياري)"><input value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} className="inp" maxLength={400} /></Field>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="النوع">
            <select value={form.tier} onChange={(e) => setForm((s) => ({ ...s, tier: e.target.value as PartnerTier }))} className="inp">
              {(Object.keys(PARTNER_TIER_LABELS) as PartnerTier[]).map((k) => <option key={k} value={k}>{PARTNER_TIER_LABELS[k]}</option>)}
            </select>
          </Field>
          <Field label="الحالة">
            <select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as Row["status"] }))} className="inp">
              <option value="visible">ظاهر</option>
              <option value="hidden">مخفيّ</option>
            </select>
          </Field>
          <Field label="الترتيب"><input type="number" min={0} value={form.sortOrder} onChange={(e) => setForm((s) => ({ ...s, sortOrder: Number(e.target.value) || 0 }))} className="inp tabular-nums" /></Field>
        </div>
        {error && <div className="rounded-xl px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 text-[13px]">{error}</div>}
        <SaveBar submitting={submitting} isNew={isNew} onClose={onClose} />
      </form>
    </Modal>
  );
}
