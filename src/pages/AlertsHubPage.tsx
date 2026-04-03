import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { deriveAlerts } from "@/lib/hajime-metrics";
import { AlertTriangle } from "lucide-react";

export default function AlertsHubPage() {
  const { data } = useAppData();
  const { user } = useAuth();

  const alerts = useMemo(() => {
    const all = deriveAlerts(data);
    if (user.role === "manufacturer") {
      return all.filter((a) => a.type !== "payment");
    }
    if (user.role === "retail") {
      return all.filter((a) => !["payment", "reorder"].includes(a.type));
    }
    return all;
  }, [data, user.role]);

  return (
    <div>
      <PageHeader
        title="Alerts"
        description="Unified signals from inventory, demand, shipments, and payments — same derived rules for every role; visibility is permission-scoped (spec §5–6)."
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Active queue</CardTitle>
          <p className="text-sm text-muted-foreground">
            {user.role === "manufacturer"
              ? "Manufacturer view excludes retailer payment detail."
              : user.role === "retail"
                ? "Retail view hides payment and HQ reorder suggestions; shipment and availability signals only."
                : "Low stock, demand spikes, delays, and reorder hints roll up from live AppData."}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No alerts.</p>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 rounded-lg border p-3">
                <AlertTriangle
                  className={`mt-0.5 h-4 w-4 shrink-0 ${alert.severity === "high" ? "text-destructive" : alert.severity === "medium" ? "text-warning" : "text-muted-foreground"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">{alert.message}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusBadge status={alert.severity} />
                    <span className="text-[11px] text-muted-foreground">{alert.time}</span>
                    <span className="text-[11px] capitalize text-muted-foreground">({alert.type.replace(/-/g, " ")})</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
