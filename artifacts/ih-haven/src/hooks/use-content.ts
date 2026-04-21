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
