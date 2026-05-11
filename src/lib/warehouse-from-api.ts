import type { Warehouse } from "@/types/app-data";

/** Map GET /warehouses row to client `Warehouse` (shared by Settings + CRM). */
export function warehouseFromApi(row: {
  id: string;
  name: string;
  is_active?: boolean;
  sort_order?: number;
  linked_account_id?: string | null;
  linked_team_member_id?: string | null;
}): Warehouse {
  const linkedRaw = row.linked_account_id;
  const linkedAccountId =
    linkedRaw != null && String(linkedRaw).trim() !== "" ? String(linkedRaw).trim() : undefined;
  const tmRaw = row.linked_team_member_id;
  const linkedTeamMemberId =
    tmRaw != null && String(tmRaw).trim() !== "" ? String(tmRaw).trim() : undefined;
  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active !== false,
    sortOrder: Number(row.sort_order ?? 0),
    ...(linkedAccountId ? { linkedAccountId } : {}),
    ...(linkedTeamMemberId ? { linkedTeamMemberId } : {}),
  };
}
