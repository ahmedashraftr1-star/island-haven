import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";

interface CohortLite {
  id: number;
  name: string;
}
interface Week {
  id: number;
  weekNumber: number;
  title: string;
  theme: string;
}
interface Update {
  id: number;
  title: string;
  body: string;
  weekNumber: number | null;
  postedAt: string;
}
interface Rsvp {
  id: number;
  fullName: string;
  email: string;
  attendees: number;
  note: string;
  createdAt: string;
}

export default function AdminCohortJourney() {
  const [cohorts, setCohorts] = useState<CohortLite[]>([]);
  const [cohortId, setCohortId] = useState<number | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [error, setError] = useState<string | null>(null);

  // new week
  const [wNum, setWNum] = useState(1);
  const [wTitle, setWTitle] = useState("");
  const [wTheme, setWTheme] = useState("");
  // new update
  const [uTitle, setUTitle] = useState("");
  const [uBody, setUBody] = useState("");
  const [uWeek, setUWeek] = useState("");

  useEffect(() => {
    api<{ cohorts: CohortLite[] }>("/admin/cohorts")
      .then((r) => {
        setCohorts(r.cohorts);
        if (r.cohorts[0]) setCohortId(r.cohorts[0].id);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "تعذّر التحميل"));
  }, []);

  async function loadJourney(id: number) {
    try {
      const [j, rs] = await Promise.all([
        api<{ weeks: Week[]; updates: Update[] }>(`/admin/cohorts/${id}/journey`),
        api<{ rsvps: Rsvp[] }>(`/admin/cohorts/${id}/rsvps`),
      ]);
      setWeeks(j.weeks);
      setUpdates(j.updates);
      setRsvps(rs.rsvps);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }
  useEffect(() => {
    if (cohortId) void loadJourney(cohortId);
  }, [cohortId]);

  async function addWeek(e: React.FormEvent) {
    e.preventDefault();
    if (!cohortId || !wTitle.trim()) return;
    try {
      await api("/admin/cohort-weeks", {
        method: "POST",
        body: JSON.stringify({
          cohortId,
          weekNumber: wNum,
          title: wTitle,
          theme: wTheme,
        }),
      });
      setWTitle("");
      setWTheme("");
      setWNum((n) => n + 1);
      void loadJourney(cohortId);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحفظ");
    }
  }

  async function addUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!cohortId || !uTitle.trim()) return;
    try {
      await api("/admin/cohort-updates", {
        method: "POST",
        body: JSON.stringify({
          cohortId,
          title: uTitle,
          body: uBody,
          weekNumber: uWeek.trim() === "" ? null : Number(uWeek),
        }),
      });
      setUTitle("");
      setUBody("");
      setUWeek("");
      void loadJourney(cohortId);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحفظ");
    }
  }

  async function delWeek(id: number) {
    if (!window.confirm("حذف هذا الأسبوع؟")) return;
    await api(`/admin/cohort-weeks/${id}`, { method: "DELETE" });
    if (cohortId) void loadJourney(cohortId);
  }
  async function delUpdate(id: number) {
    if (!window.confirm("حذف هذا التحديث؟")) return;
    await api(`/admin/cohort-updates/${id}`, { method: "DELETE" });
    if (cohortId) void loadJourney(cohortId);
  }

  const inp =
    "rounded-xl px-3 py-2.5 bg-muted/40 border border-border focus:bg-muted/60 outline-none text-[14px] w-full";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold text-foreground">رحلة الدفعة</h2>
        <p className="text-[13px] text-foreground/55 mt-1">
          المنهج الأسبوعيّ وتحديثات التقدّم — تظهر في صفحة الدفعة.
        </p>
      </div>
      {error && (
        <div className="rounded-2xl px-4 py-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[13px]">
          {error}
        </div>
      )}

      <div className="max-w-xs">
        <label className="block mb-1.5 text-[12px] text-foreground/65 font-semibold">
          الدفعة
        </label>
        <select
          value={cohortId ?? ""}
          onChange={(e) => setCohortId(Number(e.target.value))}
          className={inp}
        >
          {cohorts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Weeks */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <h3 className="font-bold text-foreground text-[15px] mb-3">
            الأسابيع ({weeks.length})
          </h3>
          <form onSubmit={addWeek} className="flex flex-col gap-2 mb-4">
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                value={wNum}
                onChange={(e) => setWNum(Number(e.target.value) || 0)}
                className={`${inp} w-20 tabular-nums`}
                title="رقم الأسبوع"
              />
              <input
                value={wTitle}
                onChange={(e) => setWTitle(e.target.value)}
                placeholder="عنوان الأسبوع"
                maxLength={200}
                className={inp}
              />
            </div>
            <input
              value={wTheme}
              onChange={(e) => setWTheme(e.target.value)}
              placeholder="المحور / الوصف (اختياري)"
              maxLength={400}
              className={inp}
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 h-10 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold"
            >
              <Plus className="w-4 h-4" /> إضافة أسبوع
            </button>
          </form>
          <div className="space-y-2">
            {weeks.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-muted/30 border border-border"
              >
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-primary me-2">
                    أسبوع {w.weekNumber}
                  </span>
                  <span className="text-foreground text-[13.5px] font-semibold">
                    {w.title}
                  </span>
                  {w.theme && (
                    <div className="text-foreground/55 text-[12px] truncate">
                      {w.theme}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="حذف الأسبوع"
                  onClick={() => delWeek(w.id)}
                  className="p-1.5 rounded-lg text-foreground/55 hover:text-rose-400 hover:bg-rose-500/15 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Updates */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <h3 className="font-bold text-foreground text-[15px] mb-3">
            التحديثات ({updates.length})
          </h3>
          <form onSubmit={addUpdate} className="flex flex-col gap-2 mb-4">
            <div className="flex gap-2">
              <input
                value={uWeek}
                onChange={(e) => setUWeek(e.target.value)}
                placeholder="أسبوع#"
                type="number"
                min={0}
                className={`${inp} w-24 tabular-nums`}
                title="رقم الأسبوع (اختياري)"
              />
              <input
                value={uTitle}
                onChange={(e) => setUTitle(e.target.value)}
                placeholder="عنوان التحديث"
                maxLength={200}
                className={inp}
              />
            </div>
            <textarea
              value={uBody}
              onChange={(e) => setUBody(e.target.value)}
              placeholder="نصّ التحديث (اختياري)"
              maxLength={4000}
              rows={2}
              className={`${inp} resize-none`}
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 h-10 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold"
            >
              <Plus className="w-4 h-4" /> إضافة تحديث
            </button>
          </form>
          <div className="space-y-2">
            {updates.map((u) => (
              <div
                key={u.id}
                className="flex items-start justify-between gap-2 rounded-xl px-3 py-2.5 bg-muted/30 border border-border"
              >
                <div className="min-w-0">
                  {u.weekNumber !== null && (
                    <span className="text-[10px] font-bold text-foreground/55 me-1.5">
                      أسبوع {u.weekNumber}
                    </span>
                  )}
                  <span className="text-foreground text-[13.5px] font-semibold">
                    {u.title}
                  </span>
                  {u.body && (
                    <div className="text-foreground/55 text-[12px] line-clamp-2">
                      {u.body}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="حذف التحديث"
                  onClick={() => delUpdate(u.id)}
                  className="p-1.5 rounded-lg text-foreground/55 hover:text-rose-400 hover:bg-rose-500/15 shrink-0 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Day RSVPs */}
      <div className="rounded-2xl bg-card border border-border p-5">
        <h3 className="font-bold text-foreground text-[15px] mb-3">
          حجوزات يوم العرض (Demo Day) ({rsvps.length})
        </h3>
        {rsvps.length === 0 ? (
          <p className="text-foreground/55 text-[13px]">لا حجوزات بعد لهذه الدفعة.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="text-foreground/55 text-[11.5px] uppercase tracking-[0.05em]">
              <tr>
                <th className="text-right py-2 font-semibold">الاسم</th>
                <th className="text-right py-2 font-semibold">البريد</th>
                <th className="text-right py-2 font-semibold">العدد</th>
                <th className="text-right py-2 font-semibold">ملاحظة</th>
              </tr>
            </thead>
            <tbody>
              {rsvps.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="py-2 font-semibold text-foreground">{r.fullName}</td>
                  <td className="py-2 text-foreground/65" dir="ltr" style={{ textAlign: "right" }}>
                    {r.email}
                  </td>
                  <td className="py-2 text-foreground/65 tabular-nums">{r.attendees}</td>
                  <td className="py-2 text-foreground/55">{r.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
