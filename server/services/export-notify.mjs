import { SKUS } from "../lib/export-orders.mjs";

function clientBaseUrl() {
  const raw = process.env.CLIENT_URL || "http://localhost:8080";
  return raw.replace(/\/$/, "");
}

/** attachments: [{ filename, content: Buffer }] */
async function sendPlainEmail({ to, subject, text, attachments }) {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  const from = (process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev").trim();
  if (!apiKey) {
    console.log("[export-notify] RESEND_API_KEY not set — logging instead of sending");
    console.log(`  To: ${to}`);
    console.log(`  ${subject}`);
    console.log(text);
    for (const a of attachments || []) console.log(`  Attachment: ${a.filename} (${a.content.length} bytes)`);
    return { sent: false, logged: true };
  }
  const body = { from, to: [to], subject, text };
  if (attachments?.length) {
    body.attachments = attachments.map((a) => ({ filename: a.filename, content: a.content.toString("base64") }));
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error("[export-notify] Resend failed:", res.status, errText);
    return { sent: false, logged: false, error: errText };
  }
  return { sent: true, logged: false };
}

function usd(n) {
  return `US$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function caseFobUsd(l) {
  if (l.caseUsd != null && Number.isFinite(Number(l.caseUsd))) return Number(l.caseUsd);
  const bpc = Number(l.bottlesPerCase) || SKUS[l.sku]?.bottlesPerCase || 0;
  if (l.unitFobUsd != null && bpc > 0) return Number(l.unitFobUsd) * bpc;
  return 0;
}

/** Plain-text body for an issued buyer document. The figures travel in the email so a buyer without a portal login still has the quotation. */
export function exportDocIssuedText({ buyerName, docTitle, displayId, docUrl, commercial }) {
  const lines = Array.isArray(commercial?.lines) ? commercial.lines : [];
  const priced = lines
    .filter((l) => Number(l.cases) > 0)
    .map(
      (l) =>
        `${l.cases} cases · ${l.product || l.sku} · ${l.size || ""} · ${usd(caseFobUsd(l))} / case · ${usd(l.lineTotalUsd)}`,
    );
  const totals =
    commercial && commercial.subtotalUsd != null
      ? [
          `Subtotal ${usd(commercial.subtotalUsd)}`,
          `Deposit due (50%) ${usd(commercial.depositDueUsd)}`,
          `Balance ${usd(commercial.balanceDueUsd)}`,
        ]
      : [];
  const copy = docUrl
    ? ["Open and print (Save as PDF) from your distributor portal:", docUrl]
    : [
        "This email is the issued copy.",
        "Hajime can also hand you a printed PDF.",
        "The purchase order acceptance, for your countersignature, follows once your PO is on the file. The deposit is recorded after the pro forma invoice.",
      ];
  return [
    `Hi ${buyerName || "there"},`,
    "",
    `Hajime Ltd. (Hong Kong) has issued ${docTitle} for commercial file ${displayId}.`,
    "",
    ...priced,
    ...(priced.length && totals.length ? [""] : []),
    ...totals,
    "",
    ...copy,
    "",
    "Working terms: FOB Bangkok, Thailand (named port/terminal to be confirmed). 50% deposit on confirmation; 50% before shipment. Buyer pays wire fees so Hajime Limited receives the full invoiced amount.",
    "USD wires: Hajime Limited / DBS Bank (Hong Kong) Limited / SWIFT DHBKHKHH — account details are on the document.",
    "",
    "This is not a CRM conversion and does not imply exclusivity.",
  ]
    .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
    .join("\n");
}

export async function sendExportDocIssuedEmail({ to, buyerName, docTitle, displayId, docUrl, commercial }) {
  const subject = `Hajime Ltd. — ${docTitle} (${displayId})`;
  const text = exportDocIssuedText({ buyerName, docTitle, displayId, docUrl, commercial });
  return sendPlainEmail({ to, subject, text });
}

/** Alert Brand HQ when a distributor places an international order in the portal. */
export async function sendPortalExportOrderPlacedEmail({
  to,
  displayId,
  buyerCompany,
  buyerEmail,
  territory,
  subtotalUsd,
  hqUrl,
  lines,
}) {
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (!recipients.length) return { sent: false, skipped: true };
  const lineText = (Array.isArray(lines) ? lines : [])
    .filter((l) => Number(l.cases) > 0)
    .map((l) => `- ${l.cases} cs · ${l.product || l.sku} · ${l.size || ""}`)
    .join("\n");
  const subject = `Portal order ${displayId} — ${buyerCompany || "distributor"}`;
  const text = [
    "A distributor placed an international order in the portal.",
    "",
    `File: ${displayId}`,
    `Buyer: ${buyerCompany || "—"}`,
    `Email: ${buyerEmail || "—"}`,
    `Territory: ${territory || "—"}`,
    `Subtotal: ${usd(subtotalUsd)}`,
    "",
    lineText || "(no lines)",
    "",
    hqUrl ? `Open in HQ: ${hqUrl}` : "Open International orders in Brand HQ to issue the quotation.",
    "",
    "Hajime Ltd. · Hong Kong",
  ].join("\n");
  const results = [];
  for (const addr of recipients) {
    results.push(await sendPlainEmail({ to: addr, subject, text }));
  }
  return { sent: results.some((r) => r.sent), results };
}

function longDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Hong_Kong" });
}

export async function sendPoAcceptanceEmail({ to, buyerName, displayId, docNumber, signUrl, sellerName, expiresAt }) {
  const subject = `Hajime Ltd. — Purchase order acceptance ${docNumber} for your countersignature`;
  const text = [
    `Hi ${buyerName || "there"},`,
    "",
    `Hajime Ltd. has accepted your purchase order on commercial file ${displayId}. The purchase order acceptance ${docNumber} has been signed for Hajime Ltd.${sellerName ? ` by ${sellerName}` : ""} and is ready for your countersignature.`,
    "",
    "Review all three pages and countersign here (no login needed):",
    signUrl,
    "",
    `This link is personal to your company and works until ${longDate(expiresAt)}. Please don't forward it.`,
    "The order becomes binding once you countersign. Hajime Ltd. will then issue the pro forma invoice for the 50% deposit.",
    "",
    "Hajime Ltd. · Hong Kong · drinkhajime.jp",
  ].join("\n");
  return sendPlainEmail({ to, subject, text });
}

