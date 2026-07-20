import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, RotateCcw } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Field } from "./adminShared";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface CtaButton {
  labelAr: string;
  labelEn: string;
  href: string;
  visible: boolean;
  registrationOpen: boolean;
  closedTitleAr: string;
  closedTitleEn: string;
  closedBodyAr: string;
  closedBodyEn: string;
}
const PROMO_VARIANTS = ["gold", "solid", "glass", "gradient"] as const;
type PromoVariant = (typeof PROMO_VARIANTS)[number];
const PROMO_VARIANT_LABELS: Record<PromoVariant, string> = {
  gold: "ذهبيّ",
  solid: "تراكوتا صريح",
  glass: "زجاجيّ",
  gradient: "تدرّج",
};
interface PromoButton {
  labelAr: string;
  labelEn: string;
  href: string;
  visible: boolean;
  variant: PromoVariant;
  startAt: string | null;
  endAt: string | null;
}
interface CtaConfig {
  primary: CtaButton;
  guest: CtaButton;
  promo: PromoButton;
}

const BTN_META = [
  {
    key: "primary" as const,
    title: "زرّ الانتساب (الأساسيّ)",
    desc: "الزرّ الرئيسيّ في الصفحة الرئيسيّة — التقديم على الحاضنة.",
  },
  {
    key: "guest" as const,
    title: "زرّ الضيف",
    desc: "الزرّ الثانويّ — حجز مقعد ضيف / زيارة.",
  },
];

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-3 cursor-pointer">
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold text-foreground">{label}</div>
        {hint && <div className="text-[12px] text-foreground/55 mt-0.5">{hint}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function ButtonEditor({
  value,
  onChange,
}: {
  value: CtaButton;
  onChange: (v: CtaButton) => void;
}) {
  const set = <K extends keyof CtaButton>(k: K, v: CtaButton[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="النصّ (عربي)">
          <Input value={value.labelAr} onChange={(e) => set("labelAr", e.target.value)} />
        </Field>
        <Field label="Label (English)">
          <Input dir="ltr" value={value.labelEn} onChange={(e) => set("labelEn", e.target.value)} />
        </Field>
      </div>
      <Field label="الوجهة (مسار أو رابط)">
        <Input
          dir="ltr"
          value={value.href}
          onChange={(e) => set("href", e.target.value)}
          placeholder="/apply"
        />
      </Field>
      <div className="rounded-xl border border-border bg-muted/30 px-4 divide-y divide-border">
        <ToggleRow
          label="ظاهر في الموقع"
          hint="إيقافه يُخفي الزرّ كليًّا من الصفحة الرئيسيّة."
          checked={value.visible}
          onChange={(v) => set("visible", v)}
        />
        <ToggleRow
          label="التسجيل مفتوح"
          hint="عند الإغلاق يبقى الزرّ ظاهرًا، لكن نقره يعرض نافذة شرح بدل النموذج."
          checked={value.registrationOpen}
          onChange={(v) => set("registrationOpen", v)}
        />
      </div>
      {!value.registrationOpen && (
        <div className="space-y-4 rounded-xl border border-amber-400/30 bg-amber-400/[0.06] p-4">
          <div className="text-[12.5px] font-semibold text-amber-600 dark:text-amber-300">
            نافذة الشرح عند إغلاق التسجيل (المواعيد + الشروط)
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="العنوان (عربي)">
              <Input
                value={value.closedTitleAr}
                onChange={(e) => set("closedTitleAr", e.target.value)}
              />
            </Field>
            <Field label="Title (English)">
              <Input
                dir="ltr"
                value={value.closedTitleEn}
                onChange={(e) => set("closedTitleEn", e.target.value)}
              />
            </Field>
          </div>
          <Field label="النصّ — المواعيد الرسميّة والشروط (عربي)">
            <Textarea
              rows={4}
              value={value.closedBodyAr}
              onChange={(e) => set("closedBodyAr", e.target.value)}
            />
          </Field>
          <Field label="Body — official dates & conditions (English)">
            <Textarea
              dir="ltr"
              rows={4}
              value={value.closedBodyEn}
              onChange={(e) => set("closedBodyEn", e.target.value)}
            />
          </Field>
        </div>
      )}
    </div>
  );
}

function PromoEditor({
  value,
  onChange,
}: {
  value: PromoButton;
  onChange: (v: PromoButton) => void;
}) {
  const set = <K extends keyof PromoButton>(k: K, v: PromoButton[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-4">
      <ToggleRow
        label="تفعيل الزرّ الترويجيّ"
        hint="زرّ ثالث اختياريّ في الهيرو للعروض والمناسبات."
        checked={value.visible}
        onChange={(v) => set("visible", v)}
      />
      {value.visible && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="النصّ (عربي)">
              <Input
                value={value.labelAr}
                onChange={(e) => set("labelAr", e.target.value)}
                placeholder="مثلاً: يوم العرض ٢٠٢٦"
              />
            </Field>
            <Field label="Label (English)">
              <Input dir="ltr" value={value.labelEn} onChange={(e) => set("labelEn", e.target.value)} />
            </Field>
          </div>
          <Field label="الوجهة (مسار أو رابط)">
            <Input
              dir="ltr"
              value={value.href}
              onChange={(e) => set("href", e.target.value)}
              placeholder="/events"
            />
          </Field>
          <Field label="النمط">
            <div className="flex flex-wrap gap-2">
              {PROMO_VARIANTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set("variant", v)}
                  className={
                    "h-10 px-4 rounded-full text-[13px] font-semibold border transition-colors " +
                    (value.variant === v
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-foreground/60 hover:text-foreground")
                  }
                >
                  {PROMO_VARIANT_LABELS[v]}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="يبدأ في (اختياريّ)">
              <Input
                type="date"
                dir="ltr"
                value={value.startAt ?? ""}
                onChange={(e) => set("startAt", e.target.value || null)}
              />
            </Field>
            <Field label="ينتهي في (اختياريّ)">
              <Input
                type="date"
                dir="ltr"
                value={value.endAt ?? ""}
                onChange={(e) => set("endAt", e.target.value || null)}
              />
            </Field>
          </div>
          <p className="text-[12px] text-foreground/50">
            اترك التاريخين فارغين ليظهر الزرّ دائمًا ما دام مفعّلًا؛ أو حدّدهما ليظهر ويختفي تلقائيًّا ضمن المدّة.
          </p>
        </>
      )}
    </div>
  );
}

export default function AdminCta() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "cta"],
    queryFn: () => api<{ cta: CtaConfig; defaults: CtaConfig }>("/admin/cta"),
  });
  const [cfg, setCfg] = useState<CtaConfig | null>(null);
  useEffect(() => {
    if (data?.cta) setCfg(data.cta);
  }, [data]);

  const save = useMutation({
    mutationFn: (c: CtaConfig) => api("/admin/cta", { method: "PUT", body: JSON.stringify(c) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "cta"] }),
  });

  if (isLoading || !cfg) {
    return <div className="text-center py-16 text-foreground/60 text-sm">جارِ التحميل…</div>;
  }

  const setBtn = (k: "primary" | "guest", v: CtaButton) => setCfg({ ...cfg, [k]: v });

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-[20px] font-bold text-foreground">أزرار الصفحة الرئيسيّة</h1>
        <p className="mt-1 text-[13.5px] text-foreground/60 leading-relaxed">
          تحكّم كامل بزرّي الصفحة الرئيسيّة: النصّ (عربي/إنجليزي) · الوجهة · الإظهار · حالة التسجيل
          ونافذة الشرح عند الإغلاق. الأرقام الموقّعة تبقى ظاهرة فوق الزرّين.
        </p>
      </header>

      {BTN_META.map((m) => (
        <section key={m.key} className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div>
            <h2 className="text-[15px] font-bold text-foreground">{m.title}</h2>
            <p className="text-[12.5px] text-foreground/55 mt-0.5">{m.desc}</p>
          </div>
          <ButtonEditor value={cfg[m.key]} onChange={(v) => setBtn(m.key, v)} />
        </section>
      ))}

      <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-[15px] font-bold text-foreground">الزرّ الترويجيّ (اختياريّ)</h2>
          <p className="text-[12.5px] text-foreground/55 mt-0.5">
            زرّ ثالث في الهيرو للعروض والمناسبات — نصّ ووجهة ونمط ونافذة تاريخ (يظهر/يختفي تلقائيًّا).
          </p>
        </div>
        <PromoEditor value={cfg.promo} onChange={(v) => setCfg({ ...cfg, promo: v })} />
      </section>

      {save.isError && (
        <div className="text-[13px] text-rose-400 font-medium">
          {save.error instanceof ApiError ? save.error.message : "تعذّر الحفظ."}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap sticky bottom-4 bg-background/80 backdrop-blur rounded-full">
        <button
          type="button"
          disabled={save.isPending}
          onClick={() => save.mutate(cfg)}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[hsl(var(--primary-cta))] text-white font-semibold text-[13.5px] hover:shadow-soft-hover transition-shadow disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {save.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          حفظ التعديلات
        </button>
        {data?.defaults && (
          <button
            type="button"
            onClick={() => setCfg(data.defaults)}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-border text-foreground/70 font-semibold text-[13.5px] hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <RotateCcw className="w-4 h-4" /> استعادة الافتراضيّ
          </button>
        )}
        {save.isSuccess && !save.isPending && (
          <span className="text-[13px] text-emerald-500 font-medium">تم الحفظ ✓</span>
        )}
      </div>
    </div>
  );
}
