import { useState } from "react";
import { useLocation } from "wouter";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Shield, ArrowLeft } from "lucide-react";

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
      window.location.reload();
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
      className="min-h-screen flex items-center justify-center bg-background px-6 relative overflow-hidden"
    >
      {/* Soft indigo halo background */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, hsl(232 100% 70% / 0.10) 0%, transparent 60%)",
        }}
      />

      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        onSubmit={onSubmit}
        className="relative w-full max-w-md bg-white rounded-3xl p-9 lg:p-10 border border-border shadow-soft-hover"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="tile-soft w-11 h-11 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              لوحة الإدارة
            </h1>
            <p className="text-[12px] text-foreground/55 font-medium">
              Island Haven · آيلاند هيفن
            </p>
          </div>
        </div>

        <div className="h-px bg-border my-7" />

        <div>
          <Label htmlFor="password" className="text-[13px] text-foreground/75 font-medium">
            كلمة السرّ
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            className="mt-2 h-11 rounded-xl border-border bg-white focus-visible:ring-primary/30"
            data-testid="input-password"
            dir="ltr"
          />
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-red-50 border border-red-200 text-red-800 px-3.5 py-2.5 rounded-xl text-[13px]"
          >
            {error}
          </motion.div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="mt-6 w-full h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-soft hover:shadow-soft-hover transition-all"
          data-testid="button-login"
        >
          {loading ? "جارِ التحقّق..." : "دخول إلى اللوحة"}
        </Button>

        <a
          href={import.meta.env.BASE_URL}
          className="mt-6 flex items-center justify-center gap-2 text-[12.5px] text-foreground/55 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          العودة إلى الموقع
        </a>
      </motion.form>
    </div>
  );
}
