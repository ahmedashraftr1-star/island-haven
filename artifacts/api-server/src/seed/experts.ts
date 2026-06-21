/**
 * Dev-only seed: populates the Island Haven expert team via the admin API.
 *
 * Requires the API server to be running and ADMIN_PASSWORD to be set.
 * Run explicitly with:
 *   pnpm --filter @workspace/api-server seed:experts
 *
 * Environment variables:
 *   ADMIN_PASSWORD  — admin panel password (required)
 *   ADMIN_USERNAME  — admin panel username (optional)
 *   API_URL         — full base URL of the running API server
 *                     (default: http://localhost:8080/api)
 *
 * This script NEVER runs automatically. It calls the same /admin/experts
 * endpoint used by the admin panel, so all validation and business logic
 * remains identical to manual admin entry.
 */
import crypto from "node:crypto";

if (process.env.NODE_ENV === "production") {
  console.error("ERROR: Seed script must not run in production.");
  process.exit(1);
}

const API_URL = (process.env.API_URL ?? "http://localhost:8080/api").replace(
  /\/+$/,
  "",
);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "";

if (!ADMIN_PASSWORD) {
  console.error("ERROR: ADMIN_PASSWORD environment variable is required.");
  process.exit(1);
}

interface ExpertDef {
  fullName: string;
  email: string;
  avatarUrl: string;
  headline: string;
  expertise: string;
  bio: string;
  yearsExperience: number;
  languages: string;
  sessionMinutes: number;
  availabilityNote: string;
  acceptingSessions: boolean;
  linkedinUrl: string;
  websiteUrl: string;
  featured: boolean;
  sortOrder: number;
}

const TEAM: ExpertDef[] = [
  {
    fullName: "سارة المنصور",
    email: "sarah.almansour@ih-haven.com",
    avatarUrl: "https://i.pravatar.cc/400?img=47",
    headline: "مؤسّسة آيلاند هيفن · رائدة أعمال وصانعة تأثير",
    expertise: "ريادة الأعمال,بناء المشاريع,القيادة والإدارة,جمع التمويل,الاستراتيجية",
    bio: "سارة المنصور مؤسّسة حاضنة آيلاند هيفن وصاحبة خبرة تزيد على خمس عشرة سنة في بناء المشاريع وتطويرها. أسّست ثلاثة مشاريع ناجحة في قطاعات التقنية والتعليم والتجارة الإلكترونية، واستطاعت أن تُحوّل آيلاند هيفن إلى منصّة رائدة لدعم رواد الأعمال الشباب في المنطقة. تؤمن سارة بأن الحاضنة الحقيقية ليست مبنى أو تمويلًا، بل شبكة من الخبرات التي تنمو معًا.",
    yearsExperience: 15,
    languages: "العربية,الإنجليزية",
    sessionMinutes: 60,
    availabilityNote: "متاحة أيام الثلاثاء والخميس",
    acceptingSessions: true,
    linkedinUrl: "https://linkedin.com/in/sarah-almansour",
    websiteUrl: "",
    featured: true,
    sortOrder: 1,
  },
  {
    fullName: "محمد الزيد",
    email: "mohammed.alzaid@ih-haven.com",
    avatarUrl: "https://i.pravatar.cc/400?img=12",
    headline: "مستشار نمو واستراتيجية أعمال · مرشد Y Combinator سابقًا",
    expertise: "استراتيجية النمو,نماذج الأعمال,جمع التمويل,التفاوض,الشراكات الاستراتيجية",
    bio: "محمد الزيد مستشار أعمال متمرّس عمل لأكثر من اثنتي عشرة سنة مع أكثر من مئة شركة ناشئة في المنطقة وخارجها. شارك سابقًا في برنامج Y Combinator بصفة مرشد إقليمي، وساعد العشرات من الشركات في الانتقال من مرحلة الفكرة إلى جمع جولات تمويل بمئات الملايين. يُركّز في جلساته على بناء نماذج أعمال قابلة للتوسّع وخطط نمو واقعية قابلة للقياس.",
    yearsExperience: 12,
    languages: "العربية,الإنجليزية,الفرنسية",
    sessionMinutes: 45,
    availabilityNote: "متاح السبت والأحد",
    acceptingSessions: true,
    linkedinUrl: "https://linkedin.com/in/mohammed-alzaid",
    websiteUrl: "",
    featured: true,
    sortOrder: 2,
  },
  {
    fullName: "ليلى الأحمدي",
    email: "layla.alahmadi@ih-haven.com",
    avatarUrl: "https://i.pravatar.cc/400?img=26",
    headline: "خبيرة تسويق رقمي وهوية العلامة التجارية",
    expertise: "التسويق الرقمي,بناء العلامة التجارية,وسائل التواصل الاجتماعي,تجربة المستخدم,المحتوى",
    bio: "ليلى الأحمدي متخصّصة في التسويق الرقمي وبناء هويّة العلامات التجارية للشركات الناشئة. عملت مع أكثر من خمسين علامة تجارية إقليمية ومساعدتها على بناء حضور رقمي فاعل وجماهير متفاعلة. تؤمن ليلى بأن القصّة الصادقة هي أقوى أداة تسويقية، وتساعد روّاد الأعمال على صياغة روايتهم وتحويلها إلى محتوى يبني ثقة العملاء.",
    yearsExperience: 8,
    languages: "العربية,الإنجليزية",
    sessionMinutes: 45,
    availabilityNote: "متاحة الاثنين والأربعاء",
    acceptingSessions: true,
    linkedinUrl: "https://linkedin.com/in/layla-alahmadi",
    websiteUrl: "",
    featured: false,
    sortOrder: 3,
  },
  {
    fullName: "كريم بن يوسف",
    email: "karim.benyousef@ih-haven.com",
    avatarUrl: "https://i.pravatar.cc/400?img=7",
    headline: "مدير منتج ومستشار تقني · مؤسّس مشارك لمنصّة SaaS ناجحة",
    expertise: "تطوير المنتجات,هندسة البرمجيات,منهجية Agile,تقنيات السحاب,الذكاء الاصطناعي",
    bio: "كريم بن يوسف مهندس ومدير منتج جمع بين الخلفية التقنية العميقة ورؤية الأعمال الاستراتيجية. أسّس مشاريع برمجية ناجحة في قطاعي الفينتك والتعليم الرقمي، وانضمّ لاحقًا إلى آيلاند هيفن لمساعدة الشركات التقنية على تحسين منتجاتها وتسريع دورة التطوير. يُعدّ الخبير المفضّل للمؤسّسين الذين يحتاجون إلى توجيه تقني في مراحل البناء الأولى.",
    yearsExperience: 10,
    languages: "العربية,الفرنسية,الإنجليزية",
    sessionMinutes: 60,
    availabilityNote: "متاح الثلاثاء والجمعة",
    acceptingSessions: true,
    linkedinUrl: "https://linkedin.com/in/karim-benyousef",
    websiteUrl: "",
    featured: false,
    sortOrder: 4,
  },
  {
    fullName: "نورة الراشد",
    email: "noura.alrashid@ih-haven.com",
    avatarUrl: "https://i.pravatar.cc/400?img=49",
    headline: "مستشارة قانونية ومالية للشركات الناشئة",
    expertise: "القانون التجاري,الهياكل القانونية,الاتفاقيات,الملكية الفكرية,التخطيط المالي",
    bio: "نورة الراشد محامية تجارية متخصّصة في خدمة الشركات الناشئة والمشاريع الريادية. تساعد المؤسّسين على فهم الهياكل القانونية المناسبة لمشاريعهم، وصياغة اتفاقيات الشراكة والمستثمرين، وحماية الملكية الفكرية. أنقذت أكثر من ثلاثين شركة ناشئة من أخطاء قانونية مكلفة كان يمكن تجنّبها بتخطيط مبكّر.",
    yearsExperience: 9,
    languages: "العربية,الإنجليزية",
    sessionMinutes: 45,
    availabilityNote: "متاحة الأحد والثلاثاء",
    acceptingSessions: true,
    linkedinUrl: "https://linkedin.com/in/noura-alrashid",
    websiteUrl: "",
    featured: false,
    sortOrder: 5,
  },
  {
    fullName: "طارق العمري",
    email: "tarek.alomari@ih-haven.com",
    avatarUrl: "https://i.pravatar.cc/400?img=52",
    headline: "مرشد دولي في الأسواق الناشئة وبناء الشراكات العالمية",
    expertise: "التوسّع الدولي,بناء الشراكات,الأسواق الناشئة,إدارة المستثمرين,الدبلوماسية التجارية",
    bio: "طارق العمري متخصّص في مساعدة الشركات الناشئة العربية على الخروج إلى الأسواق الدولية. عمل لأكثر من ثلاث عشرة سنة بين المنطقة العربية وأوروبا وجنوب شرق آسيا، وأقام شراكات استراتيجية لأكثر من أربعين شركة. يُرشد طارق المؤسّسين على فهم ثقافات الأسواق المختلفة وبناء شبكة علاقات حقيقية تُسرّع النموّ خارج الحدود.",
    yearsExperience: 13,
    languages: "العربية,الإنجليزية,التركية",
    sessionMinutes: 60,
    availabilityNote: "متاح الاثنين والخميس",
    acceptingSessions: true,
    linkedinUrl: "https://linkedin.com/in/tarek-alomari",
    websiteUrl: "",
    featured: false,
    sortOrder: 6,
  },
];

