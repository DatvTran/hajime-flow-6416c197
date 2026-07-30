import { useCallback, useEffect, useRef, useState } from "react";
import { useAccounts, useNewProductRequests } from "@/contexts/AppDataContext";
import { getManufacturerProfiles } from "@/lib/api-v1-mutations";
import { mapApiRowToProfile } from "@/lib/manufacturer-profile-map";
import type { ManufacturerProfile } from "@/types/app-data";
import {
  buildExistingManufacturerIndex,
  findOrphanedNprs,
} from "@/lib/npr-manufacturer-reconcile";
import { HqProductDevelopmentView } from "@/components/hq/HqProductDevelopmentView";

export default function ProductDevelopmentPage() {
  const {
    newProductRequests,
    patchNewProductRequest,
    nudgeNewProductRequest,
    fetchRequests,
    removeNewProductRequests,
  } = useNewProductRequests();
  const { accounts } = useAccounts();

  const [profiles, setProfiles] = useState<ManufacturerProfile[]>([]);
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const reconcilingRef = useRef(false);

  const loadProfiles = useCallback(async () => {
    try {
      const res = (await getManufacturerProfiles()) as { data?: Record<string, unknown>[] };
      const rows = Array.isArray(res.data) ? res.data : [];
      setProfiles(rows.map((r) => mapApiRowToProfile(r)));
    } catch {
      setProfiles([]);
    } finally {
      setProfilesLoaded(true);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
    void loadProfiles();
  }, [fetchRequests, loadProfiles]);

  useEffect(() => {
    const onFocus = () => {
      void fetchRequests();
      void loadProfiles();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchRequests, loadProfiles]);

  // Align product development with existing manufacturers: delete requests whose
  // assigned manufacturer no longer exists. Gated on profiles being loaded to
  // avoid deleting requests for manufacturers that only exist as a profile.
  useEffect(() => {
    if (!profilesLoaded || reconcilingRef.current) return;
    if (newProductRequests.length === 0) return;

    const index = buildExistingManufacturerIndex(accounts, profiles);
    const orphaned = findOrphanedNprs(newProductRequests, index);
    if (orphaned.length === 0) return;

    reconcilingRef.current = true;
    void removeNewProductRequests(orphaned.map((n) => n.id)).finally(() => {
      reconcilingRef.current = false;
    });
  }, [profilesLoaded, newProductRequests, accounts, profiles, removeNewProductRequests]);

  return (
    <HqProductDevelopmentView
      newProductRequests={newProductRequests}
      onPatch={patchNewProductRequest}
      onNudge={nudgeNewProductRequest}
    />
  );
}
