import { useEffect, useState } from "react";
import { useAccounts, useAppData } from "@/contexts/AppDataContext";
import { useAuth, useRetailAccountTradingName } from "@/contexts/AuthContext";
import { RetailPageHeader } from "@/components/retail/RetailPageHeader";
import { RetailSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import {
  getRetailAccountSettings,
  patchRetailAccountSettings,
  type RetailAccountSettings,
} from "@/lib/api-v1-mutations";

const NOTIFICATIONS = [
  { id: "order", title: "Order status updates", sub: "When your order is approved, packed, and shipped" },
  { id: "delivery", title: "Delivery reminders", sub: "24 hours before scheduled delivery" },
  { id: "backbar", title: "Backbar depletion alerts", sub: "When a SKU drops below cover threshold" },
  { id: "partner", title: "Partner program updates", sub: "Tier changes and rebate payments" },
  { id: "products", title: "New product announcements", sub: "New Hajime SKUs and limited releases" },
  { id: "invoice", title: "Invoice reminders", sub: "When an invoice is due in 7 days" },
  { id: "digest", title: "Weekly sell-through digest", sub: "Summary of backbar activity every Monday" },
] as const;

const fieldClass =
  "h-[38px] w-full rounded-lg border border-border bg-background px-3 text-[13px] text-foreground outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring";

export default function RetailAccountPage() {
  const { user } = useAuth();
  const tradingName = useRetailAccountTradingName();
  const { accounts } = useAccounts();
  const { data, loading } = useAppData();
  const acc = accounts.find((a) => a.tradingName === tradingName);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [notif, setNotif] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NOTIFICATIONS.map((n) => [n.id, n.defaultOn])),
  );
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSettingsLoading(true);
      try {
        const res = await getRetailAccountSettings();
        if (cancelled) return;
        const d = res.data;
        setFirstName(d.firstName ?? "");
        setLastName(d.lastName ?? "");
        setEmail(d.email ?? user?.email ?? "");
        setPhone(d.phone ?? "");
        if (d.notificationPrefs) {
          setNotif((prev) => ({ ...prev, ...d.notificationPrefs }));
        }
      } catch (e) {
        if (!cancelled) {
          console.error("[RetailAccount] load settings:", e);
        }
      } finally {
        if (!cancelled) setSettingsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  const save = async () => {
    setSaving(true);
    try {
      await patchRetailAccountSettings({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        notificationPrefs: notif,
      });
      toast.success("Account settings saved", {
        description: "Your profile and notification preferences are stored on the server.",
      });
    } catch (e) {
      toast.error("Could not save settings", {
        description: e instanceof Error ? e.message : "Try again when you are back online.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || settingsLoading) return <RetailSkeleton />;

  return (
    <div className="space-y-6 pb-8">
      <RetailPageHeader
        title="My account"
        description={`Account settings for ${tradingName ?? "your venue"} · Hajime portal`}
        actions={
          <Button
            className="h-9 bg-accent text-accent-foreground hover:bg-[hsl(32_78%_48%)]"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <section className="rounded-[14px] border border-border/70 bg-card p-[22px] shadow-[var(--shadow-soft)]">
            <h2 className="mb-4 border-b border-border/50 pb-2.5 text-sm font-semibold">Profile</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  First name
                </Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Last name
                </Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className={fieldClass} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Email
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Phone
                </Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 …"
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Role
                </Label>
                <Input value="Retail store" readOnly className={`${fieldClass} bg-muted/50`} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Portal access
                </Label>
                <Input
                  value={`Retail Store · ${acc?.pricingTier ?? "Partner"}`}
                  readOnly
                  className={`${fieldClass} bg-muted/50 capitalize`}
                />
              </div>
            </div>
          </section>

          <section className="rounded-[14px] border border-border/70 bg-card p-[22px] shadow-[var(--shadow-soft)]">
            <h2 className="mb-4 border-b border-border/50 pb-2.5 text-sm font-semibold">Store information</h2>
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Store name
                </Label>
                <Input value={tradingName ?? ""} readOnly className={`${fieldClass} bg-muted/50`} />
              </div>
              {acc ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Address
                    </Label>
                    <Input
                      value={`${acc.city}, ${acc.country}`}
                      readOnly
                      className={`${fieldClass} bg-muted/50`}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Payment terms
                      </Label>
                      <Input value={acc.paymentTerms} readOnly className={`${fieldClass} bg-muted/50`} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Your rep
                      </Label>
                      <Input value={acc.salesOwner} readOnly className={`${fieldClass} bg-muted/50`} />
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-[14px] border border-border/70 bg-card p-[22px] shadow-[var(--shadow-soft)]">
            <h2 className="mb-4 border-b border-border/50 pb-2.5 text-sm font-semibold">Notifications</h2>
            <ul className="divide-y divide-border/40">
              {NOTIFICATIONS.map((n) => (
                <li key={n.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-[13px] font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.sub}</p>
                  </div>
                  <Switch
                    checked={notif[n.id] ?? false}
                    onCheckedChange={(v) => setNotif((s) => ({ ...s, [n.id]: v }))}
                  />
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[14px] border border-border/70 bg-card p-[22px] shadow-[var(--shadow-soft)]">
            <h2 className="mb-4 border-b border-border/50 pb-2.5 text-sm font-semibold">Security</h2>
            <p className="text-[13px] text-muted-foreground">
              Signed in as {user?.email}. Password changes are managed by your administrator or via the invite flow.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
