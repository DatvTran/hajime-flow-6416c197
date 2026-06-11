import type { MyIncentiveProgressData } from "@/lib/api-v1-mutations";
import { Link2 } from "lucide-react";

type Props = {
  data: MyIncentiveProgressData;
  className?: string;
};

/** Shows how HQ incentive rows connect distributor, rep, and retail (read-only). */
export function SupplyChainProgramNetwork({ data, className }: Props) {
  const net = data.network;
  if (!net || (net.repCount === 0 && net.retailAccountCount === 0 && net.distributorCount === 0)) {
    return null;
  }

  return (
    <div className={className}>
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <Link2 className="size-3.5" strokeWidth={1.75} />
        Supply chain link · synced from HQ
      </p>
      <div className="grid gap-2 text-xs sm:grid-cols-3">
        {data.scope === "distributor" || net.distributorCount > 0 ? (
          <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            <p className="font-medium text-foreground">Distributor</p>
            <p className="mt-0.5 text-muted-foreground">
              {data.scope === "distributor" && data.partner?.name
                ? data.partner.name
                : net.distributors.join(", ") || "—"}
            </p>
          </div>
        ) : null}
        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
          <p className="font-medium text-foreground">Sales reps</p>
          <p className="mt-0.5 text-muted-foreground">
            {net.reps.length > 0 ? net.reps.join(", ") : data.scope === "sales_rep" ? "You" : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
          <p className="font-medium text-foreground">Retail accounts</p>
          <p className="mt-0.5 text-muted-foreground">
            {net.retailAccounts.length > 0
              ? net.retailAccounts.join(", ")
              : data.scope === "retail" && data.retailTradingName
                ? data.retailTradingName
                : "—"}
          </p>
        </div>
      </div>
      {data.scope === "retail" && (data.servicingDistributor || data.assignedRep) ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {data.servicingDistributor ? (
            <>
              Serviced by <span className="font-medium text-foreground">{data.servicingDistributor}</span>
            </>
          ) : null}
          {data.servicingDistributor && data.assignedRep ? " · " : null}
          {data.assignedRep ? (
            <>
              Field rep <span className="font-medium text-foreground">{data.assignedRep}</span>
            </>
          ) : null}
          <span className="text-muted-foreground/80"> — logged in Hajime HQ Incentive Manager.</span>
        </p>
      ) : null}
    </div>
  );
}
