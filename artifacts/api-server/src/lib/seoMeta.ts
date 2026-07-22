// ─── Per-route SSR meta injection ────────────────────────────────────────────
// The SPA ships ONE index.html, so social/link crawlers (Facebook, LinkedIn,
// WhatsApp, X) — which don't run JS — saw the SAME title/description/preview for
// every URL. This rewrites <title>, description, og:*, twitter:* and canonical in
// the served HTML per request path, so a shared link previews as its real page.
// The client's RouteEffects then sets the identical values once JS runs (no
// conflict). Titles/descriptions are Arabic — the site's primary language and its
// og:locale (ar_AR) — mirroring what a visitor reads.

const ORIGIN = (
  process.env.SITE_ORIGIN ?? "https://island-haven.replit.app"
).replace(/\/$/, "");
const BRAND = "آيلاند هيفن · Island Haven";
const HOME_DESC =
  "آيلاند هيفن (Island Haven) — حاضنة أعمال غزّاويّة مجّانيّة تابعة لـ «من النّاس إلى النّاس». نَحضن المشاريع الناشئة والمستقلّين والخرّيجين بإرشاد، برامج احتضان، وشبكة من الخبراء والشركاء.";

interface Meta {
  title: string;
  description: string;
}

// Mirrors the client ROUTE_META. Title is the clean page name (brand is appended
// below); description is a concrete, honest one-liner for the share preview.
const ROUTE_META: Record<string, Meta> = {
  "/": { title: "حاضنة أعمال في غزّة", description: HOME_DESC },
  "/about": {
    title: "من نحن",
    description:
      "قصّة آيلاند هيفن ورسالتها: حاضنة أعمال وُلدت في غزّة تحت الحرب، تأخذ بيد موهبتها نحو الاقتصاد الرقميّ العالميّ — عقولٌ تقهر الركام.",
  },
  "/programs": {
    title: "برامج الاحتضان",
    description:
      "مسارات احتضان وتسريع منظَّمة — من الفكرة إلى المنتج إلى السوق: تقديم، دفعة، إرشاد فرديّ وأدوات حقيقيّة، ثمّ Demo Day. مجّانًا، من قلب غزّة.",
  },
  "/apply": {
    title: "انتسب للحاضنة",
    description:
      "قدّم طلب الانتساب إلى آيلاند هيفن — المساحة والبرامج وشبكة الخبراء. مجّانًا، من غزّة.",
  },
  "/book": {
    title: "احجز مقعدك",
    description:
      "احجز مقعدك في مساحة آيلاند هيفن بغزّة — اختر التاريخ والوقت الذي يناسبك. بلا رسوم.",
  },
  "/verify": {
    title: "الشرف القابل للتحقّق",
    description:
      "كلّ رقمٍ نعرضه موقّعٌ تشفيريًّا (Ed25519) ويتحقّق منه متصفّحك بنفسه — من غير أن يثق بخادمنا. لا تثق بنا، تحقّق منّا.",
  },
  "/experts": {
    title: "مرشدو آيلاند",
    description:
      "خبراء ومرشدون من غزّة والعالم يقدّمون الإرشاد والجلسات الفرديّة لروّاد آيلاند هيفن. احجز جلسة إرشاد مجّانيّة.",
  },
  "/ventures": {
    title: "المشاريع الناشئة",
    description:
      "المشاريع الناشئة التي احتضنها آيلاند هيفن — قصص ومقاييس ومسارات نموّ من قلب غزّة.",
  },
  "/events": {
    title: "فعاليّات آيلاند",
    description:
      "جدول فعاليّاتنا وأخبارنا ونصائحنا الأسبوعيّة — كلّ ما يحدث في مساحة آيلاند هيفن في مكانٍ واحد.",
  },
  "/blog": {
    title: "المدوّنة والرّؤى",
    description:
      "تقارير ورؤى واستراتيجيّات من خبراء آيلاند هيفن حول ريادة الأعمال والاقتصاد الرقميّ من غزّة.",
  },
  "/jobs": {
    title: "لوحة الوظائف",
    description:
      "فرص عمل محلّيّة وعالميّة (عن بُعد) لموهبة غزّة — من شركاء آيلاند هيفن وشبكته حول العالم.",
  },
  "/investors": {
    title: "المستثمرون والداعمون",
    description:
      "ادعم آيلاند هيفن أو استثمر في موهبة غزّة — كيف نعمل، وأثرنا، وكيف تنضمّ إلى شبكة الدّاعمين.",
  },
  "/partners": {
    title: "الشركاء",
    description:
      "المؤسّسات والشركات الداعمة لمنظومة آيلاند هيفن في غزّة — شراكات تصنع الأثر.",
  },
  "/team": {
    title: "فريق آيلاند",
    description: "الوجوه التي تقف خلف آيلاند هيفن — فريق يبني حاضنة غزّة.",
  },
  "/cohorts": {
    title: "دفعات الاحتضان",
    description:
      "دفعات الاحتضان المكثّفة في آيلاند هيفن — قدّم مشروعك وانضمّ إلى الدفعة القادمة.",
  },
  "/contact": {
    title: "تواصل معنا",
    description:
      "سؤال، فكرة، أو شراكة — تواصل مع آيلاند هيفن في غزّة. الباب مفتوح والرّدّ مضمون خلال ٢٤ ساعة.",
  },
  "/numbers": {
    title: "مُجتمعنا بالأرقام",
    description:
      "مجتمع آيلاند هيفن بالأرقام — منتسبون، مستقلّون، خرّيجون، ومشاريع. أرقامٌ موقّعة تشفيريًّا يمكنك التحقّق منها.",
  },
  "/stories": {
    title: "قصص النجاح",
    description:
      "قصص روّاد ومشاريع وُلدت في آيلاند هيفن بغزّة — من الفكرة إلى الأثر.",
  },
  "/freelancers": {
    title: "المستقلّون",
    description:
      "مستقلّو غزّة من مجتمع آيلاند هيفن — مواهب تعمل مع عملاء وشركاء حول العالم.",
  },
  "/members": {
    title: "منتسبو المساحة",
    description: "مجتمع آيلاند هيفن — المنتسبون الذين يبنون مستقبل غزّة الرقميّ.",
  },
  "/press": {
    title: "المركز الإعلاميّ",
    description:
      "حقائق واقتباسات وهويّة بصريّة وجهة تواصل — كلّ ما تحتاجه لتغطية قصّة آيلاند هيفن.",
  },
  "/careers": {
    title: "انضمّ لفريقنا",
    description: "فرص الانضمام إلى فريق آيلاند هيفن — ابنِ حاضنة غزّة معنا.",
  },
  "/resources": {
    title: "دليل الرّائد",
    description:
      "مكتبة موارد آيلاند هيفن — قوالب وأدلّة وأدوات تأخذ مشروعك من الفكرة إلى السوق.",
  },
  "/faq": {
    title: "الأسئلة الشائعة",
    description: "أجوبة عن أكثر الأسئلة شيوعًا حول آيلاند هيفن وبرامجها وانتسابها.",
  },
};

function metaFor(path: string): Meta {
  const clean = path.replace(/\/+$/, "") || "/";
  return (
    ROUTE_META[clean] ??
    ROUTE_META[`/${clean.split("/").filter(Boolean)[0] ?? ""}`] ??
    ROUTE_META["/"]
  );
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Rewrite title/description/og/twitter/canonical in the HTML shell for `path`. */
export function injectRouteMeta(html: string, path: string): string {
  const m = metaFor(path);
  const clean = path.replace(/\/+$/, "") || "/";
  const url = `${ORIGIN}${clean === "/" ? "/" : clean}`;
  const title = esc(clean === "/" ? `${m.title} — ${BRAND}` : `${m.title} · ${BRAND}`);
  const desc = esc(m.description);
  const u = esc(url);
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${desc}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${desc}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${u}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${desc}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${u}$2`);
}
