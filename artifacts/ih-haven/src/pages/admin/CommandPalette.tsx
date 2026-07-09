import { useEffect, useRef, useState } from "react";
import { Search, CornerDownLeft } from "lucide-react";

// ⌘K command palette — fuzzy-jump to any permitted section (and quick actions).
// Keyboard-first: ↑/↓ move, Enter selects, Esc closes. Opened by the shell.

export interface PaletteItem {
  id: string;
  label: string;
  group: string;
  Icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}

// Subsequence fuzzy match (e.g. "قص" matches "قصص النجاح"); falls back to includes.
function matches(q: string, label: string): boolean {
  if (!q) return true;
  const s = label.toLowerCase();
  const query = q.toLowerCase();
  if (s.includes(query)) return true;
  let i = 0;
  for (const ch of s) if (ch === query[i]) i++;
  return i === query.length;
}

export default function CommandPalette({
  open, onClose, items, onSelect,
}: {
  open: boolean;
  onClose: () => void;
  items: PaletteItem[];
  onSelect: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = items.filter((it) => matches(q, it.label));

  useEffect(() => {
    if (!open) return undefined;
    setQ("");
    setActive(0);
    // focus after paint
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => { setActive(0); }, [q]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
      else if (e.key === "Enter") {
        e.preventDefault();
        const item = filtered[active];
        if (item) { onSelect(item.id); onClose(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, filtered, active, onClose, onSelect]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="لوحة الأوامر"
      >
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-border">
          <Search className="w-4 h-4 text-foreground/40 shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="اقفز إلى قسم… (اكتب للبحث)"
            data-testid="palette-input"
            className="flex-1 bg-transparent outline-none text-[14px] text-foreground placeholder:text-foreground/40"
          />
          <kbd className="hidden sm:inline text-[10px] font-mono text-foreground/40 border border-border rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-foreground/45 text-[13px]">لا نتائج لـ «{q}»</div>
          ) : (
            filtered.map((it, idx) => {
              const on = idx === active;
              const Icon = it.Icon;
              return (
                <button
                  key={it.id}
                  type="button"
                  data-idx={idx}
                  data-testid={`palette-item-${it.id}`}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => { onSelect(it.id); onClose(); }}
                  className={`w-full text-right flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    on ? "bg-primary/[0.12] text-foreground" : "text-foreground/75 hover:bg-foreground/[0.04]"
                  }`}
                >
                  <span className={`shrink-0 w-7 h-7 rounded-lg grid place-items-center ${on ? "bg-primary/20 text-primary" : "bg-foreground/[0.05] text-foreground/50"}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="flex-1 text-[13.5px] font-medium">{it.label}</span>
                  <span className="text-[11px] text-foreground/40">{it.group}</span>
                  {on && <CornerDownLeft className="w-3.5 h-3.5 text-foreground/40 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
