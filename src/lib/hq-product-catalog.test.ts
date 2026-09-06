import { describe, expect, it } from "vitest";
import type { Product, PurchaseOrder } from "@/data/mockData";
import { producerForSku } from "@/lib/hq-product-catalog";

const kosapan = { id: "mfg-kosapan", name: "Kosapan Distillery" };
const distilleries = [kosapan, { id: "mfg-kirin", name: "Kirin Brewery Co." }];

const sku = (overrides: Partial<Product> = {}): Product => ({
  sku: "HJM-TEST-750",
  name: "Test SKU",
  size: "750ml",
  caseSize: 12,
  status: "active",
  ...overrides,
});

const po = (overrides: Partial<PurchaseOrder> = {}): PurchaseOrder => ({
  id: "PO-1",
  manufacturer: "Kosapan Distillery",
  issueDate: "2025-01-01",
  requiredDate: "2025-02-01",
  requestedShipDate: "2025-01-15",
  sku: "HJM-TEST-750",
  quantity: 12,
  packagingInstructions: "",
  labelVersion: "v1",
  marketDestination: "US",
  status: "approved",
  notes: "",
  manufacturerId: "mfg-kosapan",
  ...overrides,
});

describe("producerForSku", () => {
  it("uses saved Distilleries partner id", () => {
    expect(producerForSku(sku({ producerId: "mfg-kosapan" }), distilleries, [])).toBe(
      "Kosapan Distillery",
    );
  });

  it("uses saved name when it matches Distilleries", () => {
    expect(
      producerForSku(sku({ producerName: "Kirin Brewery Co." }), distilleries, []),
    ).toBe("Kirin Brewery Co.");
  });

  it("falls back to PO manufacturer when it is a Distilleries partner", () => {
    expect(producerForSku(sku(), distilleries, [po()])).toBe("Kosapan Distillery");
  });

  it("does not invent Kuramoto when nothing is linked", () => {
    expect(producerForSku(sku(), distilleries, [])).toBe("—");
    expect(producerForSku(sku(), distilleries, [po({ sku: "OTHER", manufacturer: "Kuramoto" })])).toBe(
      "—",
    );
  });
});
