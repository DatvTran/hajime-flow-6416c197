import { Navigate, useParams } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/contexts/AppDataContext";
import { HqSkuFormView } from "@/components/hq/HqSkuFormView";
import { catalogDisplayProducts, findCatalogProduct } from "@/lib/hq-product-catalog";

export default function HqEditSkuPage() {
  const { sku = "" } = useParams<{ sku: string }>();
  const { user } = useAuth();
  const { products, addProduct, patchProduct, removeProduct } = useProducts();

  const catalogProduct = useMemo(() => {
    const decoded = decodeURIComponent(sku);
    const fromDb = products.find((p) => p.sku === decoded);
    if (fromDb) return fromDb;
    return findCatalogProduct(sku, catalogDisplayProducts(products));
  }, [sku, products]);

  if (!user || (user.role !== "brand_operator" && user.role !== "founder_admin")) {
    return <Navigate to="/" replace />;
  }

  if (!catalogProduct) {
    return (
      <div className="p-6 text-[13px] text-muted-foreground">
        SKU not found. Return to the product catalog.
      </div>
    );
  }

  return (
    <HqSkuFormView
      mode="edit"
      product={catalogProduct}
      existingSkus={products.map((p) => p.sku)}
      onSave={async (p) => {
        const decoded = decodeURIComponent(sku);
        const inCatalog = products.some((x) => x.sku === decoded);
        if (inCatalog) {
          return patchProduct(decoded, p);
        }
        return addProduct(p);
      }}
      onDiscontinue={
        products.some((x) => x.sku === decodeURIComponent(sku)) ? removeProduct : undefined
      }
    />
  );
}
