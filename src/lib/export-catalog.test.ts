import { describe, expect, it } from "vitest";
import type { Product } from "@/data/mockData";
import {
  catalogSkuToExportCode,
  internationalOrderRowsFallback,
  internationalOrderRowsFromCatalog,
} from "./export-catalog";

describe("catalogSkuToExportCode", () => {
  it("maps First Press catalog SKUs; ignores Yuzu catalog; keeps legacy export codes", () => {
    expect(catalogSkuToExportCode("HJM-FCR-750")).toBe("first_press_750");
    expect(catalogSkuToExportCode("HJM-YZ-750")).toBe(null);
    expect(catalogSkuToExportCode("yuzu_mint_750")).toBe("yuzu_mint_750");
    expect(catalogSkuToExportCode("HJM-FP-200")).toBe("first_press_200");
  });

  it("maps by name + size when sku is unfamiliar", () => {
    expect(
      catalogSkuToExportCode("CUSTOM-1", {
        name: "Hajime First Press Coffee Rhum Liqueur",
        size: "750ml",
      }),
    ).toBe("first_press_750");
  });

  it("passes through export codes", () => {
    expect(catalogSkuToExportCode("first_press_750")).toBe("first_press_750");
  });
});

describe("internationalOrderRowsFromCatalog", () => {
  it("builds First Press rows only (Yuzu / Second Bloom excluded)", () => {
    const products: Product[] = [
      {
        sku: "HJM-FCR-750",
        name: "Hajime First Press Coffee Rhum Liqueur",
        size: "750ml",
        caseSize: 12,
        status: "active",
        wholesaleCasePrice: 409.2,
      },
      {
        sku: "HJM-YZ-750",
        name: "Hajime Yuzu Mint Rhum Liqueur",
        size: "750ml",
        caseSize: 12,
        status: "active",
      },
      {
        sku: "HJM-NG-720",
        name: "Nigori",
        size: "720ml",
        caseSize: 12,
        status: "active",
      },
    ];
    const rows = internationalOrderRowsFromCatalog(products);
    expect(rows.map((r) => r.exportSku)).toEqual(["first_press_750"]);
    expect(rows[0]?.catalogSku).toBe("HJM-FCR-750");
    // Without negotiated sheet → list FOB (34.1 × 12), not catalog wholesale.
    expect(rows[0]?.caseListUsd).toBe(409.2);
    expect(rows[0]?.negotiated).toBe(false);
  });

  it("uses negotiated sell-in case USD when provided", () => {
    const products: Product[] = [
      {
        sku: "HJM-FCR-750",
        name: "Hajime First Press Coffee Rhum Liqueur",
        size: "750ml",
        caseSize: 12,
        status: "active",
      },
    ];
    // Negotiated field is FOB / bottle → case = 45 × 12
    const rows = internationalOrderRowsFromCatalog(products, { "HJM-FCR-750": 45 });
    expect(rows[0]?.caseListUsd).toBe(540);
    expect(rows[0]?.fobPerBottle).toBe(45);
    expect(rows[0]?.negotiated).toBe(true);
  });

  it("fallback returns First Press 750 and 200 only", () => {
    expect(internationalOrderRowsFallback().map((r) => r.exportSku)).toEqual([
      "first_press_750",
      "first_press_200",
    ]);
  });
});
