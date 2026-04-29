import type { ComponentType, LazyExoticComponent } from "react";
import { lazy } from "react";

/** After a deploy, browsers may still hold an old index.html that points at removed hashed chunks. */
const CHUNK_RELOAD_FLAG = "hajime_stale_chunk_reload";

function isStaleChunkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("error loading dynamically imported module") ||
    /Loading chunk \d+ failed/i.test(msg)
  );
}

/**
 * Same as `React.lazy`, but if the chunk 404s after a deploy we reload once so a fresh `index.html` is fetched.
 */
export function lazyWithChunkReload<T extends ComponentType<unknown>>(
  importer: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const mod = await importer();
      sessionStorage.removeItem(CHUNK_RELOAD_FLAG);
      return mod;
    } catch (err) {
      if (isStaleChunkError(err) && !sessionStorage.getItem(CHUNK_RELOAD_FLAG)) {
        sessionStorage.setItem(CHUNK_RELOAD_FLAG, "1");
        window.location.reload();
        return new Promise(() => {
          /* hang until navigation — avoids throwing into Suspense before reload */
        }) as Promise<{ default: T }>;
      }
      throw err;
    }
  });
}
