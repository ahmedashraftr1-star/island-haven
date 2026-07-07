import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

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

export function useVentures<T = unknown>() {
  return useQuery({
    queryKey: ["ventures"],
    queryFn: () => api<{ ventures: T[] }>("/ventures"),
    ...PUBLIC,
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

export function useDaily<T = unknown>() {
  return useQuery({
    queryKey: ["daily"],
    queryFn: () => api<{ posts: T[] }>("/daily"),
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
