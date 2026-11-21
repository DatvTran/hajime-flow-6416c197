import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { filterPlatformAccountsForHq } from "@/lib/hq-order-scope";
import {
  createWarehouse,
  getWarehouses,
  updateOperationalSettings,
  updateWarehouse,
} from "@/lib/api-v1-mutations";
import { warehouseFromApi } from "@/lib/warehouse-from-api";
import { SUPPORT_LIAISON } from "@/lib/manufacturer-support";
import type { Account } from "@/data/mockData";
import type { Warehouse, WarehouseKind } from "@/types/app-data";
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
import { Switch } from "@/components/ui/switch";
import {
  HqBtn,
  HqOperatorCard,
  HqOperatorPage,
  HqOperatorPageHeader,
  HqOperatorPill,
  HqOperatorTwoCol,
} from "@/components/hq/HqOperatorUi";

/** Edit warehouse: no account / no CRM link */
const WH_LINK_NONE = "__none__";

type ToggleRow = { id: string; label: string; sub: string; defaultOn?: boolean };

const APPROVAL_TOGGLES: ToggleRow[] = [
  { id: "auto-reorder", label: "Auto-approve reorders under $2,000", sub: "From accounts in good standing within cadence", defaultOn: true },
  { id: "new-accounts", label: "Require approval for new accounts", sub: "All onboarding routes through HQ", defaultOn: true },
  { id: "cover-floor", label: "Hold orders that breach cover floor", sub: "Flag when a market drops below 21 days", defaultOn: true },
  { id: "auto-route", label: "Auto-route production requests", sub: "Assign to distillery partners by capacity and SKU", defaultOn: false },
];

const NOTIFICATION_TOGGLES: ToggleRow[] = [
  { id: "prod-signoff", label: "Production sign-offs", sub: "Push + email immediately", defaultOn: true },
  { id: "new-orders", label: "New orders", sub: "Digest every 2 hours", defaultOn: true },
  { id: "cover-breach", label: "Cover floor breaches", sub: "Push immediately", defaultOn: true },
  { id: "milestones", label: "Production milestones", sub: "Daily digest", defaultOn: true },
  { id: "tier-upgrades", label: "Tier upgrades", sub: "Weekly summary", defaultOn: false },
  { id: "quality", label: "Quality flags", sub: "Push immediately", defaultOn: true },
  { id: "new-account-req", label: "New account requests", sub: "Email", defaultOn: true },
];

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" className={`hq-toggle-sw ${on ? "on" : ""}`} onClick={onToggle} aria-pressed={on} />
  );
}

