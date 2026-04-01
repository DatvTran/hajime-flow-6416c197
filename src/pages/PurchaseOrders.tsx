import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { purchaseOrders } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";

export default function PurchaseOrders() {
  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        description="Manage production orders to manufacturer"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" />New PO</Button>
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">PO Number</th>
                  <th className="pb-3 font-medium text-muted-foreground">Manufacturer</th>
                  <th className="pb-3 font-medium text-muted-foreground">SKU</th>
                  <th className="pb-3 font-medium text-muted-foreground">Qty</th>
                  <th className="pb-3 font-medium text-muted-foreground">Required Date</th>
                  <th className="pb-3 font-medium text-muted-foreground">Market</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 font-medium text-muted-foreground">Notes</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 font-mono text-xs font-medium">{po.id}</td>
                    <td className="py-3">{po.manufacturer}</td>
                    <td className="py-3 font-mono text-xs">{po.sku}</td>
                    <td className="py-3">{po.quantity.toLocaleString()}</td>
                    <td className="py-3">{po.requiredDate}</td>
                    <td className="py-3">{po.marketDestination}</td>
                    <td className="py-3"><StatusBadge status={po.status} /></td>
                    <td className="py-3 max-w-[200px] truncate text-muted-foreground">{po.notes}</td>
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
