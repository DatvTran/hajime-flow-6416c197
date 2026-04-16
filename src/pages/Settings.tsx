import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/StatusBadge";
import { NewProductDialog } from "@/components/NewProductDialog";
import { EditProductDialog } from "@/components/EditProductDialog";
import { useProducts, useAppData } from "@/contexts/AppDataContext";
import type { Product } from "@/data/mockData";
import { Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RETAIL_ACCOUNT_TRADING_NAME_BY_EMAIL } from "@/data/team-roster";
import type { TeamMember, TeamMemberPortalRole } from "@/types/app-data";
import { CSVImportButton } from "@/components/CSVImportButton";

const TEAM_ROLE_LABELS: Record<TeamMemberPortalRole, string> = {
  sales_rep: "Sales rep",
  retail: "Retail store / account",
  distributor: "Distributor / wholesaler",
  manufacturer: "Manufacturer",
};

const TEAM_ROLE_ORDER: TeamMemberPortalRole[] = ["sales_rep", "retail", "distributor", "manufacturer"];

export default function SettingsPage() {
  const { products, addProduct, removeProduct, patchProduct } = useProducts();
  const { data, updateData } = useAppData();
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<TeamMemberPortalRole>("sales_rep");

  const teamMembers = data.teamMembers ?? [];

  const os = data.operationalSettings!;
  const [leadDays, setLeadDays] = useState(String(os.manufacturerLeadTimeDays));
  const [safetyDefault, setSafetyDefault] = useState("500");
  const [retailShelfThreshold, setRetailShelfThreshold] = useState(String(os.retailerStockThresholdBottles ?? 48));

  useEffect(() => {
    setLeadDays(String(data.operationalSettings!.manufacturerLeadTimeDays));
  }, [data.operationalSettings]);

  useEffect(() => {
    setRetailShelfThreshold(String(data.operationalSettings?.retailerStockThresholdBottles ?? 48));
  }, [data.operationalSettings?.retailerStockThresholdBottles]);

  const saveReplenishment = () => {
    const lead = Math.max(7, Number(leadDays) || 45);
    const safety = Math.max(0, Number(safetyDefault) || 200);
    const shelfTh = Math.max(12, Number(retailShelfThreshold) || 48);
    const safetyStockBySku = { ...data.operationalSettings!.safetyStockBySku };
    for (const p of data.products) {
      safetyStockBySku[p.sku] = safety;
    }
    updateData((d) => ({
      ...d,
      operationalSettings: {
        ...d.operationalSettings!,
        manufacturerLeadTimeDays: lead,
        safetyStockBySku,
        retailerStockThresholdBottles: shelfTh,
      },
    }));
    toast.success("Replenishment settings saved", {
      description: `Lead ${lead}d · DC safety ${safety} bottles/SKU · retail shelf alert below ${shelfTh} bottles`,
    });
  };

  const addTeamMember = () => {
    const displayName = newMemberName.trim();
    const email = newMemberEmail.trim().toLowerCase();
    if (!displayName || !email) {
      toast.error("Name and email are required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (teamMembers.some((m) => (m.email?.toLowerCase() || "") === email)) {
      toast.error("This email is already on the team");
      return;
    }
    const row: TeamMember = {
      id: `tm-${Date.now()}`,
      displayName,
      email,
      role: newMemberRole,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    updateData((d) => ({
      ...d,
      teamMembers: [...(d.teamMembers ?? []), row],
    }));
    setNewMemberName("");
    setNewMemberEmail("");
    setNewMemberRole("sales_rep");
    setTeamDialogOpen(false);
    toast.success("Team member added", { description: `${displayName} · ${TEAM_ROLE_LABELS[newMemberRole]}` });
  };

  const removeTeamMember = (id: string) => {
    updateData((d) => ({
      ...d,
      teamMembers: (d.teamMembers ?? []).filter((m) => m.id !== id),
    }));
    toast.success("Removed from team");
  };

  return (
    <div>
      <PageHeader
        title="Team & settings"
        description="Team roster, catalog, replenishment rules, and audit trail — Brand Operator (HQ)."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2 border-border/80">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
            <div>
              <CardTitle className="font-display flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Team
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                People and partner orgs that use Hajime portals. Add sales reps, retail accounts, distributors, and manufacturer contacts — roles match sign-in personas (invites are V1 roster only).
              </p>
            </div>
            <Button type="button" className="w-full shrink-0 touch-manipulation sm:w-auto" onClick={() => setTeamDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add team member
            </Button>
          </CardHeader>
          <CardContent>
            <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display">Add team member</DialogTitle>
                  <DialogDescription>
                    Choose their portal role. They will use this role when signing in (demo auth uses email + name you provide at login).
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="tm-name">Display name</Label>
                    <Input
                      id="tm-name"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="touch-manipulation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tm-email">Email</Label>
                    <Input
                      id="tm-email"
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="name@company.com"
                      autoComplete="email"
                      className="touch-manipulation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={newMemberRole} onValueChange={(v) => setNewMemberRole(v as TeamMemberPortalRole)}>
                      <SelectTrigger className="touch-manipulation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEAM_ROLE_ORDER.map((r) => (
                          <SelectItem key={r} value={r}>
                            {TEAM_ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button type="button" variant="outline" className="touch-manipulation" onClick={() => setTeamDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" className="touch-manipulation" onClick={addTeamMember}>
                    Add to team
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {teamMembers.length === 0 ? (
              <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                No team members yet. Add sales reps, retail accounts, distributors, or manufacturer contacts.
              </p>
            ) : (
              <div className="-mx-4 overflow-x-auto touch-pan-x px-4 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-muted-foreground">Name</th>
                      <th className="pb-3 font-medium text-muted-foreground">Email</th>
                      <th className="pb-3 font-medium text-muted-foreground">Role</th>
                      <th className="pb-3 font-medium text-muted-foreground">Linked retail account</th>
                      <th className="pb-3 font-medium text-muted-foreground">Added</th>
                      <th className="pb-3 w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((m) => (
                      <tr key={m.id} className="border-b border-border/50 last:border-0">
                        <td className="py-3 font-medium">{m.displayName}</td>
                        <td className="py-3 text-muted-foreground">{m.email}</td>
                        <td className="py-3">{TEAM_ROLE_LABELS[m.role]}</td>
                        <td className="py-3 text-muted-foreground">
                          {m.role === "retail"
                            ? RETAIL_ACCOUNT_TRADING_NAME_BY_EMAIL[m.email?.toLowerCase() || ""] ?? "—"
                            : "—"}
                        </td>
                        <td className="py-3 tabular-nums text-muted-foreground">{m.createdAt}</td>
                        <td className="py-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 touch-manipulation text-muted-foreground hover:text-destructive"
                            aria-label={`Remove ${m.displayName}`}
                            onClick={() => removeTeamMember(m.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Company & replenishment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Company name</Label>
              <Input defaultValue="Hajime Inc." readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label>Primary markets</Label>
              <Input defaultValue="Ontario, Toronto, Milan" readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label>Manufacturer</Label>
              <Input defaultValue="Kirin Brewery Co." readOnly className="bg-muted/50" />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="lead-days">Manufacturer lead time (days)</Label>
              <Input
                id="lead-days"
                type="number"
                min={7}
                value={leadDays}
                onChange={(e) => setLeadDays(e.target.value)}
                className="touch-manipulation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="safety-def">Default safety stock (bottles per SKU)</Label>
              <Input
                id="safety-def"
                type="number"
                min={0}
                value={safetyDefault}
                onChange={(e) => setSafetyDefault(e.target.value)}
                className="touch-manipulation"
              />
              <p className="text-xs text-muted-foreground">Saving applies this target to every catalog SKU for low-stock alerts and reorder math (brief §5.E).</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="retail-shelf-th">Retail on-premise low-stock threshold (bottles per SKU)</Label>
              <Input
                id="retail-shelf-th"
                type="number"
                min={12}
                value={retailShelfThreshold}
                onChange={(e) => setRetailShelfThreshold(e.target.value)}
                className="touch-manipulation"
              />
              <p className="text-xs text-muted-foreground">
                When a venue&apos;s shelf count for a SKU falls below this, Alerts and the command center flag a retailer reorder (cascade to wholesaler and production planning).
              </p>
            </div>
            <Button type="button" className="mt-2 touch-manipulation" onClick={saveReplenishment}>
              Save replenishment settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="font-display text-lg">Product Catalog</CardTitle>
              <div className="flex gap-2">
                <CSVImportButton
                  defaultType="products"
                  variant="outline"
                  size="sm"
                  onSuccess={() => toast.success("Products imported", { description: "Refresh to see changes" })}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full touch-manipulation sm:w-auto"
                  onClick={() => setNewProductOpen(true)}
                >
                  Add SKU
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-muted-foreground">
              Products you add here are available when creating sales orders and purchase orders.
            </p>
            <NewProductDialog
              open={newProductOpen}
              onOpenChange={setNewProductOpen}
              existingSkus={products.map((p) => p.sku)}
              onCreate={addProduct}
            />
            <EditProductDialog
              open={editProduct !== null}
              onOpenChange={(o) => {
                if (!o) setEditProduct(null);
              }}
              product={editProduct}
              onSave={(sku, patch) => {
                patchProduct(sku, patch);
                setEditProduct(null);
              }}
            />
            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.sku} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{p.name} — {p.size}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {p.sku} · {p.caseSize} per case
                      {p.wholesaleCasePrice != null ? ` · $${p.wholesaleCasePrice.toLocaleString()} CAD / case` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={p.status} />
                    <Button type="button" variant="outline" size="sm" className="touch-manipulation" onClick={() => setEditProduct(p)}>
                      Edit pricing
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 touch-manipulation text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${p.sku}`}
                      onClick={() => {
                        removeProduct(p.sku);
                        toast.success("Product removed", { description: p.sku });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Low Stock Alerts</p><p className="text-xs text-muted-foreground">Notify when inventory falls below threshold</p></div>
              <Button variant="outline" size="sm">Enabled</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Production Delays</p><p className="text-xs text-muted-foreground">Alert when manufacturer flags issues</p></div>
              <Button variant="outline" size="sm">Enabled</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Reorder Reminders</p><p className="text-xs text-muted-foreground">Suggest reorders based on sales velocity</p></div>
              <Button variant="outline" size="sm">Enabled</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Audit log</CardTitle>
            <p className="text-sm text-muted-foreground">Recent production updates and other logged actions (extend per brief §6).</p>
          </CardHeader>
          <CardContent>
            {(data.auditLogs ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No entries yet.</p>
            ) : (
              <div className="max-h-[320px] space-y-2 overflow-y-auto text-sm">
                {(data.auditLogs ?? []).slice(0, 80).map((log) => (
                  <div key={log.id} className="flex flex-col gap-0.5 rounded-md border p-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <span className="font-medium">{log.action}</span>
                      {log.detail ? <span className="text-muted-foreground"> — {log.detail}</span> : null}
                      {log.entityType ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {log.entityType} {log.entityId ? `· ${log.entityId}` : ""}
                        </span>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">
                      {log.userLabel ? `${log.userLabel} · ` : ""}
                      {log.at}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Warehouses</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {["Toronto Main Warehouse", "Milan Depot"].map((wh) => (
              <div key={wh} className="flex items-center justify-between rounded-lg border p-3">
                <p className="text-sm font-medium">{wh}</p>
                <StatusBadge status="active" />
              </div>
            ))}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2" 
              onClick={() => toast.info("Warehouse management", { description: "Coming soon in a future update." })}
            >
              Add Warehouse
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
