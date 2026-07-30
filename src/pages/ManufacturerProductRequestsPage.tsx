import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppData, useAccounts, useNewProductRequests } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { TEAM_ROSTER } from "@/data/team-roster";
import {
  filterNprsForManufacturerUser,
  resolveManufacturerAssignmentIdentity,
  resolveManufacturerAssignmentLabel,
} from "@/lib/npr-manufacturer-scope";
import {
  manufacturerNprNeedsResponse,
  manufacturerNprStageLabel,
  nprConceptBrief,
  nprConceptSummary,
  nprUpdatedLabel,
} from "@/lib/hq-product-development-display";
import { Factory, FileText, ChevronRight, Plus, Calendar, Package, DollarSign, Bell } from "lucide-react";
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

const ACTIVE_STATUSES = new Set(["submitted", "under_review", "proposed"]);

export default function ManufacturerProductRequestsPage() {
  const { user } = useAuth();
  const { data } = useAppData();
  const { accounts } = useAccounts();
  const { newProductRequests, patchNewProductRequest, addNewProductRequest, fetchRequests } =
    useNewProductRequests();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    const onFocus = () => void fetchRequests();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchRequests]);

  const teamMembers = data.teamMembers?.length ? data.teamMembers : TEAM_ROSTER;

  const manufacturerIdentity = useMemo(
    () => resolveManufacturerAssignmentIdentity(user?.email, teamMembers, accounts),
    [user?.email, teamMembers, accounts],
  );

  const assigned = useMemo(
    () => filterNprsForManufacturerUser(newProductRequests, manufacturerIdentity),
    [newProductRequests, manufacturerIdentity],
  );

  const activeAssigned = useMemo(
    () => assigned.filter((n) => ACTIVE_STATUSES.has(n.status)),
    [assigned],
  );

  const manufacturerLabel = useMemo(
    () => resolveManufacturerAssignmentLabel(manufacturerIdentity, accounts),
    [manufacturerIdentity, accounts],
  );

  const feasibilityCount = useMemo(
    () => assigned.filter((n) => n.status === "submitted" || n.status === "under_review").length,
    [assigned],
  );

  const nudgedCount = useMemo(
    () => assigned.filter((n) => Boolean(n.brandDecision?.hqNudgedAt)).length,
    [assigned],
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

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="card-interactive p-4 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Feasibility review</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{feasibilityCount}</p>
        </div>
        <div className="card-interactive p-4 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Proposals sent</p>
          <p className="font-display text-2xl font-semibold tabular-nums">
            {assigned.filter((n) => n.status === "proposed").length}
          </p>
        </div>
        <div className="card-interactive p-4 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">HQ Reminders</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{nudgedCount}</p>
        </div>
        <div className="card-interactive p-4 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Active briefs</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{activeAssigned.length}</p>
        </div>
      </div>

      {activeAssigned.length === 0 ? (
        <div className="card-elevated py-12">
          <div className="flex flex-col items-center gap-2 text-center">
            <Factory className="h-7 w-7 text-muted-foreground/20" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">No active product requests from Hajime HQ</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {activeAssigned.map((npr) => {
            const hqNudged = Boolean(npr.brandDecision?.hqNudgedAt);
            const conceptBrief = nprConceptBrief(npr);
            return (
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
              className={`card-interactive group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2${
                hqNudged ? " ring-2 ring-amber-400/60" : ""
              }`}
            >
              <div className="p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display font-semibold underline-offset-2 group-hover:underline">
                      {npr.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{npr.id} · {nprConceptSummary(npr)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {hqNudged ? (
                      <Badge className="bg-amber-100 text-[10px] text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                        <Bell className="mr-1 h-3 w-3" />
                        HQ reminder
                      </Badge>
                    ) : null}
                    <Badge className={`text-[10px] ${STATUS_STYLES[npr.status] ?? ""}`}>
                      {manufacturerNprStageLabel(npr.status)}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  {conceptBrief !== "—" ? (
                    <p className="line-clamp-2 text-[13px] leading-snug text-foreground/90">{conceptBrief}</p>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
                    Target launch: {npr.specs.targetLaunchDate}
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
                    MOQ: {npr.specs.minimumOrderQuantity.toLocaleString()} bottles ·{" "}
                    {npr.specs.packaging.bottleSize}
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
                    Price point: {npr.specs.targetPricePoint.replace(/_/g, " ")}
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
                <div className="mt-4 flex items-center justify-between text-xs font-medium text-primary">
                  <span className="text-muted-foreground">Updated {nprUpdatedLabel(npr)}</span>
                  <span className="flex items-center">
                    {manufacturerNprNeedsResponse(npr.status) ? "Review & respond" : "View details"}
                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
          })}
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
        assignedManufacturer={manufacturerLabel}
        assignedManufacturerEmail={manufacturerIdentity.email}
        assignedCrmMemberId={[...manufacturerIdentity.crmMemberIds][0]}
      />
    </div>
  );
}
