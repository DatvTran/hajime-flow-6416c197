import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import type { Account } from "@/data/mockData";
import type { ManufacturerProfile } from "@/types/app-data";
import { useAccounts, useAppData } from "@/contexts/AppDataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  deleteManufacturerProfile,
  deleteNewProductRequest,
  deletePurchaseOrder,
  deleteTeamMemberByEmail,
  ensureManufacturerPortalAccessApi,
  updateManufacturerProfile,
} from "@/lib/api-v1-mutations";
import { newProductRequestApiId } from "@/lib/new-product-request-api";
import {
  deleteHqManufacturerPartner,
  getHiddenManufacturerIds,
  hideManufacturers,
  isHqManufacturerPartnerId,
  manufacturerPartnerEditPath,
  configToPlatformAccount,
  syncHqManufacturerPartnerToApi,
  canonicalManufacturerPartnerId,
} from "@/lib/hq-manufacturer-partners";
import {
  editFormToAccountPatch,
  editFormToPartnerConfig,
  persistPartnerEditForm,
  resolvePartnerIdForSave,
  resolveManufacturerEditForm,
  type HqManufacturerEditForm,
} from "@/lib/hq-manufacturer-edit";
import {
  applyManufacturerDeletionToAppData,
  computeManufacturerDeletionTargets,
  isNprConnected,
  isPurchaseOrderConnected,
} from "@/lib/hq-manufacturer-delete";
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
import {
  HQ_QUALITY_PREMIUM_OPTIONS,
  HQ_RAW_MATERIALS_CONTRACT_OPTIONS,
  selectOptionsWithCurrent,
} from "@/lib/hq-manufacturer-partner-terms";

type Props = {
  manufacturerId: string;
  profile?: ManufacturerProfile | null;
};

const TIERS = ["Preferred manufacturer partner", "Standard manufacturer partner"] as const;
const STATUSES: Account["status"][] = ["active", "inactive", "prospect"];

function toastPortalProvision(
  provision:
    | { ok?: boolean; action?: string; email?: string; reason?: string; usesDemoPassword?: boolean }
    | null
    | undefined,
  fallbackEmail: string,
) {
  if (!provision || provision.ok === false) {
    if (provision?.reason === "email_used_by_other_role") {
      toast.error("Portal login email is already used by another role", {
        description: `Choose a different email — this one is registered as ${String(provision.role || "another portal").replace(/_/g, " ")}.`,
      });
    }
    return;
  }
  if (provision.skipped) return;
  const email = provision.email || fallbackEmail;
  if (provision.action === "created_user" && provision.usesDemoPassword) {
    toast.message("Manufacturer portal login ready", {
      description: `Sign in as Manufacturer with ${email} · password admin123!`,
    });
  } else if (provision.action === "updated_user") {
    toast.message("Manufacturer portal login linked", {
      description: `They can sign in at the Manufacturer portal with ${email}.`,
    });
  }
}

