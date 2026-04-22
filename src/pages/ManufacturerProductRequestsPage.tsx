import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNewProductRequests } from "@/contexts/AppDataContext";
import { Factory, FileText, ChevronRight, Plus, Calendar, Package, DollarSign } from "lucide-react";
import { ManufacturerProposalDialog } from "@/components/ManufacturerProposalDialog";
import { ManufacturerNewProductDialog } from "@/components/ManufacturerNewProductDialog";

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  under_review: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  proposed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  declined: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  proposed: "Proposal Sent",
  approved: "Approved by Brand",
  rejected: "Rejected by Brand",
  declined: "Declined",
};

export default function ManufacturerProductRequestsPage() {
  const { newProductRequests, patchNewProductRequest, addNewProductRequest } = useNewProductRequests();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const assigned = useMemo(
    () => newProductRequests.filter((n) => n.status !== "draft" && n.assignedManufacturer === "Kirin Brewery Co."),
    [newProductRequests]
  );

  const pendingCount = useMemo(
    () => assigned.filter((n) => n.status === "submitted").length,
    [assigned]
  );

  const inReviewCount = useMemo(
    () => assigned.filter((n) => n.status === "under_review").length,
    [assigned]
  );

  const selected = useMemo(
    () => (selectedId ? assigned.find((n) => n.id === selectedId) ?? null : null),
    [assigned, selectedId]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Product Requests"
        description="Review product development requests from Hajime HQ, or propose new SKU formulations for brand approval."
        actions={
          <Button className="touch-manipulation" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Propose New SKU
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card-interactive p-4 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Pending Review</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{pendingCount}</p>
        </div>
        <div className="card-interactive p-4 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">In Review</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{inReviewCount}</p>
        </div>
        <div className="card-interactive p-4 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total Active</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{assigned.length}</p>
        </div>
      </div>

      {assigned.length === 0 ? (
        <div className="card-elevated py-12">
          <div className="flex flex-col items-center gap-2 text-center">
            <Factory className="h-7 w-7 text-muted-foreground/20" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">No active product requests from Hajime HQ</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {assigned.map((npr) => (
            <div
              key={npr.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedId(npr.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId(npr.id);
                }
              }}
              className="card-interactive group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold underline-offset-2 group-hover:underline">
                      {npr.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{npr.id}</p>
                  </div>
                  <Badge className={`text-[10px] ${STATUS_STYLES[npr.status]}`}>
                    {STATUS_LABELS[npr.status]}
                  </Badge>
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
                    {npr.specs.baseSpirit.replace(/_/g, " ")} · {npr.specs.targetAbv}% ABV
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
                    Target launch: {npr.specs.targetLaunchDate}
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
                    MOQ: {npr.specs.minimumOrderQuantity.toLocaleString()} bottles
                  </div>
                  {npr.manufacturerProposal ? (
                    <div className="flex items-center gap-2 text-xs">
                      <DollarSign className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
                      <span>
                        Proposal: ${npr.manufacturerProposal.costs.totalPerBottle.toFixed(2)}/bottle
                      </span>
                    </div>
                  ) : null}
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-primary">
                  {npr.status === "submitted" || npr.status === "under_review"
                    ? "Review \u0026 respond"
                    : "View details"}{" "}
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ManufacturerProposalDialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelectedId(null)}
        request={selected}
        onPatch={patchNewProductRequest}
      />

      <ManufacturerNewProductDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        existingRequests={newProductRequests}
        onCreate={addNewProductRequest}
      />
    </div>
  );
}
