import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePurchaseOrders } from "@/contexts/AppDataContext";
import { getManufacturerProfiles } from "@/lib/api-v1-mutations";
import { mapApiRowToProfile } from "@/lib/manufacturer-profile-map";
import { mergeHqManufacturerPurchaseOrdersForDisplay } from "@/lib/hq-manufacturers-demo";
import { isHqManufacturerPartnerId, loadHqManufacturerPartner } from "@/lib/hq-manufacturer-partners";
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
      setProfiles(rows.map((r) => mapApiRowToProfile(r)));
    } catch {
      setProfiles([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const profile = useMemo(
    () =>
      profiles.find(
        (p) =>
          p.id === manufacturerId ||
          p.manufacturerId === manufacturerId ||
          (p.companyName || "").toLowerCase().replace(/\s+/g, "-") === manufacturerId.toLowerCase(),
      ) ?? null,
    [profiles, manufacturerId],
  );

  const orgName = useMemo(() => {
    if (isHqManufacturerPartnerId(manufacturerId)) {
      return loadHqManufacturerPartner(manufacturerId).name;
    }
    return profile?.companyName;
  }, [manufacturerId, profile]);

  if (!manufacturerId) {
    return (
      <div className="p-6 text-[13px] text-muted-foreground">
        Missing manufacturer id. Open a kura from{" "}
        <Link to="/manufacturer/profiles" className="font-medium text-accent underline-offset-2 hover:underline">
          Manufacturers
        </Link>
        .
      </div>
    );
  }

  return (
    <HqManufacturerPartnerManageView
      manufacturerId={manufacturerId}
      purchaseOrders={displayOrders}
      profile={profile}
      orgName={orgName}
    />
  );
}
