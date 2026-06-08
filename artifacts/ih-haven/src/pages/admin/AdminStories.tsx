import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Modal, Field, SaveBar } from "./adminShared";

interface Row {
  id: number;
  personName: string;
  role: string;
  quote: string;
  story: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  ventureName: string;
  featured: boolean;
  status: "draft" | "published" | "hidden";
  sortOrder: number;
}

const EMPTY: Row = {
  id: 0,
  personName: "",
  role: "",
  quote: "",
  story: "",
  avatarUrl: "",
  coverUrl: "",
  ventureName: "",
  featured: false,
  status: "draft",
  sortOrder: 0,
};

export default function AdminStories() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | "new" | null>(null);

  async function reload() {
    try {
      setRows((await api<{ stories: Row[] }>("/admin/stories")).stories);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }
  useEffect(() => {
    void reload();
  }, []);

  async function onDelete(id: number) {
    if (!window.confirm("حذف هذه القصّة؟")) return;
    await api(`/admin/stories/${id}`, { method: "DELETE" });
    void reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">قصص النجاح</h2>
          <p className="text-[13px] text-foreground/55 mt-1">شهادات وقصص ملهمة من مجتمع آيلاند.</p>
        </div>
        <button onClick={() => setEditing("new")} className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:shadow-soft-hover transition-shadow">
          <Plus className="w-4 h-4" /> قصّة جديدة
        </button>
      </div>
      {error && <div className="rounded-2xl px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 text-[13px]">{error}</div>}

      <div className="rounded-2xl bg-white border border-border overflow-hidden">
        {rows === null ? (
          <div className="p-8 text-center text-foreground/45">جارِ التحميل…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-foreground/55 text-[14px]">لا قصص بعد.</div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/40 text-foreground/55 text-[11.5px] tracking-[0.05em] uppercase">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">الشخص</th>
                <th className="text-right px-4 py-3 font-semibold">الاقتباس</th>
                <th className="text-right px-4 py-3 font-semibold">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold w-1">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      {r.featured && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                      {r.personName}
                    </div>
                    {r.role && <div className="text-[11.5px] text-foreground/45 mt-0.5">{r.role}</div>}
                  </td>
                  <td className="px-4 py-3 text-foreground/65 max-w-xs truncate">{r.quote}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${r.status === "published" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-muted text-foreground/55 border border-border"}`}>
                      {r.status === "published" ? "منشور" : r.status === "draft" ? "مسوّدة" : "مخفيّ"}
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
        <StoryEditor
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

function StoryEditor({ initial, onClose, onSaved }: { initial: Row; onClose: () => void; onSaved: () => void }) {
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
      await api(isNew ? "/admin/stories" : `/admin/stories/${initial.id}`, {
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
    <Modal title={isNew ? "قصّة جديدة" : "تعديل القصّة"} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="الاسم"><input value={form.personName} onChange={(e) => setForm((s) => ({ ...s, personName: e.target.value }))} className="inp" maxLength={200} /></Field>
          <Field label="الصّفة (مثال: مؤسِّس)"><input value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))} className="inp" maxLength={200} /></Field>
        </div>
        <Field label="الاقتباس القصير"><textarea rows={2} value={form.quote} onChange={(e) => setForm((s) => ({ ...s, quote: e.target.value }))} className="inp resize-none leading-[1.85]" maxLength={600} /></Field>
        <Field label="القصّة الكاملة (اختياري)"><textarea rows={4} value={form.story} onChange={(e) => setForm((s) => ({ ...s, story: e.target.value }))} className="inp resize-none leading-[1.85]" maxLength={8000} /></Field>
        <Field label="اسم المشروع (اختياري)"><input value={form.ventureName} onChange={(e) => setForm((s) => ({ ...s, ventureName: e.target.value }))} className="inp" maxLength={200} /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="رابط الصّورة الشخصيّة"><input dir="ltr" value={form.avatarUrl ?? ""} onChange={(e) => setForm((s) => ({ ...s, avatarUrl: e.target.value }))} className="inp" maxLength={800} /></Field>
          <Field label="رابط الغلاف"><input dir="ltr" value={form.coverUrl ?? ""} onChange={(e) => setForm((s) => ({ ...s, coverUrl: e.target.value }))} className="inp" maxLength={800} /></Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="الحالة">
            <select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as Row["status"] }))} className="inp">
              <option value="draft">مسوّدة</option>
              <option value="published">منشور</option>
              <option value="hidden">مخفيّ</option>
            </select>
          </Field>
          <Field label="الترتيب"><input type="number" min={0} value={form.sortOrder} onChange={(e) => setForm((s) => ({ ...s, sortOrder: Number(e.target.value) || 0 }))} className="inp tabular-nums" /></Field>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer text-[13px] text-foreground/75">
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm((s) => ({ ...s, featured: e.target.checked }))} className="w-4 h-4 accent-primary" />
          قصّة مميّزة
        </label>
        {error && <div className="rounded-xl px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 text-[13px]">{error}</div>}
        <SaveBar submitting={submitting} isNew={isNew} onClose={onClose} />
      </form>
    </Modal>
  );
}
