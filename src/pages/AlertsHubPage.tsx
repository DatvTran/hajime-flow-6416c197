import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppData } from "@/contexts/AppDataContext";
import { AlertsHubSkeleton } from "@/components/skeletons";
import { useAuth } from "@/contexts/AuthContext";
import { deriveAlerts } from "@/lib/hajime-metrics";
import { resolveAlertHref } from "@/lib/alert-links";
import { AlertTriangle, ChevronRight } from "lucide-react";

export default function AlertsHubPage() {
  const { data, loading } = useAppData();
  const { user } = useAuth();

  if (loading) {
    return <AlertsHubSkeleton />;
  }

  const location = useLocation();

  const alerts = useMemo(() => {
    const all = deriveAlerts(data);
    if (user.role === "manufacturer") {
      // Manufacturers see: inventory low-stock, delays, shipments, reorders
      // Exclude: retailer payments AND retailer shelf stock alerts
      return all.filter((a) => a.type !== "payment" && !a.id.startsWith("retail-shelf-"));
    }
    if (user.role === "retail") {
      // Retailers see: their own shelf stock, shipments, demand spikes
      // Exclude: payment (other retailers), reorder (HQ suggestions)
      return all.filter((a) => !["payment", "reorder"].includes(a.type));
    }
    return all;
  }, [data, user.role]);

  useEffect(() => {
    if (location.hash !== "#active-queue") return;
    const el = document.getElementById("active-queue");
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [location.hash]);

  return (
    <div>
      <PageHeader
        title="Alerts"
        description="Unified signals from inventory, demand, shipments, and payments — same derived rules for every role; visibility is permission-scoped (spec §5–6)."
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">
            <Link
              to="#active-queue"
              className="text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Active queue
            </Link>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {user.role === "manufacturer"
              ? "Manufacturer view: warehouse inventory, production delays, and shipments. Excludes retailer-specific alerts and payments."
              : user.role === "retail"
                ? "Retail view: your shelf stock, shipments, and demand signals. Hides other retailers' data and HQ reorder suggestions."
                : user.role === "distributor"
                  ? "Wholesaler view: inventory, shipments, and retailer onboarding applications awaiting your review."
                  : user.role === "brand_operator"
                    ? "HQ view: low stock, demand spikes, delays, reorder hints, and retailer onboarding awaiting brand approval."
                    : "Low stock, demand spikes, delays, reorder hints, and retailer onboarding pipeline."}
          </p>
        </CardHeader>
        <CardContent id="active-queue" className="space-y-3 scroll-mt-24" tabIndex={-1}>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No alerts.</p>
          ) : (
            alerts.map((alert) => (
              <Link
                key={alert.id}
                to={resolveAlertHref(alert, user.role)}
                className="group flex items-start gap-3 rounded-lg border p-3 text-left no-underline transition-colors hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <AlertTriangle
                  className={`mt-0.5 h-4 w-4 shrink-0 ${alert.severity === "high" ? "text-destructive" : alert.severity === "medium" ? "text-warning" : "text-muted-foreground"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-foreground">{alert.message}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusBadge status={alert.severity} />
                    <span className="text-[11px] text-muted-foreground">{alert.time}</span>
                    <span className="text-[11px] capitalize text-muted-foreground">({alert.type.replace(/-/g, " ")})</span>
                  </div>
                </div>
                <ChevronRight
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                  aria-hidden
                />
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
