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
    body: "خطوط متعدّدة وكهرباء بلا انقطاع، حتّى يستمرّ تركيزك دون قلق.",
  },
  {
    icon: Coffee,
    title: "بيئة عمل مريحة",
    body: "مكاتب مدروسة، إضاءة طبيعيّة، وقهوة مجانيّة — صُمّمت للتركيز الطويل.",
  },
  {
    icon: Users,
    title: "مجتمع مهنيّ نشط",
    body: "اعمل إلى جانب مستقلّين وخرّيجين وطلبة، وابنِ شبكتك من أوّل يوم.",
  },
  {
    icon: Calendar,
    title: "ورش وفعاليّات دوريّة",
    body: "برامج تدريبيّة ولقاءات تشبيك شهريّة مفتوحة لكلّ المنتسبين.",
  },
  {
    icon: Lightbulb,
    title: "صُنع في آيلاند هيفن",
    body: "فعاليّة جديدة نفتح فيها الباب لاقتراحاتكم — المكان يصير أجمل بأهله.",
  },
  {
    icon: ShieldCheck,
    title: "مجّانيّ بالكامل",
    body: "لا رسوم انتساب ولا اشتراك. مدعوم من «من الناس إلى الناس».",
  },
];

export function Features() {
  return (
    <section id="offerings" className="relative py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12 max-w-[1500px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: DURATION.lg, ease: EASE_OUT_EXPO }}
          className="text-center max-w-3xl mx-auto mb-16 lg:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-[11px] tracking-[0.15em] uppercase text-primary font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            ما نقدّم لك
          </div>
          <h2
            className="font-bold text-foreground"
            style={{
              fontSize: "clamp(2.25rem, 5.5vw, 4.5rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            كلّ ما تحتاجه لتعمل
            <br />
            <span className="text-accent-gradient">براحة وثقة.</span>
          </h2>
          <p className="mt-6 text-base lg:text-lg text-foreground/65 font-normal leading-relaxed">
            مزايا حقيقيّة، لا وعود تسويقيّة. كلّ تفصيل في المساحة مدروس
            ليُسهّل عليك يومك المهنيّ.
          </p>
        </motion.div>

        {/* 6 feature tiles — Galata pattern with our warmth */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: DURATION.lg,
                  delay: (i % 3) * 0.08,
                  ease: EASE_OUT_EXPO,
                }}
                className="group bg-white border border-border rounded-2xl p-7 lg:p-8 hover:border-primary/25 transition-all duration-500 shadow-soft hover:shadow-soft-hover hover:-translate-y-1"
              >
                <div className="tile-soft w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                  <Icon className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <h3 className="text-lg lg:text-xl font-bold text-foreground mb-2">
                  {f.title}
                </h3>
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
