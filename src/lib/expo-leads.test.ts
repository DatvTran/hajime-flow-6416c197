import { describe, expect, it } from "vitest";
import { leadStarterLines } from "./expo-leads";
import { leadStarterLines as serverStarterLines } from "../../server/lib/export-orders.mjs";

describe("leadStarterLines", () => {
  it("matches the server for every bottle format", () => {
    for (const format of ["750ml", "200ml", "both", null, ""]) {
      expect(leadStarterLines(format)).toEqual(serverStarterLines({ bottle_format: format }));
    }
  });

  it("splits one 40-case trial order", () => {
    expect(leadStarterLines("both")).toEqual([
      { sku: "first_press_750", cases: 20 },
      { sku: "first_press_200", cases: 20 },
    ]);
    expect(leadStarterLines(null)).toEqual([{ sku: "first_press_750", cases: 40 }]);
  });
});
