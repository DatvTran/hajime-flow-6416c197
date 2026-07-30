import { useMemo, useState } from "react";
import { AlertTriangle, Check, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import type { Account, SalesOrder } from "@/data/mockData";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatHqCurrency } from "@/lib/hq-format";
import {
  HqBtn,
  HqBtnLink,
  HqOperatorAlertBar,
  HqOperatorFilterBar,
  HqOperatorFilterButton,
  HqOperatorPage,
  HqOperatorPageHeader,
  HqOperatorPill,
  HqOperatorSrcChip,
} from "@/components/hq/HqOperatorUi";
import { cn } from "@/lib/utils";
import { casesForOrder, type ReplenishmentStock } from "@/lib/hq-replenishment-stock";

type Props = {
  orders: SalesOrder[];
  accounts: Account[];
  stockByOrder?: Map<string, ReplenishmentStock>;
  onApprove: (order: SalesOrder) => void;
  onDecline: (order: SalesOrder) => void;
  onSelect: (id: string) => void;
  onTriggerProduction?: (order: SalesOrder) => void;
};

type FilterId = "all" | "urgent" | "in-stock" | "short";

function palletsForOrder(o: SalesOrder): number {
  return Math.max(1, Math.ceil(casesForOrder(o) / 48));
}

function fulfillTone(short: boolean): { tone: "green" | "amber" | "red"; label: string } {
  return short ? { tone: "red", label: "short — produce" } : { tone: "green", label: "in stock" };
}

