import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, ShieldCheck } from "lucide-react";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

// The member side of the "من الإدارة" thread — read + reply to the team.

interface Msg {
  id: number;
  senderKind: "admin" | "member";
  senderName: string;
  body: string;
  createdAt: string;
}

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

export default function TeamInbox() {
  const { lang, t } = useLanguage();
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = lang === "ar" ? "من الإدارة — Island Haven" : "From the team — Island Haven";
  }, [lang]);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  const q = useQuery({
    queryKey: ["team-thread"],
    queryFn: () => api<{ messages: Msg[] }>("/me/team-thread"),
    enabled: !!user,
    refetchInterval: 8_000,
  });
  const messages = q.data?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [q.data]);

  const sendMut = useMutation({
    mutationFn: (body: string) => api("/me/team-thread", { method: "POST", body: JSON.stringify({ body }) }),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["team-thread"] });
      qc.invalidateQueries({ queryKey: ["team-thread-unread"] });
      qc.invalidateQueries({ queryKey: ["notif-count"] });
    },
  });

  return (
    <PageShell
      eyebrow={t({ ar: "التواصل", en: "Contact" })}
      title={t({ ar: "من الإدارة", en: "From the team" })}
      subtitle={t({
        ar: "قناة مباشرة بينك وبين فريق آيلاند هيفن — اطرح سؤالك وسنردّ عليك هنا.",
        en: "A direct line to the Island Haven team — ask anything and we'll reply here.",
      })}
      maxWidth="max-w-3xl"
    >
      <GlassCard className="flex flex-col h-[60vh] p-0 overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 h-14 border-b border-white/10 shrink-0">
          <span className="w-8 h-8 rounded-full bg-primary/15 text-primary grid place-items-center">
            <ShieldCheck className="w-4 h-4" />
          </span>
          <span className="font-semibold text-foreground text-[14px]">
            {t({ ar: "فريق آيلاند هيفن", en: "Island Haven team" })}
          </span>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full grid place-items-center text-foreground/55 text-[13px] text-center px-6">
              {t({
                ar: "لا رسائل بعد. اكتب رسالتك الأولى للفريق أدناه.",
                en: "No messages yet. Write your first message to the team below.",
              })}
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.senderKind === "member";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${mine ? "bg-primary-cta text-primary-foreground" : "bg-white/[0.07] text-foreground"}`}>
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
            if (draft.trim()) sendMut.mutate(draft.trim());
          }}
          className="flex items-center gap-2 p-3 border-t border-white/10 shrink-0"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t({ ar: "اكتب رسالتك…", en: "Type your message…" })}
            maxLength={4000}
            data-testid="team-thread-input"
            className="flex-1 h-11 px-4 rounded-xl bg-white/[0.04] border border-white/12 text-[13.5px] text-foreground outline-none focus:border-primary/50"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sendMut.isPending}
            data-testid="team-thread-send"
            className="grid place-items-center w-11 h-11 rounded-xl bg-primary-cta text-primary-foreground disabled:opacity-50 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </GlassCard>
    </PageShell>
  );
}
