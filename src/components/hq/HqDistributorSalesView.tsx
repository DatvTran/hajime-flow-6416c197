import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, ShoppingCart, Store, Truck, Users } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDistributorOrganizations, type DistributorOrganizationRow } from "@/lib/api-v1-mutations";
import { computeDistributorSalesSnapshot } from "@/lib/hq-distributor-sales-metrics";
import { mergeHqNetworkSalesForDisplay } from "@/lib/hq-orders-demo";
import { HQ_DISTRIBUTOR_DEMO_ORGANIZATIONS } from "@/lib/hq-distributors-demo";
import { partnerPathForOrg, resolveDistributorOrgId } from "@/lib/hq-distributor-orgs";
import {
  HqBtn,
  HqOperatorCard,
  HqOperatorCardHead,
  HqOperatorDataTable,
  HqOperatorFilterBar,
  HqOperatorFilterButton,
  HqOperatorKpiCard,
  HqOperatorKpiGrid,
  HqOperatorPage,
  HqOperatorPageHeader,
  HqOperatorPill,
  HqOperatorTwoCol,
} from "@/components/hq/HqOperatorUi";
import { toast } from "@/components/ui/sonner";

type OrgOption = { id: string; name: string };

type Props = {
  /** When set, locks to one wholesaler (partner detail page). */
  fixedOrgId?: string;
  fixedOrgName?: string;
  showBackLink?: boolean;
};

