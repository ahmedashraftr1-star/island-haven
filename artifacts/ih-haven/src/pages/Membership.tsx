import { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContentSection } from "@/hooks/use-content";
import { api } from "@/lib/api";

// PUBLIC shape only — mirrors /api/roster (no sensitive fields ever arrive here).
interface RosterMember {
  id: number;
  fullName: string;
  fullNameEn: string;
  type: "student" | "graduate" | "freelancer";
  gender: "male" | "female";
  skill: string;
  field: string;
}
// Bilingual page chrome — the editable CMS fallback ("pageMembership" section).
const CMS = {
  eyebrow: "مجتمع المواهب · TALENT",
  eyebrowEn: "Talent Community · مجتمع",
  title: "مواهب",
  titleEn: "The talent",
  highlight: "غزّة",
  highlightEn: "of Gaza",
  subtitle:
    "طلابٌ وخرّيجون ومستقلّون من آيلاند هيفن — مطوّرون، مصمّمون، ومحلّلو بيانات يبنون من قلب غزّة نحو العالم.",
  subtitleEn:
    "Students, graduates and freelancers of Island Haven — developers, designers and data analysts building from the heart of Gaza to the world.",
  statLabel: "موهبة في المجتمع",
  statLabelEn: "talents in the community",
  typeStudent: "طالب",
  typeStudentEn: "Student",
  typeGraduate: "خريج",
  typeGraduateEn: "Graduate",
  typeFreelancer: "مستقلّ",
  typeFreelancerEn: "Freelancer",
  chipAll: "الكل",
  chipAllEn: "All",
  chipStudent: "الطلاب",
  chipStudentEn: "Students",
  chipGraduate: "الخرّيجون",
  chipGraduateEn: "Graduates",
  chipFreelancer: "المستقلّون",
  chipFreelancerEn: "Freelancers",
  searchPlaceholder: "ابحث…",
  searchPlaceholderEn: "Search…",
  error: "تعذّر تحميل المجتمع.",
  errorEn: "Couldn't load the community.",
  empty: "لا نتائج مطابقة.",
  emptyEn: "No matching talents.",
};

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toAr = (s: string | number) => String(s).replace(/\d/g, (d) => AR_DIGITS[+d]);

