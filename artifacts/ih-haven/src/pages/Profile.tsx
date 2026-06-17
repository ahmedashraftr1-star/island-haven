import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  LogOut,
  PenLine,
  Phone,
  Plus,
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
} from "lucide-react";
import type { ExtraLink } from "@/lib/auth";
import { AuthBackgroundAura } from "@/components/auth/AuthShell";
import { HavenMark } from "@/components/landing/HavenMark";
import { useAuth, ROLE_LABELS } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";
import {
  COURSE_STATUS_LABELS,
  COURSE_TYPE_LABELS,
  formatArabicDateTime,
  SESSION_STATUS_LABELS,
  SESSION_MODE_LABELS,
  type CourseStatus,
  type CourseType,
  type SessionStatus,
  type SessionMode,
} from "@/lib/labels";

export default function Profile() {
  const { user, loading, logout, setUser } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    document.title = "ملفّي الشخصيّ — آيلاند هيفن";
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div
        dir="rtl"
        className="relative min-h-screen overflow-hidden bg-[#0A0E1A] text-white flex items-center justify-center"
      >
        <AuthBackgroundAura />
        <div className="relative z-10 flex items-center gap-3 text-white/55">
          <span className="inline-block w-5 h-5 rounded-full border-2 border-white/30 border-t-primary animate-spin" />
          جارٍ التحميل…
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
        setError(d.error || "تعذّر الحفظ");
        if (Array.isArray(d.issues)) {
          const m: Record<string, string> = {};
          for (const i of d.issues) m[i.path] = i.message;
          setIssues(m);
        }
      } else {
        setError("تعذّر الاتّصال بالخادم");
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
      dir="rtl"
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
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            الرئيسيّة
          </Link>
          <div className="flex items-center gap-2.5">
            <HavenMark size={32} strokeColor="hsl(354 80% 60%)" />
            <div className="leading-tight text-right">
              <div className="text-[13px] font-bold tracking-tight">Island Haven</div>
              <div className="text-[10px] text-white/45 tracking-[0.16em] uppercase">آيلاند هيفن</div>
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
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/40 flex items-center justify-center text-[28px] font-bold text-white shadow-[0_10px_40px_-12px_rgba(220,38,55,0.55)]">
                  {initials || <UserIcon className="w-10 h-10" />}
                </div>
                <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#0A0E1A] border border-primary/40 text-primary text-[9.5px] tracking-[0.18em] uppercase font-bold">
                  {ROLE_LABELS[user.role]}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-1.5">
                  ملفّي الشخصيّ
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
                    تعديل
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
                  خروج
                </button>
              </div>
            </div>
          </motion.div>

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
                تمّ حفظ التغييرات
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
              <SectionHeader index="01" title="معلوماتي" sub="Identity" />
              <EditField
                id="fullName"
                label="الاسم الكامل"
                hint="Full name"
                icon={UserIcon}
                value={form.fullName}
                onChange={(v) => setForm((s) => ({ ...s, fullName: v }))}
                error={issues.fullName}
              />
              <EditField
                id="jobTitle"
                label="المسمّى الوظيفيّ"
                hint="Job title"
                icon={Briefcase}
                value={form.jobTitle}
                onChange={(v) => setForm((s) => ({ ...s, jobTitle: v }))}
                placeholder="مثال: مصمّم منتجات، مطوّر واجهات"
                error={issues.jobTitle}
              />
              <EditField
                id="phone"
                label="رقم الواتساب"
                hint="WhatsApp"
                icon={Phone}
                value={form.phone}
                onChange={(v) => setForm((s) => ({ ...s, phone: v }))}
                placeholder="+970 …"
                ltr
                error={issues.phone}
              />

              <div className="pt-2">
                <SectionHeader index="02" title="عملي" sub="Work" />
              </div>
              <EditField
                id="skills"
                label="مهاراتك"
                hint="Skills"
                icon={Wrench}
                value={form.skills}
                onChange={(v) => setForm((s) => ({ ...s, skills: v }))}
                placeholder="مثال: تصميم واجهات، React، تسويق رقميّ"
                error={issues.skills}
              />
              <EditField
                id="portfolioUrl"
                label="رابط أعمالك"
                hint="Portfolio URL"
                icon={Globe}
                value={form.portfolioUrl}
                onChange={(v) => setForm((s) => ({ ...s, portfolioUrl: v }))}
                placeholder="https://…"
                ltr
                error={issues.portfolioUrl}
              />
              <EditField
                id="linkedinUrl"
                label="حساب لينكدإن"
                hint="LinkedIn"
                icon={Linkedin}
                value={form.linkedinUrl}
                onChange={(v) => setForm((s) => ({ ...s, linkedinUrl: v }))}
                placeholder="https://www.linkedin.com/in/…"
                ltr
                error={issues.linkedinUrl}
              />
              <EditField
                id="behanceUrl"
                label="حساب بيهانس"
                hint="Behance"
                icon={Globe}
                value={form.behanceUrl}
                onChange={(v) => setForm((s) => ({ ...s, behanceUrl: v }))}
                placeholder="https://www.behance.net/…"
                ltr
                error={issues.behanceUrl}
              />
              <EditField
                id="githubUrl"
                label="حساب جيت‌هَب"
                hint="GitHub"
                icon={Github}
                value={form.githubUrl}
                onChange={(v) => setForm((s) => ({ ...s, githubUrl: v }))}
                placeholder="https://github.com/…"
                ltr
                error={issues.githubUrl}
              />

              <FieldShell
                id="otherLinks"
                label="روابط إضافيّة"
                hint="Other links"
                icon={Link2}
                error={issues.otherLinks}
              >
                <div className="space-y-2">
                  {form.otherLinks.length === 0 && (
                    <p className="text-white/35 text-[12.5px] italic px-1">
                      أضف روابط مثل اليوتيوب، Dribbble، أو موقعك الخاصّ.
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
                        placeholder="العنوان"
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
                        aria-label="حذف"
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
                      إضافة رابط
                    </button>
                  )}
                </div>
              </FieldShell>

              <div className="pt-2">
                <SectionHeader index="03" title="نبذتك" sub="About" />
                <FieldShell
                  id="bio"
                  label="نبذة قصيرة عنك"
                  hint="Bio"
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
                    placeholder="ماذا تعمل؟ ما الذي تنوي تحقيقه؟"
                    className="block w-full bg-transparent text-white placeholder-white/30 text-[14.5px] leading-[1.85] outline-none resize-none px-1 py-0.5"
                    data-testid="input-bio"
                  />
                  <div className="text-[10.5px] text-white/30 mt-1.5 tracking-wide">
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
                  {submitting ? "جارٍ الحفظ…" : "حفظ التغييرات"}
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
                  إلغاء
                </button>
              </div>
            </motion.form>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <InfoCard label="نبذة" hint="About" icon={Sparkles}>
                {user.bio ? (
                  <p className="text-white/80 text-[14px] leading-[1.9] whitespace-pre-wrap">
                    {user.bio}
                  </p>
                ) : (
                  <Empty msg="لم تُضِف نبذة بعد." />
                )}
              </InfoCard>

              <InfoCard label="مهاراتك" hint="Skills" icon={Wrench}>
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
                  <Empty msg="لا توجد مهارات بعد." />
                )}
              </InfoCard>

              <InfoCard label="رقم الواتساب" hint="WhatsApp" icon={Phone}>
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
                  <Empty msg="لم يُضَف بعد." />
                )}
              </InfoCard>

              <InfoCard label="رابط أعمالك" hint="Portfolio" icon={Globe}>
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
                  <Empty msg="لم يُضَف بعد." />
                )}
              </InfoCard>

              <InfoCard label="المسمّى الوظيفيّ" hint="Job title" icon={Briefcase}>
                {user.jobTitle ? (
                  <div className="text-white text-[14px] font-semibold">
                    {user.jobTitle}
                  </div>
                ) : (
                  <Empty msg="لم يُضَف بعد." />
                )}
              </InfoCard>

              <InfoCard label="حساباتي" hint="Profiles" icon={Link2}>
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
                    return <Empty msg="أضف روابط حساباتك من زرّ التعديل." />;
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
              <ActivitySections userId={user.id} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Change Password Section ─────────────────────────────────────────────────

