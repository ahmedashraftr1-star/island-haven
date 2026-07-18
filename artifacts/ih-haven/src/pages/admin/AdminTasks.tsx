/**
 * AdminTasks — Island Haven internal task system.
 *
 * Kanban + list + activity over /api/admin/tasks. Assignees are REAL staff
 * accounts (admin_users); assigning / @mentioning / commenting notifies the
 * relevant staff via the admin-notification bell. Identity is server-authoritative
 * (the acting admin is the logged-in account — no "acting as" spoofing).
 * Subtasks (checklist), My-Tasks + overdue filters, @mention chips. RTL, dark.
 */
import { useEffect, useState, useId } from "react";
import { useDialogA11y } from "./adminShared";
import {
  Plus, X, Send, AlertCircle, ArrowUp, Minus, ArrowDown, Flame,
  Loader2, CheckCircle2, Circle, RotateCcw, Trash2, MessageSquare,
  LayoutGrid, List, Activity, Filter, Calendar, Tag, AtSign, ListChecks, User,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { RichText } from "./richText";

type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done" | "cancelled";
type TaskPriority = "urgent" | "high" | "medium" | "low";

interface TeamMember { id: number; fullName: string }

interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  assigneeId: number | null;
  assignee: string;
  createdBy: string;
  dueDate: string | null;
  tags: string[];
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
  subtasks: { total: number; done: number };
}
interface Comment { id: number; taskId: number; author: string; body: string; createdAt: string }
interface Subtask { id: number; taskId: number; title: string; done: boolean; orderIndex: number }
interface ActivityItem {
  id: number; taskId: number; taskTitle: string; actor: string;
  action: string; fromValue: string; toValue: string; createdAt: string;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; icon: typeof Circle }> = {
  backlog:     { label: "متراكم",     color: "text-foreground/50", bg: "bg-foreground/5",   icon: Circle },
  todo:        { label: "مجدول",      color: "text-sky-400",       bg: "bg-sky-500/10",     icon: Circle },
  in_progress: { label: "جارٍ العمل", color: "text-amber-400",     bg: "bg-amber-500/10",   icon: Loader2 },
  review:      { label: "مراجعة",     color: "text-violet-400",    bg: "bg-violet-500/10",  icon: RotateCcw },
  done:        { label: "منجز",       color: "text-emerald-400",   bg: "bg-emerald-500/10", icon: CheckCircle2 },
  cancelled:   { label: "ملغى",       color: "text-rose-400",      bg: "bg-rose-500/10",    icon: X },
};
const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; icon: typeof Circle }> = {
  urgent: { label: "عاجل",   color: "text-red-400",       icon: Flame },
  high:   { label: "عالية",  color: "text-orange-400",    icon: ArrowUp },
  medium: { label: "متوسطة", color: "text-yellow-400",    icon: Minus },
  low:    { label: "منخفضة", color: "text-foreground/50", icon: ArrowDown },
};
const CATEGORIES = ["general", "تطوير", "تصميم", "تسويق", "محتوى", "شراكات", "عمليات", "منتسبون", "فعاليات"];
const STATUSES = Object.keys(STATUS_CONFIG) as TaskStatus[];
const PRIORITIES = Object.keys(PRIORITY_CONFIG) as TaskPriority[];
const BOARD: TaskStatus[] = ["todo", "in_progress", "review", "done", "backlog"];
const STATUS_FLOW: TaskStatus[] = ["backlog", "todo", "in_progress", "review", "done"];

