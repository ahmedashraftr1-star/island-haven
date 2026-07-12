import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { TEAM_ROLE_GROUP_LABELS, type TeamRoleGroup } from "@/lib/labels";
import { Modal, Field, SaveBar } from "./adminShared";

interface Row {
  id: number;
  fullName: string;
  role: string;
  bio: string;
  avatarUrl: string | null;
  linkedinUrl: string;
  websiteUrl: string;
  email: string;
  group: TeamRoleGroup;
  featured: boolean;
  sortOrder: number;
  status: "visible" | "hidden";
}

const EMPTY: Row = {
  id: 0,
  fullName: "",
  role: "",
  bio: "",
  avatarUrl: "",
  linkedinUrl: "",
  websiteUrl: "",
  email: "",
  group: "leadership",
  featured: false,
  sortOrder: 0,
  status: "visible",
};

export default function AdminTeam() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | "new" | null>(null);

  async function reload() {
    try {
      setRows((await api<{ team: Row[] }>("/admin/team")).team);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }
  useEffect(() => {
    void reload();
  }, []);

  async function onDelete(id: number) {
    if (!window.confirm("حذف هذا العضو من الفريق؟")) return;
    await api(`/admin/team/${id}`, { method: "DELETE" });
    void reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">فريق آيلاند</h2>
          <p className="text-[13px] text-foreground/65 mt-1">
            الأشخاص الظاهرون في صفحة <span dir="ltr">/team</span> — قيادة، مرشدون، مستشارون، فريق الدّعم.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-[hsl(var(--primary-cta))] text-white text-[13px] font-semibold hover:shadow-soft-hover transition-shadow"
        >
          <Plus className="w-4 h-4" /> عضو جديد
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
            لا أحد بعد — أضف أوّل عضو فريق.
          </div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/40 text-foreground/65 text-[11.5px] tracking-[0.05em] uppercase">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">العضو</th>
                <th className="text-right px-4 py-3 font-semibold">المجموعة</th>
                <th className="text-right px-4 py-3 font-semibold">الترتيب</th>
                <th className="text-right px-4 py-3 font-semibold">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold w-1">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.avatarUrl ? (
                        <img loading="lazy" decoding="async"
                          src={r.avatarUrl}
                          alt=""
                          className="h-9 w-9 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-foreground/55 font-bold text-[13px]">
                          {r.fullName.trim().charAt(0) || "؟"}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          {r.fullName}
                          {r.featured && (
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          )}
                        </div>
                        {r.role && <div className="text-foreground/65 text-[12px]">{r.role}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground/65">
                    {TEAM_ROLE_GROUP_LABELS[r.group]}
                  </td>
                  <td className="px-4 py-3 text-foreground/65 tabular-nums">{r.sortOrder}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        r.status === "visible"
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : "bg-muted text-foreground/70 border border-border"
                      }`}
                    >
                      {r.status === "visible" ? "ظاهر" : "مخفيّ"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(r)}
                        aria-label="تعديل العضو"
                        className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65 hover:text-primary transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(r.id)}
                        aria-label="حذف العضو"
                        className="p-2 rounded-lg hover:bg-rose-500/15 text-foreground/65 hover:text-rose-400 transition-colors"
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
        <TeamMemberEditor
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

function TeamMemberEditor({
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
      await api(isNew ? "/admin/team" : `/admin/team/${initial.id}`, {
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
    <Modal title={isNew ? "عضو فريق جديد" : "تعديل عضو الفريق"} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="p-6 space-y-4">
        <Field label="الاسم الكامل">
          <input
            value={form.fullName}
            onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
            className="inp"
            maxLength={200}
          />
        </Field>
        <Field label="الدور / المسمّى الوظيفي">
          <input
            value={form.role}
            onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}
            className="inp"
            maxLength={200}
            placeholder="مثال: المؤسّس · Founder"
          />
        </Field>
        <Field label="نبذة">
          <textarea
            value={form.bio}
            onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value }))}
            className="inp min-h-[100px]"
            maxLength={1200}
            rows={4}
          />
        </Field>
        <Field label="صورة الـ avatar (URL)">
          <input
            dir="ltr"
            value={form.avatarUrl ?? ""}
            onChange={(e) => setForm((s) => ({ ...s, avatarUrl: e.target.value }))}
            className="inp"
            maxLength={800}
            placeholder="/api/storage/… أو https://"
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="LinkedIn">
            <input
              dir="ltr"
              value={form.linkedinUrl}
              onChange={(e) => setForm((s) => ({ ...s, linkedinUrl: e.target.value }))}
              className="inp"
              maxLength={400}
              placeholder="https://www.linkedin.com/in/…"
            />
          </Field>
          <Field label="الموقع الشخصي">
            <input
              dir="ltr"
              value={form.websiteUrl}
              onChange={(e) => setForm((s) => ({ ...s, websiteUrl: e.target.value }))}
              className="inp"
              maxLength={400}
              placeholder="https://"
            />
          </Field>
        </div>
        <Field label="البريد الإلكتروني (اختياري)">
          <input
            dir="ltr"
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            className="inp"
            maxLength={200}
            placeholder="name@example.com"
          />
        </Field>
        <div className="grid sm:grid-cols-4 gap-4">
          <Field label="المجموعة">
            <select
              value={form.group}
              onChange={(e) => setForm((s) => ({ ...s, group: e.target.value as TeamRoleGroup }))}
              className="inp"
            >
              {(Object.keys(TEAM_ROLE_GROUP_LABELS) as TeamRoleGroup[]).map((k) => (
                <option key={k} value={k}>
                  {TEAM_ROLE_GROUP_LABELS[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="الحالة">
            <select
              value={form.status}
              onChange={(e) =>
                setForm((s) => ({ ...s, status: e.target.value as Row["status"] }))
              }
              className="inp"
            >
              <option value="visible">ظاهر</option>
              <option value="hidden">مخفيّ</option>
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
          <Field label="مميَّز">
            <label className="inline-flex items-center gap-2 h-10 px-3 rounded-xl border border-border bg-card cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((s) => ({ ...s, featured: e.target.checked }))}
              />
              <span className="text-[13px] text-foreground/75">يظهر بشارة Featured</span>
            </label>
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
