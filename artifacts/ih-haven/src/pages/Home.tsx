import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Marquee } from "@/components/landing/Marquee";
import { Impact } from "@/components/landing/Impact";
import { About } from "@/components/landing/About";
import { Audience } from "@/components/landing/Audience";
import { Offerings } from "@/components/landing/Offerings";
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
    <div className="min-h-screen bg-background font-sans selection:bg-primary selection:text-primary-foreground">
      <Header />
      <main>
        <Hero />
        <Marquee />
        <Impact />
        <About />
        <Audience />
        <Offerings />
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
