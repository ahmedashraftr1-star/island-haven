import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/pages/admin/adminShared";

/**
 * Unified, accessible confirmation dialog — the one replacement for every
 * `window.confirm()` in the admin. Promise-based so call sites read almost
 * identically:  `if (await confirm({ title, message, danger })) { … }`.
 *
 * `doubleConfirm` arms a second, explicit press for irreversible actions
 * (permanent delete) — the first press flips the button to "تأكيد نهائيّ".
 */
export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  doubleConfirm?: boolean;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [armed, setArmed] = useState(false);
  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    setArmed(false);
    setOpts(options);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    setOpts(null);
    setArmed(false);
    resolveRef.current?.(value);
    resolveRef.current = null;
  }, []);

  const onConfirmClick = () => {
    if (opts?.doubleConfirm && !armed) {
      setArmed(true);
      return;
    }
    settle(true);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {opts && (
        <Modal title={opts.title} onClose={() => settle(false)}>
          <div className="px-6 py-5 space-y-5">
            {opts.message && (
              <p className="text-[14px] leading-relaxed text-foreground/80 whitespace-pre-wrap">
                {opts.message}
              </p>
            )}
            {opts.doubleConfirm && armed && (
              <p className="flex items-center gap-2 text-[13px] font-semibold text-destructive">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
                اضغط «تأكيد نهائيّ» مرّة أخرى للمتابعة — لا يمكن التراجع.
              </p>
            )}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => settle(false)}
                className="inline-flex items-center justify-center min-h-[40px] rounded-xl border border-border bg-muted/40 px-4 text-[13.5px] font-semibold text-foreground/80 transition-colors hover:text-foreground hover:bg-muted"
              >
                {opts.cancelLabel ?? "إلغاء"}
              </button>
              <button
                type="button"
                autoFocus
                onClick={onConfirmClick}
                className={
                  "inline-flex items-center justify-center min-h-[40px] rounded-xl px-4 text-[13.5px] font-semibold text-white transition-colors " +
                  (opts.danger || (opts.doubleConfirm && armed)
                    ? "bg-destructive hover:bg-destructive/90"
                    : "bg-primary hover:bg-primary/90")
                }
              >
                {opts.doubleConfirm && armed ? "تأكيد نهائيّ" : opts.confirmLabel ?? "تأكيد"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a <ConfirmProvider>");
  }
  return ctx;
}
