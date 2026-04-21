import { useState } from "react";
import { Link } from "wouter";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  { value: "freelancer", label: "مستقل / Freelancer" },
  { value: "graduate", label: "خرّيج جامعي" },
  { value: "student", label: "طالب جامعي" },
  { value: "other", label: "أخرى" },
];

export default function Apply() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    category: "freelancer",
    bio: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string>>({});

  const update = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setIssues({});
    try {
      await api("/applications", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setDone(true);
    } catch (e) {
      if (e instanceof ApiError && e.data && typeof e.data === "object") {
        const d = e.data as {
          error?: string;
          issues?: Array<{ path: string; message: string }>;
        };
        setError(d.error || "فشل الإرسال");
        if (Array.isArray(d.issues)) {
          const m: Record<string, string> = {};
          for (const i of d.issues) m[i.path] = i.message;
          setIssues(m);
        }
      } else {
        setError("فشل الإرسال، حاول مجدداً");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center bg-[#f6f1e7] px-6 py-20"
      >
        <div className="max-w-xl text-center bg-white rounded-3xl p-10 shadow-sm">
          <div className="text-6xl mb-4">✓</div>
          <h1 className="text-3xl font-bold mb-3">وصل طلبك بأمان</h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            شكراً لك على ثقتك بآيلاند هيفن. سنراجع طلبك ونتواصل معك قريباً.
          </p>
          <Link href="/" asChild>
            <Button className="bg-black text-white hover:bg-black/90">
              العودة إلى الصفحة الرئيسية
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#f6f1e7] py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-black"
          >
            ← العودة للرئيسية
          </Link>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight">
          قدّم طلب انضمام إلى آيلاند هيفن
        </h1>
        <p className="text-gray-700 mb-10 leading-relaxed">
          املأ النموذج التالي وسنتواصل معك خلال أيام. مساحة العمل مجانيّة بالكامل.
        </p>

        <form
          onSubmit={onSubmit}
          className="bg-white rounded-3xl p-8 space-y-5 shadow-sm"
        >
          <div>
            <Label htmlFor="fullName">الاسم الكامل</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              required
              className="mt-2"
              data-testid="input-fullName"
            />
            {issues.fullName && (
              <p className="text-red-600 text-sm mt-1">{issues.fullName}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
                className="mt-2"
                data-testid="input-email"
                dir="ltr"
              />
              {issues.email && (
                <p className="text-red-600 text-sm mt-1">{issues.email}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">رقم الهاتف / واتساب</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                required
                className="mt-2"
                data-testid="input-phone"
                dir="ltr"
              />
              {issues.phone && (
                <p className="text-red-600 text-sm mt-1">{issues.phone}</p>
              )}
            </div>
          </div>

          <div>
            <Label>التصنيف</Label>
            <Select
              value={form.category}
              onValueChange={(v) => update("category", v)}
            >
              <SelectTrigger className="mt-2" data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="bio">نبذة عنك ومجال عملك</Label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
              rows={5}
              required
              className="mt-2"
              data-testid="input-bio"
              placeholder="أخبرنا عنك، وما الذي تنوي العمل عليه في آيلاند هيفن..."
            />
            {issues.bio && (
              <p className="text-red-600 text-sm mt-1">{issues.bio}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-black text-white hover:bg-black/90 h-12 text-base"
            data-testid="button-submit"
          >
            {submitting ? "جارٍ الإرسال..." : "إرسال الطلب"}
          </Button>
        </form>
      </div>
    </div>
  );
}