export function HqManufacturerPartnerEditView({ manufacturerId, profile = null }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { accounts, updateAccount, deleteAccount } = useAccounts();
  const { data, updateData } = useAppData();

  const seed = useMemo(
    () => resolveManufacturerEditForm(manufacturerId, accounts, profile),
    [manufacturerId, accounts, profile],
  );

  const [config, setConfig] = useState<HqManufacturerEditForm | null>(seed);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setConfig(resolveManufacturerEditForm(manufacturerId, accounts, profile));
  }, [manufacturerId, accounts, profile]);

  const linkedAccount = useMemo(
    () => accounts.find((a) => a.id === config?.accountId || a.id === manufacturerId),
    [accounts, config?.accountId, manufacturerId],
  );

  const canDelete =
    config?.editSource === "partner" ||
    (config?.editSource === "account" && Boolean(linkedAccount));

  if (!config) {
    return (
      <div className="p-6 text-[13px] text-muted-foreground">
        {t("Manufacturer not found.")}{" "}
        <Link to="/manufacturer/profiles" className="font-medium text-accent underline-offset-2 hover:underline">
          {t("Back to Manufacturers")}
        </Link>
      </div>
    );
  }

  const applyFormUpdates = (next: HqManufacturerEditForm) => {
    const name = next.name.trim();
    return {
      ...next,
      name,
      legalName: next.legalName.trim() || name,
      sub: `${next.city || "—"} · ${next.contactName || "—"}${next.contactRole ? ` · ${next.contactRole}` : ""}`,
      tierIsPreferred: next.tier.includes("Preferred"),
    };
  };

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
      const next = applyFormUpdates(config);
      setConfig(next);

      const partnerId = resolvePartnerIdForSave(next, manufacturerId);

      if (partnerId) {
        const partnerForm: HqManufacturerEditForm = { ...next, id: partnerId, editSource: "partner" };
        const partnerConfig = editFormToPartnerConfig(partnerForm, partnerId);
        persistPartnerEditForm(partnerForm, partnerId);
        try {
          await syncHqManufacturerPartnerToApi(partnerConfig);
          updateData((d) => ({
            ...d,
            operationalSettings: {
              manufacturerLeadTimeDays: d.operationalSettings?.manufacturerLeadTimeDays ?? 45,
              safetyStockBySku: d.operationalSettings?.safetyStockBySku ?? {},
              ...d.operationalSettings,
              hqManufacturerPartnerConfigs: {
                ...(d.operationalSettings?.hqManufacturerPartnerConfigs ?? {}),
                [partnerConfig.id]: partnerConfig,
              },
            },
          }));
        } catch (persistErr) {
          const message =
            persistErr instanceof Error ? persistErr.message : t("Failed to save manufacturer to server");
          toast.error(t("Changes saved locally only"), { description: message });
        }
        const accountPayload = configToPlatformAccount(partnerConfig);
        const merged: Account = {
          ...(linkedAccount ?? accountPayload),
          ...accountPayload,
          ...editFormToAccountPatch(partnerForm),
          id: linkedAccount?.id ?? accountPayload.id,
        };
        const result = await updateAccount(merged, { silent: true });
        if (!result.success) {
          toast.error(t("Failed to save manufacturer"), { description: result.error });
          return;
        }
      } else if (next.editSource === "account" && linkedAccount) {
        const result = await updateAccount(
          { ...linkedAccount, ...editFormToAccountPatch(next), id: linkedAccount.id },
          { silent: true },
        );
        if (!result.success) {
          toast.error(t("Failed to save manufacturer"), { description: result.error });
          return;
        }
      } else if (next.editSource === "profile" && next.profileId) {
        await updateManufacturerProfile(next.profileId, {
          company_name: name,
          contact_name: next.contactName.trim(),
          email: (next.portalLoginEmail?.trim() || next.email.trim()) || undefined,
          phone: next.phone.trim(),
          city: next.city.trim(),
          country: next.country.trim(),
          notes: next.internalNotes?.trim(),
          payment_terms: next.paymentTerms,
        });
        if (linkedAccount) {
          const result = await updateAccount(
            { ...linkedAccount, ...editFormToAccountPatch(next), id: linkedAccount.id },
            { silent: true },
          );
          if (!result.success) {
            toast.error(t("Failed to save manufacturer"), { description: result.error });
            return;
          }
        }
      }

      const portalEmail = next.portalLoginEmail?.trim() || next.email.trim();
      if (portalEmail) {
        try {
          const provisionRes = await ensureManufacturerPortalAccessApi({
            portalLoginEmail: portalEmail,
            contactName: next.contactName.trim() || name,
            companyName: name,
          });
          toastPortalProvision(provisionRes.data, portalEmail);
        } catch (provisionErr) {
          const message =
            provisionErr instanceof Error ? provisionErr.message : t("Failed to link portal login");
          toast.error(t("Portal login was not created"), { description: message });
        }
      }

      toast.success(t("Manufacturer saved"), { description: name });
      const savedPartnerId = partnerId ?? resolvePartnerIdForSave(next, manufacturerId);
      navigate(manufacturerPartnerPath(savedPartnerId ?? canonicalManufacturerPartnerId(next.id)));
    } catch (err) {
      const message = err instanceof Error ? err.message : t("Failed to save manufacturer");
      toast.error(t("Failed to save manufacturer"), { description: message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      const targets = computeManufacturerDeletionTargets(manufacturerId, config, linkedAccount);

      if (config.editSource === "partner" && isHqManufacturerPartnerId(config.id)) {
        deleteHqManufacturerPartner(config.id);
      }

      // Hide first so the list updates immediately and stays hidden across reloads.
      await hideManufacturers(targets.ids);

      // Remove the manufacturer's server-side profile row(s).
      for (const id of targets.ids) {
        try {
          await deleteManufacturerProfile(id);
        } catch {
          /* profile may not exist for this id — ignore */
        }
      }

      // Remove manufacturer portal users linked to this manufacturer.
      for (const email of targets.emails) {
        try {
          await deleteTeamMemberByEmail(email);
        } catch {
          /* portal user may not exist — ignore */
        }
      }

      // Delete connected production POs (history) server-side.
      const connectedPos = (data.purchaseOrders ?? []).filter((po) =>
        isPurchaseOrderConnected(po, targets),
      );
      for (const po of connectedPos) {
        try {
          const apiId =
            po.databaseId != null && Number.isFinite(Number(po.databaseId))
              ? String(po.databaseId)
              : po.id;
          await deletePurchaseOrder(apiId);
        } catch {
          /* PO may be demo-only / already gone — ignore */
        }
      }

      // Delete connected product-development requests (NPRs) server-side.
      const connectedNprs = (data.newProductRequests ?? []).filter((npr) =>
        isNprConnected(npr, targets),
      );
      for (const npr of connectedNprs) {
        try {
          await deleteNewProductRequest(newProductRequestApiId(npr));
        } catch {
          /* NPR may be demo-only / already gone — ignore */
        }
      }

      // Delete the linked CRM account.
      if (linkedAccount) {
        const result = await deleteAccount(linkedAccount.id);
        if (!result.success) return;
      }

      // Clear connected local data (NPR assignments, portal users, profile snapshot) + persist hidden ids.
      const hiddenIds = getHiddenManufacturerIds();
      updateData((d) => ({
        ...applyManufacturerDeletionToAppData(d, targets),
        operationalSettings: {
          ...d.operationalSettings!,
          hqHiddenManufacturerIds: hiddenIds,
        },
      }));

      toast.message(t("Manufacturer removed"), { description: config.name });
      navigate("/manufacturer/profiles");
    } catch (err) {
      const message = err instanceof Error ? err.message : t("Failed to remove manufacturer");
      toast.error(t("Failed to remove manufacturer"), { description: message });
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
            {t("Update manufacturer partner details, contact info, and contract terms. Changes sync to the CRM account.")}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {canDelete ? (
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
                    {t("This permanently removes")} {config.name}{" "}
                    {t(
                      "and everything connected to it — its account, profile, portal access, production requests, and product-development assignments. This cannot be undone.",
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void remove()}>{t("Delete")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
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
                  onChange={(e) => setConfig((c) => (c ? { ...c, name: e.target.value } : c))}
                />
              </div>
              <div className="hq-form-group sm:col-span-2">
                <label htmlFor="mfr-legal">{t("Legal name")}</label>
                <input
                  id="mfr-legal"
                  value={config.legalName}
                  onChange={(e) => setConfig((c) => (c ? { ...c, legalName: e.target.value } : c))}
                />
              </div>
              <div className="hq-form-group">
                <label htmlFor="mfr-city">{t("City")}</label>
                <input
                  id="mfr-city"
                  value={config.city}
                  onChange={(e) => setConfig((c) => (c ? { ...c, city: e.target.value } : c))}
                />
              </div>
              <div className="hq-form-group">
                <label htmlFor="mfr-country">{t("Country")}</label>
                <input
                  id="mfr-country"
                  value={config.country}
                  onChange={(e) => setConfig((c) => (c ? { ...c, country: e.target.value } : c))}
                />
              </div>
              <div className="hq-form-group sm:col-span-2">
                <label htmlFor="mfr-loc">{t("Location line")}</label>
                <input
                  id="mfr-loc"
                  value={config.locationLine}
                  onChange={(e) => setConfig((c) => (c ? { ...c, locationLine: e.target.value } : c))}
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
                  onChange={(e) => setConfig((c) => (c ? { ...c, contactName: e.target.value } : c))}
                />
              </div>
              <div className="hq-form-group">
                <label htmlFor="mfr-role">{t("Role")}</label>
                <input
                  id="mfr-role"
                  value={config.contactRole}
                  onChange={(e) => setConfig((c) => (c ? { ...c, contactRole: e.target.value } : c))}
                />
              </div>
              <div className="hq-form-group">
                <label htmlFor="mfr-email">{t("Email")}</label>
                <input
                  id="mfr-email"
                  type="email"
                  value={config.email}
                  onChange={(e) => setConfig((c) => (c ? { ...c, email: e.target.value } : c))}
                />
              </div>
              <div className="hq-form-group">
                <label htmlFor="mfr-phone">{t("Phone")}</label>
                <input
                  id="mfr-phone"
                  value={config.phone}
                  onChange={(e) => setConfig((c) => (c ? { ...c, phone: e.target.value } : c))}
                />
              </div>
              <div className="hq-form-group sm:col-span-2">
                <label htmlFor="mfr-portal-email">{t("Portal login email")}</label>
                <input
                  id="mfr-portal-email"
                  type="email"
                  value={config.portalLoginEmail ?? ""}
                  onChange={(e) =>
                    setConfig((c) => (c ? { ...c, portalLoginEmail: e.target.value } : c))
                  }
                  placeholder={config.email || "login@manufacturer.example"}
                />
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {t(
                    "The email this manufacturer signs in with. Connects their portal login to this HQ record — production requests and product briefs assigned here appear in their portal.",
                  )}
                </p>
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
                  onChange={(e) => setConfig((c) => (c ? { ...c, tier: e.target.value } : c))}
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
                    setConfig((c) =>
                      c ? { ...c, status: e.target.value as Account["status"] } : c,
                    )
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
                  onChange={(e) => setConfig((c) => (c ? { ...c, capacity: e.target.value } : c))}
                />
              </div>
              <div className="hq-form-group">
                <label htmlFor="mfr-since">{t("Partner since")}</label>
                <input
                  id="mfr-since"
                  value={config.partnerSince}
                  onChange={(e) => setConfig((c) => (c ? { ...c, partnerSince: e.target.value } : c))}
                />
              </div>
              <div className="hq-form-group">
                <label htmlFor="mfr-premium">{t("Quality premium")}</label>
                <select
                  id="mfr-premium"
                  className="hq-form-select"
                  value={config.premium}
                  onChange={(e) => setConfig((c) => (c ? { ...c, premium: e.target.value } : c))}
                >
                  {selectOptionsWithCurrent(HQ_QUALITY_PREMIUM_OPTIONS, config.premium).map((option) => (
                    <option key={option} value={option}>
                      {option === "—" ? t("Not set") : option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hq-form-group">
                <label htmlFor="mfr-raw-materials">{t("Raw materials")}</label>
                <select
                  id="mfr-raw-materials"
                  className="hq-form-select"
                  value={config.rawMaterialsContract}
                  onChange={(e) =>
                    setConfig((c) => (c ? { ...c, rawMaterialsContract: e.target.value } : c))
                  }
                >
                  {selectOptionsWithCurrent(
                    HQ_RAW_MATERIALS_CONTRACT_OPTIONS,
                    config.rawMaterialsContract,
                  ).map((option) => (
                    <option key={option} value={option}>
                      {option === "—" ? t("Not set") : option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hq-form-group sm:col-span-2">
                <label htmlFor="mfr-notes">{t("Internal notes")}</label>
                <textarea
                  id="mfr-notes"
                  rows={3}
                  value={config.internalNotes ?? ""}
                  onChange={(e) => setConfig((c) => (c ? { ...c, internalNotes: e.target.value } : c))}
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

export { manufacturerPartnerEditPath };
