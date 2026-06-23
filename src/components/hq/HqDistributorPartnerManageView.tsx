import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDistributorOrganizations, type DistributorOrganizationRow } from "@/lib/api-v1-mutations";
import {
  buildDistributorPartnerDetail,
  partnerInitials,
  type DcInventoryRow,
} from "@/lib/hq-distributor-partner-detail";
import { mergeHqDistributorPartnerRows } from "@/lib/hq-distributors-metrics";
import { HQ_DISTRIBUTORS_DEMO_ROWS, mergeHqDistributorAccountsForDisplay, mergeHqDistributorInventoryForDisplay } from "@/lib/hq-distributors-demo";
import { filterPlatformAccountsForHq } from "@/lib/hq-order-scope";
import { mergeHqWholesaleOrdersForDisplay, mergeHqNetworkSalesForDisplay } from "@/lib/hq-orders-demo";
import { resolveDistributorOrgId } from "@/lib/hq-distributor-orgs";
import {
  HqBtnLink,
  HqOperatorCard,
  HqOperatorCardHead,
  HqOperatorDataTable,
  HqOperatorPage,
  HqOperatorPill,
  HqOperatorTwoCol,
} from "@/components/hq/HqOperatorUi";
import { cn } from "@/lib/utils";

type Props = {
  orgId: string;
  orgName?: string;
};

const coverColor = {
  low: "text-[hsl(0_68%_44%)]",
  med: "text-[hsl(38_90%_40%)]",
  ok: "text-[hsl(158_56%_32%)]",
};

function InventoryStatus({ row }: { row: DcInventoryRow }) {
  return (
    <span className={cn("text-[11px] font-semibold", coverColor[row.health])}>{row.healthLabel}</span>
  );
}

