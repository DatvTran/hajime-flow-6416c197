import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { salesOrders } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download } from "lucide-react";
import { useState } from "react";

export default function Orders() {
  const [search, setSearch] = useState("");
  const filtered = salesOrders.filter(
    (o) => o.account.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Sales Orders"
        description="Manage customer orders and fulfillment"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" />New Order</Button>
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search order or account..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Order ID</th>
                  <th className="pb-3 font-medium text-muted-foreground">Account</th>
                  <th className="pb-3 font-medium text-muted-foreground">Market</th>
                  <th className="pb-3 font-medium text-muted-foreground">SKU</th>
                  <th className="pb-3 font-medium text-muted-foreground">Qty</th>
                  <th className="pb-3 font-medium text-muted-foreground">Value</th>
                  <th className="pb-3 font-medium text-muted-foreground">Sales Rep</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 font-medium text-muted-foreground">Payment</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 font-mono text-xs font-medium">{order.id}</td>
                    <td className="py-3 font-medium">{order.account}</td>
                    <td className="py-3">{order.market}</td>
                    <td className="py-3 font-mono text-xs">{order.sku}</td>
                    <td className="py-3">{order.quantity}</td>
                    <td className="py-3">${order.price.toLocaleString()}</td>
                    <td className="py-3">{order.salesRep}</td>
                    <td className="py-3"><StatusBadge status={order.status} /></td>
                    <td className="py-3"><StatusBadge status={order.paymentStatus} /></td>
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
