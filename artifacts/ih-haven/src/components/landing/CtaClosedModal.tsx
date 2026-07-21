import { X, CalendarDays, ListChecks } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDialogA11y } from "@/hooks/use-dialog-a11y";
import type { CtaButtonConfig } from "@/hooks/use-public-data";

/**
 * Shown when a visible-but-closed CTA is clicked: instead of the form, the owner's
 * editable explanation (upcoming registration dates + membership conditions). Fully
 * accessible (focus-trapped, Escape/backdrop to close) and bilingual.
 */
export function CtaClosedModal({
  button,
  onClose,
}: {
  button: CtaButtonConfig;
  onClose: () => void;
}) {
  const { lang } = useLanguage();
  const panelRef = useDialogA11y(onClose);
  const isEn = lang === "en";
  const title = isEn ? button.closedTitleEn : button.closedTitleAr;
  const body = isEn ? button.closedBodyEn : button.closedBodyAr;
  const dates = isEn ? button.closedDatesEn : button.closedDatesAr;
  const conditions = isEn ? button.closedConditionsEn : button.closedConditionsAr;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        dir={isEn ? "ltr" : "rtl"}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-[#12100e] text-white rounded-t-3xl sm:rounded-3xl border border-white/15 shadow-2xl outline-none max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <h2 className="text-[19px] font-bold leading-snug">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? "Close" : "إغلاق"}
            className="shrink-0 grid place-items-center w-9 h-9 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
        <p className="px-6 pt-3 pb-2 text-[14.5px] leading-relaxed text-white/80 whitespace-pre-wrap">
          {body}
        </p>

        {(dates.trim() || conditions.trim()) && (
          <div className="px-6 pt-3 space-y-4">
            {dates.trim() && (
              <div className="rounded-2xl border border-[#DDBD7E]/25 bg-[#DDBD7E]/[0.06] p-4">
                <div className="flex items-center gap-2 text-[12px] font-bold text-[#DDBD7E]">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                  {isEn ? "Official registration dates" : "المواعيد الرسميّة للتسجيل"}
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/80 whitespace-pre-wrap">{dates}</p>
              </div>
            )}
            {conditions.trim() && (
              <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 text-[12px] font-bold text-white/85">
                  <ListChecks className="h-3.5 w-3.5 text-primary" aria-hidden />
                  {isEn ? "Membership conditions" : "شروط الانتساب"}
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/75 whitespace-pre-wrap">{conditions}</p>
              </div>
            )}
          </div>
        )}

        <div className="px-6 pb-6 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 font-semibold text-[14.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            {isEn ? "Got it" : "حسنًا"}
          </button>
        </div>
      </div>
    </div>
  );
}
