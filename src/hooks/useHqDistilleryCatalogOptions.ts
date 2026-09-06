import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useAppData, usePurchaseOrders } from "@/contexts/AppDataContext";
import { getManufacturerProfiles } from "@/lib/api-v1-mutations";
import { mapApiRowToProfile } from "@/lib/manufacturer-profile-map";
import type { ManufacturerProfile } from "@/types/app-data";
import { buildHqManufacturerListRows } from "@/lib/hq-manufacturers-metrics";
import {
  getHiddenManufacturersSnapshot,
  getPartnerConfigsSnapshot,
  hydratePartnerConfigsFromProfiles,
  subscribeHiddenManufacturers,
  subscribePartnerConfigs,
} from "@/lib/hq-manufacturer-partners";

export type CatalogDistilleryOption = { id: string; name: string };

/** Same Distilleries network list as `/manufacturer/profiles`. */
export function useHqDistilleryCatalogOptions(): CatalogDistilleryOption[] {
  const { data } = useAppData();
  const { purchaseOrders } = usePurchaseOrders();
  const hiddenKey = useSyncExternalStore(
    subscribeHiddenManufacturers,
    getHiddenManufacturersSnapshot,
    getHiddenManufacturersSnapshot,
  );
  const partnerKey = useSyncExternalStore(
    subscribePartnerConfigs,
    getPartnerConfigsSnapshot,
    getPartnerConfigsSnapshot,
  );
  const [profiles, setProfiles] = useState<ManufacturerProfile[]>([]);

  const load = useCallback(async () => {
    try {
      const res = (await getManufacturerProfiles()) as { data?: Record<string, unknown>[] };
      const rows = Array.isArray(res.data) ? res.data : [];
      const mapped = rows.map((r) => mapApiRowToProfile(r));
      hydratePartnerConfigsFromProfiles(mapped);
      setProfiles(mapped);
    } catch {
      setProfiles([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, data.accounts, partnerKey]);

  return useMemo(() => {
    const { rows } = buildHqManufacturerListRows(data.accounts ?? [], purchaseOrders, profiles);
    void hiddenKey;
    return rows.map((r) => ({ id: r.id, name: r.name }));
  }, [data.accounts, purchaseOrders, profiles, hiddenKey, partnerKey]);
}
