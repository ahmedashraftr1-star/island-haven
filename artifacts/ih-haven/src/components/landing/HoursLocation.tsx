import { motion } from "framer-motion";
import { Clock, MapPin, Phone, Instagram } from "lucide-react";

const hours = [
  { day: "السبت", time: "٩:٠٠ صباحاً — ٨:٠٠ مساءً" },
  { day: "الأحد", time: "٩:٠٠ صباحاً — ٨:٠٠ مساءً" },
  { day: "الاثنين", time: "٩:٠٠ صباحاً — ٨:٠٠ مساءً" },
  { day: "الثلاثاء", time: "٩:٠٠ صباحاً — ٨:٠٠ مساءً" },
  { day: "الأربعاء", time: "٩:٠٠ صباحاً — ٨:٠٠ مساءً" },
  { day: "الخميس", time: "٩:٠٠ صباحاً — ٨:٠٠ مساءً" },
  { day: "الجمعة", time: "٢:٠٠ ظهراً — ٨:٠٠ مساءً" },
];

export function HoursLocation() {
  return (
    <section id="visit" className="py-24 bg-background">
      <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7 }}
            className="rounded-2xl border border-border bg-card p-8 md:p-10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">ساعات العمل</h2>
            </div>

            <ul className="divide-y divide-border">
              {hours.map((h) => (
                <li key={h.day} className="flex items-center justify-between py-3">
                  <span className="text-base text-foreground font-medium">{h.day}</span>
                  <span className="text-base text-muted-foreground font-light">{h.time}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground font-light leading-relaxed">
                قد تتغيّر ساعات العمل وفقاً للظروف الميدانية وانقطاع الكهرباء.
                نُحدّث المواعيد أولاً بأول عبر صفحتنا على إنستغرام.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-8 md:p-10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">زرنا أو راسلنا</h2>
            </div>

            <div className="space-y-6">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  الموقع
                </div>
                <p className="text-base text-foreground font-medium leading-relaxed">
                  مدينة غزة — فلسطين
                </p>
                <p className="text-sm text-muted-foreground font-light leading-relaxed mt-1">
                  العنوان الكامل يُرسل عبر الرسائل الخاصة لضمان السلامة. تواصل معنا أولاً.
                </p>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  للاتصال والاستفسار
                </div>
                <a
                  href="https://www.instagram.com/ih_haven"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-base text-foreground font-medium hover:text-primary transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  ‎@ih_haven
                </a>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  دعم وتنسيق المبادرة
                </div>
                <a
                  href="tel:+970599194922"
                  dir="ltr"
                  className="inline-flex items-center gap-2 text-base text-foreground font-medium hover:text-primary transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  +970 599 194 922
                </a>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                  المساحة مجانية للجميع. لا تحتاج إلى عضوية أو حجز مسبق إلا لاستخدام
                  غرف الاجتماعات.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
