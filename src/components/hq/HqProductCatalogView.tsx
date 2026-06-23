import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Plus } from "lucide-react";
import type { Product, PurchaseOrder } from "@/data/mockData";
import { useLanguage } from "@/contexts/LanguageContext";
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
} from "@/lib/hq-product-catalog";
import {
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

export function HqProductCatalogView({ products, purchaseOrders }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const rows = useMemo(
    () =>
      catalogDisplayProducts(products).map((p) => ({
        product: p,
        typeLabel: typeLabelForProduct(p),
        msrp: formatCatalogPrice(msrpPerBottle(p)),
        wholesale: formatCatalogPrice(wholesalePerBottle(p)),
        manufacturer: formatCatalogPrice(manufacturerPerBottle(p)),
        producer: producerForSku(p.sku, purchaseOrders),
        markets: marketsCount(p),
        status: statusMeta(p),
      })),
    [products, purchaseOrders],
  );

  return (
    <HqOperatorPage className="space-y-6">
      <HqOperatorPageHeader
        title="Product catalog"
        description="Master SKU list · pricing, production source, and market availability · click any row to edit"
        actions={
          <HqBtnLink to="/inventory/add" variant="accent" size="sm">
            <Plus className="size-3.5" strokeWidth={1.75} /> {t("Add SKU")}
          </HqBtnLink>
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
              <th>{t("MSRP")}</th>
              <th>{t("Wholesaler")}</th>
              <th>{t("Manufacture")}</th>
              <th>{t("Produced by")}</th>
              <th>{t("Markets")}</th>
              <th>{t("Status")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-10 text-center text-muted-foreground">
                  {t("No SKUs in catalog yet.")}
                </td>
              </tr>
            ) : (
              rows.map(({ product, typeLabel, msrp, wholesale, manufacturer, producer, markets, status }) => (
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
                  <td className="font-mono font-medium text-muted-foreground">{manufacturer}</td>
                  <td className="text-xs">{producer}</td>
                  <td className="font-mono">{markets}</td>
                  <td>
                    <HqOperatorPill tone={status.tone}>{status.label}</HqOperatorPill>
                  </td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <HqBtnLink to={skuEditPath(product.sku)} variant="outline" size="sm">
                      {t("Edit")}
                    </HqBtnLink>
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
