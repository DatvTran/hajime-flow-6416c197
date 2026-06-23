import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { PurchaseOrder } from "@/data/mockData";
import type { ManufacturerProfile } from "@/types/app-data";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  isHqManufacturerPartnerId,
  loadHqManufacturerPartner,
  manufacturerPartnerEditPath,
} from "@/lib/hq-manufacturer-partners";
import { buildManufacturerPartnerDetail } from "@/lib/hq-manufacturer-detail";
import { manufacturerInitials } from "@/lib/hq-manufacturers-metrics";
import {
  HqBtnLink,
  HqOperatorCard,
  HqOperatorCardHead,
  HqOperatorDataTable,
  HqOperatorPage,
  HqOperatorPill,
  HqOperatorTwoCol,
} from "@/components/hq/HqOperatorUi";
import { cn } from "@/lib/utils";

type Props = {
  manufacturerId: string;
  purchaseOrders: PurchaseOrder[];
  profile?: ManufacturerProfile | null;
  orgName?: string;
};

export function HqManufacturerPartnerManageView({ manufacturerId, purchaseOrders, profile, orgName }: Props) {
  const { t } = useLanguage();

  const detail = useMemo(
    () => {
      const d = buildManufacturerPartnerDetail(manufacturerId, purchaseOrders, profile ?? null);
      if (orgName && d.name === "Manufacturer") return { ...d, name: orgName };
      return d;
    },
    [manufacturerId, purchaseOrders, profile, orgName],
  );

  return (
    <HqOperatorPage className="space-y-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <Link
          to="/manufacturer/profiles"
          className="hq-btn hq-btn-outline hq-btn-sm inline-flex items-center gap-1.5 no-underline"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          {t("Manufacturers")}
        </Link>
        <span className="text-xs text-muted-foreground">/ {detail.name}</span>
      </div>

      <HqOperatorCard className="overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-[18px] sm:p-6">
          <div className="flex size-[60px] shrink-0 items-center justify-center rounded-[14px] bg-[hsl(280_40%_50%/0.1)] font-display text-[22px] font-semibold text-[hsl(280_40%_48%)]">
            {manufacturerInitials(detail.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl font-semibold tracking-[-0.02em]">{detail.name}</h1>
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                  detail.tierIsPreferred
                    ? "border-[hsl(40_88%_42%/0.25)] bg-[hsl(40_88%_42%/0.1)] text-[hsl(40_88%_34%)]"
                    : "border-border bg-muted text-muted-foreground",
                )}
              >
                {detail.tier}
              </span>
              <HqOperatorPill tone={detail.statusTone}>{detail.statusLabel}</HqOperatorPill>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {detail.sub} · {detail.locationLine}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {detail.contactLine} · {detail.email} · {detail.phone}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {isHqManufacturerPartnerId(manufacturerId) ? (
              <HqBtnLink to={manufacturerPartnerEditPath(manufacturerId)} variant="outline" size="sm">
                {t("Edit account")}
              </HqBtnLink>
            ) : null}
            <HqBtnLink to="/purchase-orders" variant="outline" size="sm">
              {t("Production requests")}
            </HqBtnLink>
            <HqBtnLink to="/purchase-orders/new" variant="accent" size="sm">
              + {t("New request")}
            </HqBtnLink>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-border/50 sm:grid-cols-3 lg:grid-cols-6">
          {[
            [t("Quality"), detail.quality],
            [t("On-time"), detail.onTime],
            [t("Capacity"), detail.capacity],
            [t("Active batches"), String(detail.activeBatches)],
            [t("Partner since"), detail.partnerSince],
            [t("Premium"), detail.premium],
          ].map(([label, value], i, arr) => (
            <div
              key={String(label)}
              className={cn(
                "px-[18px] py-3.5",
                i < arr.length - 1 && "border-b border-border/40 sm:border-b-0 sm:border-r",
              )}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {label}
              </div>
              <div className="mt-0.5 font-display text-base font-semibold">{value}</div>
            </div>
          ))}
        </div>
      </HqOperatorCard>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {t("Produces")}:
        </span>
        {detail.skus.map((sku) => (
          <span
            key={sku}
            className="rounded-full border border-border/60 bg-muted px-2.5 py-1 text-xs"
          >
            {sku}
          </span>
        ))}
        {detail.rice !== "—" ? (
          <span className="rounded-full border border-border/60 bg-muted px-2.5 py-1 text-xs">
            {t("Rice")}: {detail.rice}
          </span>
        ) : null}
      </div>

      <HqOperatorTwoCol className="mb-0">
        <HqOperatorCard>
          <HqOperatorCardHead
            title="Active batches"
            subtitle={`${detail.batches.length} on the brew floor`}
          />
          {detail.batches.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              {t("No active batches for this kura.")}
            </div>
          ) : (
            <HqOperatorDataTable>
              <thead>
                <tr>
                  <th>{t("Batch")}</th>
                  <th>{t("SKU")}</th>
                  <th>{t("Stage")}</th>
                  <th>{t("Est. complete")}</th>
                  <th>{t("Status")}</th>
                </tr>
              </thead>
              <tbody>
                {detail.batches.map((b) => (
                  <tr key={b.id}>
                    <td className="font-mono text-xs font-medium">{b.id}</td>
                    <td className="font-medium">{b.sku}</td>
                    <td className="text-xs text-muted-foreground">{b.stage}</td>
                    <td className="font-mono text-xs">{b.eta}</td>
                    <td>
                      <HqOperatorPill tone={b.statusTone}>{b.statusLabel}</HqOperatorPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </HqOperatorDataTable>
          )}
        </HqOperatorCard>

        <HqOperatorCard className="flex flex-col">
          <HqOperatorCardHead title="Production requests" subtitle="Batch orders HQ has sent" />
          {detail.requests.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              {t("No production requests yet.")}
            </div>
          ) : (
            <HqOperatorDataTable>
              <thead>
                <tr>
                  <th>{t("Request")}</th>
                  <th>{t("Items")}</th>
                  <th>{t("Status")}</th>
                </tr>
              </thead>
              <tbody>
                {detail.requests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="font-mono text-xs font-medium">{r.id}</div>
                      <div className="text-[11px] text-muted-foreground">{r.date}</div>
                    </td>
                    <td className="text-xs text-muted-foreground">{r.items}</td>
                    <td>
                      <HqOperatorPill tone={r.statusTone}>{r.statusLabel}</HqOperatorPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </HqOperatorDataTable>
          )}
          <div className="mt-auto border-t border-border/50 px-5 py-3.5">
            <HqBtnLink to="/purchase-orders" variant="outline" size="sm" className="w-full justify-center">
              {t("View all production requests")}
            </HqBtnLink>
          </div>
        </HqOperatorCard>
      </HqOperatorTwoCol>
    </HqOperatorPage>
  );
}
