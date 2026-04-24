import { PageHeader } from "@/components/PageHeader";
import { ReceiveStockDialog } from "@/components/ReceiveStockDialog";
import { StatCard } from "@/components/StatCard";
import type { InventoryItem } from "@/data/mockData";
import { useAppData, useInventoryForRole } from "@/contexts/AppDataContext";
import { InventorySkeleton } from "@/components/skeletons";
import { useAuth } from "@/contexts/AuthContext";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { Package, Plus, Search, Factory, Truck, Store } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { downloadInventoryCsv, downloadLowStockCsv } from "@/lib/export-inventory-csv";
import { CSVImportButton } from "@/components/CSVImportButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet } from "lucide-react";

const STATUS_VALUES: InventoryItem["status"][] = ["available", "reserved", "damaged"];

const LOCATION_TYPE_LABELS: Record<InventoryItem["locationType"], string> = {
  manufacturer: "Manufacturer",
  distributor_warehouse: "Warehouse",
  in_transit: "In Transit",
  retail_shelf: "Retail Shelf",
};

const LOCATION_TYPE_ICONS: Record<InventoryItem["locationType"], typeof Package> = {
  manufacturer: Factory,
  distributor_warehouse: Package,
  in_transit: Truck,
  retail_shelf: Store,
};

const LOCATION_TYPE_COLORS: Record<InventoryItem["locationType"], string> = {
  manufacturer: "bg-accent/10 text-accent",
  distributor_warehouse: "bg-muted/80 text-foreground",
  in_transit: "bg-primary/10 text-primary",
  retail_shelf: "bg-success/10 text-success",
};

/** Roles allowed to receive stock (matches server-side inventory:write permission)
 * Distributors receive from manufacturers, brand/ops receive from production.
 */
const CAN_RECEIVE_STOCK_ROLES = new Set(["brand_operator", "operations", "distributor"]);

function computeInventorySummary(items: InventoryItem[]) {
  const s = {
    totalOnHand: 0,
    available: 0,
    reserved: 0,
    inTransit: 0,
    atManufacturer: 0,
    atRetail: 0,
    damaged: 0,
  };
  for (const i of items) {
    s.totalOnHand += i.quantityBottles;
    
    if (i.status === "available") {
      s.available += i.quantityBottles;
    } else if (i.status === "reserved") {
      s.reserved += i.quantityBottles;
    } else if (i.status === "damaged") {
      s.damaged += i.quantityBottles;
    }
    
    // By location type
    if (i.locationType === "in_transit") {
      s.inTransit += i.quantityBottles;
    } else if (i.locationType === "manufacturer") {
      s.atManufacturer += i.quantityBottles;
    } else if (i.locationType === "retail_shelf") {
      s.atRetail += i.quantityBottles;
    }
  }
  return s;
}

function parseStatusParam(raw: string | null): InventoryItem["status"] | null {
  if (!raw) return null;
  return STATUS_VALUES.includes(raw as InventoryItem["status"]) ? (raw as InventoryItem["status"]) : null;
}

function parseLocationTypeParam(raw: string | null): InventoryItem["locationType"] | null {
  if (!raw) return null;
  const valid: InventoryItem["locationType"][] = ["manufacturer", "distributor_warehouse", "in_transit", "retail_shelf"];
  return valid.includes(raw as InventoryItem["locationType"]) ? (raw as InventoryItem["locationType"]) : null;
}

