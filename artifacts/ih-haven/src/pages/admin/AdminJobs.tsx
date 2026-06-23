import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Modal, Field, SaveBar } from "./adminShared";

const JOB_TYPE_LABELS: Record<string, string> = {
  "full-time": "دوام كامل",
  "part-time": "دوام جزئي",
  remote: "عن بُعد",
  contract: "عقد مؤقت",
  internship: "تدريب",
};

const JOB_CAT_LABELS: Record<string, string> = {
  tech: "تقنية",
  design: "تصميم",
  marketing: "تسويق",
  sales: "مبيعات",
  operations: "عمليات",
  finance: "مالية",
  other: "أخرى",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-300",
  closed: "bg-rose-500/15 text-rose-300",
  draft: "bg-muted text-foreground/60",
};

const STATUS_LABELS: Record<string, string> = {
  active: "نشطة",
  closed: "مغلقة",
  draft: "مسودة",
};

interface Row {
  id: number;
  title: string;
  companyName: string;
  companyLogoUrl: string | null;
  location: string;
  type: string;
  category: string;
  description: string;
  requirements: string;
  salaryRange: string;
  applyUrl: string;
  status: "active" | "closed" | "draft";
  featured: boolean;
  sortOrder: number;
}

const EMPTY: Row = {
  id: 0,
  title: "",
  companyName: "",
  companyLogoUrl: "",
  location: "غزة",
  type: "full-time",
  category: "other",
  description: "",
  requirements: "",
  salaryRange: "",
  applyUrl: "",
  status: "draft",
  featured: false,
  sortOrder: 0,
};

