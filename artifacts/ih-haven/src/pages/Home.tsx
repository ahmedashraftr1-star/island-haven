import { useEffect, lazy, Suspense } from "react";
// Above-the-fold: eager so the hero paints immediately.
import { Header } from "@/components/landing/Header";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { Hero } from "@/components/landing/Hero";
import { NumbersBand } from "@/components/landing/NumbersBand";
import { CredibilityBar } from "@/components/landing/CredibilityBar";
import { FloatingContact } from "@/components/landing/FloatingContact";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";

// Below-the-fold: code-split (scroll-revealed, so a null fallback is invisible).
const named = <K extends string>(p: Promise<Record<K, React.ComponentType>>, k: K) =>
  p.then((m) => ({ default: m[k] }));
// Heroes + their supporting movements (the trimmed 3-hero IA).
const VenturesShowcase = lazy(() => named(import("@/components/landing/VenturesShowcase"), "VenturesShowcase"));
const WhatYouGet = lazy(() => named(import("@/components/landing/WhatYouGet"), "WhatYouGet"));
const SeatsBoard = lazy(() => named(import("@/components/landing/SeatsBoard"), "SeatsBoard"));
const FeaturedMembers = lazy(() => named(import("@/components/landing/FeaturedMembers"), "FeaturedMembers"));
const GazaToGlobal = lazy(() => named(import("@/components/landing/GazaToGlobal"), "GazaToGlobal"));
const ExpertsBand = lazy(() => named(import("@/components/landing/ExpertsBand"), "ExpertsBand"));
const SuccessStories = lazy(() => named(import("@/components/landing/SuccessStories"), "SuccessStories"));
const NewsSlider = lazy(() => named(import("@/components/landing/NewsSlider"), "NewsSlider"));
const ApplyProcess = lazy(() => named(import("@/components/landing/ApplyProcess"), "ApplyProcess"));
const FinalCTA = lazy(() => named(import("@/components/landing/FinalCTA"), "FinalCTA"));
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
        {/* Trimmed IA — 3 heroes (Projects · Live Numbers · Community); the rest
            serves them. Secondary sections moved to their own pages: hours → /visit,
            campaign → /support, FAQ → /faq, the network → /partners.
            Rhythm: Hero(dark) → Trust → Proof → Projects(dark) → What You Get →
            Community(dark) → Mentors → Journal → Apply → Final CTA(dark). */}
        <Hero />
        <CredibilityBar />
        <NumbersBand />
        <SectionErrorBoundary>
          <Suspense fallback={null}>
            <VenturesShowcase />
            <WhatYouGet />
            <SeatsBoard />
            <FeaturedMembers />
            <GazaToGlobal />
            <ExpertsBand />
            <SuccessStories />
            <NewsSlider />
            <ApplyProcess />
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