export default function Inventory() {
  const { data, loading } = useAppData();
  const { 
    items, 
    allItems,
    receiveLine, 
    setItemStatus: setItemStatusCtx,
    availableSourceWarehouses,
  } = useInventoryForRole();
  const { user } = useAuth();

  if (loading) {
    return <InventorySkeleton />;
  }
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = parseStatusParam(searchParams.get("status"));
  const locationTypeFilter = parseLocationTypeParam(searchParams.get("location"));
  const [search, setSearch] = useState("");
  
  useEffect(() => {
    const sku = searchParams.get("sku");
    if (sku) setSearch(sku);
  }, [searchParams]);
  
  const [receiveOpen, setReceiveOpen] = useState(false);

  const canReceiveStock = user?.role ? CAN_RECEIVE_STOCK_ROLES.has(user.role) : false;
  const isShowingFilteredView = items.length !== allItems.length;

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
      if (locationTypeFilter && i.locationType !== locationTypeFilter) return false;
      return (
        (i.productName?.toLowerCase() || "").includes(q) ||
        (i.sku?.toLowerCase() || "").includes(q) ||
        (i.batchLot?.toLowerCase() || "").includes(q) ||
        (i.warehouse?.toLowerCase() || "").includes(q)
      );
    });
  }, [search, statusFilter, locationTypeFilter, items]);

  const clearFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("status");
    next.delete("location");
    setSearchParams(next, { replace: true });
  };

  const applyStatus = (status: InventoryItem["status"] | null) => {
    const next = new URLSearchParams(searchParams);
    if (status) next.set("status", status);
    else next.delete("status");
    setSearchParams(next, { replace: true });
  };

  const applyLocationType = (location: InventoryItem["locationType"] | null) => {
    const next = new URLSearchParams(searchParams);
    if (location) next.set("location", location);
    else next.delete("location");
    setSearchParams(next, { replace: true });
  };

  const statusChips: { id: string; label: string; status: InventoryItem["status"] | null }[] = [
    { id: "all", label: "All statuses", status: null },
    { id: "available", label: "Available", status: "available" },
    { id: "reserved", label: "Reserved", status: "reserved" },
    { id: "damaged", label: "Damaged", status: "damaged" },
  ];

  const locationChips: { id: InventoryItem["locationType"] | "all"; label: string; icon: typeof Package }[] = [
    { id: "all", label: "All locations", icon: Package },
    { id: "manufacturer", label: "Manufacturer", icon: Factory },
    { id: "distributor_warehouse", label: "Warehouse", icon: Package },
    { id: "in_transit", label: "In Transit", icon: Truck },
    { id: "retail_shelf", label: "Retail", icon: Store },
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
            <CSVImportButton
              defaultType="inventory"
              variant="outline"
              size="sm"
              onSuccess={() => toast.success("Inventory updated", { description: "Refresh to see changes" })}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => downloadInventoryCsv(items)}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  All Inventory
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadLowStockCsv(items)}>
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-warning" />
                  Low Stock Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {canReceiveStock ? (
              <Button type="button" size="sm" className="w-full justify-center touch-manipulation sm:w-auto" onClick={() => setReceiveOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Receive Stock
              </Button>
            ) : null}
          </div>
        }
      />

      {/* Role-based view indicator */}
      {isShowingFilteredView && (
        <div className="mb-4 rounded-lg border bg-info/10 p-3 text-sm text-info-foreground">
          <p className="font-medium">Role-based view</p>
          <p>Showing inventory visible to {user?.role?.replace(/_/g, " ")} role. Some locations may be hidden based on permissions.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 mb-4">
        <StatCard
          label="Total"
          value={summary.totalOnHand.toLocaleString()}
          subtitle="bottles"
          icon={Package}
          onClick={() => { applyStatus(null); applyLocationType(null); }}
          isActive={statusFilter === null && locationTypeFilter === null}
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
          label="At Mfg"
          value={summary.atManufacturer.toLocaleString()}
          subtitle="bottles"
          icon={Factory}
          onClick={() => applyLocationType("manufacturer")}
          isActive={locationTypeFilter === "manufacturer"}
        />
        <StatCard
          label="Warehouse"
          value={(summary.available + summary.reserved - summary.inTransit - summary.atRetail).toLocaleString()}
          subtitle="bottles"
          icon={Package}
          onClick={() => applyLocationType("distributor_warehouse")}
          isActive={locationTypeFilter === "distributor_warehouse"}
        />
        <StatCard
          label="In Transit"
          value={summary.inTransit.toLocaleString()}
          subtitle="bottles"
          icon={Truck}
          onClick={() => applyLocationType("in_transit")}
          isActive={locationTypeFilter === "in_transit"}
        />
        <StatCard
          label="Retail"
          value={summary.atRetail.toLocaleString()}
          subtitle="bottles"
          icon={Store}
          onClick={() => applyLocationType("retail_shelf")}
          isActive={locationTypeFilter === "retail_shelf"}
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

      {/* Location type filter chips */}
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter inventory by location">
        {locationChips.map((chip) => {
          const Icon = chip.icon;
          const active = chip.id === "all" ? locationTypeFilter === null : locationTypeFilter === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => applyLocationType(chip.id === "all" ? null : chip.id)}
              className={cn(
                "flex items-center gap-1.5 min-h-9 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors touch-manipulation",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Status filter chips */}
      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter inventory by status">
        {statusChips.map((chip) => {
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
              {statusFilter || locationTypeFilter ? (
                <>
                  Filter: {" "}
                  {statusFilter && <strong className="capitalize text-foreground">{statusFilter}</strong>}
                  {statusFilter && locationTypeFilter && " · "}
                  {locationTypeFilter && <strong className="capitalize text-foreground">{LOCATION_TYPE_LABELS[locationTypeFilter]}</strong>}
                </>
              ) : (
                <>
                  Showing <strong className="text-foreground">all</strong> inventory
                </>
              )}
              <span className="text-muted-foreground"> ({filtered.length} rows)</span>
            </span>
            {(statusFilter || locationTypeFilter) ? (
              <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0 touch-manipulation" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
          
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search SKU, product, batch, or warehouse..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          
          <div className="-mx-4 overflow-x-auto touch-pan-x px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[1200px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">SKU</th>
                  <th className="pb-3 font-medium text-muted-foreground">Location Type</th>
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
                    <td colSpan={11} className="py-10 text-center text-sm text-muted-foreground">
                      No rows match this filter. Try another filter or clear all filters.
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
                    const LocationIcon = LOCATION_TYPE_ICONS[item.locationType];
                    return (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-mono text-xs">
                        <span className="block">{item.sku}</span>
                        <span className="text-[11px] font-normal text-muted-foreground">{item.productName}</span>
                      </td>
                      <td className="py-3">
                        <Badge 
                          variant="secondary" 
                          className={`${LOCATION_TYPE_COLORS[item.locationType]} border-0`}
                        >
                          <LocationIcon className="mr-1 h-3 w-3" />
                          {LOCATION_TYPE_LABELS[item.locationType]}
                        </Badge>
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
