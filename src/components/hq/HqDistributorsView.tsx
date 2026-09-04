import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDistributorOrganizations, type DistributorOrganizationRow } from "@/lib/api-v1-mutations";
import { buildDistributorPartnerRows, mergeHqDistributorPartnerRows } from "@/lib/hq-distributors-metrics";
import { manageOrgIdForRow, mergeHqDistributorAccountsForDisplay } from "@/lib/hq-distributors-demo";
import { filterPlatformAccountsForHq } from "@/lib/hq-order-scope";
import { mergeHqWholesaleOrdersForDisplay, mergeHqNetworkSalesForDisplay } from "@/lib/hq-orders-demo";
import { partnerPathForOrg, resolveDistributorOrgId } from "@/lib/hq-distributor-orgs";
import {
  HqBtnLink,
  HqOperatorCard,
  HqOperatorDataTable,
  HqOperatorPage,
  HqOperatorPageHeader,
  HqOperatorPill,
} from "@/components/hq/HqOperatorUi";
import { Button } from "@/components/ui/button";
import { SendTradePackDialog } from "@/components/SendTradePackDialog";
import { cn } from "@/lib/utils";

export function HqDistributorsView() {
  const { t } = useLanguage();
  const { data, loading } = useAppData();
  const [distributorOrgs, setDistributorOrgs] = useState<DistributorOrganizationRow[]>([]);
  const [packOpen, setPackOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getDistributorOrganizations()
      .then((res) => {
        if (!cancelled) setDistributorOrgs(res.data ?? []);
      })
      .catch(() => {
        /* optional */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const displayAccounts = useMemo(() => {
    const platform = mergeHqDistributorAccountsForDisplay(data.accounts);
    return mergeHqNetworkSalesForDisplay(data.salesOrders, platform, data.teamMembers ?? []).accounts;
  }, [data.accounts, data.salesOrders, data.teamMembers]);

  const displayOrders = useMemo(() => {
    const merged = mergeHqWholesaleOrdersForDisplay(data.salesOrders, displayAccounts);
    return merged.orders;
  }, [data.salesOrders, displayAccounts]);

  const distributors = useMemo(
    () => filterPlatformAccountsForHq(displayAccounts).filter((a) => a.type === "distributor"),
    [displayAccounts],
  );

  const orgIdByAccountId = useMemo(() => {
    const m = new Map<string, string>();
    for (const acc of distributors) {
      const orgId = resolveDistributorOrgId(acc, distributorOrgs);
      if (orgId) m.set(acc.id, orgId);
    }
    return m;
  }, [distributors, distributorOrgs]);

  const rows = useMemo(
    () =>
      mergeHqDistributorPartnerRows(
        distributors,
        displayAccounts,
        displayOrders,
        data.shipments,
        orgIdByAccountId,
      ),
    [distributors, displayAccounts, displayOrders, data.shipments, orgIdByAccountId],
  );

  return (
    <HqOperatorPage className="space-y-6">
      <HqOperatorPageHeader
        title="Distributors"
        description="Distribution partners by market · monitor fill rate, on-time delivery, and partner tier"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setPackOpen(true)}>
              Send trade pack
            </Button>
            <HqBtnLink to="/accounts/add" variant="accent" size="sm">
              <Plus className="size-3.5" strokeWidth={1.75} />
              {t("Add distributor")}
            </HqBtnLink>
          </div>
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("Loading distributors…")}</p>
      ) : (
        <HqOperatorCard className="overflow-hidden p-0">
          <HqOperatorDataTable>
            <thead>
              <tr>
                <th>{t("Distributor")}</th>
                <th>{t("Market")}</th>
                <th>{t("Tier")}</th>
                <th>{t("Fill rate")}</th>
                <th>{t("On-time")}</th>
                <th>{t("Accounts")}</th>
                <th>{t("Status")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="font-medium">{row.name}</td>
                  <td className="text-muted-foreground">{row.marketLine}</td>
                  <td>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        row.tierIsGold ? "text-[hsl(40_88%_34%)]" : "text-muted-foreground",
                      )}
                    >
                      {row.tier}
                    </span>
                  </td>
                  <td className="font-mono font-semibold text-[hsl(158_56%_32%)]">{row.fillRate.toFixed(1)}%</td>
                  <td
                    className={cn(
                      "font-mono font-semibold",
                      row.onTime < 94 ? "text-[hsl(38_90%_40%)]" : "text-[hsl(158_56%_32%)]",
                    )}
                  >
                    {row.onTime.toFixed(1)}%
                  </td>
                  <td className="font-mono">{row.accountCount}</td>
                  <td>
                    <HqOperatorPill tone={row.statusTone}>{row.statusLabel}</HqOperatorPill>
                  </td>
                  <td className="text-right">
                    <HqBtnLink to={partnerPathForOrg(manageOrgIdForRow(row))} variant="outline" size="sm">
                      {t("Manage")}
                    </HqBtnLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </HqOperatorDataTable>
        </HqOperatorCard>
      )}

      {rows.length > 0 ? (
        <p className="text-center text-xs text-muted-foreground">
          {t("Open")}{" "}
          <Link to="/accounts?view=sales" className="font-medium text-accent underline-offset-2 hover:underline">
            {t("Distributor sales")}
          </Link>{" "}
          {t("for downstream rep and retail performance.")}
        </p>
      ) : null}

      <SendTradePackDialog open={packOpen} onOpenChange={setPackOpen} includeTerms />
    </HqOperatorPage>
  );
}
