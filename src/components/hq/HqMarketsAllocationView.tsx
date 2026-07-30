import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import type { AppData } from "@/types/app-data";
import type { MarketPanelRow } from "@/lib/brand-operator-metrics";
import type { MarketsHqMode } from "@/data/markets-hq-demo";
import {
  HQ_ALLOCATION_HUBS,
  buildHqMarketCards,
  buildSkuAllocationRows,
  hqMarketsLowCoverAlert,
} from "@/lib/hq-markets-allocation";
import {
  HqBtnLink,
  HqOperatorAlertBar,
  HqOperatorCard,
  HqOperatorDataTable,
  HqOperatorMarketCard,
  HqOperatorPage,
  HqOperatorPageHeader,
  HqOperatorSectionHead,
} from "@/components/hq/HqOperatorUi";

type MarketsView = {
  mode: MarketsHqMode;
  panelRows: MarketPanelRow[];
};

export function HqMarketsAllocationView({
  data,
  view,
  asOf,
}: {
  data: AppData;
  view: MarketsView;
  asOf: Date;
}) {
  const marketCards = useMemo(
    () => buildHqMarketCards(data, view.panelRows, view.mode, asOf),
    [data, view.panelRows, view.mode, asOf],
  );

  const allocationRows = useMemo(
    () => buildSkuAllocationRows(data, view.mode),
    [data, view.mode],
  );

  const lowCoverAlert = useMemo(
    () => hqMarketsLowCoverAlert(marketCards, view.mode),
    [marketCards, view.mode],
  );

  return (
    <HqOperatorPage className="space-y-6">
      <HqOperatorPageHeader
        title="Markets & allocation"
        description="Inventory cover and revenue by market · manage SKU allocation across distributors"
        actions={
          <HqBtnLink to="/production-requests" variant="accent" size="sm">
            Rebalance allocation
          </HqBtnLink>
        }
      />

      {lowCoverAlert ? (
        <HqOperatorAlertBar
          variant="error"
          actions={
            <HqBtnLink to="/production-requests" variant="accent" size="sm">
              Review
            </HqBtnLink>
          }
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[hsl(0_68%_44%)]" strokeWidth={1.75} />
            <span className="text-[13px]">
              <strong className="text-[hsl(0_68%_36%)]">{lowCoverAlert.market} below cover floor.</strong>{" "}
              <span className="text-[hsl(30_70%_35%)]">{lowCoverAlert.message}</span>
            </span>
          </div>
        </HqOperatorAlertBar>
      ) : null}

      <div className="hq-markets-grid grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {marketCards.map((m) => (
          <HqOperatorMarketCard
            key={m.id}
            name={m.name}
            sub={m.sub}
            coverLabel={m.coverLabel}
            revenue={m.revenue}
            revenueSuffix={m.revenueSuffix}
            coverPct={m.coverPct}
            coverTone={m.coverTone}
            statusTone={m.statusTone}
            statusLabel={m.statusLabel}
            skuCount={m.skuCount}
            manageTo={m.manageTo}
          />
        ))}
      </div>

      <HqOperatorSectionHead title="Allocation by SKU" />

      <HqOperatorCard className="overflow-hidden p-0">
        <HqOperatorDataTable>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Total stock</th>
              {HQ_ALLOCATION_HUBS.map((hub) => (
                <th key={hub}>{hub}</th>
              ))}
              <th>Unallocated</th>
            </tr>
          </thead>
          <tbody>
            {allocationRows.map((row) => (
              <tr key={row.sku}>
                <td>
                  <div className="font-medium">{row.name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{row.sku}</div>
                </td>
                <td className="font-mono font-semibold">{row.total.toLocaleString()} cs</td>
                {HQ_ALLOCATION_HUBS.map((hub) => (
                  <td
                    key={hub}
                    className={`font-mono ${row.lowHub === hub ? "font-semibold text-[hsl(0_68%_44%)]" : ""}`}
                  >
                    {row.byHub[hub].toLocaleString()}
                  </td>
                ))}
                <td className="font-mono text-muted-foreground">{row.unallocated.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </HqOperatorDataTable>
      </HqOperatorCard>
    </HqOperatorPage>
  );
}
