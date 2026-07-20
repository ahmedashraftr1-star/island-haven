import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useConfirm } from "@/hooks/use-confirm";
import { SLOT_STATUS_LABELS, type SlotStatus } from "@/lib/labels";
import { Modal, Field, SaveBar } from "./adminShared";

interface ExpertOption {
  id: number;
  fullName: string;
}

interface Row {
  slot: {
    id: number;
    expertId: number;
    startAt: string;
    endAt: string;
    mode: "online" | "onsite";
    location: string;
    status: SlotStatus;
    note: string;
  };
  expert: { id: number; fullName: string };
}

interface FormRow {
  id: number;
  expertId: number;
  startAt: string;
  endAt: string;
  mode: "online" | "onsite";
  location: string;
  status: SlotStatus;
  note: string;
}

const EMPTY: FormRow = {
  id: 0,
  expertId: 0,
  startAt: "",
  endAt: "",
  mode: "online",
  location: "",
  status: "available",
  note: "",
};

function toLocalDatetime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminSlots() {
  const confirm = useConfirm();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [experts, setExperts] = useState<ExpertOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<FormRow | "new" | null>(null);

  async function reload() {
    try {
      const r = await api<{ slots: Row[] }>("/admin/slots");
      setRows(r.slots);
      const e = await api<{ experts: ExpertOption[] }>("/experts");
      setExperts(e.experts);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }
  useEffect(() => {
    void reload();
  }, []);

  async function onDelete(id: number) {
    if (!(await confirm({ title: "تأكيد الحذف", message: "حذف هذا الموعد؟", confirmLabel: "حذف", danger: true }))) return;
    await api(`/admin/slots/${id}`, { method: "DELETE" });
    void reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">مواعيد الخبراء</h2>
          <p className="text-[13px] text-foreground/65 mt-1">
            Office Hours — افتح فترات محدّدة على تقويم كلّ خبير، والروّاد يحجزون فورًا.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-[hsl(var(--primary-cta))] text-white text-[13px] font-semibold hover:shadow-soft-hover transition-shadow"
        >
          <Plus className="w-4 h-4" /> موعد جديد
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
            لا مواعيد بعد.
          </div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/40 text-foreground/65 text-[11.5px] tracking-[0.05em] uppercase">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">الخبير</th>
                <th className="text-right px-4 py-3 font-semibold">الموعد</th>
                <th className="text-right px-4 py-3 font-semibold">النّوع</th>
                <th className="text-right px-4 py-3 font-semibold">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold w-1">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const start = new Date(r.slot.startAt);
                const end = new Date(r.slot.endAt);
                return (
                  <tr key={r.slot.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {r.expert.fullName}
                    </td>
                    <td className="px-4 py-3 text-foreground/70">
                      <div>
                        {start.toLocaleDateString("ar-EG", {
                          weekday: "short",
                          day: "numeric",
                          month: "long",
                        })}
                      </div>
                      <div className="text-foreground/65 text-[12px] tabular-nums" dir="ltr">
                        {start.toLocaleTimeString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" → "}
                        {end.toLocaleTimeString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground/65">
                      {r.slot.mode === "online" ? "عن بُعد" : "في المساحة"}
                    </td>
                    <td className="px-4 py-3 text-foreground/65">
                      {SLOT_STATUS_LABELS[r.slot.status]}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing({ ...r.slot })}
                          aria-label="تعديل الموعد"
                          className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65 hover:text-primary transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(r.slot.id)}
                          aria-label="حذف الموعد"
                          className="p-2 rounded-lg hover:bg-rose-500/15 text-foreground/65 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <SlotEditor
          initial={editing === "new" ? { ...EMPTY } : editing}
          experts={experts}
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

function SlotEditor({
  initial,
  experts,
  onClose,
  onSaved,
}: {
  initial: FormRow;
  experts: ExpertOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = initial.id === 0;
  const [form, setForm] = useState<FormRow>({
    ...initial,
    startAt: initial.startAt ? toLocalDatetime(initial.startAt) : "",
    endAt: initial.endAt ? toLocalDatetime(initial.endAt) : "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        expertId: Number(form.expertId),
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        mode: form.mode,
        location: form.location,
        status: form.status,
        note: form.note,
      };
      await api(isNew ? "/admin/slots" : `/admin/slots/${initial.id}`, {
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
    <Modal title={isNew ? "موعد جديد" : "تعديل الموعد"} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="p-6 space-y-4">
        <Field label="الخبير">
          <select
            value={form.expertId}
            onChange={(e) =>
              setForm((s) => ({ ...s, expertId: Number(e.target.value) }))
            }
            className="inp"
            required
          >
            <option value={0}>— اختر خبيرًا —</option>
            {experts.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="من">
            <input
              type="datetime-local"
              value={form.startAt}
              onChange={(e) => setForm((s) => ({ ...s, startAt: e.target.value }))}
              className="inp"
              required
            />
          </Field>
          <Field label="إلى">
            <input
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => setForm((s) => ({ ...s, endAt: e.target.value }))}
              className="inp"
              required
            />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="نوع الجلسة">
            <select
              value={form.mode}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  mode: e.target.value as "online" | "onsite",
                }))
              }
              className="inp"
            >
              <option value="online">عن بُعد</option>
              <option value="onsite">في المساحة</option>
            </select>
          </Field>
          <Field label="المكان (إن في المساحة)">
            <input
              value={form.location}
              onChange={(e) =>
                setForm((s) => ({ ...s, location: e.target.value }))
              }
              className="inp"
              maxLength={400}
              placeholder="مثال: قاعة الاجتماعات A"
            />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="الحالة">
            <select
              value={form.status}
              onChange={(e) =>
                setForm((s) => ({ ...s, status: e.target.value as SlotStatus }))
              }
              className="inp"
            >
              {(Object.keys(SLOT_STATUS_LABELS) as SlotStatus[]).map((k) => (
                <option key={k} value={k}>
                  {SLOT_STATUS_LABELS[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ملاحظة داخليّة">
            <input
              value={form.note}
              onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
              className="inp"
              maxLength={1000}
            />
          </Field>
        </div>
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
