import { describe, expect, it } from "vitest";
import {
  formatDistributorShippingAddress,
  regionLabelForCountry,
  resolvedDistributorCountry,
  subdivisionsForCountry,
} from "@/lib/distributor-onboard-address";

describe("distributor-onboard-address", () => {
  it("formats Canada DC lines", () => {
    expect(
      formatDistributorShippingAddress({
        street: "2200 Meadowpine Blvd",
        city: "Mississauga",
        region: "Ontario",
        postal: "L5N 0A4",
        country: "Canada",
      }),
    ).toBe("2200 Meadowpine Blvd, Mississauga, Ontario, L5N 0A4, Canada");
  });

  it("exposes provinces for Canada and none for Other", () => {
    expect(subdivisionsForCountry("Canada").includes("Ontario")).toBe(true);
    expect(subdivisionsForCountry("Other")).toEqual([]);
    expect(regionLabelForCountry("Japan")).toBe("Prefecture");
  });

  it("resolves Other to typed country", () => {
    expect(resolvedDistributorCountry("Canada", "Brazil")).toBe("Canada");
    expect(resolvedDistributorCountry("Other", "  Brazil ")).toBe("Brazil");
  });
});
