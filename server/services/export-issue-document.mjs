import { nextDocumentNumber } from "./document-numbers.mjs";
import { serializeExportOrder } from "../lib/export-orders.mjs";

const SERIES = {
  quotation: "quotation",
  po_acceptance: "po_acceptance",
  proforma: "proforma",
  deposit: "deposit_confirmation",
  production_auth: "production_authorization",
  shipment_release: "shipment_release",
  export_checklist: "shipment_release",
};

export async function issueDocument(trx, { tenantId, order, docType, actor }) {
  if (!(await trx.schema.hasTable("export_documents"))) return null;
  const series = SERIES[docType] || docType;
  const docNumber = await nextDocumentNumber(trx, tenantId, series);
  const snapshot = serializeExportOrder(order, {
    includeInternalEconomics: false,
    buyerFacing: docType !== "production_auth",
  });
  const latest = await trx("export_documents")
    .where({ tenant_id: tenantId, export_order_id: order.id, doc_type: docType })
    .orderBy("revision", "desc")
    .first();
  const revision = latest ? Number(latest.revision) + 1 : 1;
  const [doc] = await trx("export_documents")
    .insert({
      tenant_id: tenantId,
      export_order_id: order.id,
      doc_type: docType,
      doc_number: docNumber,
      revision,
      payload: JSON.stringify(snapshot),
      issued_at: new Date(),
      issued_by: actor.userId || null,
      superseded_by: null,
    })
    .returning("*");
  if (latest) {
    await trx("export_documents").where({ id: latest.id }).update({ superseded_by: doc.id });
  }
  return doc;
}
