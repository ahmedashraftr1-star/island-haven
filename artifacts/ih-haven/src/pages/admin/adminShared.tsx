import { X } from "lucide-react";

// Small shared building blocks for the incubator admin editors (programs,
// ventures, stories, partners). The `.inp` marker class on inputs picks up
// full-width/transparent styling from the Field wrapper.

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl border border-border w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white z-10">
          <h3 className="text-[16px] font-bold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-foreground/[0.04] text-foreground/65"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block mb-1.5 text-[12px] text-foreground/65 font-semibold">
        {label}
      </label>
      <div className="rounded-xl px-3 py-2.5 bg-muted/40 border border-border focus-within:bg-muted/60 transition-colors [&_.inp]:w-full [&_.inp]:bg-transparent [&_.inp]:outline-none [&_.inp]:text-[14px]">
        {children}
      </div>
    </div>
  );
}

export function SaveBar({
  submitting,
  isNew,
  onClose,
}: {
  submitting: boolean;
  isNew: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="submit"
        disabled={submitting}
        className="flex-1 h-11 rounded-full bg-primary text-primary-foreground font-semibold text-[13.5px] enabled:hover:shadow-soft-hover transition-shadow disabled:opacity-50"
      >
        {submitting ? "جارِ الحفظ…" : isNew ? "إنشاء" : "حفظ التعديلات"}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="px-6 h-11 rounded-full bg-muted text-foreground/75 font-semibold text-[13.5px] hover:bg-muted/70 transition-colors"
      >
        إلغاء
      </button>
    </div>
  );
}
