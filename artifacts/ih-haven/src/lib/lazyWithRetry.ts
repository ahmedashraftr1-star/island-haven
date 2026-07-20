import { lazy, type ComponentType } from "react";

/**
 * Drop-in replacement for React.lazy that survives a redeploy.
 *
 * After a new build ships, the content-hashed chunk names change; a client still
 * running the old shell then fails a lazy `import()` with "Failed to fetch
 * dynamically imported module". Plain React.lazy has no recovery — the section
 * renders its error fallback and stays broken until a manual refresh. This helper:
 *   1. retries the import once (covers a transient network blip), then
 *   2. if it's still a chunk-load error, does ONE full `location.reload()` guarded
 *      by a sessionStorage flag so it can never loop — the reload pulls the fresh
 *      index.html + new chunk hashes and the app recovers by itself.
 * A genuine (non-chunk) module error is rethrown untouched so the error boundary
 * still surfaces real bugs.
 */
const RELOAD_GUARD = "ih-chunk-reload";

function isChunkLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /dynamically imported module|Importing a module script failed|Failed to fetch|error loading dynamically/i.test(
    msg,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors React.lazy's own signature
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      // A clean load means we're on the current build — clear any stale guard so
      // a future redeploy is allowed its own one-shot reload.
      try {
        sessionStorage.removeItem(RELOAD_GUARD);
      } catch {
        /* storage unavailable — ignore */
      }
      return mod;
    } catch (err) {
      if (!isChunkLoadError(err)) throw err; // real module error — surface it
      // One silent retry for a transient fetch hiccup.
      try {
        return await factory();
      } catch (err2) {
        if (!isChunkLoadError(err2)) throw err2;
        // Persistent chunk failure → almost certainly a stale build. Reload once.
        let alreadyReloaded = false;
        try {
          alreadyReloaded = sessionStorage.getItem(RELOAD_GUARD) === "1";
          if (!alreadyReloaded) sessionStorage.setItem(RELOAD_GUARD, "1");
        } catch {
          /* storage unavailable — fall through to rethrow */
        }
        if (!alreadyReloaded && typeof location !== "undefined") {
          location.reload();
          // Hold the render until the reload takes effect (never resolves).
          return await new Promise<{ default: T }>(() => {});
        }
        throw err2; // already reloaded once → let the error boundary handle it
      }
    }
  });
}
