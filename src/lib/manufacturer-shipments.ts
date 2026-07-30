import type { Shipment } from "@/data/mockData";

export type ShipmentStepState = "done" | "cur" | "";

export type ManufacturerShipmentFilter = "all" | "in-transit" | "delivered";

export type ManufacturerShipmentRow = {
  id: string;
  destination: string;
  items: string;
  eta: string;
  etaLabel: string;
  statusTone: "blue" | "green";
  statusLabel: string;
  filterCategory: "in-transit" | "delivered";
  steps: ShipmentStepState[];
  carrier: string;
};

export const SHIPMENT_TRACKER_STAGES = ["Packed", "Dispatched", "In transit", "Received"] as const;

/** Legacy demo shipments removed — list comes only from real app shipments. */
export const MANUFACTURER_SHIPMENTS: ManufacturerShipmentRow[] = [];

function formatEta(date: string, delivered: boolean): string {
  try {
    const formatted = new Date(date).toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    return delivered ? `Delivered ${formatted}` : formatted;
  } catch {
    return date;
  }
}

function stepsFromShipmentStatus(status: Shipment["status"]): ShipmentStepState[] {
  if (status === "delivered") return ["done", "done", "done", "done"];
  if (status === "in-transit" || status === "delayed") return ["done", "done", "cur", ""];
  if (status === "preparing") return ["done", "cur", "", ""];
  return ["cur", "", "", ""];
}

function itemsLine(shipment: Shipment): string {
  if (shipment.lineItems?.length) {
    const first = shipment.lineItems[0];
    const cases = first.cases ?? Math.max(1, Math.round(first.quantity / 12));
    const name = first.productName ?? first.sku;
    return `${cases} cs ${name}`;
  }
  return shipment.notes?.trim() || shipment.linkedOrder;
}

function mapAppShipment(shipment: Shipment): ManufacturerShipmentRow {
  const delivered = shipment.status === "delivered";
  return {
    id: shipment.waybillNumber ?? shipment.id,
    destination: shipment.destinationWarehouseName ?? shipment.destination,
    items: itemsLine(shipment),
    eta: formatEta(delivered ? shipment.actualDelivery || shipment.eta : shipment.eta, delivered),
    etaLabel: delivered ? "Delivered" : "ETA",
    statusTone: delivered ? "green" : "blue",
    statusLabel: delivered ? "delivered" : "in-transit",
    filterCategory: delivered ? "delivered" : "in-transit",
    steps: stepsFromShipmentStatus(shipment.status),
    carrier: shipment.carrier,
  };
}

export function buildManufacturerShipments(
  shipments: Shipment[] = [],
  partnerHints: string[] = [],
): ManufacturerShipmentRow[] {
  // Prefer facility / manufacturer outbound rows; otherwise show outbound only.
  const fromFacility = shipments.filter((s) => {
    const origin = s.origin.toLowerCase();
    return (
      origin.includes("kirin") ||
      origin.includes("kuramoto") ||
      origin.includes("kosapan") ||
      origin.includes("echigo") ||
      origin.includes("facility") ||
      origin.includes("distillery") ||
      origin.includes("brewery") ||
      origin.includes("manufacturer")
    );
  });

  let source = fromFacility.length > 0 ? fromFacility : shipments.filter((s) => s.type !== "inbound");

  const hints = partnerHints.map((h) => h.trim().toLowerCase()).filter((h) => h.length >= 3);
  if (hints.length > 0) {
    source = source.filter((s) => {
      const blob = `${s.origin} ${s.destination} ${s.notes ?? ""} ${s.linkedOrder ?? ""}`.toLowerCase();
      return hints.some((hint) => blob.includes(hint) || hint.includes(blob.slice(0, 6)));
    });
  }

  return source.map(mapAppShipment);
}

export function filterManufacturerShipments(
  rows: ManufacturerShipmentRow[],
  filter: ManufacturerShipmentFilter,
): ManufacturerShipmentRow[] {
  if (filter === "all") return rows;
  return rows.filter((row) => row.filterCategory === filter);
}

export function defaultExpandedShipmentIds(rows: ManufacturerShipmentRow[]): Set<string> {
  return new Set(rows.filter((row) => row.filterCategory === "in-transit").slice(0, 2).map((row) => row.id));
}
