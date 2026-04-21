import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, TrendingUp } from "lucide-react";

const goal = 30000;
const remaining = 28800;
const raised = goal - remaining;
const pct = Math.round((raised / goal) * 100);

function fmtUSD(n: number) {
  return "$" + n.toLocaleString("en-US");
}

export function Campaign() {
  return (
    <section id="campaign" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative mx-auto px-6 lg:px-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="rounded-3xl overflow-hidden border border-border bg-card shadow-2xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-full">
              <img
                src="/images/sky.png"
                alt="فرع جديد قادم"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-l from-primary/80 via-primary/40 to-primary/10" />
              <div className="absolute inset-0 p-8 lg:p-10 flex flex-col justify-end text-primary-foreground">
                <div className="inline-flex items-center gap-2 py-1.5 px-3 rounded-full bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground text-xs font-bold mb-4 self-start">
                  <Sparkles className="w-3.5 h-3.5" />
                  حملة مفتوحة الآن
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold mb-3 leading-tight" style={{ fontFamily: "Cairo, sans-serif" }}>
                  إطلاق نقطة<br />آيلاند هيفن الجديدة
                </h3>
                <p className="text-base text-primary-foreground/90 font-light leading-relaxed">
                  لأنّ مساحة واحدة لا تكفي لكلّ الأحلام.
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 p-8 lg:p-12">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium">
                مشاريع التمكين · ٢٧ مارس ٢٠٢٦ · غير مكتمل
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-5 leading-tight" style={{ fontFamily: "Cairo, sans-serif" }}>
                ساهم في افتتاح الفرع الجديد من Island Haven
              </h2>

              <p className="text-base text-muted-foreground font-light leading-relaxed mb-4">
                بعد أن أصبح مجتمع آيلاند هيفن مساحة مهنيّة حقيقيّة تحتضن الطلاب
                والخريجين والمستقلّين، نسعى اليوم إلى إطلاق فرع جديد يوسّع هذا الأثر،
                ويمنح مزيداً من الطاقات الشابّة فرصة حقيقيّة لبناء مستقبلها.
              </p>

              <p className="text-sm text-muted-foreground/90 font-light leading-relaxed mb-8">
                مع تزايد الإقبال على المجتمع، أصبح التوسّع ضرورة حقيقيّة، لا رفاهية.
                مساهمتك تُترجَم مباشرةً إلى مكاتب، إنترنت، كهرباء، وفرص لمنتسبين جُدد.
              </p>

              <div className="rounded-2xl border border-border bg-secondary/10 p-6 mb-7">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div className="text-xs text-muted-foreground font-medium mb-1">
                      تمّ جمع
                    </div>
                    <div className="text-2xl font-bold text-foreground" dir="ltr">
                      {fmtUSD(raised)}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground font-medium mb-1">
                      الهدف
                    </div>
                    <div className="text-2xl font-bold text-foreground" dir="ltr">
                      {fmtUSD(goal)}
                    </div>
                  </div>
                </div>

                <div className="h-3 rounded-full bg-background overflow-hidden border border-border">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, ease: "easeOut" }}
                    className="h-full bg-gradient-to-l from-primary to-primary/70 rounded-full"
                  />
                </div>

                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 text-primary font-bold text-sm">
                    <TrendingUp className="w-4 h-4" />
                    {pct}٪ من الهدف
                  </span>
                  <span dir="ltr">المتبقي: {fmtUSD(remaining)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="https://nastonas.org/projects/relief"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-12 px-7 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm"
                >
                  تبرّع للفرع الجديد
                  <ArrowLeft className="mr-2 h-5 w-5 rtl:rotate-180" />
                </a>
                <a
                  href="https://nastonas.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-12 px-7 rounded-md border border-border bg-background text-foreground font-medium hover:bg-secondary/20 transition-colors"
                >
                  تفاصيل المشروع على nastonas.org
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
