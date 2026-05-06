import { useEffect } from "react";

const INTERVAL_MS = 45_000;

/**
 * Refetches shipments on a modest interval while the tab is visible, and when the tab regains focus.
 * Keeps manufacturer and HQ views aligned without manual refresh.
 */
export function useShipmentsAutoRefresh(refetch: () => Promise<void>, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const tick = () => {
      if (cancelled || document.visibilityState !== "visible") return;
      void refetch();
    };

    const id = window.setInterval(tick, INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") void refetch();
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refetch, enabled]);
}
