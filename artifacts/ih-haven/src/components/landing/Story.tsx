import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

export function Story() {
  return (
    <section id="story" className="py-24 bg-background overflow-hidden relative">
      <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 relative z-10"
          >
            <span className="inline-block text-sm font-medium text-primary tracking-wide mb-4">
              قصّتنا
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground leading-tight">
              محاولة جادّة لبناء شيء مستدام<br />
              <span className="text-primary">في مكان يفتقر إلى الاستقرار.</span>
            </h2>

            <div className="space-y-5 text-base md:text-lg text-muted-foreground leading-relaxed font-light">
              <p>
                وُلد <span className="font-medium text-foreground">Island Haven</span> من
                إيمان بأنّ الاستثمار الحقيقي هو في الإنسان قبل أيّ شيء آخر. في غزّة،
                فقد كثيرون مساحاتهم الشخصيّة، وأدواتهم، وبيئة العمل التي اعتادوها —
                لكنّ الطاقة بقيت، والرغبة في البناء لم تنطفئ.
              </p>
              <p>
                جمعنا في غرفة واحدة ما تبقّى من إمكانات: مكاتب، إنترنت، كهرباء، وفوق
                ذلك كلّه — مجتمع. صار المكان مساحة نجاة مهنيّة لطلاب الجامعات،
                والخريجين الباحثين عن مسار، والمستقلّين الذين يحتاجون إلى بيئة عمل
                تليق بهم.
              </p>
              <p className="text-foreground/90 font-normal border-r-2 border-primary pr-5 italic">
                Island Haven ليس مجرّد مساحة عمل. هو محاولة لإثبات أنّ المعرفة
                والخبرة والتعاون قادرة على بناء مستقبل، حتى في أصعب الظروف.
              </p>
            </div>

            <div className="mt-10 p-6 md:p-8 rounded-2xl border border-border bg-card">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">
                برنامج تنمويّ تابع لـ
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                فريق "من الناس إلى الناس"
              </h3>
              <p className="text-sm md:text-base text-muted-foreground font-light leading-relaxed mb-5">
                مبادرة تطوّعيّة تعمل من داخل غزّة وخارجها على إيصال الدعم المباشر إلى
                المشاريع المجتمعيّة الصغيرة. هي من احتضنت Island Haven، وتُسهم في
                إبقاء أبوابه مفتوحة للجميع مجاناً.
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <a
                  href="https://nastonas.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
                >
                  nastonas.org
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href="https://nas2nas.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
                >
                  nas2nas.org — للتبرّع
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1 }}
            className="lg:col-span-5 relative"
          >
            <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-xl">
              <img
                src="/images/reading.png"
                alt="منتسب يعمل بهدوء داخل المساحة"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 hidden md:block bg-primary text-primary-foreground rounded-2xl p-5 shadow-xl max-w-[240px]">
              <div className="text-2xl font-bold mb-1 leading-tight">مساحة تتّسع<br />لأحلامك.</div>
              <div className="text-xs text-primary-foreground/85 font-light mt-2">
                — الشعار الرسمي لـ Island Haven
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
