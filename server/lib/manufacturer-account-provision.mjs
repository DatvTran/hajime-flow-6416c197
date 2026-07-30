import { authService } from '../services/auth.mjs';

const DEFAULT_DEMO_PASSWORD = 'admin123!';

/**
 * Ensure a manufacturer CRM contact + portal user exist for the HQ portal login email.
 * New users receive the demo password (admin123!) unless MANUFACTURER_DEMO_PASSWORD is set.
 */
export async function ensureManufacturerPortalAccess(
  db,
  tenantId,
  { portalLoginEmail, contactName, companyName },
) {
  const email = String(portalLoginEmail ?? '').trim().toLowerCase();
  if (!email) {
    return { ok: true, skipped: true, reason: 'no_portal_email' };
  }

  const displayName =
    String(contactName || companyName || 'Manufacturer').trim() || 'Manufacturer';

  const existingTm = await db('team_members').where({ tenant_id: tenantId, email }).first();
  let teamMemberId = existingTm?.id ?? null;

  if (existingTm) {
    await db('team_members')
      .where({ id: existingTm.id })
      .update({
        role: 'manufacturer',
        name: displayName,
        is_active: true,
        updated_at: new Date(),
      });
  } else {
    teamMemberId = `tm-mfg-${email.split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 24)}-${Date.now().toString(36)}`;
    await db('team_members').insert({
      id: teamMemberId,
      tenant_id: tenantId,
      name: displayName,
      email,
      role: 'manufacturer',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  const existingUser = await db('users')
    .where({ tenant_id: tenantId, email })
    .whereNull('deleted_at')
    .first();

  if (existingUser) {
    if (existingUser.role !== 'manufacturer') {
      return {
        ok: false,
        reason: 'email_used_by_other_role',
        role: existingUser.role,
        email,
      };
    }
    await db('users')
      .where({ id: existingUser.id })
      .update({
        display_name: displayName,
        is_active: true,
        email_verified: true,
        updated_at: new Date(),
      });
    return { ok: true, action: 'updated_user', email, teamMemberId };
  }

  const demoPassword = (process.env.MANUFACTURER_DEMO_PASSWORD || DEFAULT_DEMO_PASSWORD).trim();
  const passwordHash = await authService.hashPassword(demoPassword);
  await db('users').insert({
    tenant_id: tenantId,
    email,
    password_hash: passwordHash,
    role: 'manufacturer',
    display_name: displayName,
    is_active: true,
    email_verified: true,
  });

  return {
    ok: true,
    action: 'created_user',
    email,
    teamMemberId,
    usesDemoPassword: true,
  };
}
