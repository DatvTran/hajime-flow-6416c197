function clientBaseUrl() {
  return String(process.env.CLIENT_URL || 'http://localhost:8080').replace(/\/$/, '');
}

/**
 * Notify manufacturer contact that a product development brief was submitted.
 * Uses Resend when RESEND_API_KEY is set; otherwise logs the portal link.
 */
export async function sendProductBriefSubmittedEmail({
  to,
  manufacturerName,
  requestId,
  title,
  brandName,
}) {
  const recipient = String(to ?? '').trim().toLowerCase();
  if (!recipient) {
    console.log('[Product Brief] No manufacturer email — skipping notification');
    return { sent: false, skipped: true, reason: 'no_email' };
  }

  const portalUrl = `${clientBaseUrl()}/manufacturer/product-requests`;
  const org = brandName || 'Hajime HQ';
  const mfg = manufacturerName || 'your facility';
  const ref = requestId || 'new request';
  const product = title || 'Product brief';

  const subject = `${org} sent you a product development brief — ${product}`;
  const text = [
    `Hello${manufacturerName ? ` ${manufacturerName}` : ''},`,
    '',
    `${org} submitted a new product development brief (${ref}) assigned to ${mfg}.`,
    '',
    `Product: ${product}`,
    '',
    'Review feasibility, costing, and timeline in your Hajime manufacturer portal:',
    portalUrl,
    '',
    'This brief is for your facility only. If you did not expect it, contact your Hajime brand partner.',
  ].join('\n');

  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const from = (process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev').trim();

  if (!apiKey) {
    console.log('[Product Brief] RESEND_API_KEY not set — logging portal link instead of sending email');
    console.log(`  To: ${recipient}`);
    console.log(`  ${portalUrl}`);
    return { sent: false, logged: true };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend ${res.status}: ${errText}`);
  }

  return { sent: true };
}

/**
 * Remind assigned manufacturer to respond to a feasibility review.
 */
export async function sendProductBriefNudgeEmail({
  to,
  manufacturerName,
  requestId,
  title,
  brandName,
}) {
  const recipient = String(to ?? '').trim().toLowerCase();
  if (!recipient) {
    console.log('[Product Brief] Nudge skipped — no manufacturer email');
    return { sent: false, skipped: true, reason: 'no_email' };
  }

  const portalUrl = `${clientBaseUrl()}/manufacturer/product-requests`;
  const org = brandName || 'Hajime HQ';
  const mfg = manufacturerName || 'your facility';
  const ref = requestId || 'product request';
  const product = title || 'Product brief';

  const subject = `${org} is waiting on your feasibility review — ${product}`;
  const text = [
    `Hello${manufacturerName ? ` ${manufacturerName}` : ''},`,
    '',
    `${org} sent a reminder about product development brief ${ref} (${product}).`,
    '',
    'Please review feasibility, costing, and timeline in your Hajime manufacturer portal:',
    portalUrl,
    '',
    'If you have questions, reply to your Hajime brand partner.',
  ].join('\n');

  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const from = (process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev').trim();

  if (!apiKey) {
    console.log('[Product Brief] Nudge — RESEND_API_KEY not set; logging portal link');
    console.log(`  To: ${recipient}`);
    console.log(`  ${portalUrl}`);
    return { sent: false, logged: true };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend ${res.status}: ${errText}`);
  }

  return { sent: true };
}

/**
 * Notify the assigned manufacturer that HQ issued a production reorder (same SKU, qty + destination).
 */
export async function sendProductionRequestIssuedEmail({
  to,
  manufacturerName,
  poNumber,
  sku,
  quantity,
  destination,
  brandName,
}) {
  const recipient = String(to ?? '').trim().toLowerCase();
  if (!recipient) {
    console.log('[Production Request] No manufacturer email — skipping notification');
    return { sent: false, skipped: true, reason: 'no_email' };
  }

  const portalUrl = `${clientBaseUrl()}/manufacturer/purchase-orders`;
  const org = brandName || 'Hajime HQ';
  const mfg = manufacturerName || 'your facility';
  const ref = poNumber || 'production request';
  const product = sku || 'SKU';
  const qty = quantity != null ? String(quantity) : '—';
  const dest = destination || '—';

  const subject = `${org} issued a production request — ${product}`;
  const text = [
    `Hello${manufacturerName ? ` ${manufacturerName}` : ''},`,
    '',
    `${org} issued production request ${ref} to ${mfg}.`,
    '',
    `SKU: ${product}`,
    `Quantity: ${qty} bottles`,
    `Destination: ${dest}`,
    '',
    'Confirm the spec and schedule the batch in your Hajime manufacturer portal:',
    portalUrl,
    '',
    'This request is for your facility only. If you did not expect it, contact your Hajime brand partner.',
  ].join('\n');

  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const from = (process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev').trim();

  if (!apiKey) {
    console.log('[Production Request] RESEND_API_KEY not set — logging portal link instead of sending email');
    console.log(`  To: ${recipient}`);
    console.log(`  ${portalUrl}`);
    return { sent: false, logged: true };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend ${res.status}: ${errText}`);
  }

  return { sent: true };
}
