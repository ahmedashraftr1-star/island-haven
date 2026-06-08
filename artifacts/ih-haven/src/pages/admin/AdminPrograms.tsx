import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Users, Inbox } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Modal, Field, SaveBar } from "./adminShared";
import {
  formatArabicDate,
  PROGRAM_STATUS_LABELS,
  PROGRAM_APPLICATION_STATUS_LABELS,
  type ProgramStatus,
  type ProgramApplicationStatus,
} from "@/lib/labels";

interface Row {
  id: number;
  title: string;
  status: ProgramStatus;
  seats: number;
  startsAt: string | null;
  sortOrder: number;
  createdAt: string;
  applicants: number;
}

interface FormState {
  title: string;
  summary: string;
  description: string;
  coverUrl: string;
  durationWeeks: number;
  seats: number;
  perks: string;
  tags: string;
  startsAt: string;
  applyDeadline: string;
  status: ProgramStatus;
  sortOrder: number;
}

const EMPTY: FormState = {
  title: "",
  summary: "",
  description: "",
  coverUrl: "",
  durationWeeks: 0,
  seats: 0,
  perks: "",
  tags: "",
  startsAt: "",
  applyDeadline: "",
  status: "draft",
  sortOrder: 0,
};

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminPrograms() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [viewing, setViewing] = useState<Row | null>(null);

  async function reload() {
    try {
      setRows((await api<{ programs: Row[] }>("/admin/programs")).programs);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }
  useEffect(() => {
    void reload();
  }, []);

  async function onDelete(id: number) {
    if (!window.confirm("حذف هذا البرنامج وكلّ طلباته؟")) return;
    try {
      await api(`/admin/programs/${id}`, { method: "DELETE" });
      void reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحذف");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">برامج الاحتضان</h2>
          <p className="text-[13px] text-foreground/55 mt-1">
            أنشئ مسارات الاحتضان وراجع طلبات الانضمام إليها.
          </p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:shadow-soft-hover transition-shadow"
          data-testid="button-new-program"
        >
          <Plus className="w-4 h-4" /> برنامج جديد
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
            لم يُضَف أيّ برنامج بعد.
          </div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/40 text-foreground/55 text-[11.5px] tracking-[0.05em] uppercase">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">العنوان</th>
                <th className="text-right px-4 py-3 font-semibold">يبدأ</th>
                <th className="text-right px-4 py-3 font-semibold">الطلبات</th>
                <th className="text-right px-4 py-3 font-semibold">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold w-1">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 font-semibold text-foreground">{r.title}</td>
                  <td className="px-4 py-3 text-foreground/65 tabular-nums">
                    {r.startsAt ? formatArabicDate(r.startsAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setViewing(r)}
                      className="inline-flex items-center gap-1 text-foreground/65 hover:text-primary tabular-nums"
                    >
                      <Users className="w-3.5 h-3.5" /> {r.applicants}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        r.status === "open"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : r.status === "draft"
                          ? "bg-muted text-foreground/55 border border-border"
                          : "bg-foreground/[0.04] text-foreground/65 border border-border"
                      }`}
                    >
                      {PROGRAM_STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewing(r)} className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65 hover:text-primary" title="الطلبات">
                        <Inbox className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditing(r)} className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65 hover:text-primary">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onDelete(r.id)} className="p-2 rounded-lg hover:bg-rose-50 text-foreground/65 hover:text-rose-600">
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
        <ProgramEditor
          initialId={editing === "new" ? null : editing.id}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void reload();
          }}
        />
      )}
      {viewing && (
        <ApplicationsModal program={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}

function ProgramEditor({
  initialId,
  onClose,
  onSaved,
}: {
  initialId: number | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = initialId === null;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    api<{ program: FormState & { startsAt: string | null; applyDeadline: string | null } }>(
      `/admin/programs/${initialId}`,
    ).then((r) => {
      const c = r.program;
      setForm({
        title: c.title,
        summary: c.summary || "",
        description: c.description || "",
        coverUrl: c.coverUrl || "",
        durationWeeks: c.durationWeeks || 0,
        seats: c.seats || 0,
        perks: c.perks || "",
        tags: c.tags || "",
        startsAt: toLocalInput(c.startsAt),
        applyDeadline: toLocalInput(c.applyDeadline),
        status: c.status,
        sortOrder: c.sortOrder || 0,
      });
    });
  }, [initialId, isNew]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        ...form,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        applyDeadline: form.applyDeadline ? new Date(form.applyDeadline).toISOString() : null,
      };
      await api(isNew ? "/admin/programs" : `/admin/programs/${initialId}`, {
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
    <Modal title={isNew ? "برنامج جديد" : "تعديل البرنامج"} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="p-6 space-y-4">
        <Field label="العنوان">
          <input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} className="inp" maxLength={200} />
        </Field>
        <Field label="ملخّص">
          <input value={form.summary} onChange={(e) => setForm((s) => ({ ...s, summary: e.target.value }))} className="inp" maxLength={400} />
        </Field>
        <Field label="الوصف الكامل">
          <textarea rows={4} value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} className="inp resize-none leading-[1.85]" maxLength={8000} />
        </Field>
        <Field label="المزايا (كلّ ميزة في سطر)">
          <textarea rows={3} value={form.perks} onChange={(e) => setForm((s) => ({ ...s, perks: e.target.value }))} className="inp resize-none leading-[1.85]" maxLength={2000} />
        </Field>
        <Field label="وسوم (مفصولة بفاصلة)">
          <input value={form.tags} onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))} className="inp" maxLength={400} />
        </Field>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="المدّة (أسابيع)">
            <input type="number" min={0} value={form.durationWeeks} onChange={(e) => setForm((s) => ({ ...s, durationWeeks: Number(e.target.value) || 0 }))} className="inp tabular-nums" />
          </Field>
          <Field label="المقاعد (٠=غير محدود)">
            <input type="number" min={0} value={form.seats} onChange={(e) => setForm((s) => ({ ...s, seats: Number(e.target.value) || 0 }))} className="inp tabular-nums" />
          </Field>
          <Field label="الترتيب">
            <input type="number" min={0} value={form.sortOrder} onChange={(e) => setForm((s) => ({ ...s, sortOrder: Number(e.target.value) || 0 }))} className="inp tabular-nums" />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="يبدأ">
            <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm((s) => ({ ...s, startsAt: e.target.value }))} className="inp" />
          </Field>
          <Field label="آخر موعد للتقديم">
            <input type="datetime-local" value={form.applyDeadline} onChange={(e) => setForm((s) => ({ ...s, applyDeadline: e.target.value }))} className="inp" />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="الحالة">
            <select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as ProgramStatus }))} className="inp">
              <option value="draft">مسوّدة</option>
              <option value="open">التقديم مفتوح</option>
              <option value="in_progress">جارٍ التنفيذ</option>
              <option value="done">منتهٍ</option>
            </select>
          </Field>
          <Field label="رابط صورة الغلاف">
            <input dir="ltr" value={form.coverUrl} onChange={(e) => setForm((s) => ({ ...s, coverUrl: e.target.value }))} className="inp" maxLength={800} placeholder="/api/storage/…" />
          </Field>
        </div>
        {error && <div className="rounded-xl px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 text-[13px]">{error}</div>}
        <SaveBar submitting={submitting} isNew={isNew} onClose={onClose} />
      </form>
    </Modal>
  );
}

interface AppRow {
  application: {
    id: number;
    ventureName: string;
    idea: string;
    motivation: string;
    status: ProgramApplicationStatus;
    notes: string;
    createdAt: string;
  };
  applicantName: string;
  applicantEmail: string;
}

function ApplicationsModal({ program, onClose }: { program: { id: number; title: string }; onClose: () => void }) {
  const [apps, setApps] = useState<AppRow[] | null>(null);

  async function reload() {
    const r = await api<{ applications: AppRow[] }>(`/admin/programs/${program.id}`);
    setApps(r.applications);
  }
  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program.id]);

  async function setStatus(id: number, status: ProgramApplicationStatus) {
    await api(`/admin/program-applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    void reload();
  }

  return (
    <Modal title={`طلبات: ${program.title}`} onClose={onClose}>
      <div className="p-6 space-y-3">
        {apps === null ? (
          <div className="text-center text-foreground/45 py-8">جارِ التحميل…</div>
        ) : apps.length === 0 ? (
          <div className="text-center text-foreground/55 py-10">لا توجد طلبات بعد.</div>
        ) : (
          apps.map((a) => (
            <div key={a.application.id} className="rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <div className="font-semibold text-foreground text-[14px]">{a.applicantName}</div>
                  <div className="text-[11.5px] text-foreground/45" dir="ltr">{a.applicantEmail}</div>
                </div>
                <select
                  value={a.application.status}
                  onChange={(e) => setStatus(a.application.id, e.target.value as ProgramApplicationStatus)}
                  className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-[12.5px] font-semibold"
                >
                  {(Object.keys(PROGRAM_APPLICATION_STATUS_LABELS) as ProgramApplicationStatus[]).map((s) => (
                    <option key={s} value={s}>{PROGRAM_APPLICATION_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              {a.application.ventureName && (
                <div className="text-[12.5px] text-foreground/70 font-medium">المشروع: {a.application.ventureName}</div>
              )}
              <p className="text-[13px] text-foreground/70 leading-[1.7] mt-1 whitespace-pre-wrap">{a.application.idea}</p>
              {a.application.motivation && (
                <p className="text-[12.5px] text-foreground/50 leading-[1.7] mt-2 whitespace-pre-wrap">{a.application.motivation}</p>
              )}
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}

