import { motion } from "framer-motion";

export function Manifesto() {
  return (
    <section className="py-28 bg-secondary/5 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{
        backgroundImage:
          "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />

      <div className="container relative mx-auto px-6 lg:px-8 max-w-4xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="text-sm font-medium text-primary tracking-[0.3em] uppercase mb-6"
        >
          Island Haven
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.25] mb-8"
          style={{ fontFamily: "Cairo, sans-serif" }}
        >
          نُؤمن أنّ المعرفة، والخبرة، والتعاون
          <br />
          <span className="text-primary">قادرة على بناء مستقبل،</span>
          <br />
          حتى في أصعب الظروف.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-base md:text-lg text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto"
        >
          هذه ليست شعاراً نُعلّقه على الجدار. هذه قاعدة العمل اليوميّة، وهي ما يُبقي
          أبواب المساحة مفتوحة، وأيدي المنتسبين على لوحات المفاتيح.
        </motion.p>
      </div>
    </section>
  );
}
