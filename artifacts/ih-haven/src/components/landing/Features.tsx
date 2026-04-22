import { motion } from "framer-motion";
import {
  Wifi,
  Coffee,
  Users,
  Lightbulb,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";

const features = [
  {
    icon: Wifi,
    title: "إنترنت احترافيّ مستقرّ",
    en: "Reliable connectivity",
    body: "خطوط متعدّدة وكهرباء بلا انقطاع، حتّى يستمرّ تركيزك دون قلق.",
  },
  {
    icon: Coffee,
    title: "بيئة عمل مريحة",
    en: "Crafted for focus",
    body: "مكاتب مدروسة، إضاءة طبيعيّة، وقهوة مجانيّة — صُمّمت للتركيز الطويل.",
  },
  {
    icon: Users,
    title: "مجتمع مهنيّ نشط",
    en: "A real professional network",
    body: "اعمل إلى جانب مستقلّين وخرّيجين وطلبة، وابنِ شبكتك من أوّل يوم.",
  },
  {
    icon: Calendar,
    title: "ورش وفعاليّات دوريّة",
    en: "Workshops & meetups",
    body: "برامج تدريبيّة ولقاءات تشبيك شهريّة مفتوحة لكلّ المنتسبين.",
  },
  {
    icon: Lightbulb,
    title: "صُنع في آيلاند هيفن",
    en: "Made in Island Haven",
    body: "فعاليّة جديدة نفتح فيها الباب لاقتراحاتكم — المكان يصير أجمل بأهله.",
  },
  {
    icon: ShieldCheck,
    title: "مجّانيّ بالكامل",
    en: "100% free, always",
    body: "لا رسوم انتساب ولا اشتراك. مدعوم من «من الناس إلى الناس».",
  },
];

export function Features() {
  return (
    <section id="offerings" className="relative py-28 lg:py-40 bg-background overflow-hidden">
      {/* Subtle indigo halo for atmosphere */}
      <div
        aria-hidden
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[40vh] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(232 100% 70% / 0.05) 0%, transparent 60%)",
          filter: "blur(60px)",
        }}
      />

      <div className="container relative mx-auto px-6 lg:px-12 max-w-[1500px]">
        {/* Editorial top: huge number + eyebrow + headline split */}
        <div className="grid grid-cols-12 gap-6 lg:gap-12 mb-20 lg:mb-28 items-end">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: DURATION.lg, ease: EASE_OUT_EXPO }}
            className="col-span-12 lg:col-span-5"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="h-[1px] w-10 bg-primary/40" />
              <span className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold">
                What we offer · ما نقدّم
              </span>
            </div>
            <div
              className="font-bold text-foreground/8 leading-none tabular-nums select-none"
              style={{
                fontSize: "clamp(7rem, 18vw, 18rem)",
                letterSpacing: "-0.06em",
                lineHeight: 0.85,
              }}
              aria-hidden
            >
              06
            </div>
            <div className="text-[11px] tracking-[0.18em] uppercase text-foreground/45 font-semibold mt-2">
              Six pillars · ستّة أركان
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: DURATION.lg, delay: 0.1, ease: EASE_OUT_EXPO }}
            className="col-span-12 lg:col-span-7"
          >
            <h2
              className="font-bold text-foreground"
              style={{
                fontSize: "clamp(2.25rem, 6vw, 5.25rem)",
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
              }}
            >
              كلّ تفصيل في المساحة
              <br />
              مدروس{" "}
              <span className="text-accent-gradient">ليُسهّل يومك.</span>
            </h2>
            <p className="mt-7 text-base lg:text-xl text-foreground/65 font-normal leading-relaxed max-w-xl">
              مزايا حقيقيّة، لا وعود تسويقيّة. كلّ ما يحتاجه يومٌ مهنيّ منتج،
              في مكانٍ واحد، تحت سقفٍ واحد، بلا عوائق.
            </p>
          </motion.div>
        </div>

        {/* Editorial hairline grid — no card boxes, magazine feel */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 lg:gap-x-14 gap-y-0 border-t border-foreground/10">
          {features.map((f, i) => {
            const Icon = f.icon;
            const num = String(i + 1).padStart(2, "0");
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.7,
                  delay: (i % 3) * 0.07,
                  ease: EASE_OUT_EXPO,
                }}
                className="group relative py-10 lg:py-12 border-b border-foreground/10 lg:[&:nth-child(-n+3)]:border-t-0 [&:not(:last-child)]:border-b md:[&:nth-child(odd)]:lg:border-l-0"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="tile-soft w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    <Icon className="w-5 h-5" strokeWidth={2.2} />
                  </div>
                  <div className="text-[11px] font-mono font-semibold text-foreground/35 tabular-nums tracking-wider">
                    /{num}
                  </div>
                </div>
                <h3
                  className="font-bold text-foreground mb-2.5 leading-tight"
                  style={{ fontSize: "clamp(1.25rem, 1.7vw, 1.625rem)", letterSpacing: "-0.015em" }}
                >
                  {f.title}
                </h3>
                <div className="text-[10px] tracking-[0.16em] uppercase text-primary font-semibold mb-3.5">
                  {f.en}
                </div>
                <p className="text-[15px] text-foreground/65 leading-relaxed">
                  {f.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
