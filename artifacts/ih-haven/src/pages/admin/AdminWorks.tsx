import { useEffect, useState } from "react";
import { Search, Trash2, Eye, EyeOff, Star, ExternalLink } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type WorkStatus = "visible" | "hidden" | "featured";

interface Row {
  work: {
    id: number;
    userId: number;
    title: string;
    summary: string;
    coverUrl: string | null;
    link: string;
    tags: string;
    status: WorkStatus;
    createdAt: string;
  };
  author: {
    id: number;
    fullName: string;
    email: string;
    role: string;
    status: string;
    avatarUrl: string | null;
  };
}

const STATUS_LABEL: Record<WorkStatus, string> = {
  visible: "ظاهر",
  hidden: "مخفيّ",
  featured: "مميَّز",
};
const STATUS_PILL: Record<WorkStatus, string> = {
  visible: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  hidden: "bg-foreground/10 text-foreground/70 border border-border",
  featured: "bg-amber-400/15 text-amber-300 border border-amber-400/30",
};

export default function AdminWorks() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  async function reload() {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (status) params.set("status", status);
      const r = await api<{ works: Row[] }>(
        `/admin/works${params.toString() ? `?${params}` : ""}`,
      );
      setRows(r.works);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function setWorkStatus(id: number, next: WorkStatus) {
    try {
      await api(`/admin/works/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      void reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحديث");
    }
  }

  async function onDelete(id: number, title: string) {
    if (!window.confirm(`حذف العمل «${title}» نهائيًّا؟`)) return;
    try {
      await api(`/admin/works/${id}`, { method: "DELETE" });
      void reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحذف");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold text-foreground">أعمال المجتمع</h2>
        <p className="text-[13px] text-foreground/65 mt-1">
          راجع وأدِر الأعمال التي يرفعها المنتسبون — أخفِ، ميِّز، أو احذف.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/60" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && reload()}
            placeholder="ابحث بعنوان العمل أو اسم صاحبه…"
            className="w-full h-10 pr-10 pl-3 rounded-xl bg-card border border-border text-[13.5px] outline-none focus:border-primary/50"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 px-3 rounded-xl bg-card border border-border text-[13px] outline-none focus:border-primary/50 transition-colors"
        >
          <option value="">كل الحالات</option>
          <option value="visible">ظاهر</option>
          <option value="featured">مميَّز</option>
          <option value="hidden">مخفيّ</option>
        </select>
        <button
          type="button"
          onClick={() => reload()}
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:shadow-soft-hover transition-shadow"
        >
          بحث
        </button>
      </div>

      {error && (
        <div className="rounded-2xl px-4 py-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[13px]">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {rows === null ? (
          <div className="p-8 text-center text-foreground/60">جارِ التحميل…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-foreground/65 text-[14px]">
            لا توجد أعمال.
          </div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/40 text-foreground/65 text-[11.5px] tracking-[0.05em] uppercase">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">العمل</th>
                <th className="text-right px-4 py-3 font-semibold">صاحبه</th>
                <th className="text-right px-4 py-3 font-semibold">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold">منذ</th>
                <th className="text-right px-4 py-3 font-semibold w-1">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ work, author }) => (
                <tr
                  key={work.id}
                  className="border-t border-border hover:bg-muted/20"
                  data-testid={`admin-work-row-${work.id}`}
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{work.title}</div>
                    {work.summary && (
                      <div className="text-[11.5px] text-foreground/65 mt-0.5 line-clamp-1">
                        {work.summary}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground/65">
                    <div>{author.fullName}</div>
                    <div className="text-[11.5px] text-foreground/60" dir="ltr">
                      {author.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_PILL[work.status]}`}>
                      {STATUS_LABEL[work.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground/65 text-[12px] tabular-nums">
                    {new Date(work.createdAt).toLocaleDateString("ar-EG")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <a
                        href={`${import.meta.env.BASE_URL}works/${work.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65 hover:text-primary transition-colors"
                        title="افتح في الموقع"
                        aria-label="افتح العمل في الموقع"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      {work.status !== "featured" ? (
                        <button
                          type="button"
                          onClick={() => setWorkStatus(work.id, "featured")}
                          className="p-2 rounded-lg hover:bg-amber-400/15 text-foreground/65 hover:text-amber-400 transition-colors"
                          title="ميّز"
                          aria-label="ميّز العمل"
                          data-testid={`button-feature-work-${work.id}`}
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setWorkStatus(work.id, "visible")}
                          className="p-2 rounded-lg hover:bg-foreground/[0.04] text-amber-400 transition-colors"
                          title="إلغاء التمييز"
                          aria-label="إلغاء تمييز العمل"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                      {work.status !== "hidden" ? (
                        <button
                          type="button"
                          onClick={() => setWorkStatus(work.id, "hidden")}
                          className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65 hover:text-foreground transition-colors"
                          title="إخفاء"
                          aria-label="إخفاء العمل"
                          data-testid={`button-hide-work-${work.id}`}
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setWorkStatus(work.id, "visible")}
                          className="p-2 rounded-lg hover:bg-emerald-500/15 text-foreground/65 hover:text-emerald-400 transition-colors"
                          title="إظهار"
                          aria-label="إظهار العمل"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDelete(work.id, work.title)}
                        className="p-2 rounded-lg hover:bg-rose-500/15 text-foreground/65 hover:text-rose-400 transition-colors"
                        title="حذف"
                        aria-label="حذف العمل"
                        data-testid={`button-delete-work-${work.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
