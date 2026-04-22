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
