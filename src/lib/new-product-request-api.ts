import type { NewProductRequest } from "@/data/mockData";
import { mapRowToNewProductRequest } from "@/lib/data-service";

/** Client camelCase → Postgres / API snake_case for NPR mutations. */
export function mapNewProductRequestPatchToApi(
  patch: Partial<NewProductRequest>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (patch.title !== undefined) out.title = patch.title;
  if (patch.status !== undefined) out.status = patch.status;
  if (patch.notes !== undefined) out.notes = patch.notes;
  if (patch.requestedBy !== undefined) out.requested_by = patch.requestedBy;
  if (patch.assignedManufacturer !== undefined) {
    out.assigned_manufacturer = patch.assignedManufacturer;
  }
  if (patch.specs !== undefined) out.specs = patch.specs;
  if (patch.manufacturerProposal !== undefined) {
    out.manufacturer_proposal = patch.manufacturerProposal;
  }
  if (patch.brandDecision !== undefined) out.brand_decision = patch.brandDecision;
  if (patch.productionPoId !== undefined) out.production_po_id = patch.productionPoId;
  if (patch.resultingSku !== undefined) out.resulting_sku = patch.resultingSku;
  if (patch.submittedAt !== undefined) out.submitted_at = patch.submittedAt;
  if (patch.reviewStartedAt !== undefined) out.review_started_at = patch.reviewStartedAt;
  if (patch.proposalReceivedAt !== undefined) {
    out.proposal_received_at = patch.proposalReceivedAt;
  }
  if (patch.decidedAt !== undefined) out.decided_at = patch.decidedAt;
  if (patch.attachments !== undefined) out.attachments = patch.attachments;
  if (patch.sampleShipmentId !== undefined) out.sample_shipment_id = patch.sampleShipmentId;
  return out;
}

/** NPR list/detail rows use request_id as display id; API updates need uuid when present. */
export function newProductRequestApiId(request: Pick<NewProductRequest, "id" | "databaseId">): string {
  return request.databaseId?.trim() || request.id;
}

export function mapNewProductRequestApiResponse(row: Record<string, unknown>): NewProductRequest {
  return mapRowToNewProductRequest(row);
}
