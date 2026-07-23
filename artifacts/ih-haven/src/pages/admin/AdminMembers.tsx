import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, Linkedin, ShieldAlert } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useConfirm } from "@/hooks/use-confirm";
import { Modal, Field, SaveBar } from "./adminShared";

// The FULL roster record — includes the sensitive/operational blocks that the
// PUBLIC /api/roster never returns. Reached only via the 401-gated admin API.
interface Member {
  id: number;
  fullName: string;
  fullNameEn: string;
  type: "student" | "graduate" | "freelancer";
  gender: "male" | "female";
  skill: string;
  field: string;
  linkedinUrl: string;
  linkedinPublic: boolean;
  phone: string;
  birthYear: number | null;
  notes: string;
  cvUrl: string;
  internetUser: string;
  days: string;
  period: string;
  seat: number | null;
  sortOrder: number;
  status: "visible" | "hidden";
}

const EMPTY: Member = {
  id: 0, fullName: "", fullNameEn: "", type: "student", gender: "male", skill: "", field: "",
  linkedinUrl: "", linkedinPublic: false, phone: "", birthYear: null, notes: "", cvUrl: "",
  internetUser: "", days: "", period: "", seat: null, sortOrder: 0, status: "visible",
};

const TYPE_LABEL: Record<Member["type"], string> = { student: "طالب", graduate: "خريج", freelancer: "مستقلّ" };
const GENDER_LABEL: Record<Member["gender"], string> = { male: "ذكر", female: "أنثى" };