export default function AdminJobs() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Row>(EMPTY);

  async function reload() {
    try {
      setRows((await api<{ jobs: Row[] }>("/admin/jobs")).jobs);
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
        companyLogoUrl: form.companyLogoUrl || null,
        sortOrder: Number(form.sortOrder),
      };
      if (editing === "new") {
        await api("/admin/jobs", { method: "POST", body: JSON.stringify(payload) });
      } else if (editing) {
        await api(`/admin/jobs/${form.id}`, { method: "PATCH", body: JSON.stringify(payload) });
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
    if (!window.confirm("حذف هذه الوظيفة؟")) return;
    await api(`/admin/jobs/${id}`, { method: "DELETE" });
    void reload();
  }

  async function toggleFeatured(row: Row) {
    await api(`/admin/jobs/${row.id}`, {
      method: "PATCH",
      body: JSON.stringify({ featured: !row.featured }),
    });
    void reload();
  }

  const set = (k: keyof Row) => (v: string | boolean | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">لوحة الوظائف</h2>
          <p className="text-[13px] text-foreground/55 mt-1">وظائف من مشاريع وشركاء آيلاند هيفن.</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:shadow-soft-hover transition-shadow"
        >
          <Plus className="w-4 h-4" /> وظيفة جديدة
        </button>
      </div>

      {error && (
        <div className="rounded-2xl px-4 py-3 bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[13px]">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {rows === null ? (
          <div className="p-8 text-center text-foreground/45">جارِ التحميل…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-foreground/55 text-[14px]">لا وظائف بعد.</div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/40 text-foreground/55 text-[11.5px] tracking-[0.05em] uppercase">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">الوظيفة</th>
                <th className="text-right px-4 py-3 font-semibold">الشركة</th>
                <th className="text-right px-4 py-3 font-semibold">النوع</th>
                <th className="text-right px-4 py-3 font-semibold">الحالة</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      {row.title}
                      {row.featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />}
                    </div>
                    <div className="text-[11px] text-foreground/40 mt-0.5">{row.location}</div>
                  </td>
                  <td className="px-4 py-3 text-foreground/70">{row.companyName}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-medium text-foreground/60">
                      {JOB_TYPE_LABELS[row.type] ?? row.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[row.status]}`}>
                      {STATUS_LABELS[row.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => toggleFeatured(row)}
                        title={row.featured ? "إلغاء التمييز" : "تمييز"}
                        aria-label={row.featured ? "إلغاء تمييز الوظيفة" : "تمييز الوظيفة"}
                        aria-pressed={row.featured ? "true" : "false"}
                        className={`p-1.5 rounded-lg transition-colors ${row.featured ? "text-amber-400 hover:bg-amber-500/10" : "text-foreground/30 hover:bg-muted"}`}
                      >
                        <Star className="w-4 h-4" fill={row.featured ? "currentColor" : "none"} />
                      </button>
                      <button type="button" onClick={() => openEdit(row)} aria-label={`تعديل وظيفة ${row.title}`} className="p-1.5 rounded-lg text-foreground/40 hover:bg-muted hover:text-foreground transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => onDelete(row.id)} aria-label={`حذف وظيفة ${row.title}`} className="p-1.5 rounded-lg text-foreground/40 hover:bg-rose-500/10 hover:text-rose-400 transition-colors">
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
        <Modal title={editing === "new" ? "وظيفة جديدة" : "تعديل الوظيفة"} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <Field label="عنوان الوظيفة *">
              <input className="w-full border border-border rounded-xl px-3 h-10 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.title} onChange={(e) => set("title")(e.target.value)} />
            </Field>
            <Field label="اسم الشركة *">
              <input className="w-full border border-border rounded-xl px-3 h-10 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.companyName} onChange={(e) => set("companyName")(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="نوع الوظيفة">
                <select className="w-full border border-border rounded-xl px-3 h-10 text-[13.5px] focus:outline-none bg-card" value={form.type} onChange={(e) => set("type")(e.target.value)}>
                  {Object.entries(JOB_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="التصنيف">
                <select className="w-full border border-border rounded-xl px-3 h-10 text-[13.5px] focus:outline-none bg-card" value={form.category} onChange={(e) => set("category")(e.target.value)}>
                  {Object.entries(JOB_CAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="الموقع">
                <input className="w-full border border-border rounded-xl px-3 h-10 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.location} onChange={(e) => set("location")(e.target.value)} />
              </Field>
              <Field label="الراتب (اختياري)">
                <input className="w-full border border-border rounded-xl px-3 h-10 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.salaryRange} onChange={(e) => set("salaryRange")(e.target.value)} />
              </Field>
            </div>
            <Field label="وصف الوظيفة">
              <textarea rows={4} className="w-full border border-border rounded-xl px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" value={form.description} onChange={(e) => set("description")(e.target.value)} />
            </Field>
            <Field label="المتطلبات">
              <textarea rows={3} className="w-full border border-border rounded-xl px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" value={form.requirements} onChange={(e) => set("requirements")(e.target.value)} />
            </Field>
            <Field label="رابط التقديم">
              <input className="w-full border border-border rounded-xl px-3 h-10 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.applyUrl} onChange={(e) => set("applyUrl")(e.target.value)} placeholder="https://" />
            </Field>
            <Field label="رابط شعار الشركة (اختياري)">
              <input className="w-full border border-border rounded-xl px-3 h-10 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.companyLogoUrl ?? ""} onChange={(e) => set("companyLogoUrl")(e.target.value)} placeholder="https://" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="الحالة">
                <select className="w-full border border-border rounded-xl px-3 h-10 text-[13.5px] focus:outline-none bg-card" value={form.status} onChange={(e) => set("status")(e.target.value as Row["status"])}>
                  <option value="draft">مسودة</option>
                  <option value="active">نشطة</option>
                  <option value="closed">مغلقة</option>
                </select>
              </Field>
              <Field label="الترتيب">
                <input type="number" min={0} className="w-full border border-border rounded-xl px-3 h-10 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.sortOrder} onChange={(e) => set("sortOrder")(Number(e.target.value))} />
              </Field>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.featured} onChange={(e) => set("featured")(e.target.checked)} className="w-4 h-4 rounded accent-primary" />
              <span className="text-[13px] text-foreground/70">وظيفة مميّزة</span>
            </label>
          </div>
          <SaveBar submitting={saving} isNew={editing === "new"} onClose={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}
