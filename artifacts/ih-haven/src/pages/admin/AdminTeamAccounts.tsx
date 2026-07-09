import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Shield, Trash2, KeyRound, Power, X, Check } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import {
  ADMIN_SECTIONS,
  ADMIN_ROLES,
  permissionsForRole,
  type AdminRole,
} from "@workspace/db/contracts";

// ── Team & Permissions — create/manage staff accounts + a per-account
// permission matrix (section × view/manage/send). Reuses the ONE RBAC taxonomy
// shared with the API via @workspace/db/contracts, so UI and enforcement never
// drift. Dark admin surface, RTL.

interface AdminAccount {
  id: number;
  email: string;
  fullName: string;
  role: AdminRole;
  permissions: string[];
  status: "active" | "disabled";
  lastLoginAt: string | null;
  createdAt: string;
}

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "مدير أعلى",
  manager: "مدير",
  content_editor: "محرّر محتوى",
  mentor_coordinator: "منسّق إرشاد",
  analyst: "محلّل بيانات",
  support: "دعم",
  custom: "مخصّص",
};

const ACTION_LABELS: Record<string, string> = { view: "عرض", manage: "إدارة", send: "إرسال" };

function fmtDate(s: string | null): string {
  if (!s) return "لم يسجّل دخول";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

/** The section × action checkbox grid. Controlled by a permission Set. */
function PermissionMatrix({
  value,
  onChange,
  disabled,
}: {
  value: Set<string>;
  onChange: (next: Set<string>) => void;
  disabled?: boolean;
}) {
  const toggle = (perm: string) => {
    const next = new Set(value);
    if (next.has(perm)) next.delete(perm);
    else next.add(perm);
    onChange(next);
  };
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 bg-foreground/[0.03] text-[11px] font-bold text-foreground/60">
        <span>القسم</span>
        <span>الصلاحيّات</span>
      </div>
      <div className="max-h-[46vh] overflow-y-auto divide-y divide-border">
        {ADMIN_SECTIONS.map((s) => (
          <div key={s.key} className="grid grid-cols-[1fr_auto] items-center gap-2 px-3 py-2">
            <span className="text-[13px] text-foreground/85">{s.labelAr}</span>
            <div className="flex gap-1.5">
              {s.actions.map((a) => {
                const perm = `${s.key}:${a}`;
                const on = value.has(perm);
                return (
                  <button
                    key={a}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggle(perm)}
                    aria-pressed={on ? "true" : "false"}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${
                      on
                        ? "bg-primary/20 text-primary border border-primary/40"
                        : "bg-foreground/[0.04] text-foreground/50 border border-border hover:text-foreground/80"
                    } disabled:opacity-50`}
                  >
                    {on && <Check className="w-3 h-3" />}
                    {ACTION_LABELS[a] ?? a}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface EditorState {
  id: number | null; // null → create
  email: string;
  fullName: string;
  password: string;
  role: AdminRole;
  permissions: Set<string>;
  status: "active" | "disabled";
}

export default function AdminTeamAccounts() {
  const qc = useQueryClient();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-staff"],
    queryFn: () => api<{ team: AdminAccount[] }>("/admin/staff"),
  });
  const accounts = data?.team ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-staff"] });

  const saveMut = useMutation({
    mutationFn: async (s: EditorState) => {
      const body = {
        fullName: s.fullName,
        role: s.role,
        permissions: [...s.permissions],
        ...(s.password ? { password: s.password } : {}),
      };
      if (s.id === null) {
        return api("/admin/staff", { method: "POST", body: JSON.stringify({ email: s.email, ...body }) });
      }
      return api(`/admin/staff/${s.id}`, { method: "PATCH", body: JSON.stringify({ ...body, status: s.status }) });
    },
    onSuccess: () => { setEditor(null); setError(null); invalidate(); },
    onError: (e) => setError(e instanceof ApiError ? e.message : "تعذّر الحفظ"),
  });

  const toggleStatusMut = useMutation({
    mutationFn: (a: AdminAccount) =>
      api(`/admin/staff/${a.id}`, { method: "PATCH", body: JSON.stringify({ status: a.status === "active" ? "disabled" : "active" }) }),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : "تعذّر التحديث"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api(`/admin/staff/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : "تعذّر الحذف"),
  });

  const openCreate = () =>
    setEditor({ id: null, email: "", fullName: "", password: "", role: "support", permissions: new Set(permissionsForRole("support")), status: "active" });
  const openEdit = (a: AdminAccount) =>
    setEditor({ id: a.id, email: a.email, fullName: a.fullName, password: "", role: a.role, permissions: new Set(a.permissions), status: a.status });

  const applyPreset = (role: AdminRole) => {
    if (!editor) return;
    setEditor({ ...editor, role, permissions: role === "custom" ? editor.permissions : new Set(permissionsForRole(role)) });
  };

  const canSave = useMemo(() => {
    if (!editor) return false;
    if (editor.id === null) return editor.email.includes("@") && editor.fullName.trim().length >= 2 && editor.password.length >= 10;
    return editor.fullName.trim().length >= 2 && (editor.password === "" || editor.password.length >= 10);
  }, [editor]);

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-[20px] font-bold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> الفريق والصلاحيّات
          </h2>
          <p className="text-[13px] text-foreground/60 mt-1">
            أنشئ حسابات لأعضاء الفريق وحدّد صلاحيّة كلّ واحد بدقّة — يرى كلّ عضو أقسام لوحته المسموح بها فقط.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          data-testid="staff-add"
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 h-11 text-[13.5px] font-bold hover:opacity-90 transition-opacity"
        >
          <UserPlus className="w-4 h-4" /> إضافة عضو
        </button>
      </div>

      {error && <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[13px] px-4 py-2.5">{error}</div>}

      {isLoading ? (
        <div className="text-foreground/60 text-sm py-10 text-center">جارِ التحميل...</div>
      ) : accounts.length === 0 ? (
        <div className="text-foreground/60 text-sm py-10 text-center rounded-xl border border-dashed border-border">
          لا يوجد حسابات فريق بعد. أنشئ أوّل حساب.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((a) => (
            <div key={a.id} data-testid={`staff-card-${a.id}`} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-foreground truncate">{a.fullName}</div>
                  <div className="text-[12px] text-foreground/55 truncate" dir="ltr">{a.email}</div>
                </div>
                <span className={`shrink-0 text-[10.5px] font-bold px-2 py-0.5 rounded-full ${a.status === "active" ? "bg-primary/15 text-primary" : "bg-foreground/10 text-foreground/50"}`}>
                  {a.status === "active" ? "نشط" : "معطّل"}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[12px] text-foreground/70">
                <span className="rounded-full bg-foreground/[0.05] px-2.5 py-0.5">{ROLE_LABELS[a.role]}</span>
                <span className="text-foreground/45">{a.role === "super_admin" ? "كلّ الصلاحيّات" : `${a.permissions.length} صلاحيّة`}</span>
              </div>
              <div className="mt-1 text-[11px] text-foreground/45">آخر دخول: {fmtDate(a.lastLoginAt)}</div>
              <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3">
                <button type="button" onClick={() => openEdit(a)} className="flex-1 rounded-lg bg-foreground/[0.05] hover:bg-foreground/10 text-foreground/80 text-[12px] font-semibold h-9 transition-colors">
                  تعديل الصلاحيّات
                </button>
                <button type="button" title="تفعيل/تعطيل" onClick={() => toggleStatusMut.mutate(a)} className="grid place-items-center w-9 h-9 rounded-lg bg-foreground/[0.05] hover:bg-foreground/10 text-foreground/70 transition-colors">
                  <Power className="w-4 h-4" />
                </button>
                <button type="button" title="حذف" onClick={() => { if (window.confirm(`حذف حساب ${a.email}?`)) deleteMut.mutate(a.id); }} className="grid place-items-center w-9 h-9 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor modal */}
      {editor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditor(null)}>
          <div dir="rtl" className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[17px] font-bold text-foreground">{editor.id === null ? "إضافة عضو فريق" : "تعديل الحساب"}</h3>
              <button type="button" onClick={() => setEditor(null)} className="grid place-items-center w-9 h-9 rounded-lg hover:bg-foreground/10 text-foreground/60"><X className="w-4.5 h-4.5" /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <label className="block">
                <span className="text-[12px] font-semibold text-foreground/70">البريد الإلكترونيّ</span>
                <input dir="ltr" type="email" value={editor.email} disabled={editor.id !== null} onChange={(e) => setEditor({ ...editor, email: e.target.value.trim() })}
                  className="mt-1 w-full h-11 px-3 rounded-xl bg-background border border-border text-foreground text-[14px] outline-none focus:border-primary/50 disabled:opacity-60" placeholder="name@islandhaven.ps" data-testid="staff-email" />
              </label>
              <label className="block">
                <span className="text-[12px] font-semibold text-foreground/70">الاسم الكامل</span>
                <input type="text" value={editor.fullName} onChange={(e) => setEditor({ ...editor, fullName: e.target.value })}
                  className="mt-1 w-full h-11 px-3 rounded-xl bg-background border border-border text-foreground text-[14px] outline-none focus:border-primary/50" data-testid="staff-name" />
              </label>
              <label className="block">
                <span className="text-[12px] font-semibold text-foreground/70">{editor.id === null ? "كلمة المرور" : "كلمة مرور جديدة (اختياريّ)"}</span>
                <input dir="ltr" type="text" value={editor.password} onChange={(e) => setEditor({ ...editor, password: e.target.value })}
                  className="mt-1 w-full h-11 px-3 rounded-xl bg-background border border-border text-foreground text-[14px] outline-none focus:border-primary/50" placeholder="10 أحرف على الأقلّ" data-testid="staff-password" />
              </label>
              <label className="block">
                <span className="text-[12px] font-semibold text-foreground/70">الدور (يملأ الصلاحيّات)</span>
                <select value={editor.role} onChange={(e) => applyPreset(e.target.value as AdminRole)}
                  className="mt-1 w-full h-11 px-3 rounded-xl bg-background border border-border text-foreground text-[14px] outline-none focus:border-primary/50">
                  {ADMIN_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </label>
            </div>

            <div className="mb-4">
              <div className="text-[12px] font-semibold text-foreground/70 mb-1.5">الصلاحيّات الدقيقة</div>
              {editor.role === "super_admin" ? (
                <div className="rounded-xl border border-primary/30 bg-primary/[0.06] text-primary text-[13px] px-4 py-3">مدير أعلى — كلّ الصلاحيّات (لا يمكن تقييده).</div>
              ) : (
                <PermissionMatrix value={editor.permissions} onChange={(next) => setEditor({ ...editor, role: "custom", permissions: next })} />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditor(null)} className="rounded-full px-5 h-11 text-[13.5px] font-semibold text-foreground/70 hover:bg-foreground/[0.06]">إلغاء</button>
              <button type="button" disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate(editor)} data-testid="staff-save"
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 h-11 text-[13.5px] font-bold hover:opacity-90 disabled:opacity-50 transition-opacity">
                {editor.id !== null && editor.password ? <KeyRound className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                {saveMut.isPending ? "جارِ الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
