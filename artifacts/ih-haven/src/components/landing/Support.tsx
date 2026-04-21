import { motion } from "framer-motion";
import { Heart, Share2, Map } from "lucide-react";

export function Support() {
  return (
    <section id="support" className="py-32 bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 mix-blend-multiply">
        <img src="/images/sky.png" alt="سماء غزة" className="w-full h-full object-cover" />
      </div>
      
      <div className="container relative z-10 mx-auto px-6 lg:px-8 max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-8">كن جزءاً من الملاذ</h2>
          <p className="text-xl md:text-2xl text-primary-foreground/90 font-light mb-16 max-w-2xl mx-auto leading-relaxed">
            استمرار هذا المكان يعتمد على التكافل. كل مساهمة تضمن بقاء الأبواب مفتوحة، والضوء مشتعلاً، والأمل حاضراً.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a 
              href="https://nas2nas.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center p-8 rounded-2xl bg-background/10 hover:bg-background/20 transition-colors backdrop-blur-sm border border-primary-foreground/20"
            >
              <Heart className="w-8 h-8 mb-4" />
              <h3 className="text-xl font-bold mb-2">تبرع</h3>
              <p className="text-sm text-primary-foreground/80">عبر موقع من الناس إلى الناس</p>
            </a>
            
            <a 
              href="https://www.instagram.com/ih_haven" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center p-8 rounded-2xl bg-background/10 hover:bg-background/20 transition-colors backdrop-blur-sm border border-primary-foreground/20"
            >
              <Share2 className="w-8 h-8 mb-4" />
              <h3 className="text-xl font-bold mb-2">شارك قصتنا</h3>
              <p className="text-sm text-primary-foreground/80">انشر المبادرة ليعرف عنها الآخرون</p>
            </a>

            <div className="flex flex-col items-center p-8 rounded-2xl bg-background/10 backdrop-blur-sm border border-primary-foreground/20">
              <Map className="w-8 h-8 mb-4" />
              <h3 className="text-xl font-bold mb-2">في غزة؟</h3>
              <p className="text-sm text-primary-foreground/80">المكان مفتوح لاستقبالك يومياً</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
