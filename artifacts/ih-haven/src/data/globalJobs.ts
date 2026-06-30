// Frontend-only supplementary job listings — international/remote roles plus a few
// extra local ones. The /jobs board is API-driven (server is off-limits), so these are
// merged in client-side to widen the board "to the whole world". Shape matches the
// Jobs page's Job interface exactly. companyLogoUrl is null → the card's initial-avatar
// fallback renders. Real companies link to their real careers pages; internal/illustrative
// ones point to /contact. IDs start at 9001 to avoid colliding with API ids.

export interface GlobalJob {
  id: number;
  title: string;
  companyName: string;
  companyLogoUrl: string | null;
  location: string;
  type: string;
  category: string;
  description: string;
  requirements: string;
  salaryRange: string;
  applyUrl: string;
  featured: boolean;
  createdAt: string;
}

export const GLOBAL_JOBS: GlobalJob[] = [
  // ── International · remote ──
  { id: 9001, title: "مطوّر/ة React أوّل", companyName: "Vercel", companyLogoUrl: null, location: "عن بُعد · الولايات المتّحدة", type: "remote", category: "tech", description: "بناء واجهات عالية الأداء لمنصّة النشر الرائدة، بخبرةٍ عميقة في React وNext.js.", requirements: "", salaryRange: "$4,500–6,000/شهر", applyUrl: "https://vercel.com/careers", featured: true, createdAt: "" },
  { id: 9002, title: "مصمّم/ة UI/UX", companyName: "Shopify", companyLogoUrl: null, location: "عن بُعد · كندا", type: "remote", category: "design", description: "تصميم تجارب تجارةٍ إلكترونيّة يستخدمها ملايين التجّار حول العالم.", requirements: "", salaryRange: "$3,800–5,000/شهر", applyUrl: "https://www.shopify.com/careers", featured: false, createdAt: "" },
  { id: 9003, title: "مهندس/ة تعلّم آلة", companyName: "Hugging Face", companyLogoUrl: null, location: "عن بُعد · فرنسا", type: "remote", category: "data", description: "العمل على نماذج الذكاء الاصطناعيّ مفتوحة المصدر التي تقود الصناعة.", requirements: "", salaryRange: "$5,000–7,000/شهر", applyUrl: "https://apply.workable.com/huggingface", featured: true, createdAt: "" },
  { id: 9004, title: "كاتب/ة محتوى تقنيّ", companyName: "Hashnode", companyLogoUrl: null, location: "عن بُعد · المملكة المتّحدة", type: "remote", category: "marketing", description: "كتابة محتوًى تقنيّ لأكبر منصّة تدوينٍ للمطوّرين.", requirements: "", salaryRange: "$1,500–2,500/شهر", applyUrl: "https://hashnode.com/careers", featured: false, createdAt: "" },
  { id: 9005, title: "مطوّر/ة iOS", companyName: "Careem", companyLogoUrl: null, location: "عن بُعد · الإمارات", type: "remote", category: "tech", description: "تطوير تطبيق iOS لأكبر منصّة تنقّلٍ في المنطقة.", requirements: "", salaryRange: "$3,000–4,500/شهر", applyUrl: "https://careem.com/careers", featured: false, createdAt: "" },
  { id: 9006, title: "مصمّم/ة موشن", companyName: "LottieFiles", companyLogoUrl: null, location: "عن بُعد · ماليزيا", type: "remote", category: "design", description: "إنتاج رسومٍ متحرّكة لأدوات الموشن التي يستخدمها المصمّمون عالميًّا.", requirements: "", salaryRange: "$2,000–3,500/شهر", applyUrl: "https://lottiefiles.com/careers", featured: false, createdAt: "" },
  { id: 9007, title: "محلّل/ة بيانات", companyName: "Airbnb", companyLogoUrl: null, location: "عن بُعد · الولايات المتّحدة", type: "remote", category: "data", description: "تحويل بيانات الحجوزات إلى قراراتٍ تشكّل تجربة الملايين.", requirements: "", salaryRange: "$4,000–5,500/شهر", applyUrl: "https://careers.airbnb.com", featured: false, createdAt: "" },
  { id: 9008, title: "مدير/ة مجتمع", companyName: "Discord", companyLogoUrl: null, location: "عن بُعد · الولايات المتّحدة", type: "remote", category: "marketing", description: "بناء وإدارة مجتمعاتٍ لمنصّة التواصل الأكثر نموًّا.", requirements: "", salaryRange: "$2,500–3,500/شهر", applyUrl: "https://discord.com/careers", featured: false, createdAt: "" },
  { id: 9009, title: "مطوّر/ة backend (Go)", companyName: "Monzo", companyLogoUrl: null, location: "عن بُعد · المملكة المتّحدة", type: "remote", category: "tech", description: "بناء خدماتٍ مصرفيّة موثوقة لأحد أسرع البنوك الرقميّة نموًّا.", requirements: "", salaryRange: "$4,000–5,500/شهر", applyUrl: "https://monzo.com/careers", featured: false, createdAt: "" },
  { id: 9010, title: "مستشار/ة أمن سيبرانيّ", companyName: "Darktrace", companyLogoUrl: null, location: "عن بُعد · المملكة المتّحدة", type: "remote", category: "security", description: "حماية المؤسّسات بالذكاء الاصطناعيّ في كشف التهديدات.", requirements: "", salaryRange: "$3,500–5,000/شهر", applyUrl: "https://darktrace.com/careers", featured: false, createdAt: "" },
  { id: 9011, title: "مترجم/ة تقنيّ/ة", companyName: "Mozilla", companyLogoUrl: null, location: "عن بُعد · الولايات المتّحدة", type: "remote", category: "translation", description: "توطين منتجاتٍ مفتوحة المصدر يستخدمها مئات الملايين.", requirements: "", salaryRange: "$1,200–2,000/شهر", applyUrl: "https://www.mozilla.org/careers", featured: false, createdAt: "" },
  { id: 9012, title: "محاسب/ة دوليّ/ة", companyName: "Remote.com", companyLogoUrl: null, location: "عن بُعد · الولايات المتّحدة", type: "remote", category: "finance", description: "إدارة العمليّات الماليّة لمنصّة التوظيف العالميّ عن بُعد.", requirements: "", salaryRange: "$2,000–3,000/شهر", applyUrl: "https://remote.com/careers", featured: false, createdAt: "" },

  // ── Local · Gaza ──
  { id: 9013, title: "مساعد/ة إداريّ/ة", companyName: "آيلاند هيفن", companyLogoUrl: null, location: "غزّة", type: "full-time", category: "admin", description: "دعم العمليّات اليوميّة للحاضنة والتنسيق بين الفرق.", requirements: "", salaryRange: "$600–800/شهر", applyUrl: "/careers", featured: false, createdAt: "" },
  { id: 9014, title: "منسّق/ة برامج", companyName: "آيلاند هيفن", companyLogoUrl: null, location: "غزّة", type: "full-time", category: "management", description: "تنسيق مسارات الاحتضان والتواصل مع المرشدين والدّاعمين.", requirements: "", salaryRange: "$800–1,000/شهر", applyUrl: "/careers", featured: false, createdAt: "" },
  { id: 9015, title: "مدرّب/ة تقنيّ/ة", companyName: "UNRWA", companyLogoUrl: null, location: "غزّة", type: "full-time", category: "training", description: "تدريب الشباب على المهارات الرقميّة ضمن برامج التشغيل.", requirements: "", salaryRange: "$1,200–1,500/شهر", applyUrl: "https://www.unrwa.org/careers", featured: false, createdAt: "" },
  { id: 9016, title: "مهندس/ة شبكات", companyName: "Gaza Telecom", companyLogoUrl: null, location: "غزّة", type: "full-time", category: "tech", description: "تصميم وصيانة البنية التحتيّة للشبكات في بيئةٍ تحدّيّة.", requirements: "", salaryRange: "$900–1,200/شهر", applyUrl: "", featured: false, createdAt: "" },
];
