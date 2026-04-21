import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AdminLogin from "./AdminLogin";
import AdminApplications from "./AdminApplications";
import AdminContent from "./AdminContent";
import AdminAnalytics from "./AdminAnalytics";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState("applications");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-me"],
    queryFn: () => api<{ authenticated: boolean }>("/admin/me"),
    staleTime: 5_000,
  });

  useEffect(() => {
    document.title = "لوحة الإدارة — آيلاند هيفن";
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f1e7]">
        <div className="text-gray-500">...</div>
      </div>
    );
  }

  if (!data?.authenticated) return <AdminLogin />;

  async function logout() {
    await api("/admin/logout", { method: "POST" });
    setLocation("/admin");
    window.location.reload();
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#f6f1e7]">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">لوحة الإدارة</h1>
            <p className="text-xs text-gray-500">آيلاند هيفن</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" asChild>
              <Button variant="ghost" size="sm">
                ← الموقع
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              data-testid="button-logout"
            >
              خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="bg-white">
            <TabsTrigger value="applications" data-testid="tab-applications">
              الطلبات
            </TabsTrigger>
            <TabsTrigger value="content" data-testid="tab-content">
              تحرير المحتوى
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              الإحصائيات
            </TabsTrigger>
          </TabsList>
          <TabsContent value="applications">
            <AdminApplications />
          </TabsContent>
          <TabsContent value="content">
            <AdminContent />
          </TabsContent>
          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
