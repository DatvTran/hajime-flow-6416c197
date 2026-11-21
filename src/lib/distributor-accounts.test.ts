import { describe, expect, it } from "vitest";
import type { Account } from "@/data/mockData";
import {
  distributorChromeOrgLabel,
  distributorPortalAccountLabel,
  findDistributorPortalAccount,
} from "@/lib/distributor-accounts";
import { EXPORT_SELLER } from "@/lib/export-commercial";

function dist(partial: Partial<Account> & Pick<Account, "id" | "tradingName">): Account {
  return {
    legalName: partial.legalName ?? partial.tradingName,
    country: "CA",
    city: "Toronto",
    type: "distributor",
    contactName: "Ops",
    contactRole: "Lead",
    phone: "",
    email: partial.email ?? "ops@example.com",
    salesOwner: "",
    paymentTerms: "Net 30",
    firstOrderDate: "",
    lastOrderDate: "",
    avgOrderSize: 0,
    status: "active",
    tags: [],
    ...partial,
  };
}

describe("distributor portal account crumbs", () => {
  const empire = dist({
    id: "acc-empire",
    tradingName: "Empire Wines & Spirits",
    managedByDistributorUserId: "u-1",
    email: "ops@empire.example",
  });

  it("resolves wholesaler by managedByDistributorUserId", () => {
    expect(findDistributorPortalAccount([empire], { id: "u-1" })?.id).toBe("acc-empire");
    expect(distributorPortalAccountLabel([empire], { id: "u-1" })).toBe("Empire Wines & Spirits");
  });

  it("resolves wholesaler by portal login email", () => {
    const row = dist({
      id: "acc-2",
      tradingName: "Pacific Beverage",
      portalLoginEmail: "dist@pacific.example",
    });
    expect(distributorPortalAccountLabel([row], { id: "x", email: "dist@pacific.example" })).toBe(
      "Pacific Beverage",
    );
  });

  it("uses Hajime Ltd. on international orders routes only", () => {
    const user = { id: "u-1" };
    expect(distributorChromeOrgLabel("/distributor/international-orders", [empire], user)).toBe(
      EXPORT_SELLER.legalName,
    );
    expect(
      distributorChromeOrgLabel("/distributor/international-orders/HX-1", [empire], user),
    ).toBe(EXPORT_SELLER.legalName);
    expect(distributorChromeOrgLabel("/distributor/inventory", [empire], user)).toBe(
      "Empire Wines & Spirits",
    );
    expect(distributorChromeOrgLabel("/distributor", [empire], user)).toBe("Empire Wines & Spirits");
  });

  it("prefers registry org name from the session", () => {
    expect(
      distributorPortalAccountLabel([empire], {
        id: "u-1",
        distributorOrgName: "Pacific Beverage Co.",
      }),
    ).toBe("Pacific Beverage Co.");
  });

  it("falls back without inventing Empire Wines", () => {
    expect(distributorPortalAccountLabel([], { id: "u-9", displayName: "Jordan Lee" })).toBe(
      "Jordan Lee",
    );
    expect(distributorPortalAccountLabel([], null)).toBe("Distributor");
  });
});
