import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";

// Full admin record — includes the sensitive/operational blocks that the PUBLIC
// /api/roster never returns. Reached only via /api/admin/roster (401-gated).
interface AdminMember {
  id: number;
  fullName: string;
  type: string;
  gender: string;
  skill: string;
  phone: string;
  birthYear: number | null;
  seat: number | null;
  days: string;
  period: string;
  linkedinUrl: string;
  linkedinPublic: boolean;
  cvUrl: string;
}

export default function AdminMembers() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<AdminMember[] | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    document.title = "Members · Admin · Island Haven";
  }, []);
  useEffect(() => {
    let alive = true;
    api<{ members: AdminMember[] }>("/admin/roster")
      .then((r) => alive && setRows(r.members))
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
        <p className="mt-2 text-[14px] text-fg-secondary">
          {t({ ar: "سجّل الدخول بحساب إداريّ لعرض بيانات المنتسبين الكاملة.", en: "Sign in with an admin account to view full member records." })}
        </p>
        <Link href="/login" className="cta-fill mt-6 inline-flex items-center rounded-full px-6 py-2.5 text-[14px] font-semibold">
          {t({ ar: "تسجيل الدخول", en: "Sign in" })}
        </Link>
      </main>
    );
  }

  return (
    <main id="admin-members" className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
      <header className="mb-6">
        <div className="eyebrow eyebrow-sand mb-2">Admin</div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t({ ar: "المنتسبون", en: "Members" })}
          {rows && <span className="ms-3 font-mono text-lg text-fg-faint">{rows.length}</span>}
        </h1>
        <p className="mt-2 text-[13px] text-fg-secondary">
          {t({ ar: "السجلّ الكامل — الحقول الحسّاسة (هاتف/ميلاد/CV) تظهر هنا فقط ولا تُسرَّب علنًا.", en: "Full records — sensitive fields (phone/birth/CV) appear here only and are never exposed publicly." })}
        </p>
      </header>

      {rows === null ? (
        <div className="h-[60vh] animate-pulse rounded-2xl bg-white/[0.03]" aria-hidden />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[900px] border-collapse text-start text-[13px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-fg-secondary">
                {["#", t({ ar: "الاسم", en: "Name" }), t({ ar: "الفئة", en: "Type" }), t({ ar: "المهارة", en: "Skill" }), t({ ar: "الهاتف", en: "Phone" }), t({ ar: "الميلاد", en: "Birth" }), t({ ar: "المقعد", en: "Seat" }), "LinkedIn", "CV"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2.5 text-start font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                  <td className="px-3 py-2 font-mono text-fg-faint tnum">{m.id}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-foreground">{m.fullName}</td>
                  <td className="px-3 py-2 text-fg-secondary">{m.type}</td>
                  <td className="px-3 py-2 text-fg-secondary">{m.skill}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono tnum text-fg-secondary" dir="ltr">{m.phone || "—"}</td>
                  <td className="px-3 py-2 font-mono tnum text-fg-secondary">{m.birthYear ?? "—"}</td>
                  <td className="px-3 py-2 font-mono tnum text-fg-secondary">{m.seat ?? "—"}</td>
                  <td className="max-w-[160px] truncate px-3 py-2">
                    {m.linkedinUrl ? (
                      <a href={m.linkedinUrl} target="_blank" rel="noreferrer" className="text-primary-bright underline underline-offset-2" dir="ltr">
                        {m.linkedinPublic ? "public" : "hidden"}
                      </a>
                    ) : <span className="text-fg-faint">—</span>}
                  </td>
                  <td className="max-w-[120px] truncate px-3 py-2 text-fg-faint" dir="ltr">{m.cvUrl || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
