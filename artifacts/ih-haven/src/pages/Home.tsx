import { useEffect } from "react";
import { usePageView } from "@/hooks/use-tracking";
import { Header } from "@/components/landing/Header";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { Hero } from "@/components/landing/Hero";
import { NumbersArt } from "@/components/landing/NumbersArt";
import { About } from "@/components/landing/About";
import { Audience } from "@/components/landing/Audience";
import { Programs } from "@/components/landing/Programs";
import { Gallery } from "@/components/landing/Gallery";
import { Story } from "@/components/landing/Story";
import { Voices } from "@/components/landing/Voices";
import { HoursLocation } from "@/components/landing/HoursLocation";
import { Support } from "@/components/landing/Support";
import { Footer } from "@/components/landing/Footer";
import { Reveal } from "@/components/landing/Reveal";
import { SmoothScroll } from "@/components/landing/SmoothScroll";

export default function Home() {
  usePageView("/");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const y = params.get("y");
    if (y) {
      const n = parseInt(y, 10);
      if (!Number.isNaN(n)) {
        setTimeout(() => window.scrollTo({ top: n, behavior: "auto" }), 250);
      }
    }
  }, []);
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <SmoothScroll />
      <ScrollProgress />
      <Header />
      <main>
        <Hero />
        <NumbersArt />
        <Reveal as="section"><About /></Reveal>
        <Reveal as="section"><Audience /></Reveal>
        <Reveal as="section"><Programs /></Reveal>
        <Gallery />
        <Voices />
        <Reveal as="section"><Story /></Reveal>
        <Reveal as="section"><HoursLocation /></Reveal>
        <Reveal as="section"><Support /></Reveal>
      </main>
      <Footer />
    </div>
  );
}
