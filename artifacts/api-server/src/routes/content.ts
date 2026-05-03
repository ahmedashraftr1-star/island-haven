import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, siteSettingsTable } from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { z } from "zod";

const router: IRouter = Router();

/* =============================================================
 * CONTENT SCHEMA
 * Single source of truth for the entire landing page CMS.
 * Every text/image you can edit from the admin panel is below.
 * Field types: "text" | "longtext" | "url" | "image"
 * =========================================================== */

export type FieldType = "text" | "longtext" | "url" | "image";
export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  default: string;
  hint?: string;
}
export interface SectionDef {
  key: string;
  label: string;
  description?: string;
  fields: FieldDef[];
}

const txt = (key: string, label: string, def: string, hint?: string): FieldDef => ({
  key, label, type: "text", default: def, hint,
});
const long = (key: string, label: string, def: string, hint?: string): FieldDef => ({
  key, label, type: "longtext", default: def, hint,
});
const url = (key: string, label: string, def: string, hint?: string): FieldDef => ({
  key, label, type: "url", default: def, hint,
});
const img = (key: string, label: string, def: string, hint?: string): FieldDef => ({
  key, label, type: "image", default: def, hint,
});

export const CONTENT_SCHEMA: SectionDef[] = [
  {
    key: "hero",
    label: "الواجهة الرئيسية (Hero)",
    description: "أوّل ما يراه الزائر — العنوان الكبير والصور المتعاقبة في الخلفيّة.",
    fields: [
      txt("eyebrow", "الكتابة العلوية", "Island Haven · Gaza · Free Workspace"),
      txt("title1", "السطر الأول من العنوان", "مساحةٌ تتّسع لأحلامك،"),
      txt("title2", "السطر الثاني من العنوان (مُلوّن)", "في قلب غزّة."),
      long("subtitle", "النص الفرعي", "بيتٌ مهنيّ يحتضن المستقلّين والخرّيجين وطلبة الجامعات. مكتبٌ، إنترنت، وقهوة — مجّاناً وبكلّ راحة."),
      txt("ctaPrimary", "نص الزر الأساسي", "سجّل للانتساب — مجّاناً"),
      url("ctaPrimaryHref", "رابط الزر الأساسي", "/apply"),
      txt("ctaSecondary", "نص الزر الثانوي", "تحدّث معنا"),
      url("ctaSecondaryHref", "رابط الزر الثانوي (واتساب)", "https://wa.me/970599000000"),
      txt("topRight", "كتابة أعلى يمين الشاشة", "Season · 2026 · open"),
      txt("onAirLabel", "شارة \"On Air\" أعلى يسار الشاشة", "On Air · غزّة"),
      txt("greetingMorning", "تحيّة الصباح (٥–١١)", "صباح الخير"),
      txt("greetingNoon", "تحيّة الظهيرة (١٢–١٦)", "نهارك مُبارك"),
      txt("greetingEvening", "تحيّة المساء (١٧–١٩)", "مساء النّور"),
      txt("greetingNight", "تحيّة الليل (٢٠–٤)", "ليلة هانئة"),
      txt("bookCtaLabel", "زرّ الحجز — التسمية", "احجز مقعدك"),
      txt("scrollLabel", "نصّ مؤشّر التمرير أسفل الشاشة", "Scroll"),
      txt("estLabel", "نص الـ Est تحت الشعار", "Est · 2024"),
      txt("placeLabel", "نص الموقع تحت الشعار", "فلسطين · Gaza"),
      txt("stat1Value", "إحصائية ١ — الرقم", "٣٩"),
      txt("stat1Label", "إحصائية ١ — التسمية", "مقعد"),
      txt("stat2Value", "إحصائية ٢ — الرقم", "٨٠+"),
      txt("stat2Label", "إحصائية ٢ — التسمية", "منتسب"),
      txt("stat3Value", "إحصائية ٣ — الرقم", "١٠٠٪"),
      txt("stat3Label", "إحصائية ٣ — التسمية", "مجّانيّ"),
      img("image1", "صورة الخلفية ١", "/photos/IMG_8357.webp"),
      img("image2", "صورة الخلفية ٢", "/photos/IMG_8347.webp"),
      img("image3", "صورة الخلفية ٣", "/photos/IMG_8358.webp"),
      img("image4", "صورة الخلفية ٤", "/photos/IMG_8341.webp"),
      img("image5", "صورة الخلفية ٥", "/photos/IMG_8352.webp"),
      img("image6", "صورة الخلفية ٦", "/photos/IMG_8300.webp"),
    ],
  },
  {
    key: "about",
    label: "من نحن (About)",
    fields: [
      txt("label", "Eyebrow", "من نحن"),
      txt("titleA", "العنوان — الجزء الأول", "مساحة"),
      txt("titleAccent", "العنوان — الكلمة المُلوّنة", "نجاة"),
      txt("titleB", "العنوان — الجزء الأخير", "مهنيّة، قبل أن تكون مكاناً للعمل."),
      long("body", "نص التعريف", "مبادرة من «من الناس إلى الناس»، نوفّر مساحة عمل مجهّزة بالكهرباء والإنترنت، مفتوحة مجّاناً للمبدعين والمستقلّين والباحثين عن العلم والعمل في غزّة."),
      img("image", "الصورة الجانبية", "/photos/IMG_8347.webp"),
      txt("imageBadge", "شارة على الصورة", "Open · مفتوح"),
      txt("imageEyebrow", "Eyebrow على الصورة", "Inside the Haven · من داخل المساحة"),
      long("imageCaption", "تعليق على الصورة", "ركنٌ من مكاتب آيلاند هيفن المفتوحة للمستقلّين والخرّيجين والطلبة."),
      long("quote", "اقتباس جانبي", "«نعم هو مكان للعمل، لكنّه قبل ذلك مساحة للالتقاء، وللتعلّم، ولبناء الثقة بالنفس وبالطريق.»"),
      txt("quoteAuthor", "صاحب الاقتباس", "— رؤية المؤسّسين"),
      txt("p1Ar", "ركيزة ١ — العنوان عربي", "رؤيتنا"),
      txt("p1En", "ركيزة ١ — العنوان إنجليزي", "Vision"),
      long("p1Body", "ركيزة ١ — النص", "أن نُسهم في بناء مجتمع مهنيّ قادر، يمتلك الأدوات والمهارات التي تمكّنه من الاندماج الفعّال في سوق العمل، وبناء مستقبل مستدام قائم على المعرفة والخبرة والتعاون."),
      txt("p2Ar", "ركيزة ٢ — العنوان عربي", "رسالتنا"),
      txt("p2En", "ركيزة ٢ — العنوان إنجليزي", "Mission"),
      long("p2Body", "ركيزة ٢ — النص", "تمكين الطلاب والخرّيجين والمستقلّين عبر توفير مجتمع داعم، ومساحة عمل آمنة، وبرامج تدريب عمليّة، وفرص تشبيك حقيقيّة، تُقارب الواقع وتستجيب لحاجاته."),
      txt("p3Ar", "ركيزة ٣ — العنوان عربي", "لماذا مجتمع؟"),
      txt("p3En", "ركيزة ٣ — العنوان إنجليزي", "Why community?"),
      long("p3Body", "ركيزة ٣ — النص", "لأنّ العمل الفرديّ في بيئات غير مستقرّة يُرهق أكثر ممّا يُنتج. ولأنّ الكثير من الطاقات الشابّة لديها الرغبة والقدرة، لكنّها تفتقد المكان والدعم والتوجيه."),
    ],
  },
  {
    key: "audience",
    label: "الفئات والمعايير",
    fields: [
      txt("label", "Eyebrow", "الفئات والمعايير"),
      txt("titleA", "العنوان — الجزء الأول", "مَن يجد"),
      txt("titleAccent", "العنوان — كلمة مُلوّنة", "مكانه"),
      txt("titleB", "العنوان — الجزء الأخير", "هنا؟"),
      long("sub", "النص الفرعي", "نوزّع المقاعد على ثلاث فئات رئيسيّة بنسب واضحة، ونعتمد نظام حضور موزّعاً على أيّام وفترات مختلفة، ليستفيد العدد الأكبر دون الإخلال بجودة التجربة."),
      // segment 1
      txt("seg1Ar", "فئة ١ — العنوان عربي", "المستقلّون"),
      txt("seg1En", "فئة ١ — العنوان إنجليزي", "Freelancers"),
      txt("seg1Pct", "فئة ١ — النسبة (رقم)", "40"),
      txt("seg1Tag", "فئة ١ — الوسم", "Independent professionals"),
      img("seg1Image", "فئة ١ — الصورة", "/photos/IMG_8347.webp"),
      txt("seg1C1", "فئة ١ — معيار ١", "ممارسة فعليّة للعمل الحرّ أو المهنيّ."),
      txt("seg1C2", "فئة ١ — معيار ٢", "امتلاك مهارة واضحة وخبرة لا تقلّ عن ٣ سنوات."),
      txt("seg1C3", "فئة ١ — معيار ٣", "الاستعداد للمساهمة في دعم المجتمع عبر المتابعة أو التدريب أو مشاركة الخبرات."),
      // segment 2
      txt("seg2Ar", "فئة ٢ — العنوان عربي", "الخرّيجون"),
      txt("seg2En", "فئة ٢ — العنوان إنجليزي", "Graduates"),
      txt("seg2Pct", "فئة ٢ — النسبة (رقم)", "40"),
      txt("seg2Tag", "فئة ٢ — الوسم", "Recent graduates 2020 — 2025"),
      img("seg2Image", "فئة ٢ — الصورة", "/photos/IMG_8358.webp"),
      txt("seg2C1", "فئة ٢ — معيار ١", "أن يكون التخرّج بين عامَي ٢٠٢٠ و٢٠٢٥."),
      txt("seg2C2", "فئة ٢ — معيار ٢", "امتلاك مهارة، أو السعي الجادّ لتعلّم مهارة مهنيّة أو تقنيّة."),
      txt("seg2C3", "فئة ٢ — معيار ٣", "الاستعداد للتفاعل والعمل ضمن بيئة تعاونيّة."),
      // segment 3
      txt("seg3Ar", "فئة ٣ — العنوان عربي", "الطلبة الجامعيّون"),
      txt("seg3En", "فئة ٣ — العنوان إنجليزي", "Students"),
      txt("seg3Pct", "فئة ٣ — النسبة (رقم)", "20"),
      txt("seg3Tag", "فئة ٣ — الوسم", "Final-year university students"),
      img("seg3Image", "فئة ٣ — الصورة", "/photos/IMG_8341.webp"),
      txt("seg3C1", "فئة ٣ — معيار ١", "أن يكون الطالب في السنة الجامعيّة الأخيرة."),
      txt("seg3C2", "فئة ٣ — معيار ٢", "امتلاك مهارة أو العمل على تطوير مهارة ذات صلة بسوق العمل."),
      txt("seg3C3", "فئة ٣ — معيار ٣ (اختياري)", ""),
    ],
  },
  {
    key: "programs",
    label: "البرامج والفعاليّات",
    fields: [
      txt("label", "Eyebrow", "الفعاليّات والبرامج"),
      txt("titleA", "العنوان — الجزء الأول", "المكان يتنفّس بأهله،"),
      txt("titleAccent", "العنوان — كلمة مُلوّنة", "لا بجدرانه."),
      long("sub", "النص الفرعي", "إلى جانب المساحة المفتوحة يوميّاً، يُنظَّم Island Haven ورشاً تدريبيّة تطبيقيّة ومبادرات داخليّة، بعضها يقوده الفريق، وبعضها يقوده المنتسبون أنفسهم."),
      img("featureImage", "صورة الفعالية الرئيسية", "/photos/IMG_8352.webp"),
      txt("featureBadge", "شارة الصورة", "فعاليّة قادمة"),
      txt("featureEyebrow", "Eyebrow", "Made in Island Haven"),
      txt("featureTitle", "عنوان الفعالية الرئيسية", "صُنع في آيلاند هيفن."),
      long("featureBody", "نص الفعالية الرئيسية", "فعاليّة جديدة نطلقها قريباً، نفتح فيها الباب أمام منتسبي المجتمع لاقتراح ما يريدون أن يصنعوه داخل المساحة. كلّ فكرة تُبنى من أصحابها، وتُنفَّذ معهم — لأنّ المكان يصير أجمل حين يصنعه أهله."),
      txt("chipsLabel", "تسمية المربعات", "نرحّب باقتراحاتكم في"),
      txt("chip1Ar", "مربع ١ — عربي", "مواقع"),
      txt("chip1En", "مربع ١ — إنجليزي", "Sites"),
      txt("chip2Ar", "مربع ٢ — عربي", "أدوات"),
      txt("chip2En", "مربع ٢ — إنجليزي", "Tools"),
      txt("chip3Ar", "مربع ٣ — عربي", "تطويرات"),
      txt("chip3En", "مربع ٣ — إنجليزي", "Upgrades"),
      txt("chip4Ar", "مربع ٤ — عربي", "تحسينات"),
      txt("chip4En", "مربع ٤ — إنجليزي", "Improvements"),
      txt("featureCta", "نص الزر", "شاركنا فكرتك"),
      url("featureCtaHref", "رابط الزر", "https://www.instagram.com/ih_haven"),
      txt("sec1Ar", "بطاقة ١ — العنوان عربي", "ورش تدريبيّة دوريّة"),
      txt("sec1En", "بطاقة ١ — Eyebrow", "Weekly workshops"),
      long("sec1Body", "بطاقة ١ — النص", "برامج عمليّة في مهارات سوق العمل، يقدّمها الفريق ومتطوّعون من المجتمع، مفتوحة للمنتسبين وغير المنتسبين على حدّ سواء."),
      txt("sec2Ar", "بطاقة ٢ — العنوان عربي", "جلسات تشبيك ولقاءات مهنيّة"),
      txt("sec2En", "بطاقة ٢ — Eyebrow", "Networking nights"),
      long("sec2Body", "بطاقة ٢ — النص", "لقاءات شهريّة تجمع المستقلّين والخرّيجين والطلبة لتبادل الخبرات، وعرض مشاريع، وفتح أبواب التعاون بين أعضاء المجتمع."),
    ],
  },
  {
    key: "story",
    label: "قصّتنا (Story)",
    fields: [
      txt("label", "Eyebrow", "قصّتنا"),
      txt("titleA", "العنوان — الجزء الأول", "محاولة"),
      txt("titleAccent", "العنوان — كلمة مُلوّنة", "جادّة"),
      txt("titleB", "العنوان — الجزء الأخير", "لبناء شيءٍ مستدام في مكانٍ يفتقر إلى الاستقرار."),
      txt("chapter", "اسم الفصل", "الفصل الأوّل · المنشأ"),
      long("lead", "الجملة الافتتاحية الكبيرة", "وُلد Island Haven من إيمانٍ بأنّ الاستثمار الحقيقيّ هو في الإنسان قبل أيّ شيء آخر."),
      long("p1", "فقرة ١", "في غزّة، فقد كثيرون مساحاتهم الشخصيّة، وأدواتهم، وبيئة العمل التي اعتادوها — لكنّ الطاقة بقيت، والرغبة في البناء لم تنطفئ."),
      long("p2", "فقرة ٢", "جمعنا في غرفةٍ واحدةٍ ما تبقّى من إمكانات: مكاتب، إنترنت، كهرباء، وفوق ذلك كلّه — مجتمع. صار المكان مساحة نجاةٍ مهنيّةٍ لطلاب الجامعات، والخرّيجين الباحثين عن مسار، والمستقلّين الذين يحتاجون إلى بيئة عملٍ تليق بهم."),
      long("quote", "الاقتباس داخل البطاقة", "«Island Haven ليس مجرّد مساحةِ عمل. هو محاولة لإثبات أنّ المعرفة والخبرة والتعاون قادرةٌ على بناء مستقبل، حتى في أصعب الظروف.»"),
      img("image", "الصورة الجانبية", "/photos/IMG_8358.webp"),
      txt("creditEyebrow", "Eyebrow الاعتماد", "برنامج تنمويّ تابع لـ"),
      txt("creditTitle", "اسم المظلّة", "فريق «من الناس إلى الناس»"),
      long("creditBody", "نص المظلّة", "مبادرة تطوّعيّة تعمل من داخل غزّة وخارجها على إيصال الدعم المباشر إلى المشاريع المجتمعيّة الصغيرة. هي من احتضنت Island Haven وتُسهم في إبقاء أبوابه مفتوحة للجميع مجاناً."),
      url("creditLink1", "رابط الموقع التعريفي", "https://nastonas.org"),
      url("creditLink2", "رابط التبرّع", "https://nas2nas.org"),
      txt("stat1V", "إحصائية ١ — الرقم", "2024"),
      txt("stat1L", "إحصائية ١ — التسمية", "تأسّس"),
      txt("stat2V", "إحصائية ٢ — الرقم", "39"),
      txt("stat2L", "إحصائية ٢ — التسمية", "مقعد"),
      txt("stat3V", "إحصائية ٣ — الرقم", "100%"),
      txt("stat3L", "إحصائية ٣ — التسمية", "مجّانيّ"),
    ],
  },
  {
    key: "voices",
    label: "اقتباسات (Voices)",
    fields: [
      img("image", "صورة الخلفية", "/photos/IMG_8347.webp"),
      long("v1Quote", "اقتباس ١", "في واقعٍ تتكاثر فيه التحدّيات وتضيق فيه المساحات الآمنة للتعلّم والعمل، وُلد Island Haven كفكرة بسيطة في جوهرها، عميقة في أثرها."),
      txt("v1Source", "اقتباس ١ — المصدر عربي", "من الملف التعريفي للمجتمع"),
      txt("v1En", "اقتباس ١ — المصدر إنجليزي", "Founding profile"),
      long("v2Quote", "اقتباس ٢", "نعم هو مكانٌ للعمل، لكنّه قبل ذلك مساحة للالتقاء، وللتعلّم، ولبناء الثقة بالنفس وبالطريق."),
      txt("v2Source", "اقتباس ٢ — المصدر عربي", "رؤية Island Haven"),
      txt("v2En", "اقتباس ٢ — المصدر إنجليزي", "Vision"),
      long("v3Quote", "اقتباس ٣", "محاولة جادّة لبناء شيءٍ مستدامٍ في مكانٍ يفتقر إلى الاستقرار، واستثمار حقيقيّ في الإنسان قبل أيّ شيء آخر."),
      txt("v3Source", "اقتباس ٣ — المصدر عربي", "كلمة فريق التأسيس"),
      txt("v3En", "اقتباس ٣ — المصدر إنجليزي", "From the founding team"),
    ],
  },
  {
    key: "hours",
    label: "الموقع وقنوات التواصل",
    fields: [
      txt("label", "Eyebrow", "كل الأبواب مفتوحة"),
      txt("titleA", "العنوان — الجزء الأول", "تابعنا، سجّل،"),
      txt("titleB", "العنوان — الجزء الثاني", "أو"),
      txt("titleAccent", "العنوان — الكلمة المُلوّنة", "زرنا."),
      long("sub", "النص الفرعي", "نحن متواجدون على كلّ المنصّات الرئيسيّة. اختر القناة التي تناسبك واختبر المساحة قبل أن تقرّر."),
      txt("locationEyebrow", "Eyebrow الموقع", "Where we are · أين نحن"),
      txt("locationTitle", "عنوان الموقع", "في قلب غزّة، على ضفّة المتوسّط."),
      long("locationBody", "نص الموقع", "المساحة في موقع آمن ومركزيّ نُرسله عبر الرسائل الخاصّة بعد تأكيد الانتساب. النقطة النابضة على الخريطة تدلّ على الحيّ تقريباً — لا الإحداثيّات الدقيقة."),
      txt("locationStatus", "حالة الزيارة", "مفتوح الآن للزوّار بموعد مسبق"),
      txt("locationCoords", "الإحداثيات", "٣١.٥٠° ش · ٣٤.٤٧° شرق"),
      txt("c1Ar", "قناة ١ — عربي", "Linktree الرسمي"),
      txt("c1En", "قناة ١ — إنجليزي", "All links"),
      long("c1Desc", "قناة ١ — الوصف", "كلّ روابطنا في مكان واحد، يشمل رابط الانتساب ومقعد الضيف."),
      url("c1Href", "قناة ١ — الرابط", "https://linktr.ee/ih_haven"),
      txt("c1Handle", "قناة ١ — العرض", "linktr.ee/ih_haven"),
      txt("c2Ar", "قناة ٢ — عربي", "نموذج التسجيل"),
      txt("c2En", "قناة ٢ — إنجليزي", "Apply"),
      long("c2Desc", "قناة ٢ — الوصف", "للانتساب إلى المجتمع — راجع معايير القبول قبل التقديم."),
      url("c2Href", "قناة ٢ — الرابط", "/apply"),
      txt("c2Handle", "قناة ٢ — العرض", "افتح النموذج"),
      txt("c3Ar", "قناة ٣ — عربي", "إنستغرام"),
      txt("c3En", "قناة ٣ — إنجليزي", "Instagram"),
      long("c3Desc", "قناة ٣ — الوصف", "آخر الأخبار، الورش، الفعاليّات، وصور من داخل المساحة."),
      url("c3Href", "قناة ٣ — الرابط", "https://www.instagram.com/ih_haven"),
      txt("c3Handle", "قناة ٣ — العرض", "@ih_haven"),
      txt("c4Ar", "قناة ٤ — عربي", "لينكدإن"),
      txt("c4En", "قناة ٤ — إنجليزي", "LinkedIn"),
      long("c4Desc", "قناة ٤ — الوصف", "الجانب المهنيّ من Island Haven — للشركات والشركاء والداعمين."),
      url("c4Href", "قناة ٤ — الرابط", "https://www.linkedin.com/company/ih-haven"),
      txt("c4Handle", "قناة ٤ — العرض", "Island Haven"),
      txt("c5Ar", "قناة ٥ — عربي", "فيسبوك"),
      txt("c5En", "قناة ٥ — إنجليزي", "Facebook"),
      long("c5Desc", "قناة ٥ — الوصف", "متابعة الأنشطة وقصص المنتسبين عبر صفحتنا الرسميّة."),
      url("c5Href", "قناة ٥ — الرابط", "https://www.facebook.com/islandhaven101"),
      txt("c5Handle", "قناة ٥ — العرض", "islandhaven101"),
      txt("c6Ar", "قناة ٦ — عربي", "زرنا في غزّة"),
      txt("c6En", "قناة ٦ — إنجليزي", "Visit"),
      long("c6Desc", "قناة ٦ — الوصف", "العنوان التفصيليّ يُرسَل عبر الرسائل الخاصّة لضمان السلامة."),
      url("c6Href", "قناة ٦ — الرابط", "https://www.instagram.com/ih_haven"),
      txt("c6Handle", "قناة ٦ — العرض", "راسلنا للعنوان"),
      long("bottomNote", "الملاحظة السفلية", "ضوابط استخدام المكان والتفاصيل الكاملة تُرسَل عند تأكيد الانتساب — راسلنا لأيّ سؤال."),
    ],
  },
  {
    key: "support",
    label: "ادعمنا (Support)",
    fields: [
      img("image", "صورة الخلفية", "/photos/IMG_8358.webp"),
      txt("eyebrow", "Eyebrow", "Stand with us · كن معنا"),
      txt("headlineA", "العنوان — الجزء الأول", "استمرار هذا المكان"),
      txt("headlineB", "العنوان — الجزء الثاني", "يعتمد على"),
      txt("headlineAccent", "العنوان — الكلمة المُلوّنة", "التكافل."),
      long("body", "النص الفرعي", "Island Haven ليس مشروعاً ربحيّاً. هو مجتمع يُبنى يوميّاً بأيدي داعميه ومنتسبيه — وكلّ مساهمة تُبقي الأبواب مفتوحة."),
      txt("donateEyebrow", "بطاقة التبرّع — Eyebrow", "Donate · تبرّع"),
      txt("donateSub", "بطاقة التبرّع — تحت Eyebrow", "عبر مبادرة من الناس إلى الناس"),
      txt("donateTitleA", "بطاقة التبرّع — العنوان (سطر ١)", "كلّ مساهمة تُبقي"),
      txt("donateTitleB", "بطاقة التبرّع — العنوان (سطر ٢)", "الأبواب مفتوحة."),
      long("donateBody", "بطاقة التبرّع — النص", "تكاليف تشغيل المساحة — من إنترنت وكهرباء وصيانة — يغطّيها داعمون مثلك. تبرّع مباشر وآمن، يصل ١٠٠٪ إلى التشغيل."),
      txt("donateCta", "بطاقة التبرّع — نص الزر", "تبرّع الآن"),
      url("donateHref", "بطاقة التبرّع — رابط", "https://nas2nas.org"),
      txt("donateNote", "بطاقة التبرّع — ملاحظة", "nas2nas.org"),
      txt("sec1Ar", "إجراء ١ — عربي", "انضمّ للمجتمع"),
      txt("sec1En", "إجراء ١ — إنجليزي", "Apply"),
      long("sec1Body", "إجراء ١ — النص", "إذا كنت في غزّة وتنطبق عليك المعايير، سجّل في نموذج الانتساب."),
      txt("sec1Cta", "إجراء ١ — نص الزر", "افتح النموذج"),
      url("sec1Href", "إجراء ١ — الرابط", "/apply"),
      txt("sec2Ar", "إجراء ٢ — عربي", "شارك القصّة"),
      txt("sec2En", "إجراء ٢ — إنجليزي", "Share"),
      long("sec2Body", "إجراء ٢ — النص", "تابعنا على وسائل التواصل، وأرسل صفحاتنا لكلّ من قد يهمّه الأمر."),
      txt("sec2Cta", "إجراء ٢ — نص الزر", "تابعنا"),
      url("sec2Href", "إجراء ٢ — الرابط", "https://www.instagram.com/ih_haven"),
    ],
  },
  {
    key: "footer",
    label: "تذييل الصفحة (Footer)",
    fields: [
      img("logo", "الشعار", "/logo.png"),
      txt("colophonEyebrow", "Eyebrow", "Colophon · شعار الكتاب"),
      txt("signOffA", "العنوان الكبير — الجزء الأول", "مساحة"),
      txt("signOffAccent", "العنوان الكبير — كلمة مُلوّنة", "تتّسع"),
      txt("signOffB", "العنوان الكبير — الجزء الأخير", "لأحلامك."),
      txt("estLabel", "ملاحظة التأسيس", "تأسّس ٢٠٢٤"),
      txt("placeLabel", "ملاحظة الموقع", "غزّة · فلسطين"),
      txt("brand", "اسم العلامة", "Island Haven"),
      long("aboutBody", "نص التعريف", "مجتمع مهنيّ ومساحة عمل في غزّة، تابع لفريق «من الناس إلى الناس». نوفّر بيئة عمل مجّانيّة للمستقلّين والخرّيجين وطلبة الجامعات، مع برامج تدريب وفرص تشبيك."),
      txt("indexLabel", "تسمية الفهرس", "فهرس"),
      txt("programmeLabel", "تسمية المظلّة", "برنامج تنمويّ تابع لـ"),
      txt("programmeTitle", "اسم المظلّة", "من الناس إلى الناس"),
      long("programmeBody", "نص المظلّة", "فريق تطوّعيّ يعمل على إيصال الدعم المباشر إلى المشاريع المجتمعيّة في غزّة."),
      txt("bottomCopy", "حقوق النسخ", "© Island Haven · غزّة — فلسطين"),
      txt("bottomTag", "شعار سفلي", "بُني بحبّ ليتّسع لأحلامكم"),
    ],
  },
  {
    key: "header",
    label: "الهيدر (Header)",
    description: "شريط التنقّل العلوي — الشعار، روابط القائمة، زرّ الحجز، وزرّ الانتساب.",
    fields: [
      img("logo", "الشعار", "/logo.png"),
      txt("brand", "اسم العلامة (لاتيني)", "Island Haven"),
      txt("tagline", "تسمية تحت العلامة", "آيلاند هيفن · غزّة"),
      txt("nav1Label", "رابط ١ — التسمية", "الرئيسيّة"),
      txt("nav1En", "رابط ١ — إنجليزي", "Home"),
      txt("nav2Label", "رابط ٢ — التسمية", "منتسبو المساحة"),
      txt("nav2En", "رابط ٢ — إنجليزي", "Members"),
      txt("nav3Label", "رابط ٣ — التسمية", "البرنامج التّدريبيّ"),
      txt("nav3En", "رابط ٣ — إنجليزي", "Programs"),
      txt("nav4Label", "رابط ٤ — التسمية", "مُجتمعنا بالأرقام"),
      txt("nav4En", "رابط ٤ — إنجليزي", "Numbers"),
      txt("nav5Label", "رابط ٥ — التسمية", "فعاليّات آيلاند"),
      txt("nav5En", "رابط ٥ — إنجليزي", "Events"),
      txt("nav6Label", "رابط ٦ — التسمية", "معرض الصّور"),
      txt("nav6En", "رابط ٦ — إنجليزي", "Gallery"),
      txt("nav7Label", "رابط ٧ — التسمية", "من نحن"),
      txt("nav7En", "رابط ٧ — إنجليزي", "About"),
      txt("bookCtaLabel", "زرّ الحجز — التسمية", "احجز مقعد"),
      txt("ctaLabel", "زرّ الانتساب — التسمية", "انتسب الآن"),
      url("ctaHref", "زرّ الانتساب — الرابط", "/apply"),
      txt("menuLabel", "تسمية زرّ القائمة على الجوّال", "القائمة"),
    ],
  },
  {
    key: "features",
    label: "ما نقدّم (Features)",
    description: "ستّة أركان تُلخّص ما تقدّمه المساحة.",
    fields: [
      txt("eyebrow", "Eyebrow", "What we offer · ما نقدّم"),
      txt("number", "الرقم العملاق", "06"),
      txt("numberLabel", "تسمية تحت الرقم", "Six pillars · ستّة أركان"),
      txt("titleA", "العنوان — الجزء الأول", "كلّ تفصيل في المساحة"),
      txt("titleB", "العنوان — الجزء الثاني", "مدروس"),
      txt("titleAccent", "العنوان — الكلمة المُلوّنة", "ليُسهّل يومك."),
      long("sub", "النص الفرعي", "مزايا حقيقيّة، لا وعود تسويقيّة. كلّ ما يحتاجه يومٌ مهنيّ منتج، في مكانٍ واحد، تحت سقفٍ واحد، بلا عوائق."),
      txt("f1Title", "ميزة ١ — العنوان عربي", "إنترنت احترافيّ مستقرّ"),
      txt("f1En", "ميزة ١ — Eyebrow", "Reliable connectivity"),
      long("f1Body", "ميزة ١ — النص", "خطوط متعدّدة وكهرباء بلا انقطاع، حتّى يستمرّ تركيزك دون قلق."),
      txt("f2Title", "ميزة ٢ — العنوان عربي", "بيئة عمل مريحة"),
      txt("f2En", "ميزة ٢ — Eyebrow", "Crafted for focus"),
      long("f2Body", "ميزة ٢ — النص", "مكاتب مدروسة، إضاءة طبيعيّة، وقهوة مجانيّة — صُمّمت للتركيز الطويل."),
      txt("f3Title", "ميزة ٣ — العنوان عربي", "مجتمع مهنيّ نشط"),
      txt("f3En", "ميزة ٣ — Eyebrow", "A real professional network"),
      long("f3Body", "ميزة ٣ — النص", "اعمل إلى جانب مستقلّين وخرّيجين وطلبة، وابنِ شبكتك من أوّل يوم."),
      txt("f4Title", "ميزة ٤ — العنوان عربي", "ورش وفعاليّات دوريّة"),
      txt("f4En", "ميزة ٤ — Eyebrow", "Workshops & meetups"),
      long("f4Body", "ميزة ٤ — النص", "برامج تدريبيّة ولقاءات تشبيك شهريّة مفتوحة لكلّ المنتسبين."),
      txt("f5Title", "ميزة ٥ — العنوان عربي", "صُنع في آيلاند هيفن"),
      txt("f5En", "ميزة ٥ — Eyebrow", "Made in Island Haven"),
      long("f5Body", "ميزة ٥ — النص", "فعاليّة جديدة نفتح فيها الباب لاقتراحاتكم — المكان يصير أجمل بأهله."),
      txt("f6Title", "ميزة ٦ — العنوان عربي", "مجّانيّ بالكامل"),
      txt("f6En", "ميزة ٦ — Eyebrow", "100% free, always"),
      long("f6Body", "ميزة ٦ — النص", "لا رسوم انتساب ولا اشتراك. مدعوم من «من الناس إلى الناس»."),
    ],
  },
  {
    key: "livenow",
    label: "الآن في الهيفن (Live)",
    description: "الشريط النابض — تسميات الحالة فقط (الأرقام تُحسب تلقائيّاً).",
    fields: [
      txt("label", "تسمية الشريط", "الآن في الهيفن"),
      txt("placeLabel", "تسمية المدينة", "غزّة"),
      txt("workingLabel", "تسمية العاملين", "يعمل الآن"),
      txt("workshopLabel", "تسمية الورشة", "ورشة جارية"),
      txt("coffeeLabel", "تسمية القهوة", "قهوة قيد التحضير ☕︎"),
      long("closedLabel", "نص حالة الإغلاق", "المساحة مغلقة الآن · نفتح أبوابنا من السبت إلى الخميس، ٩ صباحاً – ٥ مساءً"),
      txt("liveBadge", "شارة البثّ المباشر", "بثّ مباشر من قلب غزّة"),
    ],
  },
  {
    key: "wordwindow",
    label: "الكلمة المنحوتة (هنا.)",
    description: "اللحظة التوقيعيّة — الكلمة الكبيرة المنحوتة فوق الصور.",
    fields: [
      txt("eyebrow", "Eyebrow علوي", "A window · نافذة"),
      txt("word", "الكلمة المنحوتة", "هنا."),
      long("captionA", "التعليق — الجزء الأول", "في قلب غزّة، فتحنا باباً واحداً —"),
      txt("captionB", "التعليق — التتمّة المُلوّنة", "ليبقى مفتوحاً."),
      txt("captionEn", "تعليق سفلي بالإنجليزية", "Inside, the work continues"),
      img("image1", "صورة ١", "/photos/IMG_8358.webp"),
      img("image2", "صورة ٢", "/photos/IMG_8347.webp"),
      img("image3", "صورة ٣", "/photos/IMG_8344.webp"),
    ],
  },
  {
    key: "scrollytelling",
    label: "يوم في الهيفن (Story scenes)",
    description: "ستّة مشاهد سينمائيّة لرحلة يوم في المساحة.",
    fields: [
      txt("s1Hour", "مشهد ١ — الساعة", "٠٩:٠٠"),
      txt("s1Kicker", "مشهد ١ — Eyebrow", "Opening"),
      long("s1Title", "مشهد ١ — العنوان (سطران)", "البابُ يُفتح،\nوأوّل ضوءٍ يدخل."),
      long("s1Body", "مشهد ١ — النص", "صباحٌ غزّيٌّ يبدأ بصوت المفتاح، ورائحة قهوة تُحضَّر لمن سيأتي. كرسيّك بانتظارك، والإنترنت لا ينقطع."),
      img("s1Image", "مشهد ١ — الصورة", "/photos/IMG_8357.webp"),
      txt("s2Hour", "مشهد ٢ — الساعة", "١٠:١٥"),
      txt("s2Kicker", "مشهد ٢ — Eyebrow", "Deep Work"),
      long("s2Title", "مشهد ٢ — العنوان (سطران)", "تركيزٌ بلا\nمقاطعات."),
      long("s2Body", "مشهد ٢ — النص", "سمّاعات، شاشة، وإضاءة طبيعيّة. هنا لا يطرق أحدٌ بابك، ولا يقطع الكهرباء عملك. الوقت لك، استثمره كاملاً."),
      img("s2Image", "مشهد ٢ — الصورة", "/photos/IMG_8347.webp"),
      txt("s3Hour", "مشهد ٣ — الساعة", "١١:٣٠"),
      txt("s3Kicker", "مشهد ٣ — Eyebrow", "Collide"),
      long("s3Title", "مشهد ٣ — العنوان (سطران)", "ثلاثُ أفكار،\nطاولةٌ واحدة."),
      long("s3Body", "مشهد ٣ — النص", "تجلس بجانب مستقلٍّ يعمل لشركةٍ في برلين، وخرّيجة بدأت أوّل عقد، وطالبٍ يُتقن التصميم. شبكتُك تبدأ من فنجان قهوة."),
      img("s3Image", "مشهد ٣ — الصورة", "/photos/IMG_8341.webp"),
      txt("s4Hour", "مشهد ٤ — الساعة", "١٣:٠٠"),
      txt("s4Kicker", "مشهد ٤ — Eyebrow", "Pause"),
      long("s4Title", "مشهد ٤ — العنوان (سطران)", "القهوة على حسابنا،\nوالحديثُ على حساب الجميع."),
      long("s4Body", "مشهد ٤ — النص", "استراحةٌ تتحوّل لورشة عصفٍ ذهنيّ، أو حوارٍ هادئ، أو ضحكةٍ تُذهب تعب الصباح. لا أحد يأكل وحده هنا."),
      img("s4Image", "مشهد ٤ — الصورة", "/photos/IMG_8358.webp"),
      txt("s5Hour", "مشهد ٥ — الساعة", "١٥:٠٠"),
      txt("s5Kicker", "مشهد ٥ — Eyebrow", "Workshop"),
      long("s5Title", "مشهد ٥ — العنوان (سطران)", "عشرون مقعداً،\nسؤالٌ يُغيّر مساراً."),
      long("s5Body", "مشهد ٥ — النص", "ورشة تدريبيّة جديدة في الأسبوع. ضيفٌ من السوق، وقصّةٌ من قلب التجربة. تخرج وفي يدك مهارة، وفي رأسك قرار."),
      img("s5Image", "مشهد ٥ — الصورة", "/photos/IMG_8352.webp"),
      txt("s6Hour", "مشهد ٦ — الساعة", "١٦:٥٠"),
      txt("s6Kicker", "مشهد ٦ — Eyebrow", "Closing"),
      long("s6Title", "مشهد ٦ — العنوان (سطران)", "البابُ يُغلق،\nوالرّوابطُ تبقى."),
      long("s6Body", "مشهد ٦ — النص", "تخرج وفي جيبك بطاقةُ تعارفٍ جديدة، وفرصةٌ كانت بالأمس بعيدة. آيلاند هيفن لا ينتهي عند الباب — يبدأ منه."),
      img("s6Image", "مشهد ٦ — الصورة", "/photos/IMG_8300.webp"),
    ],
  },
  {
    key: "gallery",
    label: "معرض الصور (Gallery)",
    description: "العنوان + ثماني عشرة صورة مع تعليق لكلٍّ منها.",
    fields: [
      txt("eyebrow", "Eyebrow", "Picture Essay · معرض الصور"),
      txt("titleA", "العنوان — الجزء الأول", "صورٌ من قلب"),
      txt("titleAccent", "العنوان — الكلمة المُلوّنة", "المساحة."),
      long("sub", "النص الفرعي", "كلّ صورة هنا التُقطت داخل آيلاند هيفن — وجوه، تركيز، تفاصيل، وحياة يوميّة في مكان نُحبّه."),
      img("p01", "صورة ١", "/photos/IMG_8357.webp"),
      txt("c01", "تعليق ١", "صباحٌ في المساحة"),
      img("p02", "صورة ٢", "/photos/IMG_8300.webp"),
      txt("c02", "تعليق ٢", "الجدار الذي يحمل اسمنا"),
      img("p03", "صورة ٣", "/photos/IMG_8347.webp"),
      txt("c03", "تعليق ٣", "تركيزٌ عميق على التصميم"),
      img("p04", "صورة ٤", "/photos/IMG_8313.webp"),
      txt("c04", "تعليق ٤", "ركن العمل المشترك"),
      img("p05", "صورة ٥", "/photos/IMG_8352.webp"),
      txt("c05", "تعليق ٥", "ورشةٌ نتعلّم فيها معاً"),
      img("p06", "صورة ٦", "/photos/IMG_8344.webp"),
      txt("c06", "تعليق ٦", "زاوية هادئة للتفكير"),
      img("p07", "صورة ٧", "/photos/IMG_8358.webp"),
      txt("c07", "تعليق ٧", "تشبيكٌ بين الأرواح"),
      img("p08", "صورة ٨", "/photos/IMG_8346.webp"),
      txt("c08", "تعليق ٨", "جلسة عملٍ مفتوحة"),
      img("p09", "صورة ٩", "/photos/IMG_8341.webp"),
      txt("c09", "تعليق ٩", "حواراتٌ تُولد منها فرص"),
      img("p10", "صورة ١٠", "/photos/IMG_8345.webp"),
      txt("c10", "تعليق ١٠", "في انتظار البدء"),
      img("p11", "صورة ١١", "/photos/IMG_8349.webp"),
      txt("c11", "تعليق ١١", "أيدٍ تبني الغد"),
      img("p12", "صورة ١٢", "/photos/IMG_8353.webp"),
      txt("c12", "تعليق ١٢", "مساحةٌ تتّسع للتجربة"),
      img("p13", "صورة ١٣", "/photos/IMG_8356.webp"),
      txt("c13", "تعليق ١٣", "ضحكاتٌ بين الأقران"),
      img("p14", "صورة ١٤", "/photos/IMG_8303.webp"),
      txt("c14", "تعليق ١٤", "تفاصيل مكاننا"),
      img("p15", "صورة ١٥", "/photos/IMG_8304.webp"),
      txt("c15", "تعليق ١٥", "أمسيةٌ في الهيفن"),
      img("p16", "صورة ١٦", "/photos/IMG_8307.webp"),
      txt("c16", "تعليق ١٦", "حضورٌ مهنيّ"),
      img("p17", "صورة ١٧", "/photos/IMG_8308.webp"),
      txt("c17", "تعليق ١٧", "تركيزٌ جماعيّ"),
      img("p18", "صورة ١٨", "/photos/IMG_8314.webp"),
      txt("c18", "تعليق ١٨", "وجوهٌ نفخر بها"),
    ],
  },
  {
    key: "contact",
    label: "التواصل والروابط",
    fields: [
      url("instagram", "Instagram", "https://www.instagram.com/ih_haven"),
      url("linkedin", "LinkedIn", "https://www.linkedin.com/company/ih-haven"),
      url("facebook", "Facebook", "https://www.facebook.com/islandhaven101"),
      url("linktree", "Linktree", "https://linktr.ee/ih_haven"),
      url("nastonas", "موقع من الناس إلى الناس", "https://nastonas.org"),
      url("nas2nas", "رابط التبرّع", "https://nas2nas.org"),
      txt("email", "البريد الإلكتروني", "hello@islandhaven.ps"),
      txt("phone", "الهاتف", "+972 56-753-6815"),
      url("whatsapp", "واتساب", "https://wa.me/972567536815"),
    ],
  },
  {
    key: "newsSlider",
    label: "شريط الفعاليّات (Home)",
    description: "شريط فعاليّات آيلاند في الصفحة الرئيسيّة — العنوان، التسميات، والفراغ.",
    fields: [
      txt("eyebrow", "Eyebrow", "فعاليّات آيلاند · Events"),
      txt("title", "العنوان", "ما يحدث في المساحة هذا الأسبوع."),
      txt("ctaAll", "زرّ كلّ الفعاليّات", "كلّ الفعاليّات"),
      txt("ctaCard", "زرّ بطاقة الفعاليّة", "اقرأ المزيد"),
      txt("emptyText", "نص الفراغ", "لا توجد فعاليّات معلَنة بعد — تابعنا قريبًا."),
      txt("prevAria", "وصف زرّ السابق", "السّابق"),
      txt("nextAria", "وصف زرّ التالي", "التّالي"),
    ],
  },
  {
    key: "numbersBand",
    label: "شريط الأرقام (Home)",
    description: "شريط الأرقام الحقيقيّة في الرّئيسيّة — العنوان، التسميات، والزرّ.",
    fields: [
      txt("eyebrow", "Eyebrow", "مُجتمعنا بالأرقام · By the numbers"),
      txt("titleA", "العنوان — الجزء الأول", "ليست شعارات."),
      txt("titleAccent", "العنوان — الكلمة المُلوّنة", "أرقام حقيقيّة"),
      txt("titleB", "العنوان — التتمّة", "من قاعدة بياناتنا."),
      long("sub", "النص الفرعي", "كلّ رقم تراه هنا يعكس حالة المساحة الآن — يتحدّث تلقائيًّا مع كلّ منتسب جديد، كلّ عمل، وكلّ مقعد محجوز."),
      txt("ctaLabel", "زرّ عرض المزيد", "عرض المزيد"),
      txt("tile1Label", "بطاقة ١ — العربيّة", "منتسب"),
      txt("tile1En", "بطاقة ١ — الإنجليزيّة", "Members"),
      txt("tile2Label", "بطاقة ٢ — العربيّة", "عمل منشور"),
      txt("tile2En", "بطاقة ٢ — الإنجليزيّة", "Works"),
      txt("tile3Label", "بطاقة ٣ — العربيّة", "تسجيل في برامج"),
      txt("tile3En", "بطاقة ٣ — الإنجليزيّة", "Enrollments"),
      txt("tile4Label", "بطاقة ٤ — العربيّة", "مقعد استضفناه"),
      txt("tile4En", "بطاقة ٤ — الإنجليزيّة", "Seats hosted"),
    ],
  },
  {
    key: "pageMembers",
    label: "صفحة المنتسبين",
    description: "ترويسة صفحة /members، حقل البحث، وفلاتر التصنيف.",
    fields: [
      txt("eyebrow", "Eyebrow", "من نحن"),
      txt("title", "العنوان", "منتسبو المساحة"),
      long("subtitle", "النص الفرعي", "مُجتمعٌ من المستقلّين، الخرّيجين، والطّلّاب يصنعون أعمالهم من قلب غزّة. تعرّف عليهم — واطّلع على أعمالهم."),
      txt("searchPlaceholder", "Placeholder البحث", "ابحث بالاسم، التّخصّص، أو المهارة…"),
      txt("filterAll", "فلتر — الكلّ", "الكلّ"),
      txt("filterFreelancer", "فلتر — مستقلّون", "مُستقلّون"),
      txt("filterGraduate", "فلتر — خرّيجون", "خرّيجون"),
      txt("filterStudent", "فلتر — طلّاب", "طلّاب"),
      txt("filterOther", "فلتر — أعضاء", "أعضاء"),
      txt("worksLabel", "تسمية «عمل»", "عمل"),
      txt("emptyTitle", "عنوان الفراغ", "لا توجد نتائج"),
      txt("emptyHint", "تلميح الفراغ", "جرّب فلترًا آخر أو كلمة بحث مختلفة."),
    ],
  },
  {
    key: "pageNumbers",
    label: "صفحة الأرقام",
    description: "ترويسة صفحة /numbers وعناوين المجموعات.",
    fields: [
      txt("eyebrow", "Eyebrow", "By the numbers"),
      txt("title", "العنوان", "مُجتمعنا بالأرقام"),
      long("subtitle", "النص الفرعي", "لا شيء هنا مكتوب يدويًّا. كلّ رقم يُحسب الآن من قاعدة بياناتنا — يتغيّر تلقائيًّا مع كلّ منتسب جديد، كلّ عمل، وكلّ مقعد محجوز."),
      txt("group1Title", "مجموعة ١ — العنوان", "المجتمع"),
      txt("group1En", "مجموعة ١ — Eyebrow", "Community"),
      txt("group2Title", "مجموعة ٢ — العنوان", "الإنتاج"),
      txt("group2En", "مجموعة ٢ — Eyebrow", "Output"),
      txt("group3Title", "مجموعة ٣ — العنوان", "الاستضافة"),
      txt("group3En", "مجموعة ٣ — Eyebrow", "Hospitality"),
      txt("tMembers", "بطاقة — إجمالي المنتسبين", "إجمالي المنتسبين"),
      txt("tFreelancers", "بطاقة — مستقلّون", "مُستقلّون"),
      txt("tGraduates", "بطاقة — خرّيجون", "خرّيجون"),
      txt("tStudents", "بطاقة — طلّاب", "طلّاب"),
      txt("tWorks", "بطاقة — أعمال منشورة", "عمل منشور في المعرض"),
      txt("tCourses", "بطاقة — برامج", "برنامج تدريبيّ"),
      txt("tEnrollments", "بطاقة — تسجيلات", "تسجيل في برامج"),
      txt("tBookings", "بطاقة — حجوزات", "حجز نشط"),
      txt("tSeats", "بطاقة — مقاعد", "مقعد استضفناه"),
      txt("tApplications", "بطاقة — طلبات", "طلب انتساب"),
      txt("tEvents", "بطاقة — منشورات وفعاليّات", "منشور · فعاليّة"),
    ],
  },
  {
    key: "pageGallery",
    label: "صفحة المعرض",
    description: "ترويسة صفحة /gallery ونصوص الفراغ.",
    fields: [
      txt("eyebrow", "Eyebrow", "Gallery"),
      txt("title", "العنوان", "معرض الصّور"),
      long("subtitle", "النص الفرعي", "مقتطفاتٌ من أعمال المنتسبين، ولحظاتٍ من حياة المساحة. اضغط أيّ صورة لعرضها بحجمها الكامل."),
      txt("emptyTitle", "عنوان الفراغ", "لا توجد صور بعد"),
      txt("emptyHint", "تلميح الفراغ", "ستظهر هنا تلقائيًّا مع كلّ عمل جديد."),
      txt("byAuthor", "تسمية «بقلم»", "بقلم"),
      txt("openWork", "زرّ افتح العمل", "افتح العمل"),
    ],
  },
  {
    key: "pageEvents",
    label: "صفحة الفعاليّات",
    description: "ترويسة صفحة /events وفلاتر النوع.",
    fields: [
      txt("eyebrow", "Eyebrow", "Events · ما يحدث"),
      txt("title", "العنوان", "فعاليّات آيلاند"),
      long("subtitle", "النص الفرعي", "جدولُ فعاليّاتنا، أخبارنا، ونصائحنا الأسبوعيّة — كلّ ما يحدث في المساحة في مكانٍ واحد."),
      txt("filterAll", "فلتر — الكلّ", "الكلّ"),
      txt("filterNews", "فلتر — أخبار", "أخبار"),
      txt("filterTip", "فلتر — نصائح", "نصائح"),
      txt("filterStory", "فلتر — قصص", "قصص"),
      txt("filterQuote", "فلتر — اقتباسات", "اقتباسات"),
      txt("emptyTitle", "عنوان الفراغ", "لا توجد فعاليّات بعد"),
      txt("emptyHint", "تلميح الفراغ", "ستظهر فعاليّاتنا القادمة هنا — تابعنا قريبًا."),
      txt("detailsLabel", "زرّ التفاصيل", "التفاصيل"),
    ],
  },
  {
    key: "applyForm",
    label: "صفحة الانتساب (Apply)",
    description: "كلّ نصوص فورم الانتساب — الترويسة، التسميات، التصنيفات، أزرار الإرسال، وشاشة النّجاح.",
    fields: [
      // Header chrome
      txt("backLabel", "زرّ العودة", "العودة"),
      txt("brandLatin", "اسم العلامة (لاتيني)", "Island Haven"),
      txt("brandArabic", "اسم العلامة (عربي)", "آيلاند هيفن"),
      // Hero block
      txt("eyebrow", "Eyebrow علوي", "طلب انتساب · مجّاناً"),
      txt("titleLead", "العنوان — مقدّمة", "انضمّ إلى"),
      txt("titleAccent", "العنوان — الكلمة المُلوّنة", "آيلاند هيفن"),
      long("subtitle", "النص الفرعي", "مساحة عمل مجّانيّة تتّسع لأحلامك في غزّة. املأ الطلب وسنتواصل معك على واتساب خلال أيّام."),
      // Section 01 — identity
      txt("sec1Title", "عنوان قسم ١", "مَن أنت"),
      txt("sec1Sub", "Eyebrow قسم ١", "Identity"),
      txt("fullNameLabel", "تسمية الاسم", "الاسم الكامل"),
      txt("fullNameHint", "تلميح الاسم", "Full name"),
      txt("fullNamePlaceholder", "Placeholder الاسم", "مثال: ياسمين الغزّاوي"),
      txt("emailLabel", "تسمية البريد", "البريد الإلكتروني"),
      txt("emailHint", "تلميح البريد", "Email"),
      txt("emailPlaceholder", "Placeholder البريد", "name@example.com"),
      txt("phoneLabel", "تسمية الهاتف", "رقم الواتساب"),
      txt("phoneHint", "تلميح الهاتف", "WhatsApp"),
      txt("phonePlaceholder", "Placeholder الهاتف", "+970 …"),
      // Section 02 — category
      txt("sec2Title", "عنوان قسم ٢", "ما تصنيفك"),
      txt("sec2Sub", "Eyebrow قسم ٢", "Category"),
      txt("cat1Label", "تصنيف ١ — العربي", "مستقلّ"),
      txt("cat1Sub", "تصنيف ١ — الإنجليزي", "Freelancer"),
      txt("cat2Label", "تصنيف ٢ — العربي", "خرّيج جامعي"),
      txt("cat2Sub", "تصنيف ٢ — الإنجليزي", "Graduate"),
      txt("cat3Label", "تصنيف ٣ — العربي", "طالب جامعي"),
      txt("cat3Sub", "تصنيف ٣ — الإنجليزي", "Student"),
      txt("cat4Label", "تصنيف ٤ — العربي", "غير ذلك"),
      txt("cat4Sub", "تصنيف ٤ — الإنجليزي", "Other"),
      // Section 03 — bio
      txt("sec3Title", "عنوان قسم ٣", "حدّثنا عنك"),
      txt("sec3Sub", "Eyebrow قسم ٣", "About you"),
      txt("bioLabel", "تسمية النبذة", "نبذة ومجال عملك"),
      txt("bioHint", "تلميح النبذة", "Bio"),
      long("bioPlaceholder", "Placeholder النبذة", "ماذا تعمل أو تدرس؟ ما الذي تنوي تحقيقه في آيلاند هيفن؟"),
      // Submit + footer trust
      txt("submitLabel", "زرّ الإرسال", "أرسل طلب الانتساب"),
      txt("submitLoading", "نص أثناء الإرسال", "جارٍ الإرسال…"),
      long("consentLine", "سطر الموافقة", "بإرسالك الطلب، توافق على أن نتواصل معك بشأنه فقط."),
      txt("trustLabel", "تسمية «بدعم من»", "بدعمٍ من"),
      txt("trustBrand", "اسم الجهة الدّاعمة", "من الناس إلى الناس"),
      // Errors
      txt("errFallback", "خطأ — رسالة افتراضيّة", "تعذّر إرسال الطلب"),
      txt("errNetwork", "خطأ — الشبكة", "تعذّر الاتّصال بالخادم. حاول مجدّدًا بعد قليل."),
      // Success screen
      txt("successEyebrow", "نجاح — Eyebrow", "وصل طلبك"),
      txt("successThanksLead", "نجاح — مقدّمة الشكر", "شكرًا لك يا"),
      txt("successFallbackName", "نجاح — اسم افتراضي", "صديقنا"),
      long("successBody", "نجاح — النص", "استلمنا طلبك بأمان. سنراجعه ونتواصل معك على واتساب خلال أيّام.\nمرحبًا بك في عائلة آيلاند هيفن."),
      txt("successRefLabel", "نجاح — تسمية رقم الطلب", "رقم الطلب"),
      txt("successCta", "نجاح — زرّ العودة", "العودة للرئيسيّة"),
      // Document title
      txt("docTitle", "عنوان التبويب (Tab)", "انضمّ إلى آيلاند هيفن"),
    ],
  },
];

