import { useEffect, lazy, Suspense } from "react";
// Above-the-fold: eager so the hero paints immediately.
import { Header } from "@/components/landing/Header";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { Hero } from "@/components/landing/Hero";
import { NumbersBand } from "@/components/landing/NumbersBand";
import { CredibilityBar } from "@/components/landing/CredibilityBar";
import { FloatingContact } from "@/components/landing/FloatingContact";
import { ActMarker } from "@/components/landing/ActMarker";
import { NarrativeThread } from "@/components/landing/NarrativeThread";
import { HomeTOC } from "@/components/landing/HomeTOC";
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
      {/* Barely-perceptible material grain — a static fractal-noise veil over the
          dark canvas for a premium "material" depth. aria-hidden, never clickable,
          static (reduced-motion safe), and z-0 so it sits above the background yet
          under the z-10 content. Kept ultra-low opacity: felt, not seen. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 mix-blend-soft-light opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
      <Header />
      <HomeTOC />
      <div className="relative z-10">
        {/* The narrative spine — a whisper-quiet gold thread that draws itself
            down the page with scroll, stitching the 5 acts into one line. It's
            absolutely positioned to span this whole column, sits at z-0 (below
            the section content), is aria-hidden + pointer-events-none, and hides
            below lg. Purely decorative. */}
        <NarrativeThread />
        {/* Deliberate narrative in 5 acts (expert-panel IA). Act markers make the
            "chaptering" (التقسيم) legible; the order (الترتيب) front-loads the WORK,
            pairs each claim with a human voice, then climbs steadily to Apply:
            HOOK & PROOF  →  ٠١ THE WORK  →  ٠٢ WHAT YOU GET  →  ٠٣ PLACE & PEOPLE  →
            ٠٤ JOIN. All sections stay in the unified dark-glass world. */}
        {/* ── Act 0 · Hook & Proof (anchor id observed by HomeTOC) ── */}
        <div id="act-0">
          <Hero />
          <CredibilityBar />
          <NumbersBand />
        </div>
        <SectionErrorBoundary>
          <Suspense fallback={null}>
            {/* ── Act 1 · The Work — the projects, then a founder's voice ── */}
            <ActMarker idx={1} id="act-1" ar="العمل" en="The Work" />
            <VenturesShowcase />
            <SuccessStories />
            {/* ── Act 2 · What You Get — the offer, then the mentors who deliver it ── */}
            <ActMarker idx={2} id="act-2" ar="ما تحصل عليه" en="What you get" />
            <WhatYouGet />
            <ExpertsBand />
            {/* ── Act 3 · The Place & The People — the room, the faces, the reach ── */}
            <ActMarker idx={3} id="act-3" ar="المكان والناس" en="The place & the people" />
            <SeatsBoard />
            <FeaturedMembers />
            <GazaToGlobal />
            {/* ── Act 4 · Join — the living pulse, the path, the door ── */}
            <ActMarker idx={4} id="act-4" ar="انضمّ إلينا" en="Join us" />
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
