import { motion } from "framer-motion";
import { EditorialHeader } from "./EditorialHeader";

const voices = [
  {
    no: "I",
    quote:
      "في واقعٍ تتكاثر فيه التحدّيات وتضيق فيه المساحات الآمنة للتعلّم والعمل، وُلد Island Haven كفكرة بسيطة في جوهرها، عميقة في أثرها.",
    source: "من الملف التعريفي للمجتمع",
  },
  {
    no: "II",
    quote:
      "نعم هو مكانٌ للعمل، لكنّه قبل ذلك مساحة للالتقاء، وللتعلّم، ولبناء الثقة بالنفس وبالطريق.",
    source: "رؤية Island Haven",
  },
  {
    no: "III",
    quote:
      "محاولة جادّة لبناء شيءٍ مستدامٍ في مكانٍ يفتقر إلى الاستقرار، واستثمار حقيقيّ في الإنسان قبل أيّ شيء آخر.",
    source: "كلمة فريق التأسيس",
  },
];

export function Voices() {
  return (
    <section className="relative bg-foreground text-background py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-10 max-w-7xl">
        <EditorialHeader
          no="14"
          label="بكلماتنا"
          dark
          meta={<>In our<br />own words</>}
          title={
            <>
              هكذا <span className="text-primary italic">نُعرّف</span> أنفسنا.
            </>
          }
          sub="مقتطفات من الملفّ التعريفيّ الرسميّ لـ Island Haven، تعكس روح المكان قبل تفاصيله."
        />

        <div className="border-t border-background/15">
          {voices.map((v, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className="grid grid-cols-12 gap-4 lg:gap-10 items-start py-12 lg:py-16 border-b border-background/15"
            >
              <div className="col-span-2 lg:col-span-1 text-2xl lg:text-3xl font-bold text-primary tracking-wider">
                {v.no}
              </div>
              <blockquote
                className="col-span-10 lg:col-span-8 text-background leading-snug"
                style={{
                  fontFamily: "Amiri, serif",
                  fontSize: "clamp(1.4rem, 2.6vw, 2.25rem)",
                  fontStyle: "italic",
                }}
              >
                «{v.quote}»
              </blockquote>
              <figcaption className="col-span-12 lg:col-span-3 lg:text-right text-[10px] tracking-[0.4em] uppercase text-background/60 font-bold lg:pt-3">
                — {v.source}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
