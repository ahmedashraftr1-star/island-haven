import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="/images/workspace.png" 
          alt="مساحة آي إتش" 
          className="w-full h-full object-cover opacity-20 dark:opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background"></div>
      </div>
      
      <div className="container relative z-10 mx-auto px-6 lg:px-8 max-w-5xl">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              مساحة وملاذ في غزة
            </span>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-8 text-foreground">
              نحن ما زلنا هنا،<br />
              <span className="text-primary">وما زلنا نبني.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-12 max-w-2xl font-light">
              في وسط الضجيج، خلقنا زاوية هادئة. مساحة للعمل، للدراسة، للتفكير، ولاستعادة جزء من الحياة الطبيعية.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <a 
                href="#support" 
                className="inline-flex items-center justify-center h-12 px-8 rounded-md bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90"
              >
                كيف تدعمنا
                <ArrowLeft className="ml-2 h-5 w-5 rtl:rotate-180" />
              </a>
              <a 
                href="#story" 
                className="inline-flex items-center justify-center h-12 px-8 rounded-md bg-secondary/20 text-foreground font-medium transition-colors hover:bg-secondary/30"
              >
                قصتنا
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
