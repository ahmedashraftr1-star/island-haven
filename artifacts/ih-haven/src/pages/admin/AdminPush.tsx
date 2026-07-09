import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, Send, Smartphone, Bell, Mail, Users, Check } from "lucide-react";
import { api, ApiError } from "@/lib/api";

// Broadcast composer — send a site-wide announcement across up to three channels
// (in-app · mobile push · email) to everyone or a single audience. In-app rows
// land in every member's NotificationBell; push honours device prefs; email goes
// to members who keep announcement emails on.

type Audience = "all" | "freelancer" | "graduate" | "student" | "other" | "expert";

const AUDIENCE_LABELS: Record<Audience, string> = {
  all: "الجميع",
  freelancer: "مستقلّون",
  graduate: "خرّيجون",
  student: "طلبة",
  other: "أخرى",
  expert: "خبراء / مرشدون",
};

interface AudienceStats {
  all: number;
  byRole: Record<string, number>;
  pushTokens: number;
  emailConfigured: boolean;
}

interface SendResult {
  audience: string;
  recipients: number;
  inApp: number;
  push: { sent: number; failed: number };
  email: { sent: number; skipped: number; configured: boolean };
}

export default function AdminPush() {
  const [form, setForm] = useState({ title: "", body: "", url: "" });
  const [audience, setAudience] = useState<Audience>("all");
  const [channels, setChannels] = useState({ inApp: true, push: false, email: false });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: stats } = useQuery({
    queryKey: ["admin-broadcast-audience"],
    queryFn: () => api<AudienceStats>("/admin/broadcast/audience"),
    refetchInterval: 60_000,
  });

  const audienceCount =
    audience === "all" ? (stats?.all ?? 0) : (stats?.byRole?.[audience] ?? 0);

  const anyChannel = channels.inApp || channels.push || channels.email;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim() || !anyChannel) return;
    const chans = [
      channels.inApp && "داخل الموقع",
      channels.push && "إشعار جوّال",
      channels.email && "بريد إلكترونيّ",
    ].filter(Boolean).join("، ");
    if (
      !window.confirm(
        `إرسال هذا الإعلان إلى ${audienceCount} عضو (${AUDIENCE_LABELS[audience]}) عبر: ${chans}؟`,
      )
    )
      return;
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const r = await api<SendResult>("/admin/broadcast", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          body: form.body.trim(),
          url: form.url.trim() || undefined,
          audience,
          channels,
        }),
      });
      setResult(r);
      setForm({ title: "", body: "", url: "" });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الإرسال");
    } finally {
      setSending(false);
    }
  }

  const CHANNELS: { key: keyof typeof channels; label: string; hint: string; Icon: typeof Bell }[] = [
    { key: "inApp", label: "داخل الموقع", hint: "يظهر في جرس الإشعارات لكلّ عضو", Icon: Bell },
    { key: "push", label: "إشعار الجوّال", hint: `${stats?.pushTokens ?? 0} جهاز مسجّل`, Icon: Smartphone },
    {
      key: "email",
      label: "بريد إلكترونيّ",
      hint: stats?.emailConfigured ? "للأعضاء المشتركين بالإعلانات" : "غير مُفعّل على الخادم",
      Icon: Mail,
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl" dir="rtl">
      <div>
        <h2 className="text-[20px] font-bold text-foreground flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" /> إعلان عام
        </h2>
        <p className="text-[13px] text-foreground/65 mt-1">
          أرسل إعلانًا لجميع أعضاء الموقع — يظهر في إشعاراتهم، وعلى الجوّال، وبالبريد.
        </p>
      </div>

      {/* Reach snapshot */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-card border border-border p-4">
          <Users className="w-4 h-4 text-primary mb-2" />
          <div className="text-[20px] font-bold text-foreground tabular-nums">{stats?.all ?? "—"}</div>
          <div className="text-[11.5px] text-foreground/65">عضو نشط</div>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4">
          <Smartphone className="w-4 h-4 text-primary mb-2" />
          <div className="text-[20px] font-bold text-foreground tabular-nums">{stats?.pushTokens ?? "—"}</div>
          <div className="text-[11.5px] text-foreground/65">جهاز للإشعارات</div>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4">
          <Mail className="w-4 h-4 text-primary mb-2" />
          <div className="text-[13px] font-bold text-foreground mt-1.5">
            {stats?.emailConfigured ? "مُفعّل" : "غير مُفعّل"}
          </div>
          <div className="text-[11.5px] text-foreground/65">البريد الإلكترونيّ</div>
        </div>
      </div>

      <form onSubmit={send} className="rounded-2xl bg-card border border-border p-6 space-y-5">
        {result && (
          <div className="rounded-xl px-4 py-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[13px] space-y-1">
            <div className="font-bold">✅ تمّ الإرسال إلى {result.recipients} عضو</div>
            <div className="text-emerald-200/80 text-[12px]">
              داخل الموقع: {result.inApp} · الجوّال: {result.push.sent}
              {result.push.failed > 0 && ` (فشل ${result.push.failed})`} · البريد: {result.email.sent}
              {result.email.skipped > 0 && ` (تخطّي ${result.email.skipped})`}
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-xl px-4 py-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[13px]">
            {error}
          </div>
        )}

        {/* Audience */}
        <div className="space-y-1.5">
          <label className="text-[12.5px] font-semibold text-foreground/70">الجمهور المستهدف</label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(AUDIENCE_LABELS) as Audience[]).map((a) => {
              const on = audience === a;
              const n = a === "all" ? (stats?.all ?? 0) : (stats?.byRole?.[a] ?? 0);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAudience(a)}
                  data-testid={`audience-${a}`}
                  className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors border ${
                    on
                      ? "bg-[hsl(var(--primary-cta))] text-white border-primary"
                      : "bg-foreground/[0.04] text-foreground/70 border-border hover:text-foreground"
                  }`}
                >
                  {AUDIENCE_LABELS[a]} <span className={on ? "text-white/70" : "text-foreground/45"}>· {n}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Channels */}
        <div className="space-y-1.5">
          <label className="text-[12.5px] font-semibold text-foreground/70">القنوات</label>
          <div className="grid sm:grid-cols-3 gap-2">
            {CHANNELS.map(({ key, label, hint, Icon }) => {
              const on = channels[key];
              const disabled = key === "email" && !stats?.emailConfigured;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => setChannels((c) => ({ ...c, [key]: !c[key] }))}
                  data-testid={`channel-${key}`}
                  aria-pressed={on ? "true" : "false"}
                  className={`text-right rounded-xl border p-3 transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
                    on
                      ? "bg-primary/10 border-primary/40"
                      : "bg-foreground/[0.02] border-border hover:border-foreground/25"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`w-4 h-4 ${on ? "text-primary" : "text-foreground/50"}`} />
                    {on && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <div className={`mt-2 text-[13px] font-semibold ${on ? "text-foreground" : "text-foreground/75"}`}>{label}</div>
                  <div className="text-[11px] text-foreground/55 mt-0.5">{hint}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-1">
          <label className="text-[12.5px] font-semibold text-foreground/70">عنوان الإعلان *</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="مثال: تمديد التسجيل حتى نهاية الأسبوع"
            maxLength={120}
            required
            className="w-full h-11 px-4 rounded-xl bg-muted/40 border border-border text-[13.5px] text-foreground outline-none focus:border-primary/50 focus:bg-card transition-all"
            data-testid="push-title"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[12.5px] font-semibold text-foreground/70">نصّ الإعلان *</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="اكتب رسالتك للأعضاء…"
            maxLength={2000}
            rows={4}
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
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            placeholder="https://... أو /events/42"
            maxLength={400}
            className="w-full h-11 px-4 rounded-xl bg-muted/40 border border-border text-[13.5px] text-foreground outline-none focus:border-primary/50 focus:bg-card transition-all"
            data-testid="push-url"
          />
        </div>

        <button
          type="submit"
          disabled={sending || !form.title.trim() || !form.body.trim() || !anyChannel}
          data-testid="button-send-push"
          className="w-full h-11 rounded-xl bg-[hsl(var(--primary-cta))] text-white font-bold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {sending ? (
            <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {sending
            ? "جارٍ الإرسال…"
            : `إرسال إلى ${audienceCount} عضو`}
        </button>
      </form>
    </div>
  );
}
