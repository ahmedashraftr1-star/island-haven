// Mentor expertise tags are stored as free Arabic text on each expert, and the
// /experts category filter is derived from them — so in the English view the tabs
// were reading in Arabic. This is a curated Arabic→English map for the standard
// professional-expertise vocabulary the incubator actually uses. It only affects
// what's DISPLAYED in English; the stored Arabic value is still what filters. Any
// tag not in the map falls back to the original Arabic (honest — the real label,
// never an invented one).
const EXPERTISE_EN: Record<string, string> = {
  "التمويل": "Finance",
  "التنسيق": "Coordination",
  "التوسّع": "Scaling",
  "الشراكات": "Partnerships",
  "العقود": "Contracts",
  "العمليّات": "Operations",
  "القيادة": "Leadership",
  "أبحاث المستخدم": "User Research",
  "أنظمة التصميم": "Design Systems",
  "استراتيجيّات النموّ": "Growth Strategy",
  "استراتيجيّة الأعمال": "Business Strategy",
  "استراتيجيّة المشاريع": "Venture Strategy",
  "الإدارة الماليّة": "Financial Management",
  "الاستثمار الجريء": "Venture Capital",
  "الامتثال القانونيّ": "Legal Compliance",
  "البنية السحابيّة": "Cloud Infrastructure",
  "التسويق الرقميّ": "Digital Marketing",
  "الذكاء الاصطناعيّ": "Artificial Intelligence",
  "الملكيّة الفكريّة": "Intellectual Property",
  "الوصول للأسواق": "Market Access",
  "بناء الشبكات": "Networking",
  "بناء المجتمعات": "Community Building",
  "تأسيس الشركات": "Company Formation",
  "تجربة المستخدم": "User Experience",
  "تحليل البيانات": "Data Analysis",
  "تصميم المنتجات": "Product Design",
  "تطوير الأعمال": "Business Development",
  "تطوير المنتجات": "Product Development",
  "تنظيم البرامج": "Program Management",
  "دعم المنتسبين": "Member Support",
  "ريادة الأعمال": "Entrepreneurship",
  "صناعة المحتوى": "Content Creation",
  "هندسة البرمجيّات": "Software Engineering",
  "العرض على المستثمرين": "Investor Pitching",
};

/** Display label for an expertise tag in the active language. Filtering always uses
 *  the raw (Arabic) tag; this only changes what the reader sees in English. */
export function expertiseLabel(tag: string, lang: string): string {
  return lang === "en" ? (EXPERTISE_EN[tag] ?? tag) : tag;
}
