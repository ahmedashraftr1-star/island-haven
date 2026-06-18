import { useEffect, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Globe, Linkedin, Mail, Sparkles, Users } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";

type RoleGroup = "leadership" | "mentors" | "advisors" | "support";

interface TeamMember {
  id: number;
  fullName: string;
  role: string;
  bio: string;
  avatarUrl: string | null;
  linkedinUrl: string;
  websiteUrl: string;
  email: string;
  group: RoleGroup;
  featured: boolean;
}

const GROUPS: {
  key: RoleGroup;
  index: string;
  ar: string;
  en: string;
  blurb: string;
  variant: "lead" | "compact";
}[] = [
  {
    key: "leadership",
    index: "٠١",
    ar: "القيادة",
    en: "Leadership",
    blurb: "الفريق المؤسّس الذي يبني الحاضنة، ويرسم رؤيتها، ويقف خلف كلّ رائد.",
    variant: "lead",
  },
  {
    key: "mentors",
    index: "٠٢",
    ar: "المرشدون",
    en: "Mentors",
    blurb: "خبراء يرافقون الفرق في رحلتها التقنيّة وبناء المنتج خطوةً بخطوة.",
    variant: "compact",
  },
  {
    key: "advisors",
    index: "٠٣",
    ar: "المستشارون",
    en: "Advisors",
    blurb: "مستشارو الأعمال والتمويل والقانون الذين يفتحون الأبواب الصعبة.",
    variant: "compact",
  },
  {
    key: "support",
    index: "٠٤",
    ar: "الدّعم والتشغيل",
    en: "Support",
    blurb: "الفريق الذي يُبقي المجتمع يعمل يومًا بيوم، خلف الكواليس.",
    variant: "compact",
  },
];

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

export default function Team() {
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    document.title = "فريق آيلاند — حاضنة أعمال غزّة";
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<{ team: TeamMember[] }>("/team")
      .then((r) => !cancelled && setTeam(r.team))
      .catch(
        (e) =>
          !cancelled &&
          setError(e instanceof ApiError ? e.message : "تعذّر تحميل الفريق"),
      );
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = (team ?? []).reduce<Record<RoleGroup, TeamMember[]>>(
    (acc, m) => {
      (acc[m.group] ||= []).push(m);
      return acc;
    },
    { leadership: [], mentors: [], advisors: [], support: [] },
  );
  const sections = GROUPS.filter((g) => grouped[g.key]?.length);
  const total = team?.length ?? 0;

  return (
    <PageShell
      eyebrow="من يقف خلف الحاضنة · The Team"
      title="فريق"
      highlight="آيلاند"
      subtitle="حاضنة أعمال يقودها فريق غزّاويّ-دوليّ يؤمن بأنّ المواهب هنا تستحقّ بيئة عمل، إرشادًا، ودعمًا حقيقيّاً. نَنمو معكم، خطوة بخطوة."
    >
      {error && (
        <GlassCard className="p-5 text-red-200 text-center">{error}</GlassCard>
      )}

      {team === null && !error ? (
        <SkeletonTeam />
      ) : team && team.length === 0 ? (
        <EmptyState
          title="سيُعلَن عن الفريق قريبًا"
          hint="نُجهّز ملفّات الفريق والمرشدين — تابعنا."
        />
      ) : (
        <>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap items-center gap-2.5 mb-14 sm:mb-16"
          >
            <Chip>{toArabicNum(total)} عضوًا في الفريق</Chip>
            <Chip>{toArabicNum(sections.length)} فِرَق</Chip>
            <Chip>بدعمٍ من · من النّاس إلى النّاس</Chip>
          </motion.div>

          {sections.map((g) => (
            <TeamSection
              key={g.key}
              group={g}
              members={grouped[g.key]}
              reduce={!!reduce}
            />
          ))}
        </>
      )}

      {/* Join us */}
      <div className="relative mt-16 rounded-[28px] p-8 sm:p-11 bg-white/[0.04] border border-white/10 text-center overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full"
          style={{
            background:
              "radial-gradient(circle, hsl(354 80% 55% / 0.12), transparent 70%)",
          }}
        />
        <div className="relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/25 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-white font-bold text-[19px] sm:text-[21px] mb-2.5">
            هل تريد الانضمام إلى الفريق؟
          </h3>
          <p className="text-white/55 text-[14px] leading-[1.9] max-w-md mx-auto mb-6">
            نَبحث دائماً عن مرشدين، وخبراء قطاع، ومتطوّعين يُؤمنون بريادة الأعمال
            في غزّة. راسلنا وقُل لنا كيف تُريد أن تُساهم.
          </p>
          <a
            href="mailto:island-haven@nastonas.org?subject=الانضمام%20لفريق%20آيلاند"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold text-[14px] hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] hover:-translate-y-px transition-all"
          >
            <Mail className="w-4 h-4" />
            راسلنا
          </a>
        </div>
      </div>
    </PageShell>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[12.5px] font-medium text-white/70 bg-white/[0.04] border border-white/10">
      {children}
    </span>
  );
}

