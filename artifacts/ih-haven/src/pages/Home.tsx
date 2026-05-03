import { useEffect } from "react";
import { usePageView } from "@/hooks/use-tracking";
import { Header } from "@/components/landing/Header";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { Hero } from "@/components/landing/Hero";
import { Audience } from "@/components/landing/Audience";
import { HoursLocation } from "@/components/landing/HoursLocation";
import { Footer } from "@/components/landing/Footer";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { NewsSlider } from "@/components/landing/NewsSlider";
import { NumbersBand } from "@/components/landing/NumbersBand";
import { AdminShortcut } from "@/components/landing/AdminShortcut";

export default function Home() {
  usePageView("/");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const y = params.get("y");
    if (y) {
      const n = parseInt(y, 10);
      if (!Number.isNaN(n)) {
        const tries = [250, 500, 900, 1400];
        tries.forEach((t) =>
          setTimeout(() => window.scrollTo({ top: n, behavior: "auto" }), t),
        );
      }
    }
  }, []);
  return (
    <div className="min-h-screen bg-background font-sans antialiased relative">
      <SmoothScroll />
      <ScrollProgress />
      <Header />
      <div className="relative z-10">
        <Hero />
        <NewsSlider />
        <NumbersBand />
        <Audience />
        <HoursLocation />
      </div>
      <Footer />
      <AdminShortcut />
    </div>
  );
}
