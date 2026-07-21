import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fetchLatest, fetchChain } from "@/lib/attest-fetch";

/**
 * Shared public-data hooks — the ONE place the homepage (and anywhere else)
 * reads each public endpoint. React Query dedupes by `queryKey`, so no matter
 * how many components call `useNumbers()` in a render, exactly ONE `/numbers`
 * request goes out; the rest read the cache. This kills the duplicate-fetch
 * storm (previously /numbers fired 4× per load) and the 503s it caused.
 *
 * Array hooks are generic over the item type so each caller keeps its own local
 * interface while still sharing the single cached request (the key dedupes, not
 * the type). staleTime keeps the data cached for the session so re-mounts don't
 * refetch. Errors/retries are handled by the global QueryClient policy (skip
 * 4xx, back off ≤2 on 5xx) — components render skeletons on `isLoading` and
 * hide/quietly degrade on `isError` instead of showing a broken empty state.
 */

const FIVE_MIN = 5 * 60_000;
const PUBLIC = { staleTime: FIVE_MIN, gcTime: 10 * 60_000 } as const;

export interface PublicNumbers {
  members: number;
  freelancers: number;
  graduates: number;
  students: number;
  works: number;
  courses: number;
  enrollments: number;
  bookings: number;
  seatsHosted: number;
  applications: number;
  events: number;
}

export function useNumbers() {
  return useQuery({
    queryKey: ["numbers"],
    queryFn: () => api<{ numbers: PublicNumbers }>("/numbers"),
    ...PUBLIC,
  });
}

// ─── Homepage CTA buttons (owner-controlled from the admin panel) ─────────────
export interface CtaButtonConfig {
  labelAr: string;
  labelEn: string;
  href: string;
  visible: boolean;
  registrationOpen: boolean;
  closedTitleAr: string;
  closedTitleEn: string;
  closedBodyAr: string;
  closedBodyEn: string;
}
export const PROMO_VARIANTS = ["gold", "solid", "glass", "gradient"] as const;
export type PromoVariant = (typeof PROMO_VARIANTS)[number];
export interface PromoButtonConfig {
  labelAr: string;
  labelEn: string;
  href: string;
  visible: boolean;
  variant: PromoVariant;
  startAt: string | null;
  endAt: string | null;
}
export interface CtaConfig {
  primary: CtaButtonConfig;
  guest: CtaButtonConfig;
  promo: PromoButtonConfig;
}

// Frontend fallback == the server defaults == the site's current behaviour. Used
// until the query resolves and if the fetch ever fails, so the hero never blanks.
export const DEFAULT_CTA: CtaConfig = {
  primary: {
    labelAr: "قدّم على الحاضنة",
    labelEn: "Apply to Island Haven",
    href: "/apply",
    visible: true,
    registrationOpen: true,
    closedTitleAr: "التسجيل مغلق حاليًّا",
    closedTitleEn: "Registration is currently closed",
    closedBodyAr:
      "سيُفتح التسجيل في الدورة القادمة. تابِعنا لمعرفة المواعيد الرسميّة، وتأكّد من استيفاء شروط الانتساب.",
    closedBodyEn:
      "Registration opens for the next cohort. Follow us for the official dates and make sure you meet the membership requirements.",
  },
  guest: {
    labelAr: "احجز مقعدك",
    labelEn: "Book your seat",
    href: "/book",
    visible: true,
    registrationOpen: true,
    closedTitleAr: "الحجز مغلق حاليًّا",
    closedTitleEn: "Booking is currently closed",
    closedBodyAr: "حجز مقاعد الضيوف مغلق مؤقّتًا. تابِعنا لمعرفة مواعيد إعادة الفتح.",
    closedBodyEn: "Guest seat booking is temporarily closed. Follow us for reopening dates.",
  },
  promo: {
    labelAr: "",
    labelEn: "",
    href: "",
    visible: false,
    variant: "gold",
    startAt: null,
    endAt: null,
  },
};

