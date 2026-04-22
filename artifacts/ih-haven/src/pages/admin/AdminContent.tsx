import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type ContentResp = {
  defaults: Record<string, Record<string, string>>;
  overrides: Record<string, Record<string, string>>;
  merged: Record<string, Record<string, string>>;
};

const SECTION_LABELS: Record<string, string> = {
  hero: "الواجهة الرئيسية (Hero)",
  about: "من نحن (About)",
  cta: "دعوة للانضمام (CTA)",
  contact: "بيانات التواصل",
};

const FIELD_LABELS: Record<string, string> = {
  eyebrow: "العنوان العلوي",
  title: "العنوان الرئيسي",
  subtitle: "العنوان الفرعي",
  ctaPrimary: "زر أساسي",
  ctaSecondary: "زر ثانوي",
  headline: "العنوان",
  body: "النص",
  button: "نص الزر",
  instagram: "Instagram URL",
  email: "البريد",
  phone: "الهاتف",
};

export default function AdminContent() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-content"],
    queryFn: () => api<ContentResp>("/admin/content"),
  });

  const [draft, setDraft] = useState<Record<string, Record<string, string>>>(
    {},
  );

  useEffect(() => {
    if (data) setDraft(JSON.parse(JSON.stringify(data.merged)));
  }, [data]);

  const saveMut = useMutation({
    mutationFn: (vars: { key: string; value: unknown }) =>
      api(`/admin/content/${vars.key}`, {
        method: "PUT",
        body: JSON.stringify({ value: vars.value }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-content"] });
      qc.invalidateQueries({ queryKey: ["public-content"] });
      toast({ title: "تم الحفظ" });
    },
    onError: () => toast({ title: "فشل الحفظ", variant: "destructive" }),
  });

  const resetMut = useMutation({
    mutationFn: (key: string) =>
      api(`/admin/content/${key}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-content"] });
      qc.invalidateQueries({ queryKey: ["public-content"] });
      toast({ title: "تمت الاستعادة" });
    },
  });

  if (isLoading || !data)
    return <div className="text-center py-16 text-foreground/45 text-sm">جارِ التحميل...</div>;

  const sections = Object.keys(data.defaults);

  return (
    <div className="space-y-5">
      <div className="bg-primary-soft border border-primary/15 rounded-2xl px-5 py-4 text-[13px] text-foreground/75">
        يمكنك تعديل النصوص الأساسيّة لصفحة الهبوط. كلّ قسم يُحفظ بشكل مستقلّ.
        التغييرات تظهر للزوّار فوراً.
      </div>

      {sections.map((sectionKey) => {
        const fields = Object.keys(data.defaults[sectionKey] ?? {});
        const isOverridden = sectionKey in data.overrides;
        return (
          <div
            key={sectionKey}
            className="bg-white rounded-2xl p-6 lg:p-7 border border-border shadow-soft"
            data-testid={`section-${sectionKey}`}
          >
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h3 className="text-[15px] font-bold text-foreground">
                  {SECTION_LABELS[sectionKey] ?? sectionKey}
                </h3>
                {isOverridden && (
                  <span className="inline-flex items-center gap-1.5 px-2 h-5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold">
                    <span className="w-1 h-1 rounded-full bg-amber-500" />
                    معدّل
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {isOverridden && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 rounded-lg text-foreground/65 hover:text-foreground"
                    onClick={() => {
                      if (confirm("استعادة النص الأصلي؟"))
                        resetMut.mutate(sectionKey);
                    }}
                  >
                    استعادة الأصلي
                  </Button>
                )}
                <Button
                  size="sm"
                  className="h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-5 font-semibold"
                  onClick={() =>
                    saveMut.mutate({
                      key: sectionKey,
                      value: draft[sectionKey],
                    })
                  }
                  data-testid={`save-${sectionKey}`}
                >
                  حفظ
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {fields.map((field) => {
                const value = draft[sectionKey]?.[field] ?? "";
                const isLong = value.length > 80 || field === "body";
                return (
                  <div key={field}>
                    <Label className="text-sm">
                      {FIELD_LABELS[field] ?? field}
                    </Label>
                    {isLong ? (
                      <Textarea
                        value={value}
                        onChange={(e) =>
                          setDraft((s) => ({
                            ...s,
                            [sectionKey]: {
                              ...s[sectionKey],
                              [field]: e.target.value,
                            },
                          }))
                        }
                        rows={3}
                        className="mt-2"
                      />
                    ) : (
                      <Input
                        value={value}
                        onChange={(e) =>
                          setDraft((s) => ({
                            ...s,
                            [sectionKey]: {
                              ...s[sectionKey],
                              [field]: e.target.value,
                            },
                          }))
                        }
                        className="mt-2"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
