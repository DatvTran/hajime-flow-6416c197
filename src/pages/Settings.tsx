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
import { Mail, Pencil, Trash2, UserPlus, Users, Warehouse as WarehouseIcon } from "lucide-react";
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
import type { TeamMember, TeamMemberPortalRole, Warehouse } from "@/types/app-data";
import { CSVImportButton } from "@/components/CSVImportButton";
import {
  createTeamMember,
  createWarehouse,
  deleteTeamMember,
  deleteTeamMemberByEmail,
  getOperationalSettings,
  getWarehouses,
  resendTeamMemberInvite,
  resendTeamMemberInviteByEmail,
  updateTeamMember,
  updateTeamMemberByEmail,
  updateOperationalSettings,
  updateWarehouse,
} from "@/lib/api-v1-mutations";
import { fetchApiHealth } from "@/lib/api-health";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

function warehouseFromApi(row: {
  id: string;
  name: string;
  is_active?: boolean;
  sort_order?: number;
  linked_account_id?: string | null;
  linked_team_member_id?: string | null;
}): Warehouse {
  const linkedRaw = row.linked_account_id;
  const linkedAccountId =
    linkedRaw != null && String(linkedRaw).trim() !== "" ? String(linkedRaw).trim() : undefined;
  const tmRaw = row.linked_team_member_id;
  const linkedTeamMemberId =
    tmRaw != null && String(tmRaw).trim() !== "" ? String(tmRaw).trim() : undefined;
  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active !== false,
    sortOrder: Number(row.sort_order ?? 0),
    ...(linkedAccountId ? { linkedAccountId } : {}),
    ...(linkedTeamMemberId ? { linkedTeamMemberId } : {}),
  };
}

const TEAM_ROLE_LABELS: Record<TeamMemberPortalRole, string> = {
  sales_rep: "Sales rep",
  retail: "Retail store / account",
  distributor: "Distributor / wholesaler",
  manufacturer: "Manufacturer",
};

const TEAM_ROLE_ORDER: TeamMemberPortalRole[] = ["sales_rep", "retail", "distributor", "manufacturer"];

/** CRM form: no receiving depot chosen yet (same pattern as optional selects elsewhere). */
const CRM_NO_WAREHOUSE = "__none__";

