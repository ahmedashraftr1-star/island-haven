import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Campaign } from "@/components/landing/Campaign";
import { FloatingContact } from "@/components/landing/FloatingContact";

/**
 * Support — the standalone "help launch the new branch" campaign page. Pulled off
 * the homepage so the ask lives at its own linkable address (/support) instead of
 * competing with the 3 heroes in the middle of the scroll.
 */
export default function Support() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased relative">
      <Header />
      <main className="relative z-10 pt-16">
        <Campaign />
      </main>
      <Footer />
      <FloatingContact />
    </div>
  );
}
