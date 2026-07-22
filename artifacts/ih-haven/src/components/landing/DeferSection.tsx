import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * DeferSection — mounts its children only once the wrapper is within `rootMargin`
 * of the viewport, holding a reserved-height placeholder until then.
 *
 * Why: the homepage's below-the-fold "acts" are cinematic framer-motion sections.
 * Even though each is code-split, rendering them on mount makes React fetch every
 * chunk AND spin up every scroll-linked spring/observer during the initial load —
 * which is the bulk of the page's main-thread blocking (TBT). Gating the MOUNT
 * behind an IntersectionObserver keeps that work out of the load path entirely;
 * the hero's own motion identity is untouched (act 0 renders eagerly).
 *
 * CLS-safety: the wrapper keeps its reserved `min-height` at all times, so the
 * placeholder never collapses when the chunk swaps in. With a generous rootMargin
 * the section finishes painting well before it scrolls into view, so the swap is
 * off-screen (zero layout shift). The reserved heights are sized just under each
 * act's real height (measured per breakpoint) so the content only ever grows.
 *
 * The `id` lives HERE, not on the inner marker, so HomeTOC's scroll-spy and the
 * rail's jump-to-act keep working even before the act has mounted. No
 * IntersectionObserver (SSR / very old browser) → render immediately.
 */
export function DeferSection({
  children,
  id,
  reserve,
  rootMargin = "700px 0px",
}: {
  children: ReactNode;
  /** anchor id for HomeTOC (e.g. "act-1") */
  id?: string;
  /** Tailwind min-height reservation classes, e.g. "min-h-[3200px] lg:min-h-[2000px]" */
  reserve: string;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show, rootMargin]);

  return (
    <div ref={ref} id={id} className={reserve}>
      {show ? children : null}
    </div>
  );
}
