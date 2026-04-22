import { motion } from "framer-motion";
import { EditorialHeader, HairlineRow } from "./EditorialHeader";
import { useContentSection } from "@/hooks/use-content";

export function About() {
  const aboutContent = useContentSection("about", { headline: "", body: "" });
  return (
    <section id="about" className="relative bg-background py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-10 max-w-[1500px]">
        <EditorialHeader
          label="من نحن"
          title={
            <>
              مساحة <span className="text-accent-gradient">نجاة</span> مهنيّة،
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

        <div className="grid grid-cols-12 gap-6 lg:gap-12">
          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="col-span-12 lg:col-span-5"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-soft">
              <img
                src={`${import.meta.env.BASE_URL}photos/IMG_8347.jpg`}
                alt="ركن من مكاتب آيلاند هيفن المفتوحة للمستقلّين والخرّيجين والطلبة"
                className="w-full aspect-[4/5] object-cover"
              />
            </div>
            <p className="mt-7 text-foreground/85 text-lg leading-relaxed">
              «نعم هو مكان للعمل، لكنّه قبل ذلك مساحة للالتقاء، وللتعلّم،
              ولبناء الثقة بالنفس وبالطريق.»
            </p>
          </motion.div>

          {/* Three pillars */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
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
              body="تمكين الطلاب والخرّيجين والمستقلّين عبر توفير مجتمع داعم، ومساحة عمل آمنة، وبرامج تدريب عمليّة، وفرص تشبيك حقيقيّة، تُقارب الواقع وتستجيب لحاجاته."
            />
            <HairlineRow
              no="03"
              ar="لماذا مجتمع؟"
              en="Why community?"
              body="لأنّ العمل الفرديّ في بيئات غير مستقرّة يُرهق أكثر ممّا يُنتج. ولأنّ الكثير من الطاقات الشابّة لديها الرغبة والقدرة، لكنّها تفتقد المكان والدعم والتوجيه."
            />
            <div className="border-t border-border" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
