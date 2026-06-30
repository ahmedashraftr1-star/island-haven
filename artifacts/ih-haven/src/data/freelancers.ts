// Curated freelancer marketplace data. The app's members/jobs are API-driven, but
// the freelancer showcase is a standalone, frontend-only curated roster — real
// Gazan talent profiles a global client can browse. No server dependency.

export type FreelancerCategory =
  | "dev"
  | "design"
  | "marketing"
  | "data"
  | "translation"
  | "business"
  | "security";

export interface Freelancer {
  id: number;
  name: string;
  title: string;
  category: FreelancerCategory;
  bio: string;
  skills: string[];
  hourlyRate: number; // USD/hour
  completedProjects: number;
  available: boolean;
  rating: number; // 4.0–5.0
  since: number; // year joined
}

/** Bilingual labels for each category — used by the filter tabs + chips. */
export const CATEGORY_LABELS: Record<FreelancerCategory, { ar: string; en: string }> = {
  dev: { ar: "تطوير برمجيّ", en: "Development" },
  design: { ar: "تصميم وإبداع", en: "Design & Creative" },
  marketing: { ar: "تسويق ومحتوى", en: "Marketing & Content" },
  data: { ar: "بيانات وذكاء اصطناعيّ", en: "Data & AI" },
  translation: { ar: "ترجمة ولغة", en: "Translation & Language" },
  business: { ar: "إدارة وأعمال", en: "Business & Ops" },
  security: { ar: "أمن سيبرانيّ", en: "Cybersecurity" },
};

