import { PageHeader } from "@/components/PageHeader";
import { ReceiveStockDialog } from "@/components/ReceiveStockDialog";
import { StatCard } from "@/components/StatCard";
import type { InventoryItem } from "@/data/mockData";
import { useAppData, useInventory } from "@/contexts/AppDataContext";
import {
  healthForInventoryRow,
  healthLabel,
  marketFromWarehouse,
  stockBucketsForRow,
} from "@/lib/inventory-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Package, Plus, Search, Download, Factory } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";

const STATUS_VALUES: InventoryItem["status"][] = ["available", "reserved", "damaged", "in-transit", "in-production"];

function computeInventorySummary(items: InventoryItem[]) {
  const s = {
    totalOnHand: 0,
    available: 0,
    reserved: 0,
    inTransit: 0,
    inProduction: 0,
    damaged: 0,
  };
  for (const i of items) {
    s.totalOnHand += i.quantityBottles;
    switch (i.status) {
      case "available":
        s.available += i.quantityBottles;
        break;
      case "reserved":
        s.reserved += i.quantityBottles;
        break;
      case "in-transit":
        s.inTransit += i.quantityBottles;
        break;
      case "in-production":
        s.inProduction += i.quantityBottles;
        break;
      case "damaged":
        s.damaged += i.quantityBottles;
        break;
      default:
        break;
    }
  }
  return s;
}

function parseStatusParam(raw: string | null): InventoryItem["status"] | null {
  if (!raw) return null;
  return STATUS_VALUES.includes(raw as InventoryItem["status"]) ? (raw as InventoryItem["status"]) : null;
}

