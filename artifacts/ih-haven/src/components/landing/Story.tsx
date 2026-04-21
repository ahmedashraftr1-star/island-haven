import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

export function Story() {
  return (
    <section id="story" className="py-24 bg-secondary/10 border-y border-border/50 overflow-hidden relative">
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
              قصتنا
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground leading-tight">
              بدأت الفكرة من حاجة بسيطة جداً:<br />
              <span className="text-primary">مكانٌ نجلس فيه.</span>
            </h2>

            <div className="space-y-5 text-base md:text-lg text-muted-foreground leading-relaxed font-light">
              <p>
                بعد كل ما مرّ بنا، اكتشفنا أن أصعب ما فقدناه ليس الجدران، بل الأماكن الصغيرة
                التي كنّا نمارس فيها حياتنا اليومية: المكتب الذي نكمل فيه عملنا، المقهى الذي نلتقي
                فيه بأصدقائنا، المكتبة التي نكتب فيها أبحاثنا.
              </p>
              <p>
                مجموعة من الشباب — مهندسون، مصمّمون، طلاب، كتّاب — قرّروا أن يجمعوا ما تبقّى من أدواتهم
                في غرفة واحدة، ويفتحوا أبوابها للجميع. أحضر كلّ منهم ما يستطيع: كرسياً، طاولة، كتاباً،
                جهاز توجيه، إبريق شاي.
              </p>
              <p>
                خلال أسابيع قليلة تحوّل المكان إلى ما يشبه البيت. صار طلاب الجامعات يأتون
                لمراجعة امتحاناتهم، والمستقلون يعقدون مقابلاتهم عن بُعد، وكبار السن يأتون
                ليستخدموا الإنترنت أو ليشربوا شاياً مع آخرين.
              </p>
              <p className="text-foreground/90 font-normal border-r-2 border-primary pr-5 italic">
                لم نقصد بناء "مساحة عمل مشتركة". قصدنا فقط أن نقول لأنفسنا ولمن حولنا:
                ما زلنا قادرين على الاجتماع، ما زلنا قادرين على البناء.
              </p>
            </div>

            <div className="mt-10 p-6 rounded-2xl border border-border bg-card">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">
                بدعم من
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                مبادرة "من الناس إلى الناس"
              </h3>
              <p className="text-sm md:text-base text-muted-foreground font-light leading-relaxed mb-5">
                فريق تطوّعي يعمل من داخل غزة وخارجها على إيصال الدعم المباشر إلى المشاريع
                المجتمعية الصغيرة، عبر قنوات دفع إلكترونية آمنة. هي من ساعدتنا على فتح أبواب ih_haven،
                وهي من تساعدنا على إبقائها مفتوحة.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://nastonas.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
                >
                  nastonas.org
                  <ExternalLink className="w-4 h-4" />
                </a>
                <span className="text-muted-foreground">·</span>
                <a
                  href="https://nas2nas.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
                >
                  nas2nas.org (للتبرّع)
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
                alt="شاب يقرأ في زاوية هادئة من المكان"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 hidden md:block bg-primary text-primary-foreground rounded-2xl p-5 shadow-xl max-w-[220px]">
              <div className="text-3xl font-bold mb-1">+ ٤٠٠</div>
              <div className="text-sm text-primary-foreground/90 font-light">
                شخصاً مرّوا من بابنا منذ افتتاحنا، طلاباً وعمّالاً وأصدقاء.
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
