import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Lock,
  LogOut,
  PenLine,
  Phone,
  Plus,
  Quote,
  Sparkles,
  User as UserIcon,
  Wrench,
  Globe,
  GraduationCap,
  Briefcase,
  Bookmark,
  Linkedin,
  Github,
  Link2,
  X,
  CalendarCheck,
  ArrowRight,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import type { ExtraLink } from "@/lib/auth";
import { AuthBackgroundAura } from "@/components/auth/AuthShell";
import { HavenMark } from "@/components/landing/HavenMark";
import { useAuth, ROLE_LABELS } from "@/lib/auth";
import type { UserRole } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import {
  COURSE_STATUS_LABELS,
  COURSE_TYPE_LABELS,
  formatArabicDateTime,
  SESSION_STATUS_LABELS,
  SESSION_STATUS_LABELS_EN,
  SESSION_MODE_LABELS,
  SESSION_MODE_LABELS_EN,
  type CourseStatus,
  type CourseType,
  type SessionStatus,
  type SessionMode,
} from "@/lib/labels";

// English label maps (Arabic lives in @/lib/labels).
const COURSE_TYPE_LABELS_EN: Record<CourseType, string> = {
  course: "Course",
  workshop: "Workshop",
};
const COURSE_STATUS_LABELS_EN: Record<CourseStatus, string> = {
  draft: "Draft",
  open: "Registration open",
  closed: "Full",
  done: "Ended",
};

// Localised date-time: Arabic-EG in AR, English-GB in EN.
function formatDateTime(iso: string | null | undefined, lang: Lang): string {
  if (lang === "ar") return formatArabicDateTime(iso);
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
// Localised numeral: Arabic-Indic in AR, Western digits in EN.
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}

// English role labels (Arabic lives in ROLE_LABELS).
const ROLE_LABELS_EN: Record<UserRole, string> = {
  freelancer: "Freelancer",
  graduate: "Graduate",
  student: "Student",
  other: "Member",
  expert: "Expert / Mentor",
};

export default function Profile() {
  const { user, loading, logout, setUser } = useAuth();
  const { lang, dir, t } = useLanguage();
  const [, navigate] = useLocation();

  useEffect(() => {
    document.title =
      lang === "ar"
        ? "ملفّي الشخصيّ — آيلاند هيفن"
        : "My Profile — Island Haven";
  }, [lang]);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div
        dir={dir}
        className="relative min-h-screen overflow-hidden bg-[#0A0E1A] text-white flex items-center justify-center"
      >
        <AuthBackgroundAura />
        <div className="relative z-10 flex items-center gap-3 text-white/55">
          <span className="inline-block w-5 h-5 rounded-full border-2 border-white/30 border-t-primary animate-spin" />
          {t({ ar: "جارٍ التحميل…", en: "Loading…" })}
        </div>
      </div>
    );
  }

  return (
    <ProfileInner user={user} setUser={setUser} logout={logout} />
  );
}

