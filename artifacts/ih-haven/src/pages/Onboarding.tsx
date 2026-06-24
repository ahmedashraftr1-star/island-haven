import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, GraduationCap, BookOpen, Sparkle, User, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { useAuth, type UserRole } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { AuthBackgroundAura } from "@/components/auth/AuthShell";
import { HavenMark } from "@/components/landing/HavenMark";
import { useLanguage } from "@/contexts/LanguageContext";

type Step = 0 | 1 | 2;

const ROLES: Array<{ id: UserRole; label: { ar: string; en: string }; sub: string; Icon: typeof Briefcase; color: string }> = [
  { id: "freelancer", label: { ar: "مستقلّ", en: "Freelancer" }, sub: "Freelancer", Icon: Briefcase, color: "from-primary/30 to-primary/5 border-primary/40" },
  { id: "graduate",  label: { ar: "خرّيج",  en: "Graduate" },  sub: "Graduate",   Icon: GraduationCap, color: "from-amber-500/30 to-amber-500/5 border-amber-500/40" },
  { id: "student",   label: { ar: "طالب",   en: "Student" },   sub: "Student",    Icon: BookOpen, color: "from-sky-500/30 to-sky-500/5 border-sky-500/40" },
  { id: "other",     label: { ar: "غير ذلك", en: "Other" },    sub: "Other",      Icon: Sparkle, color: "from-purple-500/30 to-purple-500/5 border-purple-500/40" },
];

