import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { filterPlatformAccountsForHq } from "@/lib/hq-order-scope";
import { updateOperationalSettings } from "@/lib/api-v1-mutations";
import { SUPPORT_LIAISON } from "@/lib/manufacturer-support";
import { toast } from "@/components/ui/sonner";
import {
  HqBtn,
  HqOperatorCard,
  HqOperatorPage,
  HqOperatorPageHeader,
  HqOperatorPill,
  HqOperatorTwoCol,
} from "@/components/hq/HqOperatorUi";

type ToggleRow = { id: string; label: string; sub: string; defaultOn?: boolean };

const APPROVAL_TOGGLES: ToggleRow[] = [
  { id: "auto-reorder", label: "Auto-approve reorders under $2,000", sub: "From accounts in good standing within cadence", defaultOn: true },
  { id: "new-accounts", label: "Require approval for new accounts", sub: "All onboarding routes through HQ", defaultOn: true },
  { id: "cover-floor", label: "Hold orders that breach cover floor", sub: "Flag when a market drops below 21 days", defaultOn: true },
  { id: "auto-route", label: "Auto-route production requests", sub: "Assign to manufacturer partners by capacity and SKU", defaultOn: false },
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
  const { user } = useAuth();
  const { data, updateData } = useAppData();
  const os = data.operationalSettings!;

  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [companyName, setCompanyName] = useState(os.companyName ?? "Hajime");
  const [hqLocation, setHqLocation] = useState(os.primaryMarkets ?? "Tokyo, Japan");
  const [supportEmail, setSupportEmail] = useState(os.supportEmail ?? SUPPORT_LIAISON.email);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    for (const row of [...APPROVAL_TOGGLES, ...NOTIFICATION_TOGGLES]) {
      initial[row.id] = row.defaultOn ?? false;
    }
    setToggles(initial);
  }, []);

  useEffect(() => {
    setCompanyName(os.companyName ?? "Hajime");
    setHqLocation(os.primaryMarkets ?? "Tokyo, Japan");
    setSupportEmail(os.supportEmail ?? SUPPORT_LIAISON.email);
  }, [os.companyName, os.primaryMarkets, os.supportEmail]);

  const portals = useMemo(() => {
    const accounts = filterPlatformAccountsForHq(data.accounts);
    const reps = (data.teamMembers ?? []).filter((m) => m.role === "sales_rep").length;
    return [
      { label: "Manufacturer partners", count: accounts.filter((a) => a.type === "manufacturer").length, tone: "green" as const },
      { label: "Distributor", count: accounts.filter((a) => a.type === "distributor").length, tone: "green" as const },
      { label: "Sales Rep", count: reps, tone: "green" as const },
      { label: "Retail Store", count: accounts.filter((a) => ["retail", "bar", "restaurant", "hotel"].includes(String(a.type))).length, tone: "green" as const },
    ];
  }, [data.accounts, data.teamMembers]);

  const save = async () => {
    setSaving(true);
    try {
      await updateOperationalSettings({
        company_name: companyName.trim(),
        primary_markets: hqLocation.trim(),
        support_email: supportEmail.trim(),
        lead_time_days: os.manufacturerLeadTimeDays,
        shelf_threshold: os.retailerStockThresholdBottles,
      });
      updateData((d) => ({
        ...d,
        operationalSettings: {
          ...d.operationalSettings!,
          companyName,
          primaryMarkets: hqLocation,
          supportEmail: supportEmail.trim() || undefined,
        },
      }));
      toast.success(t("Settings saved"));
    } catch (e) {
      toast.error(t("Could not save settings"), { description: String(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <HqOperatorPage className="space-y-6">
      <HqOperatorPageHeader
        title="Settings"
        description="HQ configuration · approval rules, notifications, and brand profile"
        actions={
          <HqBtn variant="accent" onClick={() => void save()} disabled={saving}>
            {saving ? t("Saving…") : t("Save changes")}
          </HqBtn>
        }
      />

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
                {t("Shown to manufacturers and distributors on their Support pages.")}
              </p>
            </div>
            <div className="hq-form-group mb-0">
              <label htmlFor="hq-operator">{t("Operator")}</label>
              <input
                id="hq-operator"
                readOnly
                value={`${user?.displayName ?? "—"} · Brand Operator`}
                className="bg-muted/50 text-muted-foreground"
              />
            </div>
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
