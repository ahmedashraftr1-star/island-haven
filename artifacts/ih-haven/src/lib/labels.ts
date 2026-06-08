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

export type TeamRoleGroup = "leadership" | "mentors" | "advisors" | "support";
export const TEAM_ROLE_GROUP_LABELS: Record<TeamRoleGroup, string> = {
  leadership: "القيادة",
  mentors: "المرشدون",
  advisors: "المستشارون",
  support: "الدّعم والتشغيل",
};

export type CohortStatus =
  | "announced"
  | "open"
  | "in_progress"
  | "demo_day"
  | "completed";
export const COHORT_STATUS_LABELS: Record<CohortStatus, string> = {
  announced: "أُعلِنت",
  open: "التقديم مفتوح",
  in_progress: "جارٍ التنفيذ",
  demo_day: "يوم العرض",
  completed: "خُتِمت",
};

export type CohortVentureStatus = "active" | "graduated" | "paused" | "dropped";
export const COHORT_VENTURE_STATUS_LABELS: Record<CohortVentureStatus, string> = {
  active: "نشط",
  graduated: "متخرّج",
  paused: "متوقّف",
  dropped: "منسحب",
};

export type VentureMilestoneType =
  | "idea"
  | "mvp"
  | "launch"
  | "first_customer"
  | "first_revenue"
  | "funding"
  | "team_grew"
  | "press"
  | "partnership"
  | "other";
export const VENTURE_MILESTONE_TYPE_LABELS: Record<VentureMilestoneType, string> = {
  idea: "الفكرة",
  mvp: "MVP / نموذج أوّليّ",
  launch: "إطلاق",
  first_customer: "أوّل عميل",
  first_revenue: "أوّل إيراد",
  funding: "تمويل",
  team_grew: "نموّ الفريق",
  press: "تغطية إعلاميّة",
  partnership: "شراكة",
  other: "حدث",
};

export type SlotStatus = "available" | "booked" | "cancelled";
export const SLOT_STATUS_LABELS: Record<SlotStatus, string> = {
  available: "متاح",
  booked: "محجوز",
  cancelled: "ملغى",
};

export type ResourceCategory =
  | "template"
  | "guide"
  | "tool"
  | "perk"
  | "recording"
  | "legal";
export const RESOURCE_CATEGORY_LABELS: Record<ResourceCategory, string> = {
  template: "قالب",
  guide: "دليل",
  tool: "أداة",
  perk: "حافز / Perk",
  recording: "تسجيل",
  legal: "قانوني",
};

export type ResourceVisibility = "public" | "members" | "admins";
export const RESOURCE_VISIBILITY_LABELS: Record<ResourceVisibility, string> = {
  public: "للجميع",
  members: "للمنتسبين فقط",
  admins: "للإدارة فقط",
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
