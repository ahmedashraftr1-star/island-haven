// Single source of truth for the site's primary navigation. Both the landing
// header and the inner-page shell render THIS list, so the bar never changes
// shape between pages and "الرئيسية" is always present, always first.
//
// Curated to the eight destinations that tell the incubator's story cleanly.
// Supporting pages (الفعاليّات / الصّور / بالأرقام) stay reachable from the
// footer and in-page cross-links — keeping the top bar uncluttered on purpose.

export interface NavItem {
  href: string;
  label: string; // Arabic, shown in the bar
  en: string; // Latin sub-label (mobile menu)
  key: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "الرئيسيّة", en: "Home", key: "home" },
  { href: "/experts", label: "الخبراء", en: "Experts", key: "experts" },
  { href: "/programs", label: "برامج الاحتضان", en: "Programs", key: "programs" },
  { href: "/ventures", label: "المشاريع", en: "Ventures", key: "ventures" },
  { href: "/courses", label: "التّدريب", en: "Training", key: "courses" },
  { href: "/members", label: "المنتسبون", en: "Members", key: "members" },
  { href: "/works", label: "الأعمال", en: "Works", key: "works" },
  { href: "/about", label: "من نحن", en: "About", key: "about" },
];

// Secondary destinations — surfaced in the mobile sheet & footer, not the bar.
export const NAV_SECONDARY: NavItem[] = [
  { href: "/events", label: "الفعاليّات", en: "Events", key: "events" },
  { href: "/gallery", label: "الصّور", en: "Gallery", key: "gallery" },
  { href: "/numbers", label: "بالأرقام", en: "Numbers", key: "numbers" },
];

export function isNavActive(loc: string, href: string): boolean {
  if (href === "/") return loc === "/" || loc === "";
  return loc === href || loc.startsWith(href + "/");
}
