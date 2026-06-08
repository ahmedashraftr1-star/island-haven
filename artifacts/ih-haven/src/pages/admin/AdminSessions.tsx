import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import {
  formatArabicDateTime,
  SESSION_STATUS_LABELS,
  SESSION_MODE_LABELS,
  type SessionStatus,
  type SessionMode,
} from "@/lib/labels";

interface Row {
  session: {
    id: number;
    topic: string;
    message: string;
    mode: SessionMode;
    preferredAt: string | null;
    status: SessionStatus;
    createdAt: string;
  };
  expertName: string;
  menteeName: string;
}

const STATUSES: SessionStatus[] = [
  "requested",
  "confirmed",
  "completed",
  "declined",
  "cancelled",
];

const FILTERS: Array<{ key: "" | SessionStatus; label: string }> = [
  { key: "", label: "الكلّ" },
  ...STATUSES.map((s) => ({ key: s, label: SESSION_STATUS_LABELS[s] })),
];

export default function AdminSessions() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"" | SessionStatus>("");

  async function reload() {
    setRows(null);
    try {
      const r = await api<{ sessions: Row[] }>(
        `/admin/sessions${filter ? `?status=${filter}` : ""}`,
      );
      setRows(r.sessions);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function setStatus(id: number, status: SessionStatus) {
    try {
      await api(`/admin/sessions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      void reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحديث");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold text-foreground">جلسات الإرشاد</h2>
        <p className="text-[13px] text-foreground/55 mt-1">
          تابع كلّ طلبات جلسات الإرشاد بين الأعضاء والخبراء.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3.5 h-9 rounded-full text-[12.5px] font-semibold border transition-colors ${
              filter === f.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white text-foreground/65 border-border hover:bg-muted/50"
            }`}
          >
            {f.label}
          </button>
        ))}
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
            لا توجد جلسات.
          </div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/40 text-foreground/55 text-[11.5px] tracking-[0.05em] uppercase">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">الموضوع</th>
                <th className="text-right px-4 py-3 font-semibold">العضو</th>
                <th className="text-right px-4 py-3 font-semibold">الخبير</th>
                <th className="text-right px-4 py-3 font-semibold">النوع</th>
                <th className="text-right px-4 py-3 font-semibold">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.session.id}
                  className="border-t border-border hover:bg-muted/20 align-top"
                  data-testid={`admin-session-row-${r.session.id}`}
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">
                      {r.session.topic}
                    </div>
                    {r.session.message && (
                      <div className="text-[11.5px] text-foreground/45 font-normal mt-0.5 line-clamp-2 max-w-xs">
                        {r.session.message}
                      </div>
                    )}
                    <div className="text-[11px] text-foreground/40 mt-1 tabular-nums">
                      {formatArabicDateTime(r.session.createdAt)}
                      {r.session.preferredAt
                        ? ` · مقترح: ${formatArabicDateTime(r.session.preferredAt)}`
                        : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground/75">{r.menteeName}</td>
                  <td className="px-4 py-3 text-foreground/75">{r.expertName}</td>
                  <td className="px-4 py-3 text-foreground/65">
                    {SESSION_MODE_LABELS[r.session.mode]}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={r.session.status}
                      onChange={(e) =>
                        setStatus(r.session.id, e.target.value as SessionStatus)
                      }
                      className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-[12.5px] font-semibold text-foreground/75 outline-none focus:border-primary"
                      data-testid={`select-session-status-${r.session.id}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {SESSION_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
