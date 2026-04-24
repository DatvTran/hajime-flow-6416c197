/**
 * DistributorInventoryAdjustmentsPage
 * List inventory adjustment requests and submit new ones.
 */

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InventoryAdjustmentDialog } from "@/components/InventoryAdjustmentDialog";
import { useInventoryAdjustments, useAppData } from "@/contexts/AppDataContext";
import { DistributorSkeleton } from "@/components/skeletons";
import { ClipboardList, Plus, Scale } from "lucide-react";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

export default function DistributorInventoryAdjustmentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { adjustments, fetchAdjustments } = useInventoryAdjustments();
  const { data, loading } = useAppData();

  if (loading) {
    return <DistributorSkeleton />;
  }

  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);

  const pendingCount = adjustments.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Adjustments"
        description="Reconcile physical counts with system inventory. Requests are sent to Brand Operator for approval."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="font-display text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tabular-nums">{adjustments.length}</p>
            <p className="text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <Scale className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="font-display text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tabular-nums">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">awaiting HQ approval</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div />
        <Button onClick={() => setDialogOpen(true)} className="touch-manipulation">
          <Plus className="mr-2 h-4 w-4" />
          New Adjustment Request
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Adjustment History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[min(500px,60vh)] pr-2">
            {adjustments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No adjustment requests yet. Submit one to reconcile inventory counts.
              </p>
            ) : (
              <div className="space-y-3">
                {adjustments.map((adj) => {
                  const account = data.accounts.find((a) => a.id === adj.accountId);
                  return (
                    <div
                      key={adj.id}
                      className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">{adj.id}</span>
                            <Badge
                              variant="outline"
                              className={statusStyles[adj.status] || "bg-muted text-foreground"}
                            >
                              {adj.status}
                            </Badge>
                          </div>
                          <p className="mt-1 font-medium">
                            {account?.tradingName || account?.legalName || adj.accountId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            SKU: {adj.sku} · Type: {adj.adjustmentType.replace(/_/g, " ")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="tabular-nums">
                            Expected: {adj.quantityExpected} · Actual: {adj.quantityActual}
                          </p>
                          <p
                            className={`tabular-nums font-medium ${
                              adj.quantityAdjustment >= 0
                                ? "text-emerald-600"
                                : "text-destructive"
                            }`}
                          >
                            Adjustment: {adj.quantityAdjustment > 0 ? "+" : ""}
                            {adj.quantityAdjustment} bottles
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Requested {new Date(adj.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {adj.reason && (
                        <p className="mt-2 border-l-2 border-border pl-3 text-xs text-muted-foreground">
                          {adj.reason}
                        </p>
                      )}
                      {adj.status === "rejected" && adj.rejectionReason && (
                        <p className="mt-2 text-xs text-destructive">
                          Rejection: {adj.rejectionReason}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <InventoryAdjustmentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
