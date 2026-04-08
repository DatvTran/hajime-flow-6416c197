import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import type { VisitNoteEntry } from "@/types/app-data";
import {
  Users,
  FileEdit,
  Target,
  Calendar,
  StickyNote,
  Sparkles,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { resolveSalesRepLabelForSession } from "@/data/team-roster";

const VISIT_STORAGE = "hajime_rep_visit_notes";

function loadLegacyVisits(): Omit<VisitNoteEntry, "authorRep">[] {
  try {
    const raw = localStorage.getItem(VISIT_STORAGE);
    if (!raw) return [];
    const p = JSON.parse(raw) as { id: string; at: string; account: string; body: string }[];
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export default function SalesRepHomePage() {
  const { data, updateData } = useAppData();
  const { user } = useAuth();
  const rep = useMemo(
    () => resolveSalesRepLabelForSession(user?.email, user?.displayName ?? ""),
    [user?.email, user?.displayName],
  );

  const myAccounts = useMemo(
    () => data.accounts.filter((a) => a.salesOwner === rep),
    [data.accounts, rep],
  );

  const myDrafts = useMemo(
    () => data.salesOrders.filter((o) => o.status === "draft" && o.salesRep === rep),
    [data.salesOrders, rep],
  );

  const needsReorder = useMemo(() => {
    const now = Date.now();
    const MS_DAY = 86400000;
    return myAccounts.filter((a) => {
      if (a.status !== "active") return false;
      if (!["retail", "bar", "restaurant", "hotel"].includes(a.type)) return false;
      const t = a.lastOrderDate ? Date.parse(a.lastOrderDate) : NaN;
      if (Number.isNaN(t)) return true;
      return now - t > 40 * MS_DAY;
    });
  }, [myAccounts]);

  const [visitAccount, setVisitAccount] = useState("");
  const [visitBody, setVisitBody] = useState("");
  const legacyMigrated = useRef(false);

  const visits = useMemo(() => {
    const all = data.visitNotes ?? [];
    return all
      .filter((v) => v.authorRep.trim() === rep.trim())
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [data.visitNotes, rep]);

  useEffect(() => {
    if (legacyMigrated.current) return;
    if ((data.visitNotes?.length ?? 0) > 0) {
      legacyMigrated.current = true;
      return;
    }
    const legacy = loadLegacyVisits();
    if (legacy.length === 0) {
      legacyMigrated.current = true;
      return;
    }
    legacyMigrated.current = true;
    updateData((d) => ({
      ...d,
      visitNotes: legacy.map((v) => ({ ...v, authorRep: rep })),
    }));
    try {
      localStorage.removeItem(VISIT_STORAGE);
    } catch {
      /* ignore */
    }
  }, [data.visitNotes, rep, updateData]);

  const schedule = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
    const sorted = [...myAccounts].sort((a, b) => {
      const na = a.nextActionDate || a.lastOrderDate || "";
      const nb = b.nextActionDate || b.lastOrderDate || "";
      return na.localeCompare(nb);
    });
    return days.map((day, i) => {
      const acc = sorted[i];
      return {
        day,
        focus: acc ? `${acc.city} · ${acc.type}` : "Open slot",
        accounts: acc?.tradingName ?? "No account assigned — add touchpoints in Accounts",
      };
    });
  }, [myAccounts]);

  const addVisit = () => {
    const account = visitAccount.trim() || (myAccounts[0]?.tradingName ?? "");
    const body = visitBody.trim();
    if (!account || !body) {
      toast.error("Add account and note");
      return;
    }
    const row: VisitNoteEntry = {
      id: `v-${Date.now()}`,
      at: new Date().toISOString().slice(0, 16).replace("T", " "),
      account,
      body,
      authorRep: rep,
    };
    updateData((d) => ({
      ...d,
      visitNotes: [row, ...(d.visitNotes ?? [])],
    }));
    setVisitBody("");
    toast.success("Visit logged", { description: "Synced to AppData — visible when HQ uses shared data." });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field sales"
        description="Bridge visits, notes, and draft orders — the same order objects HQ approves and distributors fulfill."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              My accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {myAccounts.length === 0 ? (
              <p className="text-muted-foreground">No accounts assigned to {rep} in seed data.</p>
            ) : (
              myAccounts.slice(0, 6).map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 px-2 py-1.5">
                  <span className="min-w-0 truncate font-medium">{a.tradingName}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{a.city}</span>
                </div>
              ))
            )}
            <Button variant="link" className="h-auto px-0 text-xs" asChild>
              <Link to="/sales/accounts">Full directory</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Accounts needing reorder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {needsReorder.length === 0 ? (
              <p className="text-muted-foreground">No accounts flagged on 40d quiet rule.</p>
            ) : (
              needsReorder.slice(0, 5).map((a) => (
                <div key={a.id} className="rounded-lg border border-border/50 px-2 py-1.5">
                  <p className="font-medium">{a.tradingName}</p>
                  <p className="text-xs text-muted-foreground">Last order {a.lastOrderDate || "—"}</p>
                  <Button variant="link" className="mt-1 h-auto px-0 text-xs" asChild>
                    <Link to="/sales/orders?new=1">Draft order</Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <FileEdit className="h-4 w-4" />
              Draft orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-display text-2xl font-semibold">{myDrafts.length}</p>
            <p className="text-xs text-muted-foreground">Awaiting customer or HQ confirmation</p>
            {myDrafts.slice(0, 4).map((o) => (
              <div key={o.id} className="text-xs text-muted-foreground">
                <span className="font-mono text-foreground">{o.id}</span> · {o.account} · {o.market}
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" className="touch-manipulation" asChild>
                <Link to="/sales/orders?tab=pending-review">Open drafts</Link>
              </Button>
              <Button size="sm" variant="outline" className="touch-manipulation" asChild>
                <Link to="/sales/orders?new=1">New draft</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Visit schedule
            </CardTitle>
            <p className="text-xs text-muted-foreground">Built from your assigned accounts (next action / last order).</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {schedule.map((s) => (
              <div key={s.day} className="flex gap-3 rounded-lg border border-border/40 px-3 py-2">
                <span className="w-10 shrink-0 font-display font-semibold">{s.day}</span>
                <div>
                  <p className="font-medium">{s.focus}</p>
                  <p className="text-xs text-muted-foreground">{s.accounts}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <StickyNote className="h-4 w-4" />
              Visit notes
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Stored in shared AppData (not only this browser) when the API or local snapshot saves — HQ can read the same ledger.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Account (trading name)"
                value={visitAccount}
                onChange={(e) => setVisitAccount(e.target.value)}
                className="text-sm"
              />
            </div>
            <Textarea
              placeholder="Note from the floor…"
              value={visitBody}
              onChange={(e) => setVisitBody(e.target.value)}
              rows={3}
              className="text-sm"
            />
            <Button type="button" size="sm" className="touch-manipulation" onClick={addVisit}>
              <Plus className="mr-1 h-4 w-4" />
              Log visit
            </Button>
            <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
              {visits.map((v) => (
                <li key={v.id} className="rounded-md border border-border/50 p-2">
                  <span className="text-muted-foreground">{v.at}</span> · <span className="font-medium">{v.account}</span>
                  <p className="mt-1 text-muted-foreground">{v.body}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70">
        <CardHeader className="pb-2">
          <CardTitle className="font-display flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Premium placements, seasonal packs, and new SKU intros — track in CRM and convert to draft orders.
          </p>
          <Button variant="secondary" size="sm" className="touch-manipulation shrink-0" asChild>
            <Link to="/sales/opportunities">Opportunity list</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
