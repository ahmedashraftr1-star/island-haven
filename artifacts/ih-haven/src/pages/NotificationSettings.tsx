import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Bell, CalendarCheck, GraduationCap, Mail, Smartphone } from "lucide-react";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";
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
  title: { ar: string; en: string };
  hint: { ar: string; en: string };
}[] = [
  {
    key: "emailSessions",
    icon: CalendarCheck,
    title: { ar: "بريد جلسات الإرشاد", en: "Mentorship session emails" },
    hint: {
      ar: "إشعار عند تأكيد أو تغيير مواعيد جلساتك مع الخبراء.",
      en: "Get notified when your sessions with experts are confirmed or rescheduled.",
    },
  },
  {
    key: "emailPrograms",
    icon: GraduationCap,
    title: { ar: "بريد البرامج والاحتضان", en: "Program & incubation emails" },
    hint: {
      ar: "تحديثات قبولك في البرامج ومستجدّات دفعتك.",
      en: "Updates on your program acceptances and the latest from your cohort.",
    },
  },
  {
    key: "emailDaily",
    icon: Mail,
    title: { ar: "النّشرة اليوميّة", en: "Daily digest" },
    hint: {
      ar: "ملخّص يوميّ بأهمّ الفرص والأخبار — يصل صباحًا.",
      en: "A morning summary of the top opportunities and news.",
    },
  },
  {
    key: "pushEnabled",
    icon: Smartphone,
    title: { ar: "إشعارات الجهاز (Push)", en: "Push notifications" },
    hint: {
      ar: "تنبيهات فوريّة على متصفّحك وتطبيقك عند وصول جديد.",
      en: "Instant alerts on your browser and app whenever something new arrives.",
    },
  },
];

export default function NotificationSettings() {
  const { lang, t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<PrefKey | null>(null);

  useEffect(() => {
    document.title =
      lang === "ar"
        ? "إعدادات الإشعارات — Island Haven"
        : "Notification Settings — Island Haven";
  }, [lang]);

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
          setError(
            e instanceof ApiError
              ? e.message
              : lang === "ar"
                ? "تعذّر التحميل"
                : "Couldn't load your settings",
          ),
      );
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, lang]);

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
      setError(
        e instanceof ApiError
          ? e.message
          : lang === "ar"
            ? "تعذّر الحفظ"
            : "Couldn't save",
      );
    } finally {
      setSaving(null);
    }
  }

  const view = prefs ?? DEFAULT_PREFS;
  const ready = !authLoading && !!user && prefs !== null;

  return (
    <PageShell
      eyebrow={t({ ar: "حسابك", en: "Your account" })}
      title={t({ ar: "إعدادات", en: "Notification" })}
      highlight={t({ ar: "الإشعارات", en: "Settings" })}
      subtitle={t({
        ar: "تحكّم في القنوات التي نصلك من خلالها — يُحفظ كلّ تغيير فور تبديله.",
        en: "Control the channels we reach you through — every change is saved the moment you flip it.",
      })}
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
          {TOGGLES.map((tag, i) => {
            const Icon = tag.icon;
            const on = view[tag.key];
            return (
              <motion.div
                key={tag.key}
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
                        {t(tag.title)}
                      </span>
                      <span className="block text-white/45 text-[12.5px] leading-[1.7] mt-0.5">
                        {t(tag.hint)}
                      </span>
                    </span>
                    <Toggle
                      on={on}
                      busy={saving === tag.key}
                      onToggle={() => toggle(tag.key)}
                      label={t(tag.title)}
                    />
                  </label>
                </GlassCard>
              </motion.div>
            );
          })}

          <p className="flex items-center gap-2 text-white/40 text-[12px] pt-2 px-1">
            <Bell className="w-3.5 h-3.5 text-primary/70 shrink-0" />
            {t({
              ar: "نُرسل دائمًا الرّسائل الأساسيّة المتعلّقة بأمان حسابك بصرف النّظر عن هذه الإعدادات.",
              en: "We always send essential messages about your account security, regardless of these settings.",
            })}
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
