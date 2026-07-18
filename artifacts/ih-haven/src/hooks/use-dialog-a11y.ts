import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * useDialogA11y — the accessible-modal behaviour every hand-rolled dialog on the
 * site should share, in one place: Escape-to-close, a real focus trap
 * (Tab/Shift+Tab cycle), focus entering on open and restoring to the trigger on
 * close, and a body-scroll lock. Attach the returned ref to the dialog panel and
 * set role="dialog" aria-modal="true" aria-labelledby on it yourself. If the
 * panel already holds an autoFocus target, that focus is respected.
 *
 * `isOpen` lets a parent that renders the panel conditionally call the hook
 * unconditionally (Rules of Hooks) while the trap/scroll-lock only engage — and
 * re-engage — when open. Pass a STABLE `onClose` (useCallback) so the effect
 * doesn't tear down and rebuild every render.
 */
export function useDialogA11y(onClose: () => void, isOpen = true) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const visibleFocusables = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    // Move focus into the dialog unless an autoFocus field already claimed it.
    if (!panel.contains(document.activeElement)) {
      (visibleFocusables()[0] ?? panel).focus();
    }

    // Lock the page behind the modal.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = visibleFocusables();
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose, isOpen]);
  return panelRef;
}