function ChangePasswordSection() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.newPassword !== form.confirm) { setError("كلمتا السرّ غير متطابقتين"); return; }
    if (form.newPassword.length < 8) { setError("كلمة السرّ الجديدة يجب أن تكون 8 أحرف فأكثر"); return; }
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
      setError(e instanceof ApiError ? e.message : "تعذّر تغيير كلمة السرّ");
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
            <span className="text-[14px] font-semibold text-white">تغيير كلمة السرّ</span>
            <span className="text-[11px] text-white/35 tracking-widest uppercase">Security</span>
          </div>
          <span className={`text-[11px] font-semibold transition-colors ${open ? "text-primary" : "text-white/35"}`}>
            {open ? "إغلاق" : "تغيير"}
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
                    تمّ تغيير كلمة السرّ بنجاح
                  </div>
                )}
                {error && (
                  <div className="rounded-xl px-4 py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[13px]">
                    {error}
                  </div>
                )}
                {[
                  { key: "currentPassword" as const, label: "كلمة السرّ الحالية", hint: "Current" },
                  { key: "newPassword" as const, label: "كلمة السرّ الجديدة", hint: "New (8+ chars)" },
                  { key: "confirm" as const, label: "تأكيد كلمة السرّ", hint: "Confirm" },
                ].map(({ key, label, hint }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[12px] font-semibold text-white/55 flex items-center gap-1.5">
                      {label} <span className="text-white/25 font-normal">{hint}</span>
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
                  {saving ? "جارٍ الحفظ…" : "حفظ كلمة السرّ الجديدة"}
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
          كورساتي
          {enrollments && (
            <span className="text-[10.5px] text-white/55 tabular-nums">
              {enrollments.length}
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
          أعمالي
          {works && (
            <span className="text-[10.5px] text-white/55 tabular-nums">
              {works.length}
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
  if (rows === null) {
    return (
      <div className="h-32 rounded-2xl bg-white/[0.035] border border-white/10 animate-pulse" />
    );
  }
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-8 text-center text-white/55 text-[13.5px]">
        لم تنضمّ إلى أيّ كورس أو ورشة بعد.{" "}
        <Link href="/courses" className="text-primary hover:underline">
          استعرض المتاح
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
                  {COURSE_TYPE_LABELS[r.course.type]}
                </span>
                <span className="text-[10.5px] text-white/45 tracking-wide">
                  {r.enrollment.status === "confirmed" ? "مؤكَّد" : "بانتظار التأكيد"}
                </span>
              </div>
              <div className="text-white font-semibold text-[14.5px] truncate">
                {r.course.title}
              </div>
              <div className="text-white/45 text-[12px] mt-0.5">
                {r.course.startsAt
                  ? formatArabicDateTime(r.course.startsAt)
                  : COURSE_STATUS_LABELS[r.course.status]}
              </div>
            </div>
            <ArrowLeft className="w-4 h-4 text-white/45 group-hover:text-primary group-hover:-translate-x-1 transition-all shrink-0" />
          </div>
        </Link>
      ))}
    </div>
  );
}

function WorksList({ rows }: { rows: MyWork[] | null }) {
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
          أضف عملًا جديدًا
        </Link>
        <Link
          href="/saved"
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white text-white/65 px-4 py-4 text-[13px] font-semibold transition-colors"
          data-testid="link-saved-works"
        >
          <Bookmark className="w-4 h-4" />
          المحفوظات
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-8 text-center text-white/55 text-[13.5px]">
          لم تنشر أيّ عمل بعد.
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
        {title} <span className="text-white/30">· {sub}</span>
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
        <span className="inline-flex items-center gap-1.5 text-white/35">
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
        className="block w-full bg-transparent text-white placeholder-white/30 text-[14.5px] outline-none px-1 py-0.5"
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
        <span className="inline-flex items-center gap-1.5 text-white/35">
          <Icon className="w-3 h-3" />
          <span className="text-[10px] tracking-[0.16em] uppercase">{hint}</span>
        </span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <p className="text-white/35 text-[13px] italic">{msg}</p>;
}

// ─── Expert dashboard shortcut (shown only to experts) ───────────────────────

function ExpertDashboardLink() {
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
          <div className="text-white font-bold text-[14.5px]">لوحة الخبير</div>
          <div className="text-white/55 text-[12px]">
            أدِر ملفّك الإرشاديّ وطلبات الجلسات
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

function MyVentures() {
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
        <h2 className="text-white font-bold text-[15px]">مشاريعي</h2>
        <span className="text-white/40 text-[12px]">({rows.length})</span>
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
                {VENTURE_STAGE_AR[v.stage] ?? v.stage}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white/35 group-hover:text-primary rtl:rotate-180 transition-colors" />
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
    if (!window.confirm("إلغاء طلب الجلسة؟")) return;
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
        <h2 className="text-white font-bold text-[15px]">جلسات الإرشاد</h2>
        <span className="text-white/40 text-[12px]">({rows.length})</span>
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
                  مع {r.expertName} · {SESSION_MODE_LABELS[s.mode]}
                  {s.preferredAt
                    ? ` · ${formatArabicDateTime(s.preferredAt)}`
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
                    <Star className="w-3 h-3" /> قيّم الجلسة
                  </Link>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] tracking-[0.1em] uppercase font-semibold border ${badge[s.status]}`}
                >
                  {SESSION_STATUS_LABELS[s.status]}
                </span>
                {canCancel && (
                  <button
                    onClick={() => cancel(s.id)}
                    className="text-white/35 hover:text-red-300 transition-colors"
                    title="إلغاء"
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
