import { Header } from "@/components/landing/Header";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { Intro } from "@/components/landing/Intro";
import { CustomCursor } from "@/components/landing/CustomCursor";
import { Grain } from "@/components/landing/Grain";
import { Hero } from "@/components/landing/Hero";
import { Marquee } from "@/components/landing/Marquee";
import { NumbersArt } from "@/components/landing/NumbersArt";
import { About } from "@/components/landing/About";
import { Audience } from "@/components/landing/Audience";
import { Scrollytelling } from "@/components/landing/Scrollytelling";
import { Showcase } from "@/components/landing/Showcase";
import { Programs } from "@/components/landing/Programs";
import { Gallery } from "@/components/landing/Gallery";
import { Manifesto } from "@/components/landing/Manifesto";
import { Story } from "@/components/landing/Story";
import { Campaign } from "@/components/landing/Campaign";
import { Voices } from "@/components/landing/Voices";
import { HoursLocation } from "@/components/landing/HoursLocation";
import { Support } from "@/components/landing/Support";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <Intro />
      <Grain />
      <CustomCursor />
      <ScrollProgress />
      <Header />
      <main>
        <Hero />
        <Marquee />
        <NumbersArt />
        <About />
        <Scrollytelling />
        <Audience />
        <Showcase />
        <Programs />
        <Gallery />
        <Manifesto />
        <Story />
        <Campaign />
        <Voices />
        <HoursLocation />
        <Support />
      </main>
      <Footer />
    </div>
  );
}
