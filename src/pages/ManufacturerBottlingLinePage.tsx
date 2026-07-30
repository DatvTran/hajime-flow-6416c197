import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ManufacturerBottlingLineView } from "@/components/manufacturer/ManufacturerBottlingLineView";
import { ManufacturerSkeleton } from "@/components/skeletons";
import {
  useAccounts,
  useProductionStatuses,
  usePurchaseOrders,
  useProducts,
  useManufacturerFinishedGoods,
  useAppData,
} from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { TEAM_ROSTER } from "@/data/team-roster";
import { buildBottlingLineModel, type BottlingCheckStep } from "@/lib/manufacturer-bottling-line";
import { lotForPo } from "@/lib/manufacturer-finished-goods";
import { resolveManufacturerAssignmentIdentity } from "@/lib/npr-manufacturer-scope";
import { filterPosForManufacturerUser } from "@/lib/po-manufacturer-scope";
import { toast } from "@/components/ui/sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ManufacturerBottlingLinePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { purchaseOrders, patchPurchaseOrder } = usePurchaseOrders();
  const { productionStatuses, addProductionStatus } = useProductionStatuses();
  const { products } = useProducts();
  const { receiveFinishedGoods } = useManufacturerFinishedGoods();
  const { loading, data } = useAppData();
  const { accounts } = useAccounts();
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

  const model = useMemo(
    () => buildBottlingLineModel(scopedPos, scopedStatuses),
    [scopedPos, scopedStatuses],
  );

  const [steps, setSteps] = useState<BottlingCheckStep[]>([]);

  useEffect(() => {
    setSteps(model.activeRun?.steps ?? []);
  }, [model.activeRun]);

  const toggleStep = (id: string) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));
  };

  if (loading) {
    return <ManufacturerSkeleton />;
  }

  return (
    <ManufacturerBottlingLineView
      model={model}
      steps={steps}
      onToggleStep={toggleStep}
      onMarkComplete={() => {
        const run = model.activeRun;
        if (!run) return;
        const today = new Date().toISOString().slice(0, 10);
        const product = products.find((p) => p.sku === run.sku);
        const name = product ? `${product.name} ${product.size}`.trim() : run.sku;

        receiveFinishedGoods({
          sku: run.sku,
          name,
          cases: run.cases,
          lot: lotForPo(run.poId),
          poId: run.poId,
        });
        addProductionStatus({
          poId: run.poId,
          stage: "Bottled",
          updatedAt: today,
          notes: `Bottling run ${run.batchId} complete on ${run.line} · ${run.cases} cs to finished goods`,
        });
        void patchPurchaseOrder(run.poId, { status: "completed" });
        logAudit("bottling_run_complete", run.batchId, {
          type: "purchase_order",
          id: run.poId,
        });
        toast.success(t("Run complete"), {
          description: t("{{cases}} cs {{sku}} received into finished goods.", {
            cases: run.cases,
            sku: run.sku,
          }),
        });
        navigate("/manufacturer/finished-goods");
      }}
      onScheduleRun={() => navigate("/manufacturer/purchase-orders")}
      onPrepRun={(batchId) => {
        toast.success(t("Prep started"), {
          description: t("Batch {{id}} staged for line changeover.", { id: batchId }),
        });
      }}
    />
  );
}
