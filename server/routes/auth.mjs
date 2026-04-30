import express from 'express';
import { authService } from '../services/auth.mjs';
import { db } from '../config/database.mjs';
import { normalizeRole } from '../rbac/permissions.mjs';
import { authenticateToken, requirePermission } from '../middleware/auth.mjs';
import {
  registerSchema,
  adminCreateUserSchema,
  loginSchema,
  refreshSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
} from './auth.schemas.mjs';

const router = express.Router();

/**
 * GET /api/auth/invite-preview
 * Public: validate invite token and return safe fields for the accept-invite UI.
 */
router.get('/invite-preview', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'token is required' });
    }

    const invite = await db('user_invites')
      .where({ token, used: false })
      .whereRaw('expires_at > NOW()')
      .first();

    if (!invite) {
      return res.status(404).json({ error: 'Invalid or expired invite' });
    }

    const tenant = await db('tenants').where({ id: invite.tenant_id }).first();
    const member = await db('team_members')
      .where({ tenant_id: invite.tenant_id, email: invite.email })
      .where('is_active', true)
      .first();

    res.json({
      email: invite.email,
      displayName: member?.name || invite.email.split('@')[0],
      role: invite.intended_role,
      tenantName: tenant?.name ?? 'Your organization',
      expiresAt: invite.expires_at,
    });
  } catch (err) {
    console.error('invite-preview error:', err);
    res.status(500).json({ error: 'Failed to load invitation' });
  }
});

/**
 * POST /api/auth/register
 * Open self-registration — limited to partner roles only.
 * Brand Operator and Founder Admin can only be created via admin-create-user.
 * Accepts inviteToken for join flow; tenantId is not accepted in this endpoint.
 */
