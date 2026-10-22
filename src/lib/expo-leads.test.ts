import { describe, expect, it } from "vitest";
import { formatExpoLeadHeadline } from "@/lib/expo-leads";
import { expoConnectFormUrl } from "@/lib/expo-connect-url";
import { internationalPhone } from "@/lib/connect-enquiry";

describe("formatExpoLeadHeadline", () => {
  it("matches the Singapore distributor example", () => {
    expect(
      formatExpoLeadHeadline({
        score: "A",
        countryMarket: "Singapore",
        businessType: "importer_distributor",
        expression: "both",
        volume: "100_249",
      }),
    ).toBe("A PRIORITY — Singapore — Distributor — Both SKUs — 100–249 cases — Follow up within 24 hours");
  });

  it("skips market and volume for mobile enquiries that never ask them", () => {
    expect(
      formatExpoLeadHeadline({
        score: null,
        countryMarket: null,
        businessType: "restaurant",
        expression: "yuzu_mint",
        volume: null,
      }),
    ).toBe("UNSCORED — Restaurant — Second Bloom — Score after the conversation");
  });
});

describe("internationalPhone", () => {
  it("joins the picked dial code unless a full number was pasted", () => {
    expect(internationalPhone("+852", "9123 4567")).toBe("+85291234567");
    expect(internationalPhone("+44", "07700 900123")).toBe("+447700900123");
    expect(internationalPhone("+852", "+1 (415) 555-0100")).toBe("+14155550100");
    expect(internationalPhone("+852", "0081 3 1234 5678")).toBe("+81312345678");
  });
});

describe("expoConnectFormUrl", () => {
  it("points at the public supply form", () => {
    expect(expoConnectFormUrl("HK26")).toBe("https://supply.drinkhajime.jp/connect?event=HK26");
  });
});
