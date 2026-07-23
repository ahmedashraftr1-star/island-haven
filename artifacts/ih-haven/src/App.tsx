import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { usePageVisibility } from "@/hooks/use-public-data";
import PageUnavailable from "@/components/PageUnavailable";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { motion, useReducedMotion, MotionConfig } from "framer-motion";
import { useEffect, Suspense } from "react";
import { lazyWithRetry as lazy } from "@/lib/lazyWithRetry";
import { usePageView } from "@/hooks/use-tracking";
import { useLanguage } from "@/contexts/LanguageContext";
import { CustomCursor } from "@/components/landing/CustomCursor";
import { CommandPalette } from "@/components/CommandPalette";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { RootErrorFallback } from "@/components/RootErrorFallback";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmProvider } from "@/hooks/use-confirm";
import { AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";
// Home is the landing/LCP page — keep it eager. Everything else is route-level
// code-split (own chunk, loaded on navigation) to keep the initial bundle lean.
import Home from "@/pages/Home";
const Apply = lazy(() => import("@/pages/Apply"));
const Book = lazy(() => import("@/pages/Book"));
const Careers = lazy(() => import("@/pages/Careers"));
const Freelancers = lazy(() => import("@/pages/Freelancers"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Profile = lazy(() => import("@/pages/Profile"));
const Courses = lazy(() => import("@/pages/Courses"));
const CourseDetail = lazy(() => import("@/pages/CourseDetail"));
const Works = lazy(() => import("@/pages/Works"));
const WorkDetail = lazy(() => import("@/pages/WorkDetail"));
const WorkEditor = lazy(() => import("@/pages/WorkEditor"));
const Daily = lazy(() => import("@/pages/Daily"));
const DailyDetail = lazy(() =>
  import("@/pages/Daily").then((m) => ({ default: m.DailyDetail })),
);
const Events = lazy(() => import("@/pages/Events"));
const EventDetail = lazy(() =>
  import("@/pages/Events").then((m) => ({ default: m.EventDetail })),
);
const Members = lazy(() => import("@/pages/Members"));
const Membership = lazy(() => import("@/pages/Membership"));
const Impact = lazy(() => import("@/pages/Impact"));
const Hackathon = lazy(() => import("@/pages/Hackathon"));
const Search = lazy(() => import("@/pages/Search"));
const Experts = lazy(() => import("@/pages/Experts"));
const ExpertDetail = lazy(() => import("@/pages/ExpertDetail"));
const ExpertDashboard = lazy(() => import("@/pages/ExpertDashboard"));
const Programs = lazy(() => import("@/pages/Programs"));
const ProgramDetail = lazy(() => import("@/pages/ProgramDetail"));
const Ventures = lazy(() => import("@/pages/Ventures"));
const VentureDetail = lazy(() => import("@/pages/VentureDetail"));
const Opportunities = lazy(() => import("@/pages/Opportunities"));
const OpportunityDetail = lazy(() => import("@/pages/OpportunityDetail"));
const Learning = lazy(() => import("@/pages/Learning"));
const Certificate = lazy(() => import("@/pages/Certificate"));
const Messages = lazy(() => import("@/pages/Messages"));
const TeamInbox = lazy(() => import("@/pages/TeamInbox"));
const RateSession = lazy(() => import("@/pages/RateSession"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const Perks = lazy(() => import("@/pages/Perks"));
const PerkDetail = lazy(() => import("@/pages/PerkDetail"));
const NotificationSettings = lazy(() => import("@/pages/NotificationSettings"));
const Numbers = lazy(() => import("@/pages/Numbers"));
const Verify = lazy(() => import("@/pages/Verify"));
const Gallery = lazy(() => import("@/pages/Gallery"));
const About = lazy(() => import("@/pages/About"));
const Team = lazy(() => import("@/pages/Team"));
const Cohorts = lazy(() => import("@/pages/Cohorts"));
const CohortDetail = lazy(() => import("@/pages/CohortDetail"));
const DemoDay = lazy(() => import("@/pages/DemoDay"));
const Press = lazy(() => import("@/pages/Press"));
const Resources = lazy(() => import("@/pages/Resources"));
const PublicProfile = lazy(() => import("@/pages/PublicProfile"));
const Saved = lazy(() => import("@/pages/Saved"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const Stories = lazy(() => import("@/pages/Stories"));
const Faq = lazy(() => import("@/pages/Faq"));
const Process = lazy(() => import("@/pages/Process"));
const Alumni = lazy(() => import("@/pages/Alumni"));
const Jobs = lazy(() => import("@/pages/Jobs"));
const Investors = lazy(() => import("@/pages/Investors"));
const BecomeMentor = lazy(() => import("@/pages/BecomeMentor"));
const Contact = lazy(() => import("@/pages/Contact"));
const Media = lazy(() => import("@/pages/Media"));
const PartnersPage = lazy(() => import("@/pages/PartnersPage"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogDetail = lazy(() =>
  import("@/pages/Blog").then((m) => ({ default: m.BlogDetail })),
);
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const Visit = lazy(() => import("@/pages/Visit"));
const Support = lazy(() => import("@/pages/Support"));

// Shared cache/dedup layer. Public data (numbers, ventures, …) is fetched ONCE
// per key and reused across every component (see hooks/use-public-data). Retry
// never storms on 4xx (e.g. /attendance/summary 404 on older builds), and backs
// off at most twice on 5xx/network — so repeated requests can't cascade into 503s.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (count, err) => {
        const status = (err as { status?: number } | null)?.status;
        if (typeof status === "number" && status >= 400 && status < 500) return false;
        return count < 2;
      },
    },
  },
});

// Site name — single-language per locale so the <title> never mixes scripts
// (EN → "Island Haven", AR → "آيلاند هيفن"). Resolved against the active locale
// wherever it is appended below.
const SITE_NAME = { ar: "آيلاند هيفن", en: "Island Haven" } as const;

type LocalizedText = { ar: string; en: string };
interface RouteMeta {
  /** Page-specific title (locale-only, no brand — brand is appended below). */
  title: LocalizedText;
  /** Optional meta description (locale-only). */
  description?: LocalizedText;
}

// Locale-aware per-route metadata. `RouteEffects` resolves the active language
// and appends the bilingual brand to the title, so nothing here mixes languages.
const ROUTE_META: Record<string, RouteMeta> = {
  "/": {
    title: { ar: "حاضنة أعمال في غزّة", en: "A startup incubator in Gaza" },
    description: {
      ar: "آيلاند هيفن — مساحة ومجتمع وبرنامج احتضان لروّاد الأعمال في غزّة: إرشاد وخبراء وفرص ومشاريع ناشئة.",
      en: "Island Haven — a space, community, and incubator for founders in Gaza: mentorship, experts, opportunities, and ventures.",
    },
  },
  "/apply": {
    title: { ar: "انتسب", en: "Apply" },
    description: {
      ar: "انضمّ إلى مجتمع آيلاند هيفن — قدّم طلب الانتساب إلى المساحة والبرامج.",
      en: "Join the Island Haven community — apply for a place in the space and its programs.",
    },
  },
  "/book": {
    title: { ar: "احجز مقعدك", en: "Book a seat" },
    description: {
      ar: "احجز مقعدك في مساحة آيلاند هيفن — اختر التاريخ والوقت الذي يناسبك.",
      en: "Book your seat at the Island Haven space — pick the date and time that works for you.",
    },
  },
  "/login": { title: { ar: "تسجيل الدخول", en: "Sign in" } },
  "/register": { title: { ar: "حساب جديد", en: "Create account" } },
  "/profile": { title: { ar: "ملفّي", en: "My profile" } },
  "/members": { title: { ar: "منتسبو المساحة", en: "Members" } },
  "/membership": {
    title: { ar: "مجتمع المواهب", en: "Talent Community" },
    description: {
      ar: "طلابٌ وخرّيجون ومستقلّون من آيلاند هيفن — مطوّرون ومصمّمون ومحلّلو بيانات من غزّة.",
      en: "Students, graduates and freelancers of Island Haven — developers, designers and data analysts from Gaza.",
    },
  },
  "/impact": {
    title: { ar: "أثرنا", en: "Our Impact" },
    description: {
      ar: "أثر آيلاند هيفن بالأرقام — مواهب غزّة التي نحتضنها ونؤهّلها نحو الاقتصاد الرقميّ.",
      en: "Island Haven's impact in numbers — the Gaza talent we incubate toward the digital economy.",
    },
  },
  "/hackathon": {
    title: { ar: "الهاكاثون", en: "Hackathon" },
    description: {
      ar: "هاكاثون آيلاند هيفن — حيث تُبنى الأفكار في أيّام، وتلتقي مواهب غزّة لتصنع الأثر.",
      en: "The Island Haven hackathon — where ideas are built in days and Gaza's talent gathers to make an impact.",
    },
  },
  "/experts": {
    title: { ar: "مرشدو آيلاند", en: "Mentors" },
    description: {
      ar: "خبراء ومرشدون من غزّة والعالم يقدّمون الإرشاد والجلسات لروّاد آيلاند هيفن.",
      en: "Experts and mentors from Gaza and beyond offering guidance and sessions to Island Haven founders.",
    },
  },
  "/become-mentor": { title: { ar: "كُن مرشدًا", en: "Become a mentor" } },
  "/expert": { title: { ar: "لوحة الخبير", en: "Mentor dashboard" } },
  "/programs": { title: { ar: "برامج الاحتضان", en: "Programs" } },
  "/ventures": {
    title: { ar: "المشاريع الناشئة", en: "Ventures" },
    description: {
      ar: "المشاريع الناشئة التي احتضنها آيلاند هيفن — قصص ومقاييس ومسارات نموّ من غزّة.",
      en: "The startups incubated by Island Haven — stories, metrics, and growth journeys from Gaza.",
    },
  },
  "/opportunities": { title: { ar: "الفرص والوظائف", en: "Opportunities" } },
  "/learning": { title: { ar: "التعلّم", en: "Learning" } },
  "/certificate": { title: { ar: "شهادة الإكمال", en: "Certificate" } },
  "/messages": { title: { ar: "الرسائل", en: "Messages" } },
  "/messages/team": { title: { ar: "من الإدارة", en: "From the team" } },
  "/sessions": { title: { ar: "تقييم جلسة", en: "Rate a session" } },
  "/leaderboard": { title: { ar: "الصدارة", en: "Leaderboard" } },
  "/perks": { title: { ar: "العروض والامتيازات", en: "Perks" } },
  "/settings": { title: { ar: "إعدادات الإشعارات", en: "Notification settings" } },
  "/numbers": { title: { ar: "مُجتمعنا بالأرقام", en: "Our community in numbers" } },
  "/verify": {
    title: { ar: "الشرف القابل للتحقّق", en: "Verifiable Honesty" },
    description: {
      ar: "كلّ رقمٍ نعرضه موقّعٌ تشفيريًّا ويتحقّق منه متصفّحك بنفسه. لا تثق بنا — تحقّق منّا.",
      en: "Every number we show is cryptographically signed and verified by your own browser. Don't trust us — verify us.",
    },
  },
  "/stories": { title: { ar: "قصص النجاح", en: "Success stories" } },
  "/faq": { title: { ar: "الأسئلة الشائعة", en: "FAQ" } },
  "/process": { title: { ar: "عمليّة القبول", en: "Admissions process" } },
  "/alumni": { title: { ar: "خرّيجو الحاضنة", en: "Alumni" } },
  "/jobs": { title: { ar: "لوحة الوظائف", en: "Job board" } },
  "/investors": { title: { ar: "المستثمرون والداعمون", en: "Investors & supporters" } },
  "/partners": { title: { ar: "الشركاء", en: "Partners" } },
  "/contact": { title: { ar: "تواصل معنا", en: "Contact us" } },
  "/media": { title: { ar: "الغرفة الإعلاميّة", en: "Media room" } },
  "/blog": { title: { ar: "المدوّنة والرّؤى", en: "Blog & insights" } },
  "/privacy": { title: { ar: "سياسة الخصوصيّة", en: "Privacy policy" } },
  "/terms": { title: { ar: "شروط الاستخدام", en: "Terms of use" } },
  "/gallery": { title: { ar: "معرض الصّور", en: "Gallery" } },
  "/about": { title: { ar: "من نحن", en: "About us" } },
  "/team": { title: { ar: "فريق آيلاند", en: "Our team" } },
  "/cohorts": { title: { ar: "دفعات الاحتضان", en: "Cohorts" } },
  "/press": { title: { ar: "المركز الإعلاميّ", en: "Press & media center" } },
  "/resources": { title: { ar: "دليل الرّائد", en: "Founder resources" } },
  "/courses": { title: { ar: "البرنامج التَّدريبيّ", en: "Courses" } },
  "/works": { title: { ar: "أعمال المنتسبين", en: "Member works" } },
  "/saved": { title: { ar: "المحفوظات", en: "Saved" } },
  "/events": { title: { ar: "فعاليّات آيلاند", en: "Events" } },
  "/admin": { title: { ar: "لوحة التّحكم", en: "Admin dashboard" } },
};

function setMetaDescription(content: string | undefined) {
  const el = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  // Only touch a static <meta name="description"> that already exists; detail
  // pages that render usePageMeta manage their own og/twitter description.
  if (el && content) el.setAttribute("content", content);
}

// Same origin the sitemap/JSON-LD use. Kept here so every route can point its
// canonical + og:url at its own URL instead of all of them canonicalizing to
// the home page (this is a single-URL SPA, so the shell's static tags are root).
const SITE_ORIGIN = "https://island-haven.replit.app";

function setCanonicalUrl(path: string) {
  const clean = path === "" || path === "/" ? "/" : path.replace(/\/+$/, "");
  const url = `${SITE_ORIGIN}${clean}`;
  document
    .querySelector<HTMLLinkElement>('link[rel="canonical"]')
    ?.setAttribute("href", url);
  document
    .querySelector<HTMLMetaElement>('meta[property="og:url"]')
    ?.setAttribute("content", url);
}

// Per-route BreadcrumbList JSON-LD — Home › <section>. Complements the static
// Organization + WebSite graph in index.html so search engines can render a
// breadcrumb trail for internal pages. Removed on the homepage (no trail). Detail
// pages (/experts/:id) show their section crumb; their own title is managed by
// usePageMeta. The <script> is replaced on every navigation.
function setBreadcrumbJsonLd(path: string, lang: "ar" | "en") {
  const id = "breadcrumb-jsonld";
  document.getElementById(id)?.remove();
  const clean = path.replace(/\/+$/, "");
  if (clean === "" || clean === "/") return;
  const seg = clean.split("/").filter(Boolean);
  const topPath = `/${seg[0]}`;
  const meta = ROUTE_META[topPath];
  const crumbs: Array<{ name: string; url: string }> = [
    { name: lang === "ar" ? "الرئيسيّة" : "Home", url: `${SITE_ORIGIN}/` },
  ];
  if (meta) crumbs.push({ name: meta.title[lang], url: `${SITE_ORIGIN}${topPath}` });
  const json = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
  const s = document.createElement("script");
  s.type = "application/ld+json";
  s.id = id;
  s.textContent = JSON.stringify(json);
  document.head.appendChild(s);
}

function RouteEffects() {
  const [loc] = useLocation();
  const { lang } = useLanguage();
  // Global page-view tracking — covers every route (incl. the new pillars)
  // from one place instead of a per-page usePageView call.
  usePageView(loc);
  useEffect(() => {
    const meta =
      ROUTE_META[loc] ?? ROUTE_META[`/${loc.split("/").filter(Boolean)[0] ?? ""}`];
    if (meta) {
      document.title = `${meta.title[lang]} — ${SITE_NAME[lang]}`;
      if (meta.description) setMetaDescription(meta.description[lang]);
    } else {
      document.title = SITE_NAME[lang];
    }
    // Point canonical + og:url at THIS route (detail pages with their own
    // usePageMeta run after and may refine it further).
    setCanonicalUrl(loc);
    setBreadcrumbJsonLd(loc, lang);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [loc, lang]);
  return null;
}

function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-7 h-7 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
    </div>
  );
}

function Router() {
  const [loc] = useLocation();
  const { isHidden, loaded } = usePageVisibility();
  // Owner-hidden pages resolve to a calm "unavailable" screen (never the 404).
  // While visibility loads, `loaded` is false so a visible page never flashes it.
  if (loaded && isHidden(loc)) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <PageUnavailable />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
      <Route path="/" component={Home} />
      <Route path="/apply" component={Apply} />
      <Route path="/book" component={Book} />
      <Route path="/careers" component={Careers} />
      <Route path="/freelancers" component={Freelancers} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/profile" component={Profile} />
      <Route path="/members" component={Members} />
      <Route path="/membership" component={Membership} />
      <Route path="/impact" component={Impact} />
      <Route path="/hackathon" component={Hackathon} />
      <Route path="/search" component={Search} />
      <Route path="/experts" component={Experts} />
      <Route path="/experts/:id" component={ExpertDetail} />
      <Route path="/expert/dashboard" component={ExpertDashboard} />
      <Route path="/programs" component={Programs} />
      <Route path="/programs/:id" component={ProgramDetail} />
      <Route path="/ventures" component={Ventures} />
      <Route path="/ventures/:id" component={VentureDetail} />
      <Route path="/opportunities" component={Opportunities} />
      <Route path="/opportunities/:id" component={OpportunityDetail} />
      <Route path="/learning" component={Learning} />
      <Route path="/certificate/:courseId" component={Certificate} />
      <Route path="/messages/team" component={TeamInbox} />
      <Route path="/messages" component={Messages} />
      <Route path="/sessions/:id/rate" component={RateSession} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/perks" component={Perks} />
      <Route path="/perks/:id" component={PerkDetail} />
      <Route path="/settings/notifications" component={NotificationSettings} />
      <Route path="/numbers" component={Numbers} />
      <Route path="/verify" component={Verify} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/about" component={About} />
      <Route path="/team" component={Team} />
      <Route path="/press" component={Press} />
      <Route path="/cohorts" component={Cohorts} />
      <Route path="/cohorts/:slug/demo-day" component={DemoDay} />
      <Route path="/cohorts/:slug" component={CohortDetail} />
      <Route path="/resources" component={Resources} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:id" component={CourseDetail} />
      <Route path="/works" component={Works} />
      <Route path="/saved" component={Saved} />
      <Route path="/works/new" component={WorkEditor} />
      <Route path="/works/:id/edit" component={WorkEditor} />
      <Route path="/works/:id" component={WorkDetail} />
      <Route path="/events" component={Events} />
      <Route path="/events/:id" component={EventDetail} />
      <Route path="/daily" component={Daily} />
      <Route path="/daily/:id" component={DailyDetail} />
      <Route path="/stories" component={Stories} />
      <Route path="/faq" component={Faq} />
      <Route path="/process" component={Process} />
      <Route path="/alumni" component={Alumni} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/investors" component={Investors} />
      <Route path="/become-mentor" component={BecomeMentor} />
      <Route path="/contact" component={Contact} />
      <Route path="/media" component={Media} />
      <Route path="/partners" component={PartnersPage} />
      <Route path="/visit" component={Visit} />
      <Route path="/support" component={Support} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogDetail} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/notifications" component={NotificationSettings} />
      <Route path="/u/:id" component={PublicProfile} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// The app-level crash boundary, made route-aware: keying its reset on the
// location means a crash on one page clears itself the moment the user
// navigates elsewhere, rather than pinning the fallback until a hard reload.
function RoutedErrorBoundary({ children }: { children: React.ReactNode }) {
  const [loc] = useLocation();
  return (
    <SectionErrorBoundary fallback={<RootErrorFallback />} resetKey={loc}>
      {children}
    </SectionErrorBoundary>
  );
}

// Per-navigation enter transition — a quiet fade + rise keyed on the location,
// so each route arrives with intent (spec's page transition). Enter-only (no
// exit choreography) keeps it robust with lazy/Suspense; reduced-motion → instant.
function AnimatedRoutes() {
  const [loc] = useLocation();
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={loc}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Router />
    </motion.div>
  );
}

function App() {
  return (
    // App-wide reduced-motion: the CSS killswitch only neutralizes CSS animations, so
    // this makes framer-motion's JS/WAAPI animations (transform/layout) honour the OS
    // "reduce motion" preference too — keeping opacity fades but dropping movement.
    <MotionConfig reducedMotion="user">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ConfirmProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <RouteEffects />
            <main id="main-content" tabIndex={-1}>
              {/* App-level safety net: a crash in any route shows a graceful page
                  (reload + home) instead of a white screen — and navigating away
                  recovers, because the boundary resets on route change. */}
              <RoutedErrorBoundary>
                <AnimatedRoutes />
              </RoutedErrorBoundary>
            </main>
            <CustomCursor />
            <CommandPalette />
          </WouterRouter>
          </ConfirmProvider>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
    </MotionConfig>
  );
}

export default App;
