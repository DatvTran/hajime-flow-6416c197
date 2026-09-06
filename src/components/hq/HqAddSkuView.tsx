import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import type { Product } from "@/data/mockData";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/components/ui/sonner";
import { bottlePriceToCase, parsePriceInput, productFromAvailability } from "@/lib/hq-product-catalog";
import {
  hajimeNetBreaksGuardrail,
  hajimeNetNeedsWarn,
  TRADE_STANDARD,
} from "@/lib/hajime-trade-pricing";
import {
  HqBtn,
  HqBtnLink,
  HqOperatorCard,
  HqOperatorPage,
  HqOperatorPageHeader,
} from "@/components/hq/HqOperatorUi";
import { useHqDistilleryCatalogOptions } from "@/hooks/useHqDistilleryCatalogOptions";
import { cn } from "@/lib/utils";

const BOTTLE_SIZES = ["720ml", "750ml", "500ml", "300ml", "1.8L"] as const;
const STYLES = ["Junmai Daiginjo", "Junmai Ginjo", "Junmai", "Genshu", "Nigori", "Honjozo"] as const;
const CASE_SIZES = [
  { value: 12, label: "12 bottles" },
  { value: 6, label: "6 bottles" },
  { value: 24, label: "24 bottles" },
] as const;
const RELEASE_TYPES = ["Core — always available", "Seasonal", "Limited lot"] as const;
const MARKET_OPTIONS = [
  "United States",
  "Japan",
  "France",
  "Italy",
  "United Kingdom",
  "Germany",
  "Canada",
  "Australia",
  "South Korea",
  "Singapore",
] as const;

type Props = {
  existingSkus: string[];
  onCreate: (product: Product) => Promise<{ success: boolean }>;
};

function releaseAvailability(releaseType: string): "active" | "seasonal" | "limited" {
  if (releaseType.includes("Seasonal")) return "seasonal";
  if (releaseType.includes("Limited")) return "limited";
  return "active";
}

