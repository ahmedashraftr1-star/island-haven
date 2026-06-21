import { useEffect } from "react";
import { Header } from "@/components/landing/Header";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { About as AboutSection } from "@/components/landing/About";
import { Story } from "@/components/landing/Story";
import { Support } from "@/components/landing/Support";
import { Footer } from "@/components/landing/Footer";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { useLanguage } from "@/contexts/LanguageContext";

export default function About() {
  const { lang, t } = useLanguage();

  useEffect(() => {
    document.title = t({ ar: "من نحن — آيلاند هيفن", en: "About Us — Island Haven" });
  }, [lang, t]);

  return (
    <div className="min-h-screen bg-background font-sans antialiased relative">
      <SmoothScroll />
      <ScrollProgress />
      <Header />
      <div className="relative z-10 pt-20">
        <AboutSection />
        <Story />
        <Support />
      </div>
      <Footer />
    </div>
  );
}
