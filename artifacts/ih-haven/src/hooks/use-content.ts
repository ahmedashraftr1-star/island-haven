import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type ContentMap = Record<string, Record<string, string>>;

export function useContent() {
  return useQuery({
    queryKey: ["public-content"],
    queryFn: () => api<{ content: ContentMap }>("/content"),
    staleTime: 60_000,
  });
}

export function useContentSection<T extends Record<string, string>>(
  section: string,
  fallback: T,
): T {
  const { data } = useContent();
  const override = data?.content[section] as Partial<T> | undefined;
  return { ...fallback, ...(override ?? {}) } as T;
}

/**
 * Resolve a stored image string to a real URL.
 * - http(s):// → as-is
 * - /api/...   → as-is (uploaded asset)
 * - /...       → ${BASE_URL}path
 */
export function imageUrl(value: string | undefined | null): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/api/")) return value;
  if (value.startsWith("/")) return `${import.meta.env.BASE_URL}${value.slice(1)}`;
  return value;
}

/**
 * Responsive `srcset` for our own `/photos/*.webp` stills.
 *
 * The originals are 1350×1800 — roughly 3.5× more pixels than a phone ever
 * paints, so a 390px screen was downloading a 238KB still to show it at 390px.
 * `scripts/` ships a `-640` and a `-960` variant beside each original, and the
 * browser picks by viewport × DPR.
 *
 * Returns `undefined` for anything that is not one of our bundled photos (CMS
 * uploads, remote URLs) so the caller simply renders a plain `src`.
 */
export function photoSrcSet(resolvedUrl: string): string | undefined {
  const m = /^(.*\/photos\/[A-Za-z0-9_]+)\.webp$/.exec(resolvedUrl);
  if (!m) return undefined;
  const stem = m[1];
  return `${stem}-640.webp 640w, ${stem}-960.webp 960w, ${stem}.webp 1350w`;
}
