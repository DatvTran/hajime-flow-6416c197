import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { NewProductDialog } from "@/components/NewProductDialog";
import { EditProductDialog } from "@/components/EditProductDialog";
import { useProducts, useAppData } from "@/contexts/AppDataContext";
import { SettingsSkeleton } from "@/components/skeletons";
import type { Product } from "@/data/mockData";
import { Pencil, Trash2, Warehouse as WarehouseIcon } from "lucide-react";
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
import type { Account } from "@/data/mockData";
import type { Warehouse } from "@/types/app-data";
import { CSVImportButton } from "@/components/CSVImportButton";
import {
  createWarehouse,
  getOperationalSettings,
  getWarehouses,
  updateOperationalSettings,
  updateWarehouse,
} from "@/lib/api-v1-mutations";
import { warehouseFromApi } from "@/lib/warehouse-from-api";
import { fetchApiHealth } from "@/lib/api-health";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";

/** Edit warehouse: no account / no CRM link */
const WH_LINK_NONE = "__none__";

export default function SettingsPage() {
  const { products, addProduct, removeProduct, patchProduct, refreshProducts } = useProducts();
  const { data, updateData, loading } = useAppData();

  const [newProductOpen, setNewProductOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const teamMembers = data.teamMembers ?? [];

  const os = data.operationalSettings!;
  const [leadDays, setLeadDays] = useState(String(os.manufacturerLeadTimeDays));
  const defaultSafety =
    data.products.length > 0
      ? String(os.safetyStockBySku[data.products[0].sku] ?? 500)
      : "500";
  const [safetyDefault, setSafetyDefault] = useState(defaultSafety);
  const [retailShelfThreshold, setRetailShelfThreshold] = useState(String(os.retailerStockThresholdBottles ?? 48));
  const [companyName, setCompanyName] = useState(os.companyName ?? "");
  const [primaryMarkets, setPrimaryMarkets] = useState(os.primaryMarkets ?? "");
  const [manufacturerName, setManufacturerName] = useState(os.manufacturerName ?? "");
  const [dbHealth, setDbHealth] = useState<"checking" | "ok" | "error">("checking");
  const [dbHealthDetail, setDbHealthDetail] = useState<string | null>(null);
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [newWarehouseName, setNewWarehouseName] = useState("");
  const [editWarehouseOpen, setEditWarehouseOpen] = useState(false);
  const [editWarehouse, setEditWarehouse] = useState<Warehouse | null>(null);
  const [editWarehouseName, setEditWarehouseName] = useState("");
  const [editWarehouseSortOrder, setEditWarehouseSortOrder] = useState("0");
  const [editWarehouseActive, setEditWarehouseActive] = useState(true);
  const [editWarehouseLinkedAccountId, setEditWarehouseLinkedAccountId] = useState(WH_LINK_NONE);
  const [editWarehouseLinkedTeamMemberId, setEditWarehouseLinkedTeamMemberId] = useState(WH_LINK_NONE);

  const warehousesSorted = useMemo(() => {
    const list = [...(data.warehouses ?? [])];
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    return list;
  }, [data.warehouses]);

  const accountsSortedForWarehouseLink = useMemo(() => {
    const list = [...(data.accounts ?? [])];
    list.sort((a, b) =>
      (a.tradingName || a.name).localeCompare(b.tradingName || b.name, undefined, { sensitivity: "base" }),
    );
    return list;
  }, [data.accounts]);

  const distributorTeamMembersForWarehouseLink = useMemo(() => {
    const list = teamMembers.filter((m) => m.role === "distributor");
    list.sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" }));
    return list;
  }, [teamMembers]);

  function accountOptionLabel(a: Account): string {
    const label = (a.tradingName || a.legalName || a.name).trim();
    const t = (a.type || "").trim();
    const em = a.email?.trim();
    return [label, t || null, em || null].filter(Boolean).join(" · ");
  }

  const refreshWarehousesFromApi = async () => {
    try {
      const res = (await getWarehouses({ includeInactive: true })) as {
        data?: {
          id: string;
          name: string;
          is_active?: boolean;
          sort_order?: number;
          linked_account_id?: string | null;
          linked_team_member_id?: string | null;
        }[];
      };
      const rows = Array.isArray(res.data) ? res.data : [];
      if (rows.length === 0) return;
      updateData((d) => ({
        ...d,
        warehouses: rows.map((row) => warehouseFromApi(row)),
      }));
    } catch (e) {
      console.warn("[Settings] refreshWarehousesFromApi:", e);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetchApiHealth()
      .then((h) => {
        if (cancelled) return;
        setDbHealth("ok");
        setDbHealthDetail(h.dbNow ? `Postgres time ${h.dbNow}` : "Postgres reachable");
      })
      .catch((e) => {
        if (cancelled) return;
        setDbHealth("error");
        setDbHealthDetail(e instanceof Error ? e.message : "Database unreachable");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setLeadDays(String(data.operationalSettings!.manufacturerLeadTimeDays));
  }, [data.operationalSettings]);

  useEffect(() => {
    setRetailShelfThreshold(String(data.operationalSettings?.retailerStockThresholdBottles ?? 48));
  }, [data.operationalSettings?.retailerStockThresholdBottles]);

  useEffect(() => {
    const o = data.operationalSettings;
    if (!o) return;
    setCompanyName(o.companyName ?? "");
    setPrimaryMarkets(o.primaryMarkets ?? "");
    setManufacturerName(o.manufacturerName ?? "");
    if (data.products.length > 0) {
      const v = o.safetyStockBySku[data.products[0].sku];
      if (v != null) setSafetyDefault(String(v));
    }
  }, [
    data.operationalSettings?.companyName,
    data.operationalSettings?.primaryMarkets,
    data.operationalSettings?.manufacturerName,
    data.operationalSettings?.safetyStockBySku,
    data.products,
  ]);

  const saveReplenishment = async () => {
    const lead = Math.max(7, Number(leadDays) || 45);
    const safety = Math.max(0, Number(safetyDefault) || 200);
    const shelfTh = Math.max(12, Number(retailShelfThreshold) || 48);
    const safetyStockBySku = { ...data.operationalSettings!.safetyStockBySku };
    for (const p of data.products) {
      safetyStockBySku[p.sku] = safety;
    }

    try {
      await updateOperationalSettings({
        lead_time_days: lead,
        reorder_point_bottles: safety,
        shelf_threshold: shelfTh,
        company_name: companyName.trim(),
        primary_markets: primaryMarkets.trim(),
        manufacturer_name: manufacturerName.trim(),
      });

      updateData((d) => ({
        ...d,
        operationalSettings: {
          ...d.operationalSettings!,
          manufacturerLeadTimeDays: lead,
          safetyStockBySku,
          retailerStockThresholdBottles: shelfTh,
          companyName: companyName.trim() || undefined,
          primaryMarkets: primaryMarkets.trim() || undefined,
          manufacturerName: manufacturerName.trim() || undefined,
        },
      }));
      toast.success("Replenishment settings saved", {
        description: `Lead ${lead}d · DC safety ${safety} bottles/SKU · retail shelf alert below ${shelfTh} bottles — saved to server`,
      });
    } catch (err) {
      console.error("[Settings] Failed to save operational settings:", err);
      toast.error("Failed to save to server", {
        description: "Nothing was changed — fix the connection and try again.",
      });
    }
  };

  const addWarehouse = async () => {
    const name = newWarehouseName.trim();
    if (!name) {
      toast.error("Warehouse name is required");
      return;
    }
    try {
      const res = await createWarehouse({ name });
      const row = res.data as {
        id: string;
        name: string;
        is_active?: boolean;
        sort_order?: number;
      };
      const w = warehouseFromApi(row);
      updateData((d) => ({
        ...d,
        warehouses: [...(d.warehouses ?? []).filter((x) => x.id !== w.id), w].sort(
          (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
        ),
      }));
      setNewWarehouseName("");
      setWarehouseDialogOpen(false);
      toast.success("Warehouse saved", { description: `${w.name} — saved to server` });
    } catch (err) {
      console.error("[Settings] Failed to save warehouse:", err);
      toast.error("Failed to save warehouse", {
        description: err instanceof Error ? err.message : "Try again.",
      });
    }
  };

  const setWarehouseActive = async (id: string, isActive: boolean) => {
    try {
      await updateWarehouse(id, { is_active: isActive });
      updateData((d) => ({
        ...d,
        warehouses: (d.warehouses ?? []).map((w) => (w.id === id ? { ...w, isActive } : w)),
      }));
      toast.success(isActive ? "Warehouse activated" : "Warehouse deactivated");
    } catch (err) {
      console.error("[Settings] Failed to update warehouse:", err);
      toast.error("Failed to update warehouse", {
        description: err instanceof Error ? err.message : "Try again.",
      });
    }
  };

  const openEditWarehouse = (w: Warehouse) => {
    setEditWarehouse(w);
    setEditWarehouseName(w.name);
    setEditWarehouseSortOrder(String(w.sortOrder ?? 0));
    setEditWarehouseActive(w.isActive !== false);
    setEditWarehouseLinkedAccountId(
      w.linkedAccountId != null && String(w.linkedAccountId).trim() !== ""
        ? String(w.linkedAccountId).trim()
        : WH_LINK_NONE,
    );
    setEditWarehouseLinkedTeamMemberId(
      w.linkedTeamMemberId != null && String(w.linkedTeamMemberId).trim() !== ""
        ? String(w.linkedTeamMemberId).trim()
        : WH_LINK_NONE,
    );
    setEditWarehouseOpen(true);
  };

  const saveWarehouseEdit = async () => {
    if (!editWarehouse) return;
    const name = editWarehouseName.trim();
    if (!name) {
      toast.error("Warehouse name is required");
      return;
    }
    const sort = Math.max(0, Math.floor(Number(editWarehouseSortOrder) || 0));

    try {
      const linked_account_id =
        editWarehouseLinkedAccountId === WH_LINK_NONE ? null : editWarehouseLinkedAccountId.trim();
      const linked_team_member_id =
        editWarehouseLinkedTeamMemberId === WH_LINK_NONE ? null : editWarehouseLinkedTeamMemberId.trim();

      const res = await updateWarehouse(editWarehouse.id, {
        name,
        is_active: editWarehouseActive,
        sort_order: sort,
        linked_account_id,
        linked_team_member_id,
      });

      const row = res.data as {
        id: string;
        name: string;
        is_active?: boolean;
        sort_order?: number;
        linked_account_id?: string | null;
        linked_team_member_id?: string | null;
      };
      const updated = warehouseFromApi(row);
      updateData((d) => ({
        ...d,
        warehouses: [...(d.warehouses ?? []).filter((x) => x.id !== updated.id), updated].sort(
          (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
        ),
      }));

      setEditWarehouseOpen(false);
      setEditWarehouse(null);
      toast.success("Warehouse updated", { description: `${updated.name} — saved to server` });
    } catch (err) {
      console.error("[Settings] Failed to update warehouse:", err);
      toast.error("Failed to update warehouse", {
        description: err instanceof Error ? err.message : "Try again.",
      });
    }
  };

  if (loading) {
    return <SettingsSkeleton />;
  }

  return (
    <div>
      <PageHeader
        title="HQ settings"
        description="Postgres health, warehouses, company & replenishment, catalog, notifications, and audit — Brand Operator (HQ). Portal contacts and invites live on the CRM page."
      />

      <Alert className="mb-6 border-border/80 bg-muted/30">
        <AlertDescription className="text-sm text-foreground/90">
          <span className="font-medium text-foreground">Partner onboarding.</span> Add{" "}
          <strong className="font-medium">warehouses</strong> below, create <strong className="font-medium">distributor accounts</strong> under{" "}
          <strong className="font-medium">Accounts</strong>, then add people and send invites from{" "}
          <Link to="/crm" className="font-semibold text-primary underline-offset-4 hover:underline">
            CRM
          </Link>
          .
        </AlertDescription>
      </Alert>

      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">Storage</CardTitle>
          <p className="text-sm text-muted-foreground">
            Confirms the API can read/write Postgres (not just your browser cache).
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={
                dbHealth === "ok" ? "default" : dbHealth === "error" ? "destructive" : "secondary"
              }
            >
              {dbHealth === "checking"
                ? "Checking database…"
                : dbHealth === "ok"
                  ? "Postgres connected"
                  : "Database unreachable"}
            </Badge>
            {dbHealthDetail ? (
              <span className="text-xs text-muted-foreground">{dbHealthDetail}</span>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="touch-manipulation shrink-0"
            onClick={() => {
              setDbHealth("checking");
              setDbHealthDetail(null);
              fetchApiHealth()
                .then((h) => {
                  setDbHealth("ok");
                  setDbHealthDetail(h.dbNow ? `Postgres time ${h.dbNow}` : "Postgres reachable");
                })
                .catch((e) => {
                  setDbHealth("error");
                  setDbHealthDetail(e instanceof Error ? e.message : "Database unreachable");
                });
            }}
          >
            Re-check
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="font-display flex items-center gap-2 text-lg">
              <WarehouseIcon className="h-5 w-5" />
              Warehouses
            </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
              Inventory and transfer locations you define as Brand Operator. Stored in Postgres — used for stock routing,
              purchase-order destinations, and fulfillment. Link depots to commercial accounts and CRM distributor
              contacts when editing a warehouse, or let{" "}
              <span className="font-medium text-foreground">distributors</span> set their receiving depot on{" "}
              <span className="font-medium text-foreground">Distributor home</span> after you invite them from{" "}
              <Link to="/crm" className="font-semibold text-primary underline-offset-4 hover:underline">
                CRM
              </Link>
              .
            </p>
          </div>
          <Button
            type="button"
            className="w-full shrink-0 touch-manipulation sm:w-auto"
            onClick={() => setWarehouseDialogOpen(true)}
          >
            Add Warehouse
          </Button>
        </CardHeader>
        <CardContent>
          <Dialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Add warehouse</DialogTitle>
                <DialogDescription>
                  Name appears on inventory, transfers, and shipment routing. Invite people who operate this location from
                  CRM contacts when you want them to sign in to the portal.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="wh-name">Warehouse name</Label>
                  <Input
                    id="wh-name"
                    value={newWarehouseName}
                    onChange={(e) => setNewWarehouseName(e.target.value)}
                    placeholder="e.g. Toronto Main Warehouse"
                    className="touch-manipulation"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" className="touch-manipulation" onClick={() => setWarehouseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" className="touch-manipulation" onClick={addWarehouse}>
                  Save warehouse
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={editWarehouseOpen}
            onOpenChange={(open) => {
              setEditWarehouseOpen(open);
              if (!open) setEditWarehouse(null);
            }}
          >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">Edit warehouse</DialogTitle>
                <DialogDescription>
                  Update the display name, sort order, active status, and optional links to Accounts and CRM distributor
                  contacts. Links drive ship-to-distributor routing and eligibility in Brand Operator tools.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="wh-edit-name">Warehouse name</Label>
                  <Input
                    id="wh-edit-name"
                    value={editWarehouseName}
                    onChange={(e) => setEditWarehouseName(e.target.value)}
                    placeholder="e.g. Toronto Main Warehouse"
                    className="touch-manipulation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wh-edit-sort">Sort order</Label>
                  <Input
                    id="wh-edit-sort"
                    type="number"
                    min={0}
                    value={editWarehouseSortOrder}
                    onChange={(e) => setEditWarehouseSortOrder(e.target.value)}
                    className="touch-manipulation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wh-edit-linked-account">Linked commercial account</Label>
                  <Select value={editWarehouseLinkedAccountId} onValueChange={setEditWarehouseLinkedAccountId}>
                    <SelectTrigger id="wh-edit-linked-account" className="touch-manipulation">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(60vh,20rem)]">
                      <SelectItem value={WH_LINK_NONE}>None</SelectItem>
                      {accountsSortedForWarehouseLink.map((a) => (
                        <SelectItem key={a.id} value={a.id} className="items-start">
                          <span className="line-clamp-2 whitespace-normal text-left text-sm">
                            {accountOptionLabel(a)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Receiving depots for a wholesale order show when this matches the order&apos;s account (e.g. LCBO
                    Ontario). Leave empty for brand-pool depots only.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wh-edit-linked-tm">Linked CRM distributor</Label>
                  <Select value={editWarehouseLinkedTeamMemberId} onValueChange={setEditWarehouseLinkedTeamMemberId}>
                    <SelectTrigger id="wh-edit-linked-tm" className="touch-manipulation">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(60vh,20rem)]">
                      <SelectItem value={WH_LINK_NONE}>None</SelectItem>
                      {distributorTeamMembersForWarehouseLink.map((m) => (
                        <SelectItem key={m.id} value={m.id} className="items-start">
                          <span className="line-clamp-2 whitespace-normal text-left text-sm">
                            {m.displayName} · &lt;{m.email}&gt;
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Must be a <span className="font-medium text-foreground">distributor</span> role row from Settings →
                    CRM. Align invite email with the wholesale account when possible.
                  </p>
                </div>
                <Alert className="border-border/80 bg-muted/20 py-2">
                  <AlertDescription className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Brand Operator</span> can set account and CRM links
                    here. <span className="font-medium text-foreground">Distributors</span> can still choose or change
                    their receiving depot on <span className="font-medium text-foreground">Distributor home</span> after
                    they accept a CRM invite.
                  </AlertDescription>
                </Alert>
                <div className="flex items-center justify-between rounded-lg border border-border/80 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Active</p>
                    <p className="text-xs text-muted-foreground">
                      Inactive warehouses won&apos;t appear in default warehouse lists.
                    </p>
                  </div>
                  <Switch
                    checked={editWarehouseActive}
                    onCheckedChange={(checked) => setEditWarehouseActive(checked === true)}
                    className="touch-manipulation"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" className="touch-manipulation" onClick={() => setEditWarehouseOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" className="touch-manipulation" onClick={saveWarehouseEdit}>
                  Save changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {warehousesSorted.length === 0 ? (
            <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
              No warehouses yet. Defaults are created on first load (Toronto Main Warehouse, Milan Depot) once the server migration has run.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border border-border/80">
              {warehousesSorted.map((w) => {
                const receivingByPrimary = teamMembers.filter(
                  (m) => m.role === "distributor" && m.primaryWarehouseId === w.id && m.isActive !== false,
                );
                const linkedTm =
                  w.linkedTeamMemberId != null
                    ? teamMembers.find((m) => m.id === w.linkedTeamMemberId)
                    : undefined;
                const linkedAcc =
                  !linkedTm && w.linkedAccountId != null
                    ? (data.accounts ?? []).find((a) => a.id === w.linkedAccountId)
                    : undefined;
                const showLegacyLinked =
                  linkedTm != null && !receivingByPrimary.some((m) => m.id === linkedTm.id);
                return (
                <li
                  key={w.id}
                  className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${w.isActive === false ? "bg-muted/30 opacity-80" : ""}`}
                >
                  <div className="min-w-0">
                    <p className="font-medium">{w.name}</p>
                    {receivingByPrimary.length > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Receiving distributors:{" "}
                        {receivingByPrimary.map((m) => m.displayName).join(", ")}
                      </p>
                    ) : null}
                    {showLegacyLinked ? (
                      <p className="text-xs text-muted-foreground">
                        Depot link: <span className="font-medium text-foreground">{linkedTm.displayName}</span> ·{" "}
                        {linkedTm.email}{" "}
                        <span className="text-muted-foreground">(synced from CRM / portal)</span>
                      </p>
                    ) : null}
                    {!linkedTm && receivingByPrimary.length === 0 && linkedAcc ? (
                      <p className="text-xs text-amber-800 dark:text-amber-500">
                        Legacy account link: {linkedAcc.tradingName || linkedAcc.legalName} — invite the matching CRM
                        distributor so they can choose this depot on Distributor home.
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {w.isActive === false ? "Inactive — excluded from default warehouse lists" : "Active"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="touch-manipulation"
                      onClick={() => openEditWarehouse(w)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Label htmlFor={`wh-active-${w.id}`} className="text-xs text-muted-foreground">
                      Active
                    </Label>
                    <Switch
                      id={`wh-active-${w.id}`}
                      checked={w.isActive !== false}
                      onCheckedChange={(checked) => setWarehouseActive(w.id, checked === true)}
                      className="touch-manipulation"
                    />
                    <Badge variant={w.isActive === false ? "secondary" : "default"} className="font-normal capitalize">
                      {w.isActive === false ? "inactive" : "active"}
                    </Badge>
                  </div>
                </li>
              );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Company & replenishment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hq-company-name">Company name</Label>
              <Input
                id="hq-company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Hajime Inc."
                className="touch-manipulation"
                autoComplete="organization"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hq-markets">Primary markets</Label>
              <Input
                id="hq-markets"
                value={primaryMarkets}
                onChange={(e) => setPrimaryMarkets(e.target.value)}
                placeholder="Ontario, Toronto, Milan"
                className="touch-manipulation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hq-manufacturer">Manufacturer</Label>
              <Input
                id="hq-manufacturer"
                value={manufacturerName}
                onChange={(e) => setManufacturerName(e.target.value)}
                placeholder="Kirin Brewery Co."
                className="touch-manipulation"
              />
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
                  onSuccess={() => {
                toast.success("Products imported", { description: "Catalog refreshed from server." });
                void refreshProducts();
              }}
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
              onCreate={async (p) => {
                const r = await addProduct(p);
                return r.success;
              }}
            />
            <EditProductDialog
              open={editProduct !== null}
              onOpenChange={(o) => {
                if (!o) setEditProduct(null);
              }}
              product={editProduct}
              onSave={async (sku, patch) => {
                const r = await patchProduct(sku, patch);
                if (r.success) setEditProduct(null);
                return r.success;
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
                        void removeProduct(p.sku);
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
      </div>
    </div>
  );
}
