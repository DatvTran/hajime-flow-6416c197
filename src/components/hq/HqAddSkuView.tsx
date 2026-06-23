import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import type { Product } from "@/data/mockData";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/components/ui/sonner";
import { bottlePriceToCase, parsePriceInput, productFromAvailability } from "@/lib/hq-product-catalog";
import {
  HqBtn,
  HqBtnLink,
  HqOperatorCard,
  HqOperatorPage,
  HqOperatorPageHeader,
} from "@/components/hq/HqOperatorUi";
import { cn } from "@/lib/utils";

const BOTTLE_SIZES = ["720ml", "750ml", "500ml", "300ml", "1.8L"] as const;
const STYLES = ["Junmai Daiginjo", "Junmai Ginjo", "Junmai", "Genshu", "Nigori", "Honjozo"] as const;
const CASE_SIZES = [
  { value: 12, label: "12 bottles" },
  { value: 6, label: "6 bottles" },
  { value: 24, label: "24 bottles" },
] as const;
const PRODUCERS = ["Kuramoto Brewing", "Echigo Kura"] as const;
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

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [size, setSize] = useState<string>("750ml");
  const [style, setStyle] = useState<string>(STYLES[0]);
  const [polish, setPolish] = useState("");
  const [msrp, setMsrp] = useState("");
  const [wholesale, setWholesale] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [caseSize, setCaseSize] = useState("12");
  const [producer, setProducer] = useState<string>(PRODUCERS[0]);
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

    const cs = Math.max(1, Math.round(Number(caseSize) || 12));
    const msrpCasePrice = bottlePriceToCase(parsePriceInput(msrp), cs);
    const wholesaleCasePrice = bottlePriceToCase(parsePriceInput(wholesale), cs);
    const manufacturerCasePrice = bottlePriceToCase(parsePriceInput(manufacturer), cs);

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
      minOrderCases: Math.max(1, markets.size),
      abv: polish.trim() || undefined,
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
              <div className="hq-settings-title">{t("Pricing & production")}</div>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="hq-form-group mb-0">
                  <label htmlFor="add-sku-msrp">{t("MSRP")}</label>
                  <input
                    id="add-sku-msrp"
                    value={msrp}
                    onChange={(e) => setMsrp(e.target.value)}
                    placeholder="$0.00"
                    disabled={submitting}
                  />
                </div>
                <div className="hq-form-group mb-0">
                  <label htmlFor="add-sku-wholesale">{t("Wholesaler price")}</label>
                  <input
                    id="add-sku-wholesale"
                    value={wholesale}
                    onChange={(e) => setWholesale(e.target.value)}
                    placeholder="$0.00"
                    disabled={submitting}
                  />
                </div>
                <div className="hq-form-group mb-0">
                  <label htmlFor="add-sku-manufacturer">{t("Manufacture price")}</label>
                  <input
                    id="add-sku-manufacturer"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    placeholder="$0.00"
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
                    value={producer}
                    onChange={(e) => setProducer(e.target.value)}
                    disabled={submitting}
                    className="hq-form-select"
                  >
                    {PRODUCERS.map((p) => (
                      <option key={p} value={p}>
                        {p}
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
