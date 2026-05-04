import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNewProductRequests } from "@/contexts/AppDataContext";
import { Plus, FileText, ChevronRight, Factory, Calendar, DollarSign, FlaskConical } from "lucide-react";
import { NewProductRequestDialog } from "@/components/NewProductRequestDialog";
import { ProductRequestDetailDialog } from "@/components/ProductRequestDetailDialog";
import { formatBaseSpiritLabel } from "@/lib/base-spirit-options";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  under_review: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  proposed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  declined: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  proposed: "Proposal Received",
  approved: "Approved",
  rejected: "Rejected",
  declined: "Declined",
};

export default function ProductDevelopmentPage() {
  const { newProductRequests, patchNewProductRequest, addNewProductRequest } = useNewProductRequests();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: newProductRequests.length };
    for (const n of newProductRequests) {
      c[n.status] = (c[n.status] || 0) + 1;
    }
    return c;
  }, [newProductRequests]);

  const filtered = useMemo(() => {
    if (filter === "all") return newProductRequests;
    return newProductRequests.filter((n) => n.status === filter);
  }, [newProductRequests, filter]);

  const selected = useMemo(
    () => (selectedId ? newProductRequests.find((n) => n.id === selectedId) ?? null : null),
    [newProductRequests, selectedId]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Development"
        description="Create new product requests, send them to the manufacturer for feasibility review, and track proposals through to production."
        actions={
          <Button className="touch-manipulation" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "All" },
          { key: "draft", label: "Drafts" },
          { key: "under_review", label: "Under Review" },
          { key: "proposed", label: "Proposals" },
          { key: "approved", label: "Approved" },
          { key: "rejected", label: "Rejected / Declined" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f.label} {counts[f.key] ? `(${counts[f.key]})` : ""}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card-elevated py-12">
          <div className="flex flex-col items-center gap-2 text-center">
            <FlaskConical className="h-7 w-7 text-muted-foreground/20" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">No product requests match this filter</p>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
              Create your first request
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((npr) => (
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
                    {formatBaseSpiritLabel(npr.specs.baseSpirit)} · {npr.specs.targetAbv}% ABV
                  </div>
                  <div className="flex items-center gap-2">
                    <Factory className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
                    {npr.assignedManufacturer || "Unassigned"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
                    Target: {npr.specs.targetLaunchDate}
                  </div>
                  {npr.manufacturerProposal ? (
                    <div className="flex items-center gap-2 text-xs">
                      <DollarSign className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
                      <span>
                        ${npr.manufacturerProposal.costs.totalPerBottle.toFixed(2)}/bottle
                      </span>
                    </div>
                  ) : null}
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-primary">
                  View details <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewProductRequestDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={addNewProductRequest}
      />

      <ProductRequestDetailDialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelectedId(null)}
        request={selected}
        onPatch={patchNewProductRequest}
      />
    </div>
  );
}
