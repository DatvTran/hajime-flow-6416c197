import type { Account, PurchaseOrder } from "@/data/mockData";
import { nextPoId } from "@/lib/po-ids";

export const FALLBACK_MANUFACTURER_NAMES = ["Kirin Brewery Co."];

export type PoManufacturerOption = {
  key: string;
  label: string;
  email?: string;
  crmMemberId?: string | null;
  hasProfile?: boolean;
};

export const PO_STATUSES: PurchaseOrder["status"][] = [
  "draft",
  "approved",
  "in-production",
  "completed",
  "shipped",
  "delivered",
  "delayed",
];

export const PO_TYPES: {
  value: NonNullable<PurchaseOrder["poType"]>;
  label: string;
  description: string;
}[] = [
  {
    value: "sales",
    label: "Sales PO",
    description: "Distributor ordering from manufacturer — brand operator approves",
  },
  {
    value: "production",
    label: "Production PO",
    description: "Brand operator ordering directly from manufacturer",
  },
];

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export type NewPurchaseOrderFormState = {
  poType: NonNullable<PurchaseOrder["poType"]>;
  manufacturerKey: string;
  manufacturerDisplayLabel: string;
  issueDate: string;
  requiredDate: string;
  requestedShipDate: string;
  sku: string;
  quantity: string;
  packagingInstructions: string;
  labelVersion: string;
  marketDestination: string;
  status: PurchaseOrder["status"];
  notes: string;
  selectedDistributorId: string;
};

export function buildPurchaseOrderFromForm(
  form: NewPurchaseOrderFormState,
  existing: PurchaseOrder[],
  options?: { distributorAccountId?: string },
): PurchaseOrder {
  let manufacturerId: string | undefined;
  if (
    !form.manufacturerKey.startsWith("fallback:") &&
    !form.manufacturerKey.startsWith("prof:")
  ) {
    manufacturerId = form.manufacturerKey;
  }

  const qty = Math.max(1, Math.round(Number(form.quantity) || 0));

  return {
    id: nextPoId(existing),
    manufacturer: form.manufacturerDisplayLabel,
    issueDate: form.issueDate,
    requiredDate: form.requiredDate,
    requestedShipDate: form.requestedShipDate,
    sku: form.sku,
    quantity: qty,
    packagingInstructions: form.packagingInstructions.trim() || "—",
    labelVersion: form.labelVersion.trim() || "v1.0",
    marketDestination: form.marketDestination.trim() || "—",
    status: form.status,
    notes: form.notes.trim(),
    poType: form.poType,
    manufacturerId,
    distributorAccountId:
      form.poType === "sales"
        ? form.selectedDistributorId || options?.distributorAccountId || undefined
        : undefined,
  };
}

export function distributorAccountsForSalesPo(accounts: Account[]): Account[] {
  return accounts.filter(
    (a) => a.type === "distributor" || a.networkRole?.includes("manufacturer"),
  );
}

export function casesFromBottles(bottles: number, caseSize = 12): number {
  if (bottles <= 0 || caseSize <= 0) return 0;
  return Math.ceil(bottles / caseSize);
}
