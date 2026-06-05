import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import { RetailSkeleton } from "@/components/skeletons";
import { useRetailAccountTradingName } from "@/contexts/AuthContext";
import { retailOrderDisplayId, orderLineEntries } from "@/lib/order-lines";
import { RetailPageHeader } from "@/components/retail/RetailPageHeader";
import { RetailFilterPills } from "@/components/retail/RetailFilterPills";
import { RetailStatusPill } from "@/components/retail/RetailStatusPill";
import { retailBucketFromStatus, type RetailOrderFilter } from "@/components/retail/RetailStatusChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Product, SalesOrder } from "@/data/mockData";
import { useLanguage } from "@/contexts/LanguageContext";

function filterKey(raw: string | null): RetailOrderFilter {
  if (raw === "pending" || raw === "in_transit" || raw === "delivered") return raw;
  return "all";
}

function lineSummary(o: SalesOrder, products: Product[]): string {
  return orderLineEntries(o)
    .map((l) => {
      const p = products.find((x) => x.sku === l.sku);
      return `${l.quantityBottles}× ${p?.name ?? l.sku}`;
    })
    .join(", ");
}

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function RetailMyOrdersPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data, loading } = useAppData();
  const accountName = useRetailAccountTradingName();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = filterKey(searchParams.get("filter"));
  const [q, setQ] = useState("");

  const myOrders = useMemo(
    () => data.salesOrders.filter((o) => o.account === accountName).sort((a, b) => Date.parse(b.orderDate) - Date.parse(a.orderDate)),
    [data.salesOrders, accountName],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return myOrders
      .filter((o) => o.status !== "cancelled")
      .filter((o) => (filter === "all" ? true : retailBucketFromStatus(o.status) === filter))
      .filter((o) => {
        if (!needle) return true;
        const id = retailOrderDisplayId(o.id).toLowerCase();
        return id.includes(needle) || lineSummary(o, data.products).toLowerCase().includes(needle);
      });
  }, [myOrders, filter, q, data.products]);

  const setFilter = (f: RetailOrderFilter) => {
    const next = new URLSearchParams(searchParams);
    if (f === "all") next.delete("filter");
    else next.set("filter", f);
    setSearchParams(next, { replace: true });
  };

  if (loading) return <RetailSkeleton />;

  return (
    <div className="space-y-6 pb-8">
      <RetailPageHeader
        title="My orders"
        description={t("Full order history for {{name}}.", { name: accountName ?? "your venue" })}
        actions={
          <Button variant="outline" size="sm" className="h-[30px] text-xs">
            Export CSV
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <RetailFilterPills
          className="mb-0"
          options={[
            { id: "all", label: "All orders" },
            { id: "pending", label: "Pending" },
            { id: "in_transit", label: "In transit" },
            { id: "delivered", label: "Delivered" },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <div className="relative ml-auto w-full max-w-xs sm:w-auto">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-[15px] -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search orders…" className="h-9 pl-9 text-[13px]" />
        </div>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-border/70 bg-card shadow-[var(--shadow-soft)]">
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px] text-muted-foreground">No orders in this view.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {["Order", "Items", "Total", "Status", ""].map((h) => (
                  <TableHead key={h || "actions"} className="bg-muted/50 text-[10px] font-semibold uppercase tracking-[0.1em]">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow
                  key={o.id}
                  className="cursor-pointer border-border/40 hover:bg-muted/30"
                  onClick={() => navigate(`/retail/orders/${encodeURIComponent(o.id)}`)}
                >
                  <TableCell>
                    <div className="font-mono text-xs font-medium">{retailOrderDisplayId(o.id)}</div>
                    <div className="text-[11px] text-muted-foreground">Placed {o.orderDate}</div>
                  </TableCell>
                  <TableCell className="max-w-[240px] text-xs text-muted-foreground">{lineSummary(o, data.products)}</TableCell>
                  <TableCell className="font-mono text-[13px] font-medium tabular-nums">${formatMoney(o.price)}</TableCell>
                  <TableCell>
                    <RetailStatusPill status={o.status} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" className="h-[30px] text-xs" asChild>
                      <Link to="/shipments">Track</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
