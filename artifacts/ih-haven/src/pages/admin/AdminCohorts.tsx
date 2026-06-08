import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { COHORT_STATUS_LABELS, type CohortStatus } from "@/lib/labels";
import { Modal, Field, SaveBar } from "./adminShared";

interface Program {
  id: number;
  title: string;
}

interface Row {
  id: number;
  programId: number;
  programTitle: string;
  name: string;
  slug: string;
  summary: string;
  description: string;
  coverUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  demoDayAt: string | null;
  demoDayLocation: string;
  demoDayUrl: string;
  status: CohortStatus;
  sortOrder: number;
  ventureCount: number;
}

interface Venture {
  id: number;
  name: string;
}

interface Membership {
  id: number;
  cohortId: number;
  ventureId: number;
  status: "active" | "graduated" | "paused" | "dropped";
  joinedAt: string;
  notes: string;
}

const EMPTY: Omit<Row, "id" | "programTitle" | "ventureCount"> = {
  programId: 0,
  name: "",
  slug: "",
  summary: "",
  description: "",
  coverUrl: "",
  startsAt: null,
  endsAt: null,
  demoDayAt: null,
  demoDayLocation: "",
  demoDayUrl: "",
  status: "announced",
  sortOrder: 0,
};

export default function AdminCohorts() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [managing, setManaging] = useState<Row | null>(null);

  async function reload() {
    try {
      const r = await api<{ cohorts: Row[] }>("/admin/cohorts");
      setRows(r.cohorts);
      const p = await api<{ programs: Program[] }>("/admin/programs");
      setPrograms(p.programs);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }
  useEffect(() => {
    void reload();
  }, []);

  async function onDelete(id: number) {
    if (!window.confirm("حذف هذه الدّفعة؟")) return;
    await api(`/admin/cohorts/${id}`, { method: "DELETE" });
    void reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">دفعات الاحتضان</h2>
          <p className="text-[13px] text-foreground/55 mt-1">
            كلّ برنامج له دفعات (Winter 2026 ...) — هنا تُدير الدّفعات والمشاريع المنضمّة لكلّ منها.
          </p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:shadow-soft-hover transition-shadow"
        >
          <Plus className="w-4 h-4" /> دفعة جديدة
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
            لا دفعات بعد — أنشئ أوّل دفعة.
          </div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/40 text-foreground/55 text-[11.5px] tracking-[0.05em] uppercase">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">الدّفعة</th>
                <th className="text-right px-4 py-3 font-semibold">البرنامج</th>
                <th className="text-right px-4 py-3 font-semibold">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold">المشاريع</th>
                <th className="text-right px-4 py-3 font-semibold w-1">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{r.name}</div>
                    <div className="text-foreground/55 text-[12px]" dir="ltr">/cohorts/{r.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-foreground/70">{r.programTitle}</td>
                  <td className="px-4 py-3 text-foreground/65">
                    {COHORT_STATUS_LABELS[r.status]}
                  </td>
                  <td className="px-4 py-3 text-foreground/55 tabular-nums">
                    {r.ventureCount}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setManaging(r)}
                        title="إدارة المشاريع"
                        className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65 hover:text-primary"
                      >
                        <Users className="w-3.5 h-3.5" />
                      </button>
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
        <CohortEditor
          initial={editing === "new" ? { ...EMPTY, id: 0, programTitle: "", ventureCount: 0 } : editing}
          programs={programs}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void reload();
          }}
        />
      )}
      {managing && (
        <CohortVenturesManager
          cohort={managing}
          onClose={() => {
            setManaging(null);
            void reload();
          }}
        />
      )}
    </div>
  );
}

function toLocalDatetime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalDatetime(s: string): string | null {
  if (!s) return null;
  return new Date(s).toISOString();
}

