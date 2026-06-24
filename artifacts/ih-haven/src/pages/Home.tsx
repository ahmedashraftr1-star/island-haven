import { useEffect, lazy, Suspense } from "react";
// Above-the-fold: eager so the hero paints immediately.
import { Header } from "@/components/landing/Header";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { Hero } from "@/components/landing/Hero";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { NumbersBand } from "@/components/landing/NumbersBand";

// Below-the-fold: code-split (scroll-revealed, so a null fallback is invisible).
const named = <K extends string>(p: Promise<Record<K, React.ComponentType>>, k: K) =>
  p.then((m) => ({ default: m[k] }));
const Partners = lazy(() => named(import("@/components/landing/Partners"), "Partners"));
const WhatYouGet = lazy(() => named(import("@/components/landing/WhatYouGet"), "WhatYouGet"));
const VenturesBand = lazy(() => named(import("@/components/landing/VenturesBand"), "VenturesBand"));
const ExpertsBand = lazy(() => named(import("@/components/landing/ExpertsBand"), "ExpertsBand"));
const Audience = lazy(() => named(import("@/components/landing/Audience"), "Audience"));
const SuccessStories = lazy(() => named(import("@/components/landing/SuccessStories"), "SuccessStories"));
const NewsSlider = lazy(() => named(import("@/components/landing/NewsSlider"), "NewsSlider"));
const HoursLocation = lazy(() => named(import("@/components/landing/HoursLocation"), "HoursLocation"));
const ApplyProcess = lazy(() => named(import("@/components/landing/ApplyProcess"), "ApplyProcess"));
const Campaign = lazy(() => named(import("@/components/landing/Campaign"), "Campaign"));
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
        {/* World-class incubator IA: promise → proof → what you get → portfolio
            → mentors → who it's for → stories → news → location → how to join → support → apply */}
        <Hero />
        <NumbersBand />
        <Suspense fallback={null}>
          <Partners />
          <WhatYouGet />
          <VenturesBand />
          <ExpertsBand />
          <Audience />
          <SuccessStories />
          <NewsSlider />
          <HoursLocation />
          <ApplyProcess />
          <Campaign />
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
