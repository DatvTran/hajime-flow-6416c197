import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, TrendingDown, AlertCircle, Search } from "lucide-react";
import { useAccounts, useDepletionReports } from "@/contexts/AppDataContext";
import { DepletionReportDialog } from "@/components/DepletionReportDialog";
import type { DepletionReport } from "@/data/mockData";

export default function DistributorDepletionsPage() {
  const { accounts } = useAccounts();
  const { depletionReports, addDepletionReport, patchDepletionReport } = useDepletionReports();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DepletionReport | null>(null);

  const retailAccounts = useMemo(
    () => accounts.filter((a) => a.status === "active" && a.type !== "distributor"),
    [accounts]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return depletionReports;
    return depletionReports.filter((r) => {
      const acc = accounts.find((a) => a.id === r.accountId);
      return (
        (acc?.tradingName || "").toLowerCase().includes(q) ||
        (acc?.legalName || "").toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });
  }, [depletionReports, search, accounts]);

  const totalSold = useMemo(
    () => depletionReports.reduce((sum, r) => sum + r.bottlesSold, 0),
    [depletionReports]
  );
  const flaggedCount = useMemo(
    () => depletionReports.filter((r) => r.flaggedForReplenishment).length,
    [depletionReports]
  );
  const uniqueAccounts = useMemo(
    () => new Set(depletionReports.map((r) => r.accountId)).size,
    [depletionReports]
  );

  const handleSave = (report: Omit<DepletionReport, "id">) => {
    if (editing) {
      patchDepletionReport(editing.id, report);
    } else {
      addDepletionReport(report);
    }
    setEditing(null);
  };

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (r: DepletionReport) => {
    setEditing(r);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report depletions"
        description="Log actual sell-through by account and SKU. This data feeds the Brand Operator dashboard and triggers replenishment alerts."
        actions={
          <Button type="button" size="sm" className="touch-manipulation" onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            New report
          </Button>
        }
      />

      <DepletionReportDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        existing={editing}
        onSave={handleSave}
        readOnly={false}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="font-display text-sm font-medium">Total bottles sold</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tabular-nums">{totalSold.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">All reported periods</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="font-display text-sm font-medium">Accounts reporting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tabular-nums">{uniqueAccounts}</p>
            <p className="text-xs text-muted-foreground">of {retailAccounts.length} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <CardTitle className="font-display text-sm font-medium">Flagged for restock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tabular-nums">{flaggedCount}</p>
            <p className="text-xs text-muted-foreground">Replenishment alerts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="font-display text-sm font-medium">Reports submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tabular-nums">{depletionReports.length}</p>
            <p className="text-xs text-muted-foreground">Total depletion reports</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="font-display text-lg">Depletion reports</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search account or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 touch-manipulation"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="-mx-4 overflow-x-auto touch-pan-x px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[840px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Report</th>
                  <th className="pb-3 font-medium text-muted-foreground">Account</th>
                  <th className="pb-3 font-medium text-muted-foreground">SKU</th>
                  <th className="pb-3 font-medium text-muted-foreground">Period</th>
                  <th className="pb-3 font-medium text-muted-foreground">Sold</th>
                  <th className="pb-3 font-medium text-muted-foreground">On-hand</th>
                  <th className="pb-3 font-medium text-muted-foreground">Flag</th>
                  <th className="pb-3 font-medium text-muted-foreground">Notes</th>
                  <th className="pb-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const acc = accounts.find((a) => a.id === r.accountId);
                  return (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-3 font-mono text-xs">{r.id}</td>
                      <td className="py-3">{acc?.tradingName || acc?.legalName || r.accountId}</td>
                      <td className="py-3 font-mono text-xs">{r.sku}</td>
                      <td className="py-3 tabular-nums">{r.periodStart} → {r.periodEnd}</td>
                      <td className="py-3 tabular-nums font-medium">{r.bottlesSold.toLocaleString()}</td>
                      <td className="py-3 tabular-nums text-muted-foreground">{r.bottlesOnHandAtEnd.toLocaleString()}</td>
                      <td className="py-3">
                        {r.flaggedForReplenishment ? (
                          <Badge variant="destructive" className="text-xs">Restock</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 max-w-[200px] truncate text-muted-foreground">{r.notes}</td>
                      <td className="py-3">
                        <Button variant="outline" size="sm" className="touch-manipulation" onClick={() => openEdit(r)}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No depletion reports found.{" "}
              <Button variant="link" className="h-auto px-0" onClick={openNew}>
                Create one
              </Button>
              .
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
