import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Save,
  ChevronDown,
  Search,
  X,
  Filter,
  PanelLeft,
} from "lucide-react";
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

function highlight(text: string, q: string): React.ReactNode {
  if (!q) return text;
  const lower = text.toLowerCase();
  const ql = q.toLowerCase();
  const idx = lower.indexOf(ql);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-400/25 text-amber-200 rounded px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

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
    } catch {
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
  isDirty,
}: {
  field: FieldDef;
  value: string;
  onChange: (next: string) => void;
  isDirty: boolean;
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
        className={`mt-1.5 ${isDirty ? "ring-1 ring-amber-400/50" : ""}`}
      />
    );
  }
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`mt-1.5 ${isDirty ? "ring-1 ring-amber-400/50" : ""}`}
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
  query,
  matchingFieldKeys,
  dirtyKeys,
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
  query: string;
  matchingFieldKeys: Set<string> | null;
  dirtyKeys: Set<string>;
}) {
  const visibleFields = matchingFieldKeys
    ? section.fields.filter((f) => matchingFieldKeys.has(f.key))
    : section.fields;
  const dirtyCount = dirtyKeys.size;
  return (
    <div
      id={`section-${section.key}`}
      className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden scroll-mt-24"
      data-testid={`section-${section.key}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-5 lg:p-6 text-right hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <h3 className="text-[15px] font-bold text-foreground">
            {highlight(section.label, query)}
          </h3>
          {isOverridden && (
            <span className="inline-flex items-center gap-1.5 px-2 h-5 rounded-full bg-amber-400/15 text-amber-300 text-[10px] font-semibold">
              <span className="w-1 h-1 rounded-full bg-amber-400" />
              معدّل
            </span>
          )}
          {dirtyCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2 h-5 rounded-full bg-blue-500/15 text-blue-300 text-[10px] font-semibold">
              <span className="w-1 h-1 rounded-full bg-blue-400" />
              {dirtyCount} غير محفوظ
            </span>
          )}
          <span className="text-[11px] text-foreground/60 font-mono">
            {matchingFieldKeys
              ? `${visibleFields.length}/${section.fields.length} حقل`
              : `${section.fields.length} حقل`}
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
            {visibleFields.length === 0 ? (
              <p className="text-[12px] text-foreground/60 py-4 text-center">
                لا حقول مطابقة في هذا القسم
              </p>
            ) : (
              visibleFields.map((f) => (
                <div key={f.key}>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <span>{highlight(f.label, query)}</span>
                    {dirtyKeys.has(f.key) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-label="غير محفوظ" />
                    )}
                    <span className="text-[10px] text-foreground/35 font-mono">
                      {f.key}
                    </span>
                  </Label>
                  {f.hint && (
                    <p className="text-[11px] text-foreground/60 mt-0.5">
                      {f.hint}
                    </p>
                  )}
                  <FieldEditor
                    field={f}
                    value={draft[f.key] ?? ""}
                    onChange={(v) => onFieldChange(f.key, v)}
                    isDirty={dirtyKeys.has(f.key)}
                  />
                </div>
              ))
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-2 justify-end pt-5 border-t border-border">
            {isOverridden && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-lg text-foreground/65 hover:text-foreground"
                onClick={() => {
                  if (confirm("استعادة كلّ نصوص هذا القسم إلى الأصلي؟"))
                    onReset();
                }}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                استعادة الأصلي
              </Button>
            )}
            <Button
              size="sm"
              className="h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-5 font-semibold gap-1.5"
              onClick={onSave}
              disabled={saving || dirtyCount === 0}
              data-testid={`save-${section.key}`}
            >
              <Save className="w-3.5 h-3.5" />
              {saving
                ? "جارِ الحفظ..."
                : dirtyCount > 0
                ? `حفظ ${dirtyCount} حقل`
                : "محفوظ"}
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
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [modifiedOnly, setModifiedOnly] = useState(false);

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

  const dirtyMap = useMemo(() => {
    const m = new Map<string, Set<string>>();
    if (!data) return m;
    for (const sec of data.schema) {
      const d = draft[sec.key] ?? {};
      const merged = data.merged[sec.key] ?? {};
      const set = new Set<string>();
      for (const f of sec.fields) {
        if ((d[f.key] ?? "") !== (merged[f.key] ?? "")) set.add(f.key);
      }
      if (set.size > 0) m.set(sec.key, set);
    }
    return m;
  }, [draft, data]);

  const totalDirty = useMemo(
    () => Array.from(dirtyMap.values()).reduce((a, s) => a + s.size, 0),
    [dirtyMap],
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.schema
      .map((sec) => {
        if (modifiedOnly && !(sec.key in data.overrides)) return null;
        if (!q) return { sec, matchingFieldKeys: null as Set<string> | null };
        const sectionMatches =
          sec.label.toLowerCase().includes(q) ||
          sec.key.toLowerCase().includes(q);
        const matchingFields = new Set<string>();
        for (const f of sec.fields) {
          if (
            f.label.toLowerCase().includes(q) ||
            f.key.toLowerCase().includes(q) ||
            (f.default ?? "").toLowerCase().includes(q) ||
            (draft[sec.key]?.[f.key] ?? "").toLowerCase().includes(q) ||
            (data.merged[sec.key]?.[f.key] ?? "").toLowerCase().includes(q)
          ) {
            matchingFields.add(f.key);
          }
        }
        if (!sectionMatches && matchingFields.size === 0) return null;
        return {
          sec,
          matchingFieldKeys: sectionMatches ? null : matchingFields,
        };
      })
      .filter(Boolean) as { sec: SectionDef; matchingFieldKeys: Set<string> | null }[];
  }, [data, query, modifiedOnly, draft]);

  // Auto-expand sections that contain field-level matches
  useEffect(() => {
    if (!query.trim()) return;
    setOpenKeys((prev) => {
      const next = new Set(prev);
      for (const r of filtered) {
        if (r.matchingFieldKeys && r.matchingFieldKeys.size > 0) {
          next.add(r.sec.key);
        }
      }
      return next;
    });
  }, [query, filtered]);

  function toggleOpen(key: string) {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function expandAll() {
    setOpenKeys(new Set(filtered.map((r) => r.sec.key)));
  }
  function collapseAll() {
    setOpenKeys(new Set());
  }

  function scrollToSection(key: string) {
    const el = document.getElementById(`section-${key}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setOpenKeys((prev) => new Set(prev).add(key));
    }
  }

  if (isLoading || !data)
    return (
      <div className="text-center py-16 text-foreground/60 text-sm">
        جارِ التحميل...
      </div>
    );

  const totalFields = data.schema.reduce((a, s) => a + s.fields.length, 0);
  const overrideCount = Object.keys(data.overrides).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
      {/* Sticky side navigator */}
      <aside className="hidden lg:block">
        <div className="sticky top-4 bg-card rounded-2xl border border-border shadow-soft p-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
          <div className="flex items-center gap-2 mb-3 text-[12px] font-bold text-foreground/85">
            <PanelLeft className="w-3.5 h-3.5" />
            الأقسام
          </div>
          <nav className="space-y-0.5">
            {filtered.map(({ sec }) => {
              const isMod = sec.key in data.overrides;
              const dirty = dirtyMap.get(sec.key)?.size ?? 0;
              return (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => scrollToSection(sec.key)}
                  className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[12.5px] text-right hover:bg-muted/50 transition-colors text-foreground/75 hover:text-foreground"
                >
                  <span className="truncate">{sec.label}</span>
                  <span className="flex items-center gap-1 shrink-0">
                    {dirty > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
                    {isMod && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    )}
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-[11px] text-foreground/60 py-2 text-center">
                لا أقسام مطابقة
              </p>
            )}
          </nav>
        </div>
      </aside>

      <div className="space-y-4">
        {/* Header / stats */}
        <div className="bg-primary-soft border border-primary/15 rounded-2xl px-5 py-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="text-[13px] text-foreground/75">
              <strong className="text-foreground">إدارة كاملة لمحتوى الموقع.</strong>
              {" "}كل النصوص والصور قابلة للتعديل — التغييرات تظهر فوراً للزوّار بعد الحفظ.
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-foreground/65">
              <span>{data.schema.length} قسم</span>
              <span>·</span>
              <span>{totalFields} حقل</span>
              {overrideCount > 0 && (
                <>
                  <span>·</span>
                  <span className="text-amber-300">{overrideCount} معدّل</span>
                </>
              )}
              {totalDirty > 0 && (
                <>
                  <span>·</span>
                  <span className="text-blue-300 font-bold">{totalDirty} غير محفوظ</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="sticky top-2 z-20 bg-card/95 backdrop-blur-md rounded-2xl border border-border shadow-soft p-3 lg:p-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/55" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث في الأقسام، الحقول، أو القيم…"
                className="h-10 pr-9 pl-9 text-[13px]"
                data-testid="content-search"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-muted/60 flex items-center justify-center"
                  aria-label="مسح البحث"
                >
                  <X className="w-3.5 h-3.5 text-foreground/55" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={modifiedOnly ? "default" : "outline"}
                size="sm"
                className="h-10 rounded-lg gap-1.5"
                onClick={() => setModifiedOnly((v) => !v)}
              >
                <Filter className="w-3.5 h-3.5" />
                المعدَّل فقط
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 rounded-lg"
                onClick={openKeys.size > 0 ? collapseAll : expandAll}
              >
                {openKeys.size > 0 ? "طيّ الكلّ" : "فتح الكلّ"}
              </Button>
            </div>
          </div>
          {(query || modifiedOnly) && (
            <p className="text-[11px] text-foreground/65 mt-2">
              {filtered.length} قسم مطابق
              {query && ` · بحث: "${query}"`}
              {modifiedOnly && ` · المعدَّل فقط`}
            </p>
          )}
        </div>

        {/* Sections */}
        {filtered.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-10 text-center">
            <p className="text-foreground/65 text-sm">لا توجد نتائج مطابقة.</p>
            {(query || modifiedOnly) && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setQuery("");
                  setModifiedOnly(false);
                }}
              >
                مسح المرشّحات
              </Button>
            )}
          </div>
        ) : (
          filtered.map(({ sec, matchingFieldKeys }) => {
            const isOverridden = sec.key in data.overrides;
            return (
              <SectionCard
                key={sec.key}
                section={sec}
                draft={draft[sec.key] ?? {}}
                defaults={data.defaults[sec.key] ?? {}}
                isOverridden={isOverridden}
                open={openKeys.has(sec.key)}
                onToggle={() => toggleOpen(sec.key)}
                onFieldChange={(key, value) =>
                  setDraft((s) => ({
                    ...s,
                    [sec.key]: { ...s[sec.key], [key]: value },
                  }))
                }
                onSave={() =>
                  saveMut.mutate({
                    key: sec.key,
                    value: draft[sec.key],
                  })
                }
                onReset={() => resetMut.mutate(sec.key)}
                saving={saveMut.isPending && saveMut.variables?.key === sec.key}
                query={query}
                matchingFieldKeys={matchingFieldKeys}
                dirtyKeys={dirtyMap.get(sec.key) ?? new Set()}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
