import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { products } from "@/data/mockData";
import { StatusBadge } from "@/components/StatusBadge";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="System configuration and product catalog" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Company Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Company Name</Label><Input defaultValue="Hajime Inc." /></div>
            <div className="space-y-2"><Label>Primary Market</Label><Input defaultValue="Ontario, Canada" /></div>
            <div className="space-y-2"><Label>Manufacturer</Label><Input defaultValue="Kirin Brewery Co." /></div>
            <div className="space-y-2"><Label>Default Lead Time (days)</Label><Input type="number" defaultValue="45" /></div>
            <div className="space-y-2"><Label>Safety Stock (bottles)</Label><Input type="number" defaultValue="500" /></div>
            <Button className="mt-2">Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-lg">Product Catalog</CardTitle>
              <Button size="sm" variant="outline">Add SKU</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.sku} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{p.name} — {p.size}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.sku} · {p.caseSize} per case</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Low Stock Alerts</p><p className="text-xs text-muted-foreground">Notify when inventory falls below threshold</p></div>
              <Button variant="outline" size="sm">Enabled</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Production Delays</p><p className="text-xs text-muted-foreground">Alert when manufacturer flags issues</p></div>
              <Button variant="outline" size="sm">Enabled</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Reorder Reminders</p><p className="text-xs text-muted-foreground">Suggest reorders based on sales velocity</p></div>
              <Button variant="outline" size="sm">Enabled</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Warehouses</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {["Toronto Main Warehouse", "Milan Depot"].map((wh) => (
              <div key={wh} className="flex items-center justify-between rounded-lg border p-3">
                <p className="text-sm font-medium">{wh}</p>
                <StatusBadge status="active" />
              </div>
            ))}
            <Button variant="outline" size="sm" className="mt-2">Add Warehouse</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
