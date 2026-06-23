import type { Product, PurchaseOrder } from "@/data/mockData";

export const HQ_CATALOG_DEMO: Product[] = [
  {
    sku: "HJM-FP-750",
    name: "Florin Peaks",
    size: "750ml",
    caseSize: 12,
    status: "active",
    shortDescription: "Junmai Daiginjo · 750ml",
    abv: "16%",
    msrpCasePrice: 576,
    wholesaleCasePrice: 456,
    manufacturerCasePrice: 336,
    minOrderCases: 5,
  },
  {
    sku: "HJM-JN-720",
    name: "Junmai Shiro",
    size: "720ml",
    caseSize: 12,
    status: "active",
    shortDescription: "Junmai · 720ml",
    msrpCasePrice: 384,
    wholesaleCasePrice: 312,
    manufacturerCasePrice: 216,
    minOrderCases: 5,
  },
  {
    sku: "HJM-RY-500",
    name: "Ryusui Reserve",
    size: "500ml",
    caseSize: 12,
    status: "active",
    shortDescription: "Genshu · 500ml · limited",
    msrpCasePrice: 984,
    wholesaleCasePrice: 780,
    manufacturerCasePrice: 540,
    minOrderCases: 4,
  },
  {
    sku: "EU-FP-750",
    name: "First Press",
    size: "750ml",
    caseSize: 12,
    status: "active",
    shortDescription: "Coffee Rice · 750ml",
    msrpCasePrice: 624,
    wholesaleCasePrice: 504,
    manufacturerCasePrice: 360,
    minOrderCases: 3,
  },
  {
    sku: "HJM-NG-720",
    name: "Shirogane Nigori",
    size: "720ml",
    caseSize: 12,
    status: "development",
    shortDescription: "Nigori · 720ml · seasonal",
    msrpCasePrice: 336,
    wholesaleCasePrice: 264,
    manufacturerCasePrice: 192,
    minOrderCases: 2,
  },
  {
    sku: "HJM-HJ-500",
    name: "Hana Junmai",
    size: "500ml",
    caseSize: 12,
    status: "development",
    shortDescription: "Junmai · 500ml · limited",
    msrpCasePrice: 456,
    wholesaleCasePrice: 360,
    manufacturerCasePrice: 264,
    minOrderCases: 2,
  },
];

export function skuEditPath(sku: string): string {
  return `/inventory/sku/${encodeURIComponent(sku)}/edit`;
}

export function catalogDisplayProducts(products: Product[]): Product[] {
  if (products.length >= 4) return products;
  const seen = new Set(products.map((p) => p.sku));
  const extras = HQ_CATALOG_DEMO.filter((p) => !seen.has(p.sku));
  return [...products, ...extras];
}

export function findCatalogProduct(sku: string, products: Product[]): Product | undefined {
  const decoded = decodeURIComponent(sku);
  return (
    products.find((p) => p.sku === decoded) ??
    HQ_CATALOG_DEMO.find((p) => p.sku === decoded)
  );
}

export function typeLabelForProduct(product: Product): string {
  if (product.shortDescription?.trim()) return product.shortDescription.trim();
  return [product.size, product.abv].filter(Boolean).join(" · ") || product.size;
}

function perBottleFromCase(casePrice: number | undefined, caseSize: number): number | null {
  if (!casePrice || !caseSize) return null;
  return casePrice / caseSize;
}

export function msrpPerBottle(product: Product): number | null {
  const fromMsrp = perBottleFromCase(product.msrpCasePrice, product.caseSize);
  if (fromMsrp != null) return fromMsrp;
  const w = wholesalePerBottle(product);
  return w != null ? w * 1.25 : null;
}

export function wholesalePerBottle(product: Product): number | null {
  return perBottleFromCase(product.wholesaleCasePrice, product.caseSize);
}

export function manufacturerPerBottle(product: Product): number | null {
  return perBottleFromCase(product.manufacturerCasePrice, product.caseSize);
}

/** @deprecated Use msrpPerBottle */
export function retailPerBottle(product: Product): number | null {
  return msrpPerBottle(product);
}

export function bottlePriceToCase(bottle: number | null, caseSize: number): number | undefined {
  if (bottle == null) return undefined;
  return Math.round(bottle * Math.max(1, caseSize));
}

export function formatCatalogPrice(amount: number | null): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return `$${Math.round(amount)}`;
}

export function producerForSku(sku: string, pos: PurchaseOrder[]): string {
  const po = pos.find((p) => p.sku === sku);
  if (!po) {
    if (sku.startsWith("EU-")) return "Echigo Kura";
    return "Kuramoto";
  }
  const first = po.manufacturer.split(" ")[0];
  return first || po.manufacturer;
}

export function marketsCount(product: Product): number {
  return Math.min(5, Math.max(1, product.minOrderCases ?? 2));
}

export function statusMeta(product: Product): {
  tone: "green" | "amber" | "red" | "neutral";
  label: string;
} {
  const desc = (product.shortDescription || "").toLowerCase();
  if (product.status === "development") {
    if (desc.includes("seasonal")) return { tone: "amber", label: "seasonal" };
    if (desc.includes("limited")) return { tone: "amber", label: "limited" };
    return { tone: "amber", label: "development" };
  }
  return { tone: "green", label: "active" };
}

export function availabilityFromProduct(product: Product): "active" | "seasonal" | "limited" | "development" {
  const desc = (product.shortDescription || "").toLowerCase();
  if (desc.includes("seasonal")) return "seasonal";
  if (desc.includes("limited")) return "limited";
  if (product.status === "development") return "development";
  return "active";
}

export function productFromAvailability(
  availability: string,
  shortDescription: string,
): Pick<Product, "status" | "shortDescription"> {
  let status: Product["status"] = "active";
  let desc = shortDescription.trim();
  if (availability === "seasonal" || availability === "limited" || availability === "development") {
    status = "development";
    if (availability === "seasonal" && !desc.toLowerCase().includes("seasonal")) {
      desc = desc ? `${desc} · seasonal` : "seasonal";
    }
    if (availability === "limited" && !desc.toLowerCase().includes("limited")) {
      desc = desc ? `${desc} · limited` : "limited";
    }
  }
  return { status, shortDescription: desc };
}

export function parsePriceInput(value: string): number | null {
  const n = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}
