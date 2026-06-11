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
  { href: "/programs", label: "البرامج", en: "Programs", key: "programs" },
  { href: "/cohorts", label: "الدّفعات", en: "Cohorts", key: "cohorts" },
  { href: "/ventures", label: "المشاريع", en: "Ventures", key: "ventures" },
  { href: "/opportunities", label: "الفرص", en: "Opportunities", key: "opportunities" },
  { href: "/experts", label: "الخبراء", en: "Experts", key: "experts" },
  { href: "/resources", label: "الموارد", en: "Resources", key: "resources" },
  { href: "/team", label: "الفريق", en: "Team", key: "team" },
  { href: "/about", label: "من نحن", en: "About", key: "about" },
];

// Secondary destinations — surfaced in the mobile sheet & footer, not the bar.
export const NAV_SECONDARY: NavItem[] = [
  { href: "/courses", label: "التّدريب", en: "Training", key: "courses" },
  { href: "/members", label: "المنتسبون", en: "Members", key: "members" },
  { href: "/events", label: "الفعاليّات", en: "Events", key: "events" },
  { href: "/gallery", label: "الصّور", en: "Gallery", key: "gallery" },
  { href: "/numbers", label: "بالأرقام", en: "Numbers", key: "numbers" },
  { href: "/press", label: "المركز الإعلاميّ", en: "Press", key: "press" },
];

export function isNavActive(loc: string, href: string): boolean {
  if (href === "/") return loc === "/" || loc === "";
  return loc === href || loc.startsWith(href + "/");
}
