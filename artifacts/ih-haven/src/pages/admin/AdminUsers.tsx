import { useEffect, useState } from "react";
import { Search, Pencil, Trash2, X, ShieldOff, ShieldCheck } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type UserRole = "freelancer" | "graduate" | "student" | "other";
type Status = "active" | "banned";

const ROLE_LABELS: Record<UserRole, string> = {
  freelancer: "مستقلّ",
  graduate: "خرّيج",
  student: "طالب",
  other: "أخرى",
};

interface Row {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  status: Status;
  bio: string;
  phone: string;
  skills: string;
  avatarUrl: string | null;
  createdAt: string;
}

const STATUS_PILL: Record<Status, string> = {
  active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  banned: "bg-rose-50 text-rose-700 border border-rose-200",
};
const STATUS_LABEL: Record<Status, string> = {
  active: "نشط",
  banned: "مُعلَّق",
};

export default function AdminUsers() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [editing, setEditing] = useState<Row | null>(null);

  async function reload() {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (role) params.set("role", role);
      if (status) params.set("status", status);
      const r = await api<{ users: Row[] }>(
        `/admin/users${params.toString() ? `?${params}` : ""}`,
      );
      setRows(r.users);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, status]);

  async function onDelete(id: number, name: string) {
    if (!window.confirm(`حذف المستخدم «${name}» نهائيًّا؟ هذا يحذف أعماله وتسجيلاته أيضًا.`)) return;
    try {
      await api(`/admin/users/${id}`, { method: "DELETE" });
      void reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحذف");
    }
  }

  async function toggleBan(u: Row) {
    const next: Status = u.status === "banned" ? "active" : "banned";
    try {
      await api(`/admin/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      void reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحديث");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold text-foreground">المستخدمون</h2>
        <p className="text-[13px] text-foreground/55 mt-1">
          أدِر الحسابات المسجَّلة — تعديل، تعليق، حذف.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/45" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && reload()}
            placeholder="ابحث بالاسم أو البريد…"
            className="w-full h-10 pr-10 pl-3 rounded-xl bg-white border border-border text-[13.5px] outline-none focus:border-primary/50"
            data-testid="input-search-users"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-10 px-3 rounded-xl bg-white border border-border text-[13px] outline-none"
        >
          <option value="">كل الفئات</option>
          <option value="freelancer">مستقلّ</option>
          <option value="graduate">خرّيج</option>
          <option value="student">طالب</option>
          <option value="other">أخرى</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 px-3 rounded-xl bg-white border border-border text-[13px] outline-none"
        >
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="banned">مُعلَّق</option>
        </select>
        <button
          onClick={() => reload()}
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:shadow-soft-hover transition-shadow"
        >
          بحث
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
            لا توجد نتائج.
          </div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/40 text-foreground/55 text-[11.5px] tracking-[0.05em] uppercase">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">الاسم</th>
                <th className="text-right px-4 py-3 font-semibold">البريد</th>
                <th className="text-right px-4 py-3 font-semibold">الفئة</th>
                <th className="text-right px-4 py-3 font-semibold">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold">انضمّ</th>
                <th className="text-right px-4 py-3 font-semibold w-1">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-border hover:bg-muted/20"
                  data-testid={`admin-user-row-${u.id}`}
                >
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {u.fullName}
                    {u.phone && (
                      <div className="text-[11.5px] text-foreground/45 font-normal mt-0.5" dir="ltr">
                        {u.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground/65" dir="ltr">
                    {u.email}
                  </td>
                  <td className="px-4 py-3 text-foreground/65">
                    {ROLE_LABELS[u.role]}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_PILL[u.status]}`}>
                      {STATUS_LABEL[u.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground/55 text-[12px] tabular-nums">
                    {new Date(u.createdAt).toLocaleDateString("ar-EG")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditing(u)}
                        className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65 hover:text-primary"
                        title="تعديل"
                        data-testid={`button-edit-user-${u.id}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleBan(u)}
                        className={`p-2 rounded-lg ${
                          u.status === "banned"
                            ? "hover:bg-emerald-50 text-foreground/65 hover:text-emerald-600"
                            : "hover:bg-amber-50 text-foreground/65 hover:text-amber-600"
                        }`}
                        title={u.status === "banned" ? "إلغاء التعليق" : "تعليق الحساب"}
                        data-testid={`button-ban-user-${u.id}`}
                      >
                        {u.status === "banned" ? (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        ) : (
                          <ShieldOff className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => onDelete(u.id, u.fullName)}
                        className="p-2 rounded-lg hover:bg-rose-50 text-foreground/65 hover:text-rose-600"
                        title="حذف"
                        data-testid={`button-delete-user-${u.id}`}
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
        <UserEditor
          initial={editing}
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

function UserEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: Row;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    fullName: initial.fullName,
    role: initial.role,
    status: initial.status,
    bio: initial.bio || "",
    phone: initial.phone || "",
    skills: initial.skills || "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        fullName: form.fullName,
        role: form.role,
        status: form.status,
        bio: form.bio,
        phone: form.phone,
        skills: form.skills,
      };
      if (form.password.length >= 8) body["password"] = form.password;
      await api(`/admin/users/${initial.id}`, {
        method: "PATCH",
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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl border border-border w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-[16px] font-bold text-foreground">
            تعديل حساب — {initial.email}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-foreground/[0.04]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4" noValidate>
          <Field label="الاسم الكامل">
            <input
              value={form.fullName}
              onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
              className="w-full bg-transparent outline-none text-[14px]"
              maxLength={120}
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="الفئة">
              <select
                value={form.role}
                onChange={(e) => setForm((s) => ({ ...s, role: e.target.value as UserRole }))}
                className="w-full bg-transparent outline-none text-[14px]"
              >
                <option value="freelancer">مستقلّ</option>
                <option value="graduate">خرّيج</option>
                <option value="student">طالب</option>
                <option value="other">أخرى</option>
              </select>
            </Field>
            <Field label="الحالة">
              <select
                value={form.status}
                onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as Status }))}
                className="w-full bg-transparent outline-none text-[14px]"
              >
                <option value="active">نشط</option>
                <option value="banned">مُعلَّق</option>
              </select>
            </Field>
          </div>
          <Field label="الهاتف">
            <input
              dir="ltr"
              value={form.phone}
              onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
              className="w-full bg-transparent outline-none text-[14px]"
              maxLength={40}
            />
          </Field>
          <Field label="المهارات (مفصولة بفواصل)">
            <input
              value={form.skills}
              onChange={(e) => setForm((s) => ({ ...s, skills: e.target.value }))}
              className="w-full bg-transparent outline-none text-[14px]"
              maxLength={500}
            />
          </Field>
          <Field label="نبذة">
            <textarea
              rows={4}
              value={form.bio}
              onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value }))}
              className="w-full bg-transparent outline-none text-[14px] resize-none leading-[1.85]"
              maxLength={2000}
            />
          </Field>
          <Field label="إعادة تعيين كلمة السرّ (اتركه فارغًا للإبقاء على الحاليّة)">
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              className="w-full bg-transparent outline-none text-[14px]"
              minLength={8}
              maxLength={200}
              autoComplete="new-password"
            />
          </Field>

          {error && (
            <div className="rounded-xl px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 text-[13px]">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-11 rounded-full bg-primary text-primary-foreground font-semibold text-[13.5px] disabled:opacity-50"
              data-testid="button-save-user"
            >
              {submitting ? "جارِ الحفظ…" : "حفظ التعديلات"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 h-11 rounded-full bg-muted text-foreground/75 font-semibold text-[13.5px]"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block mb-1.5 text-[12px] text-foreground/65 font-semibold">
        {label}
      </label>
      <div className="rounded-xl px-3 py-2.5 bg-muted/40 border border-border focus-within:bg-muted/60 transition-colors">
        {children}
      </div>
    </div>
  );
}
