import { motion } from "framer-motion";
import { ArrowLeft, MapPin } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-[78vh] flex items-center pt-28 pb-20 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="/images/workspace.png"
          alt="مساحة آي إتش هايفن"
          className="w-full h-full object-cover opacity-30 dark:opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background"></div>
      </div>

      <div className="container relative z-10 mx-auto px-6 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-8"
          >
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-2 py-1.5 px-3 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <MapPin className="w-3.5 h-3.5" />
                غزة — فلسطين
              </span>
              <span className="inline-block py-1.5 px-3 rounded-full bg-secondary/30 text-secondary-foreground text-sm font-medium">
                مساحة عمل ومجتمع
              </span>
              <span className="inline-block py-1.5 px-3 rounded-full bg-muted text-muted-foreground text-sm font-medium">
                بدعم من "من الناس إلى الناس"
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6 text-foreground">
              نحن ما زلنا هنا،<br />
              <span className="text-primary">وما زلنا نبني.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6 max-w-2xl font-light">
              <span className="font-medium text-foreground">ih_haven</span> مساحة هادئة في قلب غزة،
              فُتحت بعد الحرب لتكون غرفةً للعمل والدراسة، وملتقى للمستقلين والطلاب
              والمبدعين، وملاذاً صغيراً يستعيد فيه الناس شيئاً من إيقاع الحياة الطبيعية.
            </p>

            <p className="text-base text-muted-foreground/90 leading-relaxed mb-10 max-w-2xl font-light">
              مكاتب وكراسي مريحة، إنترنت ثابت، كهرباء طوال ساعات الدوام، ركن للشاي والقهوة،
              ومكتبة صغيرة. الدخول مجاني، والمكان مفتوح لكل من يحتاج زاوية يفكر فيها.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="#support"
                className="inline-flex items-center justify-center h-12 px-7 rounded-md bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90 shadow-sm"
              >
                ادعم استمرار المساحة
                <ArrowLeft className="mr-2 h-5 w-5 rtl:rotate-180" />
              </a>
              <a
                href="#story"
                className="inline-flex items-center justify-center h-12 px-7 rounded-md border border-border bg-background/60 text-foreground font-medium transition-colors hover:bg-secondary/20 backdrop-blur-sm"
              >
                اقرأ قصتنا
              </a>
              <a
                href="https://www.instagram.com/ih_haven"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-12 px-7 rounded-md text-foreground font-medium hover:text-primary transition-colors"
              >
                تابعنا على إنستغرام
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-4 hidden lg:block"
          >
            <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
              <div className="text-sm text-muted-foreground mb-4 font-medium">المكان باختصار</div>
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs text-muted-foreground">يفتح</dt>
                  <dd className="text-base text-foreground font-medium mt-1">السبت — الخميس · ٩ صباحاً — ٨ مساءً</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">الجمعة</dt>
                  <dd className="text-base text-foreground font-medium mt-1">٢ ظهراً — ٨ مساءً</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">الدخول</dt>
                  <dd className="text-base text-foreground font-medium mt-1">مجاني للجميع</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">المقاعد</dt>
                  <dd className="text-base text-foreground font-medium mt-1">٣٠ مقعد عمل · غرفتا اجتماعات</dd>
                </div>
              </dl>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