export const FREELANCERS: Freelancer[] = [
  // ── Development ──
  { id: 1, name: "سامي الكحلوت", title: "مطوّر React / Next.js", category: "dev", bio: "يبني واجهات سريعة وقابلة للتوسّع لشركات ناشئة حول العالم، بخبرةٍ عميقة في منظومة React الحديثة.", skills: ["React", "Next.js", "TypeScript", "Tailwind", "Node.js"], hourlyRate: 18, completedProjects: 14, available: true, rating: 4.9, since: 2022 },
  { id: 2, name: "نور الأسطل", title: "مطوّرة تطبيقات Flutter", category: "dev", bio: "تطوّر تطبيقات موبايل متعدّدة المنصّات بتجربةٍ سلسة، من الفكرة إلى المتجر.", skills: ["Flutter", "Dart", "Firebase", "REST APIs"], hourlyRate: 15, completedProjects: 8, available: true, rating: 4.8, since: 2023 },
  { id: 3, name: "أحمد زقّوت", title: "مطوّر Python / Django", category: "dev", bio: "يصمّم خدماتٍ خلفيّة موثوقة وأنظمة معالجة بيانات لشركات SaaS، مع تركيزٍ على الأداء والأمان.", skills: ["Python", "Django", "PostgreSQL", "Docker", "Redis"], hourlyRate: 20, completedProjects: 22, available: false, rating: 5.0, since: 2021 },
  { id: 4, name: "رانيا النجّار", title: "مهندسة DevOps", category: "dev", bio: "تؤتمت البنية التحتيّة وخطوط النشر للفرق التي تتحرّك بسرعة، بخبرةٍ في الحوسبة السحابيّة.", skills: ["AWS", "Kubernetes", "Terraform", "CI/CD", "Linux"], hourlyRate: 25, completedProjects: 11, available: true, rating: 4.9, since: 2022 },
  { id: 5, name: "يوسف البطّيخ", title: "مطوّر WordPress / WooCommerce", category: "dev", bio: "يطلق متاجر ومواقع احترافيّة بسرعة، مع تخصيصٍ كامل وأداءٍ عالٍ.", skills: ["WordPress", "WooCommerce", "PHP", "JavaScript"], hourlyRate: 12, completedProjects: 31, available: true, rating: 4.7, since: 2020 },
  { id: 6, name: "منار شحدة", title: "مطوّرة iOS", category: "dev", bio: "تبني تطبيقات iOS أصيلة بواجهاتٍ أنيقة وتجربةٍ تحترم تفاصيل النظام.", skills: ["Swift", "SwiftUI", "Xcode", "CoreData", "Combine"], hourlyRate: 22, completedProjects: 7, available: false, rating: 4.8, since: 2023 },

  // ── Design ──
  { id: 7, name: "دانا الدّيراوي", title: "مصمّمة UI/UX", category: "design", bio: "تحوّل المشكلات المعقّدة إلى تجارب بسيطة جميلة، من البحث إلى نظام تصميمٍ متكامل.", skills: ["Figma", "UX Research", "Prototyping", "Design Systems"], hourlyRate: 16, completedProjects: 19, available: true, rating: 4.9, since: 2022 },
  { id: 8, name: "خالد الجمل", title: "مصمّم جرافيك وهويّة بصريّة", category: "design", bio: "يصنع هويّاتٍ بصريّة تترك أثرًا، من الشعار إلى نظام العلامة الكامل.", skills: ["Illustrator", "Photoshop", "Branding", "Typography"], hourlyRate: 14, completedProjects: 26, available: true, rating: 4.8, since: 2021 },
  { id: 9, name: "لينا غانم", title: "مصمّمة موشن جرافيك", category: "design", bio: "تُحيي العلامات بالحركة — من الرسوم التوضيحيّة إلى مقاطع المنتج القصيرة.", skills: ["After Effects", "Cinema 4D", "Premiere", "Lottie"], hourlyRate: 18, completedProjects: 12, available: true, rating: 4.9, since: 2022 },
  { id: 10, name: "باسل عوض", title: "مصوّر منتجات", category: "design", bio: "يلتقط منتجاتٍ تبيع نفسها بإضاءةٍ دقيقة ومعالجةٍ احترافيّة.", skills: ["Photography", "Lightroom", "Retouching", "Staging"], hourlyRate: 20, completedProjects: 9, available: false, rating: 4.7, since: 2023 },
  { id: 11, name: "هنا البربري", title: "مصمّمة تجربة مستخدم", category: "design", bio: "تكتب وتصمّم تجارب تُرشد المستخدم بثقة، مدعومةً باختبارات قابليّة الاستخدام.", skills: ["UX Writing", "Wireframing", "Figma", "Usability Testing"], hourlyRate: 15, completedProjects: 16, available: true, rating: 4.8, since: 2022 },

  // ── Marketing ──
  { id: 12, name: "سلسبيل شلح", title: "كاتبة محتوى تسويقيّ", category: "marketing", bio: "تكتب محتوًى يبيع — نصوصٌ مُحسّنة لمحرّكات البحث بالعربيّة والإنجليزيّة.", skills: ["Copywriting", "SEO", "Content Strategy", "Arabic/English"], hourlyRate: 12, completedProjects: 34, available: true, rating: 4.9, since: 2020 },
  { id: 13, name: "عمر الصّفطاوي", title: "مدير إعلانات رقميّة", category: "marketing", bio: "يدير حملاتٍ مدفوعة بعائدٍ مدروس عبر جوجل وميتا، بتحليلٍ مستمرّ.", skills: ["Google Ads", "Meta Ads", "Analytics", "A/B Testing"], hourlyRate: 20, completedProjects: 18, available: true, rating: 4.8, since: 2021 },
  { id: 14, name: "نجلاء رضوان", title: "مديرة وسائل تواصل", category: "marketing", bio: "تبني حضورًا رقميًّا ينمو — محتوًى يوميّ يحوّل المتابعين إلى مجتمع.", skills: ["Social Media", "Canva", "TikTok", "Instagram Reels"], hourlyRate: 10, completedProjects: 27, available: false, rating: 4.6, since: 2022 },

  // ── Data & AI ──
  { id: 15, name: "أنس شعث", title: "مهندس بيانات", category: "data", bio: "يبني خطوط بياناتٍ موثوقة تُغذّي القرار، من المصدر إلى لوحة التحكّم.", skills: ["Python", "SQL", "Airflow", "dbt", "BigQuery"], hourlyRate: 22, completedProjects: 15, available: true, rating: 4.9, since: 2021 },
  { id: 16, name: "ريم القدوة", title: "محلّلة بيانات", category: "data", bio: "تحوّل الأرقام إلى قصصٍ واضحة تُوجّه الأعمال نحو نموٍّ حقيقيّ.", skills: ["Tableau", "Power BI", "Excel", "Python", "SQL"], hourlyRate: 18, completedProjects: 20, available: true, rating: 4.8, since: 2022 },

  // ── Translation ──
  { id: 17, name: "سلمى قدرة", title: "مترجمة ومحرّرة", category: "translation", bio: "تنقل المعنى بدقّة بين العربيّة والإنجليزيّة، مع تدقيقٍ وتوطينٍ احترافيّ.", skills: ["Arabic-English", "Technical Translation", "Localization", "Proofreading"], hourlyRate: 14, completedProjects: 41, available: true, rating: 5.0, since: 2019 },
  { id: 18, name: "تامر سلامة", title: "مترجم قانونيّ وأعمال", category: "translation", bio: "يترجم الوثائق القانونيّة والتجاريّة الحسّاسة بثلاث لغاتٍ وثقةٍ مهنيّة.", skills: ["Legal Translation", "Business Documents", "Arabic-English-French"], hourlyRate: 16, completedProjects: 13, available: false, rating: 4.8, since: 2021 },

  // ── Security ──
  { id: 19, name: "زيد الغول", title: "باحث أمن سيبرانيّ", category: "security", bio: "يكتشف الثغرات قبل المهاجمين — اختبار اختراقٍ وتقاريرٌ عمليّة قابلة للتنفيذ.", skills: ["Penetration Testing", "Python", "Burp Suite", "Linux", "CTF"], hourlyRate: 25, completedProjects: 6, available: true, rating: 4.9, since: 2023 },
  { id: 20, name: "ولاء حمد", title: "مختصّة أمن شبكات", category: "security", bio: "تؤمّن الشبكات وتراقبها بأدواتٍ احترافيّة وخبرةٍ في البنية التحتيّة.", skills: ["Network Security", "Wireshark", "CCNA", "Firewalls"], hourlyRate: 22, completedProjects: 9, available: true, rating: 4.8, since: 2022 },
];