export default function AdminMembers() {
  const confirm = useConfirm();
  const [rows, setRows] = useState<Member[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Member | "new" | null>(null);
  const [q, setQ] = useState("");

  async function reload() {
    try {
      setRows((await api<{ members: Member[] }>("/admin/roster")).members);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError && (e.status === 401 || e.status === 403)
        ? "تحتاج صلاحيّة إداريّة لعرض السجل."
        : "تعذّر تحميل السجل.");
    }
  }
  useEffect(() => { void reload(); }, []);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const needle = q.trim();
    if (!needle) return rows;
    return rows.filter((m) => m.fullName.includes(needle) || m.fullNameEn.toLowerCase().includes(needle.toLowerCase()) || m.skill.includes(needle));
  }, [rows, q]);

  const counts = useMemo(() => {
    const c = { total: rows?.length ?? 0, student: 0, graduate: 0, freelancer: 0 };
    for (const m of rows ?? []) c[m.type]++;
    return c;
  }, [rows]);

  async function onDelete(m: Member) {
    if (!(await confirm({ title: "نقل إلى المحذوفات", message: `نقل «${m.fullName}» إلى سلّة المحذوفات؟ يمكن استرجاعه من تبويب «المحذوفات».`, confirmLabel: "نقل للمحذوفات", danger: true }))) return;
    try {
      await api(`/admin/roster/${m.id}`, { method: "DELETE" });
      void reload();
    } catch { setError("تعذّر الحذف."); }
  }

  async function toggleLinkedin(m: Member) {
    try {
      await api(`/admin/roster/${m.id}`, { method: "PATCH", body: JSON.stringify({ linkedinPublic: !m.linkedinPublic }) });
      void reload();
    } catch { setError("تعذّر التحديث."); }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">سجل المواهب</h2>
          <p className="text-[13px] text-foreground/65 mt-1">
            مجتمع المواهب الحقيقيّ — <span className="font-bold text-foreground tnum">{counts.total}</span> منتسبًا
            <span className="text-foreground/60"> · </span>
            {counts.student} طالب · {counts.graduate} خريج · {counts.freelancer} مستقلّ
            <span className="text-foreground/60"> · </span>
            هو الرقم المعروض للجمهور على الموقع.
          </p>
        </div>
        <button type="button" onClick={() => setEditing("new")} className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-[hsl(var(--primary-cta))] text-white text-[13px] font-semibold hover:shadow-soft-hover transition-shadow">
          <Plus className="w-4 h-4" /> عضو جديد
        </button>
      </div>

      {error && <div className="rounded-2xl px-4 py-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[13px]">{error}</div>}

      <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-muted/40 border border-border max-w-sm">
        <Search className="w-4 h-4 text-foreground/60" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو المهارة…" aria-label="بحث في السجل" className="w-full bg-transparent outline-none text-[13.5px]" />
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {filtered === null ? (
          <div className="p-8 text-center text-foreground/60">جارِ التحميل…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-foreground/65 text-[14px]">لا نتائج.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-[13.5px]">
              <thead className="bg-muted/40 text-foreground/65 text-[11.5px] tracking-[0.05em] uppercase">
                <tr>
                  {["#", "الاسم", "الفئة", "المهارة", "الهاتف", "المقعد", "LinkedIn", "الحالة", "إجراءات"].map((h) => (
                    <th key={h} className="text-right px-3 py-3 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-2.5 font-mono text-foreground/60 tnum">{m.id}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-foreground whitespace-nowrap">{m.fullName}</div>
                      {m.fullNameEn && <div className="text-[11.5px] text-foreground/60" dir="ltr">{m.fullNameEn}</div>}
                    </td>
                    <td className="px-3 py-2.5 text-foreground/65 whitespace-nowrap">{TYPE_LABEL[m.type]}</td>
                    <td className="px-3 py-2.5 text-foreground/65 max-w-[180px] truncate">{m.skill || "—"}</td>
                    <td className="px-3 py-2.5 font-mono tnum text-foreground/65 whitespace-nowrap" dir="ltr">{m.phone || "—"}</td>
                    <td className="px-3 py-2.5 font-mono tnum text-foreground/65">{m.seat ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      {m.linkedinUrl ? (
                        <button type="button" onClick={() => toggleLinkedin(m)} title="بدّل ظهور LinkedIn للجمهور"
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-colors ${m.linkedinPublic ? "bg-sky-500/15 text-sky-300 border-sky-500/30" : "bg-muted text-foreground/60 border-border"}`}>
                          <Linkedin className="w-3 h-3" aria-hidden /> {m.linkedinPublic ? "عام" : "مخفيّ"}
                        </button>
                      ) : <span className="text-foreground/55">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${m.status === "visible" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-muted text-foreground/70 border-border"}`}>
                        {m.status === "visible" ? "ظاهر" : "مخفيّ"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button type="button" aria-label="تعديل العضو" onClick={() => setEditing(m)} className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65 hover:text-primary transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button type="button" aria-label="حذف العضو" onClick={() => onDelete(m)} className="p-2 rounded-lg hover:bg-rose-500/15 text-foreground/65 hover:text-rose-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <MemberEditor
          initial={editing === "new" ? { ...EMPTY, sortOrder: (rows?.length ?? 0) + 1 } : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); void reload(); }}
        />
      )}
    </div>
  );
}

function MemberEditor({ initial, onClose, onSaved }: { initial: Member; onClose: () => void; onSaved: () => void }) {
  const isNew = initial.id === 0;
  const [form, setForm] = useState<Member>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Member>(k: K, v: Member[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) { setError("الاسم مطلوب."); return; }
    setSubmitting(true);
    setError(null);
    // Send every editable field; the server validates + strips. birthYear/seat empty → null.
    const payload = {
      fullName: form.fullName, fullNameEn: form.fullNameEn, type: form.type, gender: form.gender,
      skill: form.skill, field: form.field, linkedinUrl: form.linkedinUrl, linkedinPublic: form.linkedinPublic,
      phone: form.phone, birthYear: form.birthYear ?? null, notes: form.notes, cvUrl: form.cvUrl,
      internetUser: form.internetUser, days: form.days, period: form.period, seat: form.seat ?? null,
      sortOrder: form.sortOrder, status: form.status,
    };
    try {
      await api(isNew ? "/admin/roster" : `/admin/roster/${initial.id}`, {
        method: isNew ? "POST" : "PATCH",
        body: JSON.stringify(payload),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر الحفظ.");
      setSubmitting(false);
    }
  }

  const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));

  return (
    <Modal title={isNew ? "عضو جديد" : "تعديل العضو"} onClose={onClose}>
      <form onSubmit={onSubmit} className="p-6 space-y-5">
        {error && <div className="rounded-xl px-3 py-2 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[12.5px]">{error}</div>}

        {/* PUBLIC block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="الاسم (عربي) *"><input className="inp" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required /></Field>
          <Field label="الاسم (إنجليزي)"><input className="inp" dir="ltr" value={form.fullNameEn} onChange={(e) => set("fullNameEn", e.target.value)} /></Field>
          <Field label="الفئة"><select className="inp" value={form.type} onChange={(e) => set("type", e.target.value as Member["type"])}><option value="student">طالب</option><option value="graduate">خريج</option><option value="freelancer">مستقلّ</option></select></Field>
          <Field label="النوع"><select className="inp" value={form.gender} onChange={(e) => set("gender", e.target.value as Member["gender"])}><option value="male">ذكر</option><option value="female">أنثى</option></select></Field>
          <Field label="المهارة"><input className="inp" value={form.skill} onChange={(e) => set("skill", e.target.value)} /></Field>
          <Field label="المجال"><input className="inp" value={form.field} onChange={(e) => set("field", e.target.value)} /></Field>
        </div>

        {/* LinkedIn */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
          <Field label="رابط LinkedIn"><input className="inp" dir="ltr" placeholder="https://linkedin.com/in/…" value={form.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} /></Field>
          <label className="flex items-center gap-2 h-11 px-3 rounded-xl bg-muted/40 border border-border cursor-pointer text-[13px] font-semibold text-foreground/80">
            <input type="checkbox" checked={form.linkedinPublic} onChange={(e) => set("linkedinPublic", e.target.checked)} className="accent-[hsl(var(--primary-cta))]" />
            ظاهر للجمهور
          </label>
        </div>

        {/* SENSITIVE — admin only, never public */}
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4 space-y-3">
          <div className="flex items-center gap-2 text-[12px] font-bold text-amber-300/90">
            <ShieldAlert className="w-4 h-4" aria-hidden /> بيانات حسّاسة — للأدمن فقط، لا تظهر علنًا أبدًا
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="الهاتف"><input className="inp" dir="ltr" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
            <Field label="سنة الميلاد"><input className="inp" inputMode="numeric" value={form.birthYear ?? ""} onChange={(e) => set("birthYear", numOrNull(e.target.value))} /></Field>
            <Field label="رابط السيرة (CV)"><input className="inp" dir="ltr" value={form.cvUrl} onChange={(e) => set("cvUrl", e.target.value)} /></Field>
            <Field label="مستخدم الإنترنت"><input className="inp" value={form.internetUser} onChange={(e) => set("internetUser", e.target.value)} /></Field>
          </div>
          <Field label="ملاحظات"><textarea className="inp resize-y min-h-[64px]" value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
        </div>

        {/* OPERATIONAL + meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="الأيّام"><input className="inp" value={form.days} onChange={(e) => set("days", e.target.value)} /></Field>
          <Field label="الفترة"><input className="inp" value={form.period} onChange={(e) => set("period", e.target.value)} /></Field>
          <Field label="المقعد"><input className="inp" inputMode="numeric" value={form.seat ?? ""} onChange={(e) => set("seat", numOrNull(e.target.value))} /></Field>
          <Field label="الترتيب"><input className="inp" inputMode="numeric" value={form.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value) || 0)} /></Field>
        </div>
        <Field label="الحالة"><select className="inp" value={form.status} onChange={(e) => set("status", e.target.value as Member["status"])}><option value="visible">ظاهر للجمهور</option><option value="hidden">مخفيّ (لا يُحتسب في العدد العام)</option></select></Field>

        <SaveBar submitting={submitting} isNew={isNew} onClose={onClose} />
      </form>
    </Modal>
  );
}