router.post('/register', async (req, res) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: result.error.errors,
      });
    }

    const { email, password, displayName, role, inviteToken } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    let user;

    try {
      await db.transaction(async (trx) => {
        let userTenantId = null;

        if (inviteToken) {
          const invite = await trx('user_invites')
            .where({ token: inviteToken, used: false })
            .whereRaw('expires_at > NOW()')
            .forUpdate()
            .first();

          if (!invite) {
            const err = new Error('INVITE_INVALID');
            err.code = 'INVITE_INVALID';
            throw err;
          }

          if (invite.email.toLowerCase() !== normalizedEmail) {
            const err = new Error('INVITE_EMAIL_MISMATCH');
            err.code = 'INVITE_EMAIL_MISMATCH';
            throw err;
          }

          if (invite.intended_role && invite.intended_role !== normalizeRole(role)) {
            const err = new Error('INVITE_ROLE_MISMATCH');
            err.code = 'INVITE_ROLE_MISMATCH';
            throw err;
          }

          userTenantId = invite.tenant_id;
        } else {
          const [tenant] = await trx('tenants')
            .insert({ name: `${displayName}'s Organization` })
            .returning('id');
          userTenantId = tenant.id;
        }

        const existingUser = await trx('users')
          .where({ email: normalizedEmail })
          .whereNull('deleted_at')
          .first();

        if (existingUser) {
          const err = new Error('EMAIL_EXISTS');
          err.code = 'EMAIL_EXISTS';
          throw err;
        }

        const passwordHash = await authService.hashPassword(password);

        const [created] = await trx('users')
          .insert({
            tenant_id: userTenantId,
            email: normalizedEmail,
            password_hash: passwordHash,
            role: normalizeRole(role),
            display_name: displayName,
            email_verified: Boolean(inviteToken),
          })
          .returning(['id', 'email', 'role', 'tenant_id', 'display_name']);

        user = created;

        if (inviteToken) {
          await trx('user_invites').where({ token: inviteToken }).update({ used: true });
        }
      });
    } catch (err) {
      if (err.code === 'INVITE_INVALID') {
        return res.status(400).json({ error: 'Invalid or expired invite token' });
      }
      if (err.code === 'INVITE_EMAIL_MISMATCH') {
        return res.status(403).json({ error: 'Email does not match invitation' });
      }
      if (err.code === 'INVITE_ROLE_MISMATCH') {
        return res.status(403).json({ error: 'Invite is for a different role' });
      }
      if (err.code === 'EMAIL_EXISTS') {
        return res.status(409).json({ error: 'Email already registered' });
      }
      throw err;
    }

    const accessToken = authService.generateAccessToken(user);
    const refreshToken = await authService.generateRefreshToken(user.id, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    await authService.logAuthEvent({
      userId: user.id,
      eventType: 'registration',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.display_name,
        tenantId: user.tenant_id,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/admin-create-user
 * Create a user with any role — requires existing admin authentication.
 * This is the only way to create FOUNDER_ADMIN or BRAND_OPERATOR accounts.
 */
router.post(
  '/admin-create-user',
  authenticateToken,
  requirePermission('users:write'),
  async (req, res) => {
    try {
      const result = adminCreateUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: 'Invalid input',
          details: result.error.errors,
        });
      }

      const { email, password, displayName, role, tenantId } = result.data;

      // Default to the admin's own tenant
      const userTenantId = tenantId ?? req.user.tenantId;

      // Prevent creating users in a different tenant unless FOUNDER_ADMIN
      if (tenantId && tenantId !== req.user.tenantId && req.user.role !== 'founder_admin') {
        return res.status(403).json({ error: 'Cannot create users in another tenant' });
      }

      const existingUser = await db('users')
        .where({ email: email.toLowerCase() })
        .whereNull('deleted_at')
        .first();

      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const passwordHash = await authService.hashPassword(password);

      const [user] = await db('users')
        .insert({
          tenant_id: userTenantId,
          email: email.toLowerCase(),
          password_hash: passwordHash,
          role: normalizeRole(role),
          display_name: displayName,
          email_verified: true, // Admin-created users are pre-verified
        })
        .returning(['id', 'email', 'role', 'display_name', 'tenant_id']);

      await authService.logAuthEvent({
        userId: req.user.userId,
        eventType: 'admin_user_created',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { createdUserId: user.id, role: user.role },
      });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          displayName: user.display_name,
          tenantId: user.tenant_id,
        },
      });
    } catch (err) {
      console.error('Admin create user error:', err);
      res.status(500).json({ error: 'User creation failed' });
    }
  }
);

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
router.post('/login', async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: result.error.errors,
      });
    }

    const { email, password } = result.data;

    // Find user
    const user = await db('users')
      .where({
        email: email.toLowerCase(),
        is_active: true,
      })
      .whereNull('deleted_at')
      .first();

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Check if account is locked
    const isLocked = await authService.isAccountLocked(user.id);
    if (isLocked) {
      return res.status(403).json({
        error: 'Account temporarily locked due to failed login attempts',
        code: 'ACCOUNT_LOCKED',
        retryAfter: user.locked_until,
      });
    }

    // Verify password
    const validPassword = await authService.verifyPassword(
      user.password_hash,
      password
    );

    if (!validPassword) {
      await authService.recordFailedLogin(user.id);

      await authService.logAuthEvent({
        userId: user.id,
        eventType: 'login_failed',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { reason: 'invalid_password' },
      });

      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Clear failed logins and update last login
    await authService.clearFailedLogins(user.id);

    // Generate tokens
    const accessToken = authService.generateAccessToken(user);
    const refreshToken = await authService.generateRefreshToken(user.id, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Log successful login
    await authService.logAuthEvent({
      userId: user.id,
      eventType: 'login_success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.display_name,
        tenantId: user.tenant_id,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const result = refreshSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: result.error.errors,
      });
    }

    const { refreshToken } = result.data;

    // Verify refresh token
    const user = await authService.verifyRefreshToken(refreshToken);

    if (!user) {
      return res.status(401).json({
        error: 'Invalid or expired refresh token',
        code: 'REFRESH_INVALID',
      });
    }

    // Revoke old refresh token
    await authService.revokeRefreshToken(refreshToken);

    // Generate new tokens
    const accessToken = authService.generateAccessToken(user);
    const newRefreshToken = await authService.generateRefreshToken(user.id, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error('Token refresh error:', err);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

/**
 * POST /api/auth/logout
 * Revoke refresh token
 */
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await authService.revokeRefreshToken(refreshToken);
    }

    // If user is authenticated via access token, log the event
    if (req.user?.userId) {
      await authService.logAuthEvent({
        userId: req.user.userId,
        eventType: 'logout',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * POST /api/auth/password-reset-request
 * Request password reset email
 */
router.post('/password-reset-request', async (req, res) => {
  try {
    const result = passwordResetRequestSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: result.error.errors,
      });
    }

    const { email } = result.data;

    // Always return success to prevent email enumeration
    await authService.initiatePasswordReset(email);

    res.json({
      message: 'If an account exists with this email, a password reset link has been sent',
    });
  } catch (err) {
    console.error('Password reset request error:', err);
    // Still return success to prevent enumeration
    res.json({
      message: 'If an account exists with this email, a password reset link has been sent',
    });
  }
});

/**
 * POST /api/auth/password-reset
 * Complete password reset
 */
router.post('/password-reset', async (req, res) => {
  try {
    const result = passwordResetSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: result.error.errors,
      });
    }

    const { token, newPassword } = result.data;

    await authService.resetPassword(token, newPassword);

    res.json({
      message: 'Password has been reset successfully',
    });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(400).json({
      error: err.message || 'Password reset failed',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await db('users')
      .where({ id: req.user.userId })
      .whereNull('deleted_at')
      .first(['id', 'email', 'role', 'display_name', 'tenant_id', 'last_login_at']);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.display_name,
      tenantId: user.tenant_id,
      lastLoginAt: user.last_login_at,
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

export default router;
