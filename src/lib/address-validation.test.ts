import { describe, expect, it } from "vitest";
import { MAX_POSTAL_CODE_LENGTH, validateManufacturerAddress } from "./address-validation";

describe("validateManufacturerAddress (global)", () => {
  const base = {
    street: "Av. Paulista, 1000",
    city: "São Paulo",
    region: "SP",
    postalCode: "",
    country: "",
  };

  it("requires street, city, country", () => {
    expect(validateManufacturerAddress({ ...base, street: "" }).ok).toBe(false);
    expect(validateManufacturerAddress({ ...base, city: "" }).ok).toBe(false);
    expect(validateManufacturerAddress({ ...base, country: "" }).ok).toBe(false);
  });

  it("accepts varied international postals when present", () => {
    const samples = [
      { country: "Japan", postalCode: "100-0005" },
      { country: "Brazil", postalCode: "01310-100" },
      { country: "India", postalCode: "110001" },
      { country: "Germany", postalCode: "10115" },
      { country: "United Kingdom", postalCode: "SW1A 1AA" },
      { country: "Canada", postalCode: "M5H 2N2" },
      { country: "Australia", postalCode: "NSW 2000" },
    ];
    for (const row of samples) {
      expect(
        validateManufacturerAddress({
          ...base,
          country: row.country,
          postalCode: row.postalCode,
        }).ok,
      ).toBe(true);
    }
  });

  it("allows empty postal code", () => {
    expect(
      validateManufacturerAddress({
        ...base,
        country: "France",
        postalCode: "",
      }).ok,
    ).toBe(true);
  });

  it("rejects postal longer than max", () => {
    const long = "x".repeat(MAX_POSTAL_CODE_LENGTH + 1);
    const r = validateManufacturerAddress({ ...base, country: "France", postalCode: long });
    expect(r.ok).toBe(false);
    expect(r.errors.postalCode).toBeDefined();
  });

  it("rejects postal with only punctuation", () => {
    const r = validateManufacturerAddress({ ...base, country: "France", postalCode: "---" });
    expect(r.ok).toBe(false);
  });
});
