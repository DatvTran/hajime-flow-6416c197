import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import type { NewProductRequest } from "@/data/mockData";
import { BASE_SPIRIT_OPTIONS, formatBaseSpiritLabel } from "@/lib/base-spirit-options";
import { getPurchaseOrderManufacturerOptions } from "@/lib/api-v1-mutations";
import {
  buildHqManufacturerPickerOptions,
  guaranteedHqPartnerPickerOptions,
  type HqManufacturerPickerOption,
} from "@/lib/hq-manufacturer-picker-options";
import { kuraShortName } from "@/lib/hq-product-development-display";
import { cn } from "@/lib/utils";
import { useAccounts } from "@/contexts/AppDataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/components/ui/sonner";
import {
  HqBtn,
  HqBtnLink,
  HqOperatorCard,
  HqOperatorPage,
  HqOperatorPageHeader,
  HqOperatorSrcChip,
} from "@/components/hq/HqOperatorUi";

type Props = {
  onCreate: (npr: Omit<NewProductRequest, "id">) => Promise<{ success: boolean }>;
};

type SubmitMode = "draft" | "submitted";

function addMonthsISO(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function formatPricePoint(value: NewProductRequest["specs"]["targetPricePoint"]): string {
  return value.replace(/_/g, " ");
}

export function HqNewProductRequestView({ onCreate }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const { accounts } = useAccounts();
  const defaultManufacturers = guaranteedHqPartnerPickerOptions();

  const [title, setTitle] = useState("");
  const [baseSpirit, setBaseSpirit] = useState("rhum");
  const [targetAbv, setTargetAbv] = useState("25");
  const [flavorProfile, setFlavorProfile] = useState("");
  const [sweetener, setSweetener] = useState("cane_sugar");
  const [targetPricePoint, setTargetPricePoint] =
    useState<NewProductRequest["specs"]["targetPricePoint"]>("super_premium");
  const [bottleSize, setBottleSize] = useState<NewProductRequest["specs"]["packaging"]["bottleSize"]>("750ml");
  const [caseConfiguration, setCaseConfiguration] = useState("12");
  const [labelStyle, setLabelStyle] = useState("");
  const [minimumOrderQuantity, setMinimumOrderQuantity] = useState("1200");
  const [targetLaunchDate, setTargetLaunchDate] = useState(addMonthsISO(3));
  const [regulatoryMarkets, setRegulatoryMarkets] = useState("Ontario, US");
  const [notes, setNotes] = useState("");
  const [manufacturerChoices, setManufacturerChoices] = useState<HqManufacturerPickerOption[]>(
    () => defaultManufacturers,
  );
  const [manufacturerKey, setManufacturerKey] = useState(() => defaultManufacturers[0]?.key ?? "");
  const [manufacturerPickerHasCrm, setManufacturerPickerHasCrm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMode, setSuccessMode] = useState<SubmitMode>("draft");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = (await getPurchaseOrderManufacturerOptions()) as { data?: HqManufacturerPickerOption[] };
        const rows = Array.isArray(res.data) ? res.data : [];
        if (cancelled) return;
        const merged = buildHqManufacturerPickerOptions(rows, accounts);
        setManufacturerChoices(merged);
        setManufacturerKey((prev) => (merged.some((m) => m.key === prev) ? prev : merged[0]?.key ?? ""));
        setManufacturerPickerHasCrm(rows.some((r) => Boolean(r.crmMemberId)));
      } catch {
        /* keep fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accounts]);

  const selectedManufacturer = useMemo(
    () => manufacturerChoices.find((c) => c.key === manufacturerKey) ?? null,
    [manufacturerChoices, manufacturerKey],
  );

  const manufacturerDisplayLabel = selectedManufacturer?.label ?? manufacturerChoices[0]?.label ?? "";

  const summaryRows = useMemo(
    () => [
      { label: "Product", value: title.trim() || "—" },
      {
        label: "Spirit / ABV",
        value: title.trim()
          ? `${formatBaseSpiritLabel(baseSpirit)} · ${targetAbv}%`
          : "—",
      },
      { label: "Price point", value: formatPricePoint(targetPricePoint) },
      {
        label: "Packaging",
        value: `${bottleSize} · ${caseConfiguration}-bottle case`,
      },
      {
        label: "Minimum order",
        value: minimumOrderQuantity ? `${Number(minimumOrderQuantity).toLocaleString()} bottles` : "—",
      },
      { label: "Target launch", value: targetLaunchDate || "—" },
      { label: "Manufacturer", value: manufacturerDisplayLabel || "—" },
      {
        label: "Markets",
        value: regulatoryMarkets.trim() || "—",
      },
    ],
    [
      title,
      baseSpirit,
      targetAbv,
      targetPricePoint,
      bottleSize,
      caseConfiguration,
      minimumOrderQuantity,
      targetLaunchDate,
      manufacturerDisplayLabel,
      regulatoryMarkets,
    ],
  );

  const buildRequest = (mode: SubmitMode): Omit<NewProductRequest, "id"> => ({
    title: title.trim(),
    requestedBy: "brand_operator",
    requestedAt: new Date().toISOString(),
    specs: {
      baseSpirit,
      targetAbv: Number(targetAbv) || 25,
      flavorProfile: flavorProfile
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
      sweetener: sweetener || undefined,
      targetPricePoint,
      packaging: {
        bottleSize,
        labelStyle: labelStyle.trim(),
        caseConfiguration: Math.max(1, Math.round(Number(caseConfiguration) || 12)),
      },
      minimumOrderQuantity: Math.max(1, Math.round(Number(minimumOrderQuantity) || 1200)),
      targetLaunchDate,
      regulatoryMarkets: regulatoryMarkets.split(",").map((m) => m.trim()).filter(Boolean),
    },
    attachments: [],
    notes: notes.trim(),
    status: mode === "submitted" ? "submitted" : "draft",
    assignedManufacturer: manufacturerDisplayLabel,
    ...(mode === "submitted" ? { submittedAt: new Date().toISOString() } : {}),
  });

  const handleSubmit = async (mode: SubmitMode) => {
    if (!title.trim()) {
      toast.error(t("Product name is required"));
      return;
    }
    if (!manufacturerKey || !manufacturerDisplayLabel) {
      toast.error(t("Select a manufacturer"), {
        description: t("Choose which manufacturer should receive this product brief."),
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await onCreate(buildRequest(mode));
      if (res.success) {
        setSuccessMode(mode);
        setShowSuccess(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <HqOperatorPage className="space-y-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <Link
          to="/product-development"
          className="hq-btn hq-btn-outline hq-btn-sm inline-flex items-center gap-1.5 no-underline"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          {t("Product development")}
        </Link>
        <span className="text-xs text-muted-foreground">/ {t("New request")}</span>
      </div>

      <HqOperatorPageHeader
        title="New product development request"
        rawTitle
        description="Brief a manufacturer on a new SKU. They review feasibility, costing, and timeline before you approve it for the catalog."
      />

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <HqOperatorCard className="hq-settings-panel">
            <div className="hq-settings-title">{t("Product brief")}</div>
            <div className="hq-form-group">
              <label htmlFor="npr-title">{t("Product name")}</label>
              <input
                id="npr-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hazelnut Coffee Rhum 30%"
                disabled={submitting}
              />
            </div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="hq-form-group mb-0">
                <label htmlFor="npr-spirit">{t("Base spirit")}</label>
                <select
                  id="npr-spirit"
                  value={baseSpirit}
                  onChange={(e) => setBaseSpirit(e.target.value)}
                  disabled={submitting}
                  className="hq-form-select"
                >
                  {BASE_SPIRIT_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hq-form-group mb-0">
                <label htmlFor="npr-abv">{t("Target ABV (%)")}</label>
                <input
                  id="npr-abv"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={targetAbv}
                  onChange={(e) => setTargetAbv(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="hq-form-group mb-0 sm:col-span-2">
                <label htmlFor="npr-flavors">{t("Flavor profile")}</label>
                <input
                  id="npr-flavors"
                  value={flavorProfile}
                  onChange={(e) => setFlavorProfile(e.target.value)}
                  placeholder="hazelnut, vanilla, caramel"
                  disabled={submitting}
                />
              </div>
              <div className="hq-form-group mb-0">
                <label htmlFor="npr-sweetener">{t("Sweetener")}</label>
                <select
                  id="npr-sweetener"
                  value={sweetener}
                  onChange={(e) => setSweetener(e.target.value)}
                  disabled={submitting}
                  className="hq-form-select"
                >
                  <option value="cane_sugar">Cane sugar</option>
                  <option value="honey">Honey</option>
                  <option value="agave">Agave</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div className="hq-form-group mb-0">
                <label htmlFor="npr-price">{t("Target price point")}</label>
                <select
                  id="npr-price"
                  value={targetPricePoint}
                  onChange={(e) =>
                    setTargetPricePoint(e.target.value as NewProductRequest["specs"]["targetPricePoint"])
                  }
                  disabled={submitting}
                  className="hq-form-select"
                >
                  <option value="premium">Premium</option>
                  <option value="super_premium">Super premium</option>
                  <option value="ultra_premium">Ultra premium</option>
                </select>
              </div>
            </div>
          </HqOperatorCard>

          <HqOperatorCard className="hq-settings-panel">
            <div className="hq-settings-title">{t("Packaging & volume")}</div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="hq-form-group mb-0">
                <label htmlFor="npr-bottle">{t("Bottle size")}</label>
                <select
                  id="npr-bottle"
                  value={bottleSize}
                  onChange={(e) =>
                    setBottleSize(e.target.value as NewProductRequest["specs"]["packaging"]["bottleSize"])
                  }
                  disabled={submitting}
                  className="hq-form-select"
                >
                  <option value="375ml">375ml</option>
                  <option value="750ml">750ml</option>
                  <option value="1000ml">1000ml</option>
                </select>
              </div>
              <div className="hq-form-group mb-0">
                <label htmlFor="npr-case">{t("Case configuration")}</label>
                <input
                  id="npr-case"
                  type="number"
                  min={1}
                  step={1}
                  value={caseConfiguration}
                  onChange={(e) => setCaseConfiguration(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="hq-form-group mb-0">
                <label htmlFor="npr-moq">{t("Minimum order (bottles)")}</label>
                <input
                  id="npr-moq"
                  type="number"
                  min={1}
                  step={1}
                  value={minimumOrderQuantity}
                  onChange={(e) => setMinimumOrderQuantity(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="hq-form-group mb-0 sm:col-span-2">
                <label htmlFor="npr-label">{t("Label style / design direction")}</label>
                <input
                  id="npr-label"
                  value={labelStyle}
                  onChange={(e) => setLabelStyle(e.target.value)}
                  placeholder="Minimalist ensō with copper foil"
                  disabled={submitting}
                />
              </div>
            </div>
          </HqOperatorCard>

          <HqOperatorCard className="hq-settings-panel">
            <div className="hq-settings-title">{t("Launch & assignment")}</div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="hq-form-group mb-0">
                <label htmlFor="npr-launch">{t("Target launch date")}</label>
                <input
                  id="npr-launch"
                  type="date"
                  value={targetLaunchDate}
                  onChange={(e) => setTargetLaunchDate(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="hq-form-group mb-0">
                <label htmlFor="npr-markets">{t("Regulatory markets")}</label>
                <input
                  id="npr-markets"
                  value={regulatoryMarkets}
                  onChange={(e) => setRegulatoryMarkets(e.target.value)}
                  placeholder="Ontario, US, EU"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="mt-4 border-t border-border/40 pt-4">
              <div className="mb-2 text-[12px] font-medium">{t("Assign to manufacturer")}</div>
              <p className="mb-3 text-[12px] leading-relaxed text-muted-foreground">
                {manufacturerPickerHasCrm
                  ? t("Contacts from Settings → CRM. Profile company names are preferred when the email matches.")
                  : t("Choose which manufacturer should receive this brief.")}
              </p>
              <div
                className="grid gap-2"
                role="radiogroup"
                aria-label={t("Assign to manufacturer")}
              >
                {manufacturerChoices.map((row) => {
                  const selected = manufacturerKey === row.key;
                  return (
                    <button
                      key={row.key}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={submitting}
                      onClick={() => setManufacturerKey(row.key)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                        selected
                          ? "border-[hsl(280_40%_50%/0.45)] bg-[hsl(280_40%_50%/0.06)]"
                          : "border-border/70 hover:bg-muted/30",
                        submitting && "pointer-events-none opacity-60",
                      )}
                    >
                      <HqOperatorSrcChip variant="kura">
                        {kuraShortName(row.label)}
                      </HqOperatorSrcChip>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium leading-snug">{row.label}</div>
                        {row.sub ? (
                          <div className="mt-0.5 text-[11px] text-muted-foreground">{row.sub}</div>
                        ) : null}
                        {row.email ? (
                          <div className="text-[11px] text-muted-foreground">{row.email}</div>
                        ) : null}
                      </div>
                      <div
                        className={cn(
                          "mt-1 size-4 shrink-0 rounded-full border-2 transition-colors",
                          selected
                            ? "border-[hsl(280_40%_50%)] bg-[hsl(280_40%_50%)]"
                            : "border-border bg-background",
                        )}
                        aria-hidden
                      />
                    </button>
                  );
                })}
              </div>
              <p className="mt-2.5 text-[11px] text-muted-foreground">
                {t("Need another manufacturer?")}{" "}
                <Link to="/manufacturer/profiles/add" className="text-foreground underline-offset-2 hover:underline">
                  {t("Add manufacturer")}
                </Link>
              </p>
            </div>
          </HqOperatorCard>

          <HqOperatorCard className="hq-settings-panel">
            <div className="hq-settings-title">{t("Notes for the manufacturer")}</div>
            <div className="hq-form-group mb-0">
              <label htmlFor="npr-notes">{t("Context & requirements")}</label>
              <textarea
                id="npr-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Competitor references, positioning, tasting requirements, regulatory constraints…"
                rows={4}
                disabled={submitting}
              />
            </div>
          </HqOperatorCard>
        </div>

        <div className="flex flex-col gap-3.5">
          <HqOperatorCard className="sticky top-5 p-5">
            <div className="mb-3.5 border-b border-border/50 pb-3 text-sm font-semibold">
              {t("Request summary")}
            </div>
            <div className="space-y-0">
              {summaryRows.map((row, i) => (
                <div
                  key={row.label}
                  className="flex justify-between gap-3 py-1.5 text-[13px]"
                  style={
                    i < summaryRows.length - 1
                      ? { borderBottom: "1px solid hsl(var(--border) / 0.3)" }
                      : undefined
                  }
                >
                  <span className="text-muted-foreground">{t(row.label)}</span>
                  <span className="max-w-[58%] truncate text-right font-medium">{row.value}</span>
                </div>
              ))}
            </div>

            {selectedManufacturer ? (
              <div className="mt-4 border-t border-border/50 pt-4">
                <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t("Send brief to")}
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
                  <HqOperatorSrcChip variant="kura">
                    {kuraShortName(selectedManufacturer.label)}
                  </HqOperatorSrcChip>
                  <div className="min-w-0 flex-1 text-[11px] leading-relaxed text-muted-foreground">
                    <p className="font-medium text-foreground">{selectedManufacturer.label}</p>
                    {selectedManufacturer.sub ? <p>{selectedManufacturer.sub}</p> : null}
                    {selectedManufacturer.email ? <p>{selectedManufacturer.email}</p> : null}
                  </div>
                </div>
              </div>
            ) : null}

            <HqBtn
              type="button"
              variant="accent"
              className="mt-4 h-[42px] w-full"
              disabled={submitting || !manufacturerKey}
              onClick={() => void handleSubmit("submitted")}
            >
              {submitting
                ? t("Sending…")
                : manufacturerDisplayLabel
                  ? `${t("Send brief to")} ${manufacturerDisplayLabel}`
                  : t("Send brief to manufacturer")}
            </HqBtn>
            <HqBtn
              type="button"
              variant="outline"
              className="mt-2 w-full justify-center"
              disabled={submitting}
              onClick={() => void handleSubmit("draft")}
            >
              {t("Save as draft")}
            </HqBtn>
            <HqBtnLink to="/product-development" variant="outline" className="mt-2 w-full justify-center">
              {t("Cancel")}
            </HqBtnLink>
          </HqOperatorCard>

          <div className="rounded-[14px] border border-[hsl(280_40%_50%/0.2)] bg-[hsl(280_40%_50%/0.06)] p-4 text-xs leading-relaxed text-[hsl(280_30%_42%)]">
            <strong className="text-[hsl(280_40%_44%)]">{t("Next:")}</strong>{" "}
            {t(
              "the manufacturer reviews feasibility and returns a proposal with costing and timeline. You approve before the SKU enters the catalog.",
            )}
          </div>
        </div>
      </div>

      {showSuccess ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[hsl(24_12%_8%/0.5)] p-4 backdrop-blur-sm">
          <div className="w-full max-w-[380px] rounded-[18px] border border-border bg-card p-8 text-center shadow-[var(--shadow-float)]">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[hsl(158_56%_36%/0.12)] text-[hsl(158_56%_32%)]">
              <Check className="size-7" strokeWidth={1.75} />
            </div>
            <div className="font-display text-xl font-semibold tracking-[-0.01em]">
              {successMode === "submitted"
                ? `${t("Brief sent to")} ${manufacturerDisplayLabel}`
                : t("Request saved")}
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              {successMode === "submitted"
                ? `${manufacturerDisplayLabel} ${t("will review feasibility and return a proposal with costing and timeline.")}`
                : t("Saved as draft — submit from Product development when the spec is ready.")}
            </p>
            <HqBtn variant="accent" size="sm" className="mt-5" onClick={() => navigate("/product-development")}>
              {t("Back to Product development")}
            </HqBtn>
          </div>
        </div>
      ) : null}
    </HqOperatorPage>
  );
}
