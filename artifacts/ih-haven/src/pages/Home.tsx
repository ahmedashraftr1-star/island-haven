import { useEffect, lazy, Suspense } from "react";
// Above-the-fold: eager so the hero paints immediately.
import { Header } from "@/components/landing/Header";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { Hero } from "@/components/landing/Hero";
import { Statement } from "@/components/landing/Statement";
import { NumbersBand } from "@/components/landing/NumbersBand";
import { CredibilityBar } from "@/components/landing/CredibilityBar";
import { FloatingContact } from "@/components/landing/FloatingContact";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";

// Below-the-fold: code-split (scroll-revealed, so a null fallback is invisible).
const named = <K extends string>(p: Promise<Record<K, React.ComponentType>>, k: K) =>
  p.then((m) => ({ default: m[k] }));
const Partners = lazy(() => named(import("@/components/landing/Partners"), "Partners"));
const WhatYouGet = lazy(() => named(import("@/components/landing/WhatYouGet"), "WhatYouGet"));
const WhyIslandHaven = lazy(() => named(import("@/components/landing/WhyIslandHaven"), "WhyIslandHaven"));
const HomeFAQ = lazy(() => named(import("@/components/landing/HomeFAQ"), "HomeFAQ"));
const FinalCTA = lazy(() => named(import("@/components/landing/FinalCTA"), "FinalCTA"));
const VenturesShowcase = lazy(() => named(import("@/components/landing/VenturesShowcase"), "VenturesShowcase"));
const ExpertsBand = lazy(() => named(import("@/components/landing/ExpertsBand"), "ExpertsBand"));
const Audience = lazy(() => named(import("@/components/landing/Audience"), "Audience"));
const GazaToGlobal = lazy(() => named(import("@/components/landing/GazaToGlobal"), "GazaToGlobal"));
const SuccessStories = lazy(() => named(import("@/components/landing/SuccessStories"), "SuccessStories"));
const CinematicBand = lazy(() => named(import("@/components/landing/CinematicBand"), "CinematicBand"));
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
      <ScrollProgress />
      <Header />
      <div className="relative z-10">
        {/* World-class incubator IA: promise → proof → what you get → portfolio
            → mentors → who it's for → stories → news → location → how to join → support → apply */}
        <Hero />
        <CredibilityBar />
        <Statement />
        <NumbersBand />
        <SectionErrorBoundary>
          <Suspense fallback={null}>
            <Partners />
            <WhatYouGet />
            <WhyIslandHaven />
            <VenturesShowcase />
            <ExpertsBand />
            <Audience />
            <GazaToGlobal />
            <SuccessStories />
            <CinematicBand />
            <NewsSlider />
            <HoursLocation />
            <ApplyProcess />
            <Campaign />
            <BecomeMentorBand />
            <HomeFAQ />
            <NewsletterBand />
            <FinalCTA />
          </Suspense>
        </SectionErrorBoundary>
      </div>
      <SectionErrorBoundary>
        <Suspense fallback={null}>
          <Footer />
          <AdminShortcut />
        </Suspense>
      </SectionErrorBoundary>
      <FloatingContact />
    </div>
  );
}
