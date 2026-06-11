import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/contexts/AppDataContext";
import { SettingsSkeleton } from "@/components/skeletons";
import { Mail, Pencil, Trash2, UserPlus, Users } from "lucide-react";
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
import {
  createTeamMember,
  deleteTeamMember,
  deleteTeamMemberByEmail,
  getWarehouses,
  resendTeamMemberInvite,
  resendTeamMemberInviteByEmail,
  updateTeamMember,
  updateTeamMemberByEmail,
} from "@/lib/api-v1-mutations";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { warehouseFromApi } from "@/lib/warehouse-from-api";

const TEAM_ROLE_LABELS: Record<TeamMemberPortalRole, string> = {
  sales_rep: "Sales rep",
  retail: "Retail store / account",
  distributor: "Distributor / wholesaler",
  manufacturer: "Manufacturer",
};

const TEAM_ROLE_ORDER: TeamMemberPortalRole[] = ["sales_rep", "retail", "distributor", "manufacturer"];

const CRM_NO_WAREHOUSE = "__none__";

export default function CrmPage() {
  const { data, updateData, loading, refreshTeamMembers } = useAppData();

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

  const warehouseOptionsForCrm = useMemo(() => {
    const list = [...(data.warehouses ?? [])].filter((w) => w.isActive !== false);
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    return list;
  }, [data.warehouses]);

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
      console.warn("[CrmPage] refreshWarehousesFromApi:", e);
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
        console.warn("[CrmPage] refreshTeamMembers failed after add:", e);
      }
    } catch (err) {
      console.error("[CrmPage] Failed to add CRM contact:", err);
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
      console.error("[CrmPage] Failed to remove CRM contact:", err);
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Team member not found") && m.email) {
        try {
          await deleteTeamMemberByEmail(m.email);
          updateData((d) => ({
            ...d,
            teamMembers: (d.teamMembers ?? []).filter(
              (x) => x.id !== m.id && (x.email || "").toLowerCase() !== m.email.toLowerCase(),
            ),
          }));
          toast.success("Removed from CRM contacts", { description: "Deleted from server (email match)." });
          didDelete = true;
        } catch (fallbackErr) {
          console.error("[CrmPage] Delete fallback by email failed:", fallbackErr);
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
        console.warn("[CrmPage] refreshTeamMembers failed after delete:", e);
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

      if (!res) return;

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
        teamMembers: [...(d.teamMembers ?? []).filter((m) => m.id !== editTeamMember.id)].map((m) =>
          m.id === updated.id ? { ...m, ...updated } : m,
        ),
      }));

      setEditTeamOpen(false);
      setEditTeamMember(null);
      toast.success("CRM contact updated", {
        description: `${updated.displayName} · ${TEAM_ROLE_LABELS[updated.role]} — saved`,
      });
      try {
        await refreshTeamMembers();
        if (editMemberRole === "distributor") {
          await refreshWarehousesFromApi();
        }
      } catch (e) {
        console.warn("[CrmPage] refreshTeamMembers failed after update:", e);
      }
    } catch (err) {
      console.error("[CrmPage] Failed to update CRM contact:", err);
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
        console.warn("[CrmPage] refreshTeamMembers failed after invite resend:", e);
      }
    } catch (err) {
      console.error("[CrmPage] Failed to resend invite:", err);
      toast.error("Failed to resend invite", {
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
        title="CRM"
        description="Portal contacts, invites, and directory — Brand Operator (HQ). Create warehouses and distributor accounts under HQ settings & Accounts first; then add people here and send portal invites."
      />

      <Alert className="mb-6 border-border/80 bg-muted/30">
        <AlertDescription className="text-sm text-foreground/90">
          <span className="font-medium text-foreground">Partner onboarding (Brand Operator).</span> Add{" "}
          <strong className="font-medium">warehouses</strong> under{" "}
          <strong className="font-medium">HQ settings</strong> for inventory destinations. Create{" "}
          <strong className="font-medium">distributor accounts</strong> under{" "}
          <strong className="font-medium">Accounts</strong>. When those exist, add matching people here and send the{" "}
          <strong className="font-medium">portal invite</strong> so each contact can sign in.
        </AlertDescription>
      </Alert>

      <Card className="border-border/80">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="font-display flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              CRM contacts
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Directory for portal identities and invite emails. After distributor accounts (Accounts) and warehouses
              (HQ settings) exist, add each contact with the right role — then use{" "}
              <span className="font-medium text-foreground">Resend invite</span> or the link from the add flow so they can
              set up login. Sales reps, retail, distributors, and manufacturer contacts map to sign-in personas.
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
                <span className="font-medium">Portal invite quick test:</span> This screen is for HQ (Brand Operator /
                Founder Admin). Add a contact with a real email — the API sends an invite when{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">RESEND_API_KEY</code> is set; otherwise the server
                logs <code className="rounded bg-muted px-1 py-0.5 text-xs">[CRM Invite]</code> with the URL. Set{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">CLIENT_URL</code> on the API to match this
                app&apos;s origin. After adding, use <strong className="font-medium">Copy invite link</strong> in the
                toast (when email wasn&apos;t sent) or open the link from your inbox, then set password — you should land
                signed in. Registration requires auth routes enabled on the server (
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
                  distributor or warehouse-side account when possible. Saving sends a portal invite email when the API is
                  configured.
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
                    <Select value={newMemberPrimaryWarehouseId} onValueChange={setNewMemberPrimaryWarehouseId}>
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
                      <span className="font-medium text-foreground">HQ settings → Warehouses</span>. They can change this
                      anytime from <span className="font-medium text-foreground">Distributor home</span>.
                    </p>
                    {warehouseOptionsForCrm.length === 0 ? (
                      <p className="text-xs text-amber-700 dark:text-amber-500">
                        Add at least one active warehouse under HQ settings before assigning a depot here.
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
                  Update their email, role, and — for distributors — receiving warehouse. Use Resend invite if they need a
                  fresh link.
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
                    <Select value={editMemberPrimaryWarehouseId} onValueChange={setEditMemberPrimaryWarehouseId}>
                      <SelectTrigger id="tm-edit-primary-wh" className="touch-manipulation">
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CRM_NO_WAREHOUSE}>None / choose later (portal)</SelectItem>
                        {editMemberPrimaryWarehouseId !== CRM_NO_WAREHOUSE &&
                        warehouseOptionsForCrmEdit.every((w) => w.id !== editMemberPrimaryWarehouseId) ? (
                          <SelectItem value={editMemberPrimaryWarehouseId}>Unknown / removed warehouse</SelectItem>
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
    </div>
  );
}
