import { platformDb, runWithRequestDb } from '../config/request-db.mjs';
import {
  resolveRequestDatabase,
  resolveDatabaseForInviteToken,
} from '../lib/distributor-organization.mjs';
import { isHqGlobalViewer } from '../lib/hq-global-view.mjs';

/**
 * After authenticateToken: bind isolated distributor DB to this request.
 * Patches req.user.tenantId to the org tenant for row-level queries in that DB.
 * Brand operator, founder admin, and operations stay on the platform connection and aggregate across DBs.
 */
export async function attachDistributorDatabase(req, res, next) {
  try {
    if (isHqGlobalViewer(req.user?.role)) {
      req.hqGlobalView = true;
      return runWithRequestDb(platformDb, () => next());
    }

    const { db, org } = await resolveRequestDatabase(req.user);

    if (org?.tenant_id) {
      req.user.tenantId = org.tenant_id;
      req.user.distributorOrgId = org.id;
      req.distributorOrg = org;
    }

    runWithRequestDb(db, () => next());
  } catch (err) {
    next(err);
  }
}

/** Public licensee routes: resolve DB from invite token (platform index). */
export async function attachDatabaseFromInviteToken(req, res, next) {
  try {
    const token =
      (typeof req.query?.token === 'string' && req.query.token) ||
      (req.body && typeof req.body.token === 'string' ? req.body.token : null);

    if (!token) {
      return runWithRequestDb(platformDb, () => next());
    }

    const { db, org } = await resolveDatabaseForInviteToken(token);
    if (org?.tenant_id) {
      req.licenseeTenantId = org.tenant_id;
    }
    runWithRequestDb(db, () => next());
  } catch (err) {
    next(err);
  }
}
