import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Box, Check } from "lucide-react";
import type { Product } from "@/data/mockData";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/components/ui/sonner";
import {
  formatCatalogPrice,
  parsePriceInput,
  productFromAvailability,
  msrpPerBottle,
  manufacturerPerBottle,
  bottlePriceToCase,
  typeLabelForProduct,
  wholesalePerBottle,
} from "@/lib/hq-product-catalog";
import {
  HqBtn,
  HqBtnLink,
  HqOperatorCard,
  HqOperatorPage,
  HqOperatorPageHeader,
} from "@/components/hq/HqOperatorUi";
import { cn } from "@/lib/utils";

const BOTTLE_SIZES = ["720ml", "750ml", "500ml", "300ml", "1.8L"] as const;
const STYLES = ["Junmai Daiginjo", "Junmai Ginjo", "Junmai", "Genshu", "Nigori", "Honjozo", "Coffee Rice"] as const;
const CASE_SIZES = [12, 6, 24] as const;
const PRODUCERS = ["Kuramoto Brewing", "Echigo Kura"] as const;
const RELEASE_TYPES = ["Core — always available", "Seasonal", "Limited lot"] as const;
const AVAILABILITY = ["active", "seasonal", "limited", "development"] as const;
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

type Mode = "add" | "edit";

type Props = {
  mode: Mode;
  product?: Product;
  existingSkus: string[];
  onSave: (product: Product) => Promise<{ success: boolean }>;
  onDiscontinue?: (sku: string) => Promise<{ success: boolean }>;
};

function defaultMarkets(): Set<string> {
  return new Set(["United States", "Japan", "France"]);
}

