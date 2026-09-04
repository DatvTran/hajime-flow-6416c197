import { useEffect, useMemo, useState } from "react";
import { sendTradePack } from "@/lib/api-v1";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ITEMS: { id: string; label: string; distributorOnly?: boolean }[] = [
  { id: "first_press_sheet", label: "First Press Coffee Rhum sell sheet" },
  { id: "yuzu_mint_sheet", label: "Yuzu Mint Rhum sell sheet" },
  { id: "portfolio", label: "Portfolio card" },
  { id: "qr", label: "Connect QR / buyer form" },
  { id: "press", label: "Press kit (confirm contacts first)" },
  { id: "terms", label: "Distributor terms", distributorOnly: true },
];

export function SendTradePackDialog({
  open,
  onOpenChange,
  defaultEmail,
  defaultName,
  includeTerms,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
  defaultName?: string;
  includeTerms?: boolean;
}) {
  const options = useMemo(
    () => ITEMS.filter((i) => includeTerms || !i.distributorOnly),
    [includeTerms],
  );
  const [to, setTo] = useState(defaultEmail ?? "");
  const [name, setName] = useState(defaultName ?? "");
  const [picked, setPicked] = useState<string[]>(["first_press_sheet", "yuzu_mint_sheet", "portfolio", "qr"]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTo(defaultEmail ?? "");
    setName(defaultName ?? "");
  }, [open, defaultEmail, defaultName]);

  const send = async () => {
    setBusy(true);
    try {
      const res = await sendTradePack({ to: to.trim(), recipientName: name.trim(), items: picked });
      toast.success("Trade pack sent", {
        description: res.email?.sent ? "Email dispatched." : "Logged on the server (set RESEND_API_KEY to send).",
      });
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Send trade pack</DialogTitle>
          <DialogDescription>
            Emails links to the public trade pack and Connect form. Not an international export file and not a CRM
            conversion.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} type="email" />
          </div>
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            {options.map((i) => (
              <label key={i.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={picked.includes(i.id)}
                  onCheckedChange={(v) =>
                    setPicked((prev) => (v === true ? [...prev, i.id] : prev.filter((x) => x !== i.id)))
                  }
                />
                {i.label}
              </label>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={busy} onClick={() => void send()}>
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
