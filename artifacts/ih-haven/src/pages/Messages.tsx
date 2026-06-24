import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  Send,
  Plus,
  Search,
  MessageSquare,
  ArrowRight,
  X,
  UserCircle2,
} from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/labels";

interface Conversation {
  id: number;
  otherUserId: number;
  otherFullName: string;
  otherAvatarUrl: string | null;
  lastMessageAt: string;
  lastMessage: string | null;
}

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  body: string;
  createdAt: string;
}

interface MemberLite {
  id: number;
  fullName: string;
  jobTitle: string;
  avatarUrl: string | null;
}

const POLL_MS = 5000;

export default function Messages() {
  const { lang, t } = useLanguage();
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const [conversations, setConversations] = useState<Conversation[] | null>(
    null,
  );
  const [activeId, setActiveId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    document.title =
      lang === "ar" ? "الرسائل — Island Haven" : "Messages — Island Haven";
  }, [lang]);

  // Login gate — same pattern as Profile.
  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  async function loadConversations(): Promise<Conversation[] | null> {
    try {
      const r = await api<{ conversations: Conversation[] }>(
        "/me/conversations",
      );
      setConversations(r.conversations);
      return r.conversations;
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : lang === "ar"
            ? "تعذّر التحميل"
            : "Couldn't load conversations",
      );
      return null;
    }
  }

  useEffect(() => {
    if (user) void loadConversations();
  }, [user]);

  const active = useMemo(
    () => conversations?.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  async function onStartConversation(memberId: number) {
    try {
      const r = await api<{ conversation: Conversation }>(
        "/me/conversations",
        { method: "POST", body: JSON.stringify({ userId: memberId }) },
      );
      setShowNew(false);
      const list = await loadConversations();
      // Select the (new or existing) conversation once the list is fresh.
      const found = list?.find((c) => c.id === r.conversation.id);
      setActiveId(found?.id ?? r.conversation.id);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : lang === "ar"
            ? "تعذّر بدء المحادثة"
            : "Couldn't start the conversation",
      );
    }
  }

  if (loading || !user) {
    return (
      <PageShell active="messages">
        <div className="h-[60vh] rounded-[28px] bg-white/[0.035] border border-white/10 animate-pulse" />
      </PageShell>
    );
  }

  return (
    <PageShell
      active="messages"
      eyebrow={t({ ar: "تواصل مباشر", en: "Direct messaging" })}
      title={t({ ar: "الرسائل", en: "Private" })}
      highlight={t({ ar: "الخاصّة", en: "Messages" })}
      subtitle={t({
        ar: "راسل منتسبي المساحة مباشرةً — نسّق تعاونًا، اسأل عن خبرة، أو ابنِ شبكتك.",
        en: "Message space members directly — coordinate a collaboration, ask for expertise, or build your network.",
      })}
    >
      {error && (
        <GlassCard className="p-4 text-red-200 text-center mb-5">
          {error}
        </GlassCard>
      )}

      <div className="grid lg:grid-cols-[340px_1fr] gap-5 min-h-[60vh]">
        {/* ─── Conversation list ─────────────────────────────────────────── */}
        <GlassCard className="flex flex-col">
          <div className="flex items-center justify-between gap-3 p-4 border-b border-white/[0.07]">
            <div className="text-white font-bold text-[15px]">
              {t({ ar: "محادثاتي", en: "My conversations" })}
            </div>
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-primary text-white text-[12.5px] font-semibold hover:-translate-y-px transition-transform"
              data-testid="button-new-message"
            >
              <Plus className="w-3.5 h-3.5" /> {t({ ar: "رسالة جديدة", en: "New message" })}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {conversations === null ? (
              <div className="space-y-2 p-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-2xl bg-white/[0.035] border border-white/10 animate-pulse"
                  />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-white/45 text-[13px]">
                {t({
                  ar: "لا محادثات بعد. ابدأ واحدة من زرّ «رسالة جديدة».",
                  en: "No conversations yet. Start one with the “New message” button.",
                })}
              </div>
            ) : (
              <ul className="space-y-1">
                {conversations.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(c.id)}
                      className={`w-full text-start flex items-center gap-3 p-3 rounded-2xl transition-colors border ${
                        activeId === c.id
                          ? "bg-primary/15 border-primary/40"
                          : "bg-white/[0.02] border-transparent hover:bg-white/[0.05]"
                      }`}
                      data-testid={`conversation-${c.id}`}
                    >
                      <Avatar
                        url={c.otherAvatarUrl}
                        name={c.otherFullName}
                        size={40}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-white font-semibold text-[13.5px] truncate">
                          {c.otherFullName}
                        </span>
                        <span className="block text-white/45 text-[12px] truncate">
                          {c.lastMessage || "…"}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </GlassCard>

        {/* ─── Active thread ─────────────────────────────────────────────── */}
        {active ? (
          <Thread
            key={active.id}
            conversation={active}
            meId={user.id}
            onSent={() => void loadConversations()}
          />
        ) : (
          <GlassCard className="flex items-center justify-center">
            <EmptyState
              title={t({ ar: "اختر محادثة", en: "Select a conversation" })}
              hint={t({
                ar: "اختر محادثة من القائمة أو ابدأ واحدة جديدة لعرض الرسائل هنا.",
                en: "Pick a conversation from the list or start a new one to view messages here.",
              })}
            />
          </GlassCard>
        )}
      </div>

      <AnimatePresence>
        {showNew && (
          <NewMessageModal
            onClose={() => setShowNew(false)}
            onPick={onStartConversation}
            meId={user.id}
          />
        )}
      </AnimatePresence>
    </PageShell>
  );
}

// ─── Thread + composer ─────────────────────────────────────────────────────────

function Thread({
  conversation,
  meId,
  onSent,
}: {
  conversation: Conversation;
  meId: number;
  onSent: () => void;
}) {
  const { lang, t } = useLanguage();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function load(scroll = false) {
    try {
      const r = await api<{ messages: Message[] }>(
        `/me/conversations/${conversation.id}/messages`,
      );
      setMessages(r.messages);
      if (scroll) {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
          });
        });
      }
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : lang === "ar"
            ? "تعذّر تحميل الرسائل"
            : "Couldn't load messages",
      );
    }
  }

  // Initial load + poll every 5s while this thread is open.
  useEffect(() => {
    void load(true);
    const timer = setInterval(() => void load(false), POLL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  // Keep pinned to the bottom as new messages arrive.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages?.length]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      await api(`/me/conversations/${conversation.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setDraft("");
      await load(true);
      onSent();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : lang === "ar"
            ? "تعذّر الإرسال"
            : "Couldn't send",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <GlassCard className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/[0.07]">
        <Avatar
          url={conversation.otherAvatarUrl}
          name={conversation.otherFullName}
          size={40}
        />
        <div className="min-w-0">
          <div className="text-white font-bold text-[14.5px] truncate">
            {conversation.otherFullName}
          </div>
          <div className="text-white/60 text-[11.5px]">
            {t({ ar: "منتسب · Island Haven", en: "Member · Island Haven" })}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[52vh]"
      >
        {messages === null ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-10 w-2/3 rounded-2xl bg-white/[0.04] animate-pulse ${
                  i % 2 ? "" : "ms-auto"
                }`}
              />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white/65 text-[13px]">
            {t({
              ar: "لا رسائل بعد — اكتب أوّل رسالة في الأسفل.",
              en: "No messages yet — write the first one below.",
            })}
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === meId;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex ${mine ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-[1.7] whitespace-pre-wrap break-words ${
                    mine
                      ? "bg-primary text-white rounded-bl-md"
                      : "bg-white/[0.06] text-white/90 border border-white/10 rounded-br-md"
                  }`}
                >
                  {m.body}
                  <div
                    className={`mt-1 text-[10px] ${
                      mine ? "text-white/75" : "text-white/55"
                    }`}
                  >
                    {formatDateTime(m.createdAt, lang)}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={onSend}
        className="p-3 border-t border-white/[0.07] flex items-end gap-2"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void onSend(e as unknown as React.FormEvent);
            }
          }}
          rows={1}
          maxLength={4000}
          placeholder={t({ ar: "اكتب رسالتك…", en: "Write your message…" })}
          className="flex-1 resize-none rounded-2xl bg-white/[0.05] border border-white/12 px-4 py-2.5 text-[13.5px] text-white placeholder:text-white/50 focus:outline-none focus:border-primary/50 leading-[1.7] max-h-32"
          data-testid="input-message"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          aria-label={t({ ar: "إرسال", en: "Send" })}
          className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-primary text-white disabled:opacity-40 hover:-translate-y-px transition-transform shrink-0"
          data-testid="button-send"
        >
          <Send className="w-4 h-4 -scale-x-100" />
        </button>
      </form>
      {error && (
        <div className="px-4 pb-3 text-red-300 text-[12px]">{error}</div>
      )}
    </GlassCard>
  );
}

