import crypto from 'crypto';
import { db } from '../config/database.mjs';
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

  const existingUser = await db('users')
    .where({ email: normalizedEmail })
    .whereNull('deleted_at')
    .first();
  if (existingUser) {
    return { ok: false, reason: 'email_already_registered' };
  }

  await db('user_invites')
    .where({ tenant_id: tenantId, email: normalizedEmail, used: false })
    .update({ used: true });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db('user_invites').insert({
    tenant_id: tenantId,
    invited_by_user_id: invitedByUserId,
    email: normalizedEmail,
    intended_role: intendedRole,
    token,
    used: false,
    expires_at: expiresAt,
  });

  const inviteUrl = `${clientBaseUrl()}/accept-invite?token=${encodeURIComponent(token)}`;

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
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

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
