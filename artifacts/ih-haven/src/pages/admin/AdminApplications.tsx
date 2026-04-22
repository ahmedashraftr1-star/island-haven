import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Trash2, Mail, Phone, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type Application = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  category: string;
  bio: string;
  status: string;
  notes: string | null;
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  reviewing: "قيد المراجعة",
  accepted: "مقبول",
  rejected: "مرفوض",
};

const STATUS_DOTS: Record<string, string> = {
  new: "bg-primary",
  reviewing: "bg-amber-500",
  accepted: "bg-emerald-500",
  rejected: "bg-rose-500",
};

const STATUS_PILL: Record<string, string> = {
  new: "bg-primary-soft text-primary",
  reviewing: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
};

const CATEGORY_LABELS: Record<string, string> = {
  freelancer: "مستقل",
  graduate: "خرّيج",
  student: "طالب",
  other: "أخرى",
};

export default function AdminApplications() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: () => api<{ applications: Application[] }>("/admin/applications"),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: number; status?: string; notes?: string }) =>
      api(`/admin/applications/${vars.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: vars.status, notes: vars.notes }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-applications"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      api(`/admin/applications/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-applications"] }),
  });

  if (isLoading)
    return <div className="text-center py-16 text-foreground/45 text-sm">جارِ التحميل...</div>;

  const apps = data?.applications ?? [];
  const filtered = apps
    .filter((a) => filter === "all" || a.status === filter)
    .filter((a) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        a.fullName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.phone.includes(q)
      );
    });

  function toggle(id: number) {
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم، البريد، أو الهاتف..."
            className="pr-10 h-10 rounded-xl bg-white border-border"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44 h-10 rounded-xl bg-white border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الطلبات ({apps.length})</SelectItem>
            <SelectItem value="new">جديد</SelectItem>
            <SelectItem value="reviewing">قيد المراجعة</SelectItem>
            <SelectItem value="accepted">مقبول</SelectItem>
            <SelectItem value="rejected">مرفوض</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-[12px] text-foreground/55 font-medium">
          {filtered.length} نتيجة
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-foreground/45 bg-white rounded-2xl border border-border">
          لا توجد طلبات تطابق البحث.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app, i) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.35 }}
              className="bg-white rounded-2xl border border-border shadow-soft hover:shadow-soft-hover hover:border-primary/25 transition-all overflow-hidden"
              data-testid={`application-${app.id}`}
            >
              <div className="p-5 flex items-start gap-4 flex-wrap lg:flex-nowrap">
                <div className="w-11 h-11 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold text-[14px] shrink-0">
                  {app.fullName.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-bold text-[15px] text-foreground">
                      {app.fullName}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full text-[11px] font-semibold ${STATUS_PILL[app.status]}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[app.status]}`} />
                      {STATUS_LABELS[app.status] || app.status}
                    </span>
                    <span className="inline-flex items-center px-2.5 h-6 rounded-full text-[11px] font-medium bg-muted text-foreground/70">
                      {CATEGORY_LABELS[app.category] || app.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-x-5 gap-y-1.5 flex-wrap text-[12.5px] text-foreground/60">
                    <span className="inline-flex items-center gap-1.5" dir="ltr">
                      <Mail className="w-3.5 h-3.5" />
                      {app.email}
                    </span>
                    <span className="inline-flex items-center gap-1.5" dir="ltr">
                      <Phone className="w-3.5 h-3.5" />
                      {app.phone}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(app.createdAt).toLocaleDateString("ar-EG", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Select
                    value={app.status}
                    onValueChange={(v) => updateMut.mutate({ id: app.id, status: v })}
                  >
                    <SelectTrigger className="w-36 h-9 rounded-lg bg-white border-border text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">جديد</SelectItem>
                      <SelectItem value="reviewing">قيد المراجعة</SelectItem>
                      <SelectItem value="accepted">مقبول</SelectItem>
                      <SelectItem value="rejected">مرفوض</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggle(app.id)}
                    className="h-9 px-3 rounded-lg"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${expanded.has(app.id) ? "rotate-180" : ""}`}
                    />
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {expanded.has(app.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-2 border-t border-border space-y-4">
                      <div>
                        <div className="text-[10px] tracking-[0.14em] uppercase text-foreground/45 font-semibold mb-1.5">
                          نبذة عن المتقدّم
                        </div>
                        <p className="text-[14px] text-foreground/85 whitespace-pre-wrap leading-relaxed">
                          {app.bio || "—"}
                        </p>
                      </div>
                      <div>
                        <div className="text-[10px] tracking-[0.14em] uppercase text-foreground/45 font-semibold mb-1.5">
                          ملاحظات داخليّة
                        </div>
                        <Textarea
                          defaultValue={app.notes ?? ""}
                          rows={2}
                          placeholder="اكتب ملاحظاتك هنا — لا يراها المتقدّم..."
                          className="rounded-xl border-border bg-muted/40 focus-visible:ring-primary/30"
                          onBlur={(e) => {
                            if (e.target.value !== (app.notes ?? "")) {
                              updateMut.mutate({ id: app.id, notes: e.target.value });
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 gap-1.5"
                          onClick={() => {
                            if (confirm("حذف هذا الطلب نهائياً؟")) deleteMut.mutate(app.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف الطلب
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
