import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, X, Copy, Check, ShieldAlert } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { AdminButton, StatusBadge } from "./ui";

// Personal security panel — enrol / remove TOTP two-factor for the signed-in
// admin. No QR dep: the secret is shown for manual entry into an authenticator
// app (Google Authenticator, Authy…), which every app supports.

interface Status { enabled: boolean; pending: boolean; available: boolean }

function groupSecret(s: string): string {
  return (s.match(/.{1,4}/g) ?? [s]).join(" ");
}

export default function AdminSecurity({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [setup, setSetup] = useState<{ secret: string; otpauthUri: string } | null>(null);
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const statusQ = useQuery({ queryKey: ["admin-2fa-status"], queryFn: () => api<Status>("/admin/me/2fa/status") });
  const st = statusQ.data;

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-2fa-status"] });

  const setupMut = useMutation({
    mutationFn: () => api<{ secret: string; otpauthUri: string }>("/admin/me/2fa/setup", { method: "POST" }),
    onSuccess: (d) => { setSetup(d); setError(null); },
    onError: (e) => setError(e instanceof ApiError ? e.message : "تعذّر البدء"),
  });
  const enableMut = useMutation({
    mutationFn: () => api("/admin/me/2fa/enable", { method: "POST", body: JSON.stringify({ code: code.trim() }) }),
    onSuccess: () => { setSetup(null); setCode(""); setError(null); refresh(); },
    onError: (e) => setError(e instanceof ApiError ? e.message : "تعذّر التفعيل"),
  });
  const disableMut = useMutation({
    mutationFn: () => api("/admin/me/2fa/disable", { method: "POST", body: JSON.stringify({ code: disableCode.trim() }) }),
    onSuccess: () => { setDisableCode(""); setError(null); refresh(); },
    onError: (e) => setError(e instanceof ApiError ? e.message : "تعذّر التعطيل"),
  });

  function copySecret() {
    if (setup) navigator.clipboard?.writeText(setup.secret).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div dir="rtl" className="w-full max-w-md rounded-2xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2"><ShieldCheck className="w-4.5 h-4.5 text-primary" /> الأمان — التحقّق الثنائيّ</h3>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="grid place-items-center w-8 h-8 rounded-lg hover:bg-foreground/10 text-foreground/60"><X className="w-4 h-4" /></button>
        </div>

        {error && <div className="mb-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[12.5px] px-3 py-2">{error}</div>}

        {!st ? (
          <div className="py-8 text-center text-foreground/50 text-[13px]">جارِ التحميل…</div>
        ) : !st.available ? (
          <div className="rounded-xl bg-foreground/[0.04] border border-border px-4 py-3 text-[13px] text-foreground/65 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-foreground/40 mt-0.5 shrink-0" />
            التحقّق الثنائيّ متاح لحسابات الفريق فقط، وليس لحساب النظام الأساسيّ.
          </div>
        ) : st.enabled ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge tone="success" icon={<Check className="w-3 h-3" />}>مُفعّل</StatusBadge>
              <span className="text-[13px] text-foreground/70">حسابك محميّ بالتحقّق الثنائيّ.</span>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-foreground/70">لتعطيله، أدخل رمزًا حاليًّا:</label>
              <div className="flex items-center gap-2 mt-1.5">
                <input value={disableCode} onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" dir="ltr" placeholder="123456" data-testid="disable-code" className="flex-1 h-10 px-3 rounded-xl bg-background border border-border text-foreground text-[15px] font-mono tracking-widest text-center outline-none focus:border-primary/50" />
                <AdminButton variant="danger" disabled={disableCode.length !== 6} loading={disableMut.isPending} onClick={() => disableMut.mutate()}>تعطيل</AdminButton>
              </div>
            </div>
          </div>
        ) : setup ? (
          <div className="space-y-4">
            <p className="text-[13px] text-foreground/70 leading-relaxed">أضِف هذا المفتاح يدويًّا في تطبيق المصادقة، ثمّ أدخل الرمز المكوّن من ٦ أرقام لتأكيد التفعيل.</p>
            <div>
              <div className="text-[11px] text-foreground/50 mb-1">المفتاح السرّيّ</div>
              <div className="flex items-center gap-2">
                <code dir="ltr" className="flex-1 rounded-xl bg-background border border-border px-3 py-2.5 text-[13.5px] font-mono tracking-wider text-foreground break-all">{groupSecret(setup.secret)}</code>
                <button type="button" onClick={copySecret} aria-label="نسخ" className="grid place-items-center w-10 h-10 rounded-xl bg-foreground/[0.05] hover:bg-foreground/10 text-foreground/70">{copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}</button>
              </div>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-foreground/70">رمز التأكيد</label>
              <div className="flex items-center gap-2 mt-1.5">
                <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" dir="ltr" placeholder="123456" data-testid="enable-code" className="flex-1 h-10 px-3 rounded-xl bg-background border border-border text-foreground text-[15px] font-mono tracking-widest text-center outline-none focus:border-primary/50" />
                <AdminButton disabled={code.length !== 6} loading={enableMut.isPending} onClick={() => enableMut.mutate()} data-testid="enable-2fa">تفعيل</AdminButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[13px] text-foreground/70 leading-relaxed">أضِف طبقة حماية ثانية: عند كلّ تسجيل دخول ستُطالَب برمز من تطبيق المصادقة على هاتفك.</p>
            <AdminButton icon={<ShieldCheck className="w-4 h-4" />} loading={setupMut.isPending} onClick={() => setupMut.mutate()} data-testid="setup-2fa">تفعيل التحقّق الثنائيّ</AdminButton>
          </div>
        )}
      </div>
    </div>
  );
}