export function HqDistributorSalesView({ fixedOrgId, fixedOrgName, showBackLink }: Props) {
  const { data, loading } = useAppData();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const orgFromUrl = searchParams.get("org") ?? undefined;
  const [orgs, setOrgs] = useState<DistributorOrganizationRow[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState(fixedOrgId ?? orgFromUrl ?? "");

  useEffect(() => {
    let cancelled = false;
    void getDistributorOrganizations()
      .then((res) => {
        if (!cancelled) setOrgs(res.data ?? []);
      })
      .catch(() => {
        /* optional API */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const networkData = useMemo(
    () =>
      mergeHqNetworkSalesForDisplay(
        data.salesOrders,
        data.accounts,
        data.teamMembers ?? [],
      ),
    [data.salesOrders, data.accounts, data.teamMembers],
  );

  const orgOptions = useMemo((): OrgOption[] => {
    const map = new Map<string, string>();
    for (const org of [...orgs, ...HQ_DISTRIBUTOR_DEMO_ORGANIZATIONS]) {
      map.set(org.id, org.name);
    }
    for (const acc of networkData.accounts) {
      if (acc.type !== "distributor") continue;
      const id = resolveDistributorOrgId(acc, orgs);
      if (id && !map.has(id)) {
        map.set(id, acc.tradingName || acc.legalName || acc.name || id);
      }
    }
    for (const o of networkData.salesOrders) {
      if (!o.distributorOrgId) continue;
      if (!map.has(o.distributorOrgId)) {
        map.set(o.distributorOrgId, o.distributorOrgName || o.distributorOrgId);
      }
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [orgs, networkData.accounts, networkData.salesOrders]);

  useEffect(() => {
    if (fixedOrgId) {
      setSelectedOrgId(fixedOrgId);
      return;
    }
    if (orgFromUrl) {
      setSelectedOrgId(orgFromUrl);
      return;
    }
    if (!selectedOrgId && orgOptions.length > 0) {
      setSelectedOrgId(orgOptions[0].id);
    }
  }, [fixedOrgId, orgFromUrl, orgOptions, selectedOrgId]);

  const activeOrgId = fixedOrgId ?? selectedOrgId;
  const activeOrgName =
    fixedOrgName ??
    orgOptions.find((o) => o.id === activeOrgId)?.name ??
    networkData.salesOrders.find((o) => o.distributorOrgId === activeOrgId)?.distributorOrgName ??
    "Distributor";

  const snapshot = useMemo(() => {
    if (!activeOrgId) {
      return {
        market: "—",
        q2Revenue: "$0",
        q2RevenueRaw: 0,
        casesMoved: 0,
        reps: [],
        retail: [],
      };
    }
    return computeDistributorSalesSnapshot(
      activeOrgId,
      networkData.salesOrders,
      networkData.accounts,
      networkData.teamMembers,
    );
  }, [activeOrgId, networkData]);

  const activeRetail = snapshot.retail.filter((r) => r.statusTone === "green").length;

  return (
    <HqOperatorPage className="space-y-6">
      {showBackLink ? (
        <Link
          to="/accounts"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground no-underline transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          {t("All distributors")}
        </Link>
      ) : null}

      <HqOperatorPageHeader
        title={fixedOrgId ? activeOrgName : "Distributor sales"}
        description={
          fixedOrgId
            ? "Downstream sell-through for this partner — sales reps and retail accounts in their isolated network."
            : "Downstream visibility into each distributor's sales-rep performance and retail-store revenue. Read-only — order handling stays with the distributor."
        }
        actions={
          <HqBtn
            variant="outline"
            size="sm"
            onClick={() => toast.success(t("Export queued"), { description: t("Report will download shortly.") })}
          >
            <Download className="size-3.5" strokeWidth={1.75} />
            {t("Export report")}
          </HqBtn>
        }
      />

      {!fixedOrgId && orgOptions.length > 0 ? (
        <HqOperatorFilterBar className="mb-0">
          {orgOptions.map((org) => (
            <HqOperatorFilterButton
              key={org.id}
              active={org.id === activeOrgId}
              onClick={() => setSelectedOrgId(org.id)}
            >
              {org.name}
            </HqOperatorFilterButton>
          ))}
        </HqOperatorFilterBar>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("Loading partner data…")}</p>
      ) : orgOptions.length === 0 && !fixedOrgId ? (
        <div className="hq-card px-6 py-12 text-center">
          <Truck className="mx-auto size-8 text-muted-foreground/30" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium text-foreground">{t("No distributor networks yet")}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {t("Create distributor accounts under Network → Distributors, then open their partner portal.")}
          </p>
          <Link to="/accounts" className="hq-btn hq-btn-outline hq-btn-sm mt-4 inline-flex no-underline">
            {t("Manage distributors")}
          </Link>
        </div>
      ) : (
        <>
          <HqOperatorKpiGrid className="mb-0">
            <HqOperatorKpiCard
              icon={Truck}
              tone="gold"
              label="Distributor"
              value={snapshot.market}
              sub={activeOrgName}
            />
            <HqOperatorKpiCard
              icon={ShoppingCart}
              tone="green"
              label="Sell-through Q2"
              value={snapshot.q2Revenue}
              sub={`${snapshot.casesMoved.toLocaleString()} cases moved`}
            />
            <HqOperatorKpiCard
              icon={Users}
              tone="blue"
              label="Sales reps"
              value={String(snapshot.reps.length)}
              sub={`${snapshot.reps.reduce((a, r) => a + r.accounts, 0)} accounts covered`}
            />
            <HqOperatorKpiCard
              icon={Store}
              tone="ink"
              label="Retail accounts"
              value={String(snapshot.retail.length)}
              sub={`${activeRetail} active`}
            />
          </HqOperatorKpiGrid>

          <HqOperatorTwoCol className="mb-0">
            <HqOperatorCard>
              <HqOperatorCardHead
                title="Sales-rep performance"
                subtitle={`Reps selling through ${activeOrgName}`}
              />
              {snapshot.reps.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                  {t("No sales rep activity in this network yet.")}
                </div>
              ) : (
                <HqOperatorDataTable>
                  <thead>
                    <tr>
                      <th>{t("Rep")}</th>
                      <th>{t("Territory")}</th>
                      <th>{t("Q2 sales")}</th>
                      <th>{t("Accounts")}</th>
                      <th>{t("Quota")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.reps.map((r) => (
                      <tr key={r.id}>
                        <td className="font-medium">{r.name}</td>
                        <td className="text-xs text-muted-foreground">{r.territory}</td>
                        <td className="font-mono font-semibold text-accent">{r.q2Sales}</td>
                        <td className="font-mono">{r.accounts}</td>
                        <td className="font-mono font-semibold">{r.quota}</td>
                      </tr>
                    ))}
                  </tbody>
                </HqOperatorDataTable>
              )}
            </HqOperatorCard>

            <HqOperatorCard>
              <HqOperatorCardHead title="Retail-store sales" subtitle="Top accounts by revenue" />
              {snapshot.retail.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                  {t("No retail sell-through recorded yet.")}
                </div>
              ) : (
                <HqOperatorDataTable>
                  <thead>
                    <tr>
                      <th>{t("Account")}</th>
                      <th>{t("Type")}</th>
                      <th>{t("Q2 revenue")}</th>
                      <th>{t("Orders")}</th>
                      <th>{t("Status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.retail.map((r) => (
                      <tr key={r.id}>
                        <td className="font-medium">{r.name}</td>
                        <td className="text-xs capitalize text-muted-foreground">{r.type}</td>
                        <td className="font-mono font-semibold">{r.revenue}</td>
                        <td className="font-mono">{r.orders}</td>
                        <td>
                          <HqOperatorPill tone={r.statusTone}>{r.statusLabel}</HqOperatorPill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </HqOperatorDataTable>
              )}
            </HqOperatorCard>
          </HqOperatorTwoCol>

          {fixedOrgId ? null : (
            <div className="flex justify-end">
              <Link
                to={partnerPathForOrg(activeOrgId)}
                className="text-xs font-medium text-accent no-underline hover:underline"
              >
                {t("Open full partner detail →")}
              </Link>
            </div>
          )}
        </>
      )}
    </HqOperatorPage>
  );
}
