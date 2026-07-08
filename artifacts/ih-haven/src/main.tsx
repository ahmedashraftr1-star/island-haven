import { createRoot } from "react-dom/client";
import { LanguageProvider } from "./contexts/LanguageContext";
import App from "./App";
import "./index.css";

// Language bootstrap — runs before React's first render (and thus before the app
// paints), so the initial paint already matches the persisted locale: no RTL→LTR
// flip for EN visitors, and the static skip-link never shows the other language.
// Mirrors LanguageProvider's init (default "ar"; "en" only when explicitly stored)
// and is bundled (CSP-clean — no inline <script> under `script-src 'self'`).
try {
  if (localStorage.getItem("ih-lang") === "en") {
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
    const skip = document.querySelector("[data-i18n-skip]");
    if (skip) skip.textContent = "Skip to content";
  }
} catch {}

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
