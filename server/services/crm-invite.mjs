import crypto from 'crypto';
import { getDb } from '../config/request-db.mjs';
import { platformDb } from '../config/database.mjs';
import { Role } from '../rbac/permissions.mjs';

/** Portal roles allowed when adding a CRM contact (matches Settings team picker). */
export const CRM_TEAM_MEMBER_ROLES = ['sales_rep', 'retail', 'distributor', 'manufacturer'];

const TEAM_ROLE_TO_AUTH = {
  sales_rep: Role.SALES_REP,
  retail: Role.RETAIL,
  distributor: Role.DISTRIBUTOR,
  manufacturer: Role.MANUFACTURER,
};

export const CRM_TEAM_ROLE_LABELS = {
  sales_rep: 'Sales Rep',
  retail: 'Retail Store',
  distributor: 'Distributor',
  manufacturer: 'Manufacturer',
};

const INVITE_TTL_DAYS = 7;

/**
 * Map CRM team_members.role to users.role / user_invites.intended_role.
 */
export function teamMemberRoleToIntendedRole(teamRole) {
  return TEAM_ROLE_TO_AUTH[teamRole] ?? null;
}

function clientBaseUrl() {
  const raw = process.env.CLIENT_URL || 'http://localhost:8080';
  return raw.replace(/\/$/, '');
}

/**
 * Creates a pending invite row. Invalidates older unused invites for the same email + tenant.
 * @returns {{ ok: true, token: string, inviteUrl: string, expiresAt: Date } | { ok: false, reason: string }}
 */
