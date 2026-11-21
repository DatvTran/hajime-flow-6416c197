import crypto from "node:crypto";

/** Must match PO_ACCEPTANCE_TERMS_VERSION in src/lib/po-acceptance-terms.ts. */
export const PO_ACCEPTANCE_TERMS_VERSION = "Rev. 24 Oct 2026";

export const PO_ACCEPTANCE_SELLER = {
  legalName: "Hajime Limited",
  registrationNo: "80698695",
  registeredAddress: "21/F, CMA Building, 64 Connaught Road, Central, Hong Kong",
};

/** Must match BUYER_PO_TERMS_VERSION in src/lib/po-acceptance-terms.ts. */
export const BUYER_PO_TERMS_VERSION = "BPO Rev. 3 Nov 2026";

/** Must match BUYER_PO_TERMS in src/lib/po-acceptance-terms.ts. */
export const BUYER_PO_TERMS = [
  "Buyer offers to purchase the goods listed above from Hajime Ltd. at the quoted prices, on the delivery rule and window shown.",
  "Amounts are in USD. Buyer pays a 50% deposit against Hajime Ltd.'s pro forma invoice, and the remaining 50% before the goods are released for shipment.",
  "This order becomes binding when Hajime Ltd. issues its purchase order acceptance and Buyer countersigns it. The acceptance and its conditions govern this order.",
  "Buyer confirms it holds, or will appoint, the licensed importer of record for the destination market.",
];

export const SIGN_LINK_TTL_DAYS = 30;
export const INCOTERM_RULES = ["FOB", "FCA"];

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

/** Total order value = goods subtotal + other agreed charges; 50/50 deposit and balance on the total. */
export function orderTotals(subtotalUsd, otherChargesUsd) {
  const subtotal = round2(Number(subtotalUsd) || 0);
  const other = round2(Math.max(0, Number(otherChargesUsd) || 0));
  const total = round2(subtotal + other);
  const deposit = round2(total * 0.5);
  return { subtotalUsd: subtotal, otherChargesUsd: other, totalOrderUsd: total, depositDueUsd: deposit, balanceDueUsd: round2(total - deposit) };
}

export function newSignToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashSignToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

export function signLinkExpiry(now = new Date()) {
  return new Date(now.getTime() + SIGN_LINK_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/** Key-sorted JSON so the hash survives jsonb key reordering. */
function stableStringify(v) {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v)
      .filter((k) => v[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(v[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v ?? null);
}

/** Fingerprint of exactly what the buyer is asked to sign. */
export function poaContentHash({ payload, termsVersion, seller }) {
  const body = stableStringify({ payload, termsVersion, seller });
  return crypto.createHash("sha256").update(body).digest("hex");
}

export function asPayload(v) {
  if (v && typeof v === "object") return v;
  try {
    return JSON.parse(String(v || "{}"));
  } catch {
    return {};
  }
}

/** open | signed | replaced | expired | draft */
export function poaStatus(doc, now = new Date()) {
  if (!doc) return "draft";
  if (doc.buyer_signed_at) return "signed";
  if (doc.superseded_by) return "replaced";
  if (!doc.sign_token_hash) return "draft";
  if (doc.sign_token_expires_at && new Date(doc.sign_token_expires_at) < now) return "expired";
  return "open";
}

export function serializePoaDoc(doc, { includeSnapshot = true, includeAudit = false } = {}) {
  if (!doc) return null;
  return {
    docNumber: doc.doc_number,
    revision: Number(doc.revision),
    issuedAt: doc.issued_at,
    status: poaStatus(doc),
    linkExpiresAt: doc.sign_token_expires_at || null,
    termsVersion: doc.terms_version || PO_ACCEPTANCE_TERMS_VERSION,
    contentHash: doc.content_hash || null,
    seller: {
      ...PO_ACCEPTANCE_SELLER,
      signedName: doc.seller_signed_name || null,
      signedTitle: doc.seller_signed_title || null,
      signedAt: doc.seller_signed_at || null,
      noticeEmail: doc.seller_notice_email || null,
    },
    buyerSignature: doc.buyer_signed_at
      ? {
          name: doc.buyer_signed_name,
          title: doc.buyer_signed_title,
          signedAt: doc.buyer_signed_at,
          details: asPayload(doc.buyer_details),
          ...(includeAudit ? { ip: doc.buyer_signed_ip, userAgent: doc.buyer_signed_user_agent } : {}),
        }
      : null,
    snapshot: includeSnapshot ? asPayload(doc.payload) : undefined,
  };
}

export async function latestPoaDoc(db, tenantId, orderId, docType = "po_acceptance") {
  if (!(await db.schema.hasTable("export_documents"))) return null;
  return db("export_documents")
    .where({ tenant_id: tenantId, export_order_id: orderId, doc_type: docType })
    .orderBy("revision", "desc")
    .first();
}

/** Checked before HQ can issue: page 1 must be complete enough to sign. */
export function poaIssueGaps(order, pricedLineCount) {
  const gaps = [];
  if (!pricedLineCount) gaps.push("at least one product line");
  if (!INCOTERM_RULES.includes(String(order.incoterm_rule || ""))) gaps.push("Incoterms rule (FOB or FCA)");
  if (!String(order.fob_named_point || "").trim()) gaps.push("named port or place");
  if (!String(order.delivery_window || "").trim()) gaps.push("delivery window / lead time");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(order.requested_month || ""))) gaps.push("requested delivery month");
  if (!String(order.buyer_notice_email || order.buyer_email || "").trim()) gaps.push("buyer email");
  return gaps;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateCountersign(body = {}) {
  const pick = (k, max) => String(body[k] ?? "").trim().slice(0, max);
  const v = {
    legalName: pick("legalName", 255),
    registrationNo: pick("registrationNo", 120),
    registeredAddress: pick("registeredAddress", 1000),
    noticeEmail: pick("noticeEmail", 255).toLowerCase(),
    signatoryName: pick("signatoryName", 255),
    signatoryTitle: pick("signatoryTitle", 255),
  };
  const errors = {};
  if (!v.legalName) errors.legalName = "Enter the buyer's legal name.";
  if (!v.registrationNo) errors.registrationNo = "Enter the registration number, or N/A.";
  if (!v.registeredAddress) errors.registeredAddress = "Enter the registered address.";
  if (!EMAIL_RE.test(v.noticeEmail)) errors.noticeEmail = "Enter a valid notice email.";
  if (!v.signatoryName) errors.signatoryName = "Enter your full name.";
  if (!v.signatoryTitle) errors.signatoryTitle = "Enter your title.";
  if (body.authority !== true) errors.authority = "Confirm you are authorised to sign.";
  return { ok: Object.keys(errors).length === 0, value: v, errors };
}

/** Countersign fields, the buyer's own optional PO reference, initials agreeing the prices, and the delivery month. */
export function validateBuyerPoSign(body = {}) {
  const check = validateCountersign(body);
  const buyerPoRef = String(body.buyerPoRef ?? "").trim().slice(0, 64);
  const priceInitials = String(body.priceInitials ?? "").trim().slice(0, 12);
  const requestedMonth = String(body.requestedMonth ?? "").trim();
  const errors = { ...check.errors };
  if (!priceInitials) errors.priceInitials = "Initial to agree the prices.";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth)) errors.requestedMonth = "Choose when you need the goods.";
  return { ok: Object.keys(errors).length === 0, value: { ...check.value, buyerPoRef, priceInitials, requestedMonth }, errors };
}
