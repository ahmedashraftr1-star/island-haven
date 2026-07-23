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
 * The originals are 1350×1800 — far more pixels than most of the boxes we paint
 * them into. The homepage was decoding 64 MEGAPIXELS of image while you scrolled,
 * on the main thread, which is what made it stutter: a 2.4MP still was being loaded
 * to fill a 40px avatar circle (1500× the pixels it needed) and 2.4MP stills were
 * filling 568×320 cards (13×). Decode cost scales with pixels, not with file size,
 * so no amount of compression fixes this — only asking for a smaller image does.
 *
 * There is a variant at each width beside the original, down to 160 (an avatar at
 * 2× DPR). The browser picks using `sizes`, so ALWAYS pass a `sizes` that states
 * the real painted width — without it the browser assumes 100vw and takes the
 * largest file, which is the bug this exists to prevent.
 *
 * Returns `undefined` for anything that is not one of our bundled photos (CMS
 * uploads, remote URLs) so the caller simply renders a plain `src`.
 */
export function photoSrcSet(resolvedUrl: string): string | undefined {
  const m = /^(.*\/photos\/[A-Za-z0-9_]+)\.webp$/.exec(resolvedUrl);
  if (!m) return undefined;
  const stem = m[1];
  return (
    `${stem}-160.webp 160w, ${stem}-320.webp 320w, ${stem}-640.webp 640w, ` +
    `${stem}-960.webp 960w, ${stem}.webp 1350w`
  );
}

/**
 * AVIF `srcset` for the SAME bundled `/photos/*` stills (an `.avif` sits beside
 * every `.webp`, ~35% smaller). Fed to a `<source type="image/avif">` inside a
 * `<picture>`; browsers that support AVIF take it, the rest fall back to the
 * `<img>`'s WebP srcset. Returns undefined for non-bundled images.
 */
export function photoSrcSetAvif(resolvedUrl: string): string | undefined {
  const m = /^(.*\/photos\/[A-Za-z0-9_]+)\.webp$/.exec(resolvedUrl);
  if (!m) return undefined;
  const stem = m[1];
  return (
    `${stem}-160.avif 160w, ${stem}-320.avif 320w, ${stem}-640.avif 640w, ` +
    `${stem}-960.avif 960w, ${stem}.avif 1350w`
  );
}
