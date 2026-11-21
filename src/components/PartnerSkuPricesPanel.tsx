import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getAccountSkuPrices,
  getMySkuPrices,
  putAccountSkuPrices,
  putMySkuPrices,
  type PartnerPricingSettings,
  type PartnerSkuPriceRow,
} from "@/lib/api-v1";
import { SELL_OUT_CURRENCIES, purchaseCostLocal } from "@/lib/partner-sku-prices";
import { catalogSkuToExportCode } from "@/lib/export-catalog";
import { defaultUnitFob, listFobCaseUsd } from "@/lib/export-commercial";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HqBtn,
  HqOperatorCard,
  HqOperatorCardHead,
  HqOperatorDataTable,
} from "@/components/hq/HqOperatorUi";
import { cn } from "@/lib/utils";

type Mode = "hq_sell_in" | "distributor_sell_out";

type Props = {
  mode: Mode;
  /** Required for HQ mode (distributor account id). Ignored for me/sku-prices mode. */
  accountId?: string | null;
  /** Use plain page chrome instead of HQ operator cards (distributor Inventory). */
  plain?: boolean;
  className?: string;
};

function moneyStr(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(Number(v))) return "";
  return String(Number(v));
}

function formatMoney(v: number | null | undefined, currency = "USD"): string {
  if (v == null || !Number.isFinite(Number(v)) || Number(v) <= 0) return "—";
  return `${Number(v).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

export function PartnerSkuPricesPanel({ mode, accountId, plain, className }: Props) {
  const { t } = useLanguage();
  const [rows, setRows] = useState<PartnerSkuPriceRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<PartnerPricingSettings>({
    sellOutCurrency: "CAD",
    usdToLocalRate: null,
    sellInCurrency: "USD",
  });
  const [currencyDraft, setCurrencyDraft] = useState("CAD");
  const [rateDraft, setRateDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHq = mode === "hq_sell_in";
  const localCurrency = currencyDraft || settings.sellOutCurrency || "CAD";

  const applySheet = (res: {
    data?: PartnerSkuPriceRow[];
    settings?: PartnerPricingSettings;
  }) => {
    setRows(res.data ?? []);
    const nextSettings: PartnerPricingSettings = res.settings ?? {
      sellOutCurrency: "CAD",
      usdToLocalRate: null,
      sellInCurrency: "USD",
    };
    setSettings(nextSettings);
    setCurrencyDraft(nextSettings.sellOutCurrency || "CAD");
    setRateDraft(
      nextSettings.sellOutCurrency === "USD"
        ? "1"
        : moneyStr(nextSettings.usdToLocalRate),
    );
    const next: Record<string, string> = {};
    for (const r of res.data ?? []) {
      next[r.sku] = moneyStr(isHq ? r.sellInCasePrice : r.sellOutCasePrice);
    }
    setDrafts(next);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const load = async () => {
      try {
        const res =
          mode === "distributor_sell_out" && !accountId
            ? await getMySkuPrices()
            : await getAccountSkuPrices(String(accountId));
        if (cancelled) return;
        applySheet(res);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("Failed to load prices"));
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (mode === "hq_sell_in" && !accountId) {
      setLoading(false);
      setError(t("No distributor account linked."));
      return;
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on mode/account only
  }, [mode, accountId, isHq, t]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const prices = rows.map((r) => {
        const raw = drafts[r.sku]?.trim() ?? "";
        const n = raw === "" ? null : Number(raw.replace(/,/g, ""));
        const value = Number.isFinite(n as number) && (n as number) >= 0 ? (n as number) : null;
        return isHq
          ? { sku: r.sku, sellInCasePrice: value }
          : { sku: r.sku, sellOutCasePrice: value };
      });

      let settingsPayload: { sellOutCurrency: string; usdToLocalRate: number | null } | undefined;
      if (!isHq) {
        const cur = (currencyDraft || "CAD").toUpperCase();
        const rateRaw = rateDraft.trim();
        const rate =
          cur === "USD" ? 1 : rateRaw === "" ? null : Number(rateRaw.replace(/,/g, ""));
        if (cur !== "USD" && (rate == null || !Number.isFinite(rate) || rate <= 0)) {
          toast.error(t("Enter an FX rate greater than 0"), {
            description: t("Local currency units per 1 USD."),
          });
          setSaving(false);
          return;
        }
        settingsPayload = { sellOutCurrency: cur, usdToLocalRate: rate };
      }

      const res =
        mode === "distributor_sell_out" && !accountId
          ? await putMySkuPrices(prices, settingsPayload)
          : await putAccountSkuPrices(
              String(accountId),
              prices,
              isHq ? "sell_in" : "sell_out",
              settingsPayload,
            );
      applySheet(res);
      toast.success(isHq ? t("Negotiated sell-in saved") : t("Sell-out prices saved"));
    } catch (err) {
      toast.error(t("Could not save prices"), {
        description: err instanceof Error ? err.message : t("Try again."),
      });
    } finally {
      setSaving(false);
    }
  };

  const previewSettings: PartnerPricingSettings = {
    sellOutCurrency: localCurrency,
    usdToLocalRate:
      localCurrency === "USD"
        ? 1
        : rateDraft.trim() === ""
          ? null
          : Number(rateDraft.replace(/,/g, "")),
    sellInCurrency: "USD",
  };

  const title = isHq ? t("Negotiated pricing") : t("Your sell-out prices");
  const subtitle = isHq
    ? t(
        "FOB USD per bottle for this wholesaler. Case = FOB × bottles/case. Order line = Case × cases. List FOB is the default until set.",
      )
    : t(
        "Set your local currency and FX rate (local per 1 USD). Purchase cost converts from HQ sell-in; you set sell-out in local currency.",
      );

  const fxControls = !isHq ? (
    <div className={cn("flex flex-wrap items-end gap-3 border-b border-border/50", plain ? "px-3 py-3" : "px-5 py-3")}>
      <div className="space-y-1">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t("Sell-out currency")}
        </label>
        <select
          className="hq-form-select h-8 min-w-[100px] rounded-md border border-input bg-background px-2 text-sm"
          value={currencyDraft}
          disabled={saving || loading}
          onChange={(e) => {
            const next = e.target.value.toUpperCase();
            setCurrencyDraft(next);
            if (next === "USD") setRateDraft("1");
          }}
        >
          {SELL_OUT_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t("Local per 1 USD")}
        </label>
        <Input
          type="number"
          min={0}
          step={0.0001}
          inputMode="decimal"
          className="h-8 w-[140px] font-mono text-sm"
          value={rateDraft}
          disabled={saving || loading || currencyDraft === "USD"}
          placeholder="1.37"
          onChange={(e) => setRateDraft(e.target.value)}
        />
      </div>
      {isHq ? null : (
        <p className="pb-1 text-[11px] text-muted-foreground">
          {t("HQ sell-in is always USD.")}
        </p>
      )}
    </div>
  ) : null;

  const hqFxReadOnly =
    isHq && settings ? (
      <div className={cn("border-b border-border/50 text-xs text-muted-foreground", plain ? "px-3 py-2" : "px-5 py-2.5")}>
        {t("Partner sell-out")}: {settings.sellOutCurrency}
        {settings.usdToLocalRate != null
          ? ` · ${t("FX")} ${settings.usdToLocalRate} ${settings.sellOutCurrency}/USD`
          : settings.sellOutCurrency !== "USD"
            ? ` · ${t("FX not set")}`
            : ""}
      </div>
    ) : null;

  const body = (
    <>
      {fxControls}
      {hqFxReadOnly}
      {loading ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">{t("Loading prices…")}</p>
      ) : error ? (
        <p className="px-5 py-8 text-sm text-destructive">{error}</p>
      ) : rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">
          {t("No catalog SKUs yet.")}
        </p>
      ) : (
        <>
          <div className={cn(plain ? "overflow-x-auto" : "")}>
            {plain ? (
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 font-semibold">{t("SKU")}</th>
                    <th className="px-3 py-2 font-semibold">{t("Purchase USD")}</th>
                    <th className="px-3 py-2 font-semibold">{t("Cost")} ({localCurrency})</th>
                    <th className="px-3 py-2 font-semibold">
                      {t("Sell-out")} ({localCurrency})
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <PriceRow
                      key={r.sku}
                      row={r}
                      isHq={false}
                      draft={drafts[r.sku] ?? ""}
                      onChange={(v) => setDrafts((prev) => ({ ...prev, [r.sku]: v }))}
                      disabled={saving}
                      previewSettings={previewSettings}
                    />
                  ))}
                </tbody>
              </table>
            ) : (
              <HqOperatorDataTable>
                <thead>
                  <tr>
                    <th>{t("SKU")}</th>
                    <th>{t("List FOB USD / bottle")}</th>
                    <th>{t("Negotiated FOB USD / bottle")}</th>
                    <th>{t("Case USD")}</th>
                    <th>
                      {t("Cost")} ({settings.sellOutCurrency})
                    </th>
                    <th>
                      {t("Partner sell-out")} ({settings.sellOutCurrency})
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <PriceRow
                      key={r.sku}
                      row={r}
                      isHq
                      draft={drafts[r.sku] ?? ""}
                      onChange={(v) => setDrafts((prev) => ({ ...prev, [r.sku]: v }))}
                      disabled={saving}
                      asHq
                      previewSettings={settings}
                    />
                  ))}
                </tbody>
              </HqOperatorDataTable>
            )}
          </div>
          <div className={cn("flex justify-end border-t border-border/50", plain ? "px-3 py-3" : "px-5 py-3.5")}>
            {plain ? (
              <Button type="button" size="sm" disabled={saving} onClick={() => void handleSave()}>
                {saving ? t("Saving…") : t("Save sell-out")}
              </Button>
            ) : (
              <HqBtn variant="accent" size="sm" disabled={saving} onClick={() => void handleSave()}>
                {saving ? t("Saving…") : t("Save negotiated prices")}
              </HqBtn>
            )}
          </div>
        </>
      )}
    </>
  );

  if (plain) {
    return (
      <div className={cn("rounded-lg border bg-card", className)}>
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {body}
      </div>
    );
  }

  return (
    <HqOperatorCard className={cn("overflow-hidden p-0", className)}>
      <div className="px-5 pt-5">
        <HqOperatorCardHead title={title} subtitle={subtitle} />
      </div>
      {body}
    </HqOperatorCard>
  );
}

function PriceRow({
  row,
  isHq,
  draft,
  onChange,
  disabled,
  asHq,
  previewSettings,
}: {
  row: PartnerSkuPriceRow;
  isHq: boolean;
  draft: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  asHq?: boolean;
  previewSettings: PartnerPricingSettings;
}) {
  const { t } = useLanguage();
  const sellInUsd =
    row.sellInCasePriceUsd ??
    row.sellInCasePrice ??
    (row.sellInSource === "list_default" ? row.listSellInCasePrice : null);
  const listRef = formatMoney(row.listSellInCasePrice, "USD");
  const costLocal =
    purchaseCostLocal(sellInUsd, previewSettings) ??
    row.purchaseCostLocal ??
    null;
  const localCur = previewSettings.sellOutCurrency || row.currency || "CAD";
  const usingDefault = isHq
    ? row.sellInSource === "list_default" && !draft.trim()
    : row.sellOutSource === "catalog_suggestion" && !draft.trim();

  if (!isHq) {
    return (
      <tr>
        <td className="px-3 py-2">
          <div className="font-medium">{row.name || row.sku}</div>
          <div className="font-mono text-[11px] text-muted-foreground">{row.sku}</div>
        </td>
        <td className="px-3 py-2 font-mono text-muted-foreground">
          {formatMoney(sellInUsd, "USD")}
          {row.sellInSource === "list_default" ? (
            <div className="text-[10px] font-sans text-muted-foreground/80">{t("list default")}</div>
          ) : null}
        </td>
        <td className="px-3 py-2 font-mono">{formatMoney(costLocal, localCur)}</td>
        <td className="px-3 py-2">
          <Input
            type="number"
            min={0}
            step={0.01}
            inputMode="decimal"
            className="h-8 max-w-[140px] font-mono text-sm"
            value={draft}
            placeholder="0"
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
          />
        </td>
      </tr>
    );
  }

  const exportSku = catalogSkuToExportCode(row.sku, { name: row.name ?? undefined });
  const caseSize = Math.max(1, Number(row.caseSize) || 12);
  const listFobBottle = exportSku ? defaultUnitFob(exportSku) : null;
  const listFobCase = exportSku ? listFobCaseUsd(exportSku) : row.listSellInCasePrice;
  const listBottleLabel =
    listFobBottle != null && listFobBottle > 0 ? formatMoney(listFobBottle, "USD") : listRef;
  const draftBottle = draft.trim() === "" ? NaN : Number(draft.replace(/,/g, ""));
  const effectiveBottle =
    Number.isFinite(draftBottle) && draftBottle > 0
      ? draftBottle
      : listFobBottle != null && listFobBottle > 0
        ? listFobBottle
        : Number(row.listSellInCasePrice) > 0
          ? Number(row.listSellInCasePrice) / caseSize
          : null;
  const caseUsd =
    effectiveBottle != null && effectiveBottle > 0
      ? Math.round(effectiveBottle * caseSize * 100) / 100
      : listFobCase;
  const caseCostLocal = purchaseCostLocal(caseUsd, previewSettings) ?? costLocal;

  return (
    <tr>
      <td className={asHq ? undefined : "px-3 py-2"}>
        <div className="font-medium">{row.name || row.sku}</div>
        <div className="font-mono text-[11px] text-muted-foreground">{row.sku}</div>
      </td>
      <td className={cn("font-mono text-muted-foreground", !asHq && "px-3 py-2")}>
        {listBottleLabel}
        {listFobCase != null && Number(listFobCase) > 0 ? (
          <div className="text-[10px] font-sans text-muted-foreground/80">
            {formatMoney(listFobCase, "USD")} / {t("case")}
          </div>
        ) : null}
        {usingDefault ? (
          <div className="text-[10px] font-sans font-medium text-muted-foreground/80">
            {t("using list default")}
          </div>
        ) : null}
      </td>
      <td className={asHq ? undefined : "px-3 py-2"}>
        <Input
          type="number"
          min={0}
          step={0.01}
          inputMode="decimal"
          className="h-8 max-w-[140px] font-mono text-sm"
          value={draft}
          placeholder={listFobBottle != null ? String(listFobBottle) : "0"}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      </td>
      <td className="font-mono text-muted-foreground">
        {formatMoney(caseUsd, "USD")}
        <div className="text-[10px] font-sans text-muted-foreground/80">
          × {caseSize} {t("btls")}
        </div>
      </td>
      <td className="font-mono text-muted-foreground">{formatMoney(caseCostLocal, localCur)}</td>
      <td className="font-mono text-muted-foreground">
        {formatMoney(row.sellOutCasePrice, localCur)}
      </td>
    </tr>
  );
}
