// Single source of truth for the WORLD-CLASS navigation system: the desktop
// mega-menu, the full-screen mobile menu, the command palette, and the footer
// all read from here so the architecture never drifts. Bilingual (ar/en).
//
// Lucide icon names are passed as strings; the rendering components map them to
// components (so this stays a plain data module with no JSX).

export type Bi = { ar: string; en: string };
export type NavBadge = "new" | "soon";

export interface MegaItem {
  icon: string; // lucide-react icon name
  title: Bi;
  desc: Bi;
  href: string;
  badge?: NavBadge;
}

export interface MegaCategory {
  label: Bi;
  items: MegaItem[];
}

export interface NavEntry {
  label: Bi;
  href?: string; // direct link; omit when `mega` is present
  mega?: MegaCategory[];
}

// ── Top bar: Home · Explore (mega) · Investors · Partners ──
export const NAV_STRUCTURE: NavEntry[] = [
  { label: { ar: "الرئيسيّة", en: "Home" }, href: "/" },
  {
    label: { ar: "استكشف", en: "Explore" },
    mega: [
      {
        label: { ar: "للرّوّاد", en: "For Founders" },
        items: [
          { icon: "Layers", title: { ar: "مسارات الاحتضان", en: "Programs" }, desc: { ar: "برامج متخصّصة من ٣ إلى ٦ أشهر", en: "Specialised 3–6 month programs" }, href: "/programs" },
          { icon: "Rocket", title: { ar: "مشاريعنا", en: "Ventures" }, desc: { ar: "محفظة المشاريع المحتضَنة", en: "Our incubated portfolio" }, href: "/ventures" },
          { icon: "CalendarDays", title: { ar: "الفعاليّات", en: "Events" }, desc: { ar: "ورش عمل وجلسات وأيّام عرض", en: "Workshops, talks & demo days" }, href: "/events" },
          { icon: "FileText", title: { ar: "المدوّنة والرّؤى", en: "Blog & Insights" }, desc: { ar: "تقارير واستراتيجيّات من الخبراء", en: "Reports & strategy from experts" }, href: "/blog" },
          { icon: "Briefcase", title: { ar: "لوحة الفرص", en: "Job Board" }, desc: { ar: "وظائف من شركاء محلّيّين ودوليّين", en: "Roles from local & global partners" }, href: "/jobs" },
        ],
      },
      {
        label: { ar: "الشبكة", en: "Network" },
        items: [
          { icon: "Users", title: { ar: "مرشدونا", en: "Experts" }, desc: { ar: "خبراء ومرشدون من كلّ القطاعات", en: "Mentors across every sector" }, href: "/experts" },
          { icon: "Sparkles", title: { ar: "فريلانسر دائم", en: "Freelancers" }, desc: { ar: "وظّف موهبة غزّة لمشروعك", en: "Hire Gaza's talent for your project" }, href: "/freelancers", badge: "new" },
          { icon: "Users", title: { ar: "المنتسبون", en: "Members" }, desc: { ar: "دليل مجتمع آيلاند هيفن", en: "The Island Haven community" }, href: "/members" },
          { icon: "Briefcase", title: { ar: "المستثمرون", en: "Investors" }, desc: { ar: "شركاء استثماريّون ومانحون دوليّون", en: "Investors & international donors" }, href: "/investors" },
          { icon: "Handshake", title: { ar: "الشركاء", en: "Partners" }, desc: { ar: "مؤسّسات وشركات داعمة للنظام", en: "Institutions backing the ecosystem" }, href: "/partners", badge: "new" },
        ],
      },
      {
        label: { ar: "عن آيلاند هيفن", en: "About Us" },
        items: [
          { icon: "Heart", title: { ar: "رؤيتنا وقصّتنا", en: "Our Vision" }, desc: { ar: "من نحن وكيف بدأت الفكرة", en: "Who we are & how it began" }, href: "/about" },
          { icon: "ShieldCheck", title: { ar: "الشرف القابل للتحقّق", en: "Verifiable Honesty" }, desc: { ar: "تحقّق من كلّ رقمٍ بنفسك", en: "Verify every number yourself" }, href: "/verify", badge: "new" },
          { icon: "Users", title: { ar: "الفريق", en: "Our Team" }, desc: { ar: "الوجوه التي تقف خلف الحاضنة", en: "The people behind Island Haven" }, href: "/team" },
          { icon: "Heart", title: { ar: "انضمّ لفريقنا", en: "Join Our Team" }, desc: { ar: "وظائف آيلاند هيفن الدّاخليّة", en: "Island Haven's internal roles" }, href: "/careers", badge: "new" },
          { icon: "Newspaper", title: { ar: "الغرفة الإعلاميّة", en: "Media Kit" }, desc: { ar: "شعارات، صور، وملفّ صحفيّ", en: "Logos, photos & press kit" }, href: "/media" },
          { icon: "Phone", title: { ar: "تواصل معنا", en: "Contact" }, desc: { ar: "نردّ خلال ٢٤ ساعة", en: "We reply within 24 hours" }, href: "/contact" },
        ],
      },
    ],
  },
  { label: { ar: "الوظائف", en: "Jobs" }, href: "/jobs" },
  { label: { ar: "المستثمرون", en: "Investors" }, href: "/investors" },
  { label: { ar: "الشركاء", en: "Partners" }, href: "/partners" },
];

