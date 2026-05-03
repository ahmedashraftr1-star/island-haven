import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Compass } from "lucide-react";
import { useEffect } from "react";
import { HavenMark } from "@/components/landing/HavenMark";

export default function NotFound() {
  useEffect(() => {
    document.title = "صفحة غير موجودة — آيلاند هيفن";
  }, []);

  return (
    <div
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#0A0E1A] text-white flex flex-col"
      style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
    >
      {/* Aura */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.55] pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 50% at 80% 0%, rgba(220,38,55,0.32) 0%, transparent 60%), radial-gradient(50% 40% at 0% 100%, rgba(220,38,55,0.16) 0%, transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <header className="relative z-20 px-5 sm:px-8 lg:px-14 pt-6 sm:pt-8">
        <div className="mx-auto max-w-6xl flex items-center justify-end gap-2.5">
          <HavenMark size={32} strokeColor="hsl(354 80% 60%)" />
          <div className="leading-tight text-right">
            <div className="text-[13px] font-bold tracking-tight">Island Haven</div>
            <div className="text-[10px] text-white/45 tracking-[0.16em] uppercase">آيلاند هيفن</div>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl w-full text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 backdrop-blur-md mb-6">
            <Compass className="w-3 h-3 text-primary" />
            <span className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold">
              404 · ضائع في الأرخبيل
            </span>
          </div>

          <h1
            className="font-bold text-white leading-[1.02] mb-5"
            style={{
              fontSize: "clamp(3.2rem, 12vw, 7rem)",
              letterSpacing: "-0.04em",
            }}
          >
            <span className="text-accent-gradient">٤٠٤</span>
          </h1>

          <p className="text-[20px] sm:text-[24px] font-bold text-white mb-3 leading-tight">
            هذه الصفحة لم تجد طريقها للجزيرة بعد.
          </p>
          <p className="text-white/55 text-[14px] sm:text-[15px] leading-[1.85] mb-9 max-w-md mx-auto">
            ربّما حُذِف الرابط، أو رحل في رحلة طويلة. أمّا نحن، فما زلنا هنا
            ننتظرك في غزّة.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary text-white font-bold text-[13.5px] hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] hover:-translate-y-px transition-all"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              العودة للرئيسيّة
            </Link>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-md text-white font-semibold text-[13.5px] hover:bg-white/[0.1] transition-colors"
            >
              احجز مقعدًا
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
