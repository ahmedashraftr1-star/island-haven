import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export function Intro() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const skip =
      typeof window !== "undefined" &&
      (window.location.search.includes("nointro") ||
        sessionStorage.getItem("ih_intro_seen"));
    if (skip) {
      setVisible(false);
      return;
    }
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("ih_intro_seen", "1");
      document.body.style.overflow = "";
    }, 2600);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] bg-foreground flex items-center justify-center overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.42, ease: [0.65, 0, 0.35, 1] as const }}
        >
          {/* curtain wipe */}
          <motion.div
            className="absolute inset-0 bg-background"
            initial={{ y: "100%" }}
            animate={{ y: "100%" }}
            exit={{ y: "0%" }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] as const }}
          />

          <div className="relative text-center px-6">
            {/* numbering tag */}
            <motion.div
              initial={{ y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-[10px] tracking-[0.5em] uppercase text-background/60 font-bold mb-8"
            >
              [ N°00 — Island Haven ]
            </motion.div>

            {/* big arabic mark, word by word */}
            <div
              className="font-extrabold text-background leading-[1.05] tracking-tight overflow-hidden"
              style={{
                fontSize: "clamp(3rem, 9vw, 9rem)",
              }}
            >
              <div className="overflow-hidden">
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: [0.65, 0, 0.35, 1] as const }}
                >
                  مساحة <span className="text-primary italic">تتّسع</span>
                </motion.div>
              </div>
              <div className="overflow-hidden">
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.5, delay: 0.45, ease: [0.65, 0, 0.35, 1] as const }}
                >
                  لأحلامك.
                </motion.div>
              </div>
            </div>

            {/* subtitle */}
            <motion.div
              initial={{  }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.42, delay: 1.2 }}
              className="mt-10 flex items-center justify-center gap-4 text-background/70 text-xs tracking-[0.4em] uppercase"
            >
              <span className="block w-10 h-px bg-background/40" />
              Gaza · Palestine · 2024
              <span className="block w-10 h-px bg-background/40" />
            </motion.div>

            {/* progress line */}
            <div className="mt-12 mx-auto w-44 h-px bg-background/15 overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.2, ease: "easeInOut" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
