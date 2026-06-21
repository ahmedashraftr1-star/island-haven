import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface LangToggleProps {
  tone?: "onLight" | "onDark";
}

export function LangToggle({ tone = "onDark" }: LangToggleProps) {
  const { lang, toggleLang } = useLanguage();
  const onLight = tone === "onLight";
  const label = lang === "ar" ? "EN" : "ع";
  const ariaLabel = lang === "ar" ? "Switch to English" : "التبديل للعربية";

  return (
    <button
      onClick={toggleLang}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-full text-[12px] font-bold tracking-wide transition-all duration-200 shrink-0 ${
        onLight
          ? "border border-border bg-white text-foreground hover:border-primary/40 hover:text-primary"
          : "border border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 hover:border-white/35"
      }`}
    >
      <motion.span
        key={lang}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18 }}
      >
        {label}
      </motion.span>
    </button>
  );
}
