import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppData } from "@/contexts/AppDataContext";
import {
  approveRetailCrmContact,
  createTeamMember,
  deleteTeamMember,
  resendTeamMemberInvite,
  updateTeamMember,
} from "@/lib/api-v1-mutations";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import type { TeamMember } from "@/types/app-data";

export default function DistributorCrmPage() {
  const { data, refreshTeamMembers } = useAppData();
  const teamMembers = data.teamMembers ?? [];

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const pendingRetail = useMemo(
    () =>
      teamMembers.filter((m) => m.role === "retail" && m.pendingDistributorApproval === true),
    [teamMembers],
  );

  const salesReps = useMemo(() => {
    const reps = teamMembers.filter((m) => m.role === "sales_rep");
    return reps.sort((a, b) => {
      const ai = a.isActive === false ? 1 : 0;
      const bi = b.isActive === false ? 1 : 0;
      if (ai !== bi) return ai - bi;
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    });
  }, [teamMembers]);

  const addSalesRep = async () => {
    const n = name.trim();
    const em = email.trim().toLowerCase();
    if (!n || !em) {
      toast.error("Name and email are required");
      return;
    }
    setSaving(true);
    try {
      await createTeamMember({ name: n, email: em, role: "sales_rep" });
      await refreshTeamMembers();
      toast.success("Sales rep CRM contact added", { description: em });
      setAddOpen(false);
      setName("");
      setEmail("");
    } catch (e) {
      toast.error("Could not save", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const approve = async (m: TeamMember) => {
    setApprovingId(m.id);
    try {
      await approveRetailCrmContact(m.id);
      await refreshTeamMembers();
      toast.success("Retail contact approved", { description: m.email });
    } catch (e) {
      toast.error("Approval failed", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setApprovingId(null);
    }
  };

  const openEdit = (m: TeamMember) => {
    setEditMember(m);
    setEditName(m.displayName);
    setEditEmail(m.email);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editMember) return;
    const n = editName.trim();
    const em = editEmail.trim().toLowerCase();
    if (!n || !em) {
      toast.error("Name and email are required");
      return;
    }
    setEditSaving(true);
    try {
      await updateTeamMember(editMember.id, { name: n, email: em });
      await refreshTeamMembers();
      toast.success("Sales rep updated", { description: em });
      setEditOpen(false);
      setEditMember(null);
    } catch (e) {
      toast.error("Could not update", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setEditSaving(false);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setRemoveBusy(true);
    try {
      await deleteTeamMember(removeTarget.id);
      await refreshTeamMembers();
      toast.success("Sales rep removed from partner CRM", {
        description: `${removeTarget.email} is deactivated. Reactivate here to send a new portal invite if needed.`,
      });
      setRemoveTarget(null);
    } catch (e) {
      toast.error("Could not remove", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setRemoveBusy(false);
    }
  };

  const resendInvite = async (m: TeamMember) => {
    setActionBusyId(m.id);
    try {
      const result = (await resendTeamMemberInvite(m.id)) as {
        invite?: {
          status: string;
          reason?: string;
          emailDispatched?: boolean;
          inviteUrl?: string;
        };
      };
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
        description: `${m.displayName} — ${detail}`,
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
      await refreshTeamMembers();
    } catch (e) {
      toast.error("Resend failed", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setActionBusyId(null);
    }
  };

  /** Reactivate archived CRM row, then issue a fresh portal invite (new token). */
  const reactivateAndInvite = async (m: TeamMember) => {
    setActionBusyId(m.id);
    try {
      await updateTeamMember(m.id, { is_active: true });
      const result = (await resendTeamMemberInvite(m.id)) as {
        invite?: {
          status: string;
          reason?: string;
          emailDispatched?: boolean;
          inviteUrl?: string;
        };
      };
      const inv = result.invite;
      let detail = "Reactivated.";
      if (inv?.status === "sent") {
        detail = inv.emailDispatched
          ? "CRM reactivated and invitation email sent."
          : "CRM reactivated — invite link logged on the server.";
      } else if (inv?.status === "skipped" && inv.reason === "email_already_registered") {
        detail = "CRM reactivated — that email already has a login (no new invite).";
      }
      const inviteUrl = inv?.inviteUrl;
      toast.success("Activation reset", { description: `${m.displayName} — ${detail}` });
      if (inviteUrl) {
        console.info("[Hajime CRM invite URL]", inviteUrl);
      }
      await refreshTeamMembers();
    } catch (e) {
      toast.error("Could not complete reset", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner CRM"
        description="Add field sales reps on behalf of your territory. Approve retail store CRM submissions from reps before portal invites go out."
      />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="font-display text-lg">Pending retail (from sales reps)</CardTitle>
            <CardDescription>
              Submitted by reps — approve to activate the CRM row and send the portal invite (same rules as Brand HQ).
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {pendingRetail.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending retail CRM requests.</p>
          ) : (
            <ul className="divide-y rounded-lg border border-border/80">
              {pendingRetail.map((m) => (
                <li key={m.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{m.displayName}</p>
                    <p className="text-sm text-muted-foreground">{m.email}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="touch-manipulation"
                    disabled={approvingId === m.id}
                    onClick={() => void approve(m)}
                  >
                    {approvingId === m.id ? "Approving…" : "Approve"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="font-display text-lg">Sales reps</CardTitle>
            <CardDescription>
              Manage Sales rep CRM contacts: edit details, deactivate, resend portal invites, or reactivate and send a
              fresh invite after an account was archived.
            </CardDescription>
          </div>
          <Button type="button" className="touch-manipulation" onClick={() => setAddOpen(true)}>
            Add sales rep
          </Button>
        </CardHeader>
        <CardContent>
          {salesReps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales rep CRM contacts yet.</p>
          ) : (
            <ul className="divide-y rounded-lg border border-border/80">
              {salesReps.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{m.displayName}</p>
                    <p className="truncate text-sm text-muted-foreground">{m.email}</p>
                    {m.isActive === false ? (
                      <Badge variant="secondary" className="mt-1">
                        Inactive
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="touch-manipulation"
                      onClick={() => openEdit(m)}
                    >
                      Edit
                    </Button>
                    {m.isActive !== false ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="touch-manipulation"
                          disabled={actionBusyId === m.id}
                          onClick={() => void resendInvite(m)}
                        >
                          {actionBusyId === m.id ? "…" : "Resend invite"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="touch-manipulation text-destructive hover:bg-destructive/10"
                          onClick={() => setRemoveTarget(m)}
                        >
                          Remove
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="touch-manipulation"
                        disabled={actionBusyId === m.id}
                        onClick={() => void reactivateAndInvite(m)}
                      >
                        {actionBusyId === m.id ? "Working…" : "Reactivate & send invite"}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Add sales rep (CRM)</DialogTitle>
            <DialogDescription>
              Creates a Sales rep contact aligned with Brand HQ CRM — same email should match an Accounts row if you use
              billing linkage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="sr-name">Display name</Label>
              <Input
                id="sr-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jordan Lee"
                className="touch-manipulation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sr-email">Email</Label>
              <Input
                id="sr-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rep@company.com"
                autoComplete="email"
                className="touch-manipulation"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="touch-manipulation" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="touch-manipulation" disabled={saving} onClick={() => void addSalesRep()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditMember(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit sales rep</DialogTitle>
            <DialogDescription>Update CRM details for this Sales rep contact.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-sr-name">Display name</Label>
              <Input
                id="edit-sr-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="touch-manipulation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sr-email">Email</Label>
              <Input
                id="edit-sr-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                autoComplete="email"
                className="touch-manipulation"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="touch-manipulation" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="touch-manipulation" disabled={editSaving} onClick={() => void saveEdit()}>
              {editSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(removeTarget)} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this sales rep from CRM?</AlertDialogTitle>
            <AlertDialogDescription>
              This deactivates the CRM contact for <strong className="text-foreground">{removeTarget?.email}</strong>.
              They will no longer receive invites from this row until you reactivate them here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={removeBusy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void confirmRemove();
              }}
            >
              {removeBusy ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
