import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Bell, UserCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface Notif {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string;
  readAt: string | null;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} س`;
  const d = Math.floor(h / 24);
  return `قبل ${d} ي`;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const ref = useRef<HTMLDivElement>(null);

  const countQ = useQuery({
    queryKey: ["notif-count"],
    queryFn: () => api<{ count: number }>("/me/notifications/unread-count"),
    enabled: !!user,
    refetchInterval: 30_000,
  });
  const listQ = useQuery({
    queryKey: ["notif-list"],
    queryFn: () => api<{ notifications: Notif[] }>("/me/notifications"),
    enabled: !!user && open,
  });

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!user) return null;
  const count = countQ.data?.count ?? 0;
  const items = listQ.data?.notifications ?? [];

  function refresh() {
    qc.invalidateQueries({ queryKey: ["notif-count"] });
    qc.invalidateQueries({ queryKey: ["notif-list"] });
  }

  async function openItem(n: Notif) {
    if (!n.readAt) {
      await api(`/me/notifications/${n.id}/read`, { method: "POST" }).catch(() => {});
      refresh();
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  async function markAll() {
    await api("/me/notifications/read-all", { method: "POST" }).catch(() => {});
    refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`الإشعارات${count ? ` (${count} غير مقروءة)` : ""}`}
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.06] border border-white/15 hover:bg-white/[0.1] transition-colors"
      >
        <Bell className="w-4 h-4 text-white/80" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-[300px] max-h-[420px] overflow-y-auto rounded-2xl bg-[#11162a] border border-white/12 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)] z-50 p-2">
          <div className="flex items-center justify-between px-2 py-1.5 sticky top-0 bg-[#11162a]">
            <span className="text-white font-bold text-[13px]">الإشعارات</span>
            {count > 0 && (
              <button
                onClick={markAll}
                className="text-primary text-[11px] font-semibold hover:underline"
              >
                تعليم الكلّ كمقروء
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <div className="text-white/45 text-[12.5px] text-center py-10">
              لا إشعارات بعد
            </div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => openItem(n)}
                className={`w-full text-right rounded-xl px-3 py-2.5 mb-1 transition-colors ${
                  n.readAt ? "hover:bg-white/[0.04]" : "bg-primary/10 hover:bg-primary/[0.16]"
                }`}
              >
                <div className="flex items-start gap-2">
                  {n.type === "mentor_application" ? (
                    <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <UserCheck className="w-3 h-3 text-emerald-400" />
                    </span>
                  ) : !n.readAt ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-white text-[12.5px] font-semibold">{n.title}</span>
                      <span className="text-white/35 text-[10px] shrink-0">{timeAgo(n.createdAt)}</span>
                    </div>
                    {n.body && (
                      <div className="text-white/55 text-[11.5px] mt-0.5 leading-relaxed">
                        {n.body}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
