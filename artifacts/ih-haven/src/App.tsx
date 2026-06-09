import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, lazy, Suspense } from "react";
import { usePageView } from "@/hooks/use-tracking";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";
// Home is the landing/LCP page — keep it eager. Everything else is route-level
// code-split (own chunk, loaded on navigation) to keep the initial bundle lean.
import Home from "@/pages/Home";
const Apply = lazy(() => import("@/pages/Apply"));
const Book = lazy(() => import("@/pages/Book"));
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
const Experts = lazy(() => import("@/pages/Experts"));
const ExpertDetail = lazy(() => import("@/pages/ExpertDetail"));
const ExpertDashboard = lazy(() => import("@/pages/ExpertDashboard"));
const Programs = lazy(() => import("@/pages/Programs"));
const ProgramDetail = lazy(() => import("@/pages/ProgramDetail"));
const Ventures = lazy(() => import("@/pages/Ventures"));
const VentureDetail = lazy(() => import("@/pages/VentureDetail"));
const Numbers = lazy(() => import("@/pages/Numbers"));
const Gallery = lazy(() => import("@/pages/Gallery"));
const About = lazy(() => import("@/pages/About"));
const Team = lazy(() => import("@/pages/Team"));
const Cohorts = lazy(() => import("@/pages/Cohorts"));
const CohortDetail = lazy(() => import("@/pages/CohortDetail"));
const DemoDay = lazy(() => import("@/pages/DemoDay"));
const Press = lazy(() => import("@/pages/Press"));
const Resources = lazy(() => import("@/pages/Resources"));
const PublicProfile = lazy(() => import("@/pages/PublicProfile"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));

const queryClient = new QueryClient();

const ROUTE_TITLES: Record<string, string> = {
  "/": "Island Haven · حاضنة أعمال في غزّة",
  "/apply": "انتسب — Island Haven",
  "/book": "احجز مقعد — Island Haven",
  "/login": "تسجيل الدخول — Island Haven",
  "/register": "حساب جديد — Island Haven",
  "/profile": "ملفّي — Island Haven",
  "/members": "منتسبو المساحة — Island Haven",
  "/experts": "خبراء آيلاند — Island Haven",
  "/expert": "لوحة الخبير — Island Haven",
  "/programs": "برامج الاحتضان — Island Haven",
  "/ventures": "المشاريع الناشئة — Island Haven",
  "/numbers": "مُجتمعنا بالأرقام — Island Haven",
  "/gallery": "معرض الصّور — Island Haven",
  "/about": "من نحن — Island Haven",
  "/team": "فريق آيلاند — Island Haven",
  "/cohorts": "دفعات الاحتضان — Island Haven",
  "/press": "المركز الإعلاميّ — Island Haven",
  "/resources": "دليل الرّائد — Island Haven",
  "/courses": "البرنامج التَّدريبيّ — Island Haven",
  "/works": "أعمال المنتسبين — Island Haven",
  "/events": "فعاليّات آيلاند — Island Haven",
  "/admin": "لوحة التّحكم — Island Haven",
};

function RouteEffects() {
  const [loc] = useLocation();
  // Global page-view tracking — covers every route (incl. the new pillars)
  // from one place instead of a per-page usePageView call.
  usePageView(loc);
  useEffect(() => {
    const exact = ROUTE_TITLES[loc];
    if (exact) {
      document.title = exact;
    } else {
      const seg = loc.split("/").filter(Boolean)[0] ?? "";
      const base = ROUTE_TITLES[`/${seg}`];
      document.title = base ?? "Island Haven · آيلاند هيفن";
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [loc]);
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
  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
      <Route path="/" component={Home} />
      <Route path="/apply" component={Apply} />
      <Route path="/book" component={Book} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/profile" component={Profile} />
      <Route path="/members" component={Members} />
      <Route path="/experts" component={Experts} />
      <Route path="/experts/:id" component={ExpertDetail} />
      <Route path="/expert/dashboard" component={ExpertDashboard} />
      <Route path="/programs" component={Programs} />
      <Route path="/programs/:id" component={ProgramDetail} />
      <Route path="/ventures" component={Ventures} />
      <Route path="/ventures/:id" component={VentureDetail} />
      <Route path="/numbers" component={Numbers} />
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
      <Route path="/works/new" component={WorkEditor} />
      <Route path="/works/:id/edit" component={WorkEditor} />
      <Route path="/works/:id" component={WorkDetail} />
      <Route path="/events" component={Events} />
      <Route path="/events/:id" component={EventDetail} />
      <Route path="/daily" component={Daily} />
      <Route path="/daily/:id" component={DailyDetail} />
      <Route path="/u/:id" component={PublicProfile} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <RouteEffects />
            <main id="main-content" tabIndex={-1}>
              <Router />
            </main>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
