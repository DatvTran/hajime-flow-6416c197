import { Check, Truck } from "lucide-react";
import { Fragment } from "react";
import { Link } from "react-router-dom";
import type { SalesOrder } from "@/data/mockData";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  casesForOrder,
  formatHqOrderCurrency,
  hqOrderDisplayStatus,
  HQ_ORDER_PIPELINE_STEPS,
  orderLines,
  orderTotal,
  palletsForCases,
} from "@/lib/hq-distributor-order-display";
import { cn } from "@/lib/utils";
import {
  HqBtn,
  HqBtnLink,
  HqOperatorCard,
  HqOperatorCardHead,
  HqOperatorDataTable,
  HqOperatorPage,
  HqOperatorPill,
} from "@/components/hq/HqOperatorUi";

type Props = {
  order: SalesOrder;
  onApprove?: () => void;
};

export function HqDistributorOrderDetailView({ order, onApprove }: Props) {
  const { t } = useLanguage();
  const display = hqOrderDisplayStatus(order);
  const lines = orderLines(order);
  const total = orderTotal(order);
  const cases = casesForOrder(order);
  const pallets = palletsForCases(cases);
  const orderRef = order.orderNumber ?? order.id;
  const reached = display.stage;

  return (
    <HqOperatorPage className="space-y-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <HqBtnLink to="/orders" variant="outline" size="sm">
          ← {t("Distributor orders")}
        </HqBtnLink>
        <span className="text-xs text-muted-foreground">/ {orderRef}</span>
      </div>

      <HqOperatorCard className="mb-[18px] overflow-hidden p-0">
        <div className="flex flex-wrap items-start gap-[18px] px-6 py-[22px]">
          <div className="flex size-[52px] shrink-0 items-center justify-center rounded-xl bg-[hsl(158_56%_36%/0.1)] text-[hsl(158_56%_30%)]">
            <Truck className="size-6" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em]">{orderRef}</h1>
              <HqOperatorPill tone={display.tone}>{display.label}</HqOperatorPill>
            </div>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {order.account} · {order.market || "—"} · {cases} {t("cases")} · {t("ETA")}{" "}
              {order.requestedDelivery || "—"}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {display.label === "pending" ? (
              <HqBtnLink to="/orders?view=replenishment" variant="green" size="sm">
                {t("Approve & fulfill")}
              </HqBtnLink>
            ) : display.label === "on hold" ? (
              <HqBtnLink to="/markets" variant="accent" size="sm">
                {t("Review allocation")}
              </HqBtnLink>
            ) : (
              <HqBtn variant="outline" size="sm" type="button">
                {t("View shipment")}
              </HqBtn>
            )}
            {onApprove && display.label === "pending" ? (
              <HqBtn variant="green" size="sm" type="button" onClick={onApprove}>
                {t("Approve order")}
              </HqBtn>
            ) : null}
          </div>
        </div>
        <div className="px-6 pb-[22px]">
          <div className="hq-order-steps">
            {HQ_ORDER_PIPELINE_STEPS.map((step, si) => (
              <Fragment key={step}>
                {si > 0 ? <div className="hq-order-step-sep">———</div> : null}
                <div className="hq-order-step">
                  <div
                    className={cn(
                      "hq-order-step-dot",
                      si < reached - 1 && "done",
                      si === reached - 1 && "current",
                      si > reached - 1 && "upcoming",
                    )}
                  >
                    {si < reached - 1 ? <Check className="size-3.5" strokeWidth={2.5} /> : si + 1}
                  </div>
                  <div
                    className={cn(
                      "hq-order-step-label",
                      si <= reached - 1 ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {t(step)}
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </HqOperatorCard>

      <div className="hq-two-col">
        <HqOperatorCard className="overflow-hidden p-0">
          <HqOperatorCardHead title={t("Order lines")} />
          <HqOperatorDataTable>
            <thead>
              <tr>
                <th>{t("SKU")}</th>
                <th>{t("Cases")}</th>
                <th>{t("Pallets")}</th>
                <th>{t("Unit")}</th>
                <th>{t("Line total")}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.sku}>
                  <td className="font-mono text-xs">{line.sku}</td>
                  <td className="font-mono">{line.cases}</td>
                  <td className="font-mono">{line.pallets}</td>
                  <td className="font-mono">${line.unitPrice}</td>
                  <td className="font-mono font-semibold">{formatHqOrderCurrency(line.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </HqOperatorDataTable>
          <div className="flex items-center justify-between border-t border-border/50 px-5 py-3.5 text-sm">
            <span className="font-semibold">{t("Order total")}</span>
            <span className="font-mono text-sm font-bold">{formatHqOrderCurrency(total)}</span>
          </div>
        </HqOperatorCard>

        <HqOperatorCard className="overflow-hidden p-0">
          <HqOperatorCardHead title={t("Details")} />
          <div className="px-5 py-1.5">
            {(
              [
                [t("Distributor"), order.account],
                [t("Market"), order.market || "—"],
                [t("Quantity"), `${cases} ${t("cases")} · ${pallets} ${t("pallets")}`],
                [t("ETA"), order.requestedDelivery || "—"],
                [t("Fulfillment"), t("From HQ finished goods")],
                [t("Status"), display.label],
              ] as const
            ).map(([label, value], i, arr) => (
              <div
                key={label}
                className={cn(
                  "flex items-center justify-between py-[11px] text-[13px]",
                  i < arr.length - 1 && "border-b border-border/30",
                )}
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </HqOperatorCard>
      </div>

      {order.orderNotes ? (
        <HqOperatorCard className="p-5 text-[13px]">
          <strong className="mb-0 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {t("Notes")}
          </strong>
          <p className="mt-1.5 text-foreground">{order.orderNotes}</p>
        </HqOperatorCard>
      ) : null}

      <p className="text-xs text-muted-foreground">
        {t("Retail and sales-rep orders are handled downstream — see")}{" "}
        <Link to="/accounts?view=sales" className="font-medium text-accent hover:underline">
          {t("Distributor sales")}
        </Link>
        .
      </p>
    </HqOperatorPage>
  );
}
