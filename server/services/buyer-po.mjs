import { httpError } from "../lib/http-error.mjs";
import {
  BUYER_PO_TERMS_VERSION,
  PO_ACCEPTANCE_SELLER,
  asPayload,
  hashSignToken,
  latestPoaDoc,
  newSignToken,
  poaStatus,
  signLinkExpiry,
  validateBuyerPoSign,
} from "../lib/po-acceptance.mjs";
import { clientBaseUrl, sendBuyerPoEmail, sendBuyerPoSignedEmail } from "./export-notify.mjs";
import { poaRecipient } from "./po-acceptance.mjs";
import { buyerPoPdfFilename, renderBuyerPoPdf } from "./buyer-po-pdf.mjs";
import {
  assertMonthHasRoom,
  capacityByMonth,
  ensureCapacityColumns,
  firstPressMl,
  followMonth,
  isBookableDeliveryMonth,
  monthLabel,
} from "../lib/first-press-capacity.mjs";

const DOC_TYPE = "buyer_po";

export function buyerPoSignUrl(token) {
  return `${clientBaseUrl()}/buyer-po/${encodeURIComponent(token)}`;
}

export function latestBuyerPoDoc(db, tenantId, orderId) {
  return latestPoaDoc(db, tenantId, orderId, DOC_TYPE);
}

export function serializeBuyerPoDoc(doc, { includeSnapshot = true, includeAudit = false } = {}) {
  if (!doc) return null;
  const details = asPayload(doc.buyer_details);
  return {
    docNumber: doc.doc_number,
    revision: Number(doc.revision),
    issuedAt: doc.issued_at,
    status: poaStatus(doc),
    linkExpiresAt: doc.sign_token_expires_at || null,
    termsVersion: doc.terms_version || BUYER_PO_TERMS_VERSION,
    contentHash: doc.content_hash || null,
    seller: PO_ACCEPTANCE_SELLER,
    buyerSignature: doc.buyer_signed_at
      ? {
          name: doc.buyer_signed_name,
          title: doc.buyer_signed_title,
          signedAt: doc.buyer_signed_at,
          details,
          ...(includeAudit ? { ip: doc.buyer_signed_ip, userAgent: doc.buyer_signed_user_agent } : {}),
        }
      : null,
    snapshot: includeSnapshot ? asPayload(doc.payload) : undefined,
  };
}

export async function emailBuyerPoLink(order, { token, docNumber, expiresAt }) {
  const to = poaRecipient(order);
  if (!to) return { sent: false, skipped: true };
  return sendBuyerPoEmail({
    to,
    buyerName: order.buyer_name,
    displayId: order.display_id,
    docNumber,
    signUrl: buyerPoSignUrl(token),
    expiresAt,
  });
}

/** New link for the current revision; any earlier link for it stops working. */
export async function rotateBuyerPoLink(db, { tenantId, order }) {
  const doc = await latestBuyerPoDoc(db, tenantId, order.id);
  const status = poaStatus(doc);
  if (!doc || status === "draft") throw httpError(409, "Send the purchase order first.");
  if (status === "signed") throw httpError(409, "Already signed. Nothing to resend.");
  const token = newSignToken();
  const expiresAt = signLinkExpiry();
  await db("export_documents")
    .where({ id: doc.id })
    .update({ sign_token_hash: hashSignToken(token), sign_token_expires_at: expiresAt, updated_at: new Date() });
  return { token, expiresAt, doc };
}

async function findByToken(db, token) {
  const t = String(token || "").trim();
  if (t.length < 20 || t.length > 100) return null;
  if (!(await db.schema.hasTable("export_documents"))) return null;
  return db("export_documents").where({ sign_token_hash: hashSignToken(t), doc_type: DOC_TYPE }).first();
}

async function latestRevisionInfo(db, doc) {
  if (!doc.superseded_by) return null;
  const latest = await latestBuyerPoDoc(db, doc.tenant_id, doc.export_order_id);
  return latest ? { docNumber: latest.doc_number, revision: Number(latest.revision) } : null;
}

/** Upcoming delivery months, each marked only as available or not for this order's First Press. */
async function deliveryMonthsFor(db, order) {
  const orderMl = firstPressMl(order.lines);
  const months = await capacityByMonth(db, order.tenant_id, { excludeOrderId: order.id });
  return months.map((m) => ({ month: m.deliveryMonth, available: orderMl <= m.leftMl }));
}

export async function loadBuyerPoForSigning(db, token) {
  await ensureCapacityColumns(db);
  const doc = await findByToken(db, token);
  if (!doc) return null;
  const order = await db("export_orders").where({ id: doc.export_order_id, tenant_id: doc.tenant_id }).first();
  if (!order) return null;
  const view = serializeBuyerPoDoc(doc);
  return {
    ...view,
    displayId: order.display_id,
    deliveryMonths: view.status === "open" ? await deliveryMonthsFor(db, order) : [],
    replacedBy: await latestRevisionInfo(db, doc),
    prefill: {
      legalName: order.buyer_legal_name || order.buyer_company || "",
      registrationNo: order.buyer_registration_no || "",
      registeredAddress: order.buyer_registered_address || order.buyer_address || "",
      noticeEmail: order.buyer_notice_email || order.buyer_email || "",
      signatoryName: order.buyer_name || "",
      buyerPoRef: order.buyer_po_no || "",
      requestedMonth: order.requested_month || "",
    },
  };
}

