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
