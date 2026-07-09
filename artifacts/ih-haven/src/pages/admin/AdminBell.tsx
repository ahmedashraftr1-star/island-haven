import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, UserPlus, AtSign, MessageSquare, Inbox, Check } from "lucide-react";
import { api } from "@/lib/api";

// Staff notification bell for the admin shell. Polls the personal feed, opens a
// dropdown, and deep-links (tasks:42 → open task 42, channel, inbox) via onNavigate.

interface AdminNotif {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string;
  actor: string;
  readAt: string | null;
  createdAt: string;
}

const TYPE_ICON: Record<string, typeof Bell> = {
  task_assigned: UserPlus,
  task_mention: AtSign,
  task_comment: MessageSquare,
  channel_mention: AtSign,
  member_reply: Inbox,
  generic: Bell,
};

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} س`;
  return `قبل ${Math.floor(h / 24)} ي`;
}

export default function AdminBell({ onNavigate }: { onNavigate: (link: string) => void }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const countQ = useQuery({
    queryKey: ["admin-notif-count"],
    queryFn: () => api<{ count: number }>("/admin/me/notifications/unread-count"),
    refetchInterval: 30_000,
  });
  const listQ = useQuery({
    queryKey: ["admin-notif-list"],
    queryFn: () => api<{ notifications: AdminNotif[] }>("/admin/me/notifications"),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const count = countQ.data?.count ?? 0;
  const items = listQ.data?.notifications ?? [];

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-notif-count"] });
    qc.invalidateQueries({ queryKey: ["admin-notif-list"] });
  };

  async function openItem(n: AdminNotif) {
    if (!n.readAt) {
      try {
        await api(`/admin/me/notifications/${n.id}/read`, { method: "POST" });
      } catch {
        /* non-blocking */
      }
      refresh();
    }
    setOpen(false);
    onNavigate(n.link);
  }

  async function markAll() {
    try {
      await api("/admin/me/notifications/read-all", { method: "POST" });
    } catch {
      /* non-blocking */
    }
    refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-testid="admin-bell"
        aria-label="الإشعارات"
        className="relative grid place-items-center w-10 h-10 rounded-xl text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <Bell className="w-[18px] h-[18px]" strokeWidth={2.1} />
        {count > 0 && (
          <span className="absolute top-1 left-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          dir="rtl"
          className="absolute left-0 mt-2 w-[340px] max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl z-50"
        >
          <div className="flex items-center justify-between px-4 h-12 border-b border-border sticky top-0 bg-card">
            <span className="text-[13.5px] font-bold text-foreground">الإشعارات</span>
            {count > 0 && (
              <button type="button" onClick={markAll} className="inline-flex items-center gap-1 text-[11.5px] text-primary font-semibold hover:opacity-80">
                <Check className="w-3.5 h-3.5" /> تعليم الكلّ كمقروء
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <div className="py-12 text-center text-foreground/50 text-[13px]">لا إشعارات</div>
          ) : (
            <div className="p-1.5">
              {items.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Bell;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => openItem(n)}
                    className={`w-full text-right flex items-start gap-2.5 px-2.5 py-2.5 rounded-xl transition-colors ${
                      n.readAt ? "hover:bg-foreground/[0.04]" : "bg-primary/[0.07] hover:bg-primary/[0.12]"
                    }`}
                  >
                    <span className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-primary/15 text-primary grid place-items-center">
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-[13px] font-semibold text-foreground truncate">{n.title}</span>
                        <span className="text-[10px] text-foreground/45 shrink-0">{timeAgo(n.createdAt)}</span>
                      </span>
                      {n.body && <span className="block text-[11.5px] text-foreground/55 mt-0.5 leading-relaxed line-clamp-2">{n.body}</span>}
                    </span>
                    {!n.readAt && <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
