import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Apply from "@/pages/Apply";
import Book from "@/pages/Book";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import Works from "@/pages/Works";
import WorkDetail from "@/pages/WorkDetail";
import WorkEditor from "@/pages/WorkEditor";
import Daily, { DailyDetail } from "@/pages/Daily";
import Events, { EventDetail } from "@/pages/Events";
import Members from "@/pages/Members";
import Numbers from "@/pages/Numbers";
import Gallery from "@/pages/Gallery";
import About from "@/pages/About";
import PublicProfile from "@/pages/PublicProfile";
import AdminDashboard from "@/pages/admin/AdminDashboard";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/apply" component={Apply} />
      <Route path="/book" component={Book} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/profile" component={Profile} />
      <Route path="/members" component={Members} />
      <Route path="/numbers" component={Numbers} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/about" component={About} />
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
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
