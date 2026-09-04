import { describe, expect, it } from "vitest";
import {
  assertAdvanceStage,
  canAuthorizeProduction,
  canReleaseShipment,
  defaultUnitFob,
  distributorCanViewStage,
  isBuyerExportDoc,
  priceLines,
  requiredChecklistReady,
  EXPORT_SELLER,
} from "@/lib/export-commercial";

describe("export commercial gates", () => {
  it("blocks production until deposit is cleared or excepted", () => {
    expect(canAuthorizeProduction("pending")).toBe(false);
    expect(canAuthorizeProduction("short")).toBe(false);
    expect(canAuthorizeProduction("cleared")).toBe(true);
    expect(canAuthorizeProduction("exception")).toBe(true);
    const blocked = assertAdvanceStage({
      from: "06_deposit",
      to: "07_production_auth",
      depositStatus: "pending",
      balanceStatus: "pending",
      checklistCleared: false,
    });
    expect(blocked.ok).toBe(false);
  });

  it("blocks shipment release without money, checklist, and named FOB point", () => {
    expect(
      canReleaseShipment({
        balanceStatus: "cleared",
        checklistCleared: true,
        fobNamedPoint: "",
      }),
    ).toBe(false);
    expect(
      canReleaseShipment({
        balanceStatus: "cleared",
        checklistCleared: true,
        fobNamedPoint: "Laem Chabang",
      }),
    ).toBe(true);
  });

  it("prices 50/50 and applies 750 ml volume tiers without exposing floor to math of deposit", () => {
    const q = priceLines([
      { sku: "first_press_750", cases: 100 },
      { sku: "yuzu_mint_750", cases: 50 },
    ]);
    expect(q.tier.id).toBe("standard");
    expect(q.lines[0].unitFobUsd).toBe(31);
    expect(q.depositDueUsd).toBe(q.balanceDueUsd);
    expect(q.depositDueUsd * 2).toBe(q.subtotalUsd);
    expect(q.lines.some((l) => l.belowFloor)).toBe(false);
  });

  it("flags unit FOB below internal floor", () => {
    const q = priceLines([{ sku: "first_press_750", cases: 25, unitFobUsd: 27 }]);
    expect(q.lines[0].belowFloor).toBe(true);
    expect(defaultUnitFob("first_press_200", 25)).toBe(18);
  });

  it("allows buyer docs and hides lead-stage files from distributors", () => {
    expect(isBuyerExportDoc("quotation")).toBe(true);
    expect(isBuyerExportDoc("proforma")).toBe(true);
    expect(isBuyerExportDoc("production_auth")).toBe(false);
    expect(isBuyerExportDoc("export_checklist")).toBe(false);
    expect(distributorCanViewStage("01_lead")).toBe(false);
    expect(distributorCanViewStage("02_quotation")).toBe(true);
    expect(distributorCanViewStage("12_shipment_release")).toBe(true);
  });

  it("requires issued, complete, or N/A on every checklist row before clear", () => {
    expect(requiredChecklistReady({})).toBe(false);
  });

  it("publishes Hajime Limited DBS Hong Kong receiving details", () => {
    expect(EXPORT_SELLER.bank.accountName).toBe("Hajime Limited");
    expect(EXPORT_SELLER.bank.accountNumber).toBe("7949937138");
    expect(EXPORT_SELLER.bank.swift).toBe("DHBKHKHH");
    expect(EXPORT_SELLER.bank.bankCode).toBe("016");
    expect(EXPORT_SELLER.bank.branchCode).toBe("478");
  });
});
