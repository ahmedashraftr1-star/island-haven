import { motion } from "framer-motion";
import { EditorialHeader } from "./EditorialHeader";

export function Story() {
  return (
    <section id="story" className="relative bg-background py-24 lg:py-32 border-t border-foreground/10 overflow-hidden">
      <div className="container mx-auto px-6 lg:px-10 max-w-7xl">
        <EditorialHeader
          no="12"
          label="قصّتنا"
          meta={<>The story<br />we live</>}
          title={
            <>
              محاولة <span className="text-primary italic">جادّة</span> لبناء شيءٍ
              <br />
              مستدام في مكانٍ يفتقر إلى الاستقرار.
            </>
          }
        />

        <div className="grid grid-cols-12 gap-6 lg:gap-12 items-start">
          {/* Editorial body */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9 }}
            className="col-span-12 lg:col-span-7 lg:col-start-1"
          >
            <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/45 font-bold mb-6">
              Chapter I · المنشأ
            </div>
            <p
              className="text-2xl lg:text-3xl text-foreground leading-snug font-medium mb-10"
              style={{ fontFamily: "Reem Kufi, sans-serif" }}
            >
              وُلد <span className="text-primary">Island Haven</span> من إيمانٍ بأنّ
              الاستثمار الحقيقيّ هو في الإنسان قبل أيّ شيء آخر.
            </p>

            <div className="space-y-6 text-base lg:text-lg text-foreground/75 font-light leading-relaxed">
              <p>
                في غزّة، فقد كثيرون مساحاتهم الشخصيّة، وأدواتهم، وبيئة العمل التي
                اعتادوها — لكنّ الطاقة بقيت، والرغبة في البناء لم تنطفئ.
              </p>
              <p>
                جمعنا في غرفةٍ واحدةٍ ما تبقّى من إمكانات: مكاتب، إنترنت، كهرباء،
                وفوق ذلك كلّه — مجتمع. صار المكان مساحة نجاةٍ مهنيّةٍ لطلاب
                الجامعات، والخرّيجين الباحثين عن مسار، والمستقلّين الذين يحتاجون
                إلى بيئة عملٍ تليق بهم.
              </p>
            </div>

            <p
              className="mt-12 text-2xl lg:text-3xl text-foreground italic leading-snug border-r-2 border-primary pr-8 py-2"
              style={{ fontFamily: "Amiri, serif" }}
            >
              «Island Haven ليس مجرّد مساحةِ عمل. هو محاولة لإثبات أنّ المعرفة
              والخبرة والتعاون قادرةٌ على بناء مستقبل، حتى في أصعب الظروف.»
            </p>

            {/* Programme credit */}
            <div className="mt-16 pt-8 border-t border-foreground/15">
              <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/45 font-bold mb-3">
                Programme of · برنامج تنمويّ تابع لـ
              </div>
              <h3
                className="font-bold text-foreground leading-tight"
                style={{ fontFamily: "Cairo, sans-serif", fontSize: "clamp(1.5rem, 2.4vw, 2rem)" }}
              >
                فريق «من الناس إلى الناس»
              </h3>
              <p className="mt-3 text-foreground/70 font-light leading-relaxed max-w-xl">
                مبادرة تطوّعيّة تعمل من داخل غزّة وخارجها على إيصال الدعم المباشر
                إلى المشاريع المجتمعيّة الصغيرة. هي من احتضنت Island Haven وتُسهم
                في إبقاء أبوابه مفتوحة للجميع مجاناً.
              </p>
              <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <a
                  href="https://nastonas.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-primary transition-colors font-bold tracking-wide underline-offset-4 hover:underline"
                >
                  nastonas.org →
                </a>
                <a
                  href="https://nas2nas.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-primary transition-colors font-bold tracking-wide underline-offset-4 hover:underline"
                >
                  nas2nas.org · للتبرّع →
                </a>
              </div>
            </div>
          </motion.div>

          {/* Photo column */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="col-span-12 lg:col-span-5 lg:sticky lg:top-24"
          >
            <div className="relative">
              <img
                src="/photos/IMG_8358.jpg"
                alt=""
                className="w-full aspect-[3/4] object-cover grayscale-[10%]"
              />
              <div className="absolute -bottom-4 left-4 text-[10px] tracking-[0.4em] uppercase font-bold text-foreground/50">
                Plate · 12A
              </div>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-px bg-foreground/12">
              {[
                { v: "2024", l: "Founded" },
                { v: "39", l: "Seats" },
                { v: "100%", l: "Free" },
              ].map((s) => (
                <div key={s.l} className="bg-background p-5">
                  <div
                    className="font-black text-foreground leading-none"
                    style={{ fontFamily: "Cairo, sans-serif", fontSize: "clamp(1.5rem, 2.6vw, 2.25rem)" }}
                  >
                    {s.v}
                  </div>
                  <div className="text-[10px] tracking-[0.3em] uppercase text-foreground/55 mt-2 font-bold">
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
