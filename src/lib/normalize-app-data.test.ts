import { describe, expect, it } from "vitest";
import { isSeedDemoAccount, isSeedDemoDistributorOrg, isSeedDemoPartnerName } from "@/lib/normalize-app-data";

describe("HQ demo distributor scrub", () => {
  it("hides Metro, Empire, Midwest, Kanto, and Cave Lumière", () => {
    expect(isSeedDemoAccount({ tradingName: "Metro Logistics" })).toBe(true);
    expect(isSeedDemoAccount({ tradingName: "Empire Wines & Spirits" })).toBe(true);
    expect(isSeedDemoAccount({ tradingName: "Midwest Spirits Co." })).toBe(true);
    expect(isSeedDemoAccount({ tradingName: "Kanto Beverage" })).toBe(true);
    expect(isSeedDemoAccount({ tradingName: "Cave Lumière" })).toBe(true);
    expect(isSeedDemoPartnerName("Metro Logistics")).toBe(true);
    expect(isSeedDemoPartnerName("Empire Wines & Spirits LLC")).toBe(true);
    expect(isSeedDemoDistributorOrg({ id: "empire-wines", name: "Empire Wines" })).toBe(true);
    expect(isSeedDemoDistributorOrg({ slug: "metro_logistics", name: "Metro Logistics" })).toBe(true);
    expect(
      isSeedDemoAccount({
        tradingName: "The Gage",
        distributorOrgId: "empire-wines",
        distributorOrgName: "Empire Wines & Spirits",
      }),
    ).toBe(true);
  });

  it("keeps real partners", () => {
    expect(isSeedDemoAccount({ tradingName: "Pacific Beverage Co.", email: "ops@pacific.example" })).toBe(
      false,
    );
  });
});
