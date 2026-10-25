import { httpError } from "../lib/http-error.mjs";
import {
  hashSignToken,
  latestPoaDoc,
  newSignToken,
  poaStatus,
  serializePoaDoc,
  signLinkExpiry,
  validateCountersign,
} from "../lib/po-acceptance.mjs";
import { clientBaseUrl, sendPoAcceptanceEmail, sendPoAcceptanceSignedEmail } from "./export-notify.mjs";

export function poaSignUrl(token) {
  return `${clientBaseUrl()}/po-acceptance/${encodeURIComponent(token)}`;
}

export function poaRecipient(order) {
  return String(order.buyer_notice_email || order.buyer_email || "").trim().toLowerCase();
}

export async function emailPoaLink(order, { token, docNumber, sellerName, expiresAt }) {
  const to = poaRecipient(order);
  if (!to) return { sent: false, skipped: true };
  return sendPoAcceptanceEmail({
    to,
    buyerName: order.buyer_name,
    displayId: order.display_id,
    docNumber,
    signUrl: poaSignUrl(token),
    sellerName,
    expiresAt,
  });
}

/** New link for the current revision; any earlier link for it stops working. */
export async function rotatePoaLink(db, { tenantId, order }) {
  const doc = await latestPoaDoc(db, tenantId, order.id);
  const status = poaStatus(doc);
  if (!doc || status === "draft") throw httpError(409, "Issue the PO acceptance first.");
  if (status === "signed") throw httpError(409, "Already countersigned. Nothing to resend.");
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
  return db("export_documents")
    .where({ sign_token_hash: hashSignToken(t), doc_type: "po_acceptance" })
    .first();
}

async function latestRevisionInfo(db, doc) {
  if (!doc.superseded_by) return null;
  const latest = await latestPoaDoc(db, doc.tenant_id, doc.export_order_id);
  return latest ? { docNumber: latest.doc_number, revision: Number(latest.revision) } : null;
}

export async function loadPoaForSigning(db, token) {
  const doc = await findByToken(db, token);
  if (!doc) return null;
  const order = await db("export_orders").where({ id: doc.export_order_id, tenant_id: doc.tenant_id }).first();
  if (!order) return null;
  return {
    ...serializePoaDoc(doc),
    displayId: order.display_id,
    replacedBy: await latestRevisionInfo(db, doc),
    prefill: {
      legalName: order.buyer_legal_name || order.buyer_company || "",
      registrationNo: order.buyer_registration_no || "",
      registeredAddress: order.buyer_registered_address || order.buyer_address || "",
      noticeEmail: order.buyer_notice_email || order.buyer_email || "",
      signatoryName: order.buyer_name || "",
    },
  };
}

export async function countersignPoa(db, token, body, { ip, userAgent }) {
  const check = validateCountersign(body);
  if (!check.ok) throw httpError(422, "Please complete the highlighted fields.", { fields: check.errors });
  const v = check.value;

  const result = await db.transaction(async (trx) => {
    const found = await findByToken(trx, token);
    if (!found) throw httpError(404, "This signing link is not valid.");
    const doc = await trx("export_documents").where({ id: found.id }).forUpdate().first();
    const status = poaStatus(doc);
    if (status === "signed") throw httpError(409, "Already countersigned.", { code: "ALREADY_SIGNED" });
    if (status === "replaced") throw httpError(409, "A newer version replaced this document.", { code: "REPLACED" });
    if (status === "expired") throw httpError(410, "This signing link has expired.", { code: "EXPIRED" });
    if (status !== "open") throw httpError(409, "This document is not open for signature.");

    const order = await trx("export_orders")
      .where({ id: doc.export_order_id, tenant_id: doc.tenant_id })
      .forUpdate()
      .first();
    if (!order || ["cancelled"].includes(order.stage)) throw httpError(409, "This order is no longer open.");

    const now = new Date();
    const details = {
      legalName: v.legalName,
      registrationNo: v.registrationNo,
      registeredAddress: v.registeredAddress,
      noticeEmail: v.noticeEmail,
    };
    await trx("export_documents")
      .where({ id: doc.id })
      .update({
        buyer_signed_name: v.signatoryName,
        buyer_signed_title: v.signatoryTitle,
        buyer_signed_at: now,
        buyer_signed_ip: String(ip || "").slice(0, 64) || null,
        buyer_signed_user_agent: String(userAgent || "").slice(0, 500) || null,
        buyer_details: JSON.stringify(details),
        updated_at: now,
      });
    await trx("export_orders")
      .where({ id: order.id })
      .update({
        buyer_legal_name: v.legalName,
        buyer_registration_no: v.registrationNo,
        buyer_registered_address: v.registeredAddress,
        buyer_notice_email: v.noticeEmail,
        next_action: "Issue pro forma invoice",
        updated_at: now,
      });
    if (await trx.schema.hasTable("export_order_events")) {
      await trx("export_order_events").insert({
        tenant_id: doc.tenant_id,
        export_order_id: order.id,
        event_type: "buyer_countersigned_poa",
        from_state: order.stage,
        to_state: order.stage,
        action: "countersign",
        detail: JSON.stringify({
          doc_number: doc.doc_number,
          revision: doc.revision,
          content_hash: doc.content_hash,
          signer: `${v.signatoryName}, ${v.signatoryTitle}`,
          legal_name: v.legalName,
        }),
        actor_user_id: null,
        actor_role: "buyer",
        occurred_at: now,
      });
    }
    const signed = await trx("export_documents").where({ id: doc.id }).first();
    return { doc: signed, order };
  });

  const { doc, order } = result;
  const viewUrl = poaSignUrl(token);
  const common = {
    displayId: order.display_id,
    docNumber: doc.doc_number,
    legalName: v.legalName,
    signerName: v.signatoryName,
    signerTitle: v.signatoryTitle,
    signedAt: doc.buyer_signed_at,
    viewUrl,
  };
  const sends = [sendPoAcceptanceSignedEmail({ ...common, to: v.noticeEmail, recipientName: v.signatoryName })];
  if (doc.seller_notice_email && doc.seller_notice_email !== v.noticeEmail) {
    sends.push(
      sendPoAcceptanceSignedEmail({ ...common, to: doc.seller_notice_email, recipientName: doc.seller_signed_name }),
    );
  }
  await Promise.allSettled(sends);

  return { ...serializePoaDoc(doc), displayId: order.display_id, replacedBy: null, prefill: null };
}
