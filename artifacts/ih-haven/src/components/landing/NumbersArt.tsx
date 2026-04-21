import { motion } from "framer-motion";

const blocks = [
  {
    number: "٣٩",
    label: "مقعد عمل",
    note: "في الوقت الواحد، بنظام حضور موزّع",
    accent: false,
  },
  {
    number: "٨٠",
    label: "منتسب نشط",
    note: "يدورون أسبوعيّاً على فترات وأيّام",
    accent: true,
  },
  {
    number: "٤٠٪",
    label: "فريلانسر",
    note: "ممارسة فعليّة للعمل الحرّ، خبرة ٣ سنوات+",
    accent: false,
  },
  {
    number: "٤٠٪",
    label: "خريجون",
    note: "تخرّج بين ٢٠٢٠ و٢٠٢٥، يعملون على مهارة",
    accent: false,
  },
  {
    number: "٢٠٪",
    label: "طلبة",
    note: "السنة الجامعيّة الأخيرة، مهارة قيد التطوير",
    accent: false,
  },
  {
    number: "٠$",
    label: "كلفة الانتساب",
    note: "مجانيّ بالكامل، بدعم من «من الناس إلى الناس»",
    accent: true,
  },
];

export function NumbersArt() {
  return (
    <section className="py-28 lg:py-36 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6 lg:px-10 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 lg:mb-24 flex items-end justify-between gap-8 flex-wrap"
        >
          <div className="max-w-xl">
            <div className="text-[10px] tracking-[0.4em] uppercase text-primary font-bold mb-4">
              [ N°03 — بالأرقام ]
            </div>
            <h2
              className="font-black text-foreground leading-[1.05] tracking-tight"
              style={{
                fontFamily: "Cairo, sans-serif",
                fontSize: "clamp(2rem, 5vw, 4rem)",
              }}
            >
              مجتمع يُقاس بأثر،<br />ويُحكى بأرقام.
            </h2>
          </div>
          <p className="text-base text-muted-foreground font-light leading-relaxed max-w-sm">
            هذه ليست مقاعد فحسب — هي وعدٌ بمكان لكلّ من يجدّ ويُتقن.
            ستّة أرقام تُلخّص جوهر التجربة.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-r rtl:border-l rtl:border-r-0 border-foreground/15">
          {blocks.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: (i % 3) * 0.1 }}
              className={`relative border-b border-l rtl:border-r rtl:border-l-0 border-foreground/15 p-8 lg:p-10 group ${
                b.accent ? "bg-foreground text-background" : "bg-background"
              }`}
            >
              <div
                className={`absolute top-3 right-4 text-[10px] tracking-[0.3em] font-bold ${
                  b.accent ? "text-background/40" : "text-foreground/30"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </div>

              <div
                className="font-black leading-[0.85] tracking-tight mb-4"
                style={{
                  fontFamily: "Cairo, sans-serif",
                  fontSize: "clamp(5rem, 12vw, 11rem)",
                }}
              >
                <span className={b.accent ? "text-primary" : "text-foreground"}>
                  {b.number}
                </span>
              </div>

              <div
                className={`text-xl md:text-2xl font-bold mb-2 ${
                  b.accent ? "text-background" : "text-foreground"
                }`}
                style={{ fontFamily: "Cairo, sans-serif" }}
              >
                {b.label}
              </div>
              <p
                className={`text-sm font-light leading-relaxed max-w-xs ${
                  b.accent ? "text-background/70" : "text-muted-foreground"
                }`}
              >
                {b.note}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
