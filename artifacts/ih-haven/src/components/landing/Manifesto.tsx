import { motion } from "framer-motion";

export function Manifesto() {
  return (
    <section className="py-32 lg:py-40 bg-foreground text-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container relative mx-auto px-6 lg:px-10 max-w-7xl">
        <div className="grid grid-cols-12 gap-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="col-span-12 md:col-span-3 md:order-2"
          >
            <div className="text-[10px] tracking-[0.4em] uppercase text-primary font-bold mb-3">
              [ N°02 — البيان ]
            </div>
            <div className="md:sticky md:top-32">
              <div className="text-sm text-background/60 font-light leading-relaxed border-r-2 border-primary pr-4">
                ليس شعاراً نُعلّقه على الجدار. هذه قاعدة العمل اليوميّة، وهي ما يُبقي
                أبواب المساحة مفتوحة، وأيدي المنتسبين على لوحات المفاتيح.
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="col-span-12 md:col-span-9"
          >
            <h2
              className="font-extrabold text-background leading-[1.1] tracking-tight"
              style={{
                fontFamily: "Cairo, sans-serif",
                fontSize: "clamp(2.5rem, 7vw, 7rem)",
              }}
            >
              نُؤمن أنّ <span className="text-primary italic">المعرفة</span>،
              <br />
              و<span className="text-primary italic">الخبرة</span>،
              و<span className="text-primary italic">التعاون</span>
              <br />
              قادرة على بناء مستقبل،
              <br />
              <span className="text-background/40">حتى في أصعب الظروف.</span>
            </h2>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
