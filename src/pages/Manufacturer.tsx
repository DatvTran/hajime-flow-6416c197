import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { purchaseOrders, productionStatuses } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory, CheckCircle, Clock, AlertTriangle } from "lucide-react";

const stages = [
  "PO Received", "Materials Secured", "Scheduled", "In Production",
  "Bottled", "Labelled", "Packed", "Ready to Ship", "Shipped", "Delivered"
];

function getStageIndex(stage: string) {
  const idx = stages.findIndex((s) => s.toLowerCase() === stage.toLowerCase());
  return idx >= 0 ? idx : -1;
}

export default function Manufacturer() {
  const activePOs = purchaseOrders.filter((po) => po.status !== "draft");

  return (
    <div>
      <PageHeader
        title="Manufacturer Portal"
        description="Production tracking and coordination with Kirin Brewery Co."
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10"><CheckCircle className="h-5 w-5 text-success" /></div>
          <div><p className="text-xs text-muted-foreground">On Track</p><p className="text-xl font-display font-semibold">2</p></div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10"><Clock className="h-5 w-5 text-accent" /></div>
          <div><p className="text-xs text-muted-foreground">Pending Approval</p><p className="text-xl font-display font-semibold">1</p></div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
          <div><p className="text-xs text-muted-foreground">Delayed</p><p className="text-xl font-display font-semibold">1</p></div>
        </Card>
      </div>

      <div className="space-y-4">
        {activePOs.map((po) => {
          const updates = productionStatuses.filter((s) => s.poId === po.id);
          const latestStage = updates[0]?.stage || "PO Received";
          const currentIdx = getStageIndex(latestStage);

          return (
            <Card key={po.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-display text-base">{po.id}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{po.sku} — {po.quantity.toLocaleString()} bottles for {po.marketDestination}</p>
                  </div>
                  <StatusBadge status={po.status} />
                </div>
              </CardHeader>
              <CardContent>
                {/* Stage tracker */}
                <div className="mb-4 flex items-center gap-1 overflow-x-auto pb-2">
                  {stages.map((stage, idx) => (
                    <div key={stage} className="flex items-center">
                      <div className={`flex h-6 items-center rounded-full px-2.5 text-[10px] font-medium whitespace-nowrap ${
                        idx <= currentIdx && latestStage !== "Delayed"
                          ? "bg-success/10 text-success"
                          : idx === currentIdx + 1 ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                      }`}>
                        {stage}
                      </div>
                      {idx < stages.length - 1 && <div className={`mx-1 h-px w-3 ${idx < currentIdx ? "bg-success" : "bg-border"}`} />}
                    </div>
                  ))}
                </div>

                {/* Update log */}
                {updates.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Recent Updates</p>
                    <div className="space-y-2">
                      {updates.map((u, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <span className="shrink-0 text-xs text-muted-foreground">{u.updatedAt}</span>
                          <span className="font-medium">{u.stage}</span>
                          <span className="text-muted-foreground">— {u.notes}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
