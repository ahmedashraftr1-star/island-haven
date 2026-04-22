import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { EditorialHeader } from "./EditorialHeader";

export function Story() {
  return (
    <section id="story" className="relative bg-background py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-10 max-w-[1500px]">
        <EditorialHeader
          label="قصّتنا"
          title={
            <>
              محاولة <span className="text-accent-gradient">جادّة</span> لبناء
              شيءٍ
              <br />
              مستدام في مكانٍ يفتقر إلى الاستقرار.
            </>
          }
        />

        <div className="grid grid-cols-12 gap-6 lg:gap-12 items-start">
          {/* Body */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="col-span-12 lg:col-span-7"
          >
            <div className="text-[11px] tracking-[0.15em] uppercase text-primary font-semibold mb-5">
              الفصل الأوّل · المنشأ
            </div>
            <p className="text-2xl lg:text-3xl text-foreground leading-snug font-semibold mb-8" style={{ letterSpacing: "-0.015em" }}>
              وُلد <span className="text-primary">Island Haven</span> من إيمانٍ
              بأنّ الاستثمار الحقيقيّ هو في الإنسان قبل أيّ شيء آخر.
            </p>

            <div className="space-y-5 text-base lg:text-lg text-foreground/75 leading-relaxed">
              <p>
                في غزّة، فقد كثيرون مساحاتهم الشخصيّة، وأدواتهم، وبيئة العمل
                التي اعتادوها — لكنّ الطاقة بقيت، والرغبة في البناء لم تنطفئ.
              </p>
              <p>
                جمعنا في غرفةٍ واحدةٍ ما تبقّى من إمكانات: مكاتب، إنترنت، كهرباء،
                وفوق ذلك كلّه — مجتمع. صار المكان مساحة نجاةٍ مهنيّةٍ لطلاب
                الجامعات، والخرّيجين الباحثين عن مسار، والمستقلّين الذين يحتاجون
                إلى بيئة عملٍ تليق بهم.
              </p>
            </div>

            <div className="mt-10 bg-primary-soft border border-primary/15 rounded-2xl p-7 lg:p-8 relative">
              <p className="text-xl lg:text-2xl text-foreground leading-snug font-medium" style={{ letterSpacing: "-0.01em" }}>
                «Island Haven ليس مجرّد مساحةِ عمل. هو محاولة لإثبات أنّ
                المعرفة والخبرة والتعاون قادرةٌ على بناء مستقبل، حتى في أصعب
                الظروف.»
              </p>
            </div>

            {/* Programme credit */}
            <div className="mt-12 pt-8 border-t border-border">
              <div className="text-[11px] tracking-[0.15em] uppercase text-foreground/50 font-semibold mb-3">
                برنامج تنمويّ تابع لـ
              </div>
              <h3 className="font-bold text-foreground text-2xl mb-3">
                فريق «من الناس إلى الناس»
              </h3>
              <p className="text-foreground/70 leading-relaxed max-w-xl mb-5">
                مبادرة تطوّعيّة تعمل من داخل غزّة وخارجها على إيصال الدعم
                المباشر إلى المشاريع المجتمعيّة الصغيرة. هي من احتضنت Island
                Haven وتُسهم في إبقاء أبوابه مفتوحة للجميع مجاناً.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://nastonas.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-white border border-border text-foreground text-[13px] font-semibold hover:border-primary/40 hover:text-primary transition-colors"
                >
                  nastonas.org
                  <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                </a>
                <a
                  href="https://nas2nas.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-colors"
                >
                  nas2nas.org · للتبرّع
                  <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Photo column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="col-span-12 lg:col-span-5 lg:sticky lg:top-24"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-soft">
              <img
                src={`${import.meta.env.BASE_URL}photos/IMG_8358.jpg`}
                alt="منظر داخليّ من آيلاند هيفن يوضح بيئة العمل الهادئة"
                className="w-full aspect-[3/4] object-cover"
              />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { v: "2024", l: "تأسّس" },
                { v: "39", l: "مقعد" },
                { v: "100%", l: "مجّانيّ" },
              ].map((s) => (
                <div key={s.l} className="bg-white border border-border rounded-xl p-4 shadow-soft">
                  <div
                    className="font-bold text-foreground leading-none tabular-nums"
                    style={{ fontSize: "clamp(1.25rem, 2vw, 1.75rem)" }}
                  >
                    {s.v}
                  </div>
                  <div className="text-[12px] text-foreground/55 mt-1.5 font-medium">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