function nextStatus(current: TaskStatus): TaskStatus {
  const i = STATUS_FLOW.indexOf(current);
  return i === -1 || i >= STATUS_FLOW.length - 1 ? current : (STATUS_FLOW[i + 1] as TaskStatus);
}
function relativeTime(dateStr: string): string {
  const m = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} س`;
  return `منذ ${Math.floor(h / 24)} يوم`;
}
function isOverdue(t: Task): boolean {
  return !!t.dueDate && new Date(t.dueDate) < new Date(new Date().toDateString()) && t.status !== "done" && t.status !== "cancelled";
}
function activityLabel(item: ActivityItem): string {
  switch (item.action) {
    case "created": return "أنشأ المهمة";
    case "status_changed": return `غيّر الحالة إلى: ${STATUS_CONFIG[item.toValue as TaskStatus]?.label ?? item.toValue}`;
    case "priority_changed": return `غيّر الأولوية إلى: ${PRIORITY_CONFIG[item.toValue as TaskPriority]?.label ?? item.toValue}`;
    case "assigned": return item.toValue && item.toValue !== "—" ? `كلّف إلى ${item.toValue}` : "أزال التكليف";
    case "commented": return `علّق: ${item.toValue.slice(0, 60)}${item.toValue.length > 60 ? "…" : ""}`;
    default: return item.action;
  }
}

function teamInitials(name: string): string {
  if (!name) return "؟";
  const parts = name.trim().split(/\s+/);
  const words = parts.filter((w) => w.replace(/\./g, "").length > 1);
  return (words.length ? words : parts).slice(0, 2).map((w) => w.charAt(0)).join("");
}
function Avatar({ name, index = 0, size = "sm" }: { name: string; index?: number; size?: "sm" | "md" }) {
  const tone = index % 2 === 0 ? "bg-primary/15 text-primary ring-primary/30" : "bg-sand/15 text-sand-bright ring-sand/30";
  const cls = name ? tone : "bg-foreground/10 text-foreground/60 ring-foreground/20";
  const dim = size === "sm" ? "w-7 h-7 text-[11px]" : "w-9 h-9 text-[13px]";
  return (
    <span aria-label={name} className={`inline-flex items-center justify-center shrink-0 rounded-full ring-1 font-bold ${dim} ${cls}`}>
      {teamInitials(name)}
    </span>
  );
}

const inputCls = "w-full h-10 px-3 rounded-xl bg-muted border border-border text-[13px] text-foreground outline-none focus:border-primary/50 transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-semibold text-foreground/70 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

// ── Task card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, teamIndex, dragging, onDragStart, onDragEnd, onOpen, onAdvance, onDelete }: {
  task: Task; teamIndex: number; dragging?: boolean;
  onDragStart?: () => void; onDragEnd?: () => void;
  onOpen: () => void; onAdvance: () => void; onDelete: () => void;
}) {
  const pc = PRIORITY_CONFIG[task.priority];
  const PIcon = pc.icon;
  const canAdvance = task.status !== nextStatus(task.status);
  const overdue = isOverdue(task);
  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart?.(); }}
      onDragEnd={onDragEnd}
      className={`group rounded-xl bg-card border border-border p-3 hover:border-primary/40 transition-all cursor-grab active:cursor-grabbing ${dragging ? "opacity-40 ring-2 ring-primary/50" : ""}`}
    >
      <button type="button" onClick={onOpen} className="block w-full text-right">
        <div className="flex items-start justify-between gap-2">
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${pc.color}`}>
            <PIcon className="w-3 h-3" /> {pc.label}
          </span>
          {task.assignee && <Avatar name={task.assignee} index={teamIndex} />}
        </div>
        <div className="mt-2 text-[13.5px] font-semibold text-foreground leading-snug line-clamp-2">{task.title}</div>
        {task.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {task.tags.slice(0, 3).map((t) => (
              <span key={t} className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 bg-muted text-[10px] text-foreground/60">
                <Tag className="w-2.5 h-2.5" />{t}
              </span>
            ))}
          </div>
        )}
        <div className="mt-2.5 flex items-center gap-3 text-[11px] text-foreground/45">
          {task.commentCount > 0 && <span className="inline-flex items-center gap-1"><MessageSquare className="w-3 h-3" />{task.commentCount}</span>}
          {task.subtasks.total > 0 && (
            <span className={`inline-flex items-center gap-1 ${task.subtasks.done === task.subtasks.total ? "text-emerald-400" : ""}`}>
              <ListChecks className="w-3 h-3" />{task.subtasks.done}/{task.subtasks.total}
            </span>
          )}
          {task.dueDate && (
            <span className={`inline-flex items-center gap-1 ${overdue ? "text-rose-400 font-semibold" : ""}`}>
              <Calendar className="w-3 h-3" />{new Date(task.dueDate).toLocaleDateString("ar-EG")}
            </span>
          )}
        </div>
      </button>
      <div className="mt-2.5 flex items-center gap-1 pt-2.5 border-t border-border">
        {canAdvance && (
          <button type="button" onClick={onAdvance} className="flex-1 h-7 rounded-lg bg-muted hover:bg-primary/15 text-[11.5px] font-semibold text-foreground/75 hover:text-primary transition-colors">
            نقل إلى {STATUS_CONFIG[nextStatus(task.status)].label} ←
          </button>
        )}
        <button type="button" onClick={onDelete} aria-label="حذف" className="p-1.5 rounded-lg text-foreground/35 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Create modal ──────────────────────────────────────────────────────────────
