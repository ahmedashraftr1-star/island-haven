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
  { href: "/programs", label: "مسارات الاحتضان", en: "Programs", key: "programs" },
  { href: "/cohorts", label: "دفعات آيلاند", en: "Cohorts", key: "cohorts" },
  { href: "/ventures", label: "مشاريعنا", en: "Ventures", key: "ventures" },
  { href: "/opportunities", label: "فرص حصريّة", en: "Opportunities", key: "opportunities" },
  { href: "/experts", label: "مرشدونا", en: "Mentors", key: "experts" },
  { href: "/resources", label: "أدوات النجاح", en: "Resources", key: "resources" },
  { href: "/team", label: "فريقنا", en: "Team", key: "team" },
  { href: "/about", label: "رؤيتنا", en: "Vision", key: "about" },
];

// Secondary destinations — surfaced in the mobile sheet & footer, not the bar.
export const NAV_SECONDARY: NavItem[] = [
  { href: "/perks", label: "امتيازات الأعضاء", en: "Perks", key: "perks" },
  { href: "/learning", label: "التعلّم والتطوير", en: "Learning", key: "learning" },
  { href: "/messages", label: "الرسائل", en: "Messages", key: "messages" },
  { href: "/leaderboard", label: "لوحة المتميّزين", en: "Leaderboard", key: "leaderboard" },
  { href: "/settings/notifications", label: "إعدادات الإشعارات", en: "Notifications", key: "notification-settings" },
  { href: "/stories", label: "قصص النجاح", en: "Stories", key: "stories" },
  { href: "/jobs", label: "فرص العمل", en: "Jobs", key: "jobs" },
  { href: "/courses", label: "التّدريب والتّطوير", en: "Training", key: "courses" },
  { href: "/members", label: "مجتمعنا", en: "Members", key: "members" },
  { href: "/events", label: "الفعاليّات", en: "Events", key: "events" },
  { href: "/gallery", label: "معرض الصور", en: "Gallery", key: "gallery" },
  { href: "/numbers", label: "إنجازاتنا بالأرقام", en: "Numbers", key: "numbers" },
  { href: "/press", label: "الغرفة الإعلاميّة", en: "Press", key: "press" },
  { href: "/search", label: "البحث", en: "Search", key: "search" },
];

export function isNavActive(loc: string, href: string): boolean {
  if (href === "/") return loc === "/" || loc === "";
  return loc === href || loc.startsWith(href + "/");
}
