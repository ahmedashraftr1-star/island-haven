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
                مبادرة من{" "}
                <span className="text-foreground font-medium">«من الناس إلى الناس»</span>،
                نوفّر مساحة عمل مجهّزة بالكهرباء والإنترنت، مفتوحة مجّاناً للمبدعين
                والمستقلّين والباحثين عن العلم والعمل في غزّة.
              </>
            )
          }
        />

        <div className="grid grid-cols-12 gap-6 lg:gap-14">
          {/* Photo — refined editorial frame with caption */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-12 lg:col-span-5"
          >
            <figure className="group relative">
              <div className="relative rounded-2xl overflow-hidden shadow-soft-hover">
                <img
                  src={`${import.meta.env.BASE_URL}photos/IMG_8347.jpg`}
                  alt="ركن من مكاتب آيلاند هيفن المفتوحة للمستقلّين والخرّيجين والطلبة"
                  className="w-full aspect-[4/5] object-cover transition-transform duration-[2200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  loading="lazy"
                />
                {/* Cinematic bottom gradient + on-photo caption */}
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/25 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 inset-x-0 p-6 lg:p-7 text-white">
                  <div className="text-[10px] tracking-[0.22em] uppercase font-semibold opacity-75 mb-2">
                    Inside the Haven · من داخل المساحة
                  </div>
                  <div className="text-[15px] lg:text-base leading-snug font-medium max-w-sm">
                    ركنٌ من مكاتب آيلاند هيفن المفتوحة
                    <br className="hidden sm:block" />
                    للمستقلّين والخرّيجين والطلبة.
                  </div>
                </div>
                {/* Top corner mark */}
                <div className="absolute top-5 right-5 inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white/12 backdrop-blur-md border border-white/20 text-[10px] tracking-[0.18em] uppercase font-semibold text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Open · مفتوح
                </div>
              </div>
              {/* Pull-quote sitting beside the frame */}
              <figcaption className="mt-7 pr-5 border-r-2 border-primary/40 text-foreground/85 text-lg leading-relaxed">
                «نعم هو مكان للعمل، لكنّه قبل ذلك مساحة للالتقاء، وللتعلّم،
                ولبناء الثقة بالنفس وبالطريق.»
                <span className="block mt-3 text-[11px] tracking-[0.18em] uppercase text-foreground/45 font-semibold">
                  — رؤية المؤسّسين
                </span>
              </figcaption>
            </figure>
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
