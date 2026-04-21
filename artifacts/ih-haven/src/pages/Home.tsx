import { Hero } from "@/components/landing/Hero";
import { About } from "@/components/landing/About";
import { Offerings } from "@/components/landing/Offerings";
import { Programs } from "@/components/landing/Programs";
import { Story } from "@/components/landing/Story";
import { Voices } from "@/components/landing/Voices";
import { HoursLocation } from "@/components/landing/HoursLocation";
import { Support } from "@/components/landing/Support";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary selection:text-primary-foreground">
      <main>
        <Hero />
        <About />
        <Offerings />
        <Programs />
        <Story />
        <Voices />
        <HoursLocation />
        <Support />
      </main>
      <Footer />
    </div>
  );
}
