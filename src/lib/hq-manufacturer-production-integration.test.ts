import { describe, expect, it } from "vitest";
import type { PurchaseOrder } from "@/data/mockData";
import { buildPurchaseOrderFromForm, type NewPurchaseOrderFormState } from "@/lib/new-purchase-order-form";
import { scrubManufacturerPortalDemoData } from "@/lib/manufacturer-portal-demo-scrub";
import { poMatchesManufacturerIdentity } from "@/lib/po-manufacturer-scope";
import type { AppData } from "@/types/app-data";

const baseForm = (): NewPurchaseOrderFormState => ({
  poType: "production",
  manufacturerKey: "partner:kosapan",
  manufacturerDisplayLabel: "Kosapan Distillery",
  issueDate: "2026-07-29",
  requiredDate: "2026-08-15",
  requestedShipDate: "2026-08-10",
  sku: "HJM-OG-750",
  quantity: "1200",
  packagingInstructions: "Standard",
  labelVersion: "v1.0",
  marketDestination: "JP",
  status: "approved",
  notes: "",
  selectedDistributorId: "",
});

describe("HQ ↔ manufacturer production integration", () => {
  it("stores partner id as manufacturerId when HQ picks a partner:", () => {
    const po = buildPurchaseOrderFromForm(baseForm(), []);
    expect(po.manufacturerId).toBe("kosapan");
    expect(po.manufacturer).toBe("Kosapan Distillery");
    expect(po.poType).toBe("production");
  });

  it("does not scrub live Kosapan / Kuramoto POs as demo data", () => {
    const data = {
      purchaseOrders: [
        { id: "PO-2025-001", manufacturer: "Kirin Brewery Co.", sku: "x", quantity: 1 } as PurchaseOrder,
        { id: "PO-2026-001", manufacturer: "Kosapan Distillery", sku: "y", quantity: 12, manufacturerId: "kosapan" } as PurchaseOrder,
        { id: "PO-2026-002", manufacturer: "Kuramoto Brewing", sku: "z", quantity: 24, manufacturerId: "kuramoto" } as PurchaseOrder,
      ],
      shipments: [],
      productionStatuses: [],
      manufacturerFinishedGoods: [],
    } as unknown as AppData;

    const scrubbed = scrubManufacturerPortalDemoData(data);
    expect(scrubbed.purchaseOrders.map((p) => p.id)).toEqual(["PO-2026-001", "PO-2026-002"]);
  });

  it("matches manufacturer portal identity to HQ POs by partner id and fuzzy name", () => {
    const identity = {
      email: "lunnalin@kosapandistillery.com",
      emails: new Set(["lunnalin@kosapandistillery.com"]),
      labels: new Set(["Kosapan Distillery", "Kosapan Distillery Co., Ltd."]),
      crmMemberIds: new Set(["kosapan", "demo-kosapan"]),
    };

    expect(
      poMatchesManufacturerIdentity(
        { manufacturer: "Kosapan Distillery", manufacturerId: "kosapan", status: "approved" },
        identity,
      ),
    ).toBe(true);

    expect(
      poMatchesManufacturerIdentity(
        {
          manufacturer: "Kosapan Distillery Co., Ltd.",
          manufacturerId: undefined,
          status: "approved",
        },
        identity,
      ),
    ).toBe(true);

    expect(
      poMatchesManufacturerIdentity(
        { manufacturer: "Kirin Brewery Co.", manufacturerId: undefined, status: "approved" },
        identity,
      ),
    ).toBe(false);
  });
});
