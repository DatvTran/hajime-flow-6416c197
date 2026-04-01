import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { shipments } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export default function Shipments() {
  return (
    <div>
      <PageHeader
        title="Shipments"
        description="Track inbound and outbound logistics"
      />

      <div className="space-y-4">
        {shipments.map((s) => (
          <Card key={s.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">{s.id}</span>
                  <StatusBadge status={s.type} />
                  <StatusBadge status={s.status} />
                </div>
                <span className="text-xs text-muted-foreground">Linked: {s.linkedOrder}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium">{s.origin}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{s.destination}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div><span className="text-muted-foreground">Carrier:</span> <span className="font-medium">{s.carrier}</span></div>
                <div><span className="text-muted-foreground">Ship Date:</span> <span className="font-medium">{s.shipDate}</span></div>
                <div><span className="text-muted-foreground">ETA:</span> <span className="font-medium">{s.eta}</span></div>
                <div><span className="text-muted-foreground">Delivered:</span> <span className="font-medium">{s.actualDelivery || "—"}</span></div>
              </div>
              {s.notes && <p className="mt-2 text-xs text-muted-foreground">{s.notes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
