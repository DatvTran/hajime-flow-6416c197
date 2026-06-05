import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccounts, useAppData, useSalesOrders } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { resolveSalesRepLabelForSession } from "@/data/team-roster";
import { filterAccountsForSalesRep } from "@/lib/sales-rep-scope";
import { computeSalesRepOpportunities } from "@/lib/sales-rep-opportunities";
import {
  PIPELINE_STAGES,
  ageBadgeClass,
  groupPipelineByStage,
  pipelineStageTotals,
  salesRepTerritoryLabel,
  stagePillClass,
  toPipelineCards,
  type PipelineCardView,
} from "@/lib/sales-rep-pipeline";
import { cn } from "@/lib/utils";

function accountHref(card: PipelineCardView): string {
  return `/sales/accounts?account=${encodeURIComponent(card.accountId)}`;
}

function PipelineKanbanCard({ card }: { card: PipelineCardView }) {
  return (
    <Link
      to={accountHref(card)}
      className="mb-2 block rounded-[10px] border border-border/70 bg-card p-3.5 transition-[box-shadow,transform] hover:-translate-y-px hover:shadow-[var(--shadow-lifted)]"
    >
      <p className="text-[13px] font-semibold leading-snug">{card.account}</p>
      <p className="mt-0.5 font-mono text-xs font-medium text-accent">
        ${card.displayValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </p>
      <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{card.nextAction}</p>
      <span
        className={cn(
          "mt-2 inline-flex rounded-full px-[7px] py-0.5 text-[10px] font-medium",
          ageBadgeClass(card.ageVariant),
        )}
      >
        {card.ageLabel}
      </span>
    </Link>
  );
}

export default function SalesOpportunitiesPage() {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const { salesOrders } = useSalesOrders();
  const { data } = useAppData();
  const teamMembers = data.teamMembers ?? [];

  const repName = useMemo(
    () => resolveSalesRepLabelForSession(user?.email, user?.displayName),
    [user?.email, user?.displayName],
  );

  const myAccounts = useMemo(() => {
    if (!user) return [];
    return filterAccountsForSalesRep(accounts, user, teamMembers);
  }, [accounts, teamMembers, user]);

  const cards = useMemo(() => {
    const opps = computeSalesRepOpportunities(accounts, salesOrders, repName);
    return toPipelineCards(opps);
  }, [accounts, salesOrders, repName]);

  const grouped = useMemo(() => groupPipelineByStage(cards), [cards]);
  const totals = useMemo(() => pipelineStageTotals(cards), [cards]);
  const territory = useMemo(() => salesRepTerritoryLabel(myAccounts), [myAccounts]);

  const pipelineValue = useMemo(() => cards.reduce((s, c) => s + c.displayValue, 0), [cards]);

  return (
    <div className="mx-auto max-w-[1400px] animate-enter space-y-6 pb-20">
      {/* ph-row — matches sales-rep-app.html Pipeline */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.02em] text-foreground">Pipeline</h1>
          <p className="mt-1 max-w-[54ch] text-[13px] leading-relaxed text-muted-foreground">
            ${pipelineValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} across {cards.length} open{" "}
            {cards.length === 1 ? "opportunity" : "opportunities"} · {territory}
          </p>
        </div>
        <Button size="sm" className="h-[30px] shrink-0 touch-manipulation text-xs" asChild>
          <Link to="/sales/accounts">
            <Plus className="mr-1 size-3.5" aria-hidden />
            Add opportunity
          </Link>
        </Button>
      </div>

      {/* Stage summary row */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {PIPELINE_STAGES.map((col) => {
          const t = totals[col.id];
          return (
            <div
              key={col.id}
              className="rounded-xl border border-border/70 bg-card px-4 py-3.5"
            >
              <div className={cn("text-[11px] font-semibold uppercase tracking-[0.08em]", col.color)}>
                {col.id}
              </div>
              <div className="mt-2 font-display text-xl font-semibold tracking-[-0.02em]">
                ${t.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {t.count} {t.count === 1 ? "opp." : "opp."}
              </div>
            </div>
          );
        })}
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 gap-2.5 min-[900px]:grid-cols-3 min-[1200px]:grid-cols-5">
        {PIPELINE_STAGES.map((col) => {
          const columnCards = grouped[col.id];
          return (
            <div key={col.id} className="min-w-0">
              <div
                className={cn(
                  "mb-1.5 flex items-center justify-between px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.08em]",
                  col.color,
                )}
              >
                <span>{col.id}</span>
                <span className="rounded-full bg-muted px-1.5 py-px font-mono text-[10px] font-normal text-muted-foreground">
                  {columnCards.length}
                </span>
              </div>
              {columnCards.length === 0 ? (
                <div className="rounded-[10px] border border-dashed border-border/60 px-3 py-8 text-center text-xs text-muted-foreground">
                  No cards in this stage
                </div>
              ) : (
                columnCards.map((card) => <PipelineKanbanCard key={card.id} card={card} />)
              )}
              <Link
                to="/sales/accounts"
                className="mt-1 block rounded-[10px] border border-dashed border-border/60 py-2.5 text-center text-xs text-muted-foreground transition-colors hover:bg-muted/30"
              >
                + Add
              </Link>
            </div>
          );
        })}
      </div>

      {/* Pipeline detail table */}
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-[18px] font-medium tracking-[-0.01em]">Pipeline detail</h2>
        </div>
        <div className="overflow-hidden rounded-[14px] border border-border/70 bg-card shadow-[var(--shadow-soft)]">
          {cards.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-muted-foreground">
              No open opportunities — your territory accounts are on cadence.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/50">
                    {["Account", "Opportunity", "Stage", "Value", "Age", "Next action"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...cards]
                    .sort((a, b) => PIPELINE_STAGES.findIndex((s) => s.id === a.stage) - PIPELINE_STAGES.findIndex((s) => s.id === b.stage))
                    .map((row) => (
                      <tr
                        key={row.id}
                        className="cursor-pointer border-b border-border/40 transition-colors last:border-b-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 font-medium">
                          <Link to={accountHref(row)} className="hover:text-accent hover:underline">
                            {row.account}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{row.opportunityTitle}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                              stagePillClass(row.stage),
                            )}
                          >
                            {row.stage}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-medium">
                          ${row.displayValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{row.ageLabel}</td>
                        <td className="px-4 py-3 text-xs">{row.nextAction}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
