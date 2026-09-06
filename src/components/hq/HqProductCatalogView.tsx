import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Plus } from "lucide-react";
import type { Product, PurchaseOrder } from "@/data/mockData";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHqDistilleryCatalogOptions } from "@/hooks/useHqDistilleryCatalogOptions";
import {
  catalogDisplayProducts,
  formatCatalogPrice,
  manufacturerPerBottle,
  marketsCount,
  msrpPerBottle,
  producerForSku,
  skuEditPath,
  statusMeta,
  typeLabelForProduct,
  wholesalePerBottle,
  distributorSellOutPerBottle,
  brokerPerBottle,
} from "@/lib/hq-product-catalog";
import {
  hajimeNetBreaksGuardrail,
  netAfterBroker,
  TRADE_STANDARD,
} from "@/lib/hajime-trade-pricing";
import {
  HqBtn,
  HqBtnLink,
  HqOperatorCard,
  HqOperatorDataTable,
  HqOperatorPage,
  HqOperatorPageHeader,
  HqOperatorPill,
} from "@/components/hq/HqOperatorUi";

type Props = {
  products: Product[];
  purchaseOrders: PurchaseOrder[];
  onDeleteSku?: (sku: string) => Promise<{ success: boolean }>;
};

function SkuThumb({ product }: { product: Product }) {
  if (product.imageUrl) {
    return (
      <img
        src={product.imageUrl}
        alt=""
        className="size-full object-contain"
      />
    );
  }
  return <Box className="size-3.5 text-muted-foreground/50" strokeWidth={1.5} />;
}

export function HqProductCatalogView({ products, purchaseOrders, onDeleteSku }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const distilleries = useHqDistilleryCatalogOptions();

  const handleDelete = async (sku: string, name: string) => {
    if (!onDeleteSku) return;
    if (!window.confirm(`Delete ${name} (${sku}) from the product catalog?`)) return;
    await onDeleteSku(sku);
  };

  const rows = useMemo(
    () =>
      catalogDisplayProducts(products).map((p) => {
        const sellIn = wholesalePerBottle(p);
        const broker = brokerPerBottle(p) || TRADE_STANDARD.brokerPerBottle;
        const net = sellIn != null ? netAfterBroker(sellIn, broker) : null;
        return {
        product: p,
        typeLabel: typeLabelForProduct(p),
        msrp: formatCatalogPrice(msrpPerBottle(p)),
        wholesale: formatCatalogPrice(sellIn),
        sellOut: formatCatalogPrice(distributorSellOutPerBottle(p)),
        manufacturer: formatCatalogPrice(manufacturerPerBottle(p)),
        net: net != null ? formatCatalogPrice(net) : "—",
        guardrailBreak: sellIn != null && hajimeNetBreaksGuardrail(sellIn, broker),
        producer: producerForSku(p, distilleries, purchaseOrders),
        markets: marketsCount(p),
        status: statusMeta(p),
      };
      }),
    [products, purchaseOrders, distilleries],
  );

  return (
    <HqOperatorPage className="space-y-6">
      <HqOperatorPageHeader
        title="Product catalog"
        description="Master SKU list · pricing, production source, and market availability · click any row to edit"
        actions={
          <>
            <HqBtnLink to="/brand-kit#trade-pricing" variant="outline" size="sm">
              {t("Trade pricing policy")}
            </HqBtnLink>
            <HqBtnLink to="/inventory/add" variant="accent" size="sm">
              <Plus className="size-3.5" strokeWidth={1.75} /> {t("Add SKU")}
            </HqBtnLink>
          </>
        }
      />

      <HqOperatorCard className="overflow-hidden p-0">
        <HqOperatorDataTable>
          <thead>
            <tr>
              <th className="w-10" />
              <th>{t("SKU")}</th>
              <th>{t("Product")}</th>
              <th>{t("Type")}</th>
              <th>{t("SRP")}</th>
              <th>{t("Sell-in")}</th>
              <th>{t("W → retail")}</th>
              <th>{t("Landed")}</th>
              <th>{t("Net after broker")}</th>
              <th>{t("Produced by")}</th>
              <th>{t("Markets")}</th>
              <th>{t("Status")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-10 text-center text-muted-foreground">
                  {t("No SKUs in catalog yet.")}
                </td>
              </tr>
            ) : (
              rows.map(({ product, typeLabel, msrp, wholesale, sellOut, manufacturer, net, guardrailBreak, producer, markets, status }) => (
                <tr
                  key={product.sku}
                  className="cursor-pointer transition-colors hover:bg-muted/30"
                  onClick={() => navigate(skuEditPath(product.sku))}
                >
                  <td>
                    <div className="flex h-[42px] w-[30px] items-center justify-center overflow-hidden rounded border border-border/50 bg-muted/50">
                      <SkuThumb product={product} />
                    </div>
                  </td>
                  <td className="font-mono text-[11px] text-muted-foreground">{product.sku}</td>
                  <td className="font-medium">{product.name}</td>
                  <td className="text-muted-foreground">{typeLabel}</td>
                  <td className="font-mono font-medium">{msrp}</td>
                  <td className="font-mono font-medium text-accent">{wholesale}</td>
                  <td className="font-mono">{sellOut}</td>
                  <td className="font-mono font-medium text-muted-foreground">{manufacturer}</td>
                  <td className={`font-mono ${guardrailBreak ? "font-semibold text-[hsl(0_68%_44%)]" : ""}`}>{net}</td>
                  <td className="text-xs">{producer}</td>
                  <td className="font-mono">{markets}</td>
                  <td>
                    <HqOperatorPill tone={status.tone}>{status.label}</HqOperatorPill>
                  </td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <HqBtnLink to={skuEditPath(product.sku)} variant="outline" size="sm">
                        {t("Edit")}
                      </HqBtnLink>
                      {onDeleteSku ? (
                        <HqBtn
                          variant="red"
                          size="sm"
                          aria-label={`Delete ${product.sku}`}
                          onClick={() => void handleDelete(product.sku, product.name)}
                        >
                          {t("Delete")}
                        </HqBtn>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </HqOperatorDataTable>
      </HqOperatorCard>
    </HqOperatorPage>
  );
}