export async function createCrmUserInvite({
  tenantId,
  email,
  teamMemberRole,
  invitedByUserId,
}) {
  const intendedRole = teamMemberRoleToIntendedRole(teamMemberRole);
  if (!intendedRole) {
    return { ok: false, reason: 'invalid_team_role' };
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const existingUser = await platformDb('users')
    .where({ email: normalizedEmail })
    .whereNull('deleted_at')
    .first();
  if (existingUser) {
    return { ok: false, reason: 'email_already_registered' };
  }

  const knex = getDb();

  await knex('user_invites')
    .where({ tenant_id: tenantId, email: normalizedEmail, used: false })
    .update({ used: true });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  await knex('user_invites').insert({
    tenant_id: tenantId,
    invited_by_user_id: invitedByUserId,
    email: normalizedEmail,
    intended_role: intendedRole,
    token,
    used: false,
    expires_at: expiresAt,
  });

  const path =
    teamMemberRole === 'retail' ? 'licensee-application' : 'accept-invite';
  const inviteUrl = `${clientBaseUrl()}/${path}?token=${encodeURIComponent(token)}`;

  return { ok: true, token, inviteUrl, expiresAt };
}

/**
 * Sends invitation email via Resend when RESEND_API_KEY is set; otherwise logs the link.
 */
export async function sendCrmInviteEmail({
  to,
  inviteUrl,
  recipientName,
  roleLabel,
  inviterDisplayName,
  tenantName,
}) {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const from = (process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev').trim();

  const org = tenantName || 'your organization';
  const subject = `${inviterDisplayName || 'Your team'} invited you to Hajime (${org})`;

  const text = [
    `Hi ${recipientName},`,
    '',
    `${inviterDisplayName || 'Someone'} invited you to join Hajime as ${roleLabel} for ${org}.`,
    '',
    'Open this link to confirm your email and create your password:',
    inviteUrl,
    '',
    `This link expires in ${INVITE_TTL_DAYS} days.`,
    '',
    'If you did not expect this invitation, you can ignore this email.',
  ].join('\n');

  if (!apiKey) {
    console.log('[CRM Invite] RESEND_API_KEY not set — logging invite link instead of sending email');
    console.log(`  To: ${to}`);
    console.log(`  ${inviteUrl}`);
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
      to: [to],
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

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function defaultStoreInviteBody(org, repName) {
  const wholesaler = org || 'your wholesaler';
  const rep = repName || 'Your rep';
  return `I've set you up with a Hajime account. Please complete your application using the link below to activate ordering with ${wholesaler}.

This takes about 5 minutes. ${rep} will review and approve within one business day.

Welcome aboard.`;
}

/**
 * Retail store setup invitation (distributor / sales rep account onboarding).
 * HTML layout matches the in-app email preview (New Licensee Application CTA).
 */
export async function sendStoreSetupInviteEmail({
  to,
  inviteUrl,
  recipientName,
  storeName,
  personalNote,
  inviterDisplayName,
  wholesalerName,
  /** When true, footnote only — link is still included if inviteUrl is set. */
  pendingWholesalerApproval = false,
}) {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const from = (process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev').trim();
  const org = wholesalerName || 'your wholesaler';
  const rep = inviterDisplayName || 'Your Hajime representative';
  const firstName = recipientName ? String(recipientName).trim().split(/\s+/)[0] : '';
  const subject = `Complete your ${org} account setup`;
  const link = inviteUrl ? String(inviteUrl).trim() : '';
  const store = storeName ? String(storeName).trim() : 'Your store';

  const bodyNote =
    personalNote && String(personalNote).trim() !== ''
      ? String(personalNote).trim()
      : defaultStoreInviteBody(org, rep);

  const pendingNote = pendingWholesalerApproval
    ? 'After you submit, your wholesaler will confirm your account for ordering (usually within one business day).'
    : '';

  const textParts = [
    firstName ? `Hi ${firstName},` : 'Hi,',
    '',
    bodyNote,
    '',
    'Your application',
    store,
    `${org} · New Licensee Application`,
  ];
  if (link) {
    textParts.push('', `Complete application: ${link}`, '', `This link expires in ${INVITE_TTL_DAYS} days.`);
  }
  if (pendingNote) {
    textParts.push('', pendingNote);
  }
  textParts.push(
    '',
    `Questions? Reply to this email or contact your Hajime representative, ${rep}.`,
  );
  const text = textParts.join('\n');

  const ctaBlock = link
    ? `<a href="${escapeHtml(link)}" style="display:inline-block;margin-top:12px;padding:10px 18px;background:#C98A0C;color:#17140F;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">Complete application →</a>`
    : `<p style="margin:12px 0 0;font-size:13px;color:#888;">Application link is not available — contact ${escapeHtml(rep)}.</p>`;

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F7F4EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE;padding:24px 16px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FDFCFA;border:1px solid #E3DDD2;border-radius:12px;">
<tr><td style="padding:24px 24px 16px;border-bottom:1px solid #E3DDD2;">
<span style="font-size:18px;font-weight:600;color:#1C1916;">Hajime</span>
</td></tr>
<tr><td style="padding:24px;">
<p style="margin:0 0 16px;font-size:14px;color:#666;">${firstName ? `Hi ${escapeHtml(firstName)},` : 'Hi,'}</p>
<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#1C1916;white-space:pre-wrap;">${escapeHtml(bodyNote)}</p>
<div style="border:1px solid #E3DDD2;border-radius:8px;background:#F7F4EE;padding:16px 18px;margin:0 0 16px;">
<p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#888;">Your application</p>
<p style="margin:0 0 4px;font-size:18px;font-weight:600;color:#1C1916;">${escapeHtml(store)}</p>
<p style="margin:0 0 4px;font-size:12px;color:#888;">${escapeHtml(org)} · New Licensee Application</p>
${ctaBlock}
${link ? `<p style="margin:16px 0 0;font-size:11px;color:#888;">This link expires in ${INVITE_TTL_DAYS} days.</p>` : ''}
${pendingNote ? `<p style="margin:12px 0 0;font-size:12px;line-height:1.5;color:#666;">${escapeHtml(pendingNote)}</p>` : ''}
</div>
<p style="margin:0;font-size:11px;line-height:1.5;color:#888;">Questions? Reply to this email or contact your Hajime representative, ${escapeHtml(rep)}.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  if (!apiKey) {
    console.log('[Store invite] RESEND_API_KEY not set — logging invite link instead of sending email');
    console.log(`  To: ${to}`);
    if (link) console.log(`  ${link}`);
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
      to: [to],
      subject,
      text,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend ${res.status}: ${errText}`);
  }

  return { sent: true };
}
