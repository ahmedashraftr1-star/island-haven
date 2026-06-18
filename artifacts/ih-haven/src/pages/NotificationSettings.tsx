import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Bell, CalendarCheck, GraduationCap, Mail, Smartphone } from "lucide-react";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";

interface Prefs {
  emailSessions: boolean;
  emailPrograms: boolean;
  emailDaily: boolean;
  pushEnabled: boolean;
}

type PrefKey = keyof Prefs;

const DEFAULT_PREFS: Prefs = {
  emailSessions: true,
  emailPrograms: true,
  emailDaily: false,
  pushEnabled: true,
};

const TOGGLES: {
  key: PrefKey;
  icon: React.ElementType;
  title: string;
  hint: string;
}[] = [
  {
    key: "emailSessions",
    icon: CalendarCheck,
    title: "بريد جلسات الإرشاد",
    hint: "إشعار عند تأكيد أو تغيير مواعيد جلساتك مع الخبراء.",
  },
  {
    key: "emailPrograms",
    icon: GraduationCap,
    title: "بريد البرامج والاحتضان",
    hint: "تحديثات قبولك في البرامج ومستجدّات دفعتك.",
  },
  {
    key: "emailDaily",
    icon: Mail,
    title: "النّشرة اليوميّة",
    hint: "ملخّص يوميّ بأهمّ الفرص والأخبار — يصل صباحًا.",
  },
  {
    key: "pushEnabled",
    icon: Smartphone,
    title: "إشعارات الجهاز (Push)",
    hint: "تنبيهات فوريّة على متصفّحك وتطبيقك عند وصول جديد.",
  },
];

export default function NotificationSettings() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<PrefKey | null>(null);

  useEffect(() => {
    document.title = "إعدادات الإشعارات — Island Haven";
  }, []);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    api<{ prefs: Prefs }>("/me/notification-prefs")
      .then((r) => !cancelled && setPrefs(r.prefs))
      .catch(
        (e) =>
          !cancelled &&
          setError(e instanceof ApiError ? e.message : "تعذّر التحميل"),
      );
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  async function toggle(key: PrefKey) {
    if (!prefs || saving) return;
    const next = !prefs[key];
    const prev = prefs;
    setPrefs({ ...prefs, [key]: next }); // optimistic
    setSaving(key);
    setError(null);
    try {
      const r = await api<{ prefs: Prefs }>("/me/notification-prefs", {
        method: "PATCH",
        body: JSON.stringify({ [key]: next }),
      });
      setPrefs(r.prefs);
    } catch (e) {
      setPrefs(prev); // revert on failure
      setError(e instanceof ApiError ? e.message : "تعذّر الحفظ");
    } finally {
      setSaving(null);
    }
  }

  const view = prefs ?? DEFAULT_PREFS;
  const ready = !authLoading && !!user && prefs !== null;

  return (
    <PageShell
      eyebrow="حسابك"
      title="إعدادات"
      highlight="الإشعارات"
      subtitle="تحكّم في القنوات التي نصلك من خلالها — يُحفظ كلّ تغيير فور تبديله."
      maxWidth="max-w-2xl"
    >
      {error && (
        <GlassCard className="p-4 mb-5 text-red-200 text-center text-[13.5px]">
          {error}
        </GlassCard>
      )}

      {!ready ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[24px] h-[88px] bg-white/[0.035] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {TOGGLES.map((t, i) => {
            const Icon = t.icon;
            const on = view[t.key];
            return (
              <motion.div
                key={t.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
              >
                <GlassCard className="p-4 sm:p-5">
                  <label className="flex items-center gap-4 cursor-pointer">
                    <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-primary/12 border border-primary/25 shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-white font-bold text-[15px] leading-snug">
                        {t.title}
                      </span>
                      <span className="block text-white/45 text-[12.5px] leading-[1.7] mt-0.5">
                        {t.hint}
                      </span>
                    </span>
                    <Toggle
                      on={on}
                      busy={saving === t.key}
                      onToggle={() => toggle(t.key)}
                      label={t.title}
                    />
                  </label>
                </GlassCard>
              </motion.div>
            );
          })}

          <p className="flex items-center gap-2 text-white/40 text-[12px] pt-2 px-1">
            <Bell className="w-3.5 h-3.5 text-primary/70 shrink-0" />
            نُرسل دائمًا الرّسائل الأساسيّة المتعلّقة بأمان حسابك بصرف النّظر عن
            هذه الإعدادات.
          </p>
        </div>
      )}
    </PageShell>
  );
}

function Toggle({
  on,
  busy,
  onToggle,
  label,
}: {
  on: boolean;
  busy: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={busy}
      onClick={onToggle}
      data-testid={`toggle-${label}`}
      className={`relative inline-flex items-center h-7 w-12 rounded-full shrink-0 transition-colors disabled:opacity-60 ${
        on ? "bg-primary" : "bg-white/[0.12] border border-white/15"
      }`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        // RTL: "on" sits at the start (right), "off" at the end (left).
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow ${
          on ? "right-1" : "left-1"
        }`}
      />
    </button>
  );
}
