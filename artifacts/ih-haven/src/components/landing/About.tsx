import { motion } from "framer-motion";
import { EditorialHeader, HairlineRow } from "./EditorialHeader";
import { useContentSection } from "@/hooks/use-content";

export function About() {
  const aboutContent = useContentSection("about", {
    headline: "",
    body: "",
  });
  return (
    <section id="about" className="relative bg-background py-24 lg:py-32 overflow-hidden">
      <div className="container mx-auto px-6 lg:px-10 max-w-7xl">
        <EditorialHeader
          no="04"
          label="من نحن"
          meta={<>About<br />Island Haven</>}
          title={
            <>
              مساحة <span className="text-primary italic">نجاة</span> مهنيّة،
              <br />
              قبل أن تكون مكاناً للعمل.
            </>
          }
          sub={
            aboutContent.body ? (
              <>{aboutContent.body}</>
            ) : (
              <>
                في واقعٍ تتكاثر فيه التحديات وتضيق فيه المساحات الآمنة للتعلّم والعمل،
                وُلد <span className="text-foreground font-medium">Island Haven</span>{" "}
                كفكرة بسيطة في جوهرها، عميقة في أثرها: أن يجد الإنسان مكاناً يحتضن طاقته،
                ويحترم وقته، ويؤمن بقدرته على النمو، مهما كانت الظروف.
              </>
            )
          }
        />

        <div className="grid grid-cols-12 gap-6 lg:gap-10">
          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9 }}
            className="col-span-12 lg:col-span-5"
          >
            <div className="relative">
              <img
                src="/photos/IMG_8347.jpg"
                alt="ركن من مكاتب آيلاند هيفن المفتوحة للمستقلّين والخرّيجين والطلبة"
                className="w-full aspect-[4/5] object-cover grayscale-[10%]"
              />
              <div className="absolute -bottom-4 right-4 text-[10px] tracking-[0.4em] uppercase font-bold text-foreground/50">
                Plate · 04A
              </div>
            </div>
            <p
              className="mt-8 text-foreground italic text-lg leading-relaxed"
            >
              «نعم هو مكان للعمل، لكنه قبل ذلك مساحة للالتقاء، وللتعلّم، ولبناء الثقة بالنفس وبالطريق.»
            </p>
          </motion.div>

          {/* Three pillars in tabular hairline rows */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="col-span-12 lg:col-span-7"
          >
            <HairlineRow
              no="01"
              ar="رؤيتنا"
              en="Vision"
              body="أن نُسهم في بناء مجتمع مهنيّ قادر، يمتلك الأدوات والمهارات التي تمكّنه من الاندماج الفعّال في سوق العمل، وبناء مستقبل مستدام قائم على المعرفة والخبرة والتعاون."
            />
            <HairlineRow
              no="02"
              ar="رسالتنا"
              en="Mission"
              body="تمكين الطلاب والخريجين والمستقلّين عبر توفير مجتمع داعم، ومساحة عمل آمنة، وبرامج تدريب عمليّة، وفرص تشبيك حقيقيّة، تُقارب الواقع وتستجيب لحاجاته."
            />
            <HairlineRow
              no="03"
              ar="لماذا مجتمع؟"
              en="Why community?"
              body="لأنّ العمل الفرديّ في بيئات غير مستقرّة يُرهق أكثر مما يُنتج. ولأنّ الكثير من الطاقات الشابّة لديها الرغبة والقدرة، لكنها تفتقد المكان والدعم والتوجيه."
            />
            <div className="border-t border-foreground/12" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
