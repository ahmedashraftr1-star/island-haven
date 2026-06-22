import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Lang = "ar" | "en";

interface LanguageState {
  lang: Lang;
  /** Resolve a bilingual pair to the active language. */
  t: (bi: { ar: string; en: string }) => string;
  /** Localized numeral: Arabic-Indic in AR, Western in EN. */
  num: (n: number | string) => string;
  toggleLang: () => void;
  setLang: (l: Lang) => void;
}

const STORAGE_KEY = "ih-lang";

const Ctx = createContext<LanguageState>({
  lang: "ar",
  t: (bi) => bi.ar,
  num: (n) => toArabicNum(n),
  toggleLang: () => {},
  setLang: () => {},
});

function toArabicNum(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  // Restore persisted choice on mount.
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (alive && (v === "ar" || v === "en")) setLangState(v);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === "ar" ? "en" : "ar";
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<LanguageState>(
    () => ({
      lang,
      t: (bi) => (lang === "ar" ? bi.ar : bi.en),
      num: (n) => (lang === "ar" ? toArabicNum(n) : String(n)),
      toggleLang,
      setLang,
    }),
    [lang, toggleLang, setLang],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLanguage(): LanguageState {
  return useContext(Ctx);
}
