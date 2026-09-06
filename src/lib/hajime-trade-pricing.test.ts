import { describe, expect, it } from "vitest";
import {
  TRADE_STANDARD,
  applyTradeStandardToProduct,
  discountNeedsHajimeApproval,
  hajimeNetBreaksGuardrail,
  hajimeNetNeedsWarn,
  looksLikeFirstPressSku,
  netAfterBroker,
  retailerMarginPct,
  volumeTierForBottles,
  wholesalerMarginPct,
} from "@/lib/hajime-trade-pricing";

describe("hajime-trade-pricing", () => {
  it("nets $45 after $3 broker on $48 sell-in", () => {
    expect(netAfterBroker(TRADE_STANDARD.sellInPerBottle, TRADE_STANDARD.brokerPerBottle)).toBe(45);
  });

  it("warns below $45 but does not break at exactly $45", () => {
    expect(hajimeNetNeedsWarn(48, 3)).toBe(false);
    expect(hajimeNetBreaksGuardrail(48, 3)).toBe(false);
    expect(hajimeNetNeedsWarn(48, 3.5)).toBe(true);
    expect(hajimeNetBreaksGuardrail(47, 4)).toBe(true);
  });

  it("matches standard wholesaler 20% and retailer ~35.5%", () => {
    expect(wholesalerMarginPct(60, 48)).toBe(20);
    expect(retailerMarginPct(93, 60)).toBe(35.5);
  });

  it("requires Hajime approval over $2 / bottle", () => {
    expect(discountNeedsHajimeApproval(2)).toBe(false);
    expect(discountNeedsHajimeApproval(2.01)).toBe(true);
  });

  it("maps volume tiers", () => {
    expect(volumeTierForBottles(1).id).toBe("none");
    expect(volumeTierForBottles(499).id).toBe("none");
    expect(volumeTierForBottles(500).id).toBe("up_to_1");
    expect(volumeTierForBottles(1000).id).toBe("up_to_2");
    expect(volumeTierForBottles(2000).id).toBe("custom");
  });

  it("fills 12-pack case prices from the bottle ladder", () => {
    const filled = applyTradeStandardToProduct({ sku: "HJM-FP-750", name: "First Press", size: "750ml", caseSize: 12, status: "active" });
    expect(filled.manufacturerCasePrice).toBe(360);
    expect(filled.wholesaleCasePrice).toBe(576);
    expect(filled.distributorSellOutCasePrice).toBe(720);
    expect(filled.msrpCasePrice).toBe(1116);
    expect(filled.brokerCommissionPerBottle).toBe(3);
  });

  it("detects First Press SKUs", () => {
    expect(looksLikeFirstPressSku({ sku: "HJM-FP-750", name: "Hajime First Press Coffee Rhum Liqueur" })).toBe(true);
    expect(looksLikeFirstPressSku({ sku: "HJM-YZ-750", name: "Yuzu Mint" })).toBe(false);
  });
});
