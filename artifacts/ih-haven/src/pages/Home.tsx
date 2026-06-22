import { useEffect, lazy, Suspense } from "react";
// Above-the-fold: keep eager so the hero paints immediately.
import { Header } from "@/components/landing/Header";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { Hero } from "@/components/landing/Hero";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { Marquee } from "@/components/landing/Marquee";
import { NumbersBand } from "@/components/landing/NumbersBand";

// Below-the-fold: code-split so they don't block first paint. They're all
// scroll-revealed, so a null fallback is invisible to the user.
const named = <K extends string>(p: Promise<Record<K, React.ComponentType>>, k: K) =>
  p.then((m) => ({ default: m[k] }));
const NewsSlider = lazy(() => named(import("@/components/landing/NewsSlider"), "NewsSlider"));
const Scrollytelling = lazy(() => named(import("@/components/landing/Scrollytelling"), "Scrollytelling"));
const Audience = lazy(() => named(import("@/components/landing/Audience"), "Audience"));
const WordWindow = lazy(() => named(import("@/components/landing/WordWindow"), "WordWindow"));
const ExpertsBand = lazy(() => named(import("@/components/landing/ExpertsBand"), "ExpertsBand"));
const SpotlightReveal = lazy(() => named(import("@/components/landing/SpotlightReveal"), "SpotlightReveal"));
const Voices = lazy(() => named(import("@/components/landing/Voices"), "Voices"));
const SuccessStories = lazy(() => named(import("@/components/landing/SuccessStories"), "SuccessStories"));
const GazaPulseMap = lazy(() => named(import("@/components/landing/GazaPulseMap"), "GazaPulseMap"));
const HoursLocation = lazy(() => named(import("@/components/landing/HoursLocation"), "HoursLocation"));
const Campaign = lazy(() => named(import("@/components/landing/Campaign"), "Campaign"));
const Partners = lazy(() => named(import("@/components/landing/Partners"), "Partners"));
const BecomeMentorBand = lazy(() => named(import("@/components/landing/BecomeMentorBand"), "BecomeMentorBand"));
const NewsletterBand = lazy(() => named(import("@/components/landing/NewsletterBand"), "NewsletterBand"));
const Footer = lazy(() => named(import("@/components/landing/Footer"), "Footer"));
const AdminShortcut = lazy(() => named(import("@/components/landing/AdminShortcut"), "AdminShortcut"));

export default function Home() {
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
        <Marquee />
        <NumbersBand />
        <Suspense fallback={null}>
          <NewsSlider />
          <Scrollytelling />
          <Audience />
          <WordWindow />
          <ExpertsBand />
          <SpotlightReveal />
          <Voices />
          <SuccessStories />
          <GazaPulseMap />
          <HoursLocation />
          <Campaign />
          <Partners />
          <BecomeMentorBand />
          <NewsletterBand />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <Footer />
        <AdminShortcut />
      </Suspense>
    </div>
  );
}
