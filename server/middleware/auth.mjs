import { authService } from '../services/auth.mjs';
import { hasPermission, normalizeRole } from '../rbac/permissions.mjs';
import { db } from '../config/database.mjs';

/**
 * Extract token from Authorization header
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return null;
}

/**
 * Authentication middleware
 * Verifies JWT and attaches user to request
 */
export async function authenticateToken(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      code: 'TOKEN_MISSING',
    });
  }

  const decoded = authService.verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({
      error: 'Invalid or expired token',
      code: 'TOKEN_INVALID',
    });
  }

  // Verify user still exists and is active
  const user = await db('users')
    .where({
      id: decoded.userId,
      is_active: true,
    })
    .whereNull('deleted_at')
    .first();

  if (!user) {
    return res.status(403).json({
      error: 'User inactive or not found',
      code: 'USER_INACTIVE',
    });
  }

  // Check if account is locked
  const isLocked = await authService.isAccountLocked(user.id);
  if (isLocked) {
    return res.status(403).json({
      error: 'Account temporarily locked due to failed login attempts',
      code: 'ACCOUNT_LOCKED',
    });
  }

  // Attach user to request
  req.user = {
    userId: user.id,
    email: user.email,
    role: normalizeRole(user.role),
    tenantId: user.tenant_id,
    displayName: user.display_name,
  };

  next();
}

/**
 * Optional authentication middleware
 * Attaches user if token valid, but doesn't require it
 */
export async function optionalAuth(req, res, next) {
  const token = extractToken(req);

  if (token) {
    const decoded = authService.verifyAccessToken(token);

    if (decoded) {
      const user = await db('users')
        .where({
          id: decoded.userId,
          is_active: true,
        })
        .whereNull('deleted_at')
        .first();

      if (user) {
        req.user = {
          userId: user.id,
          email: user.email,
          role: normalizeRole(user.role),
          tenantId: user.tenant_id,
          displayName: user.display_name,
        };
      }
    }
  }

  next();
}

/**
 * RBAC permission check middleware factory
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    if (!hasPermission(req.user.role, permission)) {
      // Log denied access attempt
      authService.logAuthEvent({
        userId: req.user.userId,
        eventType: 'permission_denied',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          permission,
          path: req.path,
          method: req.method,
        },
      });

      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'PERMISSION_DENIED',
        required: permission,
      });
    }

    next();
  };
}

/**
 * Require any of the specified permissions
 */
export function requireAnyPermission(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const hasAny = permissions.some((p) => hasPermission(req.user.role, p));

    if (!hasAny) {
      authService.logAuthEvent({
        userId: req.user.userId,
        eventType: 'permission_denied',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          permissions,
          path: req.path,
          method: req.method,
        },
      });

      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'PERMISSION_DENIED',
        required: permissions,
      });
    }

    next();
  };
}

/**
 * Tenant isolation middleware
 * Ensures users can only access their tenant's data
 */
export function requireTenantAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
  }

  // Add tenant filter to query builder
  req.tenantId = req.user.tenantId;

  // If tenant ID is in params/body, verify it matches
  const paramTenantId = req.params.tenantId || req.body.tenantId;
  if (paramTenantId && paramTenantId !== req.user.tenantId) {
    return res.status(403).json({
      error: 'Cross-tenant access denied',
      code: 'TENANT_MISMATCH',
    });
  }

  next();
}
