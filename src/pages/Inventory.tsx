import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { inventoryItems, inventorySummary } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Plus, Search, Download } from "lucide-react";
import { useState } from "react";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const filtered = inventoryItems.filter(
    (i) => i.productName.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()) || i.batchLot.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Track stock by SKU, batch, and location"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" />Receive Stock</Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        <StatCard label="On Hand" value={inventorySummary.totalOnHand.toLocaleString()} icon={Package} />
        <StatCard label="Available" value={inventorySummary.available.toLocaleString()} variant="success" />
        <StatCard label="Reserved" value={inventorySummary.reserved.toLocaleString()} variant="accent" />
        <StatCard label="In Transit" value={inventorySummary.inTransit.toLocaleString()} />
        <StatCard label="Damaged" value={inventorySummary.damaged.toLocaleString()} variant="warning" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search SKU, product, or batch..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">SKU</th>
                  <th className="pb-3 font-medium text-muted-foreground">Product</th>
                  <th className="pb-3 font-medium text-muted-foreground">Batch</th>
                  <th className="pb-3 font-medium text-muted-foreground">Qty (Bottles)</th>
                  <th className="pb-3 font-medium text-muted-foreground">Cases</th>
                  <th className="pb-3 font-medium text-muted-foreground">Warehouse</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 font-mono text-xs">{item.sku}</td>
                    <td className="py-3 font-medium">{item.productName}</td>
                    <td className="py-3 font-mono text-xs">{item.batchLot}</td>
                    <td className="py-3">{item.quantityBottles.toLocaleString()}</td>
                    <td className="py-3">{item.quantityCases}</td>
                    <td className="py-3">{item.warehouse}</td>
                    <td className="py-3"><StatusBadge status={item.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
