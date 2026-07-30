import { useMemo } from "react";
import { ManufacturerBrewBatchesView } from "@/components/manufacturer/ManufacturerBrewBatchesView";
import { ManufacturerSkeleton } from "@/components/skeletons";
import {
  useAccounts,
  useAppData,
  useProductionStatuses,
  usePurchaseOrders,
} from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { TEAM_ROSTER } from "@/data/team-roster";
import { BREW_STAGES, buildBrewBatchesFromOrders } from "@/lib/manufacturer-brew-batches";
import { resolveManufacturerAssignmentIdentity } from "@/lib/npr-manufacturer-scope";
import { filterPosForManufacturerUser } from "@/lib/po-manufacturer-scope";
import { toast } from "@/components/ui/sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ManufacturerBrewBatchesPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { purchaseOrders } = usePurchaseOrders();
  const { loading, data } = useAppData();
  const { accounts } = useAccounts();
  const { productionStatuses, addProductionStatus } = useProductionStatuses();
  const logAudit = useAuditLog();

  const teamMembers = data.teamMembers?.length ? data.teamMembers : TEAM_ROSTER;
  const identity = useMemo(
    () => resolveManufacturerAssignmentIdentity(user?.email, teamMembers, accounts),
    [user?.email, teamMembers, accounts],
  );
  const scopedPos = useMemo(
    () => filterPosForManufacturerUser(purchaseOrders, identity),
    [purchaseOrders, identity],
  );
  const scopedPoIds = useMemo(() => new Set(scopedPos.map((p) => p.id)), [scopedPos]);
  const scopedStatuses = useMemo(
    () => productionStatuses.filter((s) => scopedPoIds.has(s.poId)),
    [productionStatuses, scopedPoIds],
  );

  const batches = useMemo(
    () => buildBrewBatchesFromOrders(scopedPos, scopedStatuses),
    [scopedPos, scopedStatuses],
  );

  if (loading) {
    return <ManufacturerSkeleton />;
  }

  return (
    <ManufacturerBrewBatchesView
      batches={batches}
      onLogMeasurement={(batch) => {
        toast.success(t("Measurement logged"), {
          description: t("{{id}} · {{stage}} reading saved to batch record.", {
            id: batch.id,
            stage: BREW_STAGES[batch.stageIndex],
          }),
        });
        logAudit("brew_measurement", `Logged measurement for ${batch.id}`, {
          type: "purchase_order",
          id: batch.poId,
        });
      }}
      onAdvanceStage={(batch) => {
        const nextIndex = Math.min(batch.stageIndex + 1, BREW_STAGES.length - 1);
        const nextStage = BREW_STAGES[nextIndex];
        addProductionStatus({
          poId: batch.poId,
          stage: nextStage,
          updatedAt: new Date().toISOString().slice(0, 10),
          notes: `Advanced to ${nextStage} on brew floor`,
        });
        logAudit("brew_stage_advance", `${batch.id} → ${nextStage}`, {
          type: "purchase_order",
          id: batch.poId,
        });
        toast.success(t("Stage advanced"), {
          description: t("{{sku}} is now at {{stage}}.", { sku: batch.sku, stage: nextStage }),
        });
      }}
    />
  );
}
