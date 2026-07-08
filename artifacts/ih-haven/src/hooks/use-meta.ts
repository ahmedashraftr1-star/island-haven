import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

/** A value that is either a single string or a bilingual `{ ar, en }` pair. */
export type Localizable = string | { ar: string; en: string };

interface MetaOptions {
  title?: Localizable;
  description?: Localizable;
  image?: string;
  type?: "website" | "article" | "profile";
  url?: string;
}

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${name}"], meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    // Use property for og/twitter, name for standard
    if (name.startsWith("og:") || name.startsWith("twitter:")) {
      el.setAttribute("property", name);
    } else {
      el.setAttribute("name", name);
    }
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

const SITE_NAME = "Island Haven · آيلاند هيفن";
// Matches index.html's static og:image. (/og-image.png does not exist.)
const DEFAULT_IMAGE = `${window.location.origin}/opengraph.jpg`;
const BASE_URL = window.location.origin;

export function usePageMeta({ title, description, image, type = "website", url }: MetaOptions) {
  const { lang } = useLanguage();
  // Resolve bilingual values against the active locale; plain strings pass through.
  const localizedTitle = title == null ? undefined : typeof title === "string" ? title : title[lang];
  const localizedDescription =
    description == null ? undefined : typeof description === "string" ? description : description[lang];

  useEffect(() => {
    const fullTitle = localizedTitle ? `${localizedTitle} — ${SITE_NAME}` : SITE_NAME;
    const pageUrl = url ?? window.location.href;
    const ogImage = image ?? DEFAULT_IMAGE;

    document.title = fullTitle;

    if (localizedDescription) {
      setMeta("description", localizedDescription);
      setMeta("og:description", localizedDescription);
      setMeta("twitter:description", localizedDescription);
    }

    setMeta("og:title", fullTitle);
    setMeta("og:type", type);
    setMeta("og:url", pageUrl);
    setMeta("og:image", ogImage);
    setMeta("og:site_name", SITE_NAME);

    setMeta("twitter:card", image ? "summary_large_image" : "summary");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:image", ogImage);

    // Canonical
    let canonical = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = pageUrl;

    return () => {
      // Restore default title on unmount
      document.title = SITE_NAME;
    };
  }, [localizedTitle, localizedDescription, image, type, url]);
}

// Suppress unused-import warning for BASE_URL
void BASE_URL;
