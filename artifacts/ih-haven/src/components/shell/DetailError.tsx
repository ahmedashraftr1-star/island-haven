import { BackLink, EmptyState } from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Shared error state for the ID detail pages (ventures / experts / member
 * profile / daily / blog). Renders a calm, localized message inside the page's
 * PageShell instead of a raw "HTTP 500":
 *   - a 404 shows a "not found" state (no retry — retrying won't help),
 *   - any other failure shows "couldn't load" + a Try-again button wired to the
 *     page's own reload().
 * `status` is the ApiError.status (or 0 for a network error, null for none).
 */
export function DetailError({
  status,
  onRetry,
  backHref,
  backLabel,
}: {
  status: number | null;
  onRetry: () => void;
  backHref: string;
  backLabel: string;
}) {
  const { t } = useLanguage();
  const notFound = status === 404;
  return (
    <>
      <BackLink href={backHref} label={backLabel} />
      <EmptyState
        title={
          notFound
            ? t({ ar: "غير موجود", en: "Not found" })
            : t({ ar: "تعذّر التحميل", en: "Couldn't load" })
        }
        hint={
          notFound
            ? t({
                ar: "لم نعثر على ما تبحث عنه — ربّما حُذف أو تغيّر رابطه.",
                en: "We couldn't find what you're looking for — it may have been removed or its link changed.",
              })
            : t({
                ar: "حدث خطأ أثناء الجلب. تحقّق من اتّصالك وحاول مرّة أخرى.",
                en: "Something went wrong while loading. Check your connection and try again.",
              })
        }
        action={
          notFound ? undefined : (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center justify-center px-6 h-11 rounded-full bg-[hsl(var(--primary-cta))] text-white font-semibold text-[13.5px] hover:shadow-soft-hover transition-shadow"
            >
              {t({ ar: "إعادة المحاولة", en: "Try again" })}
            </button>
          )
        }
      />
    </>
  );
}
