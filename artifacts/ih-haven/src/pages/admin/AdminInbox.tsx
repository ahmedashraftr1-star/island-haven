import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Plus, Search, X, MessageSquare, ArrowRight } from "lucide-react";
import { api, ApiError } from "@/lib/api";

// Owner ↔ member direct messages. Left: threads (one per member) with unread
// badges. Right: the selected conversation + reply box. "رسالة جديدة" opens a
// member search to start a new thread. Polls for new messages.

interface Thread {
  id: number;
  memberUserId: number;
  memberName: string;
  memberAvatar: string | null;
  lastMessageAt: string;
  preview: string | null;
  unread: number;
}
interface Msg {
  id: number;
  senderKind: "admin" | "member";
  senderName: string;
  body: string;
  createdAt: string;
}
interface MemberHit {
  id: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
}

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} س`;
  return `قبل ${Math.floor(h / 24)} ي`;
}

function Avatar({ name, url }: { name: string; url?: string | null }) {
  if (url) return <img src={url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />;
  return (
    <div className="w-9 h-9 rounded-full bg-primary/15 text-primary grid place-items-center text-[13px] font-bold shrink-0">
      {name?.trim()?.[0] ?? "؟"}
    </div>
  );
}

export default function AdminInbox() {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const threadsQ = useQuery({
    queryKey: ["admin-threads"],
    queryFn: () => api<{ threads: Thread[] }>("/admin/messages/threads"),
    refetchInterval: 15_000,
  });
  const threads = threadsQ.data?.threads ?? [];

  const convoQ = useQuery({
    queryKey: ["admin-thread", activeId],
    queryFn: () => api<{ thread: Thread; messages: Msg[] }>(`/admin/messages/threads/${activeId}`),
    enabled: activeId !== null,
    refetchInterval: activeId !== null ? 8_000 : false,
  });

  useEffect(() => {
    if (convoQ.data) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [convoQ.data]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-threads"] });
    if (activeId !== null) qc.invalidateQueries({ queryKey: ["admin-thread", activeId] });
  };

  const replyMut = useMutation({
    mutationFn: (body: string) =>
      api(`/admin/messages/threads/${activeId}`, { method: "POST", body: JSON.stringify({ body }) }),
    onSuccess: () => {
      setDraft("");
      invalidate();
    },
  });

  const active = convoQ.data?.thread;
  const messages = convoQ.data?.messages ?? [];

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-[20px] font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> صندوق الرسائل
          </h2>
          <p className="text-[13px] text-foreground/60 mt-1">راسل أعضاء المجتمع مباشرةً وردّ على رسائلهم.</p>
        </div>
        <button
          type="button"
          onClick={() => setComposeOpen(true)}
          data-testid="inbox-new"
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 h-11 text-[13.5px] font-bold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> رسالة جديدة
        </button>
      </div>

      <div className="grid md:grid-cols-[320px_1fr] gap-4 h-[62vh]">
        {/* Threads */}
        <div className={`rounded-2xl border border-border bg-card overflow-y-auto ${activeId !== null ? "hidden md:block" : ""}`}>
          {threads.length === 0 ? (
            <div className="text-foreground/55 text-[13px] text-center py-16 px-4">لا رسائل بعد. ابدأ محادثة جديدة.</div>
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveId(t.id)}
                data-testid={`thread-${t.id}`}
                className={`w-full text-right flex items-start gap-3 px-3.5 py-3 border-b border-border transition-colors ${
                  activeId === t.id ? "bg-primary/[0.08]" : "hover:bg-foreground/[0.03]"
                }`}
              >
                <Avatar name={t.memberName} url={t.memberAvatar} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13.5px] font-semibold text-foreground truncate">{t.memberName}</span>
                    <span className="text-[10.5px] text-foreground/45 shrink-0">{timeAgo(t.lastMessageAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-[12px] text-foreground/55 truncate">{t.preview ?? "—"}</span>
                    {t.unread > 0 && (
                      <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10.5px] font-bold grid place-items-center">
                        {t.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Conversation */}
        <div className={`rounded-2xl border border-border bg-card flex flex-col ${activeId === null ? "hidden md:flex" : ""}`}>
          {active ? (
            <>
              <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
                <button type="button" onClick={() => setActiveId(null)} className="md:hidden text-foreground/60">
                  <ArrowRight className="w-5 h-5" />
                </button>
                <Avatar name={active.memberName} url={active.memberAvatar} />
                <div className="font-semibold text-foreground text-[14px]">{active.memberName}</div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map((m) => {
                  const mine = m.senderKind === "admin";
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-foreground/[0.06] text-foreground"}`}>
                        {!mine && <div className="text-[10.5px] font-semibold opacity-70 mb-0.5">{m.senderName}</div>}
                        <div className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">{m.body}</div>
                        <div className={`text-[10px] mt-1 ${mine ? "text-white/60" : "text-foreground/45"}`}>{timeAgo(m.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (draft.trim()) replyMut.mutate(draft.trim());
                }}
                className="flex items-center gap-2 p-3 border-t border-border shrink-0"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="اكتب ردًّا…"
                  maxLength={4000}
                  data-testid="inbox-reply"
                  className="flex-1 h-11 px-4 rounded-xl bg-muted/40 border border-border text-[13.5px] text-foreground outline-none focus:border-primary/50"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || replyMut.isPending}
                  className="grid place-items-center w-11 h-11 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-foreground/50 text-[13px]">اختر محادثة لعرضها</div>
          )}
        </div>
      </div>

      {composeOpen && (
        <ComposeModal
          onClose={() => setComposeOpen(false)}
          onSent={(threadId) => {
            setComposeOpen(false);
            setActiveId(threadId);
            invalidate();
          }}
        />
      )}
    </div>
  );
}