function CreateTaskModal({ teamMembers, onClose, onCreated }: {
  teamMembers: TeamMember[]; onClose: () => void; onCreated: (t: Task) => void;
}) {
  const panelRef = useDialogA11y(onClose);
  const titleId = useId();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [category, setCategory] = useState("general");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (title.trim().length < 2) { setError("العنوان مطلوب"); return; }
    setSaving(true); setError(null);
    try {
      const { task } = await api<{ task: Task }>("/admin/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(), description: description.trim(), priority, status, category,
          assigneeId: assigneeId ? Number(assigneeId) : null,
          dueDate: dueDate || null,
          tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      onCreated(task);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الإنشاء");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-soft-hover max-h-[90vh] overflow-y-auto outline-none" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card">
          <h3 id={titleId} className="text-[15px] font-bold text-foreground">مهمة جديدة</h3>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="rounded-xl px-3 py-2 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[12.5px] flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          <Field label="العنوان">
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="ما الذي يجب إنجازه؟" />
          </Field>
          <Field label="الوصف">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputCls} h-auto py-2 resize-none`} placeholder="تفاصيل إضافية (اختياري)" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الأولوية">
              <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} aria-label="الأولوية" className={inputCls}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
              </select>
            </Field>
            <Field label="الحالة">
              <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} aria-label="الحالة" className={inputCls}>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
              </select>
            </Field>
            <Field label="المسؤول">
              <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} aria-label="المسؤول" className={inputCls} data-testid="create-assignee">
                <option value="">— بدون —</option>
                {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.fullName}</option>)}
              </select>
            </Field>
            <Field label="التصنيف">
              <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="التصنيف" className={inputCls}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c === "general" ? "عام" : c}</option>)}
              </select>
            </Field>
            <Field label="تاريخ الاستحقاق">
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
            </Field>
            <Field label="وسوم (مفصولة بفاصلة)">
              <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} placeholder="تصميم, عاجل" />
            </Field>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border sticky bottom-0 bg-card">
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-xl bg-muted text-foreground/70 text-[13px] font-semibold hover:text-foreground transition-colors">إلغاء</button>
          <button type="button" onClick={submit} disabled={saving} data-testid="create-submit" className="h-9 px-5 rounded-xl bg-[hsl(var(--primary-cta))] text-white text-[13px] font-bold hover:shadow-soft-hover transition-shadow disabled:opacity-60 inline-flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} إنشاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Subtasks checklist ────────────────────────────────────────────────────────
function Checklist({ taskId, subtasks, setSubtasks }: {
  taskId: number; subtasks: Subtask[]; setSubtasks: (fn: (s: Subtask[]) => Subtask[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const done = subtasks.filter((s) => s.done).length;

  async function add() {
    const title = draft.trim();
    if (!title) return;
    setDraft("");
    try {
      const { subtask } = await api<{ subtask: Subtask }>(`/admin/tasks/${taskId}/subtasks`, { method: "POST", body: JSON.stringify({ title }) });
      setSubtasks((prev) => [...prev, subtask]);
    } catch { setDraft(title); /* restore so the text isn't lost */ }
  }
  async function toggle(s: Subtask) {
    setSubtasks((prev) => prev.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)));
    try { await api(`/admin/tasks/${taskId}/subtasks/${s.id}`, { method: "PATCH", body: JSON.stringify({ done: !s.done }) }); }
    catch { setSubtasks((prev) => prev.map((x) => (x.id === s.id ? { ...x, done: s.done } : x))); }
  }
  async function del(id: number) {
    const at = subtasks.findIndex((x) => x.id === id);
    const removed = subtasks[at];
    setSubtasks((prev) => prev.filter((x) => x.id !== id));
    try { await api(`/admin/tasks/${taskId}/subtasks/${id}`, { method: "DELETE" }); }
    catch { if (removed) setSubtasks((prev) => { const n = [...prev]; n.splice(Math.max(0, at), 0, removed); return n; }); }
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-[12px] font-bold text-foreground/60 mb-2">
        <ListChecks className="w-3.5 h-3.5" /> قائمة التحقّق {subtasks.length > 0 && <span className="text-foreground/40 font-mono">{done}/{subtasks.length}</span>}
      </div>
      {subtasks.length > 0 && (
        <div className="h-1 rounded-full bg-muted overflow-hidden mb-2.5">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(done / subtasks.length) * 100}%` }} />
        </div>
      )}
      <div className="space-y-1">
        {subtasks.map((s) => (
          <div key={s.id} className="group/sub flex items-center gap-2">
            <button type="button" onClick={() => toggle(s)} className="shrink-0" aria-label={s.done ? "إلغاء الإنجاز" : "إنجاز"}>
              {s.done ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4 text-foreground/35 hover:text-foreground/60" />}
            </button>
            <span className={`flex-1 text-[12.5px] ${s.done ? "line-through text-foreground/40" : "text-foreground/80"}`}>{s.title}</span>
            <button type="button" onClick={() => del(s.id)} aria-label="حذف" className="shrink-0 p-1 rounded text-foreground/30 hover:text-rose-400 opacity-0 group-hover/sub:opacity-100 focus-visible:opacity-100 transition-opacity">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="أضف عنصرًا…" className="flex-1 h-8 px-2.5 rounded-lg bg-muted border border-border text-[12.5px] text-foreground outline-none focus:border-primary/50" data-testid="subtask-input" />
        <button type="button" onClick={add} disabled={!draft.trim()} className="h-8 px-3 rounded-lg bg-muted hover:bg-primary/15 text-foreground/70 hover:text-primary text-[12px] font-semibold disabled:opacity-40 transition-colors">إضافة</button>
      </div>
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function TaskDetailPanel({ task, teamMembers, onClose, onUpdated, onDeleted }: {
  task: Task; teamMembers: TeamMember[];
  onClose: () => void; onUpdated: (t: Task) => void; onDeleted: (id: number) => void;
}) {
  const panelRef = useDialogA11y(onClose);
  const titleId = useId();
  const [comments, setComments] = useState<Comment[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<{ comments: Comment[]; activity: ActivityItem[]; subtasks: Subtask[] }>(`/admin/tasks/${task.id}/comments`)
      .then((d) => { if (!cancelled) { setComments(d.comments); setActivity(d.activity); setSubtasks(d.subtasks); } })
      .catch(() => { /* keep empty */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [task.id]);

  async function patch(body: Record<string, unknown>) {
    try {
      const { task: updated } = await api<{ task: Task }>(`/admin/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify(body) });
      onUpdated(updated);
    } catch { /* ignore */ }
  }
  async function postComment() {
    if (draft.trim().length < 1) return;
    setPosting(true);
    try {
      const { comment } = await api<{ comment: Comment }>(`/admin/tasks/${task.id}/comments`, { method: "POST", body: JSON.stringify({ body: draft.trim() }) });
      setComments((prev) => [...prev, comment]);
      setDraft("");
      onUpdated({ ...task, commentCount: task.commentCount + 1 });
    } catch { /* ignore */ } finally { setPosting(false); }
  }
  function mention(name: string) {
    setDraft((d) => `${d}${d && !d.endsWith(" ") ? " " : ""}@${name} `);
  }

  const sc = STATUS_CONFIG[task.status];

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/60" onClick={onClose}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="w-full max-w-xl h-full bg-card border-e border-border shadow-soft-hover overflow-y-auto flex flex-col outline-none" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
              <span className="text-[11px] text-foreground/40 font-mono">#{task.id}</span>
            </div>
            <h3 id={titleId} className="text-[16px] font-bold text-foreground leading-snug">{task.title}</h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={() => { if (window.confirm("حذف هذه المهمة نهائيًا؟")) onDeleted(task.id); }} aria-label="حذف" className="p-2 rounded-lg text-foreground/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
            <button type="button" onClick={onClose} aria-label="إغلاق" className="p-2 rounded-lg text-foreground/50 hover:text-foreground hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="p-5 space-y-4 border-b border-border">
          {task.description && <p className="text-[13px] text-foreground/70 leading-relaxed break-words"><RichText text={task.description} /></p>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="الحالة">
              <select value={task.status} onChange={(e) => patch({ status: e.target.value })} aria-label="الحالة" className={inputCls}>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
              </select>
            </Field>
            <Field label="الأولوية">
              <select value={task.priority} onChange={(e) => patch({ priority: e.target.value })} aria-label="الأولوية" className={inputCls}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
              </select>
            </Field>
            <Field label="المسؤول">
              <select value={task.assigneeId ?? ""} onChange={(e) => patch({ assigneeId: e.target.value ? Number(e.target.value) : null })} aria-label="المسؤول" className={inputCls} data-testid="detail-assignee">
                <option value="">— بدون —</option>
                {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.fullName}</option>)}
              </select>
            </Field>
            <div>
              <span className="block text-[12px] font-semibold text-foreground/70 mb-1.5">الموعد</span>
              <div className={`h-10 px-3 rounded-xl bg-muted border border-border text-[13px] flex items-center ${isOverdue(task) ? "text-rose-400 font-semibold" : "text-foreground/70"}`}>
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString("ar-EG") : "—"}
              </div>
            </div>
          </div>
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map((t) => <span key={t} className="rounded-full px-2.5 py-0.5 bg-muted text-[11px] text-foreground/65">{t}</span>)}
            </div>
          )}
          <Checklist taskId={task.id} subtasks={subtasks} setSubtasks={setSubtasks} />
        </div>

        <div className="flex-1 p-5 space-y-4">
          <div className="flex items-center gap-2 text-[12px] font-bold text-foreground/60"><MessageSquare className="w-3.5 h-3.5" /> النقاش ({comments.length})</div>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
          ) : comments.length === 0 ? (
            <p className="text-[12.5px] text-foreground/40 text-center py-4">لا نقاش بعد — ابدأه.</p>
          ) : (
            <div className="space-y-3">
              {comments.map((c, i) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <Avatar name={c.author} index={i} />
                  <div className="flex-1 min-w-0 rounded-xl bg-muted px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[12.5px] font-semibold text-foreground">{c.author}</span>
                      <span className="text-[10.5px] text-foreground/40">{relativeTime(c.createdAt)}</span>
                    </div>
                    <p className="text-[13px] text-foreground/80 mt-0.5 leading-relaxed break-words"><RichText text={c.body} /></p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activity.length > 0 && (
            <div className="pt-3 mt-3 border-t border-border space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-bold text-foreground/45 uppercase tracking-wide"><Activity className="w-3 h-3" /> السجلّ</div>
              {activity.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-[11.5px] text-foreground/50">
                  <span className="font-semibold text-foreground/70">{a.actor}</span>
                  <span>{activityLabel(a)}</span>
                  <span className="ms-auto shrink-0 text-foreground/35">{relativeTime(a.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border sticky bottom-0 bg-card space-y-2">
          {teamMembers.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <AtSign className="w-3 h-3 text-foreground/40" />
              {teamMembers.slice(0, 6).map((m) => (
                <button key={m.id} type="button" onClick={() => mention(m.fullName)} className="rounded-full px-2 py-0.5 bg-muted hover:bg-primary/15 text-[11px] text-foreground/60 hover:text-primary transition-colors">{m.fullName}</button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={draft} onChange={(e) => setDraft(e.target.value)} rows={1}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) postComment(); }}
              placeholder="اكتب تعليقًا… (اذكر زميلًا بـ @)"
              data-testid="comment-input"
              className="flex-1 px-3 py-2.5 rounded-xl bg-muted border border-border text-[13px] text-foreground outline-none focus:border-primary/50 resize-none max-h-32"
            />
            <button type="button" onClick={postComment} disabled={posting || !draft.trim()} aria-label="إرسال" className="h-11 w-11 shrink-0 rounded-xl bg-[hsl(var(--primary-cta))] text-white grid place-items-center hover:shadow-soft-hover transition-shadow disabled:opacity-50">
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rtl:-scale-x-100" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
type View = "kanban" | "list" | "activity";

export default function AdminTasks({ openTaskId, onOpenConsumed }: { openTaskId?: number | null; onOpenConsumed?: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [me, setMe] = useState<number | null>(null);
  const [feed, setFeed] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("kanban");
  const [fAssignee, setFAssignee] = useState("");
  const [fPriority, setFPriority] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  async function load() {
    try {
      setError(null);
      const data = await api<{ tasks: Task[]; teamMembers: TeamMember[]; me: number | null }>("/admin/tasks");
      setTasks(data.tasks); setTeamMembers(data.teamMembers); setMe(data.me);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    } finally { setLoading(false); }
  }
  async function loadFeed() {
    try { const d = await api<{ feed: ActivityItem[] }>("/admin/tasks/activity/feed"); setFeed(d.feed); } catch { /* silent */ }
  }
  useEffect(() => { void load(); void loadFeed(); }, []);

  // Deep-link: open a specific task when navigated from a notification.
  useEffect(() => {
    if (openTaskId != null) { setSelectedId(openTaskId); onOpenConsumed?.(); }
  }, [openTaskId, onOpenConsumed]);

  const teamIndex = (id: number | null) => (id == null ? 0 : Math.max(0, teamMembers.findIndex((m) => m.id === id)));

  async function advance(task: Task) {
    const to = nextStatus(task.status);
    if (to === task.status) return;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: to } : t)));
    try { await api(`/admin/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ status: to }) }); void loadFeed(); }
    catch { void load(); }
  }
  async function remove(id: number) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (selectedId === id) setSelectedId(null);
    try { await api(`/admin/tasks/${id}`, { method: "DELETE" }); } catch { void load(); }
  }
  // Drag a card into another column → change its status (optimistic + persist).
  async function moveTo(id: number, status: TaskStatus) {
    const t = tasks.find((x) => x.id === id);
    if (!t || t.status === status) return;
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    try { await api(`/admin/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); void loadFeed(); }
    catch { void load(); }
  }

  const filtered = tasks.filter((t) =>
    (!fAssignee || String(t.assigneeId ?? "") === fAssignee) &&
    (!fPriority || t.priority === fPriority) &&
    (!mineOnly || (me != null && t.assigneeId === me)) &&
    (!overdueOnly || isOverdue(t)),
  );
  const selected = tasks.find((t) => t.id === selectedId) ?? null;
  const overdueCount = tasks.filter(isOverdue).length;

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex-1 min-w-[180px]">
          <h2 className="text-[20px] font-bold text-foreground">مركز المهام والتواصل</h2>
          <p className="text-[13px] text-foreground/60 mt-0.5">
            {tasks.length} مهمة · {tasks.filter((t) => t.status === "done").length} منجزة · {tasks.filter((t) => t.status === "in_progress").length} جارية
            {overdueCount > 0 && <span className="text-rose-400"> · {overdueCount} متأخّرة</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
            {([["kanban", LayoutGrid, "لوحة"], ["list", List, "قائمة"], ["activity", Activity, "النشاط"]] as const).map(([v, Icon, label]) => (
              <button key={v} type="button" onClick={() => setView(v)} className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12.5px] font-medium transition-colors ${view === v ? "bg-card text-foreground shadow-soft-hover" : "text-foreground/60 hover:text-foreground"}`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setCreating(true)} data-testid="task-new" className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[hsl(var(--primary-cta))] text-white text-[13px] font-semibold hover:shadow-soft-hover transition-shadow">
            <Plus className="w-4 h-4" /> مهمة جديدة
          </button>
        </div>
      </div>

      {error && <div className="rounded-2xl px-4 py-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[13px] flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}

      {view !== "activity" && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-foreground/50" />
          <button type="button" onClick={() => setMineOnly((v) => !v)} data-testid="filter-mine" className={`h-8 px-3 rounded-xl border text-[12.5px] font-semibold inline-flex items-center gap-1.5 transition-colors ${mineOnly ? "bg-primary/15 border-primary/40 text-primary" : "bg-muted border-border text-foreground/65 hover:text-foreground"}`}>
            <User className="w-3.5 h-3.5" /> مهامّي
          </button>
          <button type="button" onClick={() => setOverdueOnly((v) => !v)} className={`h-8 px-3 rounded-xl border text-[12.5px] font-semibold inline-flex items-center gap-1.5 transition-colors ${overdueOnly ? "bg-rose-500/15 border-rose-500/40 text-rose-300" : "bg-muted border-border text-foreground/65 hover:text-foreground"}`}>
            <Calendar className="w-3.5 h-3.5" /> متأخّرة{overdueCount > 0 && ` · ${overdueCount}`}
          </button>
          <select value={fAssignee} onChange={(e) => setFAssignee(e.target.value)} aria-label="تصفية بالمسؤول" className="h-8 px-3 rounded-xl bg-muted border border-border text-[12.5px] outline-none">
            <option value="">كل الفريق</option>
            {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.fullName}</option>)}
          </select>
          <select value={fPriority} onChange={(e) => setFPriority(e.target.value)} aria-label="تصفية بالأولوية" className="h-8 px-3 rounded-xl bg-muted border border-border text-[12.5px] outline-none">
            <option value="">كل الأولويات</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
          </select>
          {(fAssignee || fPriority || mineOnly || overdueOnly) && (
            <button type="button" onClick={() => { setFAssignee(""); setFPriority(""); setMineOnly(false); setOverdueOnly(false); }} className="h-8 px-3 rounded-xl bg-muted text-foreground/60 hover:text-foreground text-[12px] flex items-center gap-1 transition-colors"><X className="w-3 h-3" /> إلغاء</button>
          )}
        </div>
      )}

      {view === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {BOARD.map((status) => {
            const cfg = STATUS_CONFIG[status];
            const Icon = cfg.icon;
            const col = filtered.filter((t) => t.status === status);
            const isTarget = dragOver === status;
            return (
              <div
                key={status}
                className="space-y-2"
                onDragOver={(e) => { if (dragId != null) { e.preventDefault(); setDragOver(status); } }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver((s) => (s === status ? null : s)); }}
                onDrop={(e) => { e.preventDefault(); if (dragId != null) { moveTo(dragId, status); } setDragId(null); setDragOver(null); }}
              >
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${cfg.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${cfg.color} ${status === "in_progress" ? "animate-spin" : ""}`} />
                  <span className={`text-[12.5px] font-bold ${cfg.color}`}>{cfg.label}</span>
                  <span className="ms-auto text-[11px] text-foreground/45 font-mono">{col.length}</span>
                </div>
                <div className={`space-y-2 min-h-[56px] rounded-xl transition-colors ${isTarget ? "ring-2 ring-primary/50 ring-inset bg-primary/[0.04]" : ""}`}>
                  {col.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      teamIndex={teamIndex(task.assigneeId)}
                      dragging={dragId === task.id}
                      onDragStart={() => setDragId(task.id)}
                      onDragEnd={() => { setDragId(null); setDragOver(null); }}
                      onOpen={() => setSelectedId(task.id)}
                      onAdvance={() => advance(task)}
                      onDelete={() => remove(task.id)}
                    />
                  ))}
                  {col.length === 0 && <div className="rounded-xl border border-dashed border-border h-14 grid place-items-center text-[11px] text-foreground/30">{isTarget ? "أفلت هنا" : "لا مهام"}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "list" && (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/40 text-foreground/55 text-[11px] uppercase">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold">المهمة</th>
                  <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell">الأولوية</th>
                  <th className="text-right px-4 py-3 font-semibold hidden md:table-cell">المسؤول</th>
                  <th className="text-right px-4 py-3 font-semibold hidden lg:table-cell">الموعد</th>
                  <th className="text-right px-4 py-3 font-semibold">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-foreground/50">لا مهام</td></tr>}
                {filtered.map((task) => {
                  const sc = STATUS_CONFIG[task.status]; const pc = PRIORITY_CONFIG[task.priority];
                  const PIcon = pc.icon; const SIcon = sc.icon;
                  const overdue = isOverdue(task);
                  return (
                    <tr key={task.id} className="border-t border-border hover:bg-muted/20 cursor-pointer" onClick={() => setSelectedId(task.id)}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground leading-tight">{task.title}</div>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-foreground/40">
                          {task.commentCount > 0 && <span className="inline-flex items-center gap-1"><MessageSquare className="w-3 h-3" />{task.commentCount}</span>}
                          {task.subtasks.total > 0 && <span className="inline-flex items-center gap-1"><ListChecks className="w-3 h-3" />{task.subtasks.done}/{task.subtasks.total}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell"><span className={`inline-flex items-center gap-1 text-[12px] font-semibold ${pc.color}`}><PIcon className="w-3.5 h-3.5" />{pc.label}</span></td>
                      <td className="px-4 py-3 hidden md:table-cell">{task.assignee ? <div className="flex items-center gap-2"><Avatar name={task.assignee} index={teamIndex(task.assigneeId)} /><span className="text-[12px]">{task.assignee}</span></div> : <span className="text-foreground/30">—</span>}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">{task.dueDate ? <span className={`text-[12px] ${overdue ? "text-rose-400 font-semibold" : "text-foreground/60"}`}>{new Date(task.dueDate).toLocaleDateString("ar-EG")}</span> : <span className="text-foreground/30">—</span>}</td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.color}`}><SIcon className={`w-3 h-3 ${task.status === "in_progress" ? "animate-spin" : ""}`} />{sc.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "activity" && (
        <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
          {feed.length === 0 && <div className="py-12 text-center text-foreground/50">لا نشاط بعد</div>}
          {feed.map((item, i) => (
            <div key={item.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/20 transition-colors">
              <Avatar name={item.actor} index={i} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground text-[13px]">{item.actor}</span>
                  <span className="text-foreground/60 text-[13px]">{activityLabel(item)}</span>
                </div>
                <button type="button" onClick={() => setSelectedId(item.taskId)} className="text-[12px] text-primary/80 hover:text-primary transition-colors mt-0.5 truncate block max-w-[260px] text-right">{item.taskTitle}</button>
              </div>
              <span className="text-[11.5px] text-foreground/40 shrink-0 mt-0.5 tabular-nums">{relativeTime(item.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      {creating && <CreateTaskModal teamMembers={teamMembers} onClose={() => setCreating(false)} onCreated={(task) => { setTasks((prev) => [task, ...prev]); setCreating(false); setSelectedId(task.id); void loadFeed(); }} />}
      {selected && <TaskDetailPanel task={selected} teamMembers={teamMembers} onClose={() => setSelectedId(null)} onUpdated={(u) => { setTasks((prev) => prev.map((t) => (t.id === u.id ? u : t))); void loadFeed(); }} onDeleted={(id) => remove(id)} />}
    </div>
  );
}