/** Build DEFAULT_CONTENT from schema. */
export const DEFAULT_CONTENT: Record<string, Record<string, string>> = (() => {
  const out: Record<string, Record<string, string>> = {};
  for (const sec of CONTENT_SCHEMA) {
    out[sec.key] = {};
    for (const f of sec.fields) out[sec.key][f.key] = f.default;
  }
  return out;
})();

router.get("/content", async (_req, res) => {
  const rows = await db.select().from(siteSettingsTable);
  const overrides: Record<string, Record<string, string>> = {};
  for (const row of rows) overrides[row.key] = row.value as Record<string, string>;
  const merged: Record<string, Record<string, string>> = {};
  for (const sec of CONTENT_SCHEMA) {
    merged[sec.key] = { ...DEFAULT_CONTENT[sec.key], ...(overrides[sec.key] ?? {}) };
  }
  res.json({ content: merged });
});

router.get("/admin/content", requireAdmin, async (_req, res) => {
  const rows = await db.select().from(siteSettingsTable);
  const overrides: Record<string, Record<string, string>> = {};
  for (const row of rows) overrides[row.key] = row.value as Record<string, string>;
  const merged: Record<string, Record<string, string>> = {};
  for (const sec of CONTENT_SCHEMA) {
    merged[sec.key] = { ...DEFAULT_CONTENT[sec.key], ...(overrides[sec.key] ?? {}) };
  }
  res.json({ schema: CONTENT_SCHEMA, defaults: DEFAULT_CONTENT, overrides, merged });
});

