import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";

interface Stats {
  total: number;
  byType: { type: string; c: number }[];
  byGender: { gender: string; c: number }[];
  bySkill: { skill: string; c: number }[];
  withLinkedin: number;
}

export default function AdminStats() {
  const { t } = useLanguage();
  const [s, setS] = useState<Stats | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    document.title = "Stats · Admin · Island Haven";
  }, []);
  useEffect(() => {
    let alive = true;
    api<Stats>("/admin/stats")
      .then((r) => alive && setS(r))
      .catch((e) => {
        if (!alive) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) setDenied(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (denied) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <Lock className="mb-4 h-8 w-8 text-primary" aria-hidden />
        <h1 className="font-display text-2xl font-bold text-foreground">
          {t({ ar: "تحتاج صلاحيّة إداريّة", en: "Admin access required" })}
        </h1>
        <Link href="/login" className="cta-fill mt-6 inline-flex items-center rounded-full px-6 py-2.5 text-[14px] font-semibold">
          {t({ ar: "تسجيل الدخول", en: "Sign in" })}
        </Link>
      </main>
    );
  }

  const maxSkill = s?.bySkill[0]?.c ?? 1;

  return (
    <main id="admin-stats" className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <div className="eyebrow eyebrow-sand mb-2">Admin</div>
        <h1 className="font-display text-3xl font-bold text-foreground">{t({ ar: "إحصاءات المجتمع", en: "Community stats" })}</h1>
      </header>

      {s === null ? (
        <div className="h-[50vh] animate-pulse rounded-2xl bg-white/[0.03]" aria-hidden />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { v: s.total, l: t({ ar: "الإجمالي", en: "Total" }) },
              ...s.byType.map((x) => ({ v: x.c, l: x.type })),
              { v: s.withLinkedin, l: t({ ar: "لديه لينكدإن", en: "With LinkedIn" }) },
            ].map((x, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="font-mono text-3xl font-black text-sand-bright tnum">{x.v}</div>
                <div className="mt-1 text-[12px] text-fg-secondary">{x.l}</div>
              </div>
            ))}
          </div>

          <section>
            <h2 className="mb-4 text-lg font-bold text-foreground">{t({ ar: "حسب المهارة", en: "By skill" })}</h2>
            <div className="space-y-2.5">
              {s.bySkill.map((sk) => (
                <div key={sk.skill} className="flex items-center gap-3">
                  <div className="w-44 shrink-0 truncate text-[12.5px] text-fg-secondary sm:w-64">{sk.skill}</div>
                  <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                    <div className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-r from-primary/70 to-[#DDBD7E]/80" style={{ width: `${Math.max(6, (sk.c / maxSkill) * 100)}%` }} />
                  </div>
                  <div className="w-8 shrink-0 text-end font-mono tabular-nums text-[12px] text-fg-faint">{sk.c}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-foreground">{t({ ar: "حسب الجنس", en: "By gender" })}</h2>
            <div className="flex gap-4">
              {s.byGender.map((g) => (
                <div key={g.gender} className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3">
                  <span className="font-mono text-xl font-bold text-foreground tnum">{g.c}</span>
                  <span className="ms-2 text-[12px] text-fg-secondary">{g.gender}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
