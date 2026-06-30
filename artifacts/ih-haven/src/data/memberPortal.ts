// Dev mock for the member portal's dashboard-only data. Layered over the real
// /users/:id API (real name/bio/skills/works) so the portal works end-to-end with
// no server changes. Production would serve these from auth-gated api-server routes.
import type { Announcement, WeeklySchedule } from "@/types/member";

/** Dashboard-only (sensitive) fields, keyed by member id. id 88 = محمود دحدوح per spec. */
export interface PortalFields {
  email: string;
  phone: string;
  memberSince: string; // ISO
  membershipType: string;
  deskNumber: string;
  wifiPassword: string;
  accessHours: string;
  remainingDays: number;
  attendanceThisMonth: number;
  totalHoursThisMonth: number;
}

const PORTAL_BY_ID: Record<number, PortalFields> = {
  88: {
    email: "mahmoud@islandhaven.ps",
    phone: "+972-599-123-456",
    memberSince: "2025-09-01",
    membershipType: "مستقلّ دائم",
    deskNumber: "B-07",
    wifiPassword: "IH@2026#Gaza",
    accessHours: "٠٨:٠٠ — ٢٢:٠٠",
    remainingDays: 18,
    attendanceThisMonth: 14,
    totalHoursThisMonth: 98,
  },
};

/** Generic fallback so any member id renders a complete (representative) portal. */
export function portalFieldsFor(id: number, fullName: string): PortalFields {
  if (PORTAL_BY_ID[id]) return PORTAL_BY_ID[id];
  const handle = fullName.trim().split(/\s+/)[0]?.toLowerCase() || "member";
  return {
    email: `${handle}@islandhaven.ps`,
    phone: "+970-59-000-0000",
    memberSince: "2026-01-15",
    membershipType: "عضو مجتمع",
    deskNumber: "—",
    wifiPassword: "IH@2026#Gaza",
    accessHours: "٠٨:٠٠ — ٢٢:٠٠",
    remainingDays: 24,
    attendanceThisMonth: 11,
    totalHoursThisMonth: 72,
  };
}

export const ANNOUNCEMENTS: Announcement[] = [
  { id: 1, title: "تحديث ساعات الدوام", body: "بدءًا من ١ يوليو ساعات الوصول تبدأ من الساعة ٨ صباحًا حتّى ١٠ مساءً.", type: "urgent", date: "2026-06-28", author: "إدارة آيلاند هيفن", pinned: true },
  { id: 2, title: "ورشة React 19 — الخميس القادم", body: "ورشة عمل مجّانيّة لمنتسبي الحاضنة حول أحدث تقنيّات React. السّاعة ٦ مساءً في غرفة الاجتماعات.", type: "event", date: "2026-06-25", author: "فريق البرامج", pinned: false },
  { id: 3, title: "مسابقة معرض الأعمال ٢٠٢٦", body: "ارفع عملك الأفضل قبل نهاية يوليو وفُز بعضويّة مجّانيّة لشهرٍ إضافيّ.", type: "info", date: "2026-06-20", author: "إدارة المجتمع", pinned: true },
  { id: 4, title: "صيانة الإنترنت — الجمعة", body: "سيتوقّف الإنترنت يوم الجمعة من ٢ — ٤ ظهرًا للصيانة الدوريّة.", type: "urgent", date: "2026-06-18", author: "الدعم التقنيّ", pinned: false },
  { id: 5, title: "مرحبًا بالدفعة الجديدة", body: "نرحّب بـ ١٢ منتسبًا جديدًا انضمّوا إلى الحاضنة هذا الأسبوع. تعرّفوا عليهم في صفحة المنتسبين.", type: "info", date: "2026-06-15", author: "إدارة آيلاند هيفن", pinned: false },
  { id: 6, title: "إصدار بطاقات الوصول الجديدة", body: "يرجى مراجعة مكتب الاستقبال هذا الأسبوع للحصول على بطاقة الوصول الذكيّة الجديدة.", type: "info", date: "2026-06-10", author: "الإدارة", pinned: false },
];

export const WEEKLY_SCHEDULE: WeeklySchedule = {
  week: "٢٤ — ٣٠ يونيو ٢٠٢٦",
  days: [
    { day: "الأحد", date: "٢٤", checkin: "٠٩:١٥", checkout: "١٨:٣٠", hours: 9, status: "حاضر" },
    { day: "الاثنين", date: "٢٥", checkin: "٠٨:٤٥", checkout: "٢٠:٠٠", hours: 11, status: "حاضر" },
    { day: "الثلاثاء", date: "٢٦", checkin: null, checkout: null, hours: 0, status: "غائب" },
    { day: "الأربعاء", date: "٢٧", checkin: "١٠:٠٠", checkout: "١٧:٣٠", hours: 7, status: "حاضر" },
    { day: "الخميس", date: "٢٨", checkin: "٠٩:٠٠", checkout: "٢٢:٠٠", hours: 13, status: "حاضر" },
    { day: "الجمعة", date: "٢٩", checkin: null, checkout: null, hours: 0, status: "إجازة" },
    { day: "السبت", date: "٣٠", checkin: "٠٩:٣٠", checkout: null, hours: null, status: "في الحاضنة الآن" },
  ],
  monthlySummary: { present: 14, absent: 2, holiday: 5, totalHours: 98 },
};
