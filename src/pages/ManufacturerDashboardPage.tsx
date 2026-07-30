import { useMemo } from "react";
import { ManufacturerDashboardView } from "@/components/manufacturer/ManufacturerDashboardView";
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
import { buildBrewBatchesFromOrders } from "@/lib/manufacturer-brew-batches";
import { buildDashboardRequests } from "@/lib/manufacturer-dashboard";
import { buildManufacturerShipments } from "@/lib/manufacturer-shipments";
import { ANALYTICS_SUMMARY } from "@/lib/manufacturer-analytics";
import { lowStockMaterials, RAW_MATERIALS } from "@/lib/manufacturer-raw-materials";
import { resolveManufacturerAssignmentIdentity } from "@/lib/npr-manufacturer-scope";
import { filterPosForManufacturerUser } from "@/lib/po-manufacturer-scope";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ManufacturerDashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { loading, data } = useAppData();
  const { purchaseOrders } = usePurchaseOrders();
  const { productionStatuses } = useProductionStatuses();
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

  const batches = useMemo(
    () => buildBrewBatchesFromOrders(scopedPos, scopedStatuses),
    [scopedPos, scopedStatuses],
  );
  const requests = useMemo(() => buildDashboardRequests(scopedPos), [scopedPos]);
  const shipments = useMemo(
    () =>
      buildManufacturerShipments(data.shipments ?? [], [...identity.labels]).slice(0, 3),
    [data.shipments, identity],
  );
  const lowStock = useMemo(() => lowStockMaterials(RAW_MATERIALS), []);

  const firstName = useMemo(() => {
    const name = user?.displayName?.trim() ?? "";
    return name ? name.split(/\s+/)[0] : "Partner";
  }, [user]);

  const actionNeeded = requests.filter((r) => r.tone === "red").length;
  const bottling = batches.filter((b) => b.filterCategory === "bottling");

  const summaryParts: string[] = [];
  if (actionNeeded > 0) {
    summaryParts.push(
      t("{{count}} production requests need scheduling", { count: actionNeeded }),
    );
  }
  if (bottling[0]) {
    summaryParts.push(t("Batch {{id}} is ready for bottling", { id: bottling[0].id }));
  }
  if (lowStock[0]) {
    summaryParts.push(t("{{name}} is below reorder point", { name: lowStock[0].name }));
  }
  if (summaryParts.length === 0) {
    summaryParts.push(t("No open production work right now"));
  }
  const summaryLine = `${summaryParts.join(". ")}.`;

  const shortage = lowStock[0];

  if (loading) {
    return <ManufacturerSkeleton />;
  }

  return (
    <ManufacturerDashboardView
      greeting={`${t("Ohayō")}, ${firstName}.`}
      summaryLine={summaryLine}
      shortageLabel={shortage ? `${t("Material shortage —")} ${shortage.name}.` : undefined}
      shortageDetail={
        shortage
          ? t("Only {{onHand}} on hand ({{pct}}% of reorder point). Reorder now to protect upcoming batches.", {
              onHand: shortage.onHand,
              pct: shortage.pct,
            })
          : undefined
      }
      activeBatches={batches.length}
      casesProducedQ2={ANALYTICS_SUMMARY.casesProducedQ2}
      casesDelta={ANALYTICS_SUMMARY.casesProducedSub}
      qualityPassRate={ANALYTICS_SUMMARY.qualityPassRate}
      qualitySub={ANALYTICS_SUMMARY.qualitySub}
      productionPremium={ANALYTICS_SUMMARY.productionPremium}
      premiumSub={ANALYTICS_SUMMARY.premiumSub}
      requests={requests}
      batches={batches.slice(0, 4)}
      shipments={shipments}
      onReorder={() => {
        logAudit("dashboard_reorder", shortage?.sku ?? "materials", {
          type: "inventory",
          id: shortage?.sku ?? "materials",
        });
      }}
    />
  );
}
