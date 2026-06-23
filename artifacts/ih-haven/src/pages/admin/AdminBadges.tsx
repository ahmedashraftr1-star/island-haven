import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Award, X, Search } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Modal, Field, SaveBar } from "./adminShared";

interface Badge {
  id: number;
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sortOrder: number;
}

interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
}

const EMPTY: Badge = {
  id: 0,
  key: "",
  name: "",
  description: "",
  icon: "award",
  color: "amber",
  sortOrder: 0,
};

// Tailwind-friendly colour names mapped to a swatch class for the picker.
const COLORS: { value: string; swatch: string }[] = [
  { value: "amber", swatch: "bg-amber-400" },
  { value: "rose", swatch: "bg-rose-400" },
  { value: "emerald", swatch: "bg-emerald-400" },
  { value: "sky", swatch: "bg-sky-400" },
  { value: "violet", swatch: "bg-violet-400" },
  { value: "orange", swatch: "bg-orange-400" },
  { value: "slate", swatch: "bg-slate-400" },
];

export default function AdminBadges() {
  const [rows, setRows] = useState<Badge[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Badge | "new" | null>(null);

  async function reload() {
    try {
      setRows((await api<{ badges: Badge[] }>("/admin/badges")).badges);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }
  useEffect(() => {
    void reload();
  }, []);

  async function onDelete(id: number) {
    if (!window.confirm("حذف هذه الشّارة؟ سيُلغى منحها من كلّ المنتسبين.")) return;
    await api(`/admin/badges/${id}`, { method: "DELETE" });
    void reload();
  }

  return (
    <div className="space-y-7">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-bold text-foreground">الشّارات</h2>
            <p className="text-[13px] text-foreground/55 mt-1">
              شارات تقدير تُمنح للمنتسبين وتُحسب في لوحة الصدارة.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:shadow-soft-hover transition-shadow"
          >
            <Plus className="w-4 h-4" /> شارة جديدة
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
            <div className="p-12 text-center text-foreground/55 text-[14px]">
              لا شارات بعد.
            </div>
          ) : (
            <table className="w-full text-[13.5px]">
              <thead className="bg-muted/40 text-foreground/55 text-[11.5px] tracking-[0.05em] uppercase">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold">الشّارة</th>
                  <th className="text-right px-4 py-3 font-semibold">المُعرّف</th>
                  <th className="text-right px-4 py-3 font-semibold">اللون</th>
                  <th className="text-right px-4 py-3 font-semibold w-1">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-border hover:bg-muted/20"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-semibold text-foreground">
                        <Award className="w-4 h-4 text-amber-500" />
                        {r.name}
                      </div>
                      {r.description && (
                        <div className="text-[11.5px] text-foreground/45 mt-0.5">
                          {r.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground/65" dir="ltr">
                      <code className="text-[12px]">{r.key}</code>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-foreground/65 text-[12px]">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            COLORS.find((c) => c.value === r.color)?.swatch ??
                            "bg-amber-400"
                          }`}
                        />
                        {r.color}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(r)}
                          aria-label={`تعديل شارة ${r.name}`}
                          className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65 hover:text-primary"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(r.id)}
                          aria-label={`حذف شارة ${r.name}`}
                          className="p-2 rounded-lg hover:bg-rose-500/10 text-foreground/65 hover:text-rose-400"
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
      </div>

      <AwardSection badges={rows ?? []} />

      {editing && (
        <BadgeEditor
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

// ─── Award / revoke a badge to a member ──────────────────────────────────────

function AwardSection({ badges }: { badges: Badge[] }) {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [badgeId, setBadgeId] = useState<number | "">("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function search() {
    setErr(null);
    try {
      const r = await api<{ users: AdminUser[] }>(
        `/admin/users?q=${encodeURIComponent(q)}`,
      );
      setUsers(r.users.slice(0, 12));
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "تعذّر البحث");
    }
  }

  const canAward = useMemo(
    () => !!selectedUser && badgeId !== "" && !busy,
    [selectedUser, badgeId, busy],
  );

  async function award() {
    if (!selectedUser || badgeId === "") return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await api(`/admin/users/${selectedUser.id}/badges`, {
        method: "POST",
        body: JSON.stringify({ badgeId }),
      });
      setMsg(`تم منح الشّارة إلى ${selectedUser.fullName}.`);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "تعذّر المنح");
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (!selectedUser || badgeId === "") return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await api(`/admin/users/${selectedUser.id}/badges/${badgeId}`, {
        method: "DELETE",
      });
      setMsg(`تم سحب الشّارة من ${selectedUser.fullName}.`);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "تعذّر السحب");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
      <div>
        <h3 className="text-[16px] font-bold text-foreground">
          منح / سحب شارة
        </h3>
        <p className="text-[12.5px] text-foreground/55 mt-1">
          ابحث عن منتسب، اختر شارة، ثم امنحها أو اسحبها.
        </p>
      </div>

      {/* User search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
        className="flex gap-2"
      >
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5 bg-muted/40 border border-border focus-within:bg-muted/60 transition-colors">
          <Search className="w-4 h-4 text-foreground/45 shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="اسم المنتسب أو بريده…"
            className="w-full bg-transparent outline-none text-[14px]"
            maxLength={80}
          />
        </div>
        <button
          type="submit"
          className="px-5 h-[42px] rounded-xl bg-foreground/[0.06] text-foreground/80 font-semibold text-[13px] hover:bg-foreground/[0.1] transition-colors"
        >
          بحث
        </button>
      </form>

      {users !== null && (
        <div className="flex flex-wrap gap-2">
          {users.length === 0 ? (
            <span className="text-[12.5px] text-foreground/45">
              لا نتائج مطابقة.
            </span>
          ) : (
            users.map((u) => {
              const active = selectedUser?.id === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelectedUser(u)}
                  aria-pressed={active ? "true" : "false"}
                  className={`inline-flex items-center gap-2 px-3 h-9 rounded-full text-[12.5px] font-semibold border transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/40 text-foreground/70 border-border hover:border-foreground/25"
                  }`}
                >
                  {u.fullName}
                </button>
              );
            })
          )}
        </div>
      )}

      {selectedUser && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-[12.5px] text-foreground/80 font-semibold">
          المنتسب: {selectedUser.fullName}
          <button
            type="button"
            onClick={() => setSelectedUser(null)}
            aria-label="إلغاء اختيار المنتسب"
            className="text-foreground/45 hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Badge picker + actions */}
      <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
        <Field label="الشّارة">
          <select
            value={badgeId}
            onChange={(e) =>
              setBadgeId(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="inp"
          >
            <option value="">— اختر شارة —</option>
            {badges.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <button
          type="button"
          onClick={() => void award()}
          disabled={!canAward}
          className="h-11 px-5 rounded-full bg-primary text-primary-foreground font-semibold text-[13px] enabled:hover:shadow-soft-hover transition-shadow disabled:opacity-50"
        >
          منح
        </button>
        <button
          type="button"
          onClick={() => void revoke()}
          disabled={!canAward}
          className="h-11 px-5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/25 font-semibold text-[13px] enabled:hover:bg-rose-500/20 transition-colors disabled:opacity-50"
        >
          سحب
        </button>
      </div>

      {msg && (
        <div className="rounded-xl px-4 py-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[13px]">
          {msg}
        </div>
      )}
      {err && (
        <div className="rounded-xl px-4 py-3 bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[13px]">
          {err}
        </div>
      )}
    </div>
  );
}

// ─── Badge create / edit modal ───────────────────────────────────────────────

function BadgeEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: Badge;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = initial.id === 0;
  const [form, setForm] = useState<Badge>(initial);
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
      await api(isNew ? "/admin/badges" : `/admin/badges/${initial.id}`, {
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
    <Modal title={isNew ? "شارة جديدة" : "تعديل الشّارة"} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="p-6 space-y-4">
        <Field label="الاسم">
          <input
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            className="inp"
            maxLength={120}
            placeholder="مثال: رائد المجتمع"
          />
        </Field>
        <Field label="المُعرّف (key — لاتيني، فريد)">
          <input
            dir="ltr"
            value={form.key}
            onChange={(e) => setForm((s) => ({ ...s, key: e.target.value }))}
            className="inp"
            maxLength={40}
            placeholder="community-leader"
          />
        </Field>
        <Field label="الوصف">
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) =>
              setForm((s) => ({ ...s, description: e.target.value }))
            }
            className="inp resize-none leading-[1.85]"
            maxLength={300}
            placeholder="لِمَ تُمنح هذه الشّارة؟"
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="الأيقونة (اسم lucide)">
            <input
              dir="ltr"
              value={form.icon}
              onChange={(e) => setForm((s) => ({ ...s, icon: e.target.value }))}
              className="inp"
              maxLength={40}
              placeholder="award"
            />
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
        <Field label="اللون">
          <select
            value={form.color}
            onChange={(e) => setForm((s) => ({ ...s, color: e.target.value }))}
            className="inp"
          >
            {COLORS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.value}
              </option>
            ))}
          </select>
        </Field>
        {error && (
          <div className="rounded-xl px-4 py-3 bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[13px]">
            {error}
          </div>
        )}
        <SaveBar submitting={submitting} isNew={isNew} onClose={onClose} />
      </form>
    </Modal>
  );
}
