import { NAV_STRUCTURE, MOBILE_LINKS, type NavEntry } from "@/lib/nav";
import { usePageVisibility } from "@/hooks/use-public-data";

/**
 * The site nav with owner-hidden pages removed: hidden mega-items drop out, a
 * mega-category that empties out drops out, a hidden top-level link drops out. The
 * static config in `lib/nav.ts` stays the single source of truth; this only hides.
 * Until visibility loads, the full nav renders (no flicker of vanishing links).
 */
export function useVisibleNav() {
  const { isHidden, loaded } = usePageVisibility();
  if (!loaded) return { nav: NAV_STRUCTURE, mobile: MOBILE_LINKS };

  const ok = (href?: string) => !href || !isHidden(href);

  const nav: NavEntry[] = NAV_STRUCTURE.map((entry) => {
    if (!entry.mega) return entry;
    const mega = entry.mega
      .map((cat) => ({ ...cat, items: cat.items.filter((i) => ok(i.href)) }))
      .filter((cat) => cat.items.length > 0);
    return { ...entry, mega };
  }).filter((entry) => (entry.mega ? entry.mega.length > 0 : ok(entry.href)));

  const mobile = MOBILE_LINKS.filter((l) => ok(l.href));

  return { nav, mobile };
}
