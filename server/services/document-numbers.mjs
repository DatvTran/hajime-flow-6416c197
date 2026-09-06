const PREFIX = {
  order: "HJX",
  quotation: "HJ-Q",
  po_acceptance: "HJ-POA",
  proforma: "HJ-PI",
  deposit_confirmation: "HJ-DEP",
  production_authorization: "HJ-PA",
  shipment_release: "HJ-SR",
};

export async function nextDocumentNumber(trx, tenantId, series, now = new Date()) {
  const year = now.getUTCFullYear();
  const prefix = PREFIX[series] || series;
  const [row] = await trx("document_sequences")
    .insert({ tenant_id: tenantId, series, year, last_value: 1 })
    .onConflict(["tenant_id", "series", "year"])
    .merge({ last_value: trx.raw("document_sequences.last_value + 1") })
    .returning("last_value");
  const n = Number(row?.last_value || 1);
  return `${prefix}-${year}-${String(n).padStart(4, "0")}`;
}
