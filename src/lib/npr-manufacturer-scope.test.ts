import { describe, expect, it } from "vitest";
import type { Account } from "@/data/mockData";
import type { NewProductRequest } from "@/data/mockData";
import { TEAM_ROSTER } from "@/data/team-roster";
import {
  filterNprsForManufacturerUser,
  nprMatchesManufacturerIdentity,
  resolveManufacturerAssignmentIdentity,
} from "@/lib/npr-manufacturer-scope";

const kirinAccount = {
  id: "ACC-MFG-KIRIN",
  legalName: "Kirin Brewery Co., Ltd.",
  tradingName: "Kirin Brewery Co.",
  country: "Japan",
  city: "Yokohama",
  type: "manufacturer",
  contactName: "Export Liaison",
  contactRole: "Production",
  phone: "",
  email: "export@kirin.example",
  salesOwner: "",
  paymentTerms: "Net 45",
  firstOrderDate: "2024-01-01",
  lastOrderDate: "2025-01-01",
  avgOrderSize: 0,
  status: "active",
} satisfies Account;

const sampleNpr = (overrides: Partial<NewProductRequest> = {}): NewProductRequest =>
  ({
    id: "NPR-2025-0001",
    title: "Test",
    requestedBy: "brand_operator",
    requestedAt: "2025-04-01T10:00:00Z",
    specs: {
      baseSpirit: "rhum",
      targetAbv: 25,
      flavorProfile: [],
      targetPricePoint: "premium",
      packaging: { bottleSize: "750ml", labelStyle: "", caseConfiguration: 12 },
      minimumOrderQuantity: 1200,
      targetLaunchDate: "2025-09-01",
      regulatoryMarkets: [],
    },
    attachments: [],
    notes: "",
    status: "submitted",
    assignedManufacturer: "Kirin Brewery Co.",
    assignedManufacturerEmail: "export@kirin.example",
    ...overrides,
  }) as NewProductRequest;

describe("npr-manufacturer-scope", () => {
  it("matches Kirin liaison by account trading name", () => {
    const identity = resolveManufacturerAssignmentIdentity(
      "export@kirin.example",
      TEAM_ROSTER,
      [kirinAccount],
    );
    expect(nprMatchesManufacturerIdentity(sampleNpr(), identity)).toBe(true);
  });

  it("matches scheduling contact on same manufacturer domain", () => {
    const identity = resolveManufacturerAssignmentIdentity(
      "scheduling@kirin.example",
      TEAM_ROSTER,
      [kirinAccount],
    );
    expect(nprMatchesManufacturerIdentity(sampleNpr(), identity)).toBe(true);
  });

  it("excludes drafts and unrelated manufacturers", () => {
    const identity = resolveManufacturerAssignmentIdentity(
      "export@kirin.example",
      TEAM_ROSTER,
      [kirinAccount],
    );
    const rows = [
      sampleNpr({ status: "draft" }),
      sampleNpr({
        id: "NPR-OTHER",
        assignedManufacturer: "Other Mfg",
        assignedManufacturerEmail: "other@example.com",
      }),
    ];
    expect(filterNprsForManufacturerUser(rows, identity)).toHaveLength(0);
  });

  it("matches Kosapan portal login by partner id in email domain", () => {
    const identity = resolveManufacturerAssignmentIdentity(
      "lunnalin@kosapandistillery.com",
      [],
      [],
    );
    expect([...identity.labels].some((l) => /kosapan/i.test(l))).toBe(true);
    expect(
      nprMatchesManufacturerIdentity(
        sampleNpr({
          assignedManufacturer: "Kosapan Distillery",
          assignedManufacturerEmail: "kosaka@kosapan.jp",
        }),
        identity,
      ),
    ).toBe(true);
  });
});
