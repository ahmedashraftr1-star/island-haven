import { motion } from "framer-motion";

export function SectionLabel({
  number,
  label,
  title,
  subtitle,
  align = "right",
}: {
  number: string;
  label: string;
  title: string;
  subtitle?: string;
  align?: "right" | "left" | "center";
}) {
  return (
    <motion.div
      initial={{ y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.42 }}
      className={`mb-12 lg:mb-16 ${
        align === "center" ? "text-center mx-auto max-w-3xl" : align === "left" ? "text-left max-w-3xl" : "text-right max-w-3xl mr-auto"
      }`}
    >
      <div className="flex items-center gap-4 mb-5 justify-end">
        {align === "center" && <div className="h-px w-12 bg-primary/40" />}
        <span className="text-[10px] tracking-[0.4em] uppercase text-primary font-bold">
          [ {number} — {label} ]
        </span>
        <div className="h-px w-12 bg-primary/40" />
      </div>
      <h2
        className="font-extrabold text-foreground leading-[1.1] tracking-tight"
        style={{
          fontSize: "clamp(2rem, 5vw, 4.5rem)",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-5 text-base lg:text-lg text-muted-foreground font-light leading-relaxed max-w-2xl mr-auto">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
