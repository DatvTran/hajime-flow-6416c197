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
  orderBandForBottles,
  wholesalerMarginPct,
} from "@/lib/hajime-trade-pricing";

describe("hajime-trade-pricing", () => {
  it("nets $45.83 after $3 broker on $48.83 sell-in", () => {
    expect(netAfterBroker(TRADE_STANDARD.sellInPerBottle, TRADE_STANDARD.brokerPerBottle)).toBe(45.83);
  });

  it("warns below $45 but does not break at exactly $45", () => {
    expect(hajimeNetNeedsWarn(48.83, 3)).toBe(false);
    expect(hajimeNetBreaksGuardrail(48.83, 3)).toBe(false);
    expect(hajimeNetNeedsWarn(48, 3.5)).toBe(true);
    expect(hajimeNetBreaksGuardrail(47, 4)).toBe(true);
  });

  it("matches standard distributor 25% and retailer 30%", () => {
    expect(TRADE_STANDARD.sellInPerBottle - TRADE_STANDARD.landedPerBottle).toBeCloseTo(18.83);
    expect(wholesalerMarginPct(TRADE_STANDARD.wholesalerToRetailPerBottle, TRADE_STANDARD.sellInPerBottle)).toBe(25);
    expect(retailerMarginPct(TRADE_STANDARD.srpPerBottle, TRADE_STANDARD.wholesalerToRetailPerBottle)).toBe(30);
  });

  it("requires Hajime approval over $2 / bottle", () => {
    expect(discountNeedsHajimeApproval(2)).toBe(false);
    expect(discountNeedsHajimeApproval(2.01)).toBe(true);
  });

  it("maps trial and bulk bands by case pack", () => {
    expect(orderBandForBottles(119, 12)).toBe("below_trial");
    expect(orderBandForBottles(120, 12)).toBe("trial");
    expect(orderBandForBottles(599, 12)).toBe("trial");
    expect(orderBandForBottles(600, 12)).toBe("bulk");
    expect(orderBandForBottles(239, 24)).toBe("below_trial");
    expect(orderBandForBottles(240, 24)).toBe("trial");
    expect(orderBandForBottles(1200, 24)).toBe("bulk");
  });

  it("fills 12-pack case prices from the bottle ladder", () => {
    const filled = applyTradeStandardToProduct({ sku: "HJM-FP-750", name: "First Press", size: "750ml", caseSize: 12, status: "active" });
    expect(filled.manufacturerCasePrice).toBe(360);
    expect(filled.wholesaleCasePrice).toBe(586);
    expect(filled.distributorSellOutCasePrice).toBe(781);
    expect(filled.msrpCasePrice).toBe(1116);
    expect(filled.brokerCommissionPerBottle).toBe(3);
  });

  it("detects First Press SKUs", () => {
    expect(looksLikeFirstPressSku({ sku: "HJM-FP-750", name: "Hajime First Press Coffee Rhum Liqueur" })).toBe(true);
    expect(looksLikeFirstPressSku({ sku: "HJM-YZ-750", name: "Yuzu Mint" })).toBe(false);
  });
});