// Flat list of the mobile full-screen menu (big numbered links).
export const MOBILE_LINKS: { label: Bi; href: string }[] = [
  { label: { ar: "مسارات الاحتضان", en: "Programs" }, href: "/programs" },
  { label: { ar: "مشاريعنا", en: "Ventures" }, href: "/ventures" },
  { label: { ar: "مرشدونا", en: "Experts" }, href: "/experts" },
  { label: { ar: "المستثمرون", en: "Investors" }, href: "/investors" },
  { label: { ar: "الشركاء", en: "Partners" }, href: "/partners" },
  { label: { ar: "الفعاليّات", en: "Events" }, href: "/events" },
  { label: { ar: "المدوّنة", en: "Blog" }, href: "/blog" },
  { label: { ar: "رؤيتنا", en: "About" }, href: "/about" },
  { label: { ar: "الشرف القابل للتحقّق", en: "Verifiable Honesty" }, href: "/verify" },
  { label: { ar: "الفريق", en: "Team" }, href: "/team" },
  { label: { ar: "المنتسبون", en: "Members" }, href: "/members" },
  { label: { ar: "فريلانسر دائم", en: "Freelancers" }, href: "/freelancers" },
  { label: { ar: "لوحة الفرص", en: "Jobs" }, href: "/jobs" },
  { label: { ar: "انضمّ لفريقنا", en: "Careers" }, href: "/careers" },
];

export interface FooterCol {
  title: Bi;
  links: { label: Bi; href: string; accent?: boolean }[];
}

export const FOOTER_COLUMNS: FooterCol[] = [
  {
    title: { ar: "للرّوّاد", en: "For Founders" },
    links: [
      { label: { ar: "مسارات الاحتضان", en: "Programs" }, href: "/programs" },
      { label: { ar: "مشاريعنا", en: "Ventures" }, href: "/ventures" },
      { label: { ar: "مرشدونا", en: "Experts" }, href: "/experts" },
      { label: { ar: "سجّل طلبك", en: "Apply" }, href: "/apply", accent: true },
      { label: { ar: "احجز مقعدًا", en: "Book a seat" }, href: "/book" },
    ],
  },
  {
    title: { ar: "المجتمع", en: "Community" },
    links: [
      { label: { ar: "المستثمرون", en: "Investors" }, href: "/investors" },
      { label: { ar: "الشركاء", en: "Partners" }, href: "/partners" },
      { label: { ar: "الفعاليّات", en: "Events" }, href: "/events" },
      { label: { ar: "المدوّنة", en: "Blog" }, href: "/blog" },
      { label: { ar: "تواصل معنا", en: "Contact" }, href: "/contact" },
    ],
  },
  {
    title: { ar: "المؤسّسة", en: "Organization" },
    links: [
      { label: { ar: "رؤيتنا وقصّتنا", en: "Our Vision" }, href: "/about" },
      { label: { ar: "الشرف القابل للتحقّق", en: "Verifiable Honesty" }, href: "/verify" },
      { label: { ar: "الفريق", en: "Team" }, href: "/team" },
      { label: { ar: "الغرفة الإعلاميّة", en: "Media Kit" }, href: "/media" },
      { label: { ar: "سياسة الخصوصيّة", en: "Privacy" }, href: "/privacy" },
      { label: { ar: "شروط الاستخدام", en: "Terms" }, href: "/terms" },
    ],
  },
];
