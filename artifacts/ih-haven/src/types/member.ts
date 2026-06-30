// Member-portal domain types. MemberPrivate extends MemberPublic with the
// dashboard-only sensitive fields. The dashboard-only data (these fields +
// announcements + schedule) is dev mock layered over the real /users/:id API —
// see src/data/memberPortal.ts. Production would back these with api-server routes
// gated by a real auth check (the spec's X-Member-Auth header is dev-only).

export type MemberRole = "freelancer" | "graduate" | "student" | "other" | (string & {});

export interface Work {
  id: number;
  userId?: number;
  title: string;
  summary: string;
  coverUrl?: string | null;
  tags?: string;
  link?: string;
  status?: string; // "featured" | "visible"
}

export interface MemberPublic {
  id: number;
  fullName: string;
  jobTitle: string;
  bio: string;
  role: MemberRole;
  skills: string;
  avatarUrl: string | null;
  githubUrl: string;
  linkedinUrl: string;
  behanceUrl: string;
  portfolioUrl: string;
  worksCount: number;
  followersCount: number;
  followingCount: number;
  createdAt: string;
}

export interface MemberPrivate extends MemberPublic {
  email: string;
  phone: string;
  memberSince: string;
  membershipType: string;
  deskNumber: string;
  wifiPassword: string;
  accessHours: string;
  remainingDays: number;
  attendanceThisMonth: number;
  totalHoursThisMonth: number;
}

export type AnnouncementType = "info" | "urgent" | "event";

export interface Announcement {
  id: number;
  title: string;
  body: string;
  type: AnnouncementType;
  date: string;
  author: string;
  pinned: boolean;
}

export type AttendanceStatus = "حاضر" | "غائب" | "إجازة" | "في الحاضنة الآن";

export interface ScheduleDay {
  day: string;
  date: string;
  checkin: string | null;
  checkout: string | null;
  hours: number | null;
  status: AttendanceStatus;
}

export interface WeeklySchedule {
  week: string;
  days: ScheduleDay[];
  monthlySummary: { present: number; absent: number; holiday: number; totalHours: number };
}
