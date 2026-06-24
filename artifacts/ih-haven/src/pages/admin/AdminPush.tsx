import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Send, Smartphone } from "lucide-react";
import { api, ApiError } from "@/lib/api";

export default function AdminPush() {
  const [form, setForm] = useState({ title: "", body: "", url: "" });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: stats } = useQuery({
    queryKey: ["admin-push-stats"],
    queryFn: () => api<{ tokens: number }>("/admin/push/stats"),
    refetchInterval: 30_000,
  });

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    if (!window.confirm(`إرسال إشعار لـ ${stats?.tokens ?? 0} جهاز؟`)) return;
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const r = await api<{ sent: number; failed: number; total: number }>("/admin/push/broadcast", {
        method: "POST",
        body: JSON.stringify({ title: form.title.trim(), body: form.body.trim(), url: form.url.trim() || undefined }),
      });
      setResult({ sent: r.sent, failed: r.failed });
      setForm({ title: "", body: "", url: "" });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الإرسال");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-[20px] font-bold text-foreground">إشعارات الجوّال</h2>
        <p className="text-[13px] text-foreground/65 mt-1">
          أرسل إشعار فوري لجميع الأجهزة المسجّلة.
        </p>
      </div>

      {/* Stats */}
      <div className="rounded-2xl bg-card border border-border p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="text-[22px] font-bold text-foreground tabular-nums">
            {stats?.tokens ?? "—"}
          </div>
          <div className="text-[12.5px] text-foreground/65">جهاز مسجّل للإشعارات</div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={send} className="rounded-2xl bg-card border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="text-[15px] font-bold text-foreground">إرسال إشعار</h3>
        </div>

        {result && (
          <div className="rounded-xl px-4 py-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[13px]">
            ✅ تم الإرسال — وصل لـ <strong>{result.sent}</strong> جهاز
            {result.failed > 0 && ` · فشل: ${result.failed}`}
          </div>
        )}

        {error && (
          <div className="rounded-xl px-4 py-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[13px]">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[12.5px] font-semibold text-foreground/70">عنوان الإشعار *</label>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="مثال: فعالية جديدة في آيلاند هيفن"
            maxLength={120}
            required
            className="w-full h-11 px-4 rounded-xl bg-muted/40 border border-border text-[13.5px] text-foreground outline-none focus:border-primary/50 focus:bg-card transition-all"
            data-testid="push-title"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[12.5px] font-semibold text-foreground/70">نصّ الإشعار *</label>
          <textarea
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="تفاصيل الإشعار…"
            maxLength={500}
            rows={3}
            required
            className="w-full px-4 py-3 rounded-xl bg-muted/40 border border-border text-[13.5px] text-foreground outline-none focus:border-primary/50 focus:bg-card transition-all resize-none"
            data-testid="push-body"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[12.5px] font-semibold text-foreground/70">
            رابط عند النقر <span className="text-foreground/65 font-normal">(اختياري)</span>
          </label>
          <input
            value={form.url}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            placeholder="https://... أو /events/42"
            maxLength={400}
            className="w-full h-11 px-4 rounded-xl bg-muted/40 border border-border text-[13.5px] text-foreground outline-none focus:border-primary/50 focus:bg-card transition-all"
            data-testid="push-url"
          />
        </div>

        <button
          type="submit"
          disabled={sending || !form.title.trim() || !form.body.trim()}
          data-testid="button-send-push"
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {sending ? (
            <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {sending ? "جارٍ الإرسال…" : "إرسال الإشعار"}
        </button>
      </form>
    </div>
  );
}
