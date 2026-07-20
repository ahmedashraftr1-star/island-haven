import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { VENTURE_STAGE_LABELS, type VentureStage } from "@/lib/labels";
import { Modal, Field, SaveBar } from "./adminShared";
import { useConfirm } from "@/hooks/use-confirm";

interface Row {
  id: number;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string | null;
  coverUrl: string | null;
  websiteUrl: string;
  founderName: string;
  founderQuote: string;
  sector: string;
  stage: VentureStage;
  foundedYear: number;
  teamSize: number;
  featured: boolean;
  status: "draft" | "published" | "hidden";
  sortOrder: number;
  pitchDeckResourceId: number | null;
  userId: number | null;
}

const EMPTY: Row = {
  id: 0,
  name: "",
  tagline: "",
  description: "",
  logoUrl: "",
  coverUrl: "",
  websiteUrl: "",
  founderName: "",
  founderQuote: "",
  sector: "",
  stage: "idea",
  foundedYear: 0,
  teamSize: 1,
  featured: false,
  status: "draft",
  sortOrder: 0,
  pitchDeckResourceId: null,
  userId: null,
};

export default function AdminVentures() {
  const confirm = useConfirm();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | "new" | null>(null);

  async function reload() {
    try {
      setRows((await api<{ ventures: Row[] }>("/admin/ventures")).ventures);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }
  useEffect(() => {
    void reload();
  }, []);

  async function onDelete(id: number) {
    const ok = await confirm({
      title: "نقل إلى المحذوفات",
      message: "سيُنقل هذا المشروع إلى المحذوفات، ويمكنك استعادته لاحقًا من صفحة «المحذوفات».",
      confirmLabel: "نقل إلى المحذوفات",
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/admin/ventures/${id}`, { method: "DELETE" });
      void reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحذف");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">المشاريع الناشئة</h2>
          <p className="text-[13px] text-foreground/65 mt-1">اعرض المشاريع التي وُلدت في آيلاند.</p>
        </div>
        <button type="button" onClick={() => setEditing("new")} className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-[hsl(var(--primary-cta))] text-white text-[13px] font-semibold hover:shadow-soft-hover transition-shadow">
          <Plus className="w-4 h-4" /> مشروع جديد
        </button>
      </div>
      {error && <div className="rounded-2xl px-4 py-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[13px]">{error}</div>}

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {rows === null ? (
          <div className="p-8 text-center text-foreground/60">جارِ التحميل…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-foreground/65 text-[14px]">لا مشاريع بعد.</div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/40 text-foreground/65 text-[11.5px] tracking-[0.05em] uppercase">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">المشروع</th>
                <th className="text-right px-4 py-3 font-semibold">المرحلة</th>
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
                      {r.name}
                    </div>
                    {r.tagline && <div className="text-[11.5px] text-foreground/60 mt-0.5">{r.tagline}</div>}
                  </td>
                  <td className="px-4 py-3 text-foreground/65">{VENTURE_STAGE_LABELS[r.stage]}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${r.status === "published" ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-muted text-foreground/70 border border-border"}`}>
                      {r.status === "published" ? "منشور" : r.status === "draft" ? "مسوّدة" : "مخفيّ"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button type="button" aria-label="تعديل المشروع" onClick={() => setEditing(r)} className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65 hover:text-primary transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button type="button" aria-label="حذف المشروع" onClick={() => onDelete(r.id)} className="p-2 rounded-lg hover:bg-rose-500/15 text-foreground/65 hover:text-rose-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <VentureEditor
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

function VentureEditor({ initial, onClose, onSaved }: { initial: Row; onClose: () => void; onSaved: () => void }) {
  const isNew = initial.id === 0;
  const [form, setForm] = useState<Row>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resources, setResources] = useState<{ id: number; title: string }[]>([]);
  const [users, setUsers] = useState<{ id: number; fullName: string; email: string }[]>([]);

  useEffect(() => {
    api<{ resources: { id: number; title: string }[] }>("/admin/resources")
      .then((r) => setResources(r.resources))
      .catch(() => setResources([]));
    api<{ users: { id: number; fullName: string; email: string }[] }>("/admin/users")
      .then((r) => setUsers(r.users))
      .catch(() => setUsers([]));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const { id: _id, ...body } = form;
      void _id;
      await api(isNew ? "/admin/ventures" : `/admin/ventures/${initial.id}`, {
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
    <Modal title={isNew ? "مشروع جديد" : "تعديل المشروع"} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="p-6 space-y-4">
        <Field label="اسم المشروع">
          <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} className="inp" maxLength={200} />
        </Field>
        <Field label="الشّعار النصّيّ (tagline)">
          <input value={form.tagline} onChange={(e) => setForm((s) => ({ ...s, tagline: e.target.value }))} className="inp" maxLength={300} />
        </Field>
        <Field label="الوصف">
          <textarea rows={4} value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} className="inp resize-none leading-[1.85]" maxLength={6000} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="المؤسِّس"><input value={form.founderName} onChange={(e) => setForm((s) => ({ ...s, founderName: e.target.value }))} className="inp" maxLength={200} /></Field>
          <Field label="القطاع"><input value={form.sector} onChange={(e) => setForm((s) => ({ ...s, sector: e.target.value }))} className="inp" maxLength={160} /></Field>
        </div>
        <Field label="اقتباس المؤسِّس · Founder quote">
          <textarea rows={2} value={form.founderQuote} onChange={(e) => setForm((s) => ({ ...s, founderQuote: e.target.value }))} className="inp resize-none leading-[1.85]" maxLength={500} />
        </Field>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="المرحلة">
            <select value={form.stage} onChange={(e) => setForm((s) => ({ ...s, stage: e.target.value as VentureStage }))} className="inp">
              {(Object.keys(VENTURE_STAGE_LABELS) as VentureStage[]).map((k) => <option key={k} value={k}>{VENTURE_STAGE_LABELS[k]}</option>)}
            </select>
          </Field>
          <Field label="سنة التأسيس"><input type="number" min={0} value={form.foundedYear} onChange={(e) => setForm((s) => ({ ...s, foundedYear: Number(e.target.value) || 0 }))} className="inp tabular-nums" /></Field>
          <Field label="حجم الفريق"><input type="number" min={0} value={form.teamSize} onChange={(e) => setForm((s) => ({ ...s, teamSize: Number(e.target.value) || 0 }))} className="inp tabular-nums" /></Field>
        </div>
        <Field label="رابط الموقع"><input dir="ltr" value={form.websiteUrl} onChange={(e) => setForm((s) => ({ ...s, websiteUrl: e.target.value }))} className="inp" maxLength={400} placeholder="https://" /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="رابط الشعار (logo)"><input dir="ltr" value={form.logoUrl ?? ""} onChange={(e) => setForm((s) => ({ ...s, logoUrl: e.target.value }))} className="inp" maxLength={800} /></Field>
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
        <Field label="ملفّ العرض (Pitch Deck) — من دليل الرّائد">
          <select
            value={form.pitchDeckResourceId ?? ""}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                pitchDeckResourceId: e.target.value ? Number(e.target.value) : null,
              }))
            }
            className="inp"
          >
            <option value="">— لا يوجد —</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="حساب المؤسِّس (يربط المشروع بعضو ليراه في ملفّه)">
          <select
            value={form.userId ?? ""}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                userId: e.target.value ? Number(e.target.value) : null,
              }))
            }
            className="inp"
          >
            <option value="">— غير مربوط —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName} ({u.email})
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2.5 cursor-pointer text-[13px] text-foreground/75">
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm((s) => ({ ...s, featured: e.target.checked }))} className="w-4 h-4 accent-primary" />
          مشروع مميّز
        </label>
        {error && <div className="rounded-xl px-4 py-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[13px]">{error}</div>}
        <SaveBar submitting={submitting} isNew={isNew} onClose={onClose} />
      </form>
    </Modal>
  );
}
