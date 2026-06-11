import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Mail } from "lucide-react";
import type { Account } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "@/components/ui/sonner";
import {
  createRetailPortalUser,
  deleteRetailPortalUser,
  getRetailPortalUsers,
  type RetailPortalUser,
} from "@/lib/api-v1-mutations";
import { ON_PREMISE_ACCOUNT_TYPES } from "@/lib/retail-portal-constants";

type Props = {
  account: Account;
  canManage: boolean;
};

export function AccountPortalUsersSection({ account, canManage }: Props) {
  const isOnPremise = ON_PREMISE_ACCOUNT_TYPES.has(account.type);
  const [users, setUsers] = useState<RetailPortalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<RetailPortalUser | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    if (!isOnPremise) {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getRetailPortalUsers(account.id);
      setUsers(res.data ?? []);
    } catch (e) {
      console.error(e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [account.id, isOnPremise]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isOnPremise) return null;

  const handleAdd = async () => {
    const n = name.trim();
    const em = email.trim().toLowerCase();
    if (!n || !em) {
      toast.error("Name and email are required");
      return;
    }
    setSaving(true);
    try {
      const result = await createRetailPortalUser(account.id, {
        name: n,
        email: em,
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });
      await load();
      setAddOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      const inv = result.invite;
      let detail = "Portal user saved.";
      if (inv?.status === "sent") {
        detail = inv.emailDispatched
          ? "Invitation email sent — they can set a password and sign in."
          : "Invite created (check server logs for invite link if email is not configured).";
      }
      toast.success("Portal user added", { description: detail });
    } catch (e) {
      toast.error("Could not add portal user", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await deleteRetailPortalUser(account.id, removeTarget.id);
      await load();
      toast.success("Portal user removed", { description: removeTarget.email });
      setRemoveTarget(null);
    } catch (e) {
      toast.error("Could not remove user", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="rounded-lg border border-border/80 bg-muted/20 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Retail portal users</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Logins for {account.tradingName ?? account.name} — stored on the server.{" "}
            {canManage
              ? "Only your distributor account can add or remove users for stores you manage."
              : "Managed by your wholesaler."}
          </p>
        </div>
        {canManage ? (
          <Button type="button" size="sm" className="h-8" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 size-3.5" />
            Add user
          </Button>
        ) : null}
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading portal users…</p>
      ) : users.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No portal users yet.{canManage ? " Add a contact to invite them to the retail store app." : ""}
        </p>
      ) : (
        <ul className="divide-y divide-border/50 rounded-md border border-border/60 bg-card">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="font-medium truncate">{u.name}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="size-3 shrink-0" />
                  <span className="truncate">{u.email}</span>
                </p>
              </div>
              {canManage ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-destructive hover:text-destructive"
                  aria-label={`Remove ${u.name}`}
                  onClick={() => setRemoveTarget(u)}
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add retail portal user</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mei Daniels" />
            </div>
            <div className="space-y-1.5">
              <Label>Email (login)</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mei@venue.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone (optional)</Label>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={() => void handleAdd()}>
              {saving ? "Saving…" : "Save & invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove portal user?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.email} will lose access to the retail portal for {account.tradingName}. You can add
              them again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removing}
              onClick={(e) => {
                e.preventDefault();
                void handleRemove();
              }}
            >
              {removing ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
