import { motion } from "framer-motion";
import { EditorialHeader } from "./EditorialHeader";
import { MagneticButton } from "./MagneticButton";

const tiers = [
  {
    no: "I",
    ar: "أسبوع كهرباء",
    en: "A week of power",
    note: "تشغيل المكاتب والإنترنت لأسبوع كامل في المساحة.",
  },
  {
    no: "II",
    ar: "شهر إنترنت",
    en: "A month of bandwidth",
    note: "اتّصال ثابت يصل المنتسبين بالعالم وفرص العمل.",
  },
  {
    no: "III",
    ar: "مقعد لمنتسب",
    en: "A seat for a member",
    note: "كرسي ومكتب جديد يحتضن طاقة شابّة لشهور قادمة.",
  },
  {
    no: "IV",
    ar: "ركن في الفرع",
    en: "A corner in the new branch",
    note: "مساحة كاملة باسمك تُفتح أمام جيلٍ جديد من غزّة.",
  },
];

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
              alt="مساحة آيلاند هيفن المخصّصة للعمل المهنيّ في غزّة"
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
              الفرع الجديد · حملة مفتوحة · غزّة
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
              لسنا نطلب رقماً، بل نفتح الباب لأن تصير جزءاً من المكان —
              بأيّ قدر تستطيع. كلّ مساهمة تُترجَم مباشرةً إلى أثرٍ ملموس.
            </p>

            {/* What your contribution unlocks — editorial tiers */}
            <div className="border-t border-foreground/15">
              <div className="flex items-baseline justify-between py-5">
                <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/45 font-bold">
                  ماذا تُحدِث مساهمتك
                </div>
                <div
                  dir="ltr"
                  className="text-[10px] tracking-[0.4em] uppercase text-foreground/45 font-bold"
                >
                  Impact ledger
                </div>
              </div>

              <div className="border-t border-foreground/15">
                {tiers.map((t, i) => (
                  <motion.div
                    key={t.no}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.6, delay: i * 0.08 }}
                    className="grid grid-cols-12 gap-4 items-baseline py-5 border-b border-foreground/12"
                  >
                    <div
                      dir="ltr"
                      className="col-span-2 sm:col-span-1 text-[11px] tracking-[0.3em] font-bold text-primary"
                    >
                      {t.no}
                    </div>
                    <div className="col-span-10 sm:col-span-4">
                      <div
                        className="font-bold text-foreground"
                        style={{
                          fontFamily: "Cairo, sans-serif",
                          fontSize: "clamp(1.05rem, 1.6vw, 1.4rem)",
                        }}
                      >
                        {t.ar}
                      </div>
                      <div
                        dir="ltr"
                        className="text-[10px] tracking-[0.3em] uppercase text-foreground/45 mt-1"
                      >
                        {t.en}
                      </div>
                    </div>
                    <p className="col-span-12 sm:col-span-7 text-sm lg:text-base text-foreground/70 font-light leading-relaxed">
                      {t.note}
                    </p>
                  </motion.div>
                ))}
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
