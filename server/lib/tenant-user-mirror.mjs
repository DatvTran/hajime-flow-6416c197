import { platformDb } from '../config/database.mjs';

/**
 * Isolated distributor DBs have their own `users` table. Platform logins (distributor,
 * sales rep) only exist on platformDb until mirrored — required for FKs on
 * team_members.created_by / managed_by_user_id and user_invites.invited_by_user_id.
 */
export async function ensurePlatformUserInTenantDb(tenantDb, tenantId, platformUserId) {
  const tid = String(tenantId ?? '').trim();
  const uid = Number(platformUserId);
  if (!tenantDb || !tid || !Number.isFinite(uid)) return false;

  const existing = await tenantDb('users')
    .where({ id: uid, tenant_id: tid })
    .whereNull('deleted_at')
    .first();
  if (existing) return true;

  const platformUser = await platformDb('users').where({ id: uid }).whereNull('deleted_at').first();
  if (!platformUser) return false;

  const tenantRow = await tenantDb('tenants').where({ id: tid }).first();
  if (!tenantRow) {
    const platformTenant = await platformDb('tenants').where({ id: tid }).first();
    if (platformTenant) {
      await tenantDb('tenants')
        .insert({
          id: platformTenant.id,
          name: platformTenant.name,
          subdomain: platformTenant.subdomain,
          settings: platformTenant.settings,
          created_at: platformTenant.created_at ?? new Date(),
          updated_at: new Date(),
        })
        .onConflict('id')
        .ignore();
    }
  }

  const row = {
    id: uid,
    tenant_id: tid,
    email: String(platformUser.email).trim().toLowerCase(),
    password_hash: platformUser.password_hash ?? null,
    auth_provider: platformUser.auth_provider ?? 'local',
    external_id: platformUser.external_id ?? null,
    role: platformUser.role,
    is_active: platformUser.is_active !== false,
    email_verified: platformUser.email_verified === true,
    display_name: platformUser.display_name ?? null,
    last_login_at: platformUser.last_login_at ?? null,
    failed_login_attempts: platformUser.failed_login_attempts ?? 0,
    locked_until: platformUser.locked_until ?? null,
    created_at: platformUser.created_at ?? new Date(),
    updated_at: new Date(),
  };

  const hasManagedCol = await tenantDb.schema.hasColumn('users', 'managed_by_distributor_user_id');
  if (hasManagedCol && platformUser.managed_by_distributor_user_id != null) {
    row.managed_by_distributor_user_id = platformUser.managed_by_distributor_user_id;
  }

  await tenantDb('users').insert(row).onConflict('id').merge({
    email: row.email,
    role: row.role,
    is_active: row.is_active,
    display_name: row.display_name,
    updated_at: row.updated_at,
  });

  return true;
}
