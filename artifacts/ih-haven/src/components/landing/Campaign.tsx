import { motion } from "framer-motion";
import { EditorialHeader } from "./EditorialHeader";
import { MagneticButton } from "./MagneticButton";
import { useLanguage } from "@/contexts/LanguageContext";

const TIERS_AR = [
  {
    no: "I",
    ar: "أسبوع كهرباء",
    en: "A week of power",
    note: "تشغيل المكاتب والإنترنت لأسبوع كامل في المساحة.",
    noteEn: "Keeps the offices and internet running for a full week.",
  },
  {
    no: "II",
    ar: "شهر إنترنت",
    en: "A month of bandwidth",
    note: "اتّصال ثابت يصل المنتسبين بالعالم وفرص العمل.",
    noteEn: "Stable connection linking our members to the world and work opportunities.",
  },
  {
    no: "III",
    ar: "مقعد لمنتسب",
    en: "A seat for a member",
    note: "كرسي ومكتب جديد يحتضن طاقة شابّة لشهور قادمة.",
    noteEn: "A new chair and desk that will hold young talent for months to come.",
  },
  {
    no: "IV",
    ar: "ركن في الفرع",
    en: "A corner in the new branch",
    note: "مساحة كاملة باسمك تُفتح أمام جيلٍ جديد من غزّة.",
    noteEn: "A whole space in your name, opened for a new generation from Gaza.",
  },
];

export function Campaign() {
  const { lang } = useLanguage();

  return (
    <section id="campaign" className="relative bg-background py-20 lg:py-28 border-t border-foreground/10 overflow-hidden">
      <div className="container mx-auto px-6 lg:px-10 max-w-7xl">
        <EditorialHeader
          no="13"
          label={lang === "en" ? "Active campaign" : "الحملة الراهنة"}
          meta={<>Active<br />campaign</>}
          title={
            lang === "en" ? (
              <>
                Help us launch
                <br />
                <span className="text-primary italic">the new branch.</span>
              </>
            ) : (
              <>
                ساهم في إطلاق
                <br />
                <span className="text-primary italic">الفرع الجديد.</span>
              </>
            )
          }
          sub={
            lang === "en"
              ? "After Island Haven became a real professional space for students, graduates, and freelancers, we are now working to launch a new branch — expanding this impact and giving more young talent a real chance to build their future."
              : "بعد أن أصبح آيلاند هيفن مساحة مهنيّة حقيقيّة تحتضن الطلاب والخرّيجين والمستقلّين، نسعى اليوم إلى إطلاق فرع جديد يوسّع هذا الأثر، ويمنح مزيداً من الطاقات الشابّة فرصةً حقيقيّةً لبناء مستقبلها."
          }
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
              src={`${import.meta.env.BASE_URL}photos/IMG_8300.webp`}
              alt="Island Haven workspace in Gaza"
              className="w-full aspect-[5/4] object-cover saturate-[1.06]"
            />
            <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-[10px] tracking-[0.3em] uppercase font-bold px-3 py-2">
              {lang === "en" ? "Open now · Live" : "مفتوحة الآن · Live"}
            </div>
            <div className="absolute -bottom-4 left-4 text-[10px] tracking-[0.4em] uppercase font-bold text-foreground/50">
              Plate · 13A
            </div>
          </motion.div>

          <div className="col-span-12 lg:col-span-7">
            <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/60 font-bold mb-5">
              {lang === "en"
                ? "New branch · Open campaign · Gaza"
                : "الفرع الجديد · حملة مفتوحة · غزّة"}
            </div>

            <h3
              className="font-extrabold text-foreground leading-[1.12] mb-7"
              style={{ fontSize: "clamp(2rem, 4.4vw, 3.75rem)" }}
            >
              {lang === "en" ? (
                <>
                  Island Haven's
                  <br />
                  <span className="text-primary italic">next point.</span>
                </>
              ) : (
                <>
                  نقطة آيلاند هيفن
                  <br />
                  <span className="text-primary italic">القادمة.</span>
                </>
              )}
            </h3>

            <p className="text-base lg:text-lg text-foreground/75 font-light leading-relaxed mb-7 max-w-xl">
              {lang === "en"
                ? "With growing demand for our community, expansion has become a real necessity — not a luxury. We're not asking for a number; we're opening the door for you to become part of this place — in whatever way you can. Every contribution translates directly into tangible impact."
                : "مع تزايد الإقبال على المجتمع، أصبح التوسّع ضرورةً حقيقيّة لا رفاهية. لسنا نطلب رقماً، بل نفتح الباب لأن تصير جزءاً من المكان — بأيّ قدر تستطيع. كلّ مساهمة تُترجَم مباشرةً إلى أثرٍ ملموس."}
            </p>

            <div className="border-t border-foreground/15">
              <div className="flex items-baseline justify-between py-4">
                <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/60 font-bold">
                  {lang === "en" ? "What your contribution unlocks" : "ماذا تُحدِث مساهمتك"}
                </div>
                <div dir="ltr" className="text-[10px] tracking-[0.4em] uppercase text-foreground/60 font-bold">
                  Impact ledger
                </div>
              </div>

              <div className="border-t border-foreground/15">
                {TIERS_AR.map((t, i) => (
                  <motion.div
                    key={t.no}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.6, delay: i * 0.08 }}
                    className="grid grid-cols-12 gap-4 items-baseline py-4 border-b border-foreground/12"
                  >
                    <div dir="ltr" className="col-span-2 sm:col-span-1 text-[11px] tracking-[0.3em] font-bold text-primary">
                      {t.no}
                    </div>
                    <div className="col-span-10 sm:col-span-4">
                      <div className="font-bold text-foreground" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.4rem)" }}>
                        {lang === "en" ? t.en : t.ar}
                      </div>
                      <div dir="ltr" className="text-[10px] tracking-[0.3em] uppercase text-foreground/55 mt-1">
                        {lang === "en" ? t.ar : t.en}
                      </div>
                    </div>
                    <p className="col-span-12 sm:col-span-7 text-sm lg:text-base text-foreground/70 font-light leading-relaxed">
                      {lang === "en" ? t.noteEn : t.note}
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
                  {lang === "en" ? "Donate to the new branch" : "تبرّع للفرع الجديد"}
                </span>
              </MagneticButton>
              <a
                href="https://nastonas.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-14 px-7 text-foreground font-bold text-xs tracking-[0.25em] uppercase underline-offset-8 hover:underline"
              >
                {lang === "en" ? "Details on nastonas.org →" : "التفاصيل على nastonas.org →"}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
