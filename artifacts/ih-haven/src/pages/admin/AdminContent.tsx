import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Image as ImageIcon, RotateCcw, Save, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { imageUrl } from "@/hooks/use-content";

type FieldType = "text" | "longtext" | "url" | "image";
interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  default: string;
  hint?: string;
}
interface SectionDef {
  key: string;
  label: string;
  description?: string;
  fields: FieldDef[];
}
type ContentResp = {
  schema: SectionDef[];
  defaults: Record<string, Record<string, string>>;
  overrides: Record<string, Record<string, string>>;
  merged: Record<string, Record<string, string>>;
};

function ImageField({
  value,
  defaultValue,
  onChange,
}: {
  value: string;
  defaultValue: string;
  onChange: (next: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const url = imageUrl(value || defaultValue);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast({ title: "الرجاء رفع صورة فقط", variant: "destructive" });
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast({ title: "حجم الصورة أكبر من 12 ميغا", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.url) throw new Error("missing url");
      onChange(data.url);
      toast({ title: "تم رفع الصورة" });
    } catch (e) {
      toast({ title: "فشل رفع الصورة", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="w-20 h-20 rounded-xl bg-muted/40 border border-border overflow-hidden flex items-center justify-center shrink-0">
          {url ? (
            <img src={url} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-6 h-6 text-foreground/30" />
          )}
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-lg gap-1.5"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading ? "جارِ الرفع..." : "رفع صورة"}
            </Button>
            {value && value !== defaultValue && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 rounded-lg text-foreground/55 hover:text-foreground"
                onClick={() => onChange(defaultValue)}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="أو ألصق رابط صورة"
            className="h-8 text-xs font-mono"
            dir="ltr"
          />
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function FieldEditor({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (next: string) => void;
}) {
  if (field.type === "image") {
    return (
      <ImageField
        value={value}
        defaultValue={field.default}
        onChange={onChange}
      />
    );
  }
  if (field.type === "longtext") {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="mt-1.5"
      />
    );
  }
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1.5"
      dir={field.type === "url" ? "ltr" : "auto"}
    />
  );
}

function SectionCard({
  section,
  draft,
  defaults,
  isOverridden,
  onFieldChange,
  onSave,
  onReset,
  saving,
  open,
  onToggle,
}: {
  section: SectionDef;
  draft: Record<string, string>;
  defaults: Record<string, string>;
  isOverridden: boolean;
  onFieldChange: (key: string, value: string) => void;
  onSave: () => void;
  onReset: () => void;
  saving: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="bg-white rounded-2xl border border-border shadow-soft overflow-hidden"
      data-testid={`section-${section.key}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-5 lg:p-6 text-right hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <h3 className="text-[15px] font-bold text-foreground">{section.label}</h3>
          {isOverridden && (
            <span className="inline-flex items-center gap-1.5 px-2 h-5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold">
              <span className="w-1 h-1 rounded-full bg-amber-500" />
              معدّل
            </span>
          )}
          <span className="text-[11px] text-foreground/45 font-mono">
            {section.fields.length} حقل
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-foreground/55 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 lg:px-6 pb-6 border-t border-border">
          {section.description && (
            <p className="mt-4 text-[13px] text-foreground/65 leading-relaxed">
              {section.description}
            </p>
          )}
          <div className="mt-5 space-y-4">
            {section.fields.map((f) => (
              <div key={f.key}>
                <Label className="text-sm font-medium">{f.label}</Label>
                {f.hint && (
                  <p className="text-[11px] text-foreground/50 mt-0.5">{f.hint}</p>
                )}
                <FieldEditor
                  field={f}
                  value={draft[f.key] ?? ""}
                  onChange={(v) => onFieldChange(f.key, v)}
                />
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-2 justify-end pt-5 border-t border-border">
            {isOverridden && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-lg text-foreground/65 hover:text-foreground"
                onClick={() => {
                  if (confirm("استعادة كلّ نصوص هذا القسم إلى الأصلي؟")) onReset();
                }}
              >
                استعادة الأصلي
              </Button>
            )}
            <Button
              size="sm"
              className="h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-5 font-semibold gap-1.5"
              onClick={onSave}
              disabled={saving}
              data-testid={`save-${section.key}`}
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "جارِ الحفظ..." : "حفظ القسم"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminContent() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-content"],
    queryFn: () => api<ContentResp>("/admin/content"),
  });

  const [draft, setDraft] = useState<Record<string, Record<string, string>>>({});
  const [openKey, setOpenKey] = useState<string | null>(null);

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

  const filtered = useMemo(() => data?.schema ?? [], [data]);

  if (isLoading || !data)
    return (
      <div className="text-center py-16 text-foreground/45 text-sm">
        جارِ التحميل...
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="bg-primary-soft border border-primary/15 rounded-2xl px-5 py-4 text-[13px] text-foreground/75">
        <strong className="text-foreground">إدارة كاملة لمحتوى الموقع.</strong>
        {" "}اضغط على أي قسم لفتحه — كل الحقول قابلة للتعديل: نصوص، روابط، وصور (رفع مباشر). التغييرات تظهر فوراً للزوّار بعد الحفظ.
      </div>

      {filtered.map((section) => {
        const isOverridden = section.key in data.overrides;
        return (
          <SectionCard
            key={section.key}
            section={section}
            draft={draft[section.key] ?? {}}
            defaults={data.defaults[section.key] ?? {}}
            isOverridden={isOverridden}
            open={openKey === section.key}
            onToggle={() =>
              setOpenKey((k) => (k === section.key ? null : section.key))
            }
            onFieldChange={(key, value) =>
              setDraft((s) => ({
                ...s,
                [section.key]: { ...s[section.key], [key]: value },
              }))
            }
            onSave={() =>
              saveMut.mutate({
                key: section.key,
                value: draft[section.key],
              })
            }
            onReset={() => resetMut.mutate(section.key)}
            saving={saveMut.isPending && saveMut.variables?.key === section.key}
          />
        );
      })}
    </div>
  );
}
