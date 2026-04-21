import { useState } from "react";
import { useLocation } from "wouter";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api("/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setLocation("/admin");
    } catch (e) {
      if (e instanceof ApiError) setError(e.message || "فشل تسجيل الدخول");
      else setError("فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-[#f6f1e7] px-6"
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-sm space-y-5"
      >
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold">لوحة الإدارة</h1>
          <p className="text-sm text-gray-500 mt-1">آيلاند هيفن</p>
        </div>
        <div>
          <Label htmlFor="password">كلمة السرّ</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            className="mt-2"
            data-testid="input-password"
            dir="ltr"
          />
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white hover:bg-black/90"
          data-testid="button-login"
        >
          {loading ? "..." : "دخول"}
        </Button>
      </form>
    </div>
  );
}
