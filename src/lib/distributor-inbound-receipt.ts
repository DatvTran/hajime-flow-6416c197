import type { Shipment } from "@/data/mockData";
import { getShipment, receiveInboundShipment } from "@/lib/api-v1-mutations";
import { mapRowToShipment } from "@/lib/data-service";
import { shipmentApiId } from "@/lib/shipment-api-id";

export type ReceiveInboundParams = {
  verifiedBy: string;
  totalCases: number;
};

/** Persist distributor inbound receipt to the API (status, notes, inventory, PO received qty). */
export async function persistDistributorInboundReceipt(
  shipment: Shipment,
  params: ReceiveInboundParams,
): Promise<Record<string, unknown>> {
  const apiId = shipmentApiId(shipment);
  if (!apiId) {
    throw new Error(
      "This shipment is not on the server yet — sync inbound shipments from HQ or the manufacturer first.",
    );
  }

  const verifier = params.verifiedBy.trim() || "Operations";
  const receiptNotes = `Verified by ${verifier} · Operations Lead · ${params.totalCases} cs verified`;

  const res = (await receiveInboundShipment(apiId, {
    verified_by: verifier,
    notes: receiptNotes,
  })) as { data?: Record<string, unknown> };

  if (!res?.data) {
    throw new Error("Receipt was not saved to the server");
  }
  return res.data;
}

/** Load a single shipment from `GET /api/v1/shipments/:id` (authoritative for receipts). */
export async function fetchShipmentFromApi(
  shipment: Pick<Shipment, "id" | "databaseId">,
): Promise<Shipment> {
  const apiId = shipmentApiId(shipment);
  if (!apiId) {
    throw new Error("This shipment is not available on the server.");
  }
  const res = (await getShipment(apiId)) as { data?: Record<string, unknown> };
  if (!res?.data) {
    throw new Error("Shipment not found on the server");
  }
  return mapRowToShipment(res.data);
}
