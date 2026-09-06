import { describe, expect, it } from "vitest";
import { formatExpoLeadHeadline } from "@/lib/expo-leads";
import { expoConnectFormUrl } from "@/lib/expo-connect-url";

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
});

describe("expoConnectFormUrl", () => {
  it("points at the public supply form", () => {
    expect(expoConnectFormUrl("HK26")).toBe("https://supply.drinkhajime.jp/connect?event=HK26");
  });
});
