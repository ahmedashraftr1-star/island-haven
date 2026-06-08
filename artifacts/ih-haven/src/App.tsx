import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Apply from "@/pages/Apply";
import Book from "@/pages/Book";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Onboarding from "@/pages/Onboarding";
import Profile from "@/pages/Profile";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import Works from "@/pages/Works";
import WorkDetail from "@/pages/WorkDetail";
import WorkEditor from "@/pages/WorkEditor";
import Daily, { DailyDetail } from "@/pages/Daily";
import Events, { EventDetail } from "@/pages/Events";
import Members from "@/pages/Members";
import Experts from "@/pages/Experts";
import ExpertDetail from "@/pages/ExpertDetail";
import ExpertDashboard from "@/pages/ExpertDashboard";
import Programs from "@/pages/Programs";
import ProgramDetail from "@/pages/ProgramDetail";
import Ventures from "@/pages/Ventures";
import VentureDetail from "@/pages/VentureDetail";
import Numbers from "@/pages/Numbers";
import Gallery from "@/pages/Gallery";
import About from "@/pages/About";
import Team from "@/pages/Team";
import Cohorts from "@/pages/Cohorts";
import CohortDetail from "@/pages/CohortDetail";
import Resources from "@/pages/Resources";
import PublicProfile from "@/pages/PublicProfile";
import AdminDashboard from "@/pages/admin/AdminDashboard";

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
  "/resources": "دليل الرّائد — Island Haven",
  "/courses": "البرنامج التَّدريبيّ — Island Haven",
  "/works": "أعمال المنتسبين — Island Haven",
  "/events": "فعاليّات آيلاند — Island Haven",
  "/admin": "لوحة التّحكم — Island Haven",
};

function RouteEffects() {
  const [loc] = useLocation();
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

function Router() {
  return (
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
      <Route path="/cohorts" component={Cohorts} />
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