export default function Onboarding() {
  const { lang, dir, t } = useLanguage();
  const { user, loading, setUser } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>(0);
  const [jobTitle, setJobTitle] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = lang === "ar" ? "مرحبًا — آيلاند هيفن" : "Welcome — Island Haven";
  }, [lang]);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  if (loading || !user) return null;

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      const updated = await api<{ user: typeof user }>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ jobTitle: jobTitle.trim(), bio: bio.trim(), skills: skills.trim() }),
      });
      setUser(updated.user);
      navigate("/profile");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t({ ar: "تعذّر الحفظ", en: "We couldn't save your changes" }));
      setSaving(false);
    }
  }

  const steps = [
    { title: t({ ar: "أهلًا", en: "Welcome" }), sub: "Welcome" },
    { title: t({ ar: "عرّف بنفسك", en: "About you" }), sub: "Tell us about you" },
    { title: t({ ar: "مهاراتك", en: "Your skills" }), sub: "Your skills" },
  ];

  return (
    <div
      dir={dir}
      className="relative min-h-screen overflow-hidden bg-[#0A0E1A] text-white"
      style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
    >
      <AuthBackgroundAura />

      {/* Header */}
      <header className="relative z-20 px-5 sm:px-8 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <HavenMark size={30} strokeColor="hsl(354 80% 60%)" />
          <div className="leading-tight">
            <div className="text-[13px] font-bold">Island Haven</div>
            <div className="text-[10px] text-white/45 tracking-widest uppercase">{t({ ar: "آيلاند هيفن", en: "Island Haven" })}</div>
          </div>
        </div>
        {/* Step dots */}
        <div className="flex items-center gap-2">
          {steps.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? "bg-primary w-5" : i < step ? "bg-emerald-500" : "bg-white/20"}`} />
          ))}
        </div>
      </header>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-5 sm:px-8 pb-10">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">

            {/* Step 0 — Welcome */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/30 mx-auto text-4xl">
                  👋
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{t({ ar: "أهلًا،", en: "Welcome," })} {user!.fullName.split(" ")[0]}</h1>
                  <p className="text-white/55 text-[14px] leading-relaxed">
                    {t({
                      ar: "خصّص ملفّك الشخصيّ حتى يتعرّف عليك أعضاء المساحة. لن يأخذ هذا أكثر من دقيقة!",
                      en: "Set up your profile so members of the space can get to know you. It won't take more than a minute!",
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full h-12 rounded-xl bg-primary text-white font-bold text-[14px] flex items-center justify-center gap-2"
                >
                  {t({ ar: "ابدأ الآن", en: "Get started" })}
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => navigate("/profile")} className="text-[12px] text-white/55 hover:text-white/80 transition-colors">
                  {t({ ar: "تخطّى، سأكمل لاحقًا", en: "Skip — I'll finish later" })}
                </button>
              </motion.div>
            )}

            {/* Step 1 — Job title + bio */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-5">
                <div className="mb-2">
                  <h2 className="text-2xl font-bold text-white">{t({ ar: "عرّف بنفسك", en: "About you" })}</h2>
                  <p className="text-white/60 text-[13px] mt-1">{t({ ar: "هذا ما يراه الأعضاء في ملفّك العامّ", en: "This is what members see on your public profile" })}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-semibold text-white/70 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> {t({ ar: "المسمّى الوظيفيّ", en: "Job title" })}
                    <span className="text-white/45 font-normal">Job title</span>
                  </label>
                  <input
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    placeholder={t({ ar: "مثال: مصمّم جرافيك مستقلّ", en: "e.g. Freelance graphic designer" })}
                    aria-label={t({ ar: "المسمّى الوظيفيّ", en: "Job title" })}
                    maxLength={120}
                    className="w-full h-12 px-4 rounded-xl bg-white/[0.07] border border-white/15 text-white placeholder:text-white/50 text-[14px] outline-none focus:border-primary/60 focus:bg-white/[0.09] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-semibold text-white/70">{t({ ar: "نبذة عنك", en: "Bio" })} <span className="text-white/45 font-normal">Bio</span></label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder={t({ ar: "حدّثنا عن مجال عملك وما تطمح لتحقيقه…", en: "Tell us about your field and what you hope to achieve…" })}
                    aria-label={t({ ar: "نبذة عنك", en: "Bio" })}
                    maxLength={500}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.07] border border-white/15 text-white placeholder:text-white/50 text-[14px] outline-none focus:border-primary/60 focus:bg-white/[0.09] transition-all resize-none leading-relaxed"
                  />
                  <div className="text-[11px] text-white/50 text-left">{bio.length}/500</div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(0)} className="flex-1 h-12 rounded-xl bg-white/[0.07] border border-white/15 text-white/60 text-[13px] font-semibold flex items-center justify-center gap-1.5">
                    <ChevronRight className="w-4 h-4" aria-hidden="true" /> {t({ ar: "السابق", en: "Back" })}
                  </button>
                  <button type="button" onClick={() => setStep(2)} className="flex-[2] h-12 rounded-xl bg-primary text-white font-bold text-[14px] flex items-center justify-center gap-2">
                    {t({ ar: "التالي", en: "Next" })} <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2 — Skills */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-5">
                <div className="mb-2">
                  <h2 className="text-2xl font-bold text-white">{t({ ar: "مهاراتك", en: "Your skills" })}</h2>
                  <p className="text-white/60 text-[13px] mt-1">{t({ ar: "افصل المهارات بفاصلة — ستظهر على ملفّك العامّ", en: "Separate skills with commas — they'll appear on your public profile" })}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-semibold text-white/70">{t({ ar: "المهارات", en: "Skills" })} <span className="text-white/45 font-normal">Skills</span></label>
                  <input
                    value={skills}
                    onChange={e => setSkills(e.target.value)}
                    placeholder={t({ ar: "مثال: تصميم، React، تصوير، تسويق", en: "e.g. Design, React, Photography, Marketing" })}
                    aria-label={t({ ar: "المهارات", en: "Skills" })}
                    maxLength={400}
                    className="w-full h-12 px-4 rounded-xl bg-white/[0.07] border border-white/15 text-white placeholder:text-white/50 text-[14px] outline-none focus:border-primary/60 transition-all"
                  />
                  {skills && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {skills.split(",").map(s => s.trim()).filter(Boolean).map((s, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary text-[12px] font-medium">{s}</span>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="rounded-xl px-4 py-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[13px]">{error}</div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl bg-white/[0.07] border border-white/15 text-white/60 text-[13px] font-semibold flex items-center justify-center gap-1.5">
                    <ChevronRight className="w-4 h-4" aria-hidden="true" /> {t({ ar: "السابق", en: "Back" })}
                  </button>
                  <button
                    type="button"
                    onClick={finish}
                    disabled={saving}
                    className="flex-[2] h-12 rounded-xl bg-emerald-500 text-white font-bold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? t({ ar: "جارٍ الحفظ…", en: "Saving…" }) : <><CheckCircle2 className="w-4 h-4" aria-hidden="true" /> {t({ ar: "أنهِ الإعداد", en: "Finish setup" })}</>}
                  </button>
                </div>
                <button type="button" onClick={() => navigate("/profile")} className="w-full text-center text-[12px] text-white/55 hover:text-white/80 transition-colors">
                  {t({ ar: "تخطّى", en: "Skip" })}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
