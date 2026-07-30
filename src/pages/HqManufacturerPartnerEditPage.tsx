import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { HqManufacturerPartnerEditView } from "@/components/hq/HqManufacturerPartnerEditView";
import { getManufacturerProfile } from "@/lib/api-v1-mutations";
import { mapApiRowToProfile } from "@/lib/manufacturer-profile-map";
import {
  isLegacyKirinManufacturerRoute,
  manufacturerPartnerEditPath,
  resolveHqManufacturerPartnerId,
} from "@/lib/hq-manufacturer-partners";
import type { ManufacturerProfile } from "@/types/app-data";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HqManufacturerPartnerEditPage() {
  const { t } = useLanguage();
  const { manufacturerId = "" } = useParams<{ manufacturerId: string }>();
  const [profile, setProfile] = useState<ManufacturerProfile | null | undefined>(undefined);

  const loadProfile = useCallback(async () => {
    if (!manufacturerId || resolveHqManufacturerPartnerId(manufacturerId)) {
      setProfile(null);
      return;
    }
    try {
      const res = (await getManufacturerProfile(manufacturerId)) as { data?: Record<string, unknown> };
      setProfile(res.data ? mapApiRowToProfile(res.data) : null);
    } catch {
      setProfile(null);
    }
  }, [manufacturerId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (!manufacturerId) {
    return (
      <div className="p-6 text-[13px] text-muted-foreground">
        {t("Missing manufacturer id. Open a manufacturer partner from")}{" "}
        <Link to="/manufacturer/profiles" className="font-medium text-accent underline-offset-2 hover:underline">
          {t("Manufacturers")}
        </Link>
        .
      </div>
    );
  }

  const partnerId = resolveHqManufacturerPartnerId(manufacturerId);
  if (isLegacyKirinManufacturerRoute(manufacturerId) && !partnerId) {
    return <Navigate to="/manufacturer/profiles" replace />;
  }
  if (partnerId && partnerId !== manufacturerId) {
    return <Navigate to={manufacturerPartnerEditPath(partnerId)} replace />;
  }

  if (profile === undefined) {
    return <p className="p-6 text-sm text-muted-foreground">{t("Loading manufacturer…")}</p>;
  }

  return <HqManufacturerPartnerEditView manufacturerId={partnerId ?? manufacturerId} profile={profile} />;
}
