import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { salesByMonth, inventoryByStatus, topAccounts, salesOrders, inventoryItems } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Reports() {
  const ordersByStatus = salesOrders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const orderStatusData = Object.entries(ordersByStatus).map(([status, count]) => ({ status, count }));

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Analytics and exportable business reports"
        actions={<Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export All CSV</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={salesByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v / 1000}K`} />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 13 }} />
                <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Inventory by Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={inventoryByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label={({ status, count }) => `${status}: ${count}`} labelLine={{ stroke: "hsl(var(--muted-foreground))" }} fontSize={11}>
                  {inventoryByStatus.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Orders by Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={orderStatusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="status" type="category" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" width={80} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 13 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Top Accounts by Revenue</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topAccounts.map((acc, i) => (
                <div key={acc.name} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{acc.name}</span>
                      <span className="text-sm font-medium">${acc.revenue.toLocaleString()}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${(acc.revenue / topAccounts[0].revenue) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