function TeamSection({
  group,
  members,
  reduce,
}: {
  group: (typeof GROUPS)[number];
  members: TeamMember[];
  reduce: boolean;
}) {
  const isLead = group.variant === "lead";
  return (
    <section className="relative mb-16 sm:mb-24">
      <div className="relative mb-7 sm:mb-9">
        <span
          aria-hidden
          className="absolute -top-7 sm:-top-9 right-0 select-none font-black leading-none"
          style={{
            fontSize: "clamp(4.5rem, 13vw, 9rem)",
            WebkitTextStroke: "1.25px rgba(255,255,255,0.065)",
            color: "transparent",
          }}
        >
          {group.index}
        </span>
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <h2
              className="text-white font-bold"
              style={{ fontSize: "clamp(1.3rem, 3vw, 1.85rem)", letterSpacing: "-0.025em" }}
            >
              {group.ar}
            </h2>
            <span className="text-[10.5px] tracking-[0.22em] uppercase text-white/35 font-bold">
              {group.en}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-primary bg-primary/10 border border-primary/25">
              <Users className="w-3 h-3" />
              {toArabicNum(members.length)}
            </span>
          </div>
          <p className="text-white/50 text-[13.5px] leading-[1.8] max-w-xl">
            {group.blurb}
          </p>
        </div>
      </div>

      <motion.div
        variants={reduce ? undefined : stagger}
        initial={reduce ? undefined : "hidden"}
        whileInView={reduce ? undefined : "show"}
        viewport={{ once: true, margin: "-8% 0px" }}
        className={
          isLead
            ? "grid sm:grid-cols-2 gap-5"
            : "grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        }
      >
        {members.map((m) => (
          <TeamCard key={m.id} m={m} variant={group.variant} reduce={reduce} />
        ))}
      </motion.div>
    </section>
  );
}

function TeamCard({
  m,
  variant,
  reduce,
}: {
  m: TeamMember;
  variant: "lead" | "compact";
  reduce: boolean;
}) {
  const isLead = variant === "lead";
  const initials = m.fullName.trim().charAt(0) || "؟";
  return (
    <motion.div
      variants={reduce ? undefined : rise}
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="h-full"
    >
      <GlassCard
        className={`group h-full flex flex-col ${
          isLead ? "p-7" : "p-6"
        } transition-colors duration-300 hover:border-primary/40 hover:bg-white/[0.06]`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(130% 90% at 85% 0%, hsl(354 80% 55% / 0.1), transparent 60%)",
          }}
        />

        {m.featured && (
          <div className="relative inline-flex items-center gap-1.5 self-start mb-4 px-2.5 py-0.5 rounded-full text-[10px] tracking-[0.16em] uppercase font-bold bg-amber-400/10 text-amber-200 border border-amber-400/30">
            <Sparkles className="w-3 h-3" /> مميَّز
          </div>
        )}

        <div className="relative flex items-center gap-4 mb-4">
          {m.avatarUrl ? (
            <img
              src={m.avatarUrl}
              alt={m.fullName}
              className={`${
                isLead ? "w-20 h-20" : "w-16 h-16"
              } rounded-2xl object-cover border border-white/10`}
              loading="lazy"
            />
          ) : (
            <div
              className={`${
                isLead ? "w-20 h-20 text-[1.9rem]" : "w-16 h-16 text-2xl"
              } shrink-0 rounded-2xl bg-gradient-to-br from-primary/35 to-primary/[0.06] border border-white/10 flex items-center justify-center font-bold text-white/90 transition-transform duration-300 group-hover:scale-[1.06]`}
            >
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <h3
              className={`text-white font-bold leading-snug truncate ${
                isLead ? "text-[18px]" : "text-[16px]"
              }`}
            >
              {m.fullName}
            </h3>
            {m.role && (
              <p className="text-primary/90 text-[12.5px] font-medium leading-snug mt-0.5 line-clamp-2">
                {m.role}
              </p>
            )}
          </div>
        </div>

        {m.bio && (
          <p
            className={`relative text-white/65 text-[13.5px] leading-[1.85] mb-5 flex-1 ${
              isLead ? "" : "line-clamp-3"
            }`}
          >
            {m.bio}
          </p>
        )}

        {(m.linkedinUrl || m.websiteUrl || m.email) && (
          <div className="relative flex items-center flex-wrap gap-3 mt-auto pt-3.5 border-t border-white/[0.06]">
            {m.linkedinUrl && (
              <a
                href={m.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="inline-flex items-center gap-1.5 text-[12px] text-white/65 hover:text-primary transition-colors"
              >
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
              </a>
            )}
            {m.websiteUrl && (
              <a
                href={m.websiteUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="الموقع"
                className="inline-flex items-center gap-1.5 text-[12px] text-white/65 hover:text-primary transition-colors"
              >
                <Globe className="w-3.5 h-3.5" /> الموقع
              </a>
            )}
            {m.email && (
              <a
                href={`mailto:${m.email}`}
                aria-label="البريد"
                className="inline-flex items-center gap-1.5 text-[12px] text-white/65 hover:text-primary transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span dir="ltr">{m.email}</span>
              </a>
            )}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}

function SkeletonTeam() {
  return (
    <div className="space-y-12">
      <div className="flex gap-2.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-8 w-32 rounded-full bg-white/[0.04] border border-white/10 animate-pulse"
          />
        ))}
      </div>
      {[0, 1].map((s) => (
        <div key={s}>
          <div className="h-7 w-44 rounded-lg bg-white/[0.05] animate-pulse mb-6" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-[24px] h-52 bg-white/[0.035] border border-white/10 animate-pulse"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