export default function SettingsPage() {
  const { products, addProduct, removeProduct, patchProduct } = useProducts();
  const { data, updateData, loading, refreshTeamMembers } = useAppData();

  const [newProductOpen, setNewProductOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<TeamMemberPortalRole>("sales_rep");
  const [newMemberPrimaryWarehouseId, setNewMemberPrimaryWarehouseId] = useState(CRM_NO_WAREHOUSE);
  const [editTeamOpen, setEditTeamOpen] = useState(false);
  const [editTeamMember, setEditTeamMember] = useState<TeamMember | null>(null);
  const [editMemberName, setEditMemberName] = useState("");
  const [editMemberEmail, setEditMemberEmail] = useState("");
  const [editMemberRole, setEditMemberRole] = useState<TeamMemberPortalRole>("sales_rep");
  const [editMemberPrimaryWarehouseId, setEditMemberPrimaryWarehouseId] = useState(CRM_NO_WAREHOUSE);
  const [showInactiveCrm, setShowInactiveCrm] = useState(false);

  const teamMembers = data.teamMembers ?? [];
  const teamMembersVisible = useMemo(() => {
    const list = [...teamMembers];
    list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return showInactiveCrm ? list : list.filter((m) => m.isActive !== false);
  }, [teamMembers, showInactiveCrm]);

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

  const warehousesSorted = useMemo(() => {
    const list = [...(data.warehouses ?? [])];
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    return list;
  }, [data.warehouses]);

  const warehouseOptionsForCrm = useMemo(() => {
    const list = [...(data.warehouses ?? [])].filter((w) => w.isActive !== false);
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    return list;
  }, [data.warehouses]);

  /** Include inactive depots so Edit CRM can display an existing assignment. */
  const warehouseOptionsForCrmEdit = useMemo(() => {
    const list = [...(data.warehouses ?? [])];
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    return list;
  }, [data.warehouses]);

  const warehouseTableLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const w of data.warehouses ?? []) {
      map.set(w.id, w.name + (w.isActive === false ? " (inactive)" : ""));
    }
    return map;
  }, [data.warehouses]);

  useEffect(() => {
    if (newMemberRole !== "distributor") {
      setNewMemberPrimaryWarehouseId(CRM_NO_WAREHOUSE);
    }
  }, [newMemberRole]);

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

  const addTeamMember = async () => {
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
      toast.error("This email is already in CRM contacts");
      return;
    }

    const pwOpt =
      newMemberRole === "distributor" && newMemberPrimaryWarehouseId !== CRM_NO_WAREHOUSE
        ? newMemberPrimaryWarehouseId
        : undefined;

    try {
      // Save to backend API (may send portal invite email with confirmation link)
      const result = (await createTeamMember({
        name: displayName,
        email,
        role: newMemberRole,
        ...(pwOpt ? { primary_warehouse_id: pwOpt } : {}),
      })) as {
        data: { id: string };
        invite?: {
          status: string;
          reason?: string;
          emailDispatched?: boolean;
          inviteUrl?: string;
        };
      };

      const row: TeamMember = {
        id: result.data.id,
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
      setNewMemberPrimaryWarehouseId(CRM_NO_WAREHOUSE);
      setTeamDialogOpen(false);

      const label = `${displayName} · ${TEAM_ROLE_LABELS[newMemberRole]}`;
      const inv = result.invite;
      let detail = "Saved to server.";
      if (inv?.status === "sent") {
        detail = inv.emailDispatched
          ? "Invitation email sent — they can open the link to confirm and create a password."
          : "Invite link logged on the server (set RESEND_API_KEY to send email).";
      } else if (inv?.status === "skipped" && inv.reason === "email_already_registered") {
        detail = "Contact saved. No invite sent — that email already has a login.";
      } else if (inv?.status === "delivery_failed") {
        detail =
          "Contact saved, but the invitation email failed. Check server logs or RESEND configuration.";
      }
      const inviteUrl = inv?.inviteUrl;
      if (inviteUrl) {
        console.info("[Hajime CRM invite URL]", inviteUrl);
      }
      toast.success("CRM contact added", {
        description: `${label} — ${detail}${inviteUrl ? " Use Copy invite link if no email arrived." : ""}`,
        ...(inviteUrl
          ? {
              action: {
                label: "Copy invite link",
                onClick: () => {
                  void navigator.clipboard.writeText(inviteUrl).then(() => {
                    toast.success("Invite link copied");
                  });
                },
              },
            }
          : {}),
      });
      try {
        await refreshTeamMembers();
        if (newMemberRole === "distributor" && pwOpt) {
          await refreshWarehousesFromApi();
        }
      } catch (e) {
        console.warn("[Settings] refreshTeamMembers failed after add:", e);
      }
    } catch (err) {
      console.error("[Settings] Failed to add CRM contact:", err);
      toast.error("Failed to save to server", {
        description:
          err instanceof Error
            ? err.message
            : "Contact was not added — check connection and try again.",
      });
    }
  };

  const removeTeamMember = async (m: TeamMember) => {
    let didDelete = false;
    try {
      await deleteTeamMember(m.id);
      updateData((d) => ({
        ...d,
        teamMembers: (d.teamMembers ?? []).filter((x) => x.id !== m.id),
      }));
      toast.success("Removed from CRM contacts", { description: "Deleted from server." });
      didDelete = true;
    } catch (err) {
      console.error("[Settings] Failed to remove CRM contact:", err);
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Team member not found") && m.email) {
        try {
          await deleteTeamMemberByEmail(m.email);
          updateData((d) => ({
            ...d,
            teamMembers: (d.teamMembers ?? []).filter((x) => x.id !== m.id && (x.email || "").toLowerCase() !== m.email.toLowerCase()),
          }));
          toast.success("Removed from CRM contacts", { description: "Deleted from server (email match)." });
          didDelete = true;
        } catch (fallbackErr) {
          console.error("[Settings] Delete fallback by email failed:", fallbackErr);
        }
      }
      toast.error("Failed to delete from server", {
        description:
          err instanceof Error
            ? err.message
            : "Contact was not removed — try again.",
      });
    }
    if (didDelete) {
      try {
        await refreshTeamMembers();
      } catch (e) {
        console.warn("[Settings] refreshTeamMembers failed after delete:", e);
      }
    }
  };

  const openEditTeamMember = (m: TeamMember) => {
    setEditTeamMember(m);
    setEditMemberName(m.displayName ?? "");
    setEditMemberEmail(m.email ?? "");
    setEditMemberRole(m.role);
    setEditMemberPrimaryWarehouseId(m.primaryWarehouseId || CRM_NO_WAREHOUSE);
    setEditTeamOpen(true);
  };

  const saveTeamMemberEdit = async () => {
    if (!editTeamMember) return;
    const name = editMemberName.trim();
    const email = editMemberEmail.trim().toLowerCase();
    if (!name || !email) {
      toast.error("Name and email are required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (teamMembers.some((m) => m.id !== editTeamMember.id && (m.email?.toLowerCase() || "") === email)) {
      toast.error("This email is already in CRM contacts");
      return;
    }

    const distributorWarehousePatch =
      editMemberRole === "distributor"
        ? {
            primary_warehouse_id:
              editMemberPrimaryWarehouseId === CRM_NO_WAREHOUSE ? null : editMemberPrimaryWarehouseId,
          }
        : {};

    try {
      const updateById = async () =>
        (await updateTeamMember(editTeamMember.id, {
          name,
          email,
          role: editMemberRole,
          ...distributorWarehousePatch,
        })) as {
          data: {
            id: string;
            name: string;
            email: string;
            role: TeamMemberPortalRole;
            is_active?: boolean;
            created_at?: string;
          };
        };

      const updateByEmail = async () =>
        (await updateTeamMemberByEmail(editTeamMember.email, {
          name,
          email,
          role: editMemberRole,
          ...distributorWarehousePatch,
        })) as {
          data: {
            id: string;
            name: string;
            email: string;
            role: TeamMemberPortalRole;
            is_active?: boolean;
            created_at?: string;
          };
        };

      let res:
        | {
        data: {
          id: string;
          name: string;
          email: string;
          role: TeamMemberPortalRole;
          is_active?: boolean;
          created_at?: string;
        };
      }
        | undefined;

      try {
        res = await updateById();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("Team member not found") && editTeamMember.email) {
          try {
            res = await updateByEmail();
          } catch (e2) {
            const msg2 = e2 instanceof Error ? e2.message : "";
            if (msg2.includes("Team member not found")) {
              // This row likely exists only locally (seed/legacy). Create a new CRM contact instead.
              const created = (await createTeamMember({
                name,
                email,
                role: editMemberRole,
                ...distributorWarehousePatch,
              })) as {
                data: { id: string };
              };
              res = {
                data: {
                  id: created.data.id,
                  name,
                  email,
                  role: editMemberRole,
                  is_active: true,
                },
              };
            } else {
              throw e2;
            }
          }
        } else {
          throw e;
        }
      }

      const updated: TeamMember = {
        id: res.data.id,
        displayName: res.data.name,
        email: res.data.email,
        role: res.data.role,
        isActive: res.data.is_active !== false,
        createdAt: editTeamMember.createdAt,
      };

      updateData((d) => ({
        ...d,
        teamMembers: [
          // remove the legacy/local row if we created a new DB row for it
          ...(d.teamMembers ?? []).filter((m) => m.id !== editTeamMember.id),
        ].map((m) => (m.id === updated.id ? { ...m, ...updated } : m)),
      }));

      setEditTeamOpen(false);
      setEditTeamMember(null);
      toast.success("CRM contact updated", { description: `${updated.displayName} · ${TEAM_ROLE_LABELS[updated.role]} — saved` });
      try {
        await refreshTeamMembers();
        if (editMemberRole === "distributor") {
          await refreshWarehousesFromApi();
        }
      } catch (e) {
        console.warn("[Settings] refreshTeamMembers failed after update:", e);
      }
    } catch (err) {
      console.error("[Settings] Failed to update CRM contact:", err);
      toast.error("Failed to save to server", {
        description: err instanceof Error ? err.message : "Try again.",
      });
    }
  };

  const resendInvite = async (m: TeamMember) => {
    if (!m.id) return;
    const label = `${m.displayName} · ${TEAM_ROLE_LABELS[m.role]}`;
    try {
      let result: {
        invite?: {
          status: string;
          reason?: string;
          emailDispatched?: boolean;
          inviteUrl?: string;
        };
      };

      try {
        result = (await resendTeamMemberInvite(m.id)) as typeof result;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("Team member not found") && m.email) {
          result = (await resendTeamMemberInviteByEmail(m.email)) as typeof result;
        } else {
          throw e;
        }
      }

      const inv = result.invite;
      let detail = "Invite processed.";
      if (inv?.status === "sent") {
        detail = inv.emailDispatched
          ? "Invitation email sent — they can open the link to confirm and create a password."
          : "Invite link logged on the server (set RESEND_API_KEY to send email).";
      } else if (inv?.status === "skipped" && inv.reason === "email_already_registered") {
        detail = "No invite sent — that email already has a login.";
      } else if (inv?.status === "delivery_failed") {
        detail = "Invitation email failed. Check server logs or RESEND configuration.";
      }

      const inviteUrl = inv?.inviteUrl;
      if (inviteUrl) {
        console.info("[Hajime CRM invite URL]", inviteUrl);
      }

      toast.success("Invite resent", {
        description: `${label} — ${detail}${inviteUrl ? " Use Copy invite link if no email arrived." : ""}`,
        ...(inviteUrl
          ? {
              action: {
                label: "Copy invite link",
                onClick: () => {
                  void navigator.clipboard.writeText(inviteUrl).then(() => {
                    toast.success("Invite link copied");
                  });
                },
              },
            }
          : {}),
      });
      try {
        await refreshTeamMembers();
      } catch (e) {
        console.warn("[Settings] refreshTeamMembers failed after invite resend:", e);
      }
    } catch (err) {
      console.error("[Settings] Failed to resend invite:", err);
      toast.error("Failed to resend invite", {
        description: err instanceof Error ? err.message : "Try again.",
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
      const res = await updateWarehouse(editWarehouse.id, {
        name,
        is_active: editWarehouseActive,
        sort_order: sort,
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
        title="CRM & settings"
        description="CRM contacts, catalog, replenishment rules, and audit trail — Brand Operator (HQ). Create warehouses and distributor accounts first; then invite portal users by email from CRM."
      />

      <Alert className="mb-6 border-border/80 bg-muted/30">
        <AlertDescription className="text-sm text-foreground/90">
          <span className="font-medium text-foreground">Partner onboarding (Brand Operator).</span> Add{" "}
          <strong className="font-medium">warehouses</strong> below for inventory destinations. Create{" "}
          <strong className="font-medium">distributor accounts</strong> (with profile and contact details) under{" "}
          <strong className="font-medium">Accounts</strong>. When those records exist, add matching people in{" "}
          <strong className="font-medium">CRM contacts</strong> and send the{" "}
          <strong className="font-medium">portal invite</strong> so each distributor or warehouse contact can set up
          their login.
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
              purchase-order destinations, and fulfillment.{" "}
              <span className="font-medium text-foreground">Distributors</span> choose which depot they receive from on{" "}
              <span className="font-medium text-foreground">Distributor home</span> after you invite them from{" "}
              <span className="font-medium text-foreground">CRM contacts</span>.
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
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Edit warehouse</DialogTitle>
                <DialogDescription>
                  Update the display name, active status, and sort order. Distributor-to-depot assignment is managed by
                  each distributor from their portal (Distributor home).
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
                <Alert className="border-border/80 bg-muted/20 py-2">
                  <AlertDescription className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Distributor receiving site</span> is chosen by each
                    distributor on <span className="font-medium text-foreground">Distributor home</span> (requires CRM
                    email to match their login). HQ no longer assigns the depot link from this dialog.
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
        <Card className="lg:col-span-2 border-border/80">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
            <div>
              <CardTitle className="font-display flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                CRM contacts
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Directory for portal identities and invite emails. After distributor accounts (Accounts) and warehouses
                (above) exist, add each contact here with the right role — then use{" "}
                <span className="font-medium text-foreground">Resend invite</span> or the link from the add flow so they
                can set up login. Sales reps, retail, distributors, and manufacturer contacts map to sign-in personas.
              </p>
            </div>
            <Button type="button" className="w-full shrink-0 touch-manipulation sm:w-auto" onClick={() => setTeamDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add CRM contact
            </Button>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 border-border/80 bg-muted/25">
              <AlertDescription className="space-y-2 text-sm text-foreground/90">
                <p>
                  <span className="font-medium">Portal invite quick test:</span> This screen is for HQ (
                  Brand Operator / Founder Admin). Add a contact with a real email — the API sends an invite
                  when <code className="rounded bg-muted px-1 py-0.5 text-xs">RESEND_API_KEY</code> is set; otherwise
                  the server logs <code className="rounded bg-muted px-1 py-0.5 text-xs">[CRM Invite]</code> with the
                  URL. Set <code className="rounded bg-muted px-1 py-0.5 text-xs">CLIENT_URL</code> on the API to
                  match this app&apos;s origin. After adding, use <strong className="font-medium">Copy invite link</strong>{" "}
                  in the toast (when email wasn&apos;t sent) or open the link from your inbox, then set password — you
                  should land signed in. Registration requires auth routes enabled on the server (
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">FEATURE_FLAG_AUTH_ENABLED=true</code>).
                </p>
              </AlertDescription>
            </Alert>
            <Dialog
              open={teamDialogOpen}
              onOpenChange={(open) => {
                setTeamDialogOpen(open);
                if (open) setNewMemberPrimaryWarehouseId(CRM_NO_WAREHOUSE);
              }}
            >
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display">Add CRM contact</DialogTitle>
                  <DialogDescription>
                    Choose their portal role for sign-in and workflow routing. Use the same email you recorded on the
                    distributor or warehouse-side account when possible. Saving sends a portal invite email when the API
                    is configured.
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
                  {newMemberRole === "distributor" ? (
                    <div className="space-y-2">
                      <Label htmlFor="tm-add-primary-wh">Receiving warehouse</Label>
                      <Select
                        value={newMemberPrimaryWarehouseId}
                        onValueChange={setNewMemberPrimaryWarehouseId}
                      >
                        <SelectTrigger id="tm-add-primary-wh" className="touch-manipulation">
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={CRM_NO_WAREHOUSE}>Choose later (distributor portal)</SelectItem>
                          {warehouseOptionsForCrm.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Optional preset — matches{" "}
                        <span className="font-medium text-foreground">Settings → Warehouses</span>. They can change this
                        anytime from <span className="font-medium text-foreground">Distributor home</span>.
                      </p>
                      {warehouseOptionsForCrm.length === 0 ? (
                        <p className="text-xs text-amber-700 dark:text-amber-500">
                          Add at least one active warehouse before assigning a depot here.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button type="button" variant="outline" className="touch-manipulation" onClick={() => setTeamDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" className="touch-manipulation" onClick={addTeamMember}>
                    Add contact
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={editTeamOpen}
              onOpenChange={(open) => {
                setEditTeamOpen(open);
                if (!open) setEditTeamMember(null);
              }}
            >
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display">Edit CRM contact</DialogTitle>
                  <DialogDescription>
                    Update their email, role, and — for distributors — receiving warehouse. Use Resend invite if they
                    need a fresh link.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="tm-edit-name">Display name</Label>
                    <Input
                      id="tm-edit-name"
                      value={editMemberName}
                      onChange={(e) => setEditMemberName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="touch-manipulation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tm-edit-email">Email</Label>
                    <Input
                      id="tm-edit-email"
                      type="email"
                      value={editMemberEmail}
                      onChange={(e) => setEditMemberEmail(e.target.value)}
                      placeholder="name@company.com"
                      autoComplete="email"
                      className="touch-manipulation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={editMemberRole} onValueChange={(v) => setEditMemberRole(v as TeamMemberPortalRole)}>
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
                  {editMemberRole === "distributor" ? (
                    <div className="space-y-2">
                      <Label htmlFor="tm-edit-primary-wh">Receiving warehouse</Label>
                      <Select
                        value={editMemberPrimaryWarehouseId}
                        onValueChange={setEditMemberPrimaryWarehouseId}
                      >
                        <SelectTrigger id="tm-edit-primary-wh" className="touch-manipulation">
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={CRM_NO_WAREHOUSE}>None / choose later (portal)</SelectItem>
                          {editMemberPrimaryWarehouseId !== CRM_NO_WAREHOUSE &&
                          warehouseOptionsForCrmEdit.every((w) => w.id !== editMemberPrimaryWarehouseId) ? (
                            <SelectItem value={editMemberPrimaryWarehouseId}>
                              Unknown / removed warehouse
                            </SelectItem>
                          ) : null}
                          {warehouseOptionsForCrmEdit.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.name}
                              {w.isActive === false ? " (inactive)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Clears the depot link when set to none; distributors can pick again from Distributor home.
                      </p>
                    </div>
                  ) : null}
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button type="button" variant="outline" className="touch-manipulation" onClick={() => setEditTeamOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" className="touch-manipulation" onClick={saveTeamMemberEdit}>
                    Save changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {teamMembers.length === 0 ? (
              <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                No CRM contacts yet. Add sales reps, retail accounts, distributors, or manufacturer contacts.
              </p>
            ) : (
              <div className="-mx-4 overflow-x-auto touch-pan-x px-4 sm:mx-0 sm:px-0">
                <div className="mb-3 flex items-center justify-end gap-2">
                  <Label htmlFor="crm-show-inactive" className="text-xs text-muted-foreground">
                    Show inactive
                  </Label>
                  <Switch
                    id="crm-show-inactive"
                    checked={showInactiveCrm}
                    onCheckedChange={(checked) => setShowInactiveCrm(checked === true)}
                    className="touch-manipulation"
                  />
                </div>
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-muted-foreground">Name</th>
                      <th className="pb-3 font-medium text-muted-foreground">Email</th>
                      <th className="pb-3 font-medium text-muted-foreground">Role</th>
                      <th className="pb-3 font-medium text-muted-foreground">Linked account or depot</th>
                      <th className="pb-3 font-medium text-muted-foreground">Added</th>
                      <th className="pb-3 w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembersVisible.map((m) => (
                      <tr
                        key={m.id}
                        className={`border-b border-border/50 last:border-0 ${m.isActive === false ? "opacity-70" : ""}`}
                      >
                        <td className="py-3 font-medium">
                          <span>{m.displayName}</span>
                          {m.isActive === false ? (
                            <Badge variant="secondary" className="ml-2 align-middle font-normal">
                              Inactive
                            </Badge>
                          ) : null}
                        </td>
                        <td className="py-3 text-muted-foreground">{m.email}</td>
                        <td className="py-3">{TEAM_ROLE_LABELS[m.role]}</td>
                        <td className="py-3 text-muted-foreground">
                          {m.role === "retail"
                            ? RETAIL_ACCOUNT_TRADING_NAME_BY_EMAIL[m.email?.toLowerCase() || ""] ?? "—"
                            : m.role === "distributor"
                              ? m.primaryWarehouseId
                                ? warehouseTableLabelById.get(m.primaryWarehouseId) ?? "Unknown depot"
                                : "—"
                              : "—"}
                        </td>
                        <td className="py-3 tabular-nums text-muted-foreground">{m.createdAt}</td>
                        <td className="py-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mr-1 h-8 w-8 touch-manipulation text-muted-foreground hover:text-foreground"
                            aria-label={`Edit ${m.displayName}`}
                            onClick={() => openEditTeamMember(m)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mr-1 h-8 w-8 touch-manipulation text-muted-foreground hover:text-foreground"
                            aria-label={`Resend invite for ${m.displayName}`}
                            onClick={() => resendInvite(m)}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 touch-manipulation text-muted-foreground hover:text-destructive"
                            aria-label={`Remove ${m.displayName}`}
                            onClick={() => removeTeamMember(m)}
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