// A promo button is live only when visible AND (now) is inside its optional
// [startAt, endAt] window. Dates are plain ISO days; missing bound = open-ended.
export function isPromoLive(p: PromoButtonConfig, now = new Date()): boolean {
  if (!p.visible || !(p.labelAr || p.labelEn)) return false;
  if (p.startAt && now < new Date(p.startAt)) return false;
  if (p.endAt) {
    const end = new Date(p.endAt);
    end.setHours(23, 59, 59, 999); // inclusive end-of-day
    if (now > end) return false;
  }
  return true;
}

export function useCta() {
  return useQuery({
    queryKey: ["site-cta"],
    queryFn: () => api<{ cta: CtaConfig }>("/site/cta"),
    ...PUBLIC,
  });
}

// ─── Page visibility (owner hides/shows whole pages from the panel) ───────────
export function usePageVisibility() {
  const q = useQuery({
    queryKey: ["site-pages"],
    queryFn: () => api<{ hidden: string[] }>("/site/pages"),
    ...PUBLIC,
  });
  const hidden = q.data?.hidden ?? [];
  return {
    hidden,
    // Until the first response lands we treat nothing as hidden, so a visible page
    // never flashes an "unavailable" screen while loading.
    loaded: !q.isLoading,
    // Prefix match so hiding "/experts" also hides "/experts/:id".
    isHidden: (path: string) =>
      hidden.some((h) => path === h || path.startsWith(h + "/")),
  };
}

export function useVentures<T = unknown>() {
  return useQuery({
    queryKey: ["ventures"],
    queryFn: () => api<{ ventures: T[] }>("/ventures"),
    ...PUBLIC,
  });
}

// الشرف القابل للتحقّق — the latest signed attestation of the public numbers,
// plus our published public key so the browser can verify it independently.
// Short staleTime: the head can re-seal when the numbers change.
export function useAttestationLatest() {
  return useQuery({
    queryKey: ["attestation", "latest"],
    queryFn: () => fetchLatest(),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

// The recent chain (newest first) for the tamper-evident timeline.
export function useAttestationChain(limit = 50) {
  return useQuery({
    queryKey: ["attestation", "chain", limit],
    queryFn: () => fetchChain(limit),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

export function useStories<T = unknown>() {
  return useQuery({
    queryKey: ["stories"],
    queryFn: () => api<{ stories: T[] }>("/stories"),
    ...PUBLIC,
  });
}

export function useExperts<T = unknown>() {
  return useQuery({
    queryKey: ["experts"],
    queryFn: () => api<{ experts: T[] }>("/experts"),
    ...PUBLIC,
  });
}

/** The public team roster — Experts joins it by name to group each mentor. */
export function useTeam<T = unknown>() {
  return useQuery({
    queryKey: ["team"],
    queryFn: () => api<{ team: T[] }>("/team"),
    ...PUBLIC,
  });
}

/** FeaturedMembers reads the first page; keyed distinctly from other paged reads. */
export function useMembers<T = unknown>() {
  return useQuery({
    queryKey: ["members", "page-1"],
    queryFn: () => api<{ members: T[] }>("/members?page=1"),
    ...PUBLIC,
  });
}

export function useCohorts<T = unknown>() {
  return useQuery({
    queryKey: ["cohorts"],
    queryFn: () => api<{ cohorts: T[] }>("/cohorts"),
    ...PUBLIC,
  });
}

export function useDaily<T = unknown>(opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["daily"],
    queryFn: () => api<{ posts: T[] }>("/daily"),
    enabled: opts?.enabled ?? true,
    ...PUBLIC,
  });
}

export interface AttendanceSummary {
  totalSeats: number;
  assignedCount: number;
  presentCount: number;
}

/**
 * Attendance summary is best-effort: on builds without the route it 404s, and on
 * any error the caller silently falls back (e.g. SeatsBoard → /numbers). `retry:
 * false` guarantees a single request that never storms. Read `data` (undefined
 * until/unless it resolves) and degrade quietly.
 */
export function useAttendanceSummary() {
  return useQuery({
    queryKey: ["attendance-summary"],
    queryFn: () => api<AttendanceSummary>("/attendance/summary"),
    retry: false,
    staleTime: 30_000,
  });
}