async function apiPost(
  path: string,
  body: unknown,
  token?: string,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  console.log(`Connecting to API at ${API_URL}…`);

  const loginRes = await apiPost("/admin/login", {
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD,
  });

  if (!loginRes.ok) {
    console.error("Login failed:", loginRes.data);
    process.exit(1);
  }

  const token = (loginRes.data as { token?: string }).token;
  if (!token) {
    console.error("No token in login response.");
    process.exit(1);
  }

  console.log("Admin login successful.\n");
  let created = 0;
  let skipped = 0;

  for (const expert of TEAM) {
    const password = crypto.randomBytes(16).toString("base64url");

    const res = await apiPost(
      "/admin/experts",
      {
        fullName: expert.fullName,
        email: expert.email,
        password,
        avatarUrl: expert.avatarUrl,
        profile: {
          headline: expert.headline,
          expertise: expert.expertise,
          bio: expert.bio,
          yearsExperience: expert.yearsExperience,
          languages: expert.languages,
          sessionMinutes: expert.sessionMinutes,
          availabilityNote: expert.availabilityNote,
          acceptingSessions: expert.acceptingSessions,
          linkedinUrl: expert.linkedinUrl,
          websiteUrl: expert.websiteUrl,
          status: "active",
          featured: expert.featured,
          sortOrder: expert.sortOrder,
        },
      },
      token,
    );

    if (res.status === 409) {
      console.log(`  — ${expert.fullName} (already exists, skipped)`);
      skipped++;
    } else if (res.ok) {
      console.log(`  ✓ ${expert.fullName}`);
      created++;
    } else {
      console.error(`  ✗ ${expert.fullName} failed:`, res.data);
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}.`);
  console.log("Edit profiles anytime via /admin/experts.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
