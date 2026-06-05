import type { InventoryItem, NewProductRequest, Product } from "@/data/mockData";

/** Map `/api/v1/products` row → client `Product`. */
export function mapApiRowToProduct(row: Record<string, unknown>): Product {
  const meta =
    typeof row.metadata === "string"
      ? (() => {
          try {
            return JSON.parse(row.metadata) as Record<string, unknown>;
          } catch {
            return {};
          }
        })()
      : ((row.metadata as Record<string, unknown> | undefined) ?? {});

  return {
    id: row.id != null ? String(row.id) : undefined,
    sku: String(row.sku ?? ""),
    name: String(row.name ?? ""),
    shortDescription: row.description != null ? String(row.description) : undefined,
    category: row.category != null ? String(row.category) : undefined,
    size: String(row.unit_size ?? meta.size ?? "750ml"),
    caseSize: Number(meta.caseSize ?? 12),
    bottleSizeMl: Number(meta.bottleSizeMl ?? 750),
    abv: Number(meta.abv ?? 25),
    wholesaleCasePrice: Number(meta.wholesaleCasePrice ?? meta.wholesalePriceCase ?? 0),
    retailPriceCase: Number(meta.retailPriceCase ?? 0),
    launchDate: meta.launchDate != null ? String(meta.launchDate) : undefined,
    status: (meta.status as Product["status"]) || "active",
    imageUrl:
      meta.imageUrl != null
        ? String(meta.imageUrl)
        : meta.image != null
          ? String(meta.image)
          : undefined,
    minOrderCases: Number(meta.minOrderCases ?? 1),
  };
}

/** Align inventory display names with the Brand Operator catalog (same tenant). */
export function enrichInventoryWithCatalog(
  inventory: InventoryItem[] | undefined,
  products: Product[] | undefined,
): InventoryItem[] {
  const items = inventory ?? [];
  const catalog = products ?? [];
  if (!catalog.length) return items;
  const bySku = new Map(catalog.map((p) => [p.sku, p]));
  return items.map((item) => {
    const match = bySku.get(item.sku);
    if (!match) return item;
    return {
      ...item,
      productName: match.name,
    };
  });
}

export function applyCatalogToAppData<T extends { products?: Product[]; inventory?: InventoryItem[] }>(
  data: T,
): T {
  return {
    ...data,
    products: data.products ?? [],
    inventory: enrichInventoryWithCatalog(data.inventory, data.products),
  };
}
