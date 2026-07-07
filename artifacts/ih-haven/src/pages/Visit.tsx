import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { HoursLocation } from "@/components/landing/HoursLocation";
import { FloatingContact } from "@/components/landing/FloatingContact";

/**
 * Visit — the standalone hours & location page. Pulled off the homepage (which
 * now leads with its 3 heroes) so the practical details live at their own,
 * linkable address without crowding the portfolio/numbers/community.
 */
export default function Visit() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased relative">
      <Header />
      <main className="relative z-10 pt-16">
        <HoursLocation />
      </main>
      <Footer />
      <FloatingContact />
    </div>
  );
}
