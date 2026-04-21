import { motion } from "framer-motion";
import { EditorialHeader } from "./EditorialHeader";
import { MagneticButton } from "./MagneticButton";

const goal = 30000;
const remaining = 28800;
const raised = goal - remaining;
const pct = Math.round((raised / goal) * 100);

function fmtUSD(n: number) {
  return "$" + n.toLocaleString("en-US");
}

export function Campaign() {
  return (
    <section id="campaign" className="relative bg-background py-24 lg:py-32 border-t border-foreground/10 overflow-hidden">
      <div className="container mx-auto px-6 lg:px-10 max-w-7xl">
        <EditorialHeader
          no="13"
          label="الحملة الراهنة"
          meta={<>Active<br />campaign</>}
          title={
            <>
              ساهم في إطلاق
              <br />
              <span className="text-primary italic">الفرع الجديد.</span>
            </>
          }
          sub="بعد أن أصبح آيلاند هيفن مساحة مهنيّة حقيقيّة تحتضن الطلاب والخرّيجين والمستقلّين، نسعى اليوم إلى إطلاق فرع جديد يوسّع هذا الأثر، ويمنح مزيداً من الطاقات الشابّة فرصةً حقيقيّةً لبناء مستقبلها."
        />

        <div className="grid grid-cols-12 gap-6 lg:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="col-span-12 lg:col-span-5 relative"
          >
            <img
              src="/photos/IMG_8300.jpg"
              alt=""
              className="w-full aspect-[4/5] object-cover grayscale-[10%]"
            />
            <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-[10px] tracking-[0.3em] uppercase font-bold px-3 py-2">
              مفتوحة الآن · Live
            </div>
            <div className="absolute -bottom-4 left-4 text-[10px] tracking-[0.4em] uppercase font-bold text-foreground/50">
              Plate · 13A
            </div>
          </motion.div>

          <div className="col-span-12 lg:col-span-7">
            {/* Headline tag */}
            <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/45 font-bold mb-5">
              مشاريع التمكين · ٢٧ مارس ٢٠٢٦ · غير مكتمل
            </div>

            <h3
              className="font-extrabold text-foreground leading-[1.12] mb-7"
              style={{
                fontFamily: "Cairo, sans-serif",
                fontSize: "clamp(2rem, 4.4vw, 3.75rem)",
              }}
            >
              نقطة آيلاند هيفن
              <br />
              <span className="text-primary italic">القادمة.</span>
            </h3>

            <p className="text-base lg:text-lg text-foreground/75 font-light leading-relaxed mb-10 max-w-xl">
              مع تزايد الإقبال على المجتمع، أصبح التوسّع ضرورةً حقيقيّة لا رفاهية.
              مساهمتك تُترجَم مباشرةً إلى مكاتب، إنترنت، كهرباء، وفرص لمنتسبين جُدد.
            </p>

            {/* Progress block — editorial */}
            <div className="border-t border-foreground/15 border-b border-foreground/15 py-7">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/45 font-bold mb-2">
                    Raised · جُمع
                  </div>
                  <div
                    className="font-extrabold text-foreground leading-none"
                    style={{ fontFamily: "Cairo, sans-serif", fontSize: "clamp(2rem, 3.5vw, 3rem)" }}
                    dir="ltr"
                  >
                    {fmtUSD(raised)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/45 font-bold mb-2">
                    Goal · الهدف
                  </div>
                  <div
                    className="font-extrabold text-foreground/45 leading-none"
                    style={{ fontFamily: "Cairo, sans-serif", fontSize: "clamp(2rem, 3.5vw, 3rem)" }}
                    dir="ltr"
                  >
                    {fmtUSD(goal)}
                  </div>
                </div>
              </div>

              <div className="h-px bg-foreground/15 relative overflow-hidden">
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: pct / 100 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.6, ease: "easeOut" }}
                  className="absolute inset-0 bg-primary origin-right h-[2px] -mt-px"
                />
              </div>

              <div className="mt-5 flex items-baseline justify-between text-[11px] tracking-[0.3em] uppercase font-bold">
                <span className="text-primary">{pct}٪ Funded</span>
                <span className="text-foreground/55" dir="ltr">
                  {fmtUSD(remaining)} remaining
                </span>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <MagneticButton
                href="https://nastonas.org/projects/relief"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="inline-flex items-center justify-center h-14 px-9 bg-foreground text-background font-bold text-xs tracking-[0.25em] uppercase hover:bg-primary transition-colors">
                  تبرّع للفرع الجديد
                </span>
              </MagneticButton>
              <a
                href="https://nastonas.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-14 px-7 text-foreground font-bold text-xs tracking-[0.25em] uppercase underline-offset-8 hover:underline"
              >
                التفاصيل على nastonas.org →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