export function HqReplenishmentOrdersView({
  orders,
  accounts,
  stockByOrder,
  onApprove,
  onDecline,
  onSelect,
  onTriggerProduction,
}: Props) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<FilterId>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isShort = (o: SalesOrder) => stockByOrder?.get(o.id)?.short ?? false;

  const pending = useMemo(
    () => orders.filter((o) => o.status === "draft" || o.status === "confirmed"),
    [orders],
  );

  const filtered = useMemo(() => {
    if (filter === "urgent") return pending.filter((o) => o.status === "draft");
    if (filter === "in-stock") return pending.filter((o) => !isShort(o));
    if (filter === "short") return pending.filter((o) => isShort(o));
    return pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, filter, stockByOrder]);

  const urgentOrder = pending.find((o) => o.status === "draft");

  return (
    <HqOperatorPage className="space-y-6">
      <HqOperatorPageHeader
        title="Replenishment orders"
        description="Pallet orders from distributors to restock their DCs — approve to ship from finished goods. Short stock triggers a production request to a manufacturer partner."
        actions={
          <HqBtnLink to="/inventory" variant="outline" size="sm">
            {t("Finished goods")}
          </HqBtnLink>
        }
      />

      {urgentOrder ? (
        <HqOperatorAlertBar
          variant="error"
          actions={
            <HqBtnLink to="/production-requests" variant="accent" size="sm">
              {t("View production")}
            </HqBtnLink>
          }
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="size-4 shrink-0 text-[hsl(0_68%_42%)]" strokeWidth={1.75} />
            <span>
              <strong className="text-[hsl(0_68%_36%)]">{urgentOrder.account}</strong>{" "}
              <span className="text-[hsl(30_70%_35%)]">
                {t("has a replenishment request awaiting approval — review finished goods before shipping.")}
              </span>
            </span>
          </div>
        </HqOperatorAlertBar>
      ) : null}

      <HqOperatorFilterBar>
        <HqOperatorFilterButton active={filter === "all"} onClick={() => setFilter("all")}>
          {t("All")} ({pending.length})
        </HqOperatorFilterButton>
        <HqOperatorFilterButton active={filter === "urgent"} onClick={() => setFilter("urgent")}>
          {t("Urgent")} ({pending.filter((o) => o.status === "draft").length})
        </HqOperatorFilterButton>
        <HqOperatorFilterButton active={filter === "in-stock"} onClick={() => setFilter("in-stock")}>
          {t("In stock")} ({pending.filter((o) => !isShort(o)).length})
        </HqOperatorFilterButton>
        <HqOperatorFilterButton active={filter === "short"} onClick={() => setFilter("short")}>
          {t("Short")} ({pending.filter((o) => isShort(o)).length})
        </HqOperatorFilterButton>
      </HqOperatorFilterBar>

      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div className="font-display text-[17px] font-medium">
          {filtered.length} {t("orders awaiting fulfillment")}
        </div>
        <span className="text-xs text-muted-foreground">
          {t("Approved orders ship from finished goods to the distributor DC")}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-border px-10 py-10 text-center text-muted-foreground">
          <Check className="mx-auto size-7" strokeWidth={1.5} />
          <div className="mt-3 text-sm font-medium text-foreground">{t("All caught up")}</div>
          <div className="mt-1 text-[13px]">{t("No replenishment orders pending. Distributor restock requests appear here.")}</div>
        </div>
      ) : (
        filtered.map((order, i) => {
          const pallets = palletsForOrder(order);
          const cases = casesForOrder(order);
          const stock = stockByOrder?.get(order.id);
          const short = stock?.short ?? false;
          const fm = fulfillTone(short);
          const open = expandedId === order.id || (expandedId === null && i === 0);
          const acc = accounts.find((a) => a.tradingName === order.account || a.legalName === order.account);
          const market = order.market || acc?.city || "—";

          return (
            <div
              key={order.id}
              className={cn("hq-rpl-card", short && "urgent")}
            >
              <button
                type="button"
                className="flex w-full items-center gap-3.5 px-5 py-4 text-left"
                onClick={() => setExpandedId(open && expandedId === order.id ? null : order.id)}
              >
                <div className="flex size-[42px] shrink-0 items-center justify-center rounded-[10px] bg-[hsl(158_56%_36%/0.1)] text-[hsl(158_56%_30%)]">
                  <Truck className="size-[19px]" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <HqOperatorSrcChip variant="dist">{order.account}</HqOperatorSrcChip>
                    {order.status === "draft" ? <HqOperatorPill tone="red">{t("urgent")}</HqOperatorPill> : null}
                    <HqOperatorPill tone={fm.tone}>{fm.label}</HqOperatorPill>
                  </div>
                  <div className="font-display text-[17px] font-medium tracking-tight">
                    {pallets} {pallets === 1 ? t("pallet") : t("pallets")} · {order.sku}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {order.id} · {market} · {t("received")} {order.orderDate}
                  </div>
                </div>
                <div className="mr-2 shrink-0 text-right">
                  <div className="font-display text-xl font-semibold">{formatHqCurrency(order.price)}</div>
                  <div className="text-[10px] text-muted-foreground">{cases} {t("cases")}</div>
                </div>
                <div className="flex shrink-0 gap-2" onClick={(e) => e.stopPropagation()} role="presentation">
                  <HqBtn variant="red" size="sm" onClick={() => onDecline(order)}>
                    {t("Decline")}
                  </HqBtn>
                  <HqBtn variant="green" size="sm" onClick={() => onApprove(order)}>
                    {order.status === "draft" ? t("Approve") : t("Approve & ship")} →
                  </HqBtn>
                </div>
              </button>
              {open ? (
                <div className="border-t border-border/40 bg-muted/30 px-5 py-4">
                  <div className="mb-3.5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="hq-detail-panel">
                      <div className="hq-detail-label">{t("Finished goods")}</div>
                      <div
                        className={cn(
                          "text-[13px] font-medium",
                          fm.tone === "green"
                            ? "text-[hsl(158_56%_30%)]"
                            : fm.tone === "amber"
                              ? "text-[hsl(30_80%_32%)]"
                              : "text-[hsl(0_68%_42%)]",
                        )}
                      >
                        {short
                          ? t("Short {{n}} cs — production required", { n: stock?.shortfallCases ?? 0 })
                          : t("{{n}} cs available in finished goods", { n: stock?.availableCases ?? 0 })}
                      </div>
                    </div>
                    <div className="hq-detail-panel">
                      <div className="hq-detail-label">{t("On approval")}</div>
                      <div className="text-[13px] font-medium">{t("Ships to")} {order.account}</div>
                      <div className="text-[11px] text-muted-foreground">{market} DC</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <HqBtn variant="green" size="sm" onClick={() => onApprove(order)}>
                      <Check className="size-3.5" strokeWidth={2} />
                      {t("Approve & ship from finished goods")}
                    </HqBtn>
                    {short && onTriggerProduction ? (
                      <HqBtn variant="accent" size="sm" onClick={() => onTriggerProduction(order)}>
                        {t("Trigger production request")}
                      </HqBtn>
                    ) : null}
                    <HqBtn variant="outline" size="sm" onClick={() => onSelect(order.id)}>
                      {t("View order")}
                    </HqBtn>
                    <HqBtn variant="red" size="sm" className="ml-auto" onClick={() => onDecline(order)}>
                      {t("Decline")}
                    </HqBtn>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })
      )}

      <p className="text-center text-xs text-muted-foreground">
        {t("Downstream retail orders are handled by distributors — see")}{" "}
        <Link to="/accounts?view=sales" className="font-medium text-accent underline-offset-2 hover:underline">
          {t("Distributor sales")}
        </Link>
      </p>
    </HqOperatorPage>
  );
}