export function HqSkuFormView({ mode, product, existingSkus, onSave, onDiscontinue }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  const initial = useMemo(() => {
    if (!product) {
      return {
        sku: "",
        name: "",
        typeLine: "",
        style: STYLES[0],
        size: "750ml",
        caseSize: 12,
        msrp: "",
        wholesale: "",
        manufacturer: "",
        producer: PRODUCERS[0],
        availability: "active" as (typeof AVAILABILITY)[number],
        releaseType: RELEASE_TYPES[0],
        imageUrl: "",
        markets: defaultMarkets(),
      };
    }
    const w = wholesalePerBottle(product);
    const m = manufacturerPerBottle(product);
    const r = msrpPerBottle(product);
    const desc = typeLabelForProduct(product);
    const avail = desc.toLowerCase().includes("seasonal")
      ? "seasonal"
      : desc.toLowerCase().includes("limited")
        ? "limited"
        : product.status === "development"
          ? "development"
          : "active";
    return {
      sku: product.sku,
      name: product.name,
      typeLine: desc,
      style: STYLES.find((s) => desc.includes(s)) ?? STYLES[0],
      size: product.size || "750ml",
      caseSize: product.caseSize || 12,
      msrp: r != null ? String(Math.round(r)) : "",
      wholesale: w != null ? String(Math.round(w)) : "",
      manufacturer: m != null ? String(Math.round(m)) : "",
      producer: product.sku.startsWith("EU-") ? PRODUCERS[1] : PRODUCERS[0],
      availability: avail as (typeof AVAILABILITY)[number],
      releaseType: RELEASE_TYPES[0],
      imageUrl: product.imageUrl || "",
      markets: defaultMarkets(),
    };
  }, [product]);

  const [name, setName] = useState(initial.name);
  const [sku, setSku] = useState(initial.sku);
  const [typeLine, setTypeLine] = useState(initial.typeLine);
  const [style, setStyle] = useState(initial.style);
  const [size, setSize] = useState(initial.size);
  const [caseSize, setCaseSize] = useState(String(initial.caseSize));
  const [msrp, setMsrp] = useState(initial.msrp);
  const [wholesale, setWholesale] = useState(initial.wholesale);
  const [manufacturer, setManufacturer] = useState(initial.manufacturer);
  const [producer, setProducer] = useState(initial.producer);
  const [availability, setAvailability] = useState(initial.availability);
  const [releaseType, setReleaseType] = useState(initial.releaseType);
  const [imageUrl, setImageUrl] = useState(initial.imageUrl);
  const [markets, setMarkets] = useState(initial.markets);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const buildProduct = (): Product | null => {
    const skuNorm = sku.trim().toUpperCase();
    const productName = name.trim();
    if (!skuNorm || !productName) return null;

    const originalSku = (product?.sku ?? "").trim().toLowerCase();
    if (
      existingSkus.some(
        (s) => s.toLowerCase() === skuNorm.toLowerCase() && s.toLowerCase() !== originalSku,
      )
    ) {
      return null;
    }

    const cs = Math.max(1, Math.round(Number(caseSize) || 12));
    const msrpCasePrice = bottlePriceToCase(parsePriceInput(msrp), cs);
    const wholesaleCasePrice = bottlePriceToCase(parsePriceInput(wholesale), cs);
    const manufacturerCasePrice = bottlePriceToCase(parsePriceInput(manufacturer), cs);

    const shortDescription =
      isEdit && typeLine.trim()
        ? typeLine.trim()
        : `${style} · ${size}${releaseType.includes("Seasonal") ? " · seasonal" : releaseType.includes("Limited") ? " · limited" : ""}`;

    const { status, shortDescription: descFinal } = productFromAvailability(
      availability,
      shortDescription,
    );

    return {
      id: product?.id,
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
      imageUrl: imageUrl || undefined,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const skuNorm = sku.trim().toUpperCase();
    const originalSku = (product?.sku ?? "").trim().toLowerCase();
    if (
      existingSkus.some(
        (s) => s.toLowerCase() === skuNorm.toLowerCase() && s.toLowerCase() !== originalSku,
      )
    ) {
      toast.error(t("This SKU already exists"));
      return;
    }
    const built = buildProduct();
    if (!built) {
      toast.error(t("Product name and SKU are required"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await onSave(built);
      if (res.success) setShowSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscontinue = async () => {
    if (!product?.sku || !onDiscontinue) return;
    if (!window.confirm(t("Discontinue this SKU?"))) return;
    setSubmitting(true);
    try {
      const res = await onDiscontinue(product.sku);
      if (res.success) navigate("/inventory");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMarket = (mk: string) => {
    setMarkets((prev) => {
      const next = new Set(prev);
      if (next.has(mk)) next.delete(mk);
      else next.add(mk);
      return next;
    });
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
        <span className="text-xs text-muted-foreground">
          / {isEdit ? sku || product?.sku : t("Add SKU")}
        </span>
      </div>

      <HqOperatorPageHeader
        title={isEdit ? "Edit SKU" : "Add SKU"}
        description={
          isEdit
            ? "Update pricing, production source, and availability for this product."
            : "Add a new product to the master catalog. Once published, it becomes available for production and market allocation."
        }
      />

      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-4">
            <HqOperatorCard className="hq-settings-panel">
              <div className="hq-settings-title">{t("Product details")}</div>
              <div className="hq-form-group">
                <label htmlFor="sku-name">{t("Product name")}</label>
                <input
                  id="sku-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Yukimi Daiginjo"
                  disabled={submitting}
                  required
                />
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div className="hq-form-group mb-0">
                  <label htmlFor="sku-code">{t("SKU code")}</label>
                  <input
                    id="sku-code"
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="e.g. HJM-YK-720"
                    disabled={submitting}
                    required
                  />
                </div>
                {isEdit ? (
                  <div className="hq-form-group mb-0">
                    <label htmlFor="sku-type">{t("Type / size")}</label>
                    <input
                      id="sku-type"
                      value={typeLine}
                      onChange={(e) => setTypeLine(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                ) : (
                  <>
                    <div className="hq-form-group mb-0">
                      <label htmlFor="sku-size">{t("Bottle size")}</label>
                      <select
                        id="sku-size"
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
                    <div className="hq-form-group mb-0 sm:col-span-2 sm:col-auto">
                      <label htmlFor="sku-style">{t("Style")}</label>
                      <select
                        id="sku-style"
                        value={style}
                        onChange={(e) => setStyle(e.target.value as (typeof STYLES)[number])}
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
                      <label htmlFor="sku-polish">{t("Polish ratio (seimaibuai)")}</label>
                      <input id="sku-polish" placeholder="e.g. 50%" disabled={submitting} />
                    </div>
                  </>
                )}
              </div>
            </HqOperatorCard>

            <HqOperatorCard className="hq-settings-panel">
              <div className="hq-settings-title">{t("Pricing & production")}</div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div className="hq-form-group mb-0">
                  <label htmlFor="sku-msrp">{t("MSRP")}</label>
                  <input
                    id="sku-msrp"
                    value={msrp}
                    onChange={(e) => setMsrp(e.target.value)}
                    placeholder="$0.00"
                    disabled={submitting}
                  />
                </div>
                <div className="hq-form-group mb-0">
                  <label htmlFor="sku-wholesale">{t("Wholesaler price")}</label>
                  <input
                    id="sku-wholesale"
                    value={wholesale}
                    onChange={(e) => setWholesale(e.target.value)}
                    placeholder="$0.00"
                    disabled={submitting}
                  />
                </div>
                <div className="hq-form-group mb-0">
                  <label htmlFor="sku-manufacturer">{t("Manufacture price")}</label>
                  <input
                    id="sku-manufacturer"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    placeholder="$0.00"
                    disabled={submitting}
                  />
                </div>
                {!isEdit ? (
                  <div className="hq-form-group mb-0">
                    <label htmlFor="sku-case">{t("Case size")}</label>
                    <select
                      id="sku-case"
                      value={caseSize}
                      onChange={(e) => setCaseSize(e.target.value)}
                      disabled={submitting}
                      className="hq-form-select"
                    >
                      {CASE_SIZES.map((c) => (
                        <option key={c} value={c}>
                          {c} bottles
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div className="hq-form-group mb-0">
                  <label htmlFor="sku-producer">{t("Produced by")}</label>
                  <select
                    id="sku-producer"
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
                {isEdit ? (
                  <div className="hq-form-group mb-0">
                    <label htmlFor="sku-avail">{t("Availability")}</label>
                    <select
                      id="sku-avail"
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value as (typeof AVAILABILITY)[number])}
                      disabled={submitting}
                      className="hq-form-select"
                    >
                      {AVAILABILITY.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>
            </HqOperatorCard>

            {!isEdit ? (
              <HqOperatorCard className="hq-settings-panel">
                <div className="hq-settings-title">{t("Availability")}</div>
                <div className="hq-form-group">
                  <label htmlFor="sku-release">{t("Release type")}</label>
                  <select
                    id="sku-release"
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
                  <div className="mt-1 flex flex-wrap gap-2.5">
                    {MARKET_OPTIONS.map((mk) => (
                      <label
                        key={mk}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-[13px]",
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
            ) : null}
          </div>

          <div className="flex flex-col gap-3.5">
            <HqOperatorCard className="hq-settings-panel sticky top-5">
              <div className="hq-settings-title">
                {isEdit ? t("Product image") : t("Bottle preview")}
              </div>
              <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-[10px] border border-dashed border-border bg-muted/40">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="size-full object-contain" />
                ) : isEdit ? (
                  <div className="text-center text-muted-foreground">
                    <Box className="mx-auto size-7 opacity-50" strokeWidth={1.5} />
                    <div className="mt-2 text-xs">{t("No image yet")}</div>
                  </div>
                ) : (
                  <div
                    className="relative h-24 w-11 rounded-[5px_5px_9px_9px] border border-[hsl(38_16%_76%)]"
                    style={{
                      background: "linear-gradient(160deg, hsl(40 30% 88%), hsl(38 20% 80%))",
                    }}
                  >
                    <div className="absolute left-1/2 top-0 h-[11px] w-3.5 -translate-x-1/2 rounded-sm bg-[hsl(35_14%_70%)]" />
                    <div className="absolute bottom-[18px] left-1 right-1 h-[30px] rounded-sm bg-[hsl(40_20%_99%)]" />
                  </div>
                )}
              </div>
              {isEdit ? (
                <>
                  <label className="hq-btn hq-btn-outline flex w-full cursor-pointer justify-center">
                    {t("Upload image")}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={submitting}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === "string") setImageUrl(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    {t("PNG or JPG · bottle shot on white preferred")}
                  </p>
                </>
              ) : (
                <p className="mb-4 text-center text-xs text-muted-foreground">
                  {t("Label artwork can be uploaded after the SKU is created.")}
                </p>
              )}

              {!isEdit ? (
                <>
                  <HqBtn type="submit" variant="accent" className="h-[42px] w-full" disabled={submitting}>
                    {submitting ? t("Publishing…") : t("Publish SKU")}
                  </HqBtn>
                  <HqBtnLink to="/inventory" variant="outline" className="mt-2 w-full justify-center">
                    {t("Cancel")}
                  </HqBtnLink>
                </>
              ) : null}
            </HqOperatorCard>

            {isEdit ? (
              <HqOperatorCard className="hq-settings-panel">
                <div className="hq-settings-title">{t("Save changes")}</div>
                <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                  {t("Changes apply across the catalog and to all markets where this SKU is listed.")}
                  {sku.trim().toUpperCase() !== (product?.sku ?? "").toUpperCase() ? (
                    <span className="mt-1 block text-[hsl(38_90%_40%)]">
                      {t("Renaming the SKU code updates the master catalog identifier.")}
                    </span>
                  ) : null}
                </p>
                <HqBtn type="submit" variant="accent" className="h-[42px] w-full" disabled={submitting}>
                  {submitting ? t("Saving…") : t("Save SKU")}
                </HqBtn>
                <HqBtnLink to="/inventory" variant="outline" className="mt-2 w-full justify-center">
                  {t("Cancel")}
                </HqBtnLink>
                {onDiscontinue ? (
                  <button
                    type="button"
                    className="hq-btn mt-2 w-full border border-[hsl(0_68%_48%/0.25)] bg-[hsl(0_68%_48%/0.08)] text-[hsl(0_68%_40%)]"
                    disabled={submitting}
                    onClick={() => void handleDiscontinue()}
                  >
                    {t("Discontinue SKU")}
                  </button>
                ) : null}
              </HqOperatorCard>
            ) : null}
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
              {isEdit ? t("SKU updated") : t("SKU published")}
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              {isEdit
                ? t("Changes saved to the master catalog.")
                : t(
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
