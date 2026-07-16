import { AlertTriangle, RotateCcw, Home } from "lucide-react";

/**
 * RootErrorFallback — the graceful full-page fallback for the app-level error
 * boundary. If any route component throws, the user sees this on-brand page (a
 * reload + a way home) instead of a white screen. Deliberately context-free and
 * token-only so it renders even if something upstream is broken; bilingual text is
 * shown side by side (the boundary can't safely read the language context here).
 */
export function RootErrorFallback() {
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-16"
      style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
    >
      <div className="max-w-md w-full text-center">
        <div className="mb-7 inline-flex items-center justify-center text-primary">
          <AlertTriangle className="w-10 h-10" strokeWidth={1.8} aria-hidden />
        </div>
        <h1 className="font-display text-foreground text-[26px] lg:text-[30px] leading-tight mb-3" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
          حدث خطأٌ غير متوقّع
        </h1>
        <p className="text-fg-secondary text-[14.5px] leading-[1.85] mb-2">
          نعتذر — واجهت الصفحة مشكلةً غير متوقّعة. حاوِل إعادة التحميل، أو عُد إلى الرئيسيّة.
        </p>
        <p className="text-muted-foreground text-[12.5px] leading-relaxed mb-8" lang="en" dir="ltr">
          Something went wrong. Please reload, or head back home.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="cta-fill inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[13.5px] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <RotateCcw className="w-4 h-4" aria-hidden />
            إعادة التحميل
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border-strong text-[13.5px] font-semibold text-foreground/85 hover:text-foreground hover:border-primary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Home className="w-4 h-4" aria-hidden />
            الرئيسيّة
          </a>
        </div>
      </div>
    </div>
  );
}

export default RootErrorFallback;
