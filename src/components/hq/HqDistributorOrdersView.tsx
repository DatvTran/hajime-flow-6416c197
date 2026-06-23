import { useMemo, useState } from "react";
import { ChevronRight, Download } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { SalesOrder } from "@/data/mockData";
import { useLanguage } from "@/contexts/LanguageContext";
import { downloadSalesOrdersCsv } from "@/lib/export-orders-csv";
import { casesForOrder, hqOrderDisplayStatus } from "@/lib/hq-distributor-order-display";
import {
  HqBtn,
  HqOperatorCard,
  HqOperatorDataTable,
  HqOperatorFilterBar,
  HqOperatorFilterButton,
  HqOperatorPage,
  HqOperatorPageHeader,
  HqOperatorPill,
  HqOperatorSearchWrap,
} from "@/components/hq/HqOperatorUi";
import { toast } from "@/components/ui/sonner";

type Props = {
  orders: SalesOrder[];
};

export function HqDistributorOrdersView({ orders }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [market, setMarket] = useState<string>("all");
  const [search, setSearch] = useState("");

  const markets = useMemo(() => {
    const set = new Set<string>();
    for (const o of orders) {
      const m = (o.market || "").trim();
      if (m) set.add(m);
    }
    return Array.from(set).sort();
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (market !== "all" && o.market !== market) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.account.toLowerCase().includes(q) ||
        o.sku.toLowerCase().includes(q)
      );
    });
  }, [orders, market, search]);

  return (
    <HqOperatorPage className="space-y-6">
      <HqOperatorPageHeader
        title="Distributor orders"
        rawTitle
        description={
          <>
            Pallet orders placed by distributors to HQ. Retail and sales-rep orders are handled downstream by each
            distributor — see{" "}
            <Link to="/accounts?view=sales" className="hq-sec-link font-medium text-accent underline-offset-2 hover:underline">
              {t("Distributor sales")}
            </Link>{" "}
            for that visibility.
          </>
        }
        rawDescription
        actions={
          <HqBtn
            variant="outline"
            size="sm"
            onClick={() => {
              downloadSalesOrdersCsv(filtered);
              toast.success(t("Orders exported"));
            }}
          >
            <Download className="size-3.5" strokeWidth={1.75} />
            {t("Export CSV")}
          </HqBtn>
        }
      />

      <HqOperatorFilterBar className="flex-wrap">
        <HqOperatorFilterButton active={market === "all"} onClick={() => setMarket("all")}>
          {t("All markets")}
        </HqOperatorFilterButton>
        {markets.map((m) => (
          <HqOperatorFilterButton key={m} active={market === m} onClick={() => setMarket(m)}>
            {m}
          </HqOperatorFilterButton>
        ))}
        <HqOperatorSearchWrap
          value={search}
          onChange={setSearch}
          placeholder="Search order or distributor…"
        />
      </HqOperatorFilterBar>

      <HqOperatorCard className="overflow-hidden p-0">
        <HqOperatorDataTable>
          <thead>
            <tr>
              <th>{t("Order")}</th>
              <th>{t("Distributor")}</th>
              <th>{t("SKU")}</th>
              <th>{t("Qty (cases)")}</th>
              <th>{t("Market")}</th>
              <th>{t("ETA")}</th>
              <th>{t("Status")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-muted-foreground">
                  {t("No distributor orders match your filters.")}
                </td>
              </tr>
            ) : (
              filtered.map((o) => {
                const pill = hqOrderDisplayStatus(o);
                const cases = casesForOrder(o);
                const orderRef = o.orderNumber ?? o.id;
                return (
                  <tr
                    key={o.id}
                    className="cursor-pointer transition-colors hover:bg-muted/30"
                    onClick={() => navigate(`/orders/${encodeURIComponent(o.id)}`)}
                  >
                    <td className="font-mono text-xs font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        {orderRef}
                        <ChevronRight className="size-3 text-muted-foreground" strokeWidth={1.75} />
                      </span>
                    </td>
                    <td className="font-medium">{o.account}</td>
                    <td className="font-mono text-xs text-muted-foreground">{o.sku}</td>
                    <td className="font-mono">{cases}</td>
                    <td>{o.market}</td>
                    <td className="font-mono text-muted-foreground">{o.requestedDelivery || "—"}</td>
                    <td>
                      <HqOperatorPill tone={pill.tone}>{pill.label}</HqOperatorPill>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </HqOperatorDataTable>
      </HqOperatorCard>
    </HqOperatorPage>
  );
}
