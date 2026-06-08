export type CourseType = "course" | "workshop";
export type CourseStatus = "draft" | "open" | "closed" | "done";
export type DailyType = "tip" | "news" | "quote" | "story";

export const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  course: "كورس",
  workshop: "ورشة",
};

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  draft: "مسوّدة",
  open: "تسجيل مفتوح",
  closed: "مكتمل العدد",
  done: "منتهٍ",
};

export const DAILY_TYPE_LABELS: Record<DailyType, string> = {
  tip: "نصيحة",
  news: "خبر",
  quote: "اقتباس",
  story: "قصّة",
};

export type SessionStatus =
  | "requested"
  | "confirmed"
  | "declined"
  | "completed"
  | "cancelled";
export type SessionMode = "online" | "onsite";

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  requested: "بانتظار الرّد",
  confirmed: "مؤكَّدة",
  declined: "مرفوضة",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

export const SESSION_MODE_LABELS: Record<SessionMode, string> = {
  online: "عن بُعد",
  onsite: "في المساحة",
};

export type ProgramStatus = "draft" | "open" | "in_progress" | "done";
export const PROGRAM_STATUS_LABELS: Record<ProgramStatus, string> = {
  draft: "مسوّدة",
  open: "التقديم مفتوح",
  in_progress: "جارٍ التنفيذ",
  done: "منتهٍ",
};

export type ProgramApplicationStatus =
  | "new"
  | "reviewing"
  | "accepted"
  | "rejected";
export const PROGRAM_APPLICATION_STATUS_LABELS: Record<
  ProgramApplicationStatus,
  string
> = {
  new: "جديد",
  reviewing: "قيد المراجعة",
  accepted: "مقبول",
  rejected: "مرفوض",
};

export type VentureStage = "idea" | "mvp" | "launched" | "scaling";
export const VENTURE_STAGE_LABELS: Record<VentureStage, string> = {
  idea: "فكرة",
  mvp: "نموذج أوّليّ",
  launched: "أُطلِق",
  scaling: "في توسّع",
};

export type PartnerTier = "partner" | "supporter" | "sponsor";
export const PARTNER_TIER_LABELS: Record<PartnerTier, string> = {
  partner: "شريك",
  supporter: "داعم",
  sponsor: "راعٍ",
};

export function formatArabicDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function formatArabicDateTime(iso?: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString("ar-EG", {
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

export function splitTags(s: string | null | undefined): string[] {
  return (s || "")
    .split(/[,،]/)
    .map((p) => p.trim())
    .filter(Boolean);
}
