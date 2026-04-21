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
import { Badge } from "@/components/ui/badge";

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

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  reviewing: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
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
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: () =>
      api<{ applications: Application[] }>("/admin/applications"),
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
    return <div className="text-center py-12 text-gray-500">جارِ التحميل...</div>;

  const apps = data?.applications ?? [];
  const filtered =
    filter === "all" ? apps : apps.filter((a) => a.status === filter);

  function toggle(id: number) {
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="text-sm text-gray-600">
          {filtered.length} طلب
          {filter !== "all" && ` (مفلترة من أصل ${apps.length})`}
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الطلبات</SelectItem>
            <SelectItem value="new">جديد</SelectItem>
            <SelectItem value="reviewing">قيد المراجعة</SelectItem>
            <SelectItem value="accepted">مقبول</SelectItem>
            <SelectItem value="rejected">مرفوض</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-2xl">
          لا توجد طلبات بعد.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-2xl p-5 border border-gray-100"
              data-testid={`application-${app.id}`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-lg">{app.fullName}</h3>
                    <Badge className={STATUS_COLORS[app.status] || ""}>
                      {STATUS_LABELS[app.status] || app.status}
                    </Badge>
                    <Badge variant="outline">
                      {CATEGORY_LABELS[app.category] || app.category}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                    <span dir="ltr">{app.email}</span>
                    <span dir="ltr">{app.phone}</span>
                    <span>
                      {new Date(app.createdAt).toLocaleString("ar-EG")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={app.status}
                    onValueChange={(v) =>
                      updateMut.mutate({ id: app.id, status: v })
                    }
                  >
                    <SelectTrigger className="w-36 h-9">
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
                  >
                    {expanded.has(app.id) ? "إخفاء" : "عرض"}
                  </Button>
                </div>
              </div>

              {expanded.has(app.id) && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div>
                    <div className="text-xs uppercase text-gray-500 mb-1">
                      نبذة
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {app.bio}
                    </p>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-gray-500 mb-1">
                      ملاحظات داخلية
                    </div>
                    <Textarea
                      defaultValue={app.notes ?? ""}
                      rows={2}
                      onBlur={(e) => {
                        if (e.target.value !== (app.notes ?? "")) {
                          updateMut.mutate({
                            id: app.id,
                            notes: e.target.value,
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        if (confirm("حذف هذا الطلب نهائياً؟"))
                          deleteMut.mutate(app.id);
                      }}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
