import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Star } from "lucide-react";
import { EditorialHeader } from "./EditorialHeader";
import { api } from "@/lib/api";
import { splitTags } from "@/lib/labels";
import { useLanguage } from "@/contexts/LanguageContext";

interface ExpertCard {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  headline: string;
  expertise: string;
  featured: boolean;
}

export function ExpertsBand() {
  const { lang } = useLanguage();
  const [rows, setRows] = useState<ExpertCard[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ experts: ExpertCard[] }>("/experts")
      .then((r) => {
        if (!cancelled) setRows(r.experts.slice(0, 6));
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (rows !== null && rows.length === 0) return null;

  return (
    <section
      id="experts"
      className="relative bg-background py-24 lg:py-32 overflow-hidden"
    >
      <div className="container mx-auto px-6 lg:px-12 max-w-[1500px]">
        <EditorialHeader
          label={lang === "en" ? "Mentorship & Expertise" : "الإرشاد والخبرة"}
          title={
            lang === "en" ? (
              <>
                Experts who guide you toward{" "}
                <span className="text-accent-gradient">real impact</span>
              </>
            ) : (
              <>
                خبراء يأخذون بيدك نحو{" "}
                <span className="text-accent-gradient">الأثر</span>
              </>
            )
          }
          sub={
            lang === "en"
              ? "A curated network of mentors, entrepreneurs, and specialists. Book a free 1-on-1 mentorship session and turn your idea into a scalable venture."
              : "نخبة من المرشدين وروّاد الأعمال والمتخصّصين. احجز جلسة إرشاد فرديّة مَجّانًا، وحوّل فكرتك إلى مشروع قابل للنموّ."
          }
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
          {(rows ?? Array.from({ length: 3 }).map(() => null)).map(
            (e, i) =>
              e ? (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                >
                  <Link
                    href={`/experts/${e.id}`}
                    className="group block h-full rounded-3xl p-6 bg-white border border-foreground/8 shadow-soft hover:shadow-soft-hover hover:-translate-y-0.5 transition-all"
                    data-testid={`home-expert-${e.id}`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {e.avatarUrl ? (
                        <img
                          src={e.avatarUrl}
                          alt={e.fullName}
                          className="w-14 h-14 rounded-2xl object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-primary-soft text-primary flex items-center justify-center text-xl font-bold">
                          {e.fullName.trim().charAt(0) || "؟"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-foreground text-[15.5px] truncate">
                          {e.fullName}
                        </div>
                        {e.headline && (
                          <div className="text-foreground/55 text-[12.5px] truncate">
                            {e.headline}
                          </div>
                        )}
                      </div>
                      {e.featured && (
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400 ms-auto shrink-0" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {splitTags(e.expertise)
                        .slice(0, 3)
                        .map((a) => (
                          <span
                            key={a}
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-muted text-foreground/65"
                          >
                            {a}
                          </span>
                        ))}
                    </div>
                  </Link>
                </motion.div>
              ) : (
                <div
                  key={i}
                  className="h-40 rounded-3xl bg-foreground/[0.03] border border-foreground/8 animate-pulse"
                />
              ),
          )}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/experts"
            className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-bold text-[14px] hover:shadow-soft-hover hover:-translate-y-0.5 transition-all"
            data-testid="link-all-experts"
          >
            <Sparkles className="w-4 h-4" />
            {lang === "en" ? "Browse all experts & book a session" : "تصفّح جميع الخبراء واحجز جلستك"}
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