// ─── New-message modal (pick a member) ─────────────────────────────────────────

function NewMessageModal({
  onClose,
  onPick,
  meId,
}: {
  onClose: () => void;
  onPick: (memberId: number) => void;
  meId: number;
}) {
  const { t } = useLanguage();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<MemberLite[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      setRows(null);
      const query = q.trim()
        ? `/members?q=${encodeURIComponent(q.trim())}`
        : "/members";
      api<{ members: MemberLite[] }>(query)
        .then((r) => !cancelled && setRows(r.members.filter((m) => m.id !== meId)))
        .catch(() => !cancelled && setRows([]));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [q, meId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <GlassCard className="flex flex-col max-h-[70vh]">
          <div className="flex items-center justify-between gap-3 p-4 border-b border-white/[0.07]">
            <div className="inline-flex items-center gap-2 text-white font-bold text-[15px]">
              <MessageSquare className="w-4 h-4 text-primary" />{" "}
              {t({ ar: "رسالة جديدة", en: "New message" })}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t({ ar: "إغلاق", en: "Close" })}
              className="p-1.5 rounded-lg text-white/55 hover:text-white hover:bg-white/[0.06]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 border-b border-white/[0.07]">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t({
                  ar: "ابحث عن منتسب بالاسم أو المهارة…",
                  en: "Search a member by name or skill…",
                })}
                className="w-full rounded-2xl bg-white/[0.05] border border-white/12 ps-10 pe-4 py-2.5 text-[13.5px] text-white placeholder:text-white/50 focus:outline-none focus:border-primary/50"
                data-testid="input-member-search"
                autoFocus
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {rows === null ? (
              <div className="p-6 text-center text-white/45 text-[13px]">
                {t({ ar: "جارِ التحميل…", en: "Loading…" })}
              </div>
            ) : rows.length === 0 ? (
              <div className="p-6 text-center text-white/45 text-[13px]">
                {t({ ar: "لا منتسبين مطابقين.", en: "No matching members." })}
              </div>
            ) : (
              <ul className="space-y-1">
                {rows.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => onPick(m.id)}
                      className="w-full text-start flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] transition-colors"
                      data-testid={`member-pick-${m.id}`}
                    >
                      <Avatar url={m.avatarUrl} name={m.fullName} size={40} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-white font-semibold text-[13.5px] truncate">
                          {m.fullName}
                        </span>
                        {m.jobTitle && (
                          <span className="block text-white/45 text-[12px] truncate">
                            {m.jobTitle}
                          </span>
                        )}
                      </span>
                      <ArrowRight className="w-4 h-4 text-white/50 -scale-x-100 rtl:scale-x-100" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

// ─── Avatar helper ─────────────────────────────────────────────────────────────

function Avatar({
  url,
  name,
  size,
}: {
  url: string | null;
  name: string;
  size: number;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0 border border-white/10"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 text-primary"
      style={{ width: size, height: size }}
    >
      <UserCircle2 className="w-1/2 h-1/2" />
    </div>
  );
}