function CohortEditor({
  initial,
  programs,
  onClose,
  onSaved,
}: {
  initial: Row;
  programs: Program[];
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
      const body = {
        programId: Number(form.programId),
        name: form.name,
        slug: form.slug,
        summary: form.summary,
        description: form.description,
        coverUrl: form.coverUrl || null,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
        demoDayAt: form.demoDayAt,
        demoDayLocation: form.demoDayLocation,
        demoDayUrl: form.demoDayUrl,
        status: form.status,
        sortOrder: form.sortOrder,
      };
      await api(isNew ? "/admin/cohorts" : `/admin/cohorts/${initial.id}`, {
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
    <Modal title={isNew ? "دفعة جديدة" : "تعديل الدّفعة"} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="p-6 space-y-4">
        <Field label="البرنامج">
          <select
            value={form.programId}
            onChange={(e) =>
              setForm((s) => ({ ...s, programId: Number(e.target.value) }))
            }
            className="inp"
            required
          >
            <option value={0}>— اختر برنامجًا —</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="الاسم">
            <input
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              className="inp"
              maxLength={200}
              placeholder="مثال: Winter 2026"
            />
          </Field>
          <Field label="slug (للرابط)">
            <input
              dir="ltr"
              value={form.slug}
              onChange={(e) =>
                setForm((s) => ({ ...s, slug: e.target.value.toLowerCase() }))
              }
              className="inp"
              maxLength={80}
              placeholder="winter-2026"
            />
          </Field>
        </div>
        <Field label="ملخّص">
          <input
            value={form.summary}
            onChange={(e) => setForm((s) => ({ ...s, summary: e.target.value }))}
            className="inp"
            maxLength={400}
          />
        </Field>
        <Field label="الوصف الكامل">
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((s) => ({ ...s, description: e.target.value }))
            }
            className="inp min-h-[120px]"
            maxLength={8000}
            rows={5}
          />
        </Field>
        <Field label="رابط صورة الغلاف">
          <input
            dir="ltr"
            value={form.coverUrl ?? ""}
            onChange={(e) =>
              setForm((s) => ({ ...s, coverUrl: e.target.value }))
            }
            className="inp"
            maxLength={800}
            placeholder="https://"
          />
        </Field>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="البداية">
            <input
              type="datetime-local"
              value={toLocalDatetime(form.startsAt)}
              onChange={(e) =>
                setForm((s) => ({ ...s, startsAt: fromLocalDatetime(e.target.value) }))
              }
              className="inp"
            />
          </Field>
          <Field label="النهاية">
            <input
              type="datetime-local"
              value={toLocalDatetime(form.endsAt)}
              onChange={(e) =>
                setForm((s) => ({ ...s, endsAt: fromLocalDatetime(e.target.value) }))
              }
              className="inp"
            />
          </Field>
          <Field label="يوم العرض">
            <input
              type="datetime-local"
              value={toLocalDatetime(form.demoDayAt)}
              onChange={(e) =>
                setForm((s) => ({ ...s, demoDayAt: fromLocalDatetime(e.target.value) }))
              }
              className="inp"
            />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="مكان يوم العرض">
            <input
              value={form.demoDayLocation}
              onChange={(e) =>
                setForm((s) => ({ ...s, demoDayLocation: e.target.value }))
              }
              className="inp"
              maxLength={400}
            />
          </Field>
          <Field label="رابط يوم العرض">
            <input
              dir="ltr"
              value={form.demoDayUrl}
              onChange={(e) =>
                setForm((s) => ({ ...s, demoDayUrl: e.target.value }))
              }
              className="inp"
              maxLength={400}
              placeholder="https://"
            />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="الحالة">
            <select
              value={form.status}
              onChange={(e) =>
                setForm((s) => ({ ...s, status: e.target.value as CohortStatus }))
              }
              className="inp"
            >
              {(Object.keys(COHORT_STATUS_LABELS) as CohortStatus[]).map((k) => (
                <option key={k} value={k}>
                  {COHORT_STATUS_LABELS[k]}
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
                setForm((s) => ({ ...s, sortOrder: Number(e.target.value) || 0 }))
              }
              className="inp tabular-nums"
            />
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

function CohortVenturesManager({
  cohort,
  onClose,
}: {
  cohort: Row;
  onClose: () => void;
}) {
  const [memberships, setMemberships] = useState<
    Array<{ membership: Membership; venture: Venture }>
  >([]);
  const [allVentures, setAllVentures] = useState<Venture[]>([]);
  const [picked, setPicked] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    try {
      const r = await api<{
        ventures: Array<{ membership: Membership; venture: Venture }>;
      }>(`/cohorts/${cohort.slug}`);
      setMemberships(r.ventures);
      const v = await api<{ ventures: Venture[] }>("/ventures");
      setAllVentures(v.ventures);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }
  useEffect(() => {
    void reload();
  }, [cohort.slug]);

  async function onAdd() {
    if (!picked) return;
    try {
      await api(`/admin/cohorts/${cohort.id}/ventures`, {
        method: "POST",
        body: JSON.stringify({ ventureId: picked }),
      });
      setPicked(0);
      void reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الإضافة");
    }
  }

  async function onRemove(ventureId: number) {
    if (!window.confirm("إزالة هذا المشروع من الدّفعة؟")) return;
    await api(`/admin/cohorts/${cohort.id}/ventures/${ventureId}`, {
      method: "DELETE",
    });
    void reload();
  }

  const inCohort = new Set(memberships.map((m) => m.venture.id));
  const candidates = allVentures.filter((v) => !inCohort.has(v.id));

  return (
    <Modal title={`مشاريع · ${cohort.name}`} onClose={onClose}>
      <div className="p-6 space-y-5">
        {error && (
          <div className="rounded-xl px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 text-[13px]">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-border p-4 bg-muted/30">
          <div className="text-[12.5px] font-semibold text-foreground/75 mb-2">
            إضافة مشروع للدّفعة
          </div>
          <div className="flex items-center gap-2">
            <select
              value={picked}
              onChange={(e) => setPicked(Number(e.target.value))}
              className="inp flex-1"
            >
              <option value={0}>— اختر مشروعًا —</option>
              {candidates.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onAdd}
              disabled={!picked}
              className="px-4 h-10 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold disabled:opacity-50"
            >
              إضافة
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          {memberships.length === 0 ? (
            <div className="p-8 text-center text-foreground/55 text-[13px]">
              لا مشاريع في هذه الدّفعة بعد.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {memberships.map((row) => (
                <li
                  key={row.venture.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <div className="font-semibold text-foreground">
                      {row.venture.name}
                    </div>
                    <div className="text-[12px] text-foreground/55">
                      {row.membership.status === "active"
                        ? "نشط"
                        : row.membership.status === "graduated"
                          ? "متخرّج"
                          : row.membership.status === "paused"
                            ? "متوقّف"
                            : "منسحب"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(row.venture.id)}
                    className="p-2 rounded-lg hover:bg-rose-50 text-foreground/65 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
