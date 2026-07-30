import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { usePurchaseOrders } from "@/contexts/AppDataContext";
import { getManufacturerProfiles } from "@/lib/api-v1-mutations";
import { mapApiRowToProfile } from "@/lib/manufacturer-profile-map";
import { mergeHqManufacturerPurchaseOrdersForDisplay } from "@/lib/hq-manufacturers-demo";
import {
  isLegacyKirinManufacturerRoute,
  resolveHqManufacturerPartnerId,
  loadHqManufacturerPartner,
  hydratePartnerConfigsFromProfiles,
} from "@/lib/hq-manufacturer-partners";
import { manufacturerPartnerPath } from "@/lib/hq-manufacturers-metrics";
import type { ManufacturerProfile } from "@/types/app-data";
import { HqManufacturerPartnerManageView } from "@/components/hq/HqManufacturerPartnerManageView";

export default function HqManufacturerPartnerPage() {
  const { manufacturerId = "" } = useParams<{ manufacturerId: string }>();
  const { purchaseOrders } = usePurchaseOrders();
  const [profiles, setProfiles] = useState<ManufacturerProfile[]>([]);

  const displayOrders = useMemo(
    () => mergeHqManufacturerPurchaseOrdersForDisplay(purchaseOrders),
    [purchaseOrders],
  );

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
  }, [load]);

  const partnerId = useMemo(() => resolveHqManufacturerPartnerId(manufacturerId), [manufacturerId]);

  const profile = useMemo(
    () =>
      profiles.find(
        (p) =>
          p.id === manufacturerId ||
          p.manufacturerId === manufacturerId ||
          (partnerId != null && p.manufacturerId === partnerId) ||
          (p.companyName || "").toLowerCase().replace(/\s+/g, "-") === manufacturerId.toLowerCase(),
      ) ?? null,
    [profiles, manufacturerId, partnerId],
  );

  const orgName = useMemo(() => {
    if (partnerId) return loadHqManufacturerPartner(partnerId).name;
    return profile?.companyName;
  }, [partnerId, profile]);

  if (!manufacturerId) {
    return (
      <div className="p-6 text-[13px] text-muted-foreground">
        Missing manufacturer id. Open a manufacturer partner from{" "}
        <Link to="/manufacturer/profiles" className="font-medium text-accent underline-offset-2 hover:underline">
          Manufacturers
        </Link>
        .
      </div>
    );
  }

  if (isLegacyKirinManufacturerRoute(manufacturerId) && !partnerId) {
    return <Navigate to="/manufacturer/profiles" replace />;
  }

  if (partnerId && partnerId !== manufacturerId) {
    return <Navigate to={manufacturerPartnerPath(partnerId)} replace />;
  }

  return (
    <HqManufacturerPartnerManageView
      manufacturerId={partnerId ?? manufacturerId}
      purchaseOrders={displayOrders}
      profile={profile}
      orgName={orgName}
    />
  );
}