export async function signBuyerPo(db, token, body, { ip, userAgent }) {
  const check = validateBuyerPoSign(body);
  if (!check.ok) throw httpError(422, "Please complete the highlighted fields.", { fields: check.errors });
  const v = check.value;
  if (!isBookableDeliveryMonth(v.requestedMonth)) {
    throw httpError(422, "Please complete the highlighted fields.", {
      fields: { requestedMonth: "Choose a month from next month onwards." },
    });
  }
  await ensureCapacityColumns(db);

  const { doc, order, poNo } = await db.transaction(async (trx) => {
    const found = await findByToken(trx, token);
    if (!found) throw httpError(404, "This signing link is not valid.");
    const locked = await trx("export_documents").where({ id: found.id }).forUpdate().first();
    const status = poaStatus(locked);
    if (status === "signed") throw httpError(409, "Already signed.", { code: "ALREADY_SIGNED" });
    if (status === "replaced") throw httpError(409, "A newer version replaced this document.", { code: "REPLACED" });
    if (status === "expired") throw httpError(410, "This signing link has expired.", { code: "EXPIRED" });
    if (status !== "open") throw httpError(409, "This document is not open for signature.");

    const current = await trx("export_orders")
      .where({ id: locked.export_order_id, tenant_id: locked.tenant_id })
      .forUpdate()
      .first();
    if (!current || current.stage === "cancelled") throw httpError(409, "This order is no longer open.");
    const month = current.capacity_reserved_at ? current.requested_month : v.requestedMonth;
    if (!current.capacity_reserved_at) {
      const room = await assertMonthHasRoom(trx, locked.tenant_id, current, { requestedMonth: month });
      if (!room.ok) {
        throw httpError(409, `${monthLabel(month)} is fully booked. Please choose a later month.`, {
          code: "CAPACITY_FULL",
          fields: { requestedMonth: `${monthLabel(month)} is fully booked. Please choose a later month.` },
        });
      }
    }

    const now = new Date();
    const ref = v.buyerPoRef || locked.doc_number;
    const snapshot = asPayload(locked.payload);
    const details = {
      legalName: v.legalName,
      registrationNo: v.registrationNo,
      registeredAddress: v.registeredAddress,
      noticeEmail: v.noticeEmail,
      buyerPoRef: ref,
      priceInitials: v.priceInitials,
      priceAgreedTotalUsd: snapshot.totalOrderUsd ?? snapshot.subtotalUsd ?? null,
      requestedMonth: month,
    };
    await trx("export_documents")
      .where({ id: locked.id })
      .update({
        buyer_signed_name: v.signatoryName,
        buyer_signed_title: v.signatoryTitle,
        buyer_signed_at: now,
        buyer_signed_ip: String(ip || "").slice(0, 64) || null,
        buyer_signed_user_agent: String(userAgent || "").slice(0, 500) || null,
        buyer_details: JSON.stringify(details),
        updated_at: now,
      });
    const moves = current.stage === "02_quotation";
    const orderPatch = {
      buyer_legal_name: v.legalName,
      buyer_registration_no: v.registrationNo,
      buyer_registered_address: v.registeredAddress,
      buyer_notice_email: v.noticeEmail,
      buyer_po_no: ref,
      requested_month: month,
      updated_at: now,
    };
    const window = followMonth(current.delivery_window, current.requested_month, month);
    if (window) orderPatch.delivery_window = window;
    if (moves) {
      orderPatch.stage = "03_buyer_po";
      orderPatch.next_action = "Issue PO acceptance";
    }
    await trx("export_orders").where({ id: current.id }).update(orderPatch);
    if (await trx.schema.hasTable("export_order_events")) {
      await trx("export_order_events").insert({
        tenant_id: locked.tenant_id,
        export_order_id: current.id,
        event_type: "buyer_signed_po",
        from_state: current.stage,
        to_state: moves ? "03_buyer_po" : current.stage,
        action: "sign_buyer_po",
        detail: JSON.stringify({
          doc_number: locked.doc_number,
          revision: locked.revision,
          content_hash: locked.content_hash,
          buyer_po_no: ref,
          price_initials: v.priceInitials,
          requested_month: month,
          price_agreed_total_usd: details.priceAgreedTotalUsd,
          signer: `${v.signatoryName}, ${v.signatoryTitle}`,
          legal_name: v.legalName,
        }),
        actor_user_id: null,
        actor_role: "buyer",
        occurred_at: now,
      });
    }
    const signed = await trx("export_documents").where({ id: locked.id }).first();
    return { doc: signed, order: current, poNo: ref };
  });

  const common = {
    displayId: order.display_id,
    docNumber: doc.doc_number,
    buyerPoNo: poNo,
    legalName: v.legalName,
    signerName: v.signatoryName,
    signerTitle: v.signatoryTitle,
    signedAt: doc.buyer_signed_at,
    priceInitials: v.priceInitials,
    requestedDelivery: monthLabel(asPayload(doc.buyer_details).requestedMonth),
    agreedTotalUsd: asPayload(doc.buyer_details).priceAgreedTotalUsd,
    viewUrl: buyerPoSignUrl(token),
    pdf: await renderBuyerPoPdf(doc)
      .then((content) => ({ filename: buyerPoPdfFilename(doc), content }))
      .catch((err) => {
        console.error("[buyer-po] PDF render failed:", err);
        return null;
      }),
  };
  const sends = [sendBuyerPoSignedEmail({ ...common, to: v.noticeEmail, recipientName: v.signatoryName, forSeller: false })];
  if (doc.seller_notice_email && doc.seller_notice_email !== v.noticeEmail) {
    sends.push(sendBuyerPoSignedEmail({ ...common, to: doc.seller_notice_email, recipientName: "Hajime team", forSeller: true }));
  }
  await Promise.allSettled(sends);

  return { ...serializeBuyerPoDoc(doc), displayId: order.display_id, replacedBy: null, prefill: null };
}
