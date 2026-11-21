import { writeExpoLead } from "./expo-leads.mjs";
import { FIRST_PRESS_MONTHLY_ML, deliveryWindowFor, firstPressMl, isBookableDeliveryMonth, litres } from "./first-press-capacity.mjs";
import {
  EXPO_SKUS,
  defaultChecklistState,
  nextSeq,
  padDoc,
  priceExportLines,
} from "./export-orders.mjs";

const SKU_FAMILY = {
  first_press_750: "first_press",
  first_press_200: "first_press",
  yuzu_mint_750: "yuzu_mint",
  yuzu_mint_200: "yuzu_mint",
};

const SKU_SIZE = {
  first_press_750: "750",
  yuzu_mint_750: "750",
  first_press_200: "200",
  yuzu_mint_200: "200",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function text(v, max) {
  return String(v ?? "").trim().slice(0, max);
}

/**
 * Pure check for the booth save. An offline iPad retries with the same submissionKey; the save returns the first lead
 * and order instead of creating new ones. Prices come from priceExportLines, never from the client totals.
 * depositStatus is always pending: saving a lead does not record a wire.
 */
export function prepareBoothFile(body = {}) {
  const company = text(body.company, 255);
  const contact = text(body.contact, 255);
  const email = text(body.email, 255).toLowerCase();
  const country = text(body.country, 120);
  const city = text(body.city, 120);
  const address = text(body.address, 1000);
  const errors = [];
  if (!company) errors.push("Enter the company.");
  if (!contact) errors.push("Enter the contact.");
  if (!EMAIL_RE.test(email)) errors.push("Enter a valid email.");
  if (!country) errors.push("Enter the country.");
  if (!city) errors.push("Enter the city.");
  if (!address) errors.push("Enter the address.");
  const requestedMonth = text(body.requestedMonth, 7);
  if (requestedMonth && !isBookableDeliveryMonth(requestedMonth)) errors.push("Pick a delivery month from next month onwards.");

  const raw = Array.isArray(body.lines) ? body.lines : [];
  const lines = [];
  for (const row of raw) {
    const sku = String(row?.sku || "");
    if (!SKU_FAMILY[sku]) {
      errors.push("Unknown product.");
      continue;
    }
    if (!EXPO_SKUS.includes(sku)) {
      if (Math.floor(Number(row?.cases) || 0) > 0) errors.push("Second Bloom isn't offered at the expo.");
      continue;
    }
    const cases = Math.floor(Number(row?.cases) || 0);
    if (cases <= 0) continue;
    const line = { sku, cases };
    if (row?.unitFobUsd != null && row.unitFobUsd !== "") {
      const unit = Number(row.unitFobUsd);
      if (!Number.isFinite(unit) || unit < 0) errors.push("Enter a unit price of 0 or more.");
      else line.unitFobUsd = unit;
    }
    lines.push(line);
  }
  if (!lines.length) errors.push("Add cases for at least one product.");
  const quoteMl = firstPressMl(lines);
  if (quoteMl > FIRST_PRESS_MONTHLY_ML) {
    errors.push(
      `This quote needs ${litres(quoteMl).toLocaleString("en-US")} L of First Press, more than one month of production (7,500 L). Split it into monthly orders.`,
    );
  }
  if (errors.length) return { ok: false, errors };

  const families = new Set(lines.map((l) => SKU_FAMILY[l.sku]));
  const sizes = new Set(lines.map((l) => SKU_SIZE[l.sku]));
  const expression = families.size > 1 ? "both" : [...families][0];
  const bottleFormat = sizes.size > 1 ? "both" : sizes.has("750") ? "750ml" : "200ml";
  const priced = priceExportLines(lines);
  const destination = text(body.destination, 120) || country;
  const key = text(body.submissionKey, 64);
  const submissionKey = /^[A-Za-z0-9_-]{8,64}$/.test(key) ? key : null;

  return {
    ok: true,
    buyer: {
      event_code: "HK26",
      full_name: contact,
      company_name: company,
      job_title: "Buyer",
      business_email: email,
      mobile: null,
      country_market: country,
      company_website: null,
      business_type: "importer_distributor",
      expression,
      interests: [],
      bottle_format: bottleFormat,
      volume: null,
      territory: null,
      timing: null,
      message: null,
      marketing_opt_in: false,
      form_version: "hq_booth_v1",
      ...(submissionKey ? { submission_key: submissionKey } : {}),
    },
    lines,
    priced,
    order: {
      buyerName: contact,
      buyerCompany: company,
      buyerEmail: email,
      buyerAddress: `${address}\n${city}`,
      territory: country,
      destinationCountry: destination,
      buyerPoNo: text(body.buyerPo, 80) || null,
      consignee: text(body.importer, 255) || null,
      depositStatus: "pending",
      requestedMonth: requestedMonth || null,
    },
  };
}

export async function createBoothFile(db, { tenantId, staffUserId, body }) {
  const prepared = prepareBoothFile(body);
  if (!prepared.ok) {
    const err = new Error(prepared.errors[0]);
    err.status = 422;
    err.payload = { errors: prepared.errors };
    throw err;
  }
  const { buyer, priced, order } = prepared;
  const staffId = Number(staffUserId);
  if (Number.isInteger(staffId) && staffId > 0) buyer.staff_user_id = staffId;

  return db.transaction(async (trx) => {
    const lead = await writeExpoLead(trx, tenantId, buyer);
    if (buyer.submission_key) {
      const existing = await trx("export_orders").where({ tenant_id: tenantId, expo_lead_id: lead.id }).first();
      if (existing) {
        return {
          lead,
          order: existing,
          priced: {
            subtotalUsd: Number(existing.subtotal_usd) || 0,
            depositDueUsd: Number(existing.deposit_due_usd) || 0,
            balanceDueUsd: Number(existing.balance_due_usd) || 0,
          },
          replayed: true,
        };
      }
    }
    await trx.raw("SELECT pg_advisory_xact_lock(hashtext(?))", [`export_orders:${tenantId}`]);
    const seq = await nextSeq(trx, tenantId);
    const now = new Date();
    const [row] = await trx("export_orders")
      .insert({
        tenant_id: tenantId,
        seq,
        display_id: padDoc("HX", seq),
        quote_no: padDoc("Q", seq),
        pi_no: padDoc("PI", seq),
        deposit_no: padDoc("DP", seq),
        pa_no: padDoc("PA", seq),
        release_no: padDoc("SR", seq),
        expo_lead_id: lead.id,
        origin: "hq",
        buyer_name: order.buyerName,
        buyer_company: order.buyerCompany,
        buyer_address: order.buyerAddress,
        buyer_email: order.buyerEmail,
        territory: order.territory,
        destination_country: order.destinationCountry,
        buyer_po_no: order.buyerPoNo,
        consignee: order.consignee,
        requested_month: order.requestedMonth,
        delivery_window: deliveryWindowFor(order.requestedMonth) || null,
        stage: "02_quotation",
        lines: JSON.stringify(priced.lines.map((l) => ({ sku: l.sku, cases: l.cases, unitFobUsd: l.unitFobUsd }))),
        subtotal_usd: priced.subtotalUsd,
        deposit_due_usd: priced.depositDueUsd,
        balance_due_usd: priced.balanceDueUsd,
        deposit_status: "pending",
        checklist: JSON.stringify(defaultChecklistState()),
        issued_docs: JSON.stringify({}),
        exclusivity: false,
        created_at: now,
        updated_at: now,
      })
      .returning("*");
    return { lead, order: row, priced };
  });
}
