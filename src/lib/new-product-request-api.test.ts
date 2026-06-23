import { describe, expect, it } from "vitest";
import { mapNewProductRequestCreateToApi } from "@/lib/new-product-request-api";
import type { NewProductRequest } from "@/data/mockData";

describe("mapNewProductRequestCreateToApi", () => {
  it("builds a valid create payload with request_id and submitted_at", () => {
    const npr: Omit<NewProductRequest, "id"> = {
      title: "Test SKU",
      requestedBy: "brand_operator",
      requestedAt: "2026-06-18T00:00:00.000Z",
      specs: {
        baseSpirit: "rhum",
        targetAbv: 25,
        flavorProfile: ["vanilla"],
        targetPricePoint: "premium",
        packaging: { bottleSize: "750ml", labelStyle: "", caseConfiguration: 12 },
        minimumOrderQuantity: 1200,
        targetLaunchDate: "2026-09-01",
        regulatoryMarkets: ["US"],
      },
      attachments: [],
      notes: "notes",
      status: "submitted",
      assignedManufacturer: "Kuramoto Brewing",
      submittedAt: "2026-06-18T12:00:00.000Z",
    };

    const payload = mapNewProductRequestCreateToApi(npr);
    expect(payload.title).toBe("Test SKU");
    expect(String(payload.request_id)).toMatch(/^NPR-\d{4}-\d{4}$/);
    expect(payload.specs).toEqual(npr.specs);
    expect(payload.assigned_manufacturer).toBe("Kuramoto Brewing");
    expect(payload.status).toBe("submitted");
    expect(payload.submitted_at).toBe("2026-06-18T12:00:00.000Z");
  });
});
