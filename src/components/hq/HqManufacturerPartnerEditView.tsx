import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import type { Account } from "@/data/mockData";
import { useAccounts } from "@/contexts/AppDataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  configToPlatformAccount,
  deleteHqManufacturerPartner,
  loadHqManufacturerPartner,
  manufacturerPartnerEditPath,
  saveHqManufacturerPartner,
  type HqManufacturerPartnerConfig,
  type HqManufacturerPartnerId,
} from "@/lib/hq-manufacturer-partners";
import { manufacturerPartnerPath } from "@/lib/hq-manufacturers-metrics";
import {
  HqBtn,
  HqOperatorCard,
  HqOperatorPage,
} from "@/components/hq/HqOperatorUi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";

type Props = {
  manufacturerId: HqManufacturerPartnerId;
};

const TIERS = ["Preferred Kura", "Standard Kura"] as const;
const STATUSES: Account["status"][] = ["active", "inactive", "prospect"];

export function HqManufacturerPartnerEditView({ manufacturerId }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { accounts, updateAccount, deleteAccount } = useAccounts();
  const seed = useMemo(() => loadHqManufacturerPartner(manufacturerId), [manufacturerId]);
  const [config, setConfig] = useState<HqManufacturerPartnerConfig>(seed);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setConfig(loadHqManufacturerPartner(manufacturerId));
  }, [manufacturerId]);

  const linkedAccount = useMemo(
    () => accounts.find((a) => a.id === config.accountId || a.id === manufacturerId),
    [accounts, config.accountId, manufacturerId],
  );

  const save = async () => {
    const name = config.name.trim();
    if (!name) {
      toast.error(t("Manufacturer name is required"));
      return;
    }
    if (!config.email.trim()) {
      toast.error(t("Contact email is required"));
      return;
    }

    setSaving(true);
    try {
      const next: HqManufacturerPartnerConfig = {
        ...config,
        name,
        legalName: config.legalName.trim() || name,
        sub: `${config.city || "—"} · ${config.contactName || "—"}${config.contactRole ? ` · ${config.contactRole}` : ""}`,
        tierIsPreferred: config.tier.includes("Preferred"),
      };
      saveHqManufacturerPartner(next);
      setConfig(next);

      const accountPayload = configToPlatformAccount(next);
      if (linkedAccount) {
        await updateAccount({ ...linkedAccount, ...accountPayload, id: linkedAccount.id });
      }

      await new Promise((r) => setTimeout(r, 200));
      toast.success(t("Manufacturer saved"), { description: name });
      navigate(manufacturerPartnerPath(manufacturerId));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      deleteHqManufacturerPartner(manufacturerId);
      if (linkedAccount) {
        await deleteAccount(linkedAccount.id);
      }
      toast.message(t("Manufacturer removed"), { description: config.name });
      navigate("/manufacturer/profiles");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <HqOperatorPage className="space-y-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <Link
          to={manufacturerPartnerPath(manufacturerId)}
          className="hq-btn hq-btn-outline hq-btn-sm inline-flex items-center gap-1.5 no-underline"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          {config.name}
        </Link>
        <span className="text-xs text-muted-foreground">/ {t("Edit account")}</span>
      </div>

      <div className="hq-ph-row flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.02em]">{t("Edit manufacturer")}</h1>
          <p className="mt-1 max-w-[60ch] text-[13px] text-muted-foreground">
            {t("Update kura partner details, contact info, and contract terms. Changes sync to the CRM account.")}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <HqBtn variant="outline" size="sm" disabled={deleting}>
                <Trash2 className="size-3.5" strokeWidth={1.75} />
                {t("Delete")}
              </HqBtn>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("Delete manufacturer?")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("This removes")} {config.name} {t("from the Manufacturers list. Production history stays in Purchase Orders.")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={() => void remove()}>{t("Delete")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <HqBtn variant="accent" size="sm" onClick={() => void save()} disabled={saving}>
            <Save className="size-3.5" strokeWidth={1.75} />
            {saving ? t("Saving…") : t("Save changes")}
          </HqBtn>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="flex flex-col gap-4">
          <HqOperatorCard className="hq-settings-panel p-5 sm:p-[22px]">
            <div className="hq-settings-title">{t("Company details")}</div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="hq-form-group sm:col-span-2">
                <label htmlFor="mfr-name">{t("Distillery name")}</label>
                <input
                  id="mfr-name"
                  value={config.name}
                  onChange={(e) => setConfig((c) => ({ ...c, name: e.target.value }))}
                />
              </div>
              <div className="hq-form-group sm:col-span-2">
                <label htmlFor="mfr-legal">{t("Legal name")}</label>
                <input
                  id="mfr-legal"
                  value={config.legalName}
                  onChange={(e) => setConfig((c) => ({ ...c, legalName: e.target.value }))}
                />
              </div>
              <div className="hq-form-group">
                <label htmlFor="mfr-city">{t("City")}</label>
                <input
                  id="mfr-city"
                  value={config.city}
                  onChange={(e) => setConfig((c) => ({ ...c, city: e.target.value }))}
                />
              </div>
              <div className="hq-form-group">
                <label htmlFor="mfr-country">{t("Country")}</label>
                <input
                  id="mfr-country"
                  value={config.country}
                  onChange={(e) => setConfig((c) => ({ ...c, country: e.target.value }))}
                />
              </div>
              <div className="hq-form-group sm:col-span-2">
                <label htmlFor="mfr-loc">{t("Location line")}</label>
                <input
                  id="mfr-loc"
                  value={config.locationLine}
                  onChange={(e) => setConfig((c) => ({ ...c, locationLine: e.target.value }))}
                />
              </div>
            </div>
          </HqOperatorCard>

          <HqOperatorCard className="hq-settings-panel p-5 sm:p-[22px]">
            <div className="hq-settings-title">{t("Primary contact")}</div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="hq-form-group">
                <label htmlFor="mfr-contact">{t("Contact name")}</label>
                <input
                  id="mfr-contact"
                  value={config.contactName}
                  onChange={(e) => setConfig((c) => ({ ...c, contactName: e.target.value }))}
                />
              </div>
              <div className="hq-form-group">
                <label htmlFor="mfr-role">{t("Role")}</label>
                <input
                  id="mfr-role"
                  value={config.contactRole}
                  onChange={(e) => setConfig((c) => ({ ...c, contactRole: e.target.value }))}
                />
              </div>
              <div className="hq-form-group">
                <label htmlFor="mfr-email">{t("Email")}</label>
                <input
                  id="mfr-email"
                  type="email"
                  value={config.email}
                  onChange={(e) => setConfig((c) => ({ ...c, email: e.target.value }))}
                />
              </div>
              <div className="hq-form-group">
                <label htmlFor="mfr-phone">{t("Phone")}</label>
                <input
                  id="mfr-phone"
                  value={config.phone}
                  onChange={(e) => setConfig((c) => ({ ...c, phone: e.target.value }))}
                />
              </div>
            </div>
          </HqOperatorCard>

          <HqOperatorCard className="hq-settings-panel p-5 sm:p-[22px]">
            <div className="hq-settings-title">{t("Partner terms")}</div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="hq-form-group">
                <label htmlFor="mfr-tier">{t("Tier")}</label>
                <select
                  id="mfr-tier"
                  className="hq-form-select"
                  value={config.tier}
                  onChange={(e) => setConfig((c) => ({ ...c, tier: e.target.value }))}
                >
                  {TIERS.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hq-form-group">
                <label htmlFor="mfr-status">{t("Status")}</label>
                <select
                  id="mfr-status"
                  className="hq-form-select"
                  value={config.status}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, status: e.target.value as Account["status"] }))
                  }
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hq-form-group">
                <label htmlFor="mfr-cap">{t("Capacity")}</label>
                <input
                  id="mfr-cap"
                  value={config.capacity}
                  onChange={(e) => setConfig((c) => ({ ...c, capacity: e.target.value }))}
                />
              </div>
              <div className="hq-form-group">
                <label htmlFor="mfr-since">{t("Partner since")}</label>
                <input
                  id="mfr-since"
                  value={config.partnerSince}
                  onChange={(e) => setConfig((c) => ({ ...c, partnerSince: e.target.value }))}
                />
              </div>
              <div className="hq-form-group">
                <label htmlFor="mfr-premium">{t("Quality premium")}</label>
                <input
                  id="mfr-premium"
                  value={config.premium}
                  onChange={(e) => setConfig((c) => ({ ...c, premium: e.target.value }))}
                />
              </div>
              <div className="hq-form-group">
                <label htmlFor="mfr-rice">{t("Rice contract")}</label>
                <input
                  id="mfr-rice"
                  value={config.rice}
                  onChange={(e) => setConfig((c) => ({ ...c, rice: e.target.value }))}
                />
              </div>
              <div className="hq-form-group sm:col-span-2">
                <label htmlFor="mfr-notes">{t("Internal notes")}</label>
                <textarea
                  id="mfr-notes"
                  rows={3}
                  value={config.internalNotes ?? ""}
                  onChange={(e) => setConfig((c) => ({ ...c, internalNotes: e.target.value }))}
                />
              </div>
            </div>
          </HqOperatorCard>
        </div>

        <HqOperatorCard className="hq-settings-panel sticky top-5 p-5">
          <div className="hq-settings-title">{t("Summary")}</div>
          <div className="space-y-0 text-[13px]">
            {[
              [t("Quality"), config.quality],
              [t("On-time"), config.onTime],
              [t("Active batches"), String(config.activeBatches)],
              [t("SKUs"), String(config.skus.length)],
            ].map(([label, value], i, arr) => (
              <div
                key={String(label)}
                className={`flex justify-between gap-3 py-2 ${i < arr.length - 1 ? "border-b border-border/30" : ""}`}
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="max-w-[55%] text-right font-medium">{value}</span>
              </div>
            ))}
          </div>
          <HqBtn variant="accent" size="sm" className="mt-4 w-full" onClick={() => void save()} disabled={saving}>
            {saving ? t("Saving…") : t("Save changes")}
          </HqBtn>
          <Link
            to={manufacturerPartnerPath(manufacturerId)}
            className="hq-btn hq-btn-outline hq-btn-sm mt-2 flex w-full justify-center no-underline"
          >
            {t("Cancel")}
          </Link>
        </HqOperatorCard>
      </div>
    </HqOperatorPage>
  );
}

// re-export path helper for page
export { manufacturerPartnerEditPath };
