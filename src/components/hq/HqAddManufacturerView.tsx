import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import type { Account } from "@/data/mockData";
import { useAccounts } from "@/contexts/AppDataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { createManufacturerProfile } from "@/lib/api-v1-mutations";
import { nextAccountId } from "@/lib/account-ids";
import { manufacturerPartnerPath } from "@/lib/hq-manufacturers-metrics";
import {
  HqBtn,
  HqOperatorCard,
  HqOperatorPage,
  HqOperatorPageHeader,
} from "@/components/hq/HqOperatorUi";
import { toast } from "@/components/ui/sonner";

const TIERS = ["Preferred manufacturer partner", "Standard manufacturer partner"] as const;

export function HqAddManufacturerView() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { accounts, addAccount } = useAccounts();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Japan");
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("Tōji");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tier, setTier] = useState<string>("Standard manufacturer partner");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdId, setCreatedId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mfrName = name.trim();
    if (!mfrName || !email.trim()) {
      toast.error(t("Distillery name and email are required"));
      return;
    }

    const dup = accounts.some(
      (a) => (a.tradingName?.toLowerCase() || "") === mfrName.toLowerCase(),
    );
    if (dup) {
      toast.error(t("A manufacturer with this name already exists"));
      return;
    }

    const account: Account = {
      id: nextAccountId(accounts),
      legalName: mfrName,
      tradingName: mfrName,
      country: country.trim() || "Japan",
      city: city.trim() || "—",
      type: "manufacturer",
      contactName: contactName.trim() || "—",
      contactRole: contactRole.trim(),
      phone: phone.trim(),
      email: email.trim(),
      salesOwner: contactName.trim() || "—",
      paymentTerms: "Net 45",
      firstOrderDate: "",
      lastOrderDate: "",
      avgOrderSize: 0,
      status: "prospect",
      tags: [tier.includes("Preferred") ? "preferred" : "standard"],
    };

    setSubmitting(true);
    try {
      const result = await addAccount(account);
      if (!result.success) {
        toast.error(t("Could not create manufacturer"), {
          description: result.error,
        });
        return;
      }

      const accountId = String(result.data?.id ?? account.id);

      try {
        await createManufacturerProfile({
          manufacturer_id: accountId,
          company_name: mfrName,
          contact_name: contactName.trim() || undefined,
          email: email.trim(),
          phone: phone.trim() || undefined,
          city: city.trim() || undefined,
          country: country.trim() || "Japan",
          payment_terms: "Net 45",
        });
      } catch (profileErr) {
        const message =
          profileErr instanceof Error ? profileErr.message : t("Manufacturer profile could not be saved");
        toast.warning(t("Manufacturer account created"), {
          description: message,
        });
      }

      setCreatedId(accountId);
      setShowSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("Failed to create manufacturer");
      toast.error(t("Failed to create manufacturer"), { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <HqOperatorPage className="space-y-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <Link
          to="/manufacturer/profiles"
          className="hq-btn hq-btn-outline hq-btn-sm inline-flex items-center gap-1.5 no-underline"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          {t("Manufacturers")}
        </Link>
        <span className="text-xs text-muted-foreground">/ {t("Add manufacturer")}</span>
      </div>

      <HqOperatorPageHeader
        title="Add manufacturer"
        description="Onboard a new manufacturer partner. They receive portal access once activated."
      />

      <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="flex flex-col gap-4">
          <HqOperatorCard className="hq-settings-panel p-5 sm:p-[22px]">
            <div className="hq-settings-title">{t("Distillery details")}</div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="hq-form-group sm:col-span-2">
                <label htmlFor="add-mfr-name">{t("Distillery name")}</label>
                <input
                  id="add-mfr-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kosapan Distillery"
                />
              </div>
              <div className="hq-form-group">
                <label htmlFor="add-mfr-city">{t("City")}</label>
                <input id="add-mfr-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Shizuoka" />
              </div>
              <div className="hq-form-group">
                <label htmlFor="add-mfr-country">{t("Country")}</label>
                <input id="add-mfr-country" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </div>
          </HqOperatorCard>

          <HqOperatorCard className="hq-settings-panel p-5 sm:p-[22px]">
            <div className="hq-settings-title">{t("Primary contact")}</div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="hq-form-group">
                <label htmlFor="add-mfr-contact">{t("Contact name")}</label>
                <input id="add-mfr-contact" value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </div>
              <div className="hq-form-group">
                <label htmlFor="add-mfr-role">{t("Role")}</label>
                <input id="add-mfr-role" value={contactRole} onChange={(e) => setContactRole(e.target.value)} />
              </div>
              <div className="hq-form-group">
                <label htmlFor="add-mfr-email">{t("Email")}</label>
                <input id="add-mfr-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="hq-form-group">
                <label htmlFor="add-mfr-phone">{t("Phone")}</label>
                <input id="add-mfr-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="hq-form-group sm:col-span-2">
                <label htmlFor="add-mfr-tier">{t("Tier")}</label>
                <select
                  id="add-mfr-tier"
                  className="hq-form-select"
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                >
                  {TIERS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </HqOperatorCard>
        </div>

        <HqOperatorCard className="hq-settings-panel sticky top-5 p-5">
          <div className="hq-settings-title">{t("Onboarding")}</div>
          <ul className="space-y-2 text-[13px] text-muted-foreground">
            <li>{t("Company & contact details")}</li>
            <li>{t("Partner terms agreed")}</li>
            <li>{t("Portal access provisioned")}</li>
            <li>{t("Initial SKU allocation set")}</li>
          </ul>
          <HqBtn type="submit" variant="accent" size="sm" className="mt-4 w-full" disabled={submitting}>
            {submitting ? t("Creating…") : t("Create manufacturer")}
          </HqBtn>
        </HqOperatorCard>
      </form>

      {showSuccess ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[hsl(24_12%_8%/0.5)] p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[18px] border border-border bg-card p-8 text-center shadow-[var(--shadow-float)]">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[hsl(158_56%_36%/0.12)] text-[hsl(158_56%_32%)]">
              <Check className="size-7" strokeWidth={1.75} />
            </div>
            <div className="font-display text-xl font-semibold tracking-[-0.01em]">{t("Manufacturer created")}</div>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              {t("Portal access can be provisioned from CRM. Send the first production request when ready.")}
            </p>
            <HqBtn
              variant="accent"
              size="sm"
              className="mt-5"
              onClick={() => navigate(manufacturerPartnerPath(createdId))}
            >
              {t("Open partner")}
            </HqBtn>
          </div>
        </div>
      ) : null}
    </HqOperatorPage>
  );
}
