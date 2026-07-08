import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ar" | "en";

interface LanguageContextValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  toggleLang: () => void;
  t: (bi: { ar: string; en: string }) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "ar",
  dir: "rtl",
  toggleLang: () => {},
  t: (bi) => bi.ar,
});

const STORAGE_KEY = "ih-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "ar") return stored;
    } catch {}
    return "ar";
  });

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    // Keep the static (pre-React) skip-link in the active language too, so a
    // runtime toggle never leaves stray text from the other locale on the page.
    const skip = document.querySelector<HTMLElement>("[data-i18n-skip]");
    if (skip) skip.textContent = lang === "ar" ? "تخطّى إلى المحتوى" : "Skip to content";
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }, [lang, dir]);

  function toggleLang() {
    setLang((prev) => (prev === "ar" ? "en" : "ar"));
  }

  function t(bi: { ar: string; en: string }) {
    return lang === "ar" ? bi.ar : bi.en;
  }

  return (
    <LanguageContext.Provider value={{ lang, dir, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
