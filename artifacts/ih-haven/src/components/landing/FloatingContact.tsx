import { useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const WHATSAPP = "https://wa.me/972567536815";

/**
 * FloatingContact — a persistent, on-brand WhatsApp pill (start-aligned bottom
 * corner) that fades in after the user scrolls past the hero and hides near the
 * footer. Brand crimson (cta-fill) with a warm gold "available" dot. Reuses the
 * scroll-visibility pattern from the former FloatingLivePill. RTL-safe.
 */
export function FloatingContact() {
  const { t } = useLanguage();
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const max = document.documentElement.scrollHeight - window.innerHeight - 520;
    // Hide while the projects section is in view — its per-card "Case study" CTAs
    // sit in the same bottom-start corner and the pill must never overlap them.
    let overProjects = false;
    const el = document.getElementById("ventures-band");
    if (el) {
      const r = el.getBoundingClientRect();
      overProjects = r.top < window.innerHeight * 0.9 && r.bottom > window.innerHeight * 0.25;
    }
    setVisible(latest > 700 && latest < max && !overProjects);
  });

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href={WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="floating-whatsapp"
          initial={{ y: 16, scale: 0.9, opacity: 0 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          aria-label={t({ ar: "تواصل معنا عبر واتساب", en: "Contact us on WhatsApp" })}
          className="group fixed bottom-6 start-5 z-40 inline-flex items-center gap-2.5 h-12 ps-3 pe-4 rounded-full cta-fill shadow-[0_18px_48px_-12px_hsl(354_82%_35%/0.6)] hover:-translate-y-0.5 transition-transform duration-300"
        >
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
            <MessageCircle className="h-4 w-4" />
            <span className="absolute -top-0.5 -end-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sand opacity-80" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sand-bright ring-2 ring-[hsl(var(--primary-cta))]" />
            </span>
          </span>
          <span className="text-[13.5px] font-bold">{t({ ar: "تواصل معنا", en: "Chat with us" })}</span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
