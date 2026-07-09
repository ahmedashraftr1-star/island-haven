import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Hash } from "lucide-react";
import { api } from "@/lib/api";

// A single shared staff channel — owner ↔ staff ↔ staff. One stream everyone
// posts into; own messages align to one side. Polls for new posts.

interface TeamMsg {
  id: number;
  senderAdminId: number;
  senderName: string;
  body: string;
  createdAt: string;
}

function clock(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

function initials(name: string): string {
  return name?.trim()?.[0] ?? "؟";
}

export default function AdminTeamChannel() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const q = useQuery({
    queryKey: ["team-channel"],
    queryFn: () => api<{ messages: TeamMsg[]; meId: number }>("/admin/messages/team"),
    refetchInterval: 8_000,
  });
  const messages = q.data?.messages ?? [];
  const meId = q.data?.meId ?? -1;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [q.data]);

  const postMut = useMutation({
    mutationFn: (body: string) =>
      api("/admin/messages/team", { method: "POST", body: JSON.stringify({ body }) }),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["team-channel"] });
      qc.invalidateQueries({ queryKey: ["team-channel-unread"] });
    },
  });

  return (
    <div dir="rtl">
      <div className="mb-5">
        <h2 className="text-[20px] font-bold text-foreground flex items-center gap-2">
          <Hash className="w-5 h-5 text-primary" /> قناة الفريق
        </h2>
        <p className="text-[13px] text-foreground/60 mt-1">مساحة تواصل داخليّة بينك وبين أعضاء فريق الإدارة.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card flex flex-col h-[64vh]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full grid place-items-center text-foreground/50 text-[13px]">
              لا رسائل بعد — ابدأ الحديث مع فريقك.
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.senderAdminId === meId;
              return (
                <div key={m.id} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                  {!mine && (
                    <div className="w-8 h-8 rounded-full bg-primary/15 text-primary grid place-items-center text-[12px] font-bold shrink-0">
                      {initials(m.senderName)}
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${mine ? "bg-[hsl(var(--primary-cta))] text-white" : "bg-foreground/[0.06] text-foreground"}`}>
                    {!mine && <div className="text-[10.5px] font-semibold opacity-70 mb-0.5">{m.senderName}</div>}
                    <div className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">{m.body}</div>
                    <div className={`text-[10px] mt-1 ${mine ? "text-white/60" : "text-foreground/45"}`}>{clock(m.createdAt)}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) postMut.mutate(draft.trim());
          }}
          className="flex items-center gap-2 p-3 border-t border-border shrink-0"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="اكتب رسالة للفريق…"
            maxLength={4000}
            data-testid="team-channel-input"
            className="flex-1 h-11 px-4 rounded-xl bg-muted/40 border border-border text-[13.5px] text-foreground outline-none focus:border-primary/50"
          />
          <button
            type="submit"
            disabled={!draft.trim() || postMut.isPending}
            data-testid="team-channel-send"
            className="grid place-items-center w-11 h-11 rounded-xl bg-[hsl(var(--primary-cta))] text-white disabled:opacity-50 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
