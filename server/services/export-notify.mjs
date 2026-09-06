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
