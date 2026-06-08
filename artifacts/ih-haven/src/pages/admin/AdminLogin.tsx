import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { api, ApiError } from "@/lib/api";
import { motion } from "framer-motion";
import { Shield, ArrowLeft, Lock, KeyRound, Loader2, User } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const tick = () => {
      const t = new Date().toLocaleTimeString("en-GB", {
        timeZone: "Asia/Gaza",
        hour: "2-digit",
        minute: "2-digit",
      });
      setNow(t);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api("/admin/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setLocation("/admin");
      window.location.reload();
    } catch (e) {
      if (e instanceof ApiError) setError(e.message || "كلمة السرّ غير صحيحة");
      else setError("تعذّر الاتّصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen relative overflow-hidden bg-[#0A0E1A] text-white flex items-center justify-center px-6"
    >
      {/* Layer 1 — photo underlay */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}photos/IMG_8347.webp)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(8px) saturate(0.7)",
        }}
      />

      {/* Layer 2 — dual nebulas */}
      <div
        aria-hidden
        className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(354 70% 52% / 0.32) 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
      />
      <div
        aria-hidden
        className="absolute -bottom-60 -left-40 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(195 100% 60% / 0.18) 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
      />

      {/* Layer 3 — fine grid texture */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Top-left status bar — premium signal */}
      <div className="absolute top-6 right-6 lg:top-8 lg:right-10 flex items-center gap-3 text-[11px] tracking-[0.2em] uppercase font-semibold text-white/55">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Secure channel</span>
        </div>
        <span className="w-px h-3 bg-white/20" />
        <span className="tabular-nums">Gaza · {now}</span>
      </div>

      {/* Top-right back link */}
      <a
        href={import.meta.env.BASE_URL}
        className="absolute top-6 left-6 lg:top-8 lg:left-10 flex items-center gap-2 text-[12px] font-semibold text-white/65 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
        العودة إلى الموقع
      </a>

      {/* Glass card */}
      <motion.form
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        onSubmit={onSubmit}
        className="relative w-full max-w-[440px] rounded-[32px] overflow-hidden"
        style={{
          background: "rgba(15, 20, 38, 0.55)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow:
            "0 40px 100px -24px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.4)",
        }}
      >
        {/* Diagonal refraction gradient */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-90"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 35%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.04) 100%)",
          }}
        />

        <div className="relative p-9 lg:p-11">
          {/* Logo block */}
          <div className="flex items-center gap-3 mb-1">
            <div
              className="relative w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, hsl(354 70% 58%), hsl(354 70% 42%))",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.3), 0 8px 22px -6px hsl(354 70% 40% / 0.7)",
              }}
            >
              <Shield className="w-5 h-5 text-white" strokeWidth={2.4} />
            </div>
            <div>
              <div className="text-[10px] tracking-[0.24em] uppercase text-white/45 font-semibold">
                Restricted area
              </div>
              <h1 className="text-[20px] font-bold text-white tracking-tight leading-tight">
                لوحة الإدارة
              </h1>
            </div>
          </div>

          <p className="text-[13px] text-white/60 leading-relaxed mt-5">
            هذه المنطقة مخصّصة لفريق إدارة آيلاند هيفن.
            <br />
            أدخل كلمة السرّ للمتابعة إلى لوحة التحكّم.
          </p>

          <div className="h-px bg-white/10 my-7" />

          {/* Username input */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2.5">
              <label
                htmlFor="username"
                className="text-[11px] tracking-[0.2em] uppercase text-white/55 font-semibold"
              >
                اسم المستخدم · Username
              </label>
              <User className="w-3.5 h-3.5 text-white/35" />
            </div>
            <div className="relative">
              <input
                ref={inputRef}
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                dir="ltr"
                autoComplete="username"
                data-testid="input-username"
                placeholder="ahmedashraf"
                className="w-full h-12 rounded-xl px-4 text-[15px] font-mono tracking-wider text-white placeholder-white/25 outline-none transition-all"
                style={{
                  background: "rgba(0,0,0,0.32)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow:
                    "inset 0 1px 0 rgba(0,0,0,0.4), inset 0 -1px 0 rgba(255,255,255,0.05)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "hsl(354 70% 60% / 0.6)";
                  e.currentTarget.style.boxShadow =
                    "inset 0 1px 0 rgba(0,0,0,0.4), 0 0 0 4px hsl(354 70% 50% / 0.18)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  e.currentTarget.style.boxShadow =
                    "inset 0 1px 0 rgba(0,0,0,0.4), inset 0 -1px 0 rgba(255,255,255,0.05)";
                }}
              />
              <User className="absolute top-1/2 -translate-y-1/2 left-3.5 w-3.5 h-3.5 text-white/35" />
            </div>
          </div>

          {/* Password input */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label
                htmlFor="password"
                className="text-[11px] tracking-[0.2em] uppercase text-white/55 font-semibold"
              >
                كلمة السرّ · Passphrase
              </label>
              <KeyRound className="w-3.5 h-3.5 text-white/35" />
            </div>
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
                autoComplete="current-password"
                data-testid="input-password"
                placeholder="••••••••••••"
                className="w-full h-12 rounded-xl px-4 text-[15px] font-mono tracking-wider text-white placeholder-white/25 outline-none transition-all"
                style={{
                  background: "rgba(0,0,0,0.32)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow:
                    "inset 0 1px 0 rgba(0,0,0,0.4), inset 0 -1px 0 rgba(255,255,255,0.05)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "hsl(354 70% 60% / 0.6)";
                  e.currentTarget.style.boxShadow =
                    "inset 0 1px 0 rgba(0,0,0,0.4), 0 0 0 4px hsl(354 70% 50% / 0.18)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  e.currentTarget.style.boxShadow =
                    "inset 0 1px 0 rgba(0,0,0,0.4), inset 0 -1px 0 rgba(255,255,255,0.05)";
                }}
              />
              <Lock className="absolute top-1/2 -translate-y-1/2 left-3.5 w-3.5 h-3.5 text-white/35" />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-start gap-2.5 px-3.5 py-3 rounded-xl text-[13px] text-rose-200"
              style={{
                background: "rgba(244, 63, 94, 0.14)",
                border: "1px solid rgba(244, 63, 94, 0.28)",
              }}
            >
              <span className="w-1 h-1 rounded-full bg-rose-400 mt-2 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !password}
            data-testid="button-login"
            className="mt-7 w-full h-12 rounded-xl text-[14px] font-semibold text-white transition-all relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background:
                "linear-gradient(135deg, hsl(354 70% 58%), hsl(354 70% 46%))",
              boxShadow:
                "0 12px 30px -8px hsl(354 70% 40% / 0.7), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.2)",
            }}
          >
            <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
            <span className="relative flex items-center justify-center gap-2.5">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جارِ التحقّق...
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  دخول إلى اللوحة
                </>
              )}
            </span>
          </button>

          {/* Footer hints */}
          <div className="mt-7 pt-5 border-t border-white/8 flex items-center justify-between text-[10.5px] tracking-[0.18em] uppercase font-semibold text-white/35">
            <span>Island Haven</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              v1.0 · admin
            </span>
          </div>
        </div>
      </motion.form>

      {/* Caption below */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-white/35 font-medium">
        محميّ بـ HMAC · جلسة آمنة لـ ٧ أيّام
      </div>
    </div>
  );
}