export function HqSettingsView() {
  const { t } = useLanguage();
  const { user, updateCredentials } = useAuth();
  const { data, updateData } = useAppData();
  const os = data.operationalSettings!;

  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [companyName, setCompanyName] = useState(os.companyName ?? "Hajime");
  const [hqLocation, setHqLocation] = useState(os.primaryMarkets ?? "Tokyo, Japan");
  const [supportEmail, setSupportEmail] = useState(os.supportEmail ?? SUPPORT_LIAISON.email);
  const [saving, setSaving] = useState(false);

  const [loginEmail, setLoginEmail] = useState(user?.email ?? "");
  const [loginDisplayName, setLoginDisplayName] = useState(user?.displayName ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingLogin, setSavingLogin] = useState(false);

  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [newWarehouseName, setNewWarehouseName] = useState("");
  const [newWarehouseKind, setNewWarehouseKind] = useState<WarehouseKind>("brand");
  const [editWarehouseOpen, setEditWarehouseOpen] = useState(false);
  const [editWarehouse, setEditWarehouse] = useState<Warehouse | null>(null);
  const [editWarehouseName, setEditWarehouseName] = useState("");
  const [editWarehouseKind, setEditWarehouseKind] = useState<WarehouseKind>("brand");
  const [editWarehouseSortOrder, setEditWarehouseSortOrder] = useState("0");
  const [editWarehouseActive, setEditWarehouseActive] = useState(true);
  const [editWarehouseLinkedAccountId, setEditWarehouseLinkedAccountId] = useState(WH_LINK_NONE);
  const [editWarehouseLinkedTeamMemberId, setEditWarehouseLinkedTeamMemberId] = useState(WH_LINK_NONE);

  const teamMembers = data.teamMembers ?? [];

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
    const type = (a.type || "").trim();
    const em = a.email?.trim();
    return [label, type || null, em || null].filter(Boolean).join(" · ");
  }

  const addWarehouse = async () => {
    const name = newWarehouseName.trim();
    if (!name) {
      toast.error(t("Warehouse name is required"));
      return;
    }
    try {
      const res = await createWarehouse({ name, kind: newWarehouseKind });
      const row = res.data as {
        id: string;
        name: string;
        is_active?: boolean;
        sort_order?: number;
        kind?: string;
      };
      const w = warehouseFromApi(row);
      updateData((d) => ({
        ...d,
        warehouses: [...(d.warehouses ?? []).filter((x) => x.id !== w.id), w].sort(
          (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
        ),
      }));
      setNewWarehouseName("");
      setNewWarehouseKind("brand");
      setWarehouseDialogOpen(false);
      toast.success(t("Warehouse saved"), { description: `${w.name} — saved to server` });
    } catch (err) {
      console.error("[HqSettings] Failed to save warehouse:", err);
      toast.error(t("Failed to save warehouse"), {
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
      toast.success(isActive ? t("Warehouse activated") : t("Warehouse deactivated"));
    } catch (err) {
      console.error("[HqSettings] Failed to update warehouse:", err);
      toast.error(t("Failed to update warehouse"), {
        description: err instanceof Error ? err.message : "Try again.",
      });
    }
  };

  const openEditWarehouse = (w: Warehouse) => {
    setEditWarehouse(w);
    setEditWarehouseName(w.name);
    setEditWarehouseKind(w.kind === "distributor" ? "distributor" : "brand");
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
      toast.error(t("Warehouse name is required"));
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
        kind: editWarehouseKind,
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
        kind?: string;
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
      toast.success(t("Warehouse updated"), { description: `${updated.name} — saved to server` });
    } catch (err) {
      console.error("[HqSettings] Failed to update warehouse:", err);
      toast.error(t("Failed to update warehouse"), {
        description: err instanceof Error ? err.message : "Try again.",
      });
    }
  };

  useEffect(() => {
    setLoginEmail(user?.email ?? "");
    setLoginDisplayName(user?.displayName ?? "");
  }, [user?.email, user?.displayName]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = (await getWarehouses({ includeInactive: true })) as {
          data?: {
            id: string;
            name: string;
            is_active?: boolean;
            sort_order?: number;
            kind?: string;
            linked_account_id?: string | null;
            linked_team_member_id?: string | null;
          }[];
        };
        const rows = Array.isArray(res.data) ? res.data : [];
        if (cancelled || rows.length === 0) return;
        updateData((d) => ({
          ...d,
          warehouses: rows.map((row) => warehouseFromApi(row)),
        }));
      } catch (e) {
        console.warn("[HqSettings] refresh warehouses:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [updateData]);

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    for (const row of [...APPROVAL_TOGGLES, ...NOTIFICATION_TOGGLES]) {
      initial[row.id] = row.defaultOn ?? false;
    }
    const saved = os.hqUiPreferences;
    if (saved) {
      for (const [key, value] of Object.entries(saved)) {
        if (typeof value === "boolean") initial[key] = value;
      }
    }
    setToggles(initial);
  }, [os.hqUiPreferences]);

  useEffect(() => {
    setCompanyName(os.companyName ?? "Hajime");
    setHqLocation(os.primaryMarkets ?? "Tokyo, Japan");
    setSupportEmail(os.supportEmail ?? SUPPORT_LIAISON.email);
  }, [os.companyName, os.primaryMarkets, os.supportEmail]);

  const portals = useMemo(() => {
    const accounts = filterPlatformAccountsForHq(data.accounts);
    const reps = (data.teamMembers ?? []).filter((m) => m.role === "sales_rep").length;
    return [
      { label: "Distillery partners", count: accounts.filter((a) => a.type === "manufacturer").length, tone: "green" as const },
      { label: "Distributor", count: accounts.filter((a) => a.type === "distributor").length, tone: "green" as const },
      { label: "Sales Rep", count: reps, tone: "green" as const },
      { label: "Retail Store", count: accounts.filter((a) => ["retail", "bar", "restaurant", "hotel"].includes(String(a.type))).length, tone: "green" as const },
    ];
  }, [data.accounts, data.teamMembers]);

  const saveLogin = async () => {
    const email = loginEmail.trim().toLowerCase();
    const displayName = loginDisplayName.trim();
    const emailChanged = email !== String(user?.email ?? "").toLowerCase().trim();
    const nameChanged = displayName !== String(user?.displayName ?? "").trim();
    const passwordChanged = newPassword.trim().length > 0;

    if (!emailChanged && !nameChanged && !passwordChanged) {
      toast.message(t("Nothing to update"), {
        description: t("Change email, display name, or password first."),
      });
      return;
    }
    if (!currentPassword.trim()) {
      toast.error(t("Current password required"), {
        description: t("Enter your current password to confirm changes."),
      });
      return;
    }
    if (passwordChanged) {
      if (newPassword.trim().length < 8) {
        toast.error(t("Password too short"), {
          description: t("New password must be at least 8 characters."),
        });
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error(t("Passwords do not match"));
        return;
      }
    }

    setSavingLogin(true);
    try {
      await updateCredentials({
        currentPassword,
        ...(emailChanged ? { email } : {}),
        ...(nameChanged ? { displayName } : {}),
        ...(passwordChanged ? { newPassword: newPassword.trim() } : {}),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(t("Login updated"), {
        description: t("Your email and/or password were saved."),
      });
    } catch (e) {
      toast.error(t("Could not update login"), {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSavingLogin(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const safetyDefault =
        Object.values(os.safetyStockBySku ?? {}).find((n) => Number.isFinite(n)) ?? 200;
      const res = await updateOperationalSettings({
        company_name: companyName.trim(),
        primary_markets: hqLocation.trim(),
        support_email: supportEmail.trim(),
        lead_time_days: os.manufacturerLeadTimeDays,
        shelf_threshold: os.retailerStockThresholdBottles ?? 48,
        reorder_point_bottles: safetyDefault,
        hq_ui_preferences: JSON.stringify({ toggles }),
      });

      const row = res?.data ?? {};
      updateData((d) => ({
        ...d,
        operationalSettings: {
          ...d.operationalSettings!,
          companyName:
            typeof row.company_name === "string" ? row.company_name : companyName.trim() || undefined,
          primaryMarkets:
            typeof row.primary_markets === "string"
              ? row.primary_markets
              : hqLocation.trim() || undefined,
          supportEmail:
            typeof row.support_email === "string"
              ? row.support_email
              : supportEmail.trim() || undefined,
          manufacturerLeadTimeDays: Math.max(
            1,
            Number(row.lead_time_days) || d.operationalSettings!.manufacturerLeadTimeDays,
          ),
          retailerStockThresholdBottles: Math.max(
            0,
            Number(row.shelf_threshold) || d.operationalSettings!.retailerStockThresholdBottles || 48,
          ),
          hqUiPreferences: toggles,
        },
      }));
      toast.success(t("Settings saved"), {
        description: t("Brand profile and preferences were saved to the database."),
      });
    } catch (e) {
      toast.error(t("Could not save settings"), {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <HqOperatorPage className="space-y-6">
      <HqOperatorPageHeader
        title="Settings"
        description="HQ configuration · warehouses, approval rules, notifications, and brand profile"
        actions={
          <HqBtn variant="accent" onClick={() => void save()} disabled={saving}>
            {saving ? t("Saving…") : t("Save changes")}
          </HqBtn>
        }
      />

      <HqOperatorCard id="warehouses" className="hq-settings-panel scroll-mt-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="hq-settings-title mb-0">{t("Warehouses")}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t(
                "Inventory and transfer locations for stock routing and purchase-order destinations. Distributors pick their receiving depot on Distributor home after you invite them from",
              )}{" "}
              <Link to="/crm" className="font-semibold text-primary underline-offset-4 hover:underline">
                CRM
              </Link>
              .
            </p>
          </div>
          <HqBtn variant="accent" size="sm" className="shrink-0" onClick={() => setWarehouseDialogOpen(true)}>
            {t("Add Warehouse")}
          </HqBtn>
        </div>

        <Dialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">{t("Add warehouse")}</DialogTitle>
              <DialogDescription>
                {t("Name appears on inventory, transfers, and shipment routing.")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="hq-form-group mb-0">
                <label htmlFor="hq-wh-name">{t("Warehouse name")}</label>
                <input
                  id="hq-wh-name"
                  value={newWarehouseName}
                  onChange={(e) => setNewWarehouseName(e.target.value)}
                  placeholder="e.g. Metro Hong Kong DC"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="hq-wh-kind" className="text-xs font-medium text-muted-foreground">
                  {t("Kind")}
                </label>
                <Select
                  value={newWarehouseKind}
                  onValueChange={(v) => setNewWarehouseKind(v === "distributor" ? "distributor" : "brand")}
                >
                  <SelectTrigger id="hq-wh-kind" className="touch-manipulation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brand">{t("Brand")}</SelectItem>
                    <SelectItem value="distributor">{t("Distributor")}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t("Brand = HQ pool. Distributor = wholesaler receiving warehouse.")}
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <HqBtn variant="outline" size="sm" onClick={() => setWarehouseDialogOpen(false)}>
                {t("Cancel")}
              </HqBtn>
              <HqBtn variant="accent" size="sm" onClick={() => void addWarehouse()}>
                {t("Save warehouse")}
              </HqBtn>
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
              <DialogTitle className="font-display">{t("Edit warehouse")}</DialogTitle>
              <DialogDescription>
                {t("Update name, sort order, active status, and optional account / CRM distributor links.")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="hq-form-group">
                <label htmlFor="hq-wh-edit-name">{t("Warehouse name")}</label>
                <input
                  id="hq-wh-edit-name"
                  value={editWarehouseName}
                  onChange={(e) => setEditWarehouseName(e.target.value)}
                  placeholder="e.g. Metro Hong Kong DC"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="hq-wh-edit-kind" className="text-xs font-medium text-muted-foreground">
                  {t("Kind")}
                </label>
                <Select
                  value={editWarehouseKind}
                  onValueChange={(v) => setEditWarehouseKind(v === "distributor" ? "distributor" : "brand")}
                >
                  <SelectTrigger id="hq-wh-edit-kind" className="touch-manipulation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brand">{t("Brand")}</SelectItem>
                    <SelectItem value="distributor">{t("Distributor")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="hq-form-group">
                <label htmlFor="hq-wh-edit-sort">{t("Sort order")}</label>
                <input
                  id="hq-wh-edit-sort"
                  type="number"
                  min={0}
                  value={editWarehouseSortOrder}
                  onChange={(e) => setEditWarehouseSortOrder(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="hq-wh-edit-linked-account" className="text-xs font-medium text-muted-foreground">
                  {t("Linked commercial account")}
                </label>
                <Select value={editWarehouseLinkedAccountId} onValueChange={setEditWarehouseLinkedAccountId}>
                  <SelectTrigger id="hq-wh-edit-linked-account" className="touch-manipulation">
                    <SelectValue placeholder={t("None")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(60vh,20rem)]">
                    <SelectItem value={WH_LINK_NONE}>{t("None")}</SelectItem>
                    {accountsSortedForWarehouseLink.map((a) => (
                      <SelectItem key={a.id} value={a.id} className="items-start">
                        <span className="line-clamp-2 whitespace-normal text-left text-sm">
                          {accountOptionLabel(a)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="hq-wh-edit-linked-tm" className="text-xs font-medium text-muted-foreground">
                  {t("Linked CRM distributor")}
                </label>
                <Select value={editWarehouseLinkedTeamMemberId} onValueChange={setEditWarehouseLinkedTeamMemberId}>
                  <SelectTrigger id="hq-wh-edit-linked-tm" className="touch-manipulation">
                    <SelectValue placeholder={t("None")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(60vh,20rem)]">
                    <SelectItem value={WH_LINK_NONE}>{t("None")}</SelectItem>
                    {distributorTeamMembersForWarehouseLink.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="items-start">
                        <span className="line-clamp-2 whitespace-normal text-left text-sm">
                          {m.displayName} · &lt;{m.email}&gt;
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/80 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t("Active")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("Inactive warehouses won't appear in default warehouse lists.")}
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
              <HqBtn variant="outline" size="sm" onClick={() => setEditWarehouseOpen(false)}>
                {t("Cancel")}
              </HqBtn>
              <HqBtn variant="accent" size="sm" onClick={() => void saveWarehouseEdit()}>
                {t("Save changes")}
              </HqBtn>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {warehousesSorted.length === 0 ? (
          <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            {t("No warehouses yet. Add one to start routing stock and purchase orders.")}
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
                  className={`flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${w.isActive === false ? "bg-muted/30 opacity-80" : ""}`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-medium">{w.name}</p>
                      <HqOperatorPill tone={w.kind === "distributor" ? "amber" : "blue"}>
                        {w.kind === "distributor" ? t("Distributor") : t("Brand")}
                      </HqOperatorPill>
                    </div>
                    {receivingByPrimary.length > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {t("Receiving distributors")}: {receivingByPrimary.map((m) => m.displayName).join(", ")}
                      </p>
                    ) : null}
                    {showLegacyLinked ? (
                      <p className="text-xs text-muted-foreground">
                        {t("Depot link")}:{" "}
                        <span className="font-medium text-foreground">{linkedTm.displayName}</span> · {linkedTm.email}
                      </p>
                    ) : null}
                    {!linkedTm && receivingByPrimary.length === 0 && linkedAcc ? (
                      <p className="text-xs text-amber-800 dark:text-amber-500">
                        {t("Legacy account link")}: {linkedAcc.tradingName || linkedAcc.legalName}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {w.isActive === false ? t("Inactive") : t("Active")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    <HqBtn variant="outline" size="sm" onClick={() => openEditWarehouse(w)}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      {t("Edit")}
                    </HqBtn>
                    <Switch
                      checked={w.isActive !== false}
                      onCheckedChange={(checked) => void setWarehouseActive(w.id, checked === true)}
                      className="touch-manipulation"
                      aria-label={t("Active")}
                    />
                    <HqOperatorPill tone={w.isActive === false ? "amber" : "green"}>
                      {w.isActive === false ? t("inactive") : t("active")}
                    </HqOperatorPill>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </HqOperatorCard>

      <HqOperatorTwoCol className="items-start">
        <div className="flex flex-col gap-5">
          <HqOperatorCard className="hq-settings-panel">
            <div className="hq-settings-title">{t("Approval rules")}</div>
            {APPROVAL_TOGGLES.map((row) => (
              <div key={row.id} className="hq-toggle-row">
                <div>
                  <div className="hq-toggle-label">{t(row.label)}</div>
                  <div className="hq-toggle-sub">{t(row.sub)}</div>
                </div>
                <ToggleSwitch
                  on={Boolean(toggles[row.id])}
                  onToggle={() => setToggles((prev) => ({ ...prev, [row.id]: !prev[row.id] }))}
                />
              </div>
            ))}
          </HqOperatorCard>

          <HqOperatorCard className="hq-settings-panel">
            <div className="hq-settings-title">{t("Brand profile")}</div>
            <div className="hq-form-group">
              <label htmlFor="hq-brand-name">{t("Brand name")}</label>
              <input id="hq-brand-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="hq-form-group">
              <label htmlFor="hq-location">{t("HQ location")}</label>
              <input id="hq-location" value={hqLocation} onChange={(e) => setHqLocation(e.target.value)} />
            </div>
            <div className="hq-form-group">
              <label htmlFor="hq-support-email">{t("Support email")}</label>
              <input
                id="hq-support-email"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@drinkhajime.jp"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t("Shown to distilleries and distributors on their Support pages.")}
              </p>
            </div>
            <div className="hq-form-group mb-0">
              <label htmlFor="hq-operator">{t("Operator")}</label>
              <input
                id="hq-operator"
                readOnly
                value={`${user?.displayName ?? "—"} · ${user?.role?.replace(/_/g, " ") ?? "Brand Operator"}`}
                className="bg-muted/50 text-muted-foreground"
              />
            </div>
          </HqOperatorCard>

          <HqOperatorCard className="hq-settings-panel">
            <div className="hq-settings-title">{t("Your login")}</div>
            <p className="mb-3 text-xs text-muted-foreground">
              {t("Change the email and password you use to sign in to HQ. Current password is required.")}
            </p>
            <div className="hq-form-group">
              <label htmlFor="hq-login-name">{t("Display name")}</label>
              <input
                id="hq-login-name"
                value={loginDisplayName}
                onChange={(e) => setLoginDisplayName(e.target.value)}
                autoComplete="name"
                disabled={savingLogin}
              />
            </div>
            <div className="hq-form-group">
              <label htmlFor="hq-login-email">{t("Login email")}</label>
              <input
                id="hq-login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                autoComplete="username"
                disabled={savingLogin}
              />
            </div>
            <div className="hq-form-group">
              <label htmlFor="hq-login-current">{t("Current password")}</label>
              <input
                id="hq-login-current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                disabled={savingLogin}
              />
            </div>
            <div className="hq-form-group">
              <label htmlFor="hq-login-new">{t("New password")}</label>
              <input
                id="hq-login-new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder={t("Leave blank to keep current")}
                disabled={savingLogin}
              />
            </div>
            <div className="hq-form-group">
              <label htmlFor="hq-login-confirm">{t("Confirm new password")}</label>
              <input
                id="hq-login-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={savingLogin}
              />
            </div>
            <HqBtn
              variant="outline"
              size="sm"
              disabled={savingLogin}
              onClick={() => void saveLogin()}
            >
              {savingLogin ? t("Updating…") : t("Update login")}
            </HqBtn>
          </HqOperatorCard>
        </div>

        <div className="flex flex-col gap-5">
          <HqOperatorCard className="hq-settings-panel">
            <div className="hq-settings-title">{t("Notifications")}</div>
            {NOTIFICATION_TOGGLES.map((row) => (
              <div key={row.id} className="hq-toggle-row">
                <div>
                  <div className="hq-toggle-label">{t(row.label)}</div>
                  <div className="hq-toggle-sub">{t(row.sub)}</div>
                </div>
                <ToggleSwitch
                  on={Boolean(toggles[row.id])}
                  onToggle={() => setToggles((prev) => ({ ...prev, [row.id]: !prev[row.id] }))}
                />
              </div>
            ))}
          </HqOperatorCard>

          <HqOperatorCard className="hq-settings-panel">
            <div className="hq-settings-title">{t("Connected portals")}</div>
            {portals.map((p) => (
              <div
                key={p.label}
                className="flex items-center justify-between border-b border-border/30 py-2.5 last:border-0"
              >
                <div className="text-[13px] font-medium">{t(p.label)}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {p.count} {t("connected")}
                  </span>
                  <HqOperatorPill tone={p.tone}>{t("live")}</HqOperatorPill>
                </div>
              </div>
            ))}
          </HqOperatorCard>
        </div>
      </HqOperatorTwoCol>
    </HqOperatorPage>
  );
}