export async function sendPoAcceptanceSignedEmail({
  to,
  recipientName,
  displayId,
  docNumber,
  legalName,
  signerName,
  signerTitle,
  signedAt,
  viewUrl,
}) {
  const subject = `Countersigned — Purchase order acceptance ${docNumber} (${displayId})`;
  const text = [
    `Hi ${recipientName || "there"},`,
    "",
    `Purchase order acceptance ${docNumber} was countersigned for ${legalName} by ${signerName}, ${signerTitle}, on ${longDate(signedAt)}.`,
    "The order is now binding on both parties. Next step: Hajime Ltd. issues the pro forma invoice for the 50% deposit.",
    "",
    "View or save the signed copy:",
    viewUrl,
    "",
    "Hajime Ltd. · Hong Kong · drinkhajime.jp",
  ].join("\n");
  return sendPlainEmail({ to, subject, text });
}

export async function sendBuyerPoEmail({ to, buyerName, displayId, docNumber, signUrl, expiresAt }) {
  const subject = `Hajime Ltd. — Purchase order ${docNumber} ready for your signature`;
  const text = [
    `Hi ${buyerName || "there"},`,
    "",
    `Thank you for confirming the quotation on commercial file ${displayId}. We have prepared purchase order ${docNumber} from it, so you don't need to draft your own.`,
    "",
    "Review the order and sign it here (no login needed). You can add your own PO reference before signing:",
    signUrl,
    "",
    `This link is personal to your company and works until ${longDate(expiresAt)}. Please don't forward it.`,
    "Once you sign, Hajime Ltd. will issue the purchase order acceptance for countersignature, then the pro forma invoice for the 50% deposit.",
    "",
    "Hajime Ltd. · Hong Kong · drinkhajime.jp",
  ].join("\n");
  return sendPlainEmail({ to, subject, text });
}

export async function sendBuyerPoSignedEmail({
  to,
  recipientName,
  displayId,
  docNumber,
  buyerPoNo,
  legalName,
  signerName,
  signerTitle,
  signedAt,
  priceInitials,
  agreedTotalUsd,
  requestedDelivery,
  viewUrl,
  forSeller,
  pdf,
}) {
  const subject = `Signed — Purchase order ${buyerPoNo} (${displayId})`;
  const text = [
    `Hi ${recipientName || "there"},`,
    "",
    `Purchase order ${docNumber}${buyerPoNo !== docNumber ? ` (buyer reference ${buyerPoNo})` : ""} was signed for ${legalName} by ${signerName}, ${signerTitle}, on ${longDate(signedAt)}.`,
    ...(priceInitials
      ? [`Prices agreed and initialled "${priceInitials}"${agreedTotalUsd != null ? `: order total ${usd(agreedTotalUsd)}` : ""}.`]
      : []),
    ...(requestedDelivery ? [`Requested delivery: ${requestedDelivery}.`] : []),
    forSeller
      ? "The file has moved to Buyer PO. Next step: issue the purchase order acceptance."
      : "Next step: Hajime Ltd. issues the purchase order acceptance for your countersignature.",
    "",
    ...(pdf ? ["The signed purchase order is attached as a PDF. You can also view it online:"] : ["View or save the signed copy:"]),
    viewUrl,
    "",
    "Hajime Ltd. · Hong Kong · drinkhajime.jp",
  ].join("\n");
  return sendPlainEmail({ to, subject, text, attachments: pdf ? [pdf] : undefined });
}

export async function sendTradePackEmail({ to, recipientName, items, links }) {
  const name = recipientName || "there";
  const subject = "Hajime — trade materials";
  const lines = items.map((i) => `- ${i}`).join("\n");
  const linkLines = links.map((l) => `${l.label}: ${l.url}`).join("\n");
  const text = [
    `Hi ${name},`,
    "",
    "Hajime is sharing the following materials:",
    lines,
    "",
    linkLines,
    "",
    "FOB pricing is quoted per order. Press contacts marked “confirm before release” must not be published until HQ confirms.",
    "",
    `${clientBaseUrl()}/connect?event=HK26`,
  ].join("\n");
  return sendPlainEmail({ to, subject, text });
}

export { clientBaseUrl };
