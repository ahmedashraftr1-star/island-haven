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
    <section id="campaign" className="relative bg-background section-y overflow-hidden">
      <div className="container-ih">
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
            transition={{ duration: 0.5 }}
            className="col-span-12 lg:col-span-5 relative"
          >
            <div className="overflow-hidden rounded-[20px] border border-border-strong shadow-[0_12px_32px_-12px_hsl(226_60%_2%_/_0.6)]">
              <img
                src={`${import.meta.env.BASE_URL}photos/IMG_8300.webp`}
                alt="Island Haven workspace in Gaza"
                className="w-full aspect-[5/4] object-cover saturate-[1.06]"
              />
            </div>
            <div className="absolute top-4 right-4 inline-flex items-center gap-2 chip-accent-2 rounded-full px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase font-bold tnum">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-accent-2/60 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-2" />
              </span>
              {lang === "en" ? "Open now · Live" : "مفتوحة الآن · Live"}
            </div>
            <div dir="ltr" className="absolute -bottom-4 left-4 text-caption tracking-[0.3em] uppercase font-bold text-fg-faint">
              Plate · 13A
            </div>
          </motion.div>

          <div className="col-span-12 lg:col-span-7">
            <div className="eyebrow mb-5 text-muted-foreground">
              {lang === "en"
                ? "New branch · Open campaign · Gaza"
                : "الفرع الجديد · حملة مفتوحة · غزّة"}
            </div>

            <h3 className="t-h2 mb-7">
              {lang === "en" ? (
                <>
                  Island Haven's
                  <br />
                  <span className="text-sand italic-latin">next point.</span>
                </>
              ) : (
                <>
                  نقطة آيلاند هيفن
                  <br />
                  <span className="text-sand">القادمة.</span>
                </>
              )}
            </h3>

            <p className="t-body-lg mb-7 max-w-xl">
              {lang === "en"
                ? "With growing demand for our community, expansion has become a real necessity — not a luxury. We're not asking for a number; we're opening the door for you to become part of this place — in whatever way you can. Every contribution translates directly into tangible impact."
                : "مع تزايد الإقبال على المجتمع، أصبح التوسّع ضرورةً حقيقيّة لا رفاهية. لسنا نطلب رقماً، بل نفتح الباب لأن تصير جزءاً من المكان — بأيّ قدر تستطيع. كلّ مساهمة تُترجَم مباشرةً إلى أثرٍ ملموس."}
            </p>

            <div className="border-t border-border-strong">
              <div className="flex items-baseline justify-between py-4">
                <div className="eyebrow text-muted-foreground">
                  {lang === "en" ? "What your contribution unlocks" : "ماذا تُحدِث مساهمتك"}
                </div>
                <div dir="ltr" className="eyebrow text-muted-foreground">
                  Impact ledger
                </div>
              </div>

              <div className="border-t border-border-strong">
                {TIERS_AR.map((t, i) => (
                  <motion.div
                    key={t.no}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.42, delay: i * 0.08 }}
                    className="group grid grid-cols-12 gap-4 items-baseline py-4 border-b border-border transition-colors hover:bg-surface-1/60"
                  >
                    <div dir="ltr" className="col-span-2 sm:col-span-1 text-[11px] tracking-[0.3em] font-bold text-sand tnum">
                      {t.no}
                    </div>
                    <div className="col-span-10 sm:col-span-4">
                      <div className="t-h3">
                        {lang === "en" ? t.en : t.ar}
                      </div>
                      <div
                        dir={lang === "en" ? "rtl" : "ltr"}
                        className={`text-caption uppercase text-muted-foreground mt-1 ${
                          lang === "en" ? "" : "tracking-[0.2em]"
                        }`}
                      >
                        {lang === "en" ? t.ar : t.en}
                      </div>
                    </div>
                    <p className="col-span-12 sm:col-span-7 t-body text-[14px]">
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
                <span className="inline-flex items-center justify-center h-14 px-9 rounded-full cta-fill font-bold text-xs tracking-[0.2em] uppercase transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-16px_hsl(354_82%_30%_/_0.55)]">
                  {lang === "en" ? "Donate to the new branch" : "تبرّع للفرع الجديد"}
                </span>
              </MagneticButton>
              <a
                href="https://nastonas.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-14 px-7 text-fg-secondary hover:text-foreground transition-colors font-bold text-xs tracking-[0.2em] uppercase underline-offset-8 hover:underline"
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
