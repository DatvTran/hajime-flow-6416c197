import type { Shipment } from "@/data/mockData";

/** Numeric API `shipments.id` for PATCH/POST routes (distinct from display `shipment_number`). */
export function shipmentApiId(shipment: Pick<Shipment, "id" | "databaseId">): string | undefined {
  const db = shipment.databaseId?.trim();
  if (db && /^\d+$/.test(db)) return db;
  const raw = shipment.id?.trim();
  if (raw && /^\d+$/.test(raw)) return raw;
  return undefined;
}
