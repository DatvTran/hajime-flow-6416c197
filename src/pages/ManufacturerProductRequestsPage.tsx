import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNewProductRequests } from "@/contexts/AppDataContext";
import { Factory, FileText, ChevronRight, Plus } from "lucide-react";
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Pending Review</p>
            <p className="font-display text-2xl font-semibold">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">In Review</p>
            <p className="font-display text-2xl font-semibold">{inReviewCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Total Active</p>
            <p className="font-display text-2xl font-semibold">{assigned.length}</p>
          </CardContent>
        </Card>
      </div>

      {assigned.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Factory className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No active product requests from Hajime HQ.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assigned.map((npr) => (
            <Card
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
              className="group cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <CardContent className="pt-5">
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
                    <FileText className="h-3.5 w-3.5" />
                    {npr.specs.baseSpirit.replace(/_/g, " ")} · {npr.specs.targetAbv}% ABV
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">📅</span>
                    Target launch: {npr.specs.targetLaunchDate}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">📦</span>
                    MOQ: {npr.specs.minimumOrderQuantity.toLocaleString()} bottles
                  </div>
                  {npr.manufacturerProposal ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span>
                        💰 Proposal: ${npr.manufacturerProposal.costs.totalPerBottle.toFixed(2)}/bottle
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
              </CardContent>
            </Card>
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
