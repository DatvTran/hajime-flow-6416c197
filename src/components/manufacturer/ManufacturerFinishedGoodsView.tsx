import { Box, Check, Truck } from "lucide-react";
import {
  DistributorCard,
  DistributorDataTable,
  DistributorKpiCard,
  DistributorKpiGrid,
  DistributorPage,
  DistributorPageHeader,
} from "@/components/distributor/DistributorUi";
import {
  availableCases,
  availableTextClass,
  type FinishedGoodsRow,
  type FinishedGoodsSummary,
} from "@/lib/manufacturer-finished-goods";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

function StatusPill({ status }: { status: FinishedGoodsRow["status"] }) {
  const { t } = useLanguage();
  const isLow = status === "med";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        isLow
          ? "border-[hsl(38_90%_50%/0.25)] bg-[hsl(38_90%_50%/0.1)] text-[hsl(30_80%_30%)]"
          : "border-[hsl(158_56%_36%/0.2)] bg-[hsl(158_56%_36%/0.08)] text-[hsl(158_56%_26%)]",
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", isLow ? "bg-[hsl(38_90%_50%)]" : "bg-[hsl(158_56%_36%)]")}
      />
      {t(isLow ? "low" : "ready")}
    </span>
  );
}

export type ManufacturerFinishedGoodsViewProps = {
  rows: FinishedGoodsRow[];
  summary: FinishedGoodsSummary;
  onCreateShipment: () => void;
};

export function ManufacturerFinishedGoodsView({
  rows,
  summary,
  onCreateShipment,
}: ManufacturerFinishedGoodsViewProps) {
  const { t } = useLanguage();

  return (
    <DistributorPage className="space-y-5">
      <DistributorPageHeader
        title="Finished goods"
        description="Bottled inventory ready to ship to Hajime HQ and direct distributor allocations"
        actions={
          <button type="button" className="dist-btn dist-btn-accent dist-btn-sm" onClick={onCreateShipment}>
            {t("Create shipment")}
          </button>
        }
      />

      <DistributorKpiGrid className="sm:grid-cols-2 lg:grid-cols-3">
        <DistributorKpiCard
          icon={Box}
          tone="gold"
          label="Total finished"
          value={`${summary.totalCases} cs`}
          sub={`across ${summary.skuCount} SKUs`}
          rawSub
        />
        <DistributorKpiCard
          icon={Truck}
          tone="blue"
          label="Reserved for HQ"
          value={`${summary.reservedCases} cs`}
          sub="allocated to open shipments"
        />
        <DistributorKpiCard
          icon={Check}
          tone="green"
          label="Available to ship"
          value={`${summary.availableCases} cs`}
          sub="unallocated · ready"
        />
      </DistributorKpiGrid>

      <DistributorCard>
        <DistributorDataTable>
          <thead>
            <tr>
              <th>{t("SKU")}</th>
              <th>{t("Product")}</th>
              <th>{t("Lot")}</th>
              <th>{t("Cases on hand")}</th>
              <th>{t("Reserved")}</th>
              <th>{t("Available")}</th>
              <th>{t("Status")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const available = availableCases(row);
              return (
                <tr key={row.sku}>
                  <td className="font-mono text-[11px] text-muted-foreground">{row.sku}</td>
                  <td className="font-medium">{row.name}</td>
                  <td className="font-mono text-xs">{row.lot}</td>
                  <td className="font-mono font-medium">{row.cases} cs</td>
                  <td className="font-mono text-muted-foreground">{row.reserved} cs</td>
                  <td className={cn("font-mono font-semibold", availableTextClass(available))}>
                    {available} cs
                  </td>
                  <td>
                    <StatusPill status={row.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DistributorDataTable>
      </DistributorCard>
    </DistributorPage>
  );
}
