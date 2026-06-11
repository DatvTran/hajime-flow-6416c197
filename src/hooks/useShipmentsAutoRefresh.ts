import { useCallback, useEffect } from "react";

/** Default for HQ / manufacturer / distributor operational views. */
export const PORTAL_REFRESH_INTERVAL_MS = 45_000;

/** Faster poll for retail + sales rep so distributor pick & pack updates appear promptly. */
export const FULFILLMENT_PIPELINE_REFRESH_MS = 20_000;

type AutoRefreshOptions = {
  intervalMs?: number;
};

/**
 * Refetches portal data on an interval while the tab is visible, on mount, and when the tab regains focus.
 */
export function useShipmentsAutoRefresh(
  refetch: () => Promise<void>,
  enabled: boolean,
  options?: AutoRefreshOptions,
): void {
  const intervalMs = options?.intervalMs ?? PORTAL_REFRESH_INTERVAL_MS;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const tick = () => {
      if (cancelled || document.visibilityState !== "visible") return;
      void refetch();
    };

    tick();

    const id = window.setInterval(tick, intervalMs);

    const onVisibility = () => {
      if (document.visibilityState === "visible") void refetch();
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refetch, enabled, intervalMs]);
}

/** Poll orders + shipments for roles that track distributor fulfillment (retail, sales rep). */
export function useFulfillmentPipelineAutoRefresh(
  refreshShipments: () => Promise<void>,
  refreshSalesOrders: () => Promise<void>,
  enabled: boolean,
): void {
  const refetch = useCallback(
    () => Promise.all([refreshShipments(), refreshSalesOrders()]),
    [refreshShipments, refreshSalesOrders],
  );
  useShipmentsAutoRefresh(refetch, enabled, { intervalMs: FULFILLMENT_PIPELINE_REFRESH_MS });
}
