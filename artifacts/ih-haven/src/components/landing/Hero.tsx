import { motion } from "framer-motion";
import { ArrowLeft, MapPin } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col pt-28 overflow-hidden bg-background">
      {/* Background photo strip */}
      <div className="absolute top-0 left-0 w-[42%] h-full z-0 hidden lg:block">
        <img
          src="/photos/IMG_8357.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-background via-background/10 to-transparent" />
        <div className="absolute inset-0 bg-foreground/25" />
      </div>
      <div className="absolute top-0 left-[42%] w-[1px] h-full z-0 bg-foreground/10 hidden lg:block" />

      {/* Mobile bg */}
      <div className="absolute inset-0 z-0 lg:hidden">
        <img
          src="/photos/IMG_8357.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/85" />
      </div>

      <div className="container relative z-10 mx-auto px-6 lg:px-10 max-w-7xl flex-1 flex flex-col justify-center py-16">
        {/* Top meta bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between text-xs font-medium tracking-[0.25em] uppercase text-foreground/70 mb-12 lg:mb-20"
        >
          <span className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            Gaza · Palestine
          </span>
          <span className="hidden md:inline">EST. 2024 — A Nas to Nas Initiative</span>
          <span className="text-primary font-semibold">N°01</span>
        </motion.div>

        <div className="grid grid-cols-12 gap-6 lg:gap-10 items-end">
          {/* Massive Arabic statement */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
            className="col-span-12 lg:col-span-9 lg:col-start-4"
          >
            <div className="text-[10px] tracking-[0.4em] uppercase text-primary font-bold mb-4">
              — مساحة · مجتمع · مستقبل
            </div>
            <h1
              className="font-black text-foreground leading-[0.85] tracking-tight"
              style={{
                fontFamily: "Cairo, sans-serif",
                fontSize: "clamp(3.5rem, 11vw, 11rem)",
              }}
            >
              مساحة <br />
              <span className="text-primary italic font-black">تتّسع</span>
              {" "}
              <span className="text-foreground/90">لأحلامك.</span>
            </h1>

            <div className="mt-6 lg:mt-8 flex items-center gap-5">
              <div className="h-px flex-1 bg-foreground/25 max-w-[120px]" />
              <span className="text-2xl md:text-3xl font-bold text-foreground tracking-tight" style={{ fontFamily: "Cairo, sans-serif" }}>
                Island Haven
              </span>
              <div className="h-px flex-1 bg-foreground/25 max-w-[120px]" />
            </div>
          </motion.div>
        </div>

        {/* Bottom row: description + CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="grid grid-cols-12 gap-6 lg:gap-10 mt-14 lg:mt-24"
        >
          <div className="col-span-12 lg:col-span-5">
            <p className="text-base md:text-lg text-foreground/85 leading-relaxed font-light max-w-md">
              مجتمع مهنيّ في قلب غزّة يحتضن المستقلّين والخريجين وطلبة الجامعات.
              <span className="font-medium text-foreground"> ٣٩ مقعداً</span>،
              <span className="font-medium text-foreground"> ٨٠ منتسباً</span>،
              <span className="font-medium text-foreground"> ١٠٠٪ مجاناً</span>.
            </p>
          </div>

          <div className="col-span-12 lg:col-span-7 flex flex-wrap gap-3 lg:justify-end items-center">
            <a
              href="https://forms.gle/5r7dEeidxjg46m399"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-14 px-8 rounded-none bg-foreground text-background font-bold text-sm tracking-wider uppercase hover:bg-primary transition-colors group"
            >
              سجّل للانتساب
              <ArrowLeft className="mr-3 h-4 w-4 rtl:rotate-180 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfniqnKG8t7m4fmXtPum8RZpXDYIDDj5AvfAoSA4JvKKbh5kg/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-14 px-8 rounded-none border-2 border-foreground text-foreground font-bold text-sm tracking-wider uppercase hover:bg-foreground hover:text-background transition-colors"
            >
              مقعد ضيف
            </a>
            <a
              href="#story"
              className="inline-flex items-center justify-center h-14 px-4 text-foreground font-medium text-sm tracking-wide hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              اقرأ قصّتنا ←
            </a>
          </div>
        </motion.div>
      </div>

      {/* Bottom strip with stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="relative z-10 border-t border-foreground/15 bg-background/60 backdrop-blur-sm"
      >
        <div className="container mx-auto px-6 lg:px-10 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-foreground/15 rtl:divide-x-reverse">
            {[
              { k: "الطاقة الاستيعابيّة", v: "٣٩", s: "مقعد عمل" },
              { k: "المنتسبون النشطون", v: "٨٠", s: "أسبوعيّاً" },
              { k: "الفئات المستهدفة", v: "٣", s: "مهنيّة" },
              { k: "كلفة الانتساب", v: "٠$", s: "مجانيّ بالكامل" },
            ].map((it, i) => (
              <div key={i} className="px-4 py-6 lg:px-8 lg:py-8 text-right">
                <div className="text-[10px] tracking-[0.25em] uppercase text-foreground/60 font-medium mb-2">
                  {it.k}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFamily: "Cairo, sans-serif" }}>
                    {it.v}
                  </span>
                  <span className="text-xs text-foreground/60 font-light">{it.s}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
