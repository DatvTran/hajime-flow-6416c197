import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  DistributorFilterBar,
  DistributorFilterButton,
  DistributorPage,
  DistributorPageHeader,
} from "@/components/distributor/DistributorUi";
import {
  SHIPMENT_TRACKER_STAGES,
  filterManufacturerShipments,
  type ManufacturerShipmentFilter,
  type ManufacturerShipmentRow,
  type ShipmentStepState,
} from "@/lib/manufacturer-shipments";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

function ShipmentStatusPill({ tone, label }: { tone: ManufacturerShipmentRow["statusTone"]; label: string }) {
  const { t } = useLanguage();
  const styles = {
    blue: "border-[hsl(215_72%_50%/0.2)] bg-[hsl(215_72%_50%/0.08)] text-[hsl(215_72%_38%)]",
    green: "border-[hsl(158_56%_36%/0.2)] bg-[hsl(158_56%_36%/0.08)] text-[hsl(158_56%_26%)]",
  } as const;
  const dots = {
    blue: "bg-[hsl(215_72%_50%)]",
    green: "bg-[hsl(158_56%_36%)]",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        styles[tone],
      )}
    >
      <span className={cn("size-1.5 rounded-full", dots[tone])} />
      {t(label)}
    </span>
  );
}

function ShipmentStepTracker({ steps }: { steps: ShipmentStepState[] }) {
  const { t } = useLanguage();
  return (
    <div className="mfg-brew-steps">
      {SHIPMENT_TRACKER_STAGES.map((label, j) => {
        const state = steps[j] ?? "";
        return (
          <div key={label} className={cn("mfg-bstep", state)}>
            <div className="mfg-bstep-dot">
              {state === "done" ? <Check className="size-3.5" strokeWidth={2.5} /> : state === "cur" ? "●" : j + 1}
            </div>
            <div className="mfg-bstep-lbl">{t(label)}</div>
          </div>
        );
      })}
    </div>
  );
}

export type ManufacturerShipmentsViewProps = {
  shipments: ManufacturerShipmentRow[];
  defaultExpandedIds: Set<string>;
  onLogShipment: () => void;
  onViewManifest: (id: string) => void;
};

export function ManufacturerShipmentsView({
  shipments,
  defaultExpandedIds,
  onLogShipment,
  onViewManifest,
}: ManufacturerShipmentsViewProps) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<ManufacturerShipmentFilter>("all");
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(defaultExpandedIds));

  const filtered = useMemo(() => filterManufacturerShipments(shipments, filter), [filter, shipments]);

  const counts = useMemo(
    () => ({
      all: shipments.length,
      "in-transit": shipments.filter((s) => s.filterCategory === "in-transit").length,
      delivered: shipments.filter((s) => s.filterCategory === "delivered").length,
    }),
    [shipments],
  );

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <DistributorPage className="space-y-5">
      <DistributorPageHeader
        title="Shipments to HQ"
        description="Outbound finished goods to Hajime HQ distribution centers and direct distributor allocations"
        actions={
          <button type="button" className="dist-btn dist-btn-accent dist-btn-sm" onClick={onLogShipment}>
            {t("+ Log new shipment")}
          </button>
        }
      />

      <DistributorFilterBar>
        {(
          [
            ["all", t("All")],
            ["in-transit", t("In transit")],
            ["delivered", t("Delivered")],
          ] as const
        ).map(([key, label]) => (
          <DistributorFilterButton key={key} active={filter === key} onClick={() => setFilter(key)}>
            {label}
            {counts[key] > 0 ? <span className="ml-1.5 text-[11px] opacity-70">({counts[key]})</span> : null}
          </DistributorFilterButton>
        ))}
      </DistributorFilterBar>

      <div className="space-y-3.5">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("No shipments match this filter")}</p>
        ) : (
          filtered.map((shipment) => {
            const expanded = openIds.has(shipment.id);
            return (
              <div key={shipment.id} className="mfg-batch-card">
                <button
                  type="button"
                  className="mfg-batch-head w-full text-left"
                  onClick={() => toggleOpen(shipment.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[11px] text-muted-foreground">{shipment.id}</div>
                    <div className="mt-0.5 text-[15px] font-semibold">{shipment.destination}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{shipment.items}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-muted-foreground">{t(shipment.etaLabel)}</div>
                    <div className="mt-0.5 text-[13px] font-medium">{shipment.eta}</div>
                  </div>
                  <ShipmentStatusPill tone={shipment.statusTone} label={shipment.statusLabel} />
                  <ChevronDown
                    className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")}
                    strokeWidth={1.75}
                  />
                </button>

                {expanded ? (
                  <div className="mfg-batch-detail open">
                    <ShipmentStepTracker steps={shipment.steps} />
                    <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-border/50 pt-3.5 text-[13px]">
                      <div>
                        {t("Carrier")} <strong>{shipment.carrier}</strong>
                      </div>
                      <div>
                        {t("Tracking")}{" "}
                        <strong className="font-mono">{shipment.id}</strong>
                      </div>
                      <div className="ml-auto">
                        <button
                          type="button"
                          className="dist-btn dist-btn-outline dist-btn-sm"
                          onClick={() => onViewManifest(shipment.id)}
                        >
                          {t("View manifest")}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </DistributorPage>
  );
}
