import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Star, UserCheck, XCircle } from "lucide-react";
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
  projectUrl: string | null;
  featured: boolean;
  status: "draft" | "published" | "hidden" | "rejected";
  sortOrder: number;
  submittedByUserId: number | null;
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
  projectUrl: "",
  featured: false,
  status: "draft",
  sortOrder: 0,
  submittedByUserId: null,
};

const STATUS_LABELS: Record<Row["status"], string> = {
  draft: "مسوّدة",
  published: "منشور",
  hidden: "مخفيّ",
  rejected: "مرفوضة",
};

const STATUS_COLORS: Record<Row["status"], string> = {
  draft: "bg-muted text-foreground/55 border border-border",
  published: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  hidden: "bg-muted text-foreground/55 border border-border",
  rejected: "bg-rose-50 text-rose-700 border border-rose-200",
};

export default function AdminStories() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Row | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectBusy, setRejectBusy] = useState(false);

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
    if (!window.confirm("حذف هذه القصّة؟ سيصلُ إشعارٌ بالبريد إلى العضو إن وُجد.")) return;
    await api(`/admin/stories/${id}`, { method: "DELETE" });
    void reload();
  }

  async function onPublish(row: Row) {
    await api(`/admin/stories/${row.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "published" }),
    });
    void reload();
  }

  async function onReject() {
    if (!rejectTarget) return;
    setRejectBusy(true);
    try {
      await api(`/admin/stories/${rejectTarget.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "rejected", rejectionNote: rejectReason.trim() || undefined }),
      });
      setRejectTarget(null);
      setRejectReason("");
      void reload();
    } finally {
      setRejectBusy(false);
    }
  }

  const pendingCount = (rows ?? []).filter(
    (r) => r.submittedByUserId !== null && r.status === "draft",
  ).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground flex items-center gap-2">
            قصص النجاح
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">
                {pendingCount} طلب جديد
              </span>
            )}
          </h2>
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
                <tr
                  key={r.id}
                  className={`border-t border-border hover:bg-muted/20 ${
                    r.submittedByUserId !== null && r.status === "draft"
                      ? "bg-amber-50/60"
                      : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      {r.featured && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                      {r.submittedByUserId !== null && (
                        <span title="مقدَّمة من عضو">
                          <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                        </span>
                      )}
                      {r.personName}
                    </div>
                    {r.role && <div className="text-[11.5px] text-foreground/45 mt-0.5">{r.role}</div>}
                    {r.ventureName && (
                      <div className="text-[11.5px] text-foreground/40 mt-0.5">{r.ventureName}</div>
                    )}
                    {r.projectUrl && (
                      <a
                        href={r.projectUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-primary/70 hover:text-primary truncate block max-w-[160px] mt-0.5"
                        dir="ltr"
                      >
                        {r.projectUrl}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground/65 max-w-xs truncate">{r.quote}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold w-fit ${STATUS_COLORS[r.status]}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                      {r.submittedByUserId !== null && (
                        <span className="text-[10.5px] text-blue-600 font-semibold">من عضو</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {r.submittedByUserId !== null && r.status === "draft" && (
                        <>
                          <button
                            onClick={() => onPublish(r)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-100 transition-colors"
                          >
                            نشر
                          </button>
                          <button
                            onClick={() => { setRejectTarget(r); setRejectReason(""); }}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold hover:bg-rose-100 transition-colors"
                          >
                            رفض
                          </button>
                        </>
                      )}
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

      {/* Reject with reason modal */}
      {rejectTarget && (
        <Modal title="رفض القصّة" onClose={() => setRejectTarget(null)}>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[13px] text-rose-700">
                سيُرسَل إشعار برفض القصّة إلى العضو تلقائيًّا بالبريد الإلكتروني.
              </p>
            </div>
            <Field label="سبب الرفض (اختياري — يظهر في الإيميل)">
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="inp resize-none leading-relaxed"
                placeholder="مثال: القصّة بحاجة إلى تفاصيل إضافية…"
                maxLength={500}
              />
            </Field>
            <div className="flex gap-3">
              <button
                onClick={onReject}
                disabled={rejectBusy}
                className="flex-1 h-11 rounded-full bg-rose-600 text-white font-semibold text-[13.5px] hover:bg-rose-700 disabled:opacity-50 transition-colors"
              >
                {rejectBusy ? "جارِ الرفض…" : "تأكيد الرفض"}
              </button>
              <button
                onClick={() => setRejectTarget(null)}
                className="px-6 h-11 rounded-full bg-muted text-foreground/75 font-semibold text-[13.5px] hover:bg-muted/70 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </Modal>
      )}

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
      const { id: _id, submittedByUserId: _sub, ...body } = form;
      void _id;
      void _sub;
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
        {initial.submittedByUserId !== null && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-[13px]">
            <UserCheck className="w-4 h-4 shrink-0" />
            هذه القصّة مقدَّمة من أحد الأعضاء — يمكنك تعديلها ثمّ نشرها.
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="الاسم"><input value={form.personName} onChange={(e) => setForm((s) => ({ ...s, personName: e.target.value }))} className="inp" maxLength={200} /></Field>
          <Field label="الصّفة (مثال: مؤسِّس)"><input value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))} className="inp" maxLength={200} /></Field>
        </div>
        <Field label="الاقتباس القصير"><textarea rows={2} value={form.quote} onChange={(e) => setForm((s) => ({ ...s, quote: e.target.value }))} className="inp resize-none leading-[1.85]" maxLength={600} /></Field>
        <Field label="القصّة الكاملة (اختياري)"><textarea rows={4} value={form.story} onChange={(e) => setForm((s) => ({ ...s, story: e.target.value }))} className="inp resize-none leading-[1.85]" maxLength={8000} /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="اسم المشروع (اختياري)"><input value={form.ventureName} onChange={(e) => setForm((s) => ({ ...s, ventureName: e.target.value }))} className="inp" maxLength={200} /></Field>
          <Field label="رابط المشروع (اختياري)"><input dir="ltr" value={form.projectUrl ?? ""} onChange={(e) => setForm((s) => ({ ...s, projectUrl: e.target.value }))} className="inp" maxLength={800} /></Field>
        </div>
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
              <option value="rejected">مرفوضة</option>
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
