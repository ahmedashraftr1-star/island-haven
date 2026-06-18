import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { AlertTriangle, Database, Mail, X } from "lucide-react";

interface Setting {
  key: string;
  label: string;
  value: boolean;
}

export default function AdminSettings() {
  const [items, setItems] = useState<Setting[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [pruneDays, setPruneDays] = useState("90");
  const [pruneMsg, setPruneMsg] = useState<string | null>(null);
  const [totals, setTotals] = useState<{ users: number; works: number; courses: number; enrollments: number } | null>(null);

  const [adminEmail, setAdminEmail] = useState("");
  const [adminEmailSource, setAdminEmailSource] = useState<"db" | "env" | null>(null);
  const [adminEmailDraft, setAdminEmailDraft] = useState("");
  const [adminEmailBusy, setAdminEmailBusy] = useState(false);
  const [adminEmailMsg, setAdminEmailMsg] = useState<string | null>(null);
  const [adminEmailLoaded, setAdminEmailLoaded] = useState(false);

  const isDirty = adminEmailLoaded && adminEmailDraft.trim() !== adminEmail;

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  async function reload() {
    try {
      const r = await api<{ settings: Setting[] }>("/admin/settings");
      setItems(r.settings);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
    try {
      const t = await api<typeof totals>("/admin/totals");
      setTotals(t);
    } catch {
      // non-critical
    }
    try {
      const r = await api<{ value: string; source: "db" | "env" }>("/admin/settings/admin-email");
      setAdminEmail(r.value);
      setAdminEmailSource(r.source);
      setAdminEmailDraft(r.value);
      setAdminEmailLoaded(true);
    } catch {
      setAdminEmailLoaded(true);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function toggle(s: Setting) {
    setBusyKey(s.key);
    setError(null);
    try {
      await api(`/admin/settings/${s.key}`, {
        method: "PUT",
        body: JSON.stringify({ value: !s.value }),
      });
      setItems((cur) =>
        cur ? cur.map((x) => (x.key === s.key ? { ...x, value: !s.value } : x)) : cur,
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحفظ");
    } finally {
      setBusyKey(null);
    }
  }

  async function saveAdminEmail() {
    setAdminEmailBusy(true);
    setAdminEmailMsg(null);
    try {
      const r = await api<{ ok: boolean; value: string; source: "db" | "env" }>("/admin/settings/admin-email", {
        method: "PUT",
        body: JSON.stringify({ value: adminEmailDraft.trim() }),
      });
      setAdminEmail(r.value ?? adminEmailDraft.trim());
      setAdminEmailSource(r.source ?? "db");
      setAdminEmailMsg("تم الحفظ");
    } catch (e) {
      setAdminEmailMsg(e instanceof ApiError ? e.message : "تعذّر الحفظ");
    } finally {
      setAdminEmailBusy(false);
    }
  }

  async function clearAdminEmail() {
    setAdminEmailBusy(true);
    setAdminEmailMsg(null);
    try {
      const r = await api<{ ok: boolean; value: string; source: "db" | "env" }>("/admin/settings/admin-email", {
        method: "DELETE",
      });
      setAdminEmail(r.value ?? "");
      setAdminEmailSource(r.source ?? "env");
      setAdminEmailDraft(r.value ?? "");
      setAdminEmailMsg("تمّت استعادة متغيّر البيئة");
    } catch (e) {
      setAdminEmailMsg(e instanceof ApiError ? e.message : "تعذّر المسح");
    } finally {
      setAdminEmailBusy(false);
    }
  }

  async function prune() {
    setPruneMsg(null);
    setError(null);
    const n = Number(pruneDays);
    if (!Number.isInteger(n) || n < 1) {
      setError("أدخل عدد أيّام صحيحًا");
      return;
    }
    if (!window.confirm(`حذف كل سجلّات الزيارات الأقدم من ${n} يومًا؟ لا يمكن التراجع.`)) return;
    try {
      const r = await api<{ deleted: number }>("/admin/analytics/page-views", {
        method: "DELETE",
        body: JSON.stringify({ beforeDays: n }),
      });
      setPruneMsg(`تم حذف ${r.deleted} سجلًّا.`);
      void reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحذف");
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-[20px] font-bold text-foreground">إعدادات الموقع</h2>
        <p className="text-[13px] text-foreground/55 mt-1">
          مفاتيح تتحكّم بسلوك الموقع للزوّار — وأدوات صيانة قاعدة البيانات.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 text-[13px]">
          {error}
        </div>
      )}

      <section className="rounded-2xl bg-white border border-border divide-y divide-border">
        {items === null ? (
          <div className="p-8 text-center text-foreground/45">جارِ التحميل…</div>
        ) : (
          items.map((s) => (
            <div
              key={s.key}
              className="px-5 py-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-foreground">
                  {s.label}
                </div>
                <div className="text-[12px] text-foreground/55 mt-0.5" dir="ltr">
                  {s.key}
                </div>
              </div>
              <button
                onClick={() => toggle(s)}
                disabled={busyKey === s.key}
                data-testid={`toggle-${s.key}`}
                className={`relative w-12 h-7 rounded-full transition-colors disabled:opacity-50 ${
                  s.value ? "bg-primary" : "bg-foreground/15"
                }`}
                aria-pressed={s.value}
              >
                <span
                  className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${
                    s.value ? "translate-x-0 inset-inline-end-0.5" : "inset-inline-start-0.5"
                  }`}
                  style={{
                    insetInlineEnd: s.value ? "2px" : "auto",
                    insetInlineStart: s.value ? "auto" : "2px",
                  }}
                />
              </button>
            </div>
          ))
        )}
      </section>

      <section className="rounded-2xl bg-white border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4 text-foreground/55" />
          <h3 className="text-[14px] font-bold text-foreground">بريد الإشعارات الإداريّة</h3>
        </div>
        <p className="text-[12.5px] text-foreground/60 mb-4 leading-relaxed">
          العنوان الذي تُرسَل إليه إشعارات المنصّة (طلبات الانتساب، القصص الجديدة…). إذا تُرِك فارغًا يُستخدَم متغيّر البيئة <span dir="ltr" className="font-mono">ADMIN_EMAIL</span>.
        </p>
        {!adminEmailLoaded ? (
          <div className="text-[13px] text-foreground/45">جارِ التحميل…</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-0">
                <input
                  type="email"
                  placeholder="admin@example.com"
                  value={adminEmailDraft}
                  onChange={(e) => { setAdminEmailDraft(e.target.value); setAdminEmailMsg(null); }}
                  dir="ltr"
                  className={`w-full h-10 px-3 rounded-xl bg-muted/40 border text-[13px] outline-none focus:border-primary/50 transition-colors ${isDirty ? "border-amber-400/60" : "border-border"}`}
                />
                {isDirty && (
                  <span className="absolute inset-inline-end-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-amber-500 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full pointer-events-none">
                    غير محفوظ
                  </span>
                )}
              </div>
              <button
                onClick={saveAdminEmail}
                disabled={adminEmailBusy || adminEmailDraft.trim() === adminEmail}
                className="h-10 px-5 rounded-xl bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                {adminEmailBusy ? "جارِ الحفظ…" : "حفظ"}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-muted/40 border border-border">
              <span className="text-[12.5px] text-foreground/55 font-medium shrink-0">النشط الآن:</span>
              {adminEmail ? (
                <>
                  <span className="text-[13px] font-mono text-foreground flex-1 min-w-0 truncate" dir="ltr">
                    {adminEmail}
                  </span>
                  {adminEmailSource === "env" ? (
                    <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                      من متغيّر البيئة
                    </span>
                  ) : (
                    <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Database className="w-3 h-3" />
                      محفوظ في قاعدة البيانات
                    </span>
                  )}
                  {adminEmailSource === "db" && (
                    <button
                      onClick={clearAdminEmail}
                      disabled={adminEmailBusy}
                      title="استعادة متغيّر البيئة"
                      className="shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-40"
                    >
                      <X className="w-3 h-3" />
                      مسح
                    </button>
                  )}
                </>
              ) : (
                <span className="text-[12.5px] text-foreground/45 italic flex-1">
                  لم يُعيَّن بريد — لن تُرسَل إشعارات حتى يُضبَط العنوان
                </span>
              )}
            </div>
          </>
        )}
        {adminEmailMsg && (
          <p className={`text-[12.5px] mt-2 ${adminEmailMsg === "تم الحفظ" || adminEmailMsg === "تمّت استعادة متغيّر البيئة" ? "text-emerald-700" : "text-rose-600"}`}>
            {adminEmailMsg}
          </p>
        )}
      </section>

      {totals && (
        <section className="rounded-2xl bg-white border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-foreground/55" />
            <h3 className="text-[14px] font-bold text-foreground">إحصاءات قاعدة البيانات</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { l: "مستخدمون", v: totals.users },
              { l: "أعمال", v: totals.works },
              { l: "كورسات", v: totals.courses },
              { l: "تسجيلات", v: totals.enrollments },
            ].map((x) => (
              <div key={x.l} className="rounded-xl bg-muted/40 px-4 py-3 text-center">
                <div className="text-[11px] text-foreground/55 font-semibold mb-1">
                  {x.l}
                </div>
                <div className="text-[20px] font-bold text-foreground tabular-nums">
                  {x.v.toLocaleString("ar-EG")}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-white border border-rose-200 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-bold text-foreground">منطقة الخطر</h3>
            <p className="text-[12.5px] text-foreground/65 mt-1 leading-relaxed">
              حذف سجلّات تتبّع زيارات الصفحات القديمة من قاعدة البيانات. يفيد عند تضخّم الجدول.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <label className="text-[12.5px] text-foreground/65 font-semibold">
                احذف الأقدم من
              </label>
              <input
                type="number"
                min={1}
                max={3650}
                value={pruneDays}
                onChange={(e) => setPruneDays(e.target.value)}
                className="w-24 h-10 px-3 rounded-xl bg-muted/40 border border-border text-[13px] outline-none tabular-nums text-center"
              />
              <span className="text-[12.5px] text-foreground/65">يومًا</span>
              <button
                onClick={prune}
                className="h-10 px-4 rounded-xl bg-rose-600 text-white text-[13px] font-semibold hover:bg-rose-700 transition-colors"
                data-testid="button-prune-page-views"
              >
                حذف
              </button>
            </div>
            {pruneMsg && (
              <div className="text-[12.5px] text-emerald-700 mt-3">{pruneMsg}</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
