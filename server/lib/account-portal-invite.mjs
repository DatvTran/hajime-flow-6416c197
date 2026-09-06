import { getDb } from '../config/request-db.mjs';
import { registerInviteTokenRoute } from './distributor-organization.mjs';
import {
  createCrmUserInvite,
  sendCrmInviteEmail,
  CRM_TEAM_ROLE_LABELS,
} from '../services/crm-invite.mjs';

const isDev = process.env.NODE_ENV === 'development';

/**
 * After creating/reactivating a CRM contact, optionally send portal invite email.
 */
export async function buildCrmContactInvitePayload(req, tenantId, member, { email, name, role }) {
  const invitedByUserId = req.user?.userId;
  if (!invitedByUserId) {
    return {
      data: member,
      invite: { status: 'skipped', reason: 'missing_inviter' },
    };
  }

  let inviteResult;
  try {
    inviteResult = await createCrmUserInvite({
      tenantId,
      email,
      teamMemberRole: role,
      invitedByUserId,
    });
  } catch (inviteErr) {
    console.error('[API v1] CRM invite creation failed:', inviteErr);
    return {
      data: member,
      invite: { status: 'skipped', reason: 'invite_creation_failed' },
    };
  }

  if (!inviteResult.ok) {
    return {
      data: member,
      invite: { status: 'skipped', reason: inviteResult.reason },
    };
  }

  if (inviteResult.token && req.distributorOrg?.id) {
    await registerInviteTokenRoute(inviteResult.token, req.distributorOrg.id);
  }

  try {
    const tenantRow = await getDb('tenants').where({ id: tenantId }).first();
    const sendResult = await sendCrmInviteEmail({
      to: email,
      inviteUrl: inviteResult.inviteUrl,
      recipientName: name,
      roleLabel: CRM_TEAM_ROLE_LABELS[role] || role,
      inviterDisplayName: req.user?.displayName,
      tenantName: req.distributorOrg?.name || tenantRow?.name,
    });

    const exposeInviteUrl = isDev || !sendResult.sent;
    return {
      data: member,
      invite: {
        status: 'sent',
        emailDispatched: sendResult.sent,
        ...(exposeInviteUrl && { inviteUrl: inviteResult.inviteUrl }),
      },
    };
  } catch (emailErr) {
    console.error('[API v1] CRM invite email failed:', emailErr);
    return {
      data: member,
      invite: {
        status: 'delivery_failed',
        inviteUrl: inviteResult.inviteUrl,
      },
    };
  }
}

/**
 * Upsert a CRM contact for a newly created account and send (or hold) a portal invite.
 */
export async function ensureAccountPortalContactAndInvite({
  req,
  tenantId,
  account,
  role,
  email,
  name,
  phone,
  pendingApproval = false,
  distributorUserId = null,
}) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return { member: null, invite: { status: 'skipped', reason: 'no_email' } };
  }

  const displayName =
    String(name || account?.trading_name || account?.name || normalizedEmail).trim() ||
    normalizedEmail;
  const accountId = account?.id != null ? String(account.id) : null;
  const roleToCreate = String(role).trim();
  const db = getDb();

  const existing = await db('team_members')
    .where({ tenant_id: tenantId, email: normalizedEmail })
    .first();

  if (existing && existing.role && String(existing.role) !== roleToCreate) {
    return {
      member: existing,
      invite: { status: 'skipped', reason: 'email_used_by_other_role' },
    };
  }

  let createdBy = req.user?.userId ?? null;
  if (req.distributorOrg && createdBy) {
    createdBy = createdBy;
  }

  const patch = {
    name: displayName,
    role: roleToCreate,
    phone: phone || existing?.phone || null,
    is_active: pendingApproval ? false : true,
    pending_distributor_approval: pendingApproval,
    ...(accountId ? { linked_account_id: accountId } : {}),
    ...(roleToCreate === 'retail' && account?.trading_name
      ? { retail_trading_name: String(account.trading_name) }
      : {}),
    ...(distributorUserId ? { managed_by_user_id: distributorUserId } : {}),
    ...(pendingApproval && req.user?.userId
      ? { crm_requested_by_user_id: req.user.userId }
      : {}),
    updated_at: new Date(),
  };

  let member;
  if (existing) {
    [member] = await db('team_members')
      .where({ id: existing.id, tenant_id: tenantId })
      .update(patch)
      .returning('*');
  } else {
    const id = `tm-${Date.now()}`;
    [member] = await db('team_members')
      .insert({
        id,
        tenant_id: tenantId,
        email: normalizedEmail,
        created_by: createdBy,
        created_at: new Date(),
        ...patch,
      })
      .returning('*');
  }

  if (pendingApproval) {
    return {
      member,
      invite: {
        status: 'pending_distributor_approval',
        reason: 'Awaiting wholesaler / distributor approval before portal invite.',
      },
    };
  }

  const payload = await buildCrmContactInvitePayload(req, tenantId, member, {
    email: normalizedEmail,
    name: displayName,
    role: roleToCreate,
  });
  return { member: payload.data, invite: payload.invite };
}