export default function Inventory() {
  const { data } = useAppData();
  const { items, receiveLine, setItemStatus: setItemStatusCtx } = useInventory();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = parseStatusParam(searchParams.get("status"));
  const [search, setSearch] = useState("");
  useEffect(() => {
    const sku = searchParams.get("sku");
    if (sku) setSearch(sku);
  }, [searchParams]);
  const [receiveOpen, setReceiveOpen] = useState(false);

  const summary = useMemo(() => computeInventorySummary(items), [items]);

  const setItemStatus = (id: string, status: InventoryItem["status"]) => {
    setItemStatusCtx(id, status);
    toast.success("Status updated", { description: `${id} → ${status.replace(/-/g, " ")}` });
  };

  const handleReceiveStock = (line: InventoryItem) => {
    receiveLine(line);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((i) => {
      if (statusFilter && i.status !== statusFilter) return false;
      return (
        (i.productName?.toLowerCase() || "").includes(q) ||
        (i.sku?.toLowerCase() || "").includes(q) ||
        (i.batchLot?.toLowerCase() || "").includes(q)
      );
    });
  }, [search, statusFilter, items]);

  const clearStatusFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("status");
    setSearchParams(next, { replace: true });
  };

  /** Buttons (not Links) so filters always apply while already on /inventory. */
  const applyStatus = (status: InventoryItem["status"] | null) => {
    const next = new URLSearchParams(searchParams);
    if (status) next.set("status", status);
    else next.delete("status");
    setSearchParams(next, { replace: true });
  };

  const filterChips: { id: string; label: string; status: InventoryItem["status"] | null }[] = [
    { id: "all", label: "All on hand", status: null },
    { id: "available", label: "Available", status: "available" },
    { id: "reserved", label: "Reserved", status: "reserved" },
    { id: "in-transit", label: "In transit", status: "in-transit" },
    { id: "damaged", label: "Damaged", status: "damaged" },
    { id: "in-production", label: "In production", status: "in-production" },
  ];

  return (
    <div>
      <ReceiveStockDialog
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        existingItems={items}
        onReceive={handleReceiveStock}
      />

      <PageHeader
        title="Inventory"
        description="SKU-level positions by market hub — available, allocated, reserved, and incoming pipeline with health vs safety stock."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button variant="outline" size="sm" className="w-full justify-center touch-manipulation sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button type="button" size="sm" className="w-full justify-center touch-manipulation sm:w-auto" onClick={() => setReceiveOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Receive Stock
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-4">
        <StatCard
          label="On Hand"
          value={summary.totalOnHand.toLocaleString()}
          subtitle="All statuses"
          icon={Package}
          onClick={() => applyStatus(null)}
          isActive={statusFilter === null}
        />
        <StatCard
          label="Available"
          value={summary.available.toLocaleString()}
          subtitle="bottles"
          icon={Package}
          variant="success"
          onClick={() => applyStatus("available")}
          isActive={statusFilter === "available"}
        />
        <StatCard
          label="Reserved"
          value={summary.reserved.toLocaleString()}
          subtitle="bottles"
          icon={Package}
          variant="accent"
          onClick={() => applyStatus("reserved")}
          isActive={statusFilter === "reserved"}
        />
        <StatCard
          label="In Production"
          value={summary.inProduction.toLocaleString()}
          subtitle="bottles"
          icon={Factory}
          onClick={() => applyStatus("in-production")}
          isActive={statusFilter === "in-production"}
        />
        <StatCard
          label="In Transit"
          value={summary.inTransit.toLocaleString()}
          subtitle="bottles"
          icon={Package}
          onClick={() => applyStatus("in-transit")}
          isActive={statusFilter === "in-transit"}
        />
        <StatCard
          label="Damaged"
          value={summary.damaged.toLocaleString()}
          subtitle="bottles"
          icon={Package}
          variant="warning"
          onClick={() => applyStatus("damaged")}
          isActive={statusFilter === "damaged"}
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter inventory by status">
        {filterChips.map((chip) => {
          const active = chip.status === null ? statusFilter === null : statusFilter === chip.status;
          return (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => applyStatus(chip.status)}
              className={cn(
                "min-h-9 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors touch-manipulation",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <span>
              {statusFilter ? (
                <>
                  Filter: <strong className="capitalize text-foreground">{statusFilter.replace(/-/g, " ")}</strong>
                </>
              ) : (
                <>
                  Showing <strong className="text-foreground">all on-hand</strong> inventory (every status)
                </>
              )}
            </span>
            {statusFilter ? (
              <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0 touch-manipulation" onClick={clearStatusFilter}>
                Show all
              </Button>
            ) : null}
          </div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search SKU, product, or batch..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="-mx-4 overflow-x-auto touch-pan-x px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">SKU</th>
                  <th className="pb-3 font-medium text-muted-foreground">Market</th>
                  <th className="pb-3 font-medium text-muted-foreground">Warehouse</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Allocated</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Available</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Reserved</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Incoming</th>
                  <th className="pb-3 font-medium text-muted-foreground">Batch</th>
                  <th className="pb-3 font-medium text-muted-foreground">Health</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                      No rows match this filter. Try another status or clear the filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const b = stockBucketsForRow(item);
                    const health = healthForInventoryRow(
                      item,
                      items,
                      data.operationalSettings?.safetyStockBySku,
                      120,
                    );
                    return (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-mono text-xs">
                        <span className="block">{item.sku}</span>
                        <span className="text-[11px] font-normal text-muted-foreground">{item.productName}</span>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">{marketFromWarehouse(item.warehouse)}</td>
                      <td className="py-3">{item.warehouse}</td>
                      <td className="py-3 text-right tabular-nums">{b.allocatedBottles.toLocaleString()}</td>
                      <td className="py-3 text-right tabular-nums">{b.availableBottles.toLocaleString()}</td>
                      <td className="py-3 text-right tabular-nums">{b.reservedBottles.toLocaleString()}</td>
                      <td className="py-3 text-right tabular-nums">{b.incomingBottles.toLocaleString()}</td>
                      <td className="py-3 font-mono text-xs">{item.batchLot}</td>
                      <td className="py-3">
                        <span
                          className={
                            health === "healthy"
                              ? "text-emerald-700 dark:text-emerald-400"
                              : health === "watch"
                                ? "text-amber-700 dark:text-amber-400"
                                : "text-destructive"
                          }
                        >
                          {healthLabel(health)}
                        </span>
                      </td>
                      <td className="py-3">
                        <Select
                          value={item.status}
                          onValueChange={(v) => setItemStatus(item.id, v as InventoryItem["status"])}
                        >
                          <SelectTrigger
                            className="h-9 w-[min(100%,11rem)] touch-manipulation capitalize"
                            aria-label={`Status for ${item.id}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_VALUES.map((st) => (
                              <SelectItem key={st} value={st} className="capitalize">
                                {st.replace(/-/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