export function HqDistributorPartnerManageView({ orgId, orgName: orgNameProp }: Props) {
  const { data, loading } = useAppData();
  const { t } = useLanguage();
  const [orgs, setOrgs] = useState<DistributorOrganizationRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getDistributorOrganizations()
      .then((res) => {
        if (!cancelled) setOrgs(res.data ?? []);
      })
      .catch(() => {
        /* optional */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const displayContext = useMemo(() => {
    const mergedAccounts = mergeHqDistributorAccountsForDisplay(data.accounts);
    const network = mergeHqNetworkSalesForDisplay(
      data.salesOrders,
      mergedAccounts,
      data.teamMembers ?? [],
    );
    const wholesale = mergeHqWholesaleOrdersForDisplay(network.salesOrders, network.accounts);
    return { accounts: wholesale.accounts, orders: wholesale.orders };
  }, [data.accounts, data.salesOrders, data.teamMembers]);

  const orgName = useMemo(() => {
    if (orgNameProp) return orgNameProp;
    const org = orgs.find((o) => o.id === orgId);
    if (org) return org.name;
    const fromOrder = data.salesOrders.find((o) => o.distributorOrgId === orgId)?.distributorOrgName;
    const fromAccount = data.accounts.find((a) => a.distributorOrgId === orgId)?.distributorOrgName;
    return fromOrder || fromAccount || "Wholesaler partner";
  }, [orgId, orgNameProp, orgs, data]);

  const metricsRow = useMemo(() => {
    const demo = HQ_DISTRIBUTORS_DEMO_ROWS.find((r) => r.orgId === orgId);
    if (demo) return demo;

    const distributors = filterPlatformAccountsForHq(displayContext.accounts).filter(
      (a) => a.type === "distributor",
    );
    const orgIdByAccountId = new Map<string, string>();
    for (const acc of distributors) {
      const id = resolveDistributorOrgId(acc, orgs);
      if (id) orgIdByAccountId.set(acc.id, id);
    }
    const rows = mergeHqDistributorPartnerRows(
      distributors,
      displayContext.accounts,
      displayContext.orders,
      data.shipments,
      orgIdByAccountId,
    );
    return rows.find((r) => r.orgId === orgId || r.id === orgId);
  }, [displayContext, data.shipments, orgs, orgId]);

  const detail = useMemo(
    () =>
      buildDistributorPartnerDetail(
        orgId,
        orgName,
        displayContext.accounts,
        displayContext.orders,
        mergeHqDistributorInventoryForDisplay(data.inventory),
        data.products,
        {
          fillRate: metricsRow?.fillRate ?? 97.5,
          onTime: metricsRow?.onTime ?? 96.2,
          accountCount: metricsRow?.accountCount ?? 0,
        },
      ),
    [orgId, orgName, displayContext, data.inventory, data.products, metricsRow],
  );

  const salesHref = `/accounts?view=sales&org=${encodeURIComponent(orgId)}`;
  const replenHref = "/orders?view=replenishment";

  return (
    <HqOperatorPage className="space-y-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <Link
          to="/accounts"
          className="hq-btn hq-btn-outline hq-btn-sm inline-flex items-center gap-1.5 no-underline"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          {t("Distributors")}
        </Link>
        <span className="text-xs text-muted-foreground">/ {detail.name}</span>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("Loading partner…")}</p>
      ) : (
        <>
          <HqOperatorCard className="overflow-hidden">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-[18px] sm:p-6">
              <div className="flex size-[60px] shrink-0 items-center justify-center rounded-[14px] bg-[hsl(158_56%_36%/0.1)] font-display text-[22px] font-semibold text-[hsl(158_56%_30%)]">
                {partnerInitials(detail.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-display text-2xl font-semibold tracking-[-0.02em]">{detail.name}</h1>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                      detail.tierIsGold
                        ? "border-[hsl(40_88%_42%/0.25)] bg-[hsl(40_88%_42%/0.1)] text-[hsl(40_88%_34%)]"
                        : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {detail.tier}
                  </span>
                  <HqOperatorPill tone={detail.statusTone}>{detail.statusLabel}</HqOperatorPill>
                </div>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {detail.marketLine} · {detail.shipLine}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {detail.contactLine} · {detail.email} · {detail.phone}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <HqBtnLink to={salesHref} variant="outline" size="sm">
                  {t("View sales")}
                </HqBtnLink>
                <HqBtnLink to={replenHref} variant="accent" size="sm">
                  {t("Replenishment")}
                </HqBtnLink>
              </div>
            </div>

            <div className="grid grid-cols-2 border-t border-border/50 sm:grid-cols-3 lg:grid-cols-6">
              {[
                [t("Fill rate"), `${detail.fillRate.toFixed(1)}%`],
                [t("On-time"), `${detail.onTime.toFixed(1)}%`],
                [t("Accounts"), String(detail.accountCount)],
                [t("Partner since"), detail.partnerSince],
                [t("Terms"), detail.terms],
                [t("Rebate"), detail.rebate],
              ].map(([label, value], i, arr) => (
                <div
                  key={String(label)}
                  className={cn(
                    "px-[18px] py-3.5",
                    i < arr.length - 1 && "border-b border-border/40 sm:border-b-0 sm:border-r",
                  )}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {label}
                  </div>
                  <div className="mt-0.5 font-display text-base font-semibold">{value}</div>
                </div>
              ))}
            </div>
          </HqOperatorCard>

          <HqOperatorTwoCol className="mb-0">
            <HqOperatorCard className="overflow-hidden p-0">
              <div className="px-5 pt-5">
                <HqOperatorCardHead
                  title="DC inventory"
                  subtitle={`${detail.dcInventory.length} SKUs · stock held at this distributor`}
                />
              </div>
              {detail.dcInventory.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                  {t("No DC inventory synced for this partner yet.")}
                </div>
              ) : (
                <HqOperatorDataTable>
                  <thead>
                    <tr>
                      <th>{t("SKU")}</th>
                      <th>{t("On hand")}</th>
                      <th>{t("Allocated")}</th>
                      <th>{t("Cover")}</th>
                      <th>{t("Status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.dcInventory.map((row) => (
                      <tr key={row.sku}>
                        <td className="font-medium">{row.name}</td>
                        <td className="font-mono">{row.onHandCases} cs</td>
                        <td className="font-mono text-muted-foreground">{row.allocatedCases} cs</td>
                        <td className={cn("font-mono", coverColor[row.health])}>{row.coverLabel}</td>
                        <td>
                          <InventoryStatus row={row} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </HqOperatorDataTable>
              )}
            </HqOperatorCard>

            <HqOperatorCard className="flex flex-col overflow-hidden p-0">
              <div className="px-5 pt-5">
                <HqOperatorCardHead
                  title="Replenishment orders"
                  subtitle="Pallet orders from this distributor"
                />
              </div>
              {detail.replenishments.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                  {t("No replenishment orders on file.")}
                </div>
              ) : (
                <HqOperatorDataTable>
                  <thead>
                    <tr>
                      <th>{t("Order")}</th>
                      <th>{t("Items")}</th>
                      <th>{t("Status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.replenishments.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <div className="font-mono text-xs font-medium">{row.id}</div>
                          <div className="text-[11px] text-muted-foreground">{row.date}</div>
                        </td>
                        <td className="text-xs text-muted-foreground">{row.items}</td>
                        <td>
                          <HqOperatorPill tone={row.statusTone}>{row.statusLabel}</HqOperatorPill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </HqOperatorDataTable>
              )}
              <div className="mt-auto border-t border-border/50 px-5 py-3.5">
                <HqBtnLink to={replenHref} variant="outline" size="sm" className="w-full justify-center">
                  {t("View all replenishment orders")}
                </HqBtnLink>
              </div>
            </HqOperatorCard>
          </HqOperatorTwoCol>
        </>
      )}
    </HqOperatorPage>
  );
}
