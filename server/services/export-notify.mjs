function clientBaseUrl() {
  const raw = process.env.CLIENT_URL || "http://localhost:8080";
  return raw.replace(/\/$/, "");
}

async function sendPlainEmail({ to, subject, text }) {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  const from = (process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev").trim();
  if (!apiKey) {
    console.log("[export-notify] RESEND_API_KEY not set — logging instead of sending");
    console.log(`  To: ${to}`);
    console.log(`  ${subject}`);
    console.log(text);
    return { sent: false, logged: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error("[export-notify] Resend failed:", res.status, errText);
    return { sent: false, logged: false, error: errText };
  }
  return { sent: true, logged: false };
}

export async function sendExportDocIssuedEmail({ to, buyerName, docTitle, displayId, docUrl }) {
  const name = buyerName || "there";
  const subject = `Hajime Ltd. — ${docTitle} (${displayId})`;
  const text = [
    `Hi ${name},`,
    "",
    `Hajime Ltd. (Hong Kong) has issued ${docTitle} for commercial file ${displayId}.`,
    "",
    "Open and print (Save as PDF) from your distributor portal:",
    docUrl,
    "",
    "Working terms: FOB Bangkok, Thailand (named port/terminal to be confirmed). 50% deposit on confirmation; 50% before shipment. Buyer pays wire fees so Hajime Limited receives the full invoiced amount.",
    "USD wires: Hajime Limited / DBS Bank (Hong Kong) Limited / SWIFT DHBKHKHH — account details are on the document.",
    "",
    "This is not a CRM conversion and does not imply exclusivity.",
  ].join("\n");
  return sendPlainEmail({ to, subject, text });
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
    "Sell sheets show buyer-facing list FOB bands only. Press contacts marked “confirm before release” must not be published until HQ confirms.",
    "",
    `${clientBaseUrl()}/connect?event=HK26`,
  ].join("\n");
  return sendPlainEmail({ to, subject, text });
}

export { clientBaseUrl };
