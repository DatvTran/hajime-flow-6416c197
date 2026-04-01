import { Package, ShoppingCart, AlertTriangle, TrendingUp, Truck, Factory, DollarSign, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { inventorySummary, salesSummary, alerts, topAccounts, salesByMonth } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  return (
    <div>
      <PageHeader title="Dashboard" description="Real-time overview of Hajime B2B operations" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Available Inventory" value={inventorySummary.available.toLocaleString()} subtitle="bottles" icon={Package} variant="success" />
        <StatCard label="Reserved" value={inventorySummary.reserved.toLocaleString()} subtitle="bottles" icon={Package} variant="accent" />
        <StatCard label="In Production" value={inventorySummary.inProduction.toLocaleString()} subtitle="bottles" icon={Factory} />
        <StatCard label="In Transit" value={inventorySummary.inTransit.toLocaleString()} subtitle="bottles" icon={Truck} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open Orders" value={salesSummary.openOrders} icon={ShoppingCart} />
        <StatCard label="Sales This Month" value={`$${(salesSummary.thisMonth / 1000).toFixed(0)}K`} icon={DollarSign} trend={12.4} variant="success" />
        <StatCard label="Sales This Quarter" value={`$${(salesSummary.thisQuarter / 1000).toFixed(0)}K`} icon={TrendingUp} trend={18.2} />
        <StatCard label="Active Accounts" value={6} icon={Users} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
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

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 rounded-lg border p-3">
                <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${alert.severity === "high" ? "text-destructive" : alert.severity === "medium" ? "text-warning" : "text-muted-foreground"}`} />
                <div className="min-w-0">
                  <p className="text-sm leading-snug">{alert.message}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge status={alert.severity} />
                    <span className="text-[11px] text-muted-foreground">{alert.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top Accounts */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-display text-lg">Top Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Account</th>
                  <th className="pb-3 font-medium text-muted-foreground">Revenue</th>
                  <th className="pb-3 font-medium text-muted-foreground">Orders</th>
                  <th className="pb-3 font-medium text-muted-foreground">Trend</th>
                </tr>
              </thead>
              <tbody>
                {topAccounts.map((acc) => (
                  <tr key={acc.name} className="border-b last:border-0">
                    <td className="py-3 font-medium">{acc.name}</td>
                    <td className="py-3">${acc.revenue.toLocaleString()}</td>
                    <td className="py-3">{acc.orders}</td>
                    <td className="py-3">
                      <span className={acc.trend >= 0 ? "text-success" : "text-destructive"}>
                        {acc.trend >= 0 ? "+" : ""}{acc.trend}%
                      </span>
                    </td>
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
