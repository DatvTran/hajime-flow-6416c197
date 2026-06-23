import type { Account, SalesOrder, Shipment } from "@/data/mockData";
import { filterRowsForOrg } from "@/lib/hq-order-scope";
import { HQ_DISTRIBUTORS_DEMO_ROWS, isHqDistributorDemoOrgId } from "@/lib/hq-distributors-demo";
import { networkRetailCountForOrg } from "@/lib/hq-distributor-network-demo";

const ON_PREMISE = new Set(["retail", "bar", "restaurant", "hotel", "lifestyle"]);

export type DistributorPartnerRow = {
  id: string;
  orgId?: string;
  name: string;
  marketLine: string;
  tier: string;
  tierIsGold: boolean;
  fillRate: number;
  onTime: number;
  accountCount: number;
  statusTone: "green" | "amber" | "red" | "neutral";
  statusLabel: string;
  account: Account;
};

function inferTier(account: Account): { tier: string; isGold: boolean } {
  const tags = (account.tags ?? []).map((t) => t.toLowerCase());
  if (tags.some((t) => t.includes("gold") || t.includes("platinum"))) {
    return { tier: "Gold Partner", isGold: true };
  }
  if (tags.some((t) => t.includes("silver"))) {
    return { tier: "Silver Partner", isGold: false };
  }
  if (account.pricingTier === "key" || account.pricingTier === "premium") {
    return { tier: "Gold Partner", isGold: true };
  }
  return { tier: "Silver Partner", isGold: false };
}

function partnerOrders(
  dist: Account,
  orgId: string | undefined,
  orders: SalesOrder[],
): SalesOrder[] {
  const label = (dist.tradingName || dist.legalName || "").trim().toLowerCase();
  return orders.filter((o) => {
    if (o.status === "cancelled" || o.status === "draft") return false;
    if (orgId && String(o.distributorOrgId ?? "") === String(orgId)) return true;
    if (!orgId && !o.distributorOrgId) {
      const acct = (o.account || "").trim().toLowerCase();
      return acct === label;
    }
    return false;
  });
}

function computeFillAndOnTime(orders: SalesOrder[], shipments: Shipment[]): { fill: number; onTime: number } {
  const fulfillable = orders.filter((o) => o.status !== "cancelled" && o.status !== "draft");
  const fulfilled = fulfillable.filter((o) => o.status === "shipped" || o.status === "delivered");
  const fill =
    fulfillable.length > 0
      ? Math.min(100, Math.round((fulfilled.length / fulfillable.length) * 1000) / 10)
      : 97.5;

  const relatedShipments = shipments.filter((s) => s.type === "outbound" || s.orderType === "sales_order");
  const delayed = relatedShipments.filter((s) => s.status === "delayed").length;
  const onTime =
    relatedShipments.length > 0
      ? Math.min(
          100,
          Math.round(((relatedShipments.length - delayed) / relatedShipments.length) * 1000) / 10,
        )
      : fill >= 96 ? 96.2 : 92.0;

  return { fill, onTime };
}

function statusForPartner(fill: number, onTime: number, account: Account): { tone: DistributorPartnerRow["statusTone"]; label: string } {
  if (account.status === "inactive") return { tone: "neutral", label: "inactive" };
  if (fill < 94 || onTime < 92) return { tone: "amber", label: "monitor" };
  if (fill >= 97 && onTime >= 94) return { tone: "green", label: "active" };
  if (account.status === "prospect") return { tone: "neutral", label: "planned" };
  return { tone: "green", label: "active" };
}

export function buildDistributorPartnerRows(
  distributors: Account[],
  accounts: Account[],
  orders: SalesOrder[],
  shipments: Shipment[],
  orgIdByAccountId: Map<string, string>,
): DistributorPartnerRow[] {
  if (distributors.length === 0) {
    return HQ_DISTRIBUTORS_DEMO_ROWS;
  }

  const rows = distributors.map((dist) => {
    const orgId = orgIdByAccountId.get(dist.id);
    const partnerOrdersList = partnerOrders(dist, orgId, orders);
    const { fill, onTime } = computeFillAndOnTime(partnerOrdersList, shipments);

    let accountCount = 0;
    if (orgId) {
      accountCount = filterRowsForOrg(accounts, orgId).filter((a) => ON_PREMISE.has(String(a.type))).length;
      if (accountCount === 0 && isHqDistributorDemoOrgId(orgId)) {
        accountCount = networkRetailCountForOrg(orgId);
      }
    } else {
      accountCount = accounts.filter(
        (a) =>
          ON_PREMISE.has(String(a.type)) &&
          !a.distributorOrgId &&
          (a.salesOwner === dist.salesOwner ||
            String(a.managedByDistributorUserId ?? "") === String(dist.managedByDistributorUserId ?? "")),
      ).length;
    }

    const { tier, isGold } = inferTier(dist);
    const { tone, label } = statusForPartner(fill, onTime, dist);
    const contact = dist.salesOwner || dist.contactName || "—";

    return {
      id: dist.id,
      orgId,
      name: dist.tradingName || dist.legalName,
      marketLine: `${dist.city || "—"} · ${contact}`,
      tier,
      tierIsGold: isGold,
      fillRate: fill,
      onTime,
      accountCount: accountCount || Math.max(1, Math.round(partnerOrdersList.length / 2)),
      statusTone: tone,
      statusLabel: label,
      account: dist,
    };
  });

  return rows.length > 0 ? rows : HQ_DISTRIBUTORS_DEMO_ROWS;
}

function rowKey(row: DistributorPartnerRow): string {
  return (row.orgId || row.id || row.name).trim().toLowerCase();
}

/** Live partner rows supplemented with design-system demo partners when data is sparse. */
export function mergeHqDistributorPartnerRows(
  distributors: Account[],
  accounts: Account[],
  orders: SalesOrder[],
  shipments: Shipment[],
  orgIdByAccountId: Map<string, string>,
): DistributorPartnerRow[] {
  const live = buildDistributorPartnerRows(distributors, accounts, orders, shipments, orgIdByAccountId);
  if (live.length >= 4) return live;

  const seen = new Set(live.map(rowKey));
  const extras = HQ_DISTRIBUTORS_DEMO_ROWS.filter((demo) => !seen.has(rowKey(demo)));
  return extras.length > 0 ? [...live, ...extras] : live;
}