// Initials from the first two name parts (honorifics are already absent here).
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export default function Membership() {
  const { t, lang } = useLanguage();
  const c = useContentSection("pageMembership", CMS);
  // Role labels (hero stat breakdown + card badges) — sourced from the CMS.
  const TYPE_LABEL: Record<RosterMember["type"], { ar: string; en: string }> = {
    student: { ar: c.typeStudent, en: c.typeStudentEn },
    graduate: { ar: c.typeGraduate, en: c.typeGraduateEn },
    freelancer: { ar: c.typeFreelancer, en: c.typeFreelancerEn },
  };
  const [all, setAll] = useState<RosterMember[] | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<"all" | RosterMember["type"]>("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    document.title = t({
      ar: "مجتمع المواهب — آيلاند هيفن",
      en: "Talent Community — Island Haven",
    });
  }, [lang, t]);

  useEffect(() => {
    let alive = true;
    // The default /api/roster returns the WHOLE community in one call (returned
    // length == total). Every counter below is derived from THIS list, so the
    // numbers can never disagree with what's shown.
    api<{ members: RosterMember[] }>("/roster")
      .then((r) => alive && setAll(r.members))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  // Real counts, straight from the fetched rows — no hardcoded totals.
  const counts = useMemo(() => {
    const c = { total: all?.length ?? 0, student: 0, graduate: 0, freelancer: 0 };
    for (const m of all ?? []) c[m.type]++;
    return c;
  }, [all]);

  const visible = useMemo(() => {
    if (!all) return [];
    const needle = q.trim().toLowerCase();
    return all.filter(
      (m) =>
        (filter === "all" || m.type === filter) &&
        (!needle ||
          m.fullName.toLowerCase().includes(needle) ||
          m.skill.toLowerCase().includes(needle)),
    );
  }, [all, filter, q]);

  const n = (x: number) => (lang === "ar" ? toAr(x) : String(x));

  const chips: { key: "all" | RosterMember["type"]; label: { ar: string; en: string }; count: number }[] = [
    { key: "all", label: { ar: c.chipAll, en: c.chipAllEn }, count: counts.total },
    { key: "student", label: { ar: c.chipStudent, en: c.chipStudentEn }, count: counts.student },
    { key: "graduate", label: { ar: c.chipGraduate, en: c.chipGraduateEn }, count: counts.graduate },
    { key: "freelancer", label: { ar: c.chipFreelancer, en: c.chipFreelancerEn }, count: counts.freelancer },
  ];

  return (
    <PageShell
      active="membership"
      eyebrow={t({ ar: c.eyebrow, en: c.eyebrowEn })}
      title={t({ ar: c.title, en: c.titleEn })}
      highlight={t({ ar: c.highlight, en: c.highlightEn })}
      subtitle={t({ ar: c.subtitle, en: c.subtitleEn })}
      heroAside={
        <GlassCard className="p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="font-mono font-black text-sand-bright tnum leading-none" style={{ fontSize: "clamp(2.4rem,6vw,3.4rem)" }}>
              {all ? n(counts.total) : "—"}
            </span>
            <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted-foreground rtl:tracking-normal leading-relaxed max-w-[8rem]">
              {t({ ar: c.statLabel, en: c.statLabelEn })}
            </span>
          </div>
          <div className="mt-5 border-t border-border-strong pt-4 grid grid-cols-3 gap-3 min-h-[3.5rem]">
            {(["student", "graduate", "freelancer"] as const).map((k) => (
              <div key={k}>
                <div className="font-mono font-bold text-foreground tnum text-[1.05rem]">
                  {all ? n(counts[k]) : "—"}
                </div>
                <div className="text-[10.5px] text-fg-secondary mt-0.5">{t(TYPE_LABEL[k])}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      }
    >
      {/* Filter + search */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t({ ar: "تصفية حسب الفئة", en: "Filter by category" })}>
          {chips.map((c) => {
            const on = filter === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setFilter(c.key)}
                aria-pressed={on}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                  on
                    ? "bg-primary/[0.12] text-primary-bright ring-1 ring-inset ring-primary/30"
                    : "bg-white/[0.04] text-fg-secondary ring-1 ring-inset ring-white/10 hover:bg-white/[0.07]"
                }`}
              >
                {t(c.label)}
                <span className="inline-block min-w-[1.6rem] text-center font-mono tabular-nums text-[11px] text-fg-faint">{all ? n(c.count) : ""}</span>
              </button>
            );
          })}
        </div>
        <div className="relative sm:w-64">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-fg-faint" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={t({ ar: "ابحث بالاسم أو المهارة", en: "Search by name or skill" })}
            placeholder={t({ ar: c.searchPlaceholder, en: c.searchPlaceholderEn })}
            className="w-full rounded-full border border-white/10 bg-white/[0.04] ps-9 pe-4 py-2 text-[13.5px] text-foreground placeholder:text-fg-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          />
        </div>
      </div>

      {/* Grid */}
      {error ? (
        <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-[14px] text-rose-300">
          {t({ ar: c.error, en: c.errorEn })}
        </p>
      ) : all === null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 min-h-[60vh]" aria-hidden>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-[104px] rounded-2xl bg-white/[0.03]" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border-strong/70 px-6 py-[clamp(3rem,7vw,5rem)] text-center text-fg-secondary">
          {t({ ar: c.empty, en: c.emptyEn })}
        </p>
      ) : (
        <>
          <p className="sr-only" role="status" aria-live="polite">
            {t({ ar: `${n(visible.length)} نتيجة`, en: `${visible.length} results` })}
          </p>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((m) => {
              const name = lang === "en" && m.fullNameEn ? m.fullNameEn : m.fullName;
              return (
                <li key={m.id}>
                  <article className="flex h-full items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-primary/25 hover:bg-white/[0.05]">
                    <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/[0.06] font-bold text-sand-bright ring-1 ring-inset ring-white/10">
                      {initials(name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-semibold leading-tight text-foreground">{name}</h3>
                      <p className="mt-1 text-[12.5px] text-fg-secondary line-clamp-2">{m.skill}</p>
                      <span className="mt-2 inline-flex items-center rounded-full bg-white/[0.05] px-2 py-0.5 text-[10.5px] font-semibold text-sand-bright ring-1 ring-inset ring-white/10">
                        {t(TYPE_LABEL[m.type])}
                      </span>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </PageShell>
  );
}
