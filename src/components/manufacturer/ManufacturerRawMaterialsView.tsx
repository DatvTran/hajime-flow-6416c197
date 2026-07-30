import { AlertTriangle } from "lucide-react";
import {
  DistributorAlertBar,
  DistributorCard,
  DistributorDataTable,
  DistributorPage,
  DistributorPageHeader,
} from "@/components/distributor/DistributorUi";
import {
  availFillClass,
  lastInventoryCountLabel,
  levelLabel,
  levelTextClass,
  type RawMaterialRow,
} from "@/lib/manufacturer-raw-materials";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export type ManufacturerRawMaterialsViewProps = {
  materials: RawMaterialRow[];
  lowStock: RawMaterialRow[];
  onReorder: () => void;
  onReorderItem?: (sku: string) => void;
};

export function ManufacturerRawMaterialsView({
  materials,
  lowStock,
  onReorder,
  onReorderItem,
}: ManufacturerRawMaterialsViewProps) {
  const { t } = useLanguage();
  const lastCount = lastInventoryCountLabel();

  return (
    <DistributorPage className="space-y-5">
      <DistributorPageHeader
        title="Raw materials"
        description="Rice, cultures, water and packaging inventory · reorder before batches deplete stock"
        actions={
          <button type="button" className="dist-btn dist-btn-accent dist-btn-sm" onClick={onReorder}>
            {t("Reorder materials")}
          </button>
        }
      />

      {lowStock.length > 0 ? (
        <DistributorAlertBar variant="warn">
          <AlertTriangle className="mb-1 inline size-4 text-[hsl(38_90%_40%)]" strokeWidth={1.75} />
          <strong className="text-[hsl(30_80%_28%)]">
            {t("{{count}} materials below reorder point:", { count: lowStock.length })}
          </strong>{" "}
          <span className="text-[hsl(30_70%_35%)]">
            {lowStock
              .map((m) => `${m.name.split(" ").slice(0, 2).join(" ")} (${m.pct}%)`)
              .join(" and ")}
            . {t("Reorder to avoid delaying scheduled batches.")}
          </span>
        </DistributorAlertBar>
      ) : null}

      <DistributorCard>
        <div className="dist-card-head">
          <div>
            <div className="dist-card-title">{t("Inventory")}</div>
            <div className="dist-card-sub mt-0.5">
              {t("{{count}} tracked materials · last count {{when}}", {
                count: materials.length,
                when: lastCount,
              })}
            </div>
          </div>
        </div>
        <DistributorDataTable>
          <thead>
            <tr>
              <th>{t("Code")}</th>
              <th>{t("Material")}</th>
              <th>{t("Type")}</th>
              <th>{t("On hand")}</th>
              <th>{t("Reorder pt")}</th>
              <th>{t("Level")}</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((row) => (
              <tr
                key={row.sku}
                className={onReorderItem && row.tone === "low" ? "cursor-pointer" : undefined}
                onClick={onReorderItem && row.tone === "low" ? () => onReorderItem(row.sku) : undefined}
              >
                <td className="font-mono text-[11px] text-muted-foreground">{row.sku}</td>
                <td className="font-medium">{row.name}</td>
                <td className="text-muted-foreground">{row.type}</td>
                <td className={cn("font-mono font-semibold", levelTextClass(row.tone))}>{row.onHand}</td>
                <td className="font-mono text-xs text-muted-foreground">{row.reorderPt}</td>
                <td>
                  <div className={cn("mb-1 text-[11px] font-semibold", levelTextClass(row.tone))}>
                    {t(levelLabel(row.tone))}
                  </div>
                  <div className="mfg-avail-bar w-[140px]">
                    <div
                      className={cn("mfg-avail-fill", availFillClass(row.tone))}
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </DistributorDataTable>
      </DistributorCard>
    </DistributorPage>
  );
}