export function HqAddSkuView({ existingSkus, onCreate }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const distilleries = useHqDistilleryCatalogOptions();

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [size, setSize] = useState<string>("750ml");
  const [style, setStyle] = useState<string>(STYLES[0]);
  const [polish, setPolish] = useState("");
  const [msrp, setMsrp] = useState(String(TRADE_STANDARD.srpPerBottle));
  const [wholesale, setWholesale] = useState(String(TRADE_STANDARD.sellInPerBottle));
  const [manufacturer, setManufacturer] = useState(String(TRADE_STANDARD.landedPerBottle));
  const [sellOut, setSellOut] = useState(String(TRADE_STANDARD.wholesalerToRetailPerBottle));
  const [broker, setBroker] = useState(String(TRADE_STANDARD.brokerPerBottle));
  const [caseSize, setCaseSize] = useState("12");
  const [producerId, setProducerId] = useState("");
  const [releaseType, setReleaseType] = useState<string>(RELEASE_TYPES[0]);
  const [markets, setMarkets] = useState<Set<string>>(
    () => new Set(["United States", "Japan", "France"]),
  );
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const toggleMarket = (mk: string) => {
    setMarkets((prev) => {
      const next = new Set(prev);
      if (next.has(mk)) next.delete(mk);
      else next.add(mk);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const skuNorm = sku.trim().toUpperCase();
    const productName = name.trim();
    if (!skuNorm || !productName) {
      toast.error(t("Product name and SKU code are required"));
      return;
    }
    if (existingSkus.some((s) => s.toLowerCase() === skuNorm.toLowerCase())) {
      toast.error(t("This SKU already exists"));
      return;
    }
    if (!producerId) {
      toast.error(t("Select a Distilleries partner"));
      return;
    }

    const cs = Math.max(1, Math.round(Number(caseSize) || 12));
    const msrpCasePrice = bottlePriceToCase(parsePriceInput(msrp), cs);
    const wholesaleCasePrice = bottlePriceToCase(parsePriceInput(wholesale), cs);
    const manufacturerCasePrice = bottlePriceToCase(parsePriceInput(manufacturer), cs);
    const distributorSellOutCasePrice = bottlePriceToCase(parsePriceInput(sellOut), cs);
    const brokerN = parsePriceInput(broker);

    let shortDescription = `${style} · ${size}`;
    if (polish.trim()) shortDescription += ` · ${polish.trim()}`;
    if (releaseType.includes("Seasonal")) shortDescription += " · seasonal";
    if (releaseType.includes("Limited")) shortDescription += " · limited";

    const { status, shortDescription: descFinal } = productFromAvailability(
      releaseAvailability(releaseType),
      shortDescription,
    );

    const product: Product = {
      sku: skuNorm,
      name: productName,
      size,
      caseSize: cs,
      status,
      shortDescription: descFinal,
      msrpCasePrice,
      wholesaleCasePrice,
      manufacturerCasePrice,
      distributorSellOutCasePrice,
      brokerCommissionPerBottle: brokerN ?? TRADE_STANDARD.brokerPerBottle,
      minOrderCases: Math.max(1, markets.size),
      abv: polish.trim() || undefined,
      producerId,
      producerName: distilleries.find((d) => d.id === producerId)?.name,
    };

    setSubmitting(true);
    try {
      const res = await onCreate(product);
      if (res.success) setShowSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <HqOperatorPage className="space-y-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <Link
          to="/inventory"
          className="hq-btn hq-btn-outline hq-btn-sm inline-flex items-center gap-1.5 no-underline"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          {t("Product catalog")}
        </Link>
        <span className="text-xs text-muted-foreground">/ {t("Add SKU")}</span>
      </div>

      <HqOperatorPageHeader
        title="Add SKU"
        description="Add a new product to the master catalog. Once published, it becomes available for production and market allocation."
      />

      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-4">
            <HqOperatorCard className="hq-settings-panel">
              <div className="hq-settings-title">{t("Product details")}</div>
              <div className="hq-form-group">
                <label htmlFor="add-sku-name">{t("Product name")}</label>
                <input
                  id="add-sku-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Yukimi Daiginjo"
                  disabled={submitting}
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="hq-form-group mb-0">
                  <label htmlFor="add-sku-code">{t("SKU code")}</label>
                  <input
                    id="add-sku-code"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. HJM-YK-720"
                    disabled={submitting}
                    className="font-mono"
                    required
                  />
                </div>
                <div className="hq-form-group mb-0">
                  <label htmlFor="add-sku-size">{t("Bottle size")}</label>
                  <select
                    id="add-sku-size"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    disabled={submitting}
                    className="hq-form-select"
                  >
                    {BOTTLE_SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hq-form-group mb-0">
                  <label htmlFor="add-sku-style">{t("Style")}</label>
                  <select
                    id="add-sku-style"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    disabled={submitting}
                    className="hq-form-select"
                  >
                    {STYLES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hq-form-group mb-0">
                  <label htmlFor="add-sku-polish">{t("Polish ratio (seimaibuai)")}</label>
                  <input
                    id="add-sku-polish"
                    value={polish}
                    onChange={(e) => setPolish(e.target.value)}
                    placeholder="e.g. 50%"
                    disabled={submitting}
                  />
                </div>
              </div>
            </HqOperatorCard>

            <HqOperatorCard className="hq-settings-panel">
              <div className="hq-settings-title">{t("Canada trade pricing (CAD / bottle)")}</div>
              <p className="mb-3 text-[12px] text-muted-foreground">
                Defaults to First Press standard.{" "}
                <Link to="/brand-kit#trade-pricing" className="text-accent underline">
                  Trade pricing policy
                </Link>
              </p>
              <HqBtn
                type="button"
                variant="outline"
                size="sm"
                className="mb-3"
                disabled={submitting}
                onClick={() => {
                  setManufacturer(String(TRADE_STANDARD.landedPerBottle));
                  setWholesale(String(TRADE_STANDARD.sellInPerBottle));
                  setSellOut(String(TRADE_STANDARD.wholesalerToRetailPerBottle));
                  setMsrp(String(TRADE_STANDARD.srpPerBottle));
                  setBroker(String(TRADE_STANDARD.brokerPerBottle));
                }}
              >
                {t("Apply First Press standard")}
              </HqBtn>
              {(() => {
                const sellInN = parsePriceInput(wholesale);
                const brokerN = parsePriceInput(broker) ?? TRADE_STANDARD.brokerPerBottle;
                if (sellInN == null) return null;
                if (hajimeNetBreaksGuardrail(sellInN, brokerN)) {
                  return <p className="mb-3 text-[12px] text-[hsl(0_68%_44%)]">Hajime net after broker is below $44 / bottle.</p>;
                }
                if (hajimeNetNeedsWarn(sellInN, brokerN)) {
                  return <p className="mb-3 text-[12px] text-[hsl(30_80%_34%)]">Hajime net after broker is below $45 / bottle.</p>;
                }
                return null;
              })()}
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="hq-form-group mb-0">
                  <label htmlFor="add-sku-distillery">{t("Landed cost")}</label>
                  <input
                    id="add-sku-distillery"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    placeholder="30"
                    disabled={submitting}
                  />
                </div>
                <div className="hq-form-group mb-0">
                  <label htmlFor="add-sku-wholesale">{t("Hajime sell-in")}</label>
                  <input
                    id="add-sku-wholesale"
                    value={wholesale}
                    onChange={(e) => setWholesale(e.target.value)}
                    placeholder="48"
                    disabled={submitting}
                  />
                </div>
                <div className="hq-form-group mb-0">
                  <label htmlFor="add-sku-sellout">{t("Wholesaler to retailer")}</label>
                  <input
                    id="add-sku-sellout"
                    value={sellOut}
                    onChange={(e) => setSellOut(e.target.value)}
                    placeholder="60"
                    disabled={submitting}
                  />
                </div>
                <div className="hq-form-group mb-0">
                  <label htmlFor="add-sku-msrp">{t("Suggested retail")}</label>
                  <input
                    id="add-sku-msrp"
                    value={msrp}
                    onChange={(e) => setMsrp(e.target.value)}
                    placeholder="93"
                    disabled={submitting}
                  />
                </div>
                <div className="hq-form-group mb-0">
                  <label htmlFor="add-sku-broker">{t("Broker $/bottle")}</label>
                  <input
                    id="add-sku-broker"
                    value={broker}
                    onChange={(e) => setBroker(e.target.value)}
                    placeholder="3"
                    disabled={submitting}
                  />
                </div>
                <div className="hq-form-group mb-0">
                  <label htmlFor="add-sku-case">{t("Case size")}</label>
                  <select
                    id="add-sku-case"
                    value={caseSize}
                    onChange={(e) => setCaseSize(e.target.value)}
                    disabled={submitting}
                    className="hq-form-select"
                  >
                    {CASE_SIZES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hq-form-group mb-0">
                  <label htmlFor="add-sku-producer">{t("Produced by")}</label>
                  <select
                    id="add-sku-producer"
                    value={producerId}
                    onChange={(e) => setProducerId(e.target.value)}
                    disabled={submitting}
                    className="hq-form-select"
                    required
                  >
                    <option value="">{t("Select distillery")}</option>
                    {distilleries.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </HqOperatorCard>

            <HqOperatorCard className="hq-settings-panel">
              <div className="hq-settings-title">{t("Availability")}</div>
              <div className="hq-form-group">
                <label htmlFor="add-sku-release">{t("Release type")}</label>
                <select
                  id="add-sku-release"
                  value={releaseType}
                  onChange={(e) => setReleaseType(e.target.value)}
                  disabled={submitting}
                  className="hq-form-select"
                >
                  {RELEASE_TYPES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hq-form-group mb-0">
                <label>{t("Markets (countries)")}</label>
                <div className="mt-0.5 flex flex-wrap gap-2.5">
                  {MARKET_OPTIONS.map((mk) => (
                    <label
                      key={mk}
                      className={cn(
                        "hq-market-chip inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-[13px]",
                        markets.has(mk) && "border-accent/40 bg-accent/5",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={markets.has(mk)}
                        onChange={() => toggleMarket(mk)}
                        className="accent-[hsl(var(--accent))]"
                        disabled={submitting}
                      />
                      {mk}
                    </label>
                  ))}
                </div>
              </div>
            </HqOperatorCard>
          </div>

          <div className="flex flex-col gap-3.5">
            <HqOperatorCard className="sticky top-5 p-5">
              <div className="mb-3.5 border-b border-border/50 pb-3 text-sm font-semibold">
                {t("Bottle preview")}
              </div>
              <div className="flex justify-center py-2 pb-4">
                <div
                  className="relative h-24 w-11 rounded-[5px_5px_9px_9px] border border-[hsl(38_16%_76%)]"
                  style={{
                    background: "linear-gradient(160deg, hsl(40 30% 88%), hsl(38 20% 80%))",
                  }}
                >
                  <div className="absolute left-1/2 top-0 h-[11px] w-3.5 -translate-x-1/2 rounded-sm bg-[hsl(35_14%_70%)]" />
                  <div className="absolute bottom-[18px] left-1 right-1 h-[30px] rounded-sm bg-[hsl(40_20%_99%)]" />
                </div>
              </div>
              <p className="mb-4 text-center text-xs leading-relaxed text-muted-foreground">
                {t("Label artwork can be uploaded after the SKU is created.")}
              </p>
              <HqBtn type="submit" variant="accent" className="h-[42px] w-full" disabled={submitting}>
                {submitting ? t("Publishing…") : t("Publish SKU")}
              </HqBtn>
              <HqBtnLink to="/inventory" variant="outline" className="mt-2 w-full justify-center">
                {t("Cancel")}
              </HqBtnLink>
            </HqOperatorCard>
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
              {t("SKU published")}
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              {t(
                "The new SKU is now in the master catalog and available for production requests and market allocation.",
              )}
            </p>
            <HqBtn variant="accent" size="sm" className="mt-5" onClick={() => navigate("/inventory")}>
              {t("Back to catalog")}
            </HqBtn>
          </div>
        </div>
      ) : null}
    </HqOperatorPage>
  );
}
