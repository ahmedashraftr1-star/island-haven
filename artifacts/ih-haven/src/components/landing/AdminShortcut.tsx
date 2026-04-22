import { useEffect } from "react";

/**
 * Listens for Cmd/Ctrl + Shift + A and navigates to /admin.
 * A discreet professional shortcut so the team can reach the
 * control panel from anywhere on the site without exposing
 * a visible link to the public.
 */
export function AdminShortcut() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        window.location.href = `${import.meta.env.BASE_URL}admin`;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}
