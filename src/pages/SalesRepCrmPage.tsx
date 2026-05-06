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
import { useAuth } from "@/contexts/AuthContext";
import {
  createTeamMember,
  deleteTeamMember,
  resendTeamMemberInvite,
  updateTeamMember,
} from "@/lib/api-v1-mutations";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import type { TeamMember } from "@/types/app-data";

function repOwnsRetail(m: TeamMember, userId: string | undefined): boolean {
  if (!userId || m.role !== "retail") return false;
  if (!m.crmRequestedByUserId) return false;
  return String(m.crmRequestedByUserId) === String(userId);
}

export default function SalesRepCrmPage() {
  const { user } = useAuth();
  const { data, refreshTeamMembers } = useAppData();
  const teamMembers = data.teamMembers ?? [];

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const retailRows = useMemo(() => teamMembers.filter((m) => m.role === "retail"), [teamMembers]);

  const myRetail = useMemo(
    () => retailRows.filter((m) => repOwnsRetail(m, user?.id)),
    [retailRows, user?.id],
  );

  const otherRetail = useMemo(
    () => retailRows.filter((m) => !repOwnsRetail(m, user?.id)),
    [retailRows, user?.id],
  );

  const submitRetail = async () => {
    const n = name.trim();
    const em = email.trim().toLowerCase();
    if (!n || !em) {
      toast.error("Name and email are required");
      return;
    }
    setSaving(true);
    try {
      const res = (await createTeamMember({ name: n, email: em, role: "retail" })) as {
        invite?: { status?: string; reason?: string };
        message?: string;
      };
      await refreshTeamMembers();
      if (res.invite?.status === "pending_distributor_approval") {
        const restored = (res.message ?? "").toLowerCase().includes("restore");
        toast.success(restored ? "Submission restored" : "Retail CRM request submitted", {
          description: "Your wholesaler/distributor must approve before the portal invite is sent.",
        });
      } else if ((res.message ?? "").toLowerCase().includes("reactivat")) {
        toast.success("Store re-added", {
          description: "A portal invite was issued where mail settings allow.",
        });
      } else if (res.invite?.status === "sent") {
        toast.success("Retail CRM saved", { description: em });
      } else {
        toast.success("Saved", { description: em });
      }
      setAddOpen(false);
      setName("");
      setEmail("");
    } catch (e) {
      toast.error("Could not submit", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setSaving(false);
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
      toast.success("Retail contact updated", { description: em });
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
      toast.success("Retail CRM removed", {
        description: `${removeTarget.email} — you can re-add the same email to submit again or restore the row.`,
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
      toast.success("Invite sent", {
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
      toast.error("Could not send invite", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setActionBusyId(null);
    }
  };

  /** Archived before distributor approval — only re-open the row (no invite until approved). */
  const restorePendingSubmission = async (m: TeamMember) => {
    setActionBusyId(m.id);
    try {
      await updateTeamMember(m.id, { is_active: true });
      await refreshTeamMembers();
      toast.success("Submission restored", {
        description: "Still awaiting wholesaler / distributor approval — no portal invite until then.",
      });
    } catch (e) {
      toast.error("Could not restore", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setActionBusyId(null);
    }
  };

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
      toast.success("Store re-enabled", { description: `${m.displayName} — ${detail}` });
      if (inviteUrl) {
        console.info("[Hajime CRM invite URL]", inviteUrl);
      }
      await refreshTeamMembers();
    } catch (e) {
      toast.error("Could not re-enable", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Retail CRM requests"
        description="Submit retail stores you cover. Your distributor approves new requests before the first portal invite. You can manage stores you submitted: edit, resend invites, remove, or re-add an archived store."
      />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="font-display text-lg">Submit or re-add a retail store</CardTitle>
            <CardDescription>
              Use the same email as before to restore an archived store you added — if it was already distributor-approved,
              a fresh portal invite can be sent after reactivation.
            </CardDescription>
          </div>
          <Button type="button" className="touch-manipulation" onClick={() => setAddOpen(true)}>
            New or re-add
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            First-time submissions stay pending until your wholesaler approves. Invites for approved stores can be resent
            from your list below.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">My retail stores</CardTitle>
          <CardDescription>
            Stores you submitted on this account. You can cancel a pending request, deactivate an approved store, or
            re-enable an archived one and send a new invite.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myRetail.length === 0 ? (
            <p className="text-sm text-muted-foreground">You have not submitted any retail CRM contacts yet.</p>
          ) : (
            <ul className="divide-y rounded-lg border border-border/80">
              {myRetail.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{m.displayName}</p>
                    <p className="truncate text-sm text-muted-foreground">{m.email}</p>
                    {m.pendingDistributorApproval ? (
                      <Badge variant="outline" className="mt-1 font-normal">
                        Awaiting distributor
                      </Badge>
                    ) : m.isActive === false ? (
                      <Badge variant="secondary" className="mt-1">
                        Archived
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="mt-1 font-normal text-emerald-800 dark:text-emerald-500">
                        Active
                      </Badge>
                    )}
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
                    {m.pendingDistributorApproval ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="touch-manipulation text-destructive hover:bg-destructive/10"
                        onClick={() => setRemoveTarget(m)}
                      >
                        Cancel request
                      </Button>
                    ) : m.isActive === false ? (
                      m.pendingDistributorApproval ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="touch-manipulation"
                          disabled={actionBusyId === m.id}
                          onClick={() => void restorePendingSubmission(m)}
                        >
                          {actionBusyId === m.id ? "Working…" : "Restore submission"}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          className="touch-manipulation"
                          disabled={actionBusyId === m.id}
                          onClick={() => void reactivateAndInvite(m)}
                        >
                          {actionBusyId === m.id ? "Working…" : "Reactivate & send invite"}
                        </Button>
                      )
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="touch-manipulation"
                          disabled={actionBusyId === m.id}
                          onClick={() => void resendInvite(m)}
                        >
                          {actionBusyId === m.id ? "…" : "Send / resend invite"}
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
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {otherRetail.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Other retail in your tenant</CardTitle>
            <CardDescription>
              Approved stores added by Brand HQ or others — read-only here. Use Brand HQ Settings for those contacts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y rounded-lg border border-border/80">
              {otherRetail.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div>
                    <p className="font-medium">{m.displayName}</p>
                    <p className="text-sm text-muted-foreground">{m.email}</p>
                  </div>
                  <Badge variant="secondary" className="font-normal">
                    View only
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Retail store CRM</DialogTitle>
            <DialogDescription>
              New submissions require distributor approval. To re-add a store you removed, use the same email — the CRM row
              will be restored.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="rt-name">Store / contact name</Label>
              <Input
                id="rt-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. The Drake Hotel"
                className="touch-manipulation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rt-email">Email</Label>
              <Input
                id="rt-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="orders@store.com"
                autoComplete="email"
                className="touch-manipulation"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="touch-manipulation" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="touch-manipulation" disabled={saving} onClick={() => void submitRetail()}>
              {saving ? "Saving…" : "Submit"}
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
            <DialogTitle className="font-display">Edit retail contact</DialogTitle>
            <DialogDescription>Updates the CRM row you submitted.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-rt-name">Store / contact name</Label>
              <Input
                id="edit-rt-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="touch-manipulation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-rt-email">Email</Label>
              <Input
                id="edit-rt-email"
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
            <AlertDialogTitle>Remove this retail CRM contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This deactivates <strong className="text-foreground">{removeTarget?.email}</strong> in CRM. You can submit
              the same email again later to re-add or restore the row.
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
