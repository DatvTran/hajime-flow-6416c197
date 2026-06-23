import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import type { Account } from "@/data/mockData";
import { useAccounts } from "@/contexts/AppDataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { nextAccountId } from "@/lib/account-ids";
import { toast } from "@/components/ui/sonner";
import {
  HqBtn,
  HqBtnLink,
  HqOperatorCard,
  HqOperatorPage,
  HqOperatorPageHeader,
} from "@/components/hq/HqOperatorUi";
import { cn } from "@/lib/utils";

const MARKETS = ["NYC", "Chicago", "Tokyo", "Paris", "Milan", "London", "Other"] as const;
const TIERS = ["Standard", "Silver Partner", "Gold Partner"] as const;
const PAYMENT_TERMS = ["Net 30", "Net 45", "Net 60", "Prepaid"] as const;
const REBATES = ["None", "2% volume", "3% volume", "4% volume"] as const;

const ONBOARDING_STEPS = [
  "Company & contact details",
  "Partner terms agreed",
  "Portal access provisioned",
  "Initial allocation set",
] as const;

function tierTag(tier: string): string {
  if (tier.includes("Gold")) return "gold";
  if (tier.includes("Silver")) return "silver";
  return "standard";
}

export function HqAddDistributorView() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { accounts, addAccount } = useAccounts();

  const [name, setName] = useState("");
  const [market, setMarket] = useState<string>("");
  const [dcCount, setDcCount] = useState("1");
  const [shippingAddress, setShippingAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tier, setTier] = useState<string>("Silver Partner");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [rebate, setRebate] = useState("2% volume");
  const [coopFund, setCoopFund] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const distributorName = name.trim();
    const em = email.trim();
    if (!distributorName || !em) {
      toast.error(t("Distributor name and email are required"));
      return;
    }
    if (!market) {
      toast.error(t("Select a market"));
      return;
    }

    const dup = accounts.some(
      (a) => (a.tradingName?.toLowerCase() || "") === distributorName.toLowerCase(),
    );
    if (dup) {
      toast.error(t("A distributor with this name already exists"));
      return;
    }

    const tags = [tierTag(tier), market.toLowerCase()];
    if (rebate !== "None") tags.push(rebate);
    if (coopFund.trim()) tags.push(`co-op: ${coopFund.trim()}`);

    const account: Account = {
      id: nextAccountId(accounts),
      legalName: distributorName,
      tradingName: distributorName,
      country:
        market === "Tokyo"
          ? "Japan"
          : market === "Paris"
            ? "France"
            : market === "Milan"
              ? "Italy"
              : market === "London"
                ? "UK"
                : "US",
      city: market === "Other" ? "—" : market,
      type: "distributor",
      contactName: contactName.trim() || "—",
      contactRole: contactRole.trim(),
      phone: phone.trim(),
      email: em,
      salesOwner: contactName.trim() || "—",
      paymentTerms,
      firstOrderDate: "",
      lastOrderDate: "",
      avgOrderSize: 0,
      status: "prospect",
      tags,
      deliveryAddress: shippingAddress.trim() || undefined,
      internalNotes: `${dcCount} DC(s)`,
    };

    setSubmitting(true);
    try {
      const result = await addAccount(account);
      if (!result.success) {
        toast.error(t("Could not create distributor"), {
          description: result.error,
        });
        return;
      }
      setShowSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <HqOperatorPage className="space-y-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <Link
          to="/accounts"
          className="hq-btn hq-btn-outline hq-btn-sm inline-flex items-center gap-1.5 no-underline"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          {t("Distributors")}
        </Link>
        <span className="text-xs text-muted-foreground">/ {t("Add distributor")}</span>
      </div>

      <HqOperatorPageHeader
        title="Add distributor"
        description="Onboard a new distribution partner. They get portal access once activated."
      />

      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-4">
            <HqOperatorCard className="hq-settings-panel">
              <div className="hq-settings-title">{t("Company details")}</div>
              <div className="hq-form-group">
                <label htmlFor="dist-name">{t("Distributor name")}</label>
                <input
                  id="dist-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pacific Beverage Co."
                  disabled={submitting}
                />
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div className="hq-form-group mb-0">
                  <label htmlFor="dist-market">{t("Market")}</label>
                  <select
                    id="dist-market"
                    value={market}
                    onChange={(e) => setMarket(e.target.value)}
                    disabled={submitting}
                    className="hq-form-select"
                  >
                    <option value="">{t("Select market…")}</option>
                    {MARKETS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hq-form-group mb-0">
                  <label htmlFor="dist-dcs">{t("Distribution centers")}</label>
                  <input
                    id="dist-dcs"
                    type="number"
                    min={1}
                    value={dcCount}
                    onChange={(e) => setDcCount(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className="hq-form-group mb-0 mt-3.5">
                <label htmlFor="dist-ship">{t("Shipping address")}</label>
                <input
                  id="dist-ship"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder={t("Primary DC address")}
                  disabled={submitting}
                />
              </div>
            </HqOperatorCard>

            <HqOperatorCard className="hq-settings-panel">
              <div className="hq-settings-title">{t("Primary contact")}</div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div className="hq-form-group mb-0">
                  <label htmlFor="dist-contact">{t("Contact name")}</label>
                  <input
                    id="dist-contact"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder={t("Full name")}
                    disabled={submitting}
                  />
                </div>
                <div className="hq-form-group mb-0">
                  <label htmlFor="dist-role">{t("Role / title")}</label>
                  <input
                    id="dist-role"
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                    placeholder="e.g. Operations Lead"
                    disabled={submitting}
                  />
                </div>
                <div className="hq-form-group mb-0">
                  <label htmlFor="dist-email">{t("Email")}</label>
                  <input
                    id="dist-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="hq-form-group mb-0">
                  <label htmlFor="dist-phone">{t("Phone")}</label>
                  <input
                    id="dist-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (___) ___-____"
                    disabled={submitting}
                  />
                </div>
              </div>
            </HqOperatorCard>

            <HqOperatorCard className="hq-settings-panel">
              <div className="hq-settings-title">{t("Partner terms")}</div>
              <div className="grid gap-3.5 sm:grid-cols-3">
                <div className="hq-form-group mb-0">
                  <label htmlFor="dist-tier">{t("Partner tier")}</label>
                  <select
                    id="dist-tier"
                    value={tier}
                    onChange={(e) => setTier(e.target.value)}
                    disabled={submitting}
                    className="hq-form-select"
                  >
                    {TIERS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hq-form-group mb-0">
                  <label htmlFor="dist-terms">{t("Payment terms")}</label>
                  <select
                    id="dist-terms"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    disabled={submitting}
                    className="hq-form-select"
                  >
                    {PAYMENT_TERMS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hq-form-group mb-0">
                  <label htmlFor="dist-rebate">{t("Volume rebate")}</label>
                  <select
                    id="dist-rebate"
                    value={rebate}
                    onChange={(e) => setRebate(e.target.value)}
                    disabled={submitting}
                    className="hq-form-select"
                  >
                    {REBATES.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="hq-form-group mb-0 mt-3.5">
                <label htmlFor="dist-coop">{t("Co-op marketing fund (annual)")}</label>
                <input
                  id="dist-coop"
                  value={coopFund}
                  onChange={(e) => setCoopFund(e.target.value)}
                  placeholder="e.g. $5,000 / yr"
                  disabled={submitting}
                />
              </div>
            </HqOperatorCard>
          </div>

          <div className="flex flex-col gap-3.5">
            <HqOperatorCard className="hq-settings-panel sticky top-5">
              <div className="hq-settings-title">{t("Onboarding")}</div>
              <div className="flex flex-col">
                {ONBOARDING_STEPS.map((step, i) => (
                  <div
                    key={step}
                    className={cn(
                      "flex items-center gap-2.5 py-2.5",
                      i < ONBOARDING_STEPS.length - 1 && "border-b border-border/30",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        i === 0
                          ? "bg-[hsl(40_88%_42%/0.15)] text-[hsl(40_88%_34%)]"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {i + 1}
                    </div>
                    <span
                      className={cn(
                        "text-xs",
                        i === 0 ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {t(step)}
                    </span>
                  </div>
                ))}
              </div>
              <HqBtn
                type="submit"
                variant="accent"
                className="mt-4 h-[42px] w-full"
                disabled={submitting}
              >
                {submitting ? t("Creating…") : t("Create distributor")}
              </HqBtn>
              <HqBtnLink
                to="/accounts"
                variant="outline"
                className="mt-2 w-full justify-center"
              >
                {t("Cancel")}
              </HqBtnLink>
            </HqOperatorCard>

            <div className="rounded-[14px] border border-[hsl(40_88%_42%/0.2)] bg-[hsl(40_88%_42%/0.06)] p-4 text-xs leading-relaxed text-[hsl(40_72%_38%)]">
              <strong className="text-[hsl(40_80%_34%)]">{t("Next")}:</strong>{" "}
              {t(
                "once created, the distributor receives portal access to manage their own sales reps, retail accounts, and replenishment orders.",
              )}
            </div>
          </div>
        </div>
      </form>

      {showSuccess ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[hsl(24_12%_8%/0.5)] p-4 backdrop-blur-sm">
          <div className="w-full max-w-[380px] rounded-[18px] border border-border bg-card p-8 text-center shadow-[var(--shadow-float)]">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[hsl(158_56%_36%/0.12)] text-[hsl(158_56%_32%)]">
              <Check className="size-7" strokeWidth={1.75} />
            </div>
            <div className="font-display text-xl font-semibold tracking-[-0.01em]">
              {t("Distributor created")}
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              {t(
                "Portal access has been provisioned. They'll receive an invite to set up their account and initial allocation.",
              )}
            </p>
            <HqBtn
              variant="accent"
              size="sm"
              className="mt-5"
              onClick={() => navigate("/accounts")}
            >
              {t("Back to distributors")}
            </HqBtn>
          </div>
        </div>
      ) : null}
    </HqOperatorPage>
  );
}