function ProfileInner({
  user,
  setUser,
  logout,
}: {
  user: AuthUser;
  setUser: (u: AuthUser | null) => void;
  logout: () => Promise<void>;
}) {
  const { lang, dir, t } = useLanguage();
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: user.fullName,
    bio: user.bio || "",
    jobTitle: user.jobTitle || "",
    phone: user.phone || "",
    skills: user.skills || "",
    portfolioUrl: user.portfolioUrl || "",
    linkedinUrl: user.linkedinUrl || "",
    behanceUrl: user.behanceUrl || "",
    githubUrl: user.githubUrl || "",
    otherLinks: (user.otherLinks ?? []) as ExtraLink[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const errRef = useRef<HTMLDivElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarDeleting, setAvatarDeleting] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarDeleteConfirm, setAvatarDeleteConfirm] = useState(false);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarUploading) return;
    setAvatarError(null);
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/uploads/image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!uploadRes.ok) {
        const d = await uploadRes.json().catch(() => ({}));
        throw new Error(
          (d as { error?: string }).error ||
            t({ ar: "تعذّر رفع الصورة", en: "Couldn't upload the image" }),
        );
      }
      const { url } = (await uploadRes.json()) as { url: string };
      const patchRes = await fetch("/api/auth/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });
      if (!patchRes.ok) {
        throw new Error(t({ ar: "تعذّر حفظ الصورة", en: "Couldn't save the image" }));
      }
      const { user: updatedUser } = (await patchRes.json()) as { user: AuthUser };
      setUser(updatedUser);
    } catch (err) {
      setAvatarError(
        err instanceof Error
          ? err.message
          : t({ ar: "تعذّر رفع الصورة", en: "Couldn't upload the image" }),
      );
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function handleAvatarDelete() {
    if (avatarDeleting || avatarUploading) return;
    setAvatarError(null);
    setAvatarDeleting(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: null }),
      });
      if (!res.ok) {
        throw new Error(t({ ar: "تعذّر حذف الصورة", en: "Couldn't delete the image" }));
      }
      const { user: updatedUser } = (await res.json()) as { user: AuthUser };
      setUser(updatedUser);
    } catch (err) {
      setAvatarError(
        err instanceof Error
          ? err.message
          : t({ ar: "تعذّر حذف الصورة", en: "Couldn't delete the image" }),
      );
    } finally {
      setAvatarDeleting(false);
    }
  }

  useEffect(() => {
    setForm({
      fullName: user.fullName,
      bio: user.bio || "",
      jobTitle: user.jobTitle || "",
      phone: user.phone || "",
      skills: user.skills || "",
      portfolioUrl: user.portfolioUrl || "",
      linkedinUrl: user.linkedinUrl || "",
      behanceUrl: user.behanceUrl || "",
      githubUrl: user.githubUrl || "",
      otherLinks: (user.otherLinks ?? []) as ExtraLink[],
    });
  }, [user]);

  function addOtherLink() {
    setForm((s) =>
      s.otherLinks.length >= 8
        ? s
        : { ...s, otherLinks: [...s.otherLinks, { label: "", url: "" }] },
    );
  }
  function updateOtherLink(idx: number, patch: Partial<ExtraLink>) {
    setForm((s) => ({
      ...s,
      otherLinks: s.otherLinks.map((l, i) => (i === idx ? { ...l, ...patch } : l)),
    }));
  }
  function removeOtherLink(idx: number) {
    setForm((s) => ({
      ...s,
      otherLinks: s.otherLinks.filter((_, i) => i !== idx),
    }));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setIssues({});
    setSubmitting(true);
    try {
      const r = await api<{ user: AuthUser }>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setUser(r.user);
      setEditing(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2400);
    } catch (e) {
      if (e instanceof ApiError && e.data && typeof e.data === "object") {
        const d = e.data as {
          error?: string;
          issues?: Array<{ path: string; message: string }>;
        };
        setError(d.error || t({ ar: "تعذّر الحفظ", en: "Couldn't save" }));
        if (Array.isArray(d.issues)) {
          const m: Record<string, string> = {};
          for (const i of d.issues) m[i.path] = i.message;
          setIssues(m);
        }
      } else {
        setError(t({ ar: "تعذّر الاتّصال بالخادم", en: "Couldn't reach the server" }));
      }
      setTimeout(() => errRef.current?.focus(), 50);
    } finally {
      setSubmitting(false);
    }
  }

  const initials = user.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("");

  const skillList = (user.skills || "")
    .split(/[,،]/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div
      dir={dir}
      className="relative min-h-screen overflow-hidden bg-[#0A0E1A] text-white"
      style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
    >
      <AuthBackgroundAura />

      <header className="relative z-20 px-5 sm:px-8 lg:px-14 pt-6 sm:pt-8">
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-4">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-[12px] tracking-[0.18em] uppercase text-white/55 hover:text-white transition-colors font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 ltr:rotate-180" />
            {t({ ar: "الرئيسيّة", en: "Home" })}
          </Link>
          <div className="flex items-center gap-2.5">
            <HavenMark size={32} strokeColor="hsl(354 80% 60%)" />
            <div className="leading-tight text-end">
              <div className="text-[13px] font-bold tracking-tight">Island Haven</div>
              <div className="text-[10px] text-white/45 tracking-[0.16em] uppercase">{t({ ar: "آيلاند هيفن", en: "Island Haven" })}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 px-5 sm:px-8 lg:px-14 pt-10 sm:pt-12 pb-16">
        <div className="mx-auto max-w-3xl">
          {user.role === "expert" && <ExpertDashboardLink />}
          <MyVentures />
          <MyMentorshipSessions />
          {/* Identity card */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-[28px] p-6 sm:p-8 bg-white/[0.045] border border-white/10 backdrop-blur-2xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] overflow-hidden mb-6"
          >
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none opacity-60"
              style={{
                background:
                  "radial-gradient(80% 40% at 50% 0%, rgba(220,38,55,0.18) 0%, transparent 60%)",
              }}
            />
            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-7 text-center sm:text-right">
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => !avatarUploading && avatarInputRef.current?.click()}
                  className="group relative w-24 h-24 rounded-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  title={t({ ar: "تغيير الصورة الشخصيّة", en: "Change profile photo" })}
                  aria-label={t({ ar: "تغيير الصورة الشخصيّة", en: "Change profile photo" })}
                  disabled={avatarUploading}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/40 flex items-center justify-center text-[28px] font-bold text-white shadow-[0_10px_40px_-12px_rgba(220,38,55,0.55)]">
                      {initials || <UserIcon className="w-10 h-10" />}
                    </div>
                  )}
                  <div className={`absolute inset-0 flex items-center justify-center rounded-full transition-opacity ${avatarUploading ? "bg-black/60 opacity-100" : "bg-black/0 group-hover:bg-black/45 opacity-0 group-hover:opacity-100"}`}>
                    {avatarUploading ? (
                      <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white drop-shadow" />
                    )}
                  </div>
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handleAvatarChange}
                  data-testid="input-avatar-file"
                />
                <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#0A0E1A] border border-primary/40 text-primary text-[9.5px] tracking-[0.18em] uppercase font-bold">
                  {lang === "ar" ? ROLE_LABELS[user.role] : ROLE_LABELS_EN[user.role]}
                </div>
                {user.avatarUrl && (
                  <div className="absolute -bottom-1 -left-1">
                    <button
                      type="button"
                      onClick={() => !avatarDeleting && !avatarUploading && setAvatarDeleteConfirm(true)}
                      disabled={avatarDeleting || avatarUploading}
                      className="w-6 h-6 rounded-full bg-[#0A0E1A] border border-red-500/40 text-red-400 hover:bg-red-500/15 hover:border-red-400 transition-colors flex items-center justify-center disabled:opacity-50"
                      title={t({ ar: "حذف الصورة الشخصيّة", en: "Delete profile photo" })}
                      aria-label={t({ ar: "حذف الصورة الشخصيّة", en: "Delete profile photo" })}
                      data-testid="button-delete-avatar"
                    >
                      {avatarDeleting ? (
                        <span className="w-3 h-3 rounded-full border border-red-400/40 border-t-red-400 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                    <AnimatePresence>
                      {avatarDeleteConfirm && (
                        <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setAvatarDeleteConfirm(false)}
                          aria-hidden
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-8 left-0 z-30 w-max rounded-2xl bg-[#13172A] border border-white/12 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.7)] p-3 flex flex-col gap-2.5"
                          dir={dir}
                        >
                          <p className="text-white text-[12.5px] font-semibold whitespace-nowrap">{t({ ar: "حذف الصورة؟", en: "Delete photo?" })}</p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setAvatarDeleteConfirm(false);
                                handleAvatarDelete();
                              }}
                              className="px-3 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-[11.5px] font-semibold hover:bg-red-500/30 transition-colors"
                              data-testid="button-delete-avatar-confirm"
                            >
                              {t({ ar: "حذف", en: "Delete" })}
                            </button>
                            <button
                              type="button"
                              onClick={() => setAvatarDeleteConfirm(false)}
                              className="px-3 py-1 rounded-lg bg-white/[0.06] border border-white/12 text-white/65 text-[11.5px] font-semibold hover:bg-white/[0.1] transition-colors"
                              data-testid="button-delete-avatar-cancel"
                            >
                              {t({ ar: "إلغاء", en: "Cancel" })}
                            </button>
                          </div>
                        </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-1.5">
                  {t({ ar: "ملفّي الشخصيّ", en: "My Profile" })}
                </div>
                <h1
                  className="font-bold text-white leading-tight mb-1.5"
                  style={{ fontSize: "clamp(1.7rem, 4.5vw, 2.2rem)" }}
                >
                  {user.fullName}
                </h1>
                <div className="text-white/55 text-[13px] truncate" dir="ltr">
                  {user.email}
                </div>
              </div>
              <div className="flex sm:flex-col gap-2 shrink-0">
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-md text-white font-semibold text-[12.5px] hover:bg-white/[0.1] transition-colors"
                    data-testid="button-edit"
                  >
                    <PenLine className="w-3.5 h-3.5" />
                    {t({ ar: "تعديل", en: "Edit" })}
                  </button>
                )}
                <button
                  onClick={async () => {
                    await logout();
                    navigate("/");
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 text-white/65 font-semibold text-[12.5px] hover:bg-red-500/15 hover:text-red-200 hover:border-red-500/30 transition-colors"
                  data-testid="button-logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t({ ar: "خروج", en: "Log out" })}
                </button>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {avatarError && (
              <motion.div
                key="avatar-err"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-5 rounded-2xl px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-200 text-[13px] flex items-center gap-2"
                role="alert"
              >
                {avatarError}
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {savedFlash && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-5 rounded-2xl px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-[13px] flex items-center gap-2"
                role="status"
              >
                <CheckCircle2 className="w-4 h-4" />
                {t({ ar: "تمّ حفظ التغييرات", en: "Changes saved" })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Body */}
          {editing ? (
            <motion.form
              onSubmit={onSave}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              noValidate
              className="relative rounded-[28px] p-6 sm:p-8 bg-white/[0.045] border border-white/10 backdrop-blur-2xl space-y-5"
            >
              <SectionHeader index="01" title={t({ ar: "معلوماتي", en: "Identity" })} sub={t({ ar: "Identity", en: "Profile" })} />
              <EditField
                id="fullName"
                label={t({ ar: "الاسم الكامل", en: "Full name" })}
                hint={t({ ar: "Full name", en: "Name" })}
                icon={UserIcon}
                value={form.fullName}
                onChange={(v) => setForm((s) => ({ ...s, fullName: v }))}
                error={issues.fullName}
              />
              <EditField
                id="jobTitle"
                label={t({ ar: "المسمّى الوظيفيّ", en: "Job title" })}
                hint={t({ ar: "Job title", en: "Role" })}
                icon={Briefcase}
                value={form.jobTitle}
                onChange={(v) => setForm((s) => ({ ...s, jobTitle: v }))}
                placeholder={t({ ar: "مثال: مصمّم منتجات، مطوّر واجهات", en: "e.g. Product designer, frontend developer" })}
                error={issues.jobTitle}
              />
              <EditField
                id="phone"
                label={t({ ar: "رقم الواتساب", en: "WhatsApp number" })}
                hint={t({ ar: "WhatsApp", en: "WhatsApp" })}
                icon={Phone}
                value={form.phone}
                onChange={(v) => setForm((s) => ({ ...s, phone: v }))}
                placeholder="+970 …"
                ltr
                error={issues.phone}
              />

              <div className="pt-2">
                <SectionHeader index="02" title={t({ ar: "عملي", en: "Work" })} sub={t({ ar: "Work", en: "Portfolio" })} />
              </div>
              <EditField
                id="skills"
                label={t({ ar: "مهاراتك", en: "Your skills" })}
                hint={t({ ar: "Skills", en: "Skills" })}
                icon={Wrench}
                value={form.skills}
                onChange={(v) => setForm((s) => ({ ...s, skills: v }))}
                placeholder={t({ ar: "مثال: تصميم واجهات، React، تسويق رقميّ", en: "e.g. UI design, React, digital marketing" })}
                error={issues.skills}
              />
              <EditField
                id="portfolioUrl"
                label={t({ ar: "رابط أعمالك", en: "Portfolio link" })}
                hint={t({ ar: "Portfolio URL", en: "Portfolio" })}
                icon={Globe}
                value={form.portfolioUrl}
                onChange={(v) => setForm((s) => ({ ...s, portfolioUrl: v }))}
                placeholder="https://…"
                ltr
                error={issues.portfolioUrl}
              />
              <EditField
                id="linkedinUrl"
                label={t({ ar: "حساب لينكدإن", en: "LinkedIn profile" })}
                hint={t({ ar: "LinkedIn", en: "LinkedIn" })}
                icon={Linkedin}
                value={form.linkedinUrl}
                onChange={(v) => setForm((s) => ({ ...s, linkedinUrl: v }))}
                placeholder="https://www.linkedin.com/in/…"
                ltr
                error={issues.linkedinUrl}
              />
              <EditField
                id="behanceUrl"
                label={t({ ar: "حساب بيهانس", en: "Behance profile" })}
                hint={t({ ar: "Behance", en: "Behance" })}
                icon={Globe}
                value={form.behanceUrl}
                onChange={(v) => setForm((s) => ({ ...s, behanceUrl: v }))}
                placeholder="https://www.behance.net/…"
                ltr
                error={issues.behanceUrl}
              />
              <EditField
                id="githubUrl"
                label={t({ ar: "حساب جيت‌هَب", en: "GitHub profile" })}
                hint={t({ ar: "GitHub", en: "GitHub" })}
                icon={Github}
                value={form.githubUrl}
                onChange={(v) => setForm((s) => ({ ...s, githubUrl: v }))}
                placeholder="https://github.com/…"
                ltr
                error={issues.githubUrl}
              />

              <FieldShell
                id="otherLinks"
                label={t({ ar: "روابط إضافيّة", en: "Other links" })}
                hint={t({ ar: "Other links", en: "Links" })}
                icon={Link2}
                error={issues.otherLinks}
              >
                <div className="space-y-2">
                  {form.otherLinks.length === 0 && (
                    <p className="text-white/55 text-[12.5px] italic px-1">
                      {t({
                        ar: "أضف روابط مثل اليوتيوب، Dribbble، أو موقعك الخاصّ.",
                        en: "Add links such as YouTube, Dribbble, or your own website.",
                      })}
                    </p>
                  )}
                  {form.otherLinks.map((l, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_2fr_auto] gap-2 items-center"
                    >
                      <input
                        value={l.label}
                        onChange={(e) =>
                          updateOtherLink(i, { label: e.target.value })
                        }
                        placeholder={t({ ar: "العنوان", en: "Label" })}
                        maxLength={60}
                        className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-white text-[13px] outline-none focus:border-primary/40"
                        data-testid={`input-other-link-label-${i}`}
                      />
                      <input
                        value={l.url}
                        dir="ltr"
                        onChange={(e) =>
                          updateOtherLink(i, { url: e.target.value })
                        }
                        placeholder="https://…"
                        maxLength={400}
                        className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-white text-[13px] outline-none focus:border-primary/40"
                        data-testid={`input-other-link-url-${i}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeOtherLink(i)}
                        className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 text-white/55 hover:text-red-200 hover:border-red-500/30 hover:bg-red-500/10 flex items-center justify-center transition-colors"
                        aria-label={t({ ar: "حذف", en: "Remove" })}
                        data-testid={`button-remove-other-link-${i}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {form.otherLinks.length < 8 && (
                    <button
                      type="button"
                      onClick={addOtherLink}
                      className="w-full py-2 rounded-xl border border-dashed border-white/15 text-white/55 text-[12.5px] font-semibold hover:text-white hover:border-primary/40 hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
                      data-testid="button-add-other-link"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t({ ar: "إضافة رابط", en: "Add a link" })}
                    </button>
                  )}
                </div>
              </FieldShell>

              <div className="pt-2">
                <SectionHeader index="03" title={t({ ar: "نبذتك", en: "About" })} sub={t({ ar: "About", en: "Bio" })} />
                <FieldShell
                  id="bio"
                  label={t({ ar: "نبذة قصيرة عنك", en: "A short bio" })}
                  hint={t({ ar: "Bio", en: "Bio" })}
                  icon={Sparkles}
                  error={issues.bio}
                >
                  <textarea
                    id="bio"
                    rows={5}
                    maxLength={2000}
                    value={form.bio}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, bio: e.target.value }))
                    }
                    placeholder={t({ ar: "ماذا تعمل؟ ما الذي تنوي تحقيقه؟", en: "What do you do? What are you working toward?" })}
                    className="block w-full bg-transparent text-white placeholder-white/50 text-[14.5px] leading-[1.85] outline-none resize-none px-1 py-0.5"
                    data-testid="input-bio"
                  />
                  <div className="text-[10.5px] text-white/50 mt-1.5 tracking-wide">
                    {form.bio.length}/2000
                  </div>
                </FieldShell>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    ref={errRef}
                    tabIndex={-1}
                    role="alert"
                    aria-live="assertive"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-200 text-[13px]"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 min-w-[160px] py-3.5 rounded-2xl bg-primary text-white font-bold text-[14px] enabled:hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] enabled:hover:-translate-y-px transition-all disabled:opacity-45"
                  data-testid="button-save"
                >
                  {submitting
                    ? t({ ar: "جارٍ الحفظ…", en: "Saving…" })
                    : t({ ar: "حفظ التغييرات", en: "Save changes" })}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setError(null);
                    setIssues({});
                  }}
                  className="px-6 py-3.5 rounded-2xl bg-white/[0.05] border border-white/10 text-white/75 font-semibold text-[14px] hover:bg-white/[0.08] transition-colors"
                  data-testid="button-cancel"
                >
                  {t({ ar: "إلغاء", en: "Cancel" })}
                </button>
              </div>
            </motion.form>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <InfoCard label={t({ ar: "نبذة", en: "About" })} hint={t({ ar: "About", en: "Bio" })} icon={Sparkles}>
                {user.bio ? (
                  <p className="text-white/80 text-[14px] leading-[1.9] whitespace-pre-wrap">
                    {user.bio}
                  </p>
                ) : (
                  <Empty msg={t({ ar: "لم تُضِف نبذة بعد.", en: "No bio added yet." })} />
                )}
              </InfoCard>

              <InfoCard label={t({ ar: "مهاراتك", en: "Skills" })} hint={t({ ar: "Skills", en: "Skills" })} icon={Wrench}>
                {skillList.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {skillList.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[12px] font-semibold"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <Empty msg={t({ ar: "لا توجد مهارات بعد.", en: "No skills added yet." })} />
                )}
              </InfoCard>

              <InfoCard label={t({ ar: "رقم الواتساب", en: "WhatsApp" })} hint={t({ ar: "WhatsApp", en: "WhatsApp" })} icon={Phone}>
                {user.phone ? (
                  <a
                    href={`https://wa.me/${user.phone.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    dir="ltr"
                    className="text-white text-[14px] font-semibold hover:text-primary transition-colors"
                  >
                    {user.phone}
                  </a>
                ) : (
                  <Empty msg={t({ ar: "لم يُضَف بعد.", en: "Not added yet." })} />
                )}
              </InfoCard>

              <InfoCard label={t({ ar: "رابط أعمالك", en: "Portfolio" })} hint={t({ ar: "Portfolio", en: "Portfolio" })} icon={Globe}>
                {user.portfolioUrl ? (
                  <a
                    href={user.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    dir="ltr"
                    className="text-white text-[14px] font-semibold break-all hover:text-primary transition-colors"
                  >
                    {user.portfolioUrl}
                  </a>
                ) : (
                  <Empty msg={t({ ar: "لم يُضَف بعد.", en: "Not added yet." })} />
                )}
              </InfoCard>

              <InfoCard label={t({ ar: "المسمّى الوظيفيّ", en: "Job title" })} hint={t({ ar: "Job title", en: "Role" })} icon={Briefcase}>
                {user.jobTitle ? (
                  <div className="text-white text-[14px] font-semibold">
                    {user.jobTitle}
                  </div>
                ) : (
                  <Empty msg={t({ ar: "لم يُضَف بعد.", en: "Not added yet." })} />
                )}
              </InfoCard>

              <InfoCard label={t({ ar: "حساباتي", en: "Profiles" })} hint={t({ ar: "Profiles", en: "Profiles" })} icon={Link2}>
                {(() => {
                  const all: Array<{ label: string; url: string; Icon: React.ElementType }> = [];
                  if (user.linkedinUrl)
                    all.push({ label: "LinkedIn", url: user.linkedinUrl, Icon: Linkedin });
                  if (user.behanceUrl)
                    all.push({ label: "Behance", url: user.behanceUrl, Icon: Globe });
                  if (user.githubUrl)
                    all.push({ label: "GitHub", url: user.githubUrl, Icon: Github });
                  for (const l of user.otherLinks ?? []) {
                    if (l.url) all.push({ label: l.label || l.url, url: l.url, Icon: Link2 });
                  }
                  if (all.length === 0)
                    return <Empty msg={t({ ar: "أضف روابط حساباتك من زرّ التعديل.", en: "Add your profile links from the Edit button." })} />;
                  return (
                    <div className="flex flex-wrap gap-1.5">
                      {all.map(({ label, url, Icon }) => (
                        <a
                          key={`${label}-${url}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/15 text-white text-[12px] font-semibold hover:bg-white/[0.1] transition-colors"
                        >
                          <Icon className="w-3 h-3" /> {label}
                        </a>
                      ))}
                    </div>
                  );
                })()}
              </InfoCard>
            </div>
          )}

          {!editing && (
            <>
              <ChangePasswordSection />
              <MyStorySection user={user} />
              <ActivitySections userId={user.id} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── My Story Section ────────────────────────────────────────────────────────

interface MyStory {
  id: number;
  quote: string;
  story: string;
  ventureName: string;
  projectUrl: string | null;
  status: "draft" | "published" | "hidden" | "rejected" | "deleted";
  rejectionNote: string | null;
}

function MyStorySection({ user }: { user: AuthUser }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [myStory, setMyStory] = useState<MyStory | null | undefined>(undefined);
  const [form, setForm] = useState({ quote: "", story: "", ventureName: "", projectUrl: "" });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);

  useEffect(() => {
    api<{ story: MyStory | null }>("/me/story")
      .then((r) => {
        setMyStory(r.story);
        if (r.story) {
          setForm({
            quote: r.story.quote,
            story: r.story.story,
            ventureName: r.story.ventureName,
            projectUrl: r.story.projectUrl ?? "",
          });
        } else {
          setForm({ quote: "", story: "", ventureName: "", projectUrl: "" });
        }
      })
      .catch(() => setMyStory(null));
  }, [user.id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.quote.trim().length < 10) {
      setError(t({ ar: "الاقتباس قصير جدًّا (10 أحرف كحدّ أدنى)", en: "The quote is too short (10 characters minimum)" }));
      return;
    }
    setSaving(true);
    try {
      // Use PATCH only for active drafts; deleted stories resubmit via POST
      const isDraftEdit = myStory !== null && myStory !== undefined && myStory.status === "draft";
      const r = await api<{ story: MyStory }>("/me/story", {
        method: isDraftEdit ? "PATCH" : "POST",
        body: JSON.stringify({
          quote: form.quote,
          story: form.story,
          ventureName: form.ventureName,
          projectUrl: form.projectUrl || null,
        }),
      });
      setMyStory(r.story);
      setDone(true);
      setTimeout(() => { setDone(false); setOpen(false); }, 2500);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t({ ar: "تعذّر الإرسال", en: "Couldn't submit" }));
    } finally {
      setSaving(false);
    }
  }

  async function onResubmit() {
    setResubmitting(true);
    setError(null);
    try {
      const r = await api<{ story: MyStory }>("/me/story/resubmit", { method: "POST" });
      setMyStory(r.story);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t({ ar: "تعذّرت إعادة التقديم", en: "Couldn't resubmit" }));
    } finally {
      setResubmitting(false);
    }
  }

  async function onWithdraw() {
    if (!confirmWithdraw) {
      setConfirmWithdraw(true);
      return;
    }
    setWithdrawing(true);
    setError(null);
    try {
      await api("/me/story", { method: "DELETE" });
      setMyStory(null);
      setForm({ quote: "", story: "", ventureName: "", projectUrl: "" });
      setConfirmWithdraw(false);
      setOpen(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t({ ar: "تعذّر سحب القصّة", en: "Couldn't withdraw the story" }));
    } finally {
      setWithdrawing(false);
    }
  }

  const isDeleted = myStory?.status === "deleted";
  const isRejected = myStory?.status === "rejected";
  const isLocked = myStory !== null && myStory !== undefined && myStory.status !== "draft" && !isDeleted && !isRejected;

  const statusLabel: Record<string, string> = {
    draft: t({ ar: "بانتظار المراجعة", en: "Awaiting review" }),
    published: t({ ar: "منشورة", en: "Published" }),
    hidden: t({ ar: "مخفيّة", en: "Hidden" }),
    rejected: t({ ar: "مرفوضة", en: "Not accepted" }),
    deleted: t({ ar: "محذوفة من قِبَل الإدارة", en: "Removed by the team" }),
  };
  const statusColor: Record<string, string> = {
    draft: "text-amber-300",
    published: "text-emerald-400",
    hidden: "text-white/60",
    rejected: "text-rose-400",
    deleted: "text-white/60",
  };

  return (
    <section className="mt-8">
      <div className="rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden">
        <button
          onClick={() => { setOpen(o => !o); setError(null); setDone(false); }}
          className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Quote className="w-4 h-4 text-white/50" />
            <span className="text-[14px] font-semibold text-white">{t({ ar: "قصّتي في الحاضنة", en: "My story at the incubator" })}</span>
            <span className="text-[11px] text-white/55 tracking-widest uppercase">{t({ ar: "My Story", en: "Story" })}</span>
            {myStory !== undefined && myStory !== null && (
              <span className={`text-[11px] font-semibold ${statusColor[myStory.status] ?? "text-white/60"}`}>
                · {statusLabel[myStory.status] ?? myStory.status}
              </span>
            )}
          </div>
          <span className={`text-[11px] font-semibold transition-colors ${open ? "text-primary" : "text-white/60"}`}>
            {open
              ? t({ ar: "إغلاق", en: "Close" })
              : myStory
              ? t({ ar: "تعديل", en: "Edit" })
              : t({ ar: "أضف قصّتك", en: "Add your story" })}
          </span>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 pt-1 border-t border-white/10">
                {myStory === undefined ? (
                  <div className="py-6 text-center text-white/65 text-[13px]">{t({ ar: "جارٍ التحميل…", en: "Loading…" })}</div>
                ) : isRejected ? (
                  <div className="py-4 space-y-3">
                    <div className="rounded-xl px-4 py-3 bg-rose-500/10 border border-rose-500/25 space-y-2">
                      <div className="flex items-center gap-2 text-rose-400 text-[13px] font-semibold">
                        <XCircle className="w-4 h-4 shrink-0" />
                        {t({ ar: "لم تُقبَل قصّتك هذه المرّة", en: "Your story wasn't accepted this time" })}
                      </div>
                      {myStory.rejectionNote ? (
                        <p className="text-[12.5px] text-white/60 leading-relaxed pr-6">
                          {myStory.rejectionNote}
                        </p>
                      ) : (
                        <p className="text-[12.5px] text-white/50 leading-relaxed pr-6">
                          {t({ ar: "يمكنك تعديل قصّتك وإعادة تقديمها للمراجعة.", en: "You can edit your story and resubmit it for review." })}
                        </p>
                      )}
                    </div>
                    {error && (
                      <div className="rounded-xl px-4 py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[13px]">
                        {error}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={onResubmit}
                      disabled={resubmitting}
                      className="w-full h-11 rounded-xl bg-primary text-white font-bold text-[13.5px] disabled:opacity-50 transition-opacity"
                    >
                      {resubmitting
                        ? t({ ar: "جارٍ إعادة التقديم…", en: "Resubmitting…" })
                        : t({ ar: "إعادة تقديم", en: "Resubmit" })}
                    </button>
                  </div>
                ) : isLocked ? (
                  <div className="py-4 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 text-[13px] font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      {t({ ar: "قصّتك منشورة في صفحة قصص النجاح", en: "Your story is live on the Success Stories page" })}
                    </div>
                    <div className="rounded-xl px-4 py-3 bg-white/[0.04] border border-white/10 text-white/65 text-[13px] leading-relaxed">
                      "{myStory.quote}"
                    </div>
                  </div>
                ) : (
                  <form onSubmit={onSubmit} className="pt-3 space-y-4">
                    {done && (
                      <div className="flex items-center gap-2 text-emerald-400 text-[13px] font-semibold py-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {t({ ar: "تمّ إرسال قصّتك بنجاح — ستُراجَع قريبًا وتُنشَر!", en: "Your story was submitted — we'll review it soon and publish it!" })}
                      </div>
                    )}
                    {isDeleted && (
                      <div className="flex items-center gap-2 text-white/55 text-[12px] px-1 py-2 rounded-xl bg-white/[0.04] border border-white/10">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/30 shrink-0" />
                        {t({ ar: "حذفت الإدارة قصّتك السابقة. يمكنك كتابة قصّة جديدة وإرسالها مجدّدًا.", en: "The team removed your previous story. You can write a new one and submit it again." })}
                      </div>
                    )}
                    {myStory !== null && myStory?.status === "draft" && (
                      <div className="flex items-center gap-2 text-amber-300/80 text-[12px] px-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400/70" />
                        {t({ ar: "قصّتك بانتظار مراجعة الإدارة — يمكنك تعديلها حتى ذلك الحين.", en: "Your story is awaiting review — you can keep editing it until then." })}
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[12px] font-semibold text-white/55">
                        {t({ ar: "اقتباسك", en: "Your quote" })} <span className="text-white/45 font-normal">{t({ ar: "Quote · مطلوب", en: "Quote · required" })}</span>
                      </label>
                      <textarea
                        rows={3}
                        maxLength={600}
                        value={form.quote}
                        onChange={e => setForm(f => ({ ...f, quote: e.target.value }))}
                        placeholder={t({ ar: "ما الذي أضافه آيلاند هيفن لمسيرتك؟ شارك تجربتك بإيجاز…", en: "What did Island Haven add to your journey? Share your experience briefly…" })}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.07] border border-white/15 text-white text-[13.5px] leading-[1.85] outline-none focus:border-primary/60 transition-all resize-none placeholder-white/50"
                        required
                      />
                      <div className="text-[10.5px] text-white/50 text-left">{form.quote.length}/600</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[12px] font-semibold text-white/55">
                        {t({ ar: "قصّتك كاملة", en: "Your full story" })} <span className="text-white/45 font-normal">{t({ ar: "Full Story · اختياريّ", en: "Full story · optional" })}</span>
                      </label>
                      <textarea
                        rows={5}
                        maxLength={8000}
                        value={form.story}
                        onChange={e => setForm(f => ({ ...f, story: e.target.value }))}
                        placeholder={t({ ar: "شارك رحلتك بشكل أوسع — ما واجهته، وما تعلّمته، وأين وصلت…", en: "Tell your journey more fully — what you faced, what you learned, and where you are now…" })}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.07] border border-white/15 text-white text-[13.5px] leading-[1.85] outline-none focus:border-primary/60 transition-all resize-none placeholder-white/50"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[12px] font-semibold text-white/55">
                          {t({ ar: "اسم مشروعك", en: "Your project's name" })} <span className="text-white/45 font-normal">{t({ ar: "اختياريّ", en: "optional" })}</span>
                        </label>
                        <input
                          value={form.ventureName}
                          maxLength={200}
                          onChange={e => setForm(f => ({ ...f, ventureName: e.target.value }))}
                          placeholder={t({ ar: "مثال: Tamkeen App", en: "e.g. Tamkeen App" })}
                          className="w-full h-11 px-4 rounded-xl bg-white/[0.07] border border-white/15 text-white text-[13.5px] outline-none focus:border-primary/60 transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[12px] font-semibold text-white/55">
                          {t({ ar: "رابط المشروع", en: "Project link" })} <span className="text-white/45 font-normal">{t({ ar: "اختياريّ", en: "optional" })}</span>
                        </label>
                        <input
                          dir="ltr"
                          value={form.projectUrl}
                          maxLength={800}
                          onChange={e => setForm(f => ({ ...f, projectUrl: e.target.value }))}
                          placeholder="https://…"
                          className="w-full h-11 px-4 rounded-xl bg-white/[0.07] border border-white/15 text-white text-[13.5px] outline-none focus:border-primary/60 transition-all"
                        />
                      </div>
                    </div>
                    {error && (
                      <div className="rounded-xl px-4 py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[13px]">
                        {error}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={saving || withdrawing}
                      className="w-full h-11 rounded-xl bg-primary text-white font-bold text-[13.5px] disabled:opacity-50 transition-opacity"
                    >
                      {saving
                        ? t({ ar: "جارٍ الإرسال…", en: "Submitting…" })
                        : isDeleted
                        ? t({ ar: "شارك قصّتك من جديد", en: "Share your story again" })
                        : myStory
                        ? t({ ar: "تحديث القصّة", en: "Update story" })
                        : t({ ar: "إرسال قصّتي", en: "Submit my story" })}
                    </button>
                    {myStory !== null && !isDeleted && (
                      <button
                        type="button"
                        onClick={onWithdraw}
                        onBlur={() => setConfirmWithdraw(false)}
                        disabled={withdrawing}
                        className={`w-full h-10 rounded-xl border text-[13px] font-semibold transition-all disabled:opacity-50 ${
                          confirmWithdraw
                            ? "border-rose-500/60 bg-rose-500/10 text-rose-300"
                            : "border-white/10 text-white/55 hover:border-white/20 hover:text-white/80"
                        }`}
                      >
                        {withdrawing
                          ? t({ ar: "جارٍ السحب…", en: "Withdrawing…" })
                          : confirmWithdraw
                          ? t({ ar: "تأكيد السحب — ستُحذف القصّة نهائيًّا", en: "Confirm — this permanently deletes the story" })
                          : t({ ar: "سحب القصّة", en: "Withdraw story" })}
                      </button>
                    )}
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ─── Change Password Section ─────────────────────────────────────────────────

function ChangePasswordSection() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.newPassword !== form.confirm) { setError(t({ ar: "كلمتا السرّ غير متطابقتين", en: "The passwords don't match" })); return; }
    if (form.newPassword.length < 8) { setError(t({ ar: "كلمة السرّ الجديدة يجب أن تكون 8 أحرف فأكثر", en: "The new password must be at least 8 characters" })); return; }
    setSaving(true);
    try {
      await api("/auth/me/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      setDone(true);
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      setTimeout(() => { setDone(false); setOpen(false); }, 2500);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t({ ar: "تعذّر تغيير كلمة السرّ", en: "Couldn't change the password" }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-8">
      <div className="rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden">
        <button
          onClick={() => { setOpen(o => !o); setError(null); setDone(false); }}
          className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors"
          data-testid="toggle-change-password"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-white/50" />
            <span className="text-[14px] font-semibold text-white">{t({ ar: "تغيير كلمة السرّ", en: "Change password" })}</span>
            <span className="text-[11px] text-white/55 tracking-widest uppercase">{t({ ar: "Security", en: "Security" })}</span>
          </div>
          <span className={`text-[11px] font-semibold transition-colors ${open ? "text-primary" : "text-white/60"}`}>
            {open ? t({ ar: "إغلاق", en: "Close" }) : t({ ar: "تغيير", en: "Change" })}
          </span>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <form onSubmit={onSubmit} className="px-5 pb-5 pt-1 space-y-3 border-t border-white/10">
                {done && (
                  <div className="flex items-center gap-2 text-emerald-400 text-[13px] font-semibold py-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {t({ ar: "تمّ تغيير كلمة السرّ بنجاح", en: "Password changed successfully" })}
                  </div>
                )}
                {error && (
                  <div className="rounded-xl px-4 py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[13px]">
                    {error}
                  </div>
                )}
                {[
                  { key: "currentPassword" as const, label: t({ ar: "كلمة السرّ الحالية", en: "Current password" }), hint: t({ ar: "Current", en: "Current" }) },
                  { key: "newPassword" as const, label: t({ ar: "كلمة السرّ الجديدة", en: "New password" }), hint: t({ ar: "New (8+ chars)", en: "New (8+ chars)" }) },
                  { key: "confirm" as const, label: t({ ar: "تأكيد كلمة السرّ", en: "Confirm password" }), hint: t({ ar: "Confirm", en: "Confirm" }) },
                ].map(({ key, label, hint }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[12px] font-semibold text-white/55 flex items-center gap-1.5">
                      {label} <span className="text-white/45 font-normal">{hint}</span>
                    </label>
                    <input
                      type="password"
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full h-11 px-4 rounded-xl bg-white/[0.07] border border-white/15 text-white text-[14px] outline-none focus:border-primary/60 transition-all"
                      required
                      autoComplete={key === "currentPassword" ? "current-password" : "new-password"}
                    />
                  </div>
                ))}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-11 rounded-xl bg-primary text-white font-bold text-[13.5px] disabled:opacity-50 transition-opacity mt-1"
                  data-testid="button-change-password"
                >
                  {saving
                    ? t({ ar: "جارٍ الحفظ…", en: "Saving…" })
                    : t({ ar: "حفظ كلمة السرّ الجديدة", en: "Save new password" })}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

interface MyEnrollment {
  course: {
    id: number;
    type: CourseType;
    title: string;
    startsAt: string | null;
    status: CourseStatus;
  };
  enrollment: { status: string; createdAt: string };
}

interface MyWork {
  id: number;
  title: string;
  summary: string;
  coverUrl: string | null;
  createdAt: string;
}

function ActivitySections({ userId }: { userId: number }) {
  const { lang, t } = useLanguage();
  const [tab, setTab] = useState<"courses" | "works">("courses");
  const [enrollments, setEnrollments] = useState<MyEnrollment[] | null>(null);
  const [works, setWorks] = useState<MyWork[] | null>(null);

  useEffect(() => {
    api<{ enrollments: MyEnrollment[] }>("/courses/me/enrollments")
      .then((r) => setEnrollments(r.enrollments))
      .catch(() => setEnrollments([]));
    api<{ works: MyWork[] }>("/works/mine")
      .then((r) => setWorks(r.works))
      .catch(() => setWorks([]));
  }, [userId]);

  return (
    <section className="mt-10">
      <div className="flex items-center gap-1 rounded-full p-1 bg-white/[0.04] border border-white/10 mb-5 w-fit">
        <button
          onClick={() => setTab("courses")}
          className={`px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors flex items-center gap-1.5 ${
            tab === "courses"
              ? "bg-primary/20 text-white border border-primary/40"
              : "text-white/65 hover:text-white"
          }`}
          data-testid="tab-my-courses"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          {t({ ar: "كورساتي", en: "My courses" })}
          {enrollments && (
            <span className="text-[10.5px] text-white/55 tabular-nums">
              {num(enrollments.length, lang)}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("works")}
          className={`px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors flex items-center gap-1.5 ${
            tab === "works"
              ? "bg-primary/20 text-white border border-primary/40"
              : "text-white/65 hover:text-white"
          }`}
          data-testid="tab-my-works"
        >
          <Briefcase className="w-3.5 h-3.5" />
          {t({ ar: "أعمالي", en: "My work" })}
          {works && (
            <span className="text-[10.5px] text-white/55 tabular-nums">
              {num(works.length, lang)}
            </span>
          )}
        </button>
      </div>

      {tab === "courses" ? (
        <CoursesList rows={enrollments} />
      ) : (
        <WorksList rows={works} />
      )}
    </section>
  );
}

function CoursesList({ rows }: { rows: MyEnrollment[] | null }) {
  const { lang, t } = useLanguage();
  if (rows === null) {
    return (
      <div className="h-32 rounded-2xl bg-white/[0.035] border border-white/10 animate-pulse" />
    );
  }
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-8 text-center text-white/55 text-[13.5px]">
        {t({ ar: "لم تنضمّ إلى أيّ كورس أو ورشة بعد.", en: "You haven't joined any course or workshop yet." })}{" "}
        <Link href="/courses" className="text-primary hover:underline">
          {t({ ar: "استعرض المتاح", en: "Browse what's available" })}
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <Link
          key={r.course.id}
          href={`/courses/${r.course.id}`}
          className="block group"
          data-testid={`my-course-${r.course.id}`}
        >
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 hover:border-primary/40 hover:bg-white/[0.06] p-4 transition-colors flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] tracking-[0.16em] uppercase font-bold bg-primary/15 text-primary border border-primary/30">
                  {lang === "ar" ? COURSE_TYPE_LABELS[r.course.type] : COURSE_TYPE_LABELS_EN[r.course.type]}
                </span>
                <span className="text-[10.5px] text-white/45 tracking-wide">
                  {r.enrollment.status === "confirmed"
                    ? t({ ar: "مؤكَّد", en: "Confirmed" })
                    : t({ ar: "بانتظار التأكيد", en: "Pending confirmation" })}
                </span>
              </div>
              <div className="text-white font-semibold text-[14.5px] truncate">
                {r.course.title}
              </div>
              <div className="text-white/45 text-[12px] mt-0.5">
                {r.course.startsAt
                  ? formatDateTime(r.course.startsAt, lang)
                  : lang === "ar"
                  ? COURSE_STATUS_LABELS[r.course.status]
                  : COURSE_STATUS_LABELS_EN[r.course.status]}
              </div>
            </div>
            <ArrowLeft className="w-4 h-4 text-white/45 group-hover:text-primary group-hover:-translate-x-1 transition-all shrink-0 ltr:rotate-180" />
          </div>
        </Link>
      ))}
    </div>
  );
}

function WorksList({ rows }: { rows: MyWork[] | null }) {
  const { t } = useLanguage();
  if (rows === null) {
    return (
      <div className="h-32 rounded-2xl bg-white/[0.035] border border-white/10 animate-pulse" />
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Link
          href="/works/new"
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] hover:bg-primary/5 hover:border-primary/40 hover:text-white text-white/55 py-4 text-[13px] font-semibold transition-colors"
          data-testid="link-add-work"
        >
          <Plus className="w-4 h-4" />
          {t({ ar: "أضف عملًا جديدًا", en: "Add new work" })}
        </Link>
        <Link
          href="/saved"
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white text-white/65 px-4 py-4 text-[13px] font-semibold transition-colors"
          data-testid="link-saved-works"
        >
          <Bookmark className="w-4 h-4" />
          {t({ ar: "المحفوظات", en: "Saved" })}
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-8 text-center text-white/55 text-[13.5px]">
          {t({ ar: "لم تنشر أيّ عمل بعد.", en: "You haven't published any work yet." })}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {rows.map((w) => (
            <Link
              key={w.id}
              href={`/works/${w.id}`}
              className="group rounded-2xl bg-white/[0.04] border border-white/10 hover:border-primary/40 hover:bg-white/[0.06] overflow-hidden transition-colors"
              data-testid={`my-work-${w.id}`}
            >
              {w.coverUrl ? (
                <div className="aspect-[16/9] overflow-hidden bg-black/30">
                  <img
                    src={w.coverUrl}
                    alt={w.title}
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 to-transparent" />
              )}
              <div className="p-4">
                <div className="text-white font-semibold text-[14px] truncate">
                  {w.title}
                </div>
                {w.summary && (
                  <div className="text-white/55 text-[12px] mt-0.5 line-clamp-2">
                    {w.summary}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ index, title, sub }: { index: string; title: string; sub: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-1">
      <div className="text-[10.5px] tracking-[0.22em] text-primary font-bold">{index}</div>
      <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
      <div className="text-[11px] tracking-[0.18em] uppercase text-white/50 font-semibold">
        {title} <span className="text-white/55">· {sub}</span>
      </div>
    </div>
  );
}

function FieldShell({
  id,
  label,
  hint,
  icon: Icon,
  error,
  children,
}: {
  id: string;
  label: string;
  hint: string;
  icon: React.ElementType;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-center justify-between mb-2 text-[11.5px] tracking-[0.06em]"
      >
        <span className="text-white/75 font-semibold">{label}</span>
        <span className="inline-flex items-center gap-1.5 text-white/55">
          <Icon className="w-3 h-3" />
          <span className="text-[10px] tracking-[0.16em] uppercase">{hint}</span>
        </span>
      </label>
      <div
        className={`rounded-2xl px-4 py-3 bg-white/[0.04] border backdrop-blur-md transition-colors focus-within:bg-white/[0.06] ${
          error
            ? "border-red-500/45 focus-within:border-red-500/65"
            : "border-white/10 focus-within:border-primary/45"
        }`}
      >
        {children}
      </div>
      {error && <div className="text-[11.5px] text-red-300 mt-1.5 px-1">{error}</div>}
    </div>
  );
}

function EditField({
  id,
  label,
  hint,
  icon,
  value,
  onChange,
  placeholder,
  error,
  ltr = false,
}: {
  id: string;
  label: string;
  hint: string;
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  ltr?: boolean;
}) {
  return (
    <FieldShell id={id} label={label} hint={hint} icon={icon} error={error}>
      <input
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={ltr ? "ltr" : "auto"}
        className="block w-full bg-transparent text-white placeholder-white/50 text-[14.5px] outline-none px-1 py-0.5"
        data-testid={`input-${id}`}
      />
    </FieldShell>
  );
}

function InfoCard({
  label,
  hint,
  icon: Icon,
  children,
}: {
  label: string;
  hint: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-3xl p-5 bg-white/[0.045] border border-white/10 backdrop-blur-2xl">
      <div className="flex items-center justify-between mb-3 text-[11.5px] tracking-[0.06em]">
        <span className="text-white/75 font-semibold">{label}</span>
        <span className="inline-flex items-center gap-1.5 text-white/55">
          <Icon className="w-3 h-3" />
          <span className="text-[10px] tracking-[0.16em] uppercase">{hint}</span>
        </span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <p className="text-white/55 text-[13px] italic">{msg}</p>;
}

// ─── Expert dashboard shortcut (shown only to experts) ───────────────────────

function ExpertDashboardLink() {
  const { t } = useLanguage();
  return (
    <Link
      href="/expert/dashboard"
      className="group flex items-center justify-between gap-4 rounded-[24px] p-5 mb-6 bg-gradient-to-l from-primary/15 to-primary/[0.04] border border-primary/30 hover:border-primary/50 transition-colors"
    >
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="text-white font-bold text-[14.5px]">{t({ ar: "لوحة الخبير", en: "Expert dashboard" })}</div>
          <div className="text-white/55 text-[12px]">
            {t({ ar: "أدِر ملفّك الإرشاديّ وطلبات الجلسات", en: "Manage your mentor profile and session requests" })}
          </div>
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-primary rtl:rotate-180 transition-transform group-hover:-translate-x-1" />
    </Link>
  );
}

// ─── Ventures the member founded (admin-linked via venture.userId) ───────────

interface MyVenture {
  id: number;
  name: string;
  tagline: string;
  stage: string;
  logoUrl: string | null;
}

const VENTURE_STAGE_AR: Record<string, string> = {
  idea: "فكرة",
  mvp: "نموذج أوّليّ",
  launched: "أُطلِق",
  scaling: "في توسّع",
};

const VENTURE_STAGE_EN: Record<string, string> = {
  idea: "Idea",
  mvp: "MVP",
  launched: "Launched",
  scaling: "Scaling",
};

function MyVentures() {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<MyVenture[] | null>(null);

  useEffect(() => {
    api<{ ventures: MyVenture[] }>("/me/ventures")
      .then((r) => setRows(r.ventures))
      .catch(() => setRows([]));
  }, []);

  if (!rows || rows.length === 0) return null;

  return (
    <div className="rounded-[24px] p-5 sm:p-6 mb-6 bg-white/[0.045] border border-white/10 backdrop-blur-2xl">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="text-white font-bold text-[15px]">{t({ ar: "مشاريعي", en: "My ventures" })}</h2>
        <span className="text-white/60 text-[12px]">({num(rows.length, lang)})</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {rows.map((v) => (
          <Link
            key={v.id}
            href={`/ventures/${v.id}`}
            className="group flex items-center gap-3 rounded-2xl px-4 py-3 bg-white/[0.03] border border-white/[0.06] hover:border-primary/40 transition-colors"
          >
            {v.logoUrl ? (
              <img src={v.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-white/70 font-bold">
                {v.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-white text-[13.5px] font-semibold truncate">{v.name}</div>
              <div className="text-primary/80 text-[11px]">
                {(lang === "ar" ? VENTURE_STAGE_AR[v.stage] : VENTURE_STAGE_EN[v.stage]) ?? v.stage}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white/55 group-hover:text-primary rtl:rotate-180 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── A mentee's own mentorship-session requests ──────────────────────────────

interface MySession {
  session: {
    id: number;
    topic: string;
    mode: SessionMode;
    preferredAt: string | null;
    status: SessionStatus;
    createdAt: string;
  };
  expertName: string;
  expertHeadline: string;
}

function MyMentorshipSessions() {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<MySession[] | null>(null);

  useEffect(() => {
    api<{ sessions: MySession[] }>("/me/sessions")
      .then((r) => setRows(r.sessions))
      .catch(() => setRows([]));
  }, []);

  if (!rows || rows.length === 0) return null;

  const badge: Record<SessionStatus, string> = {
    requested: "bg-amber-400/10 text-amber-200 border-amber-400/30",
    confirmed: "bg-emerald-500/10 text-emerald-200 border-emerald-500/30",
    completed: "bg-primary/15 text-primary border-primary/30",
    declined: "bg-white/[0.05] text-white/50 border-white/10",
    cancelled: "bg-white/[0.05] text-white/50 border-white/10",
  };

  async function cancel(id: number) {
    if (!window.confirm(t({ ar: "إلغاء طلب الجلسة؟", en: "Cancel this session request?" }))) return;
    await api(`/me/sessions/${id}`, { method: "DELETE" });
    setRows((rs) =>
      rs
        ? rs.map((r) =>
            r.session.id === id
              ? { ...r, session: { ...r.session, status: "cancelled" } }
              : r,
          )
        : rs,
    );
  }

  return (
    <div className="rounded-[24px] p-5 sm:p-6 mb-6 bg-white/[0.045] border border-white/10 backdrop-blur-2xl">
      <div className="flex items-center gap-2 mb-4">
        <CalendarCheck className="w-4 h-4 text-primary" />
        <h2 className="text-white font-bold text-[15px]">{t({ ar: "جلسات الإرشاد", en: "Mentorship sessions" })}</h2>
        <span className="text-white/60 text-[12px]">({num(rows.length, lang)})</span>
      </div>
      <div className="space-y-2.5">
        {rows.map((r) => {
          const s = r.session;
          const canCancel = s.status === "requested" || s.status === "confirmed";
          return (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 bg-white/[0.03] border border-white/[0.06]"
            >
              <div className="min-w-0">
                <div className="text-white text-[13.5px] font-semibold truncate">
                  {s.topic}
                </div>
                <div className="text-white/45 text-[11.5px] truncate">
                  {t({ ar: "مع", en: "with" })} {r.expertName} · {lang === "ar" ? SESSION_MODE_LABELS[s.mode] : SESSION_MODE_LABELS_EN[s.mode]}
                  {s.preferredAt
                    ? ` · ${formatDateTime(s.preferredAt, lang)}`
                    : ""}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {s.status === "completed" && (
                  <Link
                    href={`/sessions/${s.id}/rate`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-200 border border-amber-400/30 text-[11px] font-semibold hover:bg-amber-400/15 transition-colors"
                    data-testid={`rate-session-${s.id}`}
                  >
                    <Star className="w-3 h-3" /> {t({ ar: "قيّم الجلسة", en: "Rate session" })}
                  </Link>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] tracking-[0.1em] uppercase font-semibold border ${badge[s.status]}`}
                >
                  {lang === "ar" ? SESSION_STATUS_LABELS[s.status] : SESSION_STATUS_LABELS_EN[s.status]}
                </span>
                {canCancel && (
                  <button
                    onClick={() => cancel(s.id)}
                    className="text-white/55 hover:text-red-300 transition-colors"
                    title={t({ ar: "إلغاء", en: "Cancel" })}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
