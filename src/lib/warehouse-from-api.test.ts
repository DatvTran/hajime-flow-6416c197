import { describe, expect, it } from "vitest";
import { warehouseFromApi } from "./warehouse-from-api";

describe("warehouseFromApi", () => {
  it("maps kind brand by default and distributor when set", () => {
    expect(
      warehouseFromApi({
        id: "wh-1",
        name: "Toronto",
        is_active: true,
        sort_order: 0,
      }).kind,
    ).toBe("brand");

    expect(
      warehouseFromApi({
        id: "wh-2",
        name: "Metro DC",
        kind: "distributor",
        is_active: true,
        sort_order: 1,
        linked_team_member_id: "tm-1",
      }),
    ).toEqual({
      id: "wh-2",
      name: "Metro DC",
      isActive: true,
      sortOrder: 1,
      kind: "distributor",
      linkedTeamMemberId: "tm-1",
    });
  });
});
