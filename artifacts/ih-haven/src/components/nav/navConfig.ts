// Single source of truth for the site's primary navigation. Both the landing
// header and the inner-page shell render THIS list, so the bar never changes
// shape between pages and "الرئيسية" is always present, always first.
//
// Curated to the nine destinations that tell the incubator's story cleanly.
// Supporting pages stay reachable from the footer and in-page cross-links.

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
  { href: "/perks", label: "مزايا الأعضاء", en: "Perks", key: "perks" },
  { href: "/learning", label: "التعلّم", en: "Learning", key: "learning" },
  { href: "/messages", label: "الرسائل", en: "Messages", key: "messages" },
  { href: "/leaderboard", label: "لوحة الشرف", en: "Leaderboard", key: "leaderboard" },
  { href: "/settings/notifications", label: "إعدادات الإشعارات", en: "Notifications", key: "notification-settings" },
  { href: "/stories", label: "قصص النجاح", en: "Stories", key: "stories" },
  { href: "/jobs", label: "الوظائف", en: "Jobs", key: "jobs" },
  { href: "/courses", label: "التّدريب", en: "Training", key: "courses" },
  { href: "/members", label: "المنتسبون", en: "Members", key: "members" },
  { href: "/events", label: "الفعاليّات", en: "Events", key: "events" },
  { href: "/gallery", label: "الصّور", en: "Gallery", key: "gallery" },
  { href: "/numbers", label: "بالأرقام", en: "Numbers", key: "numbers" },
  { href: "/press", label: "المركز الإعلاميّ", en: "Press", key: "press" },
  { href: "/search", label: "البحث", en: "Search", key: "search" },
];

export function isNavActive(loc: string, href: string): boolean {
  if (href === "/") return loc === "/" || loc === "";
  return loc === href || loc.startsWith(href + "/");
}