const upsertSchema = z.object({
  value: z.record(z.string(), z.string()),
});

const SECTION_INDEX = new Map(CONTENT_SCHEMA.map((s) => [s.key, s] as const));
const FIELD_INDEX = new Map<string, Map<string, FieldDef>>(
  CONTENT_SCHEMA.map((s) => [s.key, new Map(s.fields.map((f) => [f.key, f]))]),
);

router.put("/admin/content/:key", requireAdmin, async (req, res) => {
  const key = String(req.params.key ?? "");
  const section = SECTION_INDEX.get(key);
  if (!section) {
    res.status(400).json({ error: "قسم غير معروف" });
    return;
  }
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "قيمة غير صالحة" });
    return;
  }
  const fields = FIELD_INDEX.get(key)!;
  const cleaned: Record<string, string> = {};
  const unknownKeys: string[] = [];
  const isSafeUrlOrPath = (v: string): boolean => {
    if (v === "") return true;
    if (v.startsWith("/")) return true; // relative path (uploads, public assets)
    if (/^(mailto:|tel:)/i.test(v)) return true;
    try {
      const u = new URL(v);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };
  for (const [fk, fv] of Object.entries(parsed.data.value)) {
    const def = fields.get(fk);
    if (!def) {
      unknownKeys.push(fk);
      continue;
    }
    if (typeof fv !== "string") {
      res.status(400).json({ error: `قيمة الحقل ${fk} يجب أن تكون نصّاً` });
      return;
    }
    if (fv.length > 8000) {
      res.status(400).json({ error: `حقل ${fk} يتجاوز الحدّ المسموح` });
      return;
    }
    if ((def.type === "url" || def.type === "image") && !isSafeUrlOrPath(fv)) {
      res.status(400).json({ error: `قيمة غير صالحة للحقل ${fk}` });
      return;
    }
    cleaned[fk] = fv;
  }
  if (unknownKeys.length > 0) {
    res.status(400).json({
      error: `حقول غير معروفة في القسم ${key}: ${unknownKeys.join(", ")}`,
      unknownKeys,
    });
    return;
  }
  await db
    .insert(siteSettingsTable)
    .values({ key, value: cleaned })
    .onConflictDoUpdate({
      target: siteSettingsTable.key,
      set: { value: cleaned, updatedAt: sql`now()` },
    });
  res.json({ ok: true });
});

router.delete("/admin/content/:key", requireAdmin, async (req, res) => {
  const key = String(req.params.key ?? "");
  await db
    .delete(siteSettingsTable)
    .where(sql`${siteSettingsTable.key} = ${key}`);
  res.json({ ok: true });
});

export default router;
