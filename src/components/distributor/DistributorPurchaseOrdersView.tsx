import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { PurchaseOrder } from "@/data/mockData";
import {
  DistributorCard,
  DistributorFilterBar,
  DistributorFilterButton,
  DistributorPage,
  DistributorPageHeader,
} from "@/components/distributor/DistributorUi";
import { StatusBadge } from "@/components/StatusBadge";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type PoFilter = "all" | "urgent" | "open" | "delivered";

function urgencyForPo(po: PurchaseOrder): PoFilter {
  if (po.status === "delivered" || po.status === "cancelled") return "delivered";
  if (po.status === "delayed") return "urgent";
  if (po.status === "in-production" || po.status === "shipped") return "open";
  return "open";
}

export function DistributorPurchaseOrdersView({
  purchaseOrders,
  onSelectPo,
}: {
  purchaseOrders: PurchaseOrder[];
  onSelectPo: (id: string) => void;
}) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<PoFilter>("all");
  const [openId, setOpenId] = useState<string | null>(purchaseOrders[0]?.id ?? null);

  const openPos = useMemo(
    () => purchaseOrders.filter((p) => p.status !== "delivered" && p.status !== "cancelled"),
    [purchaseOrders],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return openPos;
    if (filter === "delivered") return purchaseOrders.filter((p) => p.status === "delivered");
    if (filter === "urgent") return openPos.filter((p) => urgencyForPo(p) === "urgent");
    return openPos.filter((p) => urgencyForPo(p) === "open");
  }, [filter, openPos, purchaseOrders]);

  return (
    <DistributorPage className="space-y-5">
      <DistributorPageHeader
        title="Purchase orders"
        description="Received from Hajime HQ — fulfill in order of urgency."
        actions={
          <>
            <button type="button" className="dist-btn dist-btn-outline dist-btn-sm">
              {t("Export")}
            </button>
            <Link to="/distributor/pick-pack" className="dist-btn dist-btn-accent dist-btn-sm no-underline">
              {t("Start picking")}
            </Link>
          </>
        }
      />

      <DistributorFilterBar>
        {(
          [
            ["all", t("All ({{n}})", { n: openPos.length })],
            ["urgent", t("Urgent")],
            ["open", t("In production")],
            ["delivered", t("Delivered")],
          ] as const
        ).map(([id, label]) => (
          <DistributorFilterButton key={id} active={filter === id} onClick={() => setFilter(id)}>
            {label}
          </DistributorFilterButton>
        ))}
      </DistributorFilterBar>

      <DistributorCard>
        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">{t("No purchase orders in this view")}</p>
        ) : (
          filtered.map((po) => {
            const expanded = openId === po.id;
            const urgent = po.status === "delayed";
            return (
              <div key={po.id} className="dist-po-row-wrap border-b border-border/40 last:border-b-0">
                <button
                  type="button"
                  className="dist-po-main grid w-full gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/40 sm:grid-cols-[1.6fr_1.2fr_1fr_0.8fr_auto] sm:items-center sm:gap-3.5"
                  onClick={() => setOpenId(expanded ? null : po.id)}
                >
                  <div>
                    <div className="font-mono text-xs font-medium">{po.id}</div>
                    <div className="mt-0.5 text-[13px] font-semibold">{po.marketDestination}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{po.manufacturer}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {po.sku} · {po.quantity.toLocaleString()} btl
                  </div>
                  <div className="font-mono text-[13px] font-medium">{po.requiredDate}</div>
                  <div
                    className={cn(
                      "text-xs font-semibold",
                      urgent ? "text-[hsl(0_68%_40%)]" : "text-muted-foreground",
                    )}
                  >
                    {po.requestedShipDate}
                  </div>
                  <StatusBadge status={po.status} size="xs" />
                </button>
                {expanded ? (
                  <div className="dist-po-detail open border-t border-border/40 bg-muted/30 px-5 py-3.5">
                    <div className="mb-3.5 grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                          {t("Line items")}
                        </div>
                        <div className="flex justify-between border-b border-border/40 py-2 text-[13px]">
                          <span className="font-medium">{po.sku}</span>
                          <span className="font-mono">{po.quantity.toLocaleString()} btl</span>
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                          {t("Details")}
                        </div>
                        <div className="flex flex-col gap-1.5 text-[13px]">
                          <div>
                            PO <strong className="font-mono">{po.id}</strong>
                          </div>
                          <div>
                            {t("Destination")} <strong>{po.marketDestination}</strong>
                          </div>
                          <div>
                            {t("Required")} <strong>{po.requiredDate}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link to="/distributor/pick-pack" className="dist-btn dist-btn-accent dist-btn-sm no-underline">
                        {t("Start pick for this PO")}
                      </Link>
                      <button type="button" className="dist-btn dist-btn-outline dist-btn-sm" onClick={() => onSelectPo(po.id)}>
                        {t("View details")}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </DistributorCard>
    </DistributorPage>
  );
}