function ComposeModal({ onClose, onSent }: { onClose: () => void; onSent: (threadId: number) => void }) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<MemberHit | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const membersQ = useQuery({
    queryKey: ["admin-msg-members", q],
    queryFn: () => api<{ members: MemberHit[] }>(`/admin/messages/members?q=${encodeURIComponent(q)}`),
    enabled: !picked,
  });

  const startMut = useMutation({
    mutationFn: () =>
      api<{ threadId: number }>("/admin/messages/start", {
        method: "POST",
        body: JSON.stringify({ memberUserId: picked!.id, body: body.trim() }),
      }),
    onSuccess: (r) => onSent(r.threadId),
    onError: (e) => setError(e instanceof ApiError ? e.message : "تعذّر الإرسال"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div dir="rtl" className="w-full max-w-md rounded-2xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-bold text-foreground">رسالة جديدة</h3>
          <button type="button" onClick={onClose} className="grid place-items-center w-8 h-8 rounded-lg hover:bg-foreground/10 text-foreground/60">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && <div className="mb-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[12.5px] px-3 py-2">{error}</div>}

        {!picked ? (
          <>
            <div className="relative mb-2">
              <Search className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-foreground/40" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث عن عضو بالاسم أو البريد…"
                data-testid="compose-search"
                className="w-full h-11 pr-9 pl-3 rounded-xl bg-muted/40 border border-border text-[13.5px] text-foreground outline-none focus:border-primary/50"
              />
            </div>
            <div className="max-h-[40vh] overflow-y-auto -mx-1">
              {(membersQ.data?.members ?? []).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPicked(m)}
                  data-testid={`compose-member-${m.id}`}
                  className="w-full text-right flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-foreground/[0.05]"
                >
                  <Avatar name={m.fullName} url={m.avatarUrl} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-foreground truncate">{m.fullName}</div>
                    <div className="text-[11px] text-foreground/50 truncate" dir="ltr">{m.email}</div>
                  </div>
                </button>
              ))}
              {membersQ.data && membersQ.data.members.length === 0 && (
                <div className="text-foreground/50 text-[12.5px] text-center py-6">لا نتائج</div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3 rounded-xl bg-foreground/[0.04] px-3 py-2">
              <Avatar name={picked.fullName} url={picked.avatarUrl} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-foreground truncate">{picked.fullName}</div>
                <div className="text-[11px] text-foreground/50 truncate" dir="ltr">{picked.email}</div>
              </div>
              <button type="button" onClick={() => setPicked(null)} className="text-[12px] text-primary font-semibold">تغيير</button>
            </div>
            <textarea
              autoFocus
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="اكتب رسالتك…"
              rows={4}
              maxLength={4000}
              data-testid="compose-body"
              className="w-full px-3 py-2.5 rounded-xl bg-muted/40 border border-border text-[13.5px] text-foreground outline-none focus:border-primary/50 resize-none"
            />
            <button
              type="button"
              disabled={!body.trim() || startMut.isPending}
              onClick={() => startMut.mutate()}
              data-testid="compose-send"
              className="mt-3 w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-[13.5px] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> إرسال
            </button>
          </>
        )}
      </div>
    </div>
  );
}
