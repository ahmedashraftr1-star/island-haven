import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Hash, SmilePlus, Pencil, Trash2, Check, X } from "lucide-react";
import { api } from "@/lib/api";
import { useConfirm } from "@/hooks/use-confirm";
import { RichText } from "./richText";

// A single shared staff channel — owner ↔ staff ↔ staff. Grouped by author,
// emoji reactions, edit/delete your own message, @mentions + links rendered.

interface Reaction { emoji: string; count: number; mine: boolean }
interface TeamMsg {
  id: number;
  senderAdminId: number;
  senderName: string;
  body: string;
  editedAt: string | null;
  createdAt: string;
  reactions: Reaction[];
}

const EMOJIS = ["👍", "❤️", "🎉", "✅", "🙏", "🔥", "👀", "😄"];

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}
function initials(name: string): string {
  return name?.trim()?.[0] ?? "؟";
}

export default function AdminTeamChannel() {
  const confirm = useConfirm();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<{ id: number; body: string } | null>(null);
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const q = useQuery({
    queryKey: ["team-channel"],
    queryFn: () => api<{ messages: TeamMsg[]; meId: number }>("/admin/messages/team"),
    refetchInterval: 8_000,
  });
  const messages = q.data?.messages ?? [];
  const meId = q.data?.meId ?? -1;

  useEffect(() => {
    if (!editing) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [q.data, editing]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["team-channel"] });
    qc.invalidateQueries({ queryKey: ["admin-team-unread"] });
  };

  const postMut = useMutation({
    mutationFn: (body: string) => api("/admin/messages/team", { method: "POST", body: JSON.stringify({ body }) }),
    onSuccess: () => { setDraft(""); refresh(); },
  });
  const editMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: string }) => api(`/admin/messages/team/${id}`, { method: "PATCH", body: JSON.stringify({ body }) }),
    onSuccess: () => { setEditing(null); refresh(); },
  });
  const delMut = useMutation({
    mutationFn: (id: number) => api(`/admin/messages/team/${id}`, { method: "DELETE" }),
    onSuccess: refresh,
  });
  const reactMut = useMutation({
    mutationFn: ({ id, emoji }: { id: number; emoji: string }) => api(`/admin/messages/team/${id}/react`, { method: "POST", body: JSON.stringify({ emoji }) }),
    onSuccess: () => { setPickerFor(null); refresh(); },
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
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
          {messages.length === 0 ? (
            <div className="h-full grid place-items-center text-foreground/50 text-[13px]">لا رسائل بعد — ابدأ الحديث مع فريقك.</div>
          ) : (
            messages.map((m, i) => {
              const mine = m.senderAdminId === meId;
              const prev = messages[i - 1];
              const grouped = prev && prev.senderAdminId === m.senderAdminId && new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60_000;
              return (
                <div key={m.id} className={`group/msg flex items-start gap-2.5 px-2 py-0.5 rounded-lg hover:bg-foreground/[0.02] ${grouped ? "" : "mt-2"}`}>
                  <div className="w-8 shrink-0">
                    {!grouped && (
                      <div className="w-8 h-8 rounded-full bg-primary/15 text-primary grid place-items-center text-[12px] font-bold">{initials(m.senderName)}</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {!grouped && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-bold text-foreground">{m.senderName}</span>
                        <span className="text-[10.5px] text-foreground/40">{clock(m.createdAt)}</span>
                      </div>
                    )}
                    {editing?.id === m.id ? (
                      <div className="flex items-end gap-2 mt-1">
                        <textarea
                          value={editing.body}
                          onChange={(e) => setEditing({ id: m.id, body: e.target.value })}
                          rows={1}
                          aria-label="تعديل الرسالة"
                          className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-[13px] text-foreground outline-none focus:border-primary/50 resize-none"
                          data-testid={`team-edit-${m.id}`}
                        />
                        <button type="button" onClick={() => editing.body.trim() && editMut.mutate(editing)} aria-label="حفظ" className="grid place-items-center w-8 h-8 rounded-lg bg-[hsl(var(--primary-cta))] text-white"><Check className="w-4 h-4" /></button>
                        <button type="button" onClick={() => setEditing(null)} aria-label="إلغاء" className="grid place-items-center w-8 h-8 rounded-lg bg-muted text-foreground/60"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="text-[13.5px] text-foreground/85 leading-relaxed break-words">
                        <RichText text={m.body} />
                        {m.editedAt && <span className="text-[10px] text-foreground/35 me-1">(مُعدّل)</span>}
                      </div>
                    )}

                    {/* Reactions */}
                    {(m.reactions.length > 0 || pickerFor === m.id) && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {m.reactions.map((r) => (
                          <button
                            key={r.emoji}
                            type="button"
                            onClick={() => reactMut.mutate({ id: m.id, emoji: r.emoji })}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] border transition-colors ${r.mine ? "bg-primary/15 border-primary/40 text-foreground" : "bg-foreground/[0.04] border-border text-foreground/70 hover:border-foreground/25"}`}
                          >
                            <span>{r.emoji}</span><span className="tabular-nums text-[11px]">{r.count}</span>
                          </button>
                        ))}
                        {pickerFor === m.id && (
                          <div className="inline-flex items-center gap-0.5 rounded-full bg-muted border border-border px-1.5 py-0.5">
                            {EMOJIS.map((e) => (
                              <button key={e} type="button" onClick={() => reactMut.mutate({ id: m.id, emoji: e })} className="w-6 h-6 grid place-items-center rounded hover:bg-foreground/10 text-[14px]">{e}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Hover actions */}
                  {editing?.id !== m.id && (
                    <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover/msg:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button type="button" onClick={() => setPickerFor((p) => (p === m.id ? null : m.id))} aria-label="تفاعل" className="grid place-items-center w-7 h-7 rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/[0.06]"><SmilePlus className="w-3.5 h-3.5" /></button>
                      {mine && <button type="button" onClick={() => setEditing({ id: m.id, body: m.body })} aria-label="تعديل" className="grid place-items-center w-7 h-7 rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/[0.06]"><Pencil className="w-3.5 h-3.5" /></button>}
                      {mine && <button type="button" onClick={async () => { if (await confirm({ title: "تأكيد الحذف", message: "حذف الرسالة؟", confirmLabel: "حذف", danger: true })) delMut.mutate(m.id); }} aria-label="حذف" className="grid place-items-center w-7 h-7 rounded-lg text-foreground/40 hover:text-rose-400 hover:bg-rose-500/10"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); if (draft.trim()) postMut.mutate(draft.trim()); }}
          className="flex items-center gap-2 p-3 border-t border-border shrink-0"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="اكتب رسالة للفريق… (اذكر زميلًا بـ @)"
            maxLength={4000}
            data-testid="team-channel-input"
            className="flex-1 h-11 px-4 rounded-xl bg-muted/40 border border-border text-[13.5px] text-foreground outline-none focus:border-primary/50"
          />
          <button type="submit" disabled={!draft.trim() || postMut.isPending} data-testid="team-channel-send" aria-label="إرسال" className="grid place-items-center w-11 h-11 rounded-xl bg-[hsl(var(--primary-cta))] text-white disabled:opacity-50 transition-opacity">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
